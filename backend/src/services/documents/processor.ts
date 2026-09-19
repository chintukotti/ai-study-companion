import { supabaseAdmin } from '../../lib/supabase.js';
import axios from 'axios';
import FormData from 'form-data';
import { embedDocumentChunks } from '../ai/embeddings.js';
import { trackEvent } from '../analytics/events.js';

export const processDocument = async (documentId: string, userId?: string) => {
  const jobUpdate = async (status: string, progress: number, extra?: any) => {
    await supabaseAdmin
      .from('processing_jobs')
      .update({ status, progress, ...extra })
      .eq('document_id', documentId);
  };

  try {
    // 1. Check idempotency — skip if chunks already exist
    const { count: existingChunks } = await supabaseAdmin
      .from('document_chunks')
      .select('id', { count: 'exact', head: true })
      .eq('document_id', documentId);

    if (existingChunks && existingChunks > 0) {
      console.log(`Document ${documentId} already has ${existingChunks} chunks. Marking ready.`);
      await supabaseAdmin
        .from('documents')
        .update({ status: 'ready', error_message: null })
        .eq('id', documentId);
      await jobUpdate('completed', 100);
      return;
    }

    // 2. Get document details
    const { data: doc, error: docError } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !doc) throw new Error('Document not found');

    // 3. Update status to processing
    await supabaseAdmin
      .from('documents')
      .update({ status: 'processing', error_message: null })
      .eq('id', documentId);

    // Create or update processing job
    await supabaseAdmin.from('processing_jobs').upsert({
      document_id: documentId,
      status: 'processing',
      progress: 10,
      attempts: 1,
      started_at: new Date().toISOString(),
      idempotency_key: `process-${documentId}`,
    }, { onConflict: 'idempotency_key' });

    // 4. Download file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabaseAdmin
      .storage
      .from('documents')
      .download(doc.file_path);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message}`);
    }

    await jobUpdate('processing', 20);

    // 5. Send to Python service for text extraction + chunking with automatic cold-start retries
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://127.0.0.1:8000';
    const fileBuffer = Buffer.from(await fileData.arrayBuffer());

    let pyResponse: any = null;
    const maxHttpRetries = 4;

    for (let attempt = 1; attempt <= maxHttpRetries; attempt++) {
      try {
        const formData = new FormData();
        formData.append('file', fileBuffer, {
          filename: doc.title.endsWith('.pdf') ? doc.title : `${doc.title}.pdf`,
          contentType: 'application/pdf',
        });
        formData.append('chunk_size', '1000');
        formData.append('chunk_overlap', '150');

        console.log(`📡 Sending document ${documentId} to Python microservice (Attempt ${attempt}/${maxHttpRetries})...`);
        pyResponse = await axios.post(
          `${pythonServiceUrl}/api/v1/process`,
          formData,
          {
            headers: formData.getHeaders(),
            timeout: 120000, // 2 minutes for large PDFs
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
          }
        );
        break; // Successfully processed by Python service
      } catch (httpErr: any) {
        const status = httpErr.response?.status;
        const isColdStart = status === 502 || status === 503 || httpErr.code === 'ECONNREFUSED' || httpErr.code === 'ETIMEDOUT';
        if (isColdStart && attempt < maxHttpRetries) {
          console.log(`⏳ Python service is waking up from idle sleep (Status ${status || httpErr.code}). Waiting 15s before retry ${attempt + 1}...`);
          await new Promise(res => setTimeout(res, 15000));
        } else {
          throw httpErr;
        }
      }
    }

    const { total_pages, chunks } = pyResponse.data;

    if (!chunks || chunks.length === 0) {
      throw new Error('No text chunks extracted from document');
    }

    await jobUpdate('processing', 50, { total_pages, total_chunks: chunks.length });

    // 6. Update document page count
    await supabaseAdmin
      .from('documents')
      .update({ page_count: total_pages })
      .eq('id', documentId);

    // 7. Generate embeddings in batches
    const chunkTexts = chunks.map((c: any) => c.content);
    const embeddings = await embedDocumentChunks(chunkTexts, userId);

    await jobUpdate('processing', 80);

    // 8. Store chunks with embeddings
    const BATCH_INSERT_SIZE = 50;
    for (let i = 0; i < chunks.length; i += BATCH_INSERT_SIZE) {
      const batch = chunks.slice(i, i + BATCH_INSERT_SIZE);
      const chunkRecords = batch.map((chunk: any, batchIdx: number) => {
        const globalIdx = i + batchIdx;
        return {
          document_id: documentId,
          project_id: doc.project_id,
          space_id: doc.space_id,
          chunk_index: chunk.chunk_index ?? chunk.metadata?.chunk_index ?? globalIdx,
          page_number: chunk.page_number ?? chunk.metadata?.page_number ?? 1,
          content: chunk.content,
          char_count: chunk.content.length,
          extraction_method: chunk.extraction_method ?? chunk.metadata?.extraction_method ?? 'native',
          metadata: chunk.metadata || {},
          embedding: JSON.stringify(embeddings[globalIdx]),
        };
      });

      const { error: insertError } = await supabaseAdmin
        .from('document_chunks')
        .insert(chunkRecords);

      if (insertError) {
        console.error(`Chunk insert batch error:`, insertError);
        throw insertError;
      }
    }

    // 9. Update document and job to ready/completed
    await supabaseAdmin
      .from('documents')
      .update({ status: 'ready', error_message: null })
      .eq('id', documentId);

    await jobUpdate('completed', 100, {
      total_chunks: chunks.length,
      completed_at: new Date().toISOString(),
    });

    // 10. Track activity event
    if (userId) {
      await trackEvent({
        userId,
        eventType: 'document_processed',
        spaceId: doc.space_id,
        projectId: doc.project_id,
        eventData: {
          documentId,
          title: doc.title,
          totalPages: total_pages,
          totalChunks: chunks.length,
        },
      });
    }

    console.log(`✅ Document ${documentId} processed: ${total_pages} pages, ${chunks.length} chunks`);

  } catch (error: any) {
    console.error(`❌ Document processing failed for ${documentId}:`, error.message);

    await supabaseAdmin
      .from('documents')
      .update({ status: 'failed', error_message: error.message })
      .eq('id', documentId);

    await jobUpdate('failed', 0, { error_message: error.message });

    // Retry logic
    const { data: job } = await supabaseAdmin
      .from('processing_jobs')
      .select('attempts, max_attempts')
      .eq('document_id', documentId)
      .single();

    if (job && job.attempts < job.max_attempts) {
      console.log(`Scheduling retry ${job.attempts + 1}/${job.max_attempts} for ${documentId}`);
      await supabaseAdmin
        .from('processing_jobs')
        .update({ attempts: job.attempts + 1, status: 'queued' })
        .eq('document_id', documentId);

      await supabaseAdmin
        .from('documents')
        .update({ status: 'processing' })
        .eq('id', documentId);

      setTimeout(() => {
        documentQueue.enqueue(documentId, userId);
      }, Math.pow(2, job.attempts) * 4000); // 4s, 8s, 16s
    }
  }
};

/**
 * Sequential processing queue to process PDFs automatically one by one.
 * Prevents memory exhaustion on free-tier microservices and guarantees ordered execution.
 */
class DocumentProcessingQueue {
  private queue: Array<{ documentId: string; userId?: string }> = [];
  private isProcessing = false;

  public enqueue(documentId: string, userId?: string) {
    if (!this.queue.some(item => item.documentId === documentId)) {
      this.queue.push({ documentId, userId });
      console.log(`📥 Enqueued document ${documentId} for sequential processing. Queue length: ${this.queue.length}`);
    }
    this.processNext();
  }

  private async processNext() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const { documentId, userId } = this.queue.shift()!;

    try {
      console.log(`🚀 Processing queued document ${documentId} (remaining in queue: ${this.queue.length})...`);
      await processDocument(documentId, userId);
    } catch (err: any) {
      console.error(`Error in queue processing document ${documentId}:`, err.message);
    } finally {
      this.isProcessing = false;
      // Small pause between documents to let memory and CPU settle
      setTimeout(() => this.processNext(), 1500);
    }
  }
}

export const documentQueue = new DocumentProcessingQueue();

/**
 * Recovers any documents stuck in 'uploading' or 'processing' state upon server startup or heartbeat
 */
export const recoverPendingDocuments = async () => {
  try {
    const { data: pendingDocs } = await supabaseAdmin
      .from('documents')
      .select('id, created_by, status')
      .in('status', ['uploading', 'processing'])
      .order('created_at', { ascending: true });

    if (pendingDocs && pendingDocs.length > 0) {
      console.log(`🔄 Auto-recovery: Enqueuing ${pendingDocs.length} pending documents to process sequentially.`);
      for (const doc of pendingDocs) {
        documentQueue.enqueue(doc.id, doc.created_by);
      }
    }
  } catch (err: any) {
    console.warn('Document auto-recovery check error:', err.message);
  }
};

