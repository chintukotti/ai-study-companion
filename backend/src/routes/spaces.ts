import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { z } from 'zod';
import { validateBody } from '../middleware/validate.js';
import { supabaseAdmin } from '../lib/supabase.js';
import { trackEvent } from '../services/analytics/events.js';

const router = Router();
router.use(requireAuth);

const spaceSchema = z.object({
  name: z.string().min(1, 'Space name is required'),
  description: z.string().optional().nullable(),
});

// GET /api/spaces — List all spaces user belongs to
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user!.id;

    // Get space memberships for user
    const { data: memberships, error: memError } = await supabaseAdmin
      .from('space_members')
      .select('space_id, role')
      .eq('user_id', userId);

    if (memError) throw memError;

    if (!memberships || memberships.length === 0) {
      return res.json([]);
    }

    const spaceIds = memberships.map((m) => m.space_id);

    // Fetch space records
    const { data: spaces, error: spacesError } = await supabaseAdmin
      .from('spaces')
      .select('*')
      .in('id', spaceIds)
      .order('created_at', { ascending: false });

    if (spacesError) throw spacesError;

    // Fetch counts for each space
    const spacesWithCounts = await Promise.all(
      (spaces || []).map(async (space) => {
        const [{ count: memberCount }, { count: projectCount }] = await Promise.all([
          supabaseAdmin
            .from('space_members')
            .select('id', { count: 'exact', head: true })
            .eq('space_id', space.id),
          supabaseAdmin
            .from('projects')
            .select('id', { count: 'exact', head: true })
            .eq('space_id', space.id),
        ]);

        const userMem = memberships.find((m) => m.space_id === space.id);

        return {
          ...space,
          role: userMem?.role || 'member',
          memberCount: memberCount || 1,
          projectCount: projectCount || 0,
        };
      })
    );

    res.json(spacesWithCounts);
  } catch (err) {
    next(err);
  }
});

// POST /api/spaces — Create a new space
router.post('/', validateBody(spaceSchema), async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const userId = req.user!.id;

    // 1. Create space record with created_by (NOT owner_id!)
    const { data: space, error: spaceError } = await supabaseAdmin
      .from('spaces')
      .insert({
        name: name.trim(),
        description: description ? description.trim() : null,
        created_by: userId,
      })
      .select()
      .single();

    if (spaceError) {
      console.error('Error creating space in DB:', spaceError);
      throw spaceError;
    }

    // 2. Add creator as 'owner' in space_members
    const { error: memberError } = await supabaseAdmin
      .from('space_members')
      .insert({
        space_id: space.id,
        user_id: userId,
        role: 'owner',
      });

    if (memberError) {
      console.error('Error adding creator to space_members:', memberError);
      // Clean up space if membership insert failed
      await supabaseAdmin.from('spaces').delete().eq('id', space.id);
      throw memberError;
    }

    // 3. Track activity event
    trackEvent({
      userId,
      eventType: 'space_created',
      spaceId: space.id,
      eventData: { spaceName: space.name },
    }).catch(() => {});

    res.status(201).json({
      ...space,
      role: 'owner',
      memberCount: 1,
      projectCount: 0,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/spaces/:id — Get details of a space
router.get('/:id', async (req, res, next) => {
  try {
    const spaceId = req.params.id;
    const userId = req.user!.id;

    // Check membership
    const { data: membership, error: memErr } = await supabaseAdmin
      .from('space_members')
      .select('role')
      .eq('space_id', spaceId)
      .eq('user_id', userId)
      .single();

    if (memErr || !membership) {
      return res.status(403).json({ error: 'Forbidden', message: 'You are not a member of this space' });
    }

    const { data: space, error: spaceError } = await supabaseAdmin
      .from('spaces')
      .select('*')
      .eq('id', spaceId)
      .single();

    if (spaceError || !space) {
      return res.status(404).json({ error: 'Space not found' });
    }

    // Fetch members and projects
    const [{ data: members }, { data: projects }] = await Promise.all([
      supabaseAdmin
        .from('space_members')
        .select('id, role, created_at, user_id, profiles(id, email, full_name, avatar_url)')
        .eq('space_id', spaceId),
      supabaseAdmin
        .from('projects')
        .select('*')
        .eq('space_id', spaceId)
        .order('created_at', { ascending: false }),
    ]);

    res.json({
      ...space,
      role: membership.role,
      members: members || [],
      projects: projects || [],
      memberCount: (members || []).length,
      projectCount: (projects || []).length,
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/spaces/:id — Update space
router.put('/:id', validateBody(spaceSchema), async (req, res, next) => {
  try {
    const spaceId = req.params.id;
    const userId = req.user!.id;

    // Verify user is owner or admin
    const { data: membership } = await supabaseAdmin
      .from('space_members')
      .select('role')
      .eq('space_id', spaceId)
      .eq('user_id', userId)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return res.status(403).json({ error: 'Forbidden', message: 'Only space owners or admins can edit this space' });
    }

    const { data, error } = await supabaseAdmin
      .from('spaces')
      .update({
        name: req.body.name.trim(),
        description: req.body.description ? req.body.description.trim() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', spaceId)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/spaces/:id — Delete space
router.delete('/:id', async (req, res, next) => {
  try {
    const spaceId = req.params.id;
    const userId = req.user!.id;

    // Verify user is owner
    const { data: membership } = await supabaseAdmin
      .from('space_members')
      .select('role')
      .eq('space_id', spaceId)
      .eq('user_id', userId)
      .single();

    if (!membership || membership.role !== 'owner') {
      return res.status(403).json({ error: 'Forbidden', message: 'Only the space owner can delete this space' });
    }

    const { error } = await supabaseAdmin
      .from('spaces')
      .delete()
      .eq('id', spaceId);

    if (error) throw error;
    res.json({ message: 'Space deleted successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
