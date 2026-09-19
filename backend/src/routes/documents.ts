import crypto from 'crypto';
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import multer from 'multer';
import { supabaseAdmin } from '../lib/supabase.js';
import { processDocument } from '../services/documents/processor.js';
import { trackEvent } from '../services/analytics/events.js';

const router = Router();
router.use(requireAuth);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB
});

router.post('/projects/:projectId/documents', upload.single('file'), async (req, res, next) => {
  try {
    const file = req.file;
    const { projectId } = req.params;

    if (!file) return res.status(400).json({ error: 'No file provided' });
    if (!file.originalname.toLowerCase().endsWith('.pdf')) {
      return res.status(400).json({ error: 'Only PDF files are supported' });
    }

    // Look up project to get space_id
    const { data: project, error: projError } = await supabaseAdmin
      .from('projects')
      .select('id, space_id')
      .eq('id', projectId)
      .single();

    if (projError || !project) return res.status(404).json({ error: 'Project not found' });

    const docId = crypto.randomUUID();
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `projects/${projectId}/${docId}/${cleanName}`;

    // Upload to storage first
    const { error: uploadError } = await supabaseAdmin.storage
      .from('documents')
      .upload(filePath, file.buffer, { contentType: file.mimetype, upsert: false });

    if (uploadError) throw uploadError;

    // Create document record
    const { data: doc, error: docError } = await supabaseAdmin
      .from('documents')
      .insert({
        id: docId,
        project_id: projectId,
        space_id: project.space_id,
        title: file.originalname,
        file_path: filePath,
        file_size: file.size,
        file_type: file.mimetype,
        status: 'uploading',
        created_by: req.user!.id,
      })
      .select()
      .single();

    if (docError) throw docError;

    // Create processing job
    await supabaseAdmin.from('processing_jobs').insert({
      document_id: docId,
      status: 'queued',
      idempotency_key: `process-${docId}`,
    });

    // Trigger async processing (fire and forget)
    processDocument(docId, req.user!.id).catch(err => {
      console.error(`Background processing failed for ${docId}:`, err.message);
    });

    trackEvent({
      userId: req.user!.id,
      eventType: 'document_upload',
      spaceId: project.space_id,
      projectId,
      eventData: { documentId: docId, title: file.originalname, fileSize: file.size }
    }).catch(() => {});

    res.status(202).json(doc);
  } catch (err) {
    next(err);
  }
});

router.get('/projects/:projectId/documents', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('project_id', req.params.projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    next(err);
  }
});

router.get('/documents/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/documents/:id/status', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('documents')
      .select('status, id, error_message')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.delete('/documents/:id', async (req, res, next) => {
  try {
    const { data: doc } = await supabaseAdmin
      .from('documents')
      .select('file_path, project_id')
      .eq('id', req.params.id)
      .single();

    if (doc?.file_path) {
      await supabaseAdmin.storage.from('documents').remove([doc.file_path]);
    }

    await supabaseAdmin.from('document_chunks').delete().eq('document_id', req.params.id);
    await supabaseAdmin.from('processing_jobs').delete().eq('document_id', req.params.id);

    const { error } = await supabaseAdmin
      .from('documents')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Document deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
