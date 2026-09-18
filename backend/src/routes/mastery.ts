import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getProjectMastery, createGrowthSnapshot } from '../services/mastery/tracker.js';
import { generateRecommendations } from '../services/ai/recommendations.js';
import { getLearningContext } from '../services/learning-context.js';
import { supabaseAdmin } from '../lib/supabase.js';

const router = Router();
router.use(requireAuth);

router.get('/projects/:projectId/mastery', async (req, res, next) => {
  try {
    const data = await getProjectMastery(req.params.projectId, req.user.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/projects/:projectId/growth', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    let { data, error } = await supabaseAdmin
      .from('growth_snapshots')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // If no snapshot exists yet, create one from current mastery state
    if (!data || data.length === 0) {
      await createGrowthSnapshot(projectId, userId);
      const { data: freshData } = await supabaseAdmin
        .from('growth_snapshots')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
      data = freshData || [];
    }

    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/projects/:projectId/recommendations', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    // Check existing pending recommendations first
    const { data: existingRecs } = await supabaseAdmin
      .from('recommendations')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('priority', { ascending: false });

    if (existingRecs && existingRecs.length > 0) {
      return res.json(existingRecs);
    }

    const masteryData = await getProjectMastery(projectId, userId);
    
    const { data: recentActivity } = await supabaseAdmin
      .from('activity_events')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    const learningContext = await getLearningContext(projectId, userId);

    const recommendations = await generateRecommendations({
      masteryData,
      recentActivity: recentActivity || [],
      learningContext: learningContext?.summary || '',
      userId
    });

    const recsToInsert = recommendations.map((r: any) => ({
      project_id: projectId,
      user_id: userId,
      type: r.type,
      title: r.title,
      description: r.description,
      priority: r.priority,
      metadata: r.metadata,
      status: 'pending'
    }));

    if (recsToInsert.length > 0) {
      const { data: savedRecs, error } = await supabaseAdmin
        .from('recommendations')
        .insert(recsToInsert)
        .select();

      if (error) throw error;
      return res.json(savedRecs);
    }

    res.json([]);
  } catch (err) {
    next(err);
  }
});

router.post('/recommendations/:id/complete', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('recommendations')
      .update({ status: 'completed' })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
