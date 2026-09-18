import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { z } from 'zod';
import { validateBody } from '../middleware/validate.js';
import { supabaseAdmin } from '../lib/supabase.js';
import { ragQuery } from '../services/rag/pipeline.js';
import { buildContextSummary } from '../services/learning-context.js';
import { trackEvent } from '../services/analytics/events.js';
import crypto from 'crypto';

const router = Router();
router.use(requireAuth);

const chatSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  sessionId: z.string().uuid().optional().nullable(),
});

// POST /api/projects/:projectId/tutor/chat
router.post('/projects/:projectId/tutor/chat', validateBody(chatSchema), async (req, res, next) => {
  try {
    const { message, sessionId } = req.body;
    const { projectId } = req.params;
    const userId = req.user!.id;
    let currentSessionId = sessionId;

    // 1. Create session if new
    if (!currentSessionId) {
      const title = message.trim().substring(0, 45) + (message.length > 45 ? '...' : '');
      const { data: session, error: sessError } = await supabaseAdmin
        .from('chat_sessions')
        .insert({
          project_id: projectId,
          user_id: userId,
          title,
          message_count: 0,
        })
        .select()
        .single();

      if (sessError || !session) {
        console.error('Error creating chat session:', sessError);
        throw sessError || new Error('Failed to create chat session');
      }
      currentSessionId = session.id;
    }

    // 2. Save user message
    const { error: userMsgError } = await supabaseAdmin
      .from('chat_messages')
      .insert({
        session_id: currentSessionId,
        role: 'user',
        content: message.trim(),
      });

    if (userMsgError) {
      console.error('Error saving user message:', userMsgError);
    }

    // 3. Get recent chat history for context
    const { data: history } = await supabaseAdmin
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', currentSessionId)
      .order('created_at', { ascending: true })
      .limit(10);

    // 4. Build student learning context
    let learningContextStr = '';
    try {
      learningContextStr = await buildContextSummary(projectId, userId);
    } catch (e) {
      console.warn('Could not load learning context, proceeding:', e);
    }

    // 5. Query RAG pipeline (Gemini embedding + retrieval + Gemini 3.6 Flash generation)
    const response = await ragQuery({
      query: message.trim(),
      projectId,
      userId,
      chatHistory: (history || []).map((m: any) => ({ role: m.role, content: m.content })),
      learningContext: learningContextStr,
    });

    // 6. Save assistant message
    const { data: assistantMessage, error: assistantError } = await supabaseAdmin
      .from('chat_messages')
      .insert({
        session_id: currentSessionId,
        role: 'assistant',
        content: response.answer,
        citations: response.citations || [],
        is_unsupported: response.is_unsupported || false,
        metadata: {
          unsupported_reason: response.unsupported_reason || null,
          topics_discussed: response.topics_discussed || [],
        },
      })
      .select()
      .single();

    if (assistantError) {
      console.error('Error saving assistant message:', assistantError);
    }

    // 7. Update session timestamp
    await supabaseAdmin
      .from('chat_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', currentSessionId);

    // 8. Track analytics event
    trackEvent({
      userId,
      eventType: 'chat_message',
      projectId,
      eventData: { sessionId: currentSessionId, messageLength: message.length },
    }).catch(() => {});

    res.json({
      sessionId: currentSessionId,
      message: assistantMessage || {
        id: crypto.randomUUID(),
        session_id: currentSessionId,
        role: 'assistant',
        content: response.answer,
        citations: response.citations || [],
        is_unsupported: response.is_unsupported || false,
        created_at: new Date().toISOString(),
      },
      isUnsupported: response.is_unsupported || false,
      unsupportedReason: response.unsupported_reason || null,
      topicsDiscussed: response.topics_discussed || [],
    });
  } catch (err) {
    console.error('Error in tutor chat route:', err);
    next(err);
  }
});

// GET /api/projects/:projectId/tutor/sessions — List chat sessions in a project
router.get('/projects/:projectId/tutor/sessions', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.id;

    const { data, error } = await supabaseAdmin
      .from('chat_sessions')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    next(err);
  }
});

// GET /api/tutor/sessions/:id/messages — Get message history for a session
router.get('/tutor/sessions/:id/messages', async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('chat_messages')
      .select('*')
      .eq('session_id', id)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/tutor/sessions/:id — Rename a chat session
const updateSessionSchema = z.object({
  title: z.string().trim().min(1, 'Title cannot be empty').max(100, 'Title is too long'),
});

router.patch('/tutor/sessions/:id', validateBody(updateSessionSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    const userId = req.user!.id;

    const { data, error } = await supabaseAdmin
      .from('chat_sessions')
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating chat session title:', error);
      throw error;
    }

    res.json(data);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/tutor/sessions/:id — Delete a chat session
router.delete('/tutor/sessions/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Delete messages associated with this session first to ensure clean cascade
    const { error: msgDeleteError } = await supabaseAdmin
      .from('chat_messages')
      .delete()
      .eq('session_id', id);

    if (msgDeleteError) {
      console.warn('Warning deleting session messages:', msgDeleteError);
    }

    const { error } = await supabaseAdmin
      .from('chat_sessions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting chat session:', error);
      throw error;
    }

    res.json({ message: 'Session deleted successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
