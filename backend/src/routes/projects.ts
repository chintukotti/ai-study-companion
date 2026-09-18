import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { z } from 'zod';
import { validateBody } from '../middleware/validate.js';
import { supabaseAdmin } from '../lib/supabase.js';
import { trackEvent } from '../services/analytics/events.js';

const router = Router();
router.use(requireAuth);

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional().nullable(),
});

// GET /api/spaces/:spaceId/projects — List projects in a space
router.get('/spaces/:spaceId/projects', async (req, res, next) => {
  try {
    const { spaceId } = req.params;
    const userId = req.user!.id;

    // Check membership
    const { data: member } = await supabaseAdmin
      .from('space_members')
      .select('id')
      .eq('space_id', spaceId)
      .eq('user_id', userId)
      .single();

    if (!member) {
      return res.status(403).json({ error: 'Forbidden', message: 'You are not a member of this space' });
    }

    const { data: projects, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('space_id', spaceId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get document count for each project
    const projectsWithCounts = await Promise.all(
      (projects || []).map(async (project) => {
        const { count: docCount } = await supabaseAdmin
          .from('documents')
          .select('id', { count: 'exact', head: true })
          .eq('project_id', project.id);

        return {
          ...project,
          documentCount: docCount || 0,
        };
      })
    );

    res.json(projectsWithCounts);
  } catch (err) {
    next(err);
  }
});

// POST /api/spaces/:spaceId/projects — Create project
router.post('/spaces/:spaceId/projects', validateBody(projectSchema), async (req, res, next) => {
  try {
    const { spaceId } = req.params;
    const { name, description } = req.body;
    const userId = req.user!.id;

    // Check membership
    const { data: member } = await supabaseAdmin
      .from('space_members')
      .select('id')
      .eq('space_id', spaceId)
      .eq('user_id', userId)
      .single();

    if (!member) {
      return res.status(403).json({ error: 'Forbidden', message: 'You must be a space member to create a project' });
    }

    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .insert({
        space_id: spaceId,
        name: name.trim(),
        description: description ? description.trim() : null,
        created_by: userId,
      })
      .select()
      .single();

    if (error) throw error;

    trackEvent({
      userId,
      eventType: 'project_created',
      spaceId,
      projectId: project.id,
      eventData: { projectName: project.name },
    }).catch(() => {});

    res.status(201).json({
      ...project,
      documentCount: 0,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/projects/:id — Get project details
router.get('/projects/:id', async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const userId = req.user!.id;

    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error || !project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check space membership
    const { data: member } = await supabaseAdmin
      .from('space_members')
      .select('id')
      .eq('space_id', project.space_id)
      .eq('user_id', userId)
      .single();

    if (!member) {
      return res.status(403).json({ error: 'Forbidden', message: 'You are not a member of this project space' });
    }

    const { count: docCount } = await supabaseAdmin
      .from('documents')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId);

    res.json({
      ...project,
      documentCount: docCount || 0,
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/projects/:id — Update project
router.put('/projects/:id', validateBody(projectSchema), async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const { data, error } = await supabaseAdmin
      .from('projects')
      .update({
        name: req.body.name.trim(),
        description: req.body.description ? req.body.description.trim() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/projects/:id — Delete project
router.delete('/projects/:id', async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const { error } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) throw error;
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
