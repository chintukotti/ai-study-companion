import { supabaseAdmin } from '../lib/supabase.js';

export const getLearningContext = async (projectId: string, userId: string) => {
  const { data, error } = await supabaseAdmin
    .from('learning_context')
    .select('*')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  if (!data) {
    const { data: newData, error: insertError } = await supabaseAdmin
      .from('learning_context')
      .insert({
        project_id: projectId,
        user_id: userId,
        summary: '',
        weak_areas: [],
        strong_areas: [],
        preferences: {},
        recent_topics: [],
      })
      .select()
      .single();
    if (insertError) throw insertError;
    return newData;
  }

  return data;
};

export const updateLearningContext = async (projectId: string, userId: string, updates: any) => {
  const current = await getLearningContext(projectId, userId);

  const { data, error } = await supabaseAdmin
    .from('learning_context')
    .update({
      summary: updates.summary ?? current.summary,
      weak_areas: updates.weak_areas ?? current.weak_areas,
      strong_areas: updates.strong_areas ?? current.strong_areas,
      recent_topics: updates.recent_topics ?? current.recent_topics,
      preferences: updates.preferences ?? current.preferences,
      updated_at: new Date().toISOString(),
    })
    .eq('id', current.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const buildContextSummary = async (projectId: string, userId: string): Promise<string> => {
  const context = await getLearningContext(projectId, userId);
  const parts: string[] = [];

  if (context.summary) parts.push(`Summary: ${context.summary}`);
  if (context.weak_areas?.length) parts.push(`Weak areas: ${context.weak_areas.join(', ')}`);
  if (context.strong_areas?.length) parts.push(`Strong areas: ${context.strong_areas.join(', ')}`);
  if (context.recent_topics?.length) parts.push(`Recent topics: ${context.recent_topics.join(', ')}`);

  return parts.length > 0 ? parts.join('\n') : 'No prior learning context available.';
};
