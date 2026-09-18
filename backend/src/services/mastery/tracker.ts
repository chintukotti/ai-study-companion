import { supabaseAdmin } from '../../lib/supabase.js';

export const updateMasteryFromQuiz = async (attemptId: string) => {
  try {
    // 1. Get attempt details
    const { data: attempt } = await supabaseAdmin
      .from('quiz_attempts')
      .select('user_id, quiz_id')
      .eq('id', attemptId)
      .single();

    if (!attempt) return;
    const userId = attempt.user_id;

    // 2. Get quiz to find project_id
    const { data: quiz } = await supabaseAdmin
      .from('quizzes')
      .select('project_id')
      .eq('id', attempt.quiz_id)
      .single();

    if (!quiz) return;
    const projectId = quiz.project_id;

    // 3. Get answers with questions
    const { data: answers } = await supabaseAdmin
      .from('quiz_answers')
      .select('is_correct, question_id')
      .eq('attempt_id', attemptId);

    if (!answers || answers.length === 0) return;

    // 4. Get question concepts
    const questionIds = answers.map((a: any) => a.question_id);
    const { data: questions } = await supabaseAdmin
      .from('quiz_questions')
      .select('id, concept')
      .in('id', questionIds);

    if (!questions) return;

    // 5. Group scores by concept
    const conceptScores: Record<string, { correct: number; total: number }> = {};

    for (const ans of answers) {
      const q = questions.find((qq: any) => qq.id === ans.question_id);
      const concept = q?.concept || 'General';

      if (!conceptScores[concept]) {
        conceptScores[concept] = { correct: 0, total: 0 };
      }
      conceptScores[concept].total += 1;
      if (ans.is_correct) conceptScores[concept].correct += 1;
    }

    // 6. Upsert concepts and mastery records
    for (const [conceptName, scores] of Object.entries(conceptScores)) {
      // Ensure concept exists
      const { data: concept } = await supabaseAdmin
        .from('concepts')
        .upsert(
          { project_id: projectId, name: conceptName },
          { onConflict: 'project_id,name' }
        )
        .select('id')
        .single();

      if (!concept) continue;

      // Get existing mastery
      const { data: existing } = await supabaseAdmin
        .from('concept_mastery')
        .select('id, mastery_level, total_attempts, correct_attempts')
        .eq('concept_id', concept.id)
        .eq('user_id', userId)
        .single();

      const newScore = (scores.correct / scores.total) * 100;

      if (existing) {
        // Exponential moving average (70% old, 30% new)
        const newMastery = Math.round(existing.mastery_level * 0.7 + newScore * 0.3);
        await supabaseAdmin
          .from('concept_mastery')
          .update({
            mastery_level: newMastery,
            total_attempts: existing.total_attempts + scores.total,
            correct_attempts: existing.correct_attempts + scores.correct,
            last_assessed_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        await supabaseAdmin
          .from('concept_mastery')
          .insert({
            concept_id: concept.id,
            user_id: userId,
            project_id: projectId,
            mastery_level: newScore,
            total_attempts: scores.total,
            correct_attempts: scores.correct,
            last_assessed_at: new Date().toISOString(),
          });
      }
    }
  } catch (error) {
    console.error('Error updating mastery from quiz:', error);
  }
};

export const getProjectMastery = async (projectId: string, userId: string) => {
  const { data, error } = await supabaseAdmin
    .from('concept_mastery')
    .select('id, mastery_level, total_attempts, correct_attempts, last_assessed_at, concept_id')
    .eq('project_id', projectId)
    .eq('user_id', userId);

  if (error) throw error;

  // Fetch concept names
  if (data && data.length > 0) {
    const conceptIds = data.map((d: any) => d.concept_id);
    const { data: concepts } = await supabaseAdmin
      .from('concepts')
      .select('id, name, description')
      .in('id', conceptIds);

    return data.map((mastery: any) => ({
      ...mastery,
      concept: concepts?.find((c: any) => c.id === mastery.concept_id) || null,
    }));
  }

  return data || [];
};

export const createGrowthSnapshot = async (projectId: string, userId: string) => {
  const masteryData = await getProjectMastery(projectId, userId);

  const conceptsMastered = (masteryData || []).filter((m: any) => m.mastery_level >= 70).length;
  const totalConcepts = (masteryData || []).length;
  const overallMastery = totalConcepts > 0
    ? Math.round((masteryData || []).reduce((sum: number, m: any) => sum + m.mastery_level, 0) / totalConcepts)
    : 0;

  // Get quiz stats
  const { count: quizCount } = await supabaseAdmin
    .from('quiz_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  const { data: avgData } = await supabaseAdmin
    .from('quiz_attempts')
    .select('score')
    .eq('user_id', userId)
    .eq('status', 'completed');

  const avgScore = avgData && avgData.length > 0
    ? Math.round(avgData.reduce((sum: number, a: any) => sum + (a.score || 0), 0) / avgData.length)
    : null;

  await supabaseAdmin
    .from('growth_snapshots')
    .insert({
      user_id: userId,
      project_id: projectId,
      overall_mastery: overallMastery,
      concepts_mastered: conceptsMastered,
      total_concepts: totalConcepts,
      quiz_count: quizCount || 0,
      avg_score: avgScore,
      snapshot_data: { mastery: masteryData },
    });
};
