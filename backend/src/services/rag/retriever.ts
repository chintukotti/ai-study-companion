import { supabaseAdmin } from '../../lib/supabase.js';

interface RetrieveParams {
  queryEmbedding: number[];
  projectId: string;
  documentId?: string;
  threshold?: number;
  limit?: number;
}

export interface RetrievedChunk {
  id: string;
  document_id: string;
  project_id: string;
  chunk_index: number;
  page_number: number;
  content: string;
  char_count: number;
  extraction_method: string;
  metadata: any;
  similarity: number;
}

export const retrieveRelevantChunks = async (params: RetrieveParams): Promise<RetrievedChunk[]> => {
  const { data, error } = await supabaseAdmin.rpc('match_document_chunks', {
    query_embedding: JSON.stringify(params.queryEmbedding),
    match_threshold: params.threshold || 0.55,
    match_count: params.limit || 8,
    filter_project_id: params.projectId,
    filter_document_id: params.documentId || null
  });

  if (error) throw error;
  return (data || []) as RetrievedChunk[];
};

export const buildContext = (chunks: RetrievedChunk[], docTitleMap?: Map<string, string>): string => {
  if (!chunks || chunks.length === 0) {
    return 'No relevant document context found.';
  }
  return chunks.map((chunk, i) => {
    const docName = docTitleMap?.get(chunk.document_id) || 'PDF Document';
    return `--- Chunk ${i + 1} [PDF Document: "${docName}", Document ID: ${chunk.document_id}, Page: ${chunk.page_number}, Similarity: ${(chunk.similarity * 100).toFixed(1)}%] ---\n${chunk.content}`;
  }).join('\n\n');
};
