import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getProjectAnalytics, getGlobalAnalytics } from '../services/analytics/aggregator.js';

const router = Router();
router.use(requireAuth);

router.get('/projects/:projectId/analytics', async (req, res, next) => {
  try {
    const data = await getProjectAnalytics(req.params.projectId, req.user.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/analytics/global', async (req, res, next) => {
  try {
    const data = await getGlobalAnalytics(req.user.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

import { supabaseAdmin } from '../lib/supabase.js';

function formatEventDescription(event: any): string {
  const type = event.event_type;
  const data = event.event_data || {};
  switch (type) {
    case 'quiz_completed':
      return `Completed quiz with score ${data.score !== undefined ? data.score + '%' : '100%'}`;
    case 'quiz_generated':
      return `Generated quiz with ${data.questionCount || 5} questions`;
    case 'document_upload':
    case 'document_processed':
      return `Uploaded document: ${data.fileName || data.title || 'Study PDF'}`;
    case 'chat_message':
      return data.query ? `Asked tutor: "${data.query.slice(0, 45)}..."` : 'Asked question in AI Tutor';
    case 'space_created':
      return `Created new study space: ${data.name || 'Workspace'}`;
    case 'project_created':
      return `Created project: ${data.name || 'Project'}`;
    default:
      return String(type || 'Study Activity').replace(/_/g, ' ');
  }
}

function mapEventType(type: string): string {
  if (type?.includes('upload') || type?.includes('document')) return 'upload';
  if (type?.includes('chat') || type?.includes('tutor')) return 'chat';
  if (type?.includes('quiz')) return 'quiz';
  return 'completion';
}

router.get('/analytics/activity', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const page = parseInt(req.query.page as string) || 1;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : (page - 1) * limit;
    const projectId = req.query.projectId as string;

    let query = supabaseAdmin
      .from('activity_events')
      .select('*', { count: 'exact' })
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, count, error } = await query;

    if (error) throw error;

    const formatted = (data || []).map((ev: any) => ({
      ...ev,
      type: mapEventType(ev.event_type),
      description: formatEventDescription(ev),
      timestamp: ev.created_at,
    }));

    // Return both an object with events and make it iterable for any array consumers
    res.json({
      events: formatted,
      total: count || 0,
      hasMore: offset + formatted.length < (count || 0),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
