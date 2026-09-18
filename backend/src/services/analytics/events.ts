import { supabaseAdmin } from '../../lib/supabase.js';

interface EventParams {
  userId: string;
  eventType: string; // 'login', 'document_upload', 'chat_message', etc.
  spaceId?: string;
  projectId?: string;
  eventData?: any;
}

export const trackEvent = async (params: EventParams) => {
  try {
    await supabaseAdmin
      .from('activity_events')
      .insert({
        user_id: params.userId,
        event_type: params.eventType,
        space_id: params.spaceId,
        project_id: params.projectId,
        event_data: params.eventData
      });
  } catch (error) {
    console.error('Failed to track event:', error);
  }
};
