import { supabaseAdmin } from '../../lib/supabase.js';

export const getProjectAnalytics = async (projectId: string, userId: string) => {
  // Aggregate document count
  const { count: docCount } = await supabaseAdmin
    .from('documents')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', projectId);

  // Chat sessions count
  const { count: chatCount } = await supabaseAdmin
    .from('chat_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .eq('user_id', userId);

  // Quizzes for this project
  const { data: projectQuizzes } = await supabaseAdmin
    .from('quizzes')
    .select('id')
    .eq('project_id', projectId);

  const quizIds = (projectQuizzes || []).map(q => q.id);
  let attempts: any[] = [];
  if (quizIds.length > 0) {
    const { data: attData } = await supabaseAdmin
      .from('quiz_attempts')
      .select('score')
      .in('quiz_id', quizIds)
      .eq('user_id', userId)
      .eq('status', 'completed');
    attempts = attData || [];
  }

  const avgScore = attempts.length > 0
    ? Math.round(attempts.reduce((acc, curr) => acc + (Number(curr.score) || 0), 0) / attempts.length)
    : 0;

  // Calculate overall mastery
  const { data: masteryRows } = await supabaseAdmin
    .from('concept_mastery')
    .select('mastery_level')
    .eq('project_id', projectId)
    .eq('user_id', userId);

  const overallMastery = masteryRows && masteryRows.length > 0
    ? Math.round(masteryRows.reduce((sum, m) => sum + Number(m.mastery_level || 0), 0) / masteryRows.length)
    : 0;

  return {
    documentCount: docCount || 0,
    chatSessionCount: chatCount || 0,
    quizCount: attempts.length,
    quizAttempts: attempts.length,
    averageScore: avgScore,
    averageQuizScore: avgScore,
    overallMastery,
  };
};

export const getGlobalAnalytics = async (userId: string) => {
  // 1. Spaces user belongs to
  const { data: memberRows } = await supabaseAdmin
    .from('space_members')
    .select('space_id')
    .eq('user_id', userId);

  const spaceIds = (memberRows || []).map((m) => m.space_id);
  const totalSpaces = spaceIds.length;

  // 2. Projects in those spaces
  let totalProjects = 0;
  let projectList: any[] = [];
  let projectIds: string[] = [];
  if (spaceIds.length > 0) {
    const { data: projects } = await supabaseAdmin
      .from('projects')
      .select('id, name, description, space_id, updated_at')
      .in('space_id', spaceIds)
      .order('updated_at', { ascending: false });
    projectList = projects || [];
    projectIds = projectList.map((p) => p.id);
    totalProjects = projectIds.length;
  }

  // 3. Documents in those projects
  let totalDocuments = 0;
  let recentDocs: any[] = [];
  if (projectIds.length > 0) {
    const { data: docs, count: docsCount } = await supabaseAdmin
      .from('documents')
      .select('id, title, page_count, project_id, status, updated_at', { count: 'exact' })
      .in('project_id', projectIds)
      .order('updated_at', { ascending: false });
    totalDocuments = docsCount || 0;
    recentDocs = docs || [];
  }

  // 4. Quizzes taken by user & avg score
  const { data: attempts } = await supabaseAdmin
    .from('quiz_attempts')
    .select('score, quiz_id, created_at')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false });

  const totalQuizzes = (attempts || []).length;
  const avgScore = totalQuizzes > 0
    ? Math.round(attempts!.reduce((sum, a) => sum + (a.score || 0), 0) / totalQuizzes)
    : 0;

  // 5. Concept Mastery data across user's projects
  let conceptMasteryRows: any[] = [];
  if (projectIds.length > 0) {
    const { data: mastery } = await supabaseAdmin
      .from('concept_mastery')
      .select('id, concept_id, project_id, mastery_level, total_attempts, correct_attempts, last_assessed_at, concepts(id, name, description)')
      .eq('user_id', userId)
      .in('project_id', projectIds)
      .order('mastery_level', { ascending: true });
    conceptMasteryRows = mastery || [];
  }

  // Calculate overall mastery
  const overallMastery = conceptMasteryRows.length > 0
    ? Math.round(conceptMasteryRows.reduce((sum, m) => sum + Number(m.mastery_level || 0), 0) / conceptMasteryRows.length)
    : 0;

  // 6. Areas requiring attention (concepts with lowest mastery or < 70%)
  const areasRequiringAttention = conceptMasteryRows
    .filter((m) => {
      const lvl = m.total_attempts > 0
        ? Math.round((m.correct_attempts / m.total_attempts) * 100)
        : Number(m.mastery_level);
      return lvl < 70;
    })
    .slice(0, 4)
    .map((m) => {
      const proj = projectList.find(p => p.id === m.project_id);
      const lvl = m.total_attempts > 0
        ? Math.round((m.correct_attempts / m.total_attempts) * 100)
        : Number(m.mastery_level);
      return {
        id: m.id,
        conceptId: m.concept_id,
        conceptName: m.concepts?.name || 'Key Concept',
        masteryLevel: lvl,
        totalAttempts: m.total_attempts,
        correctAttempts: m.correct_attempts,
        projectId: m.project_id,
        projectName: proj?.name || 'Project',
        recommendation: lvl < 30
          ? 'Review fundamentals in your study materials and ask the AI Tutor for simpler explanations.'
          : 'Practice with a targeted quiz to reinforce this concept.'
      };
    });

  // 7. Recommended Topics to Learn — strictly shows concepts needing study / low score
  // Filters for concepts needing attention (< 75% score), sorted from lowest to highest score
  const weakConcepts = conceptMasteryRows
    .map((m) => {
      const lvl = m.total_attempts > 0
        ? Math.round((m.correct_attempts / m.total_attempts) * 100)
        : Number(m.mastery_level);
      return { ...m, calculatedMastery: lvl };
    })
    .sort((a, b) => a.calculatedMastery - b.calculatedMastery)
    .filter((m) => m.calculatedMastery < 75);

  // If student has weak concepts, recommend those. If all are > 75%, pick lowest 3 for reinforcement.
  const targetConcepts = weakConcepts.length > 0
    ? weakConcepts
    : conceptMasteryRows
        .map(m => ({ ...m, calculatedMastery: m.total_attempts > 0 ? Math.round((m.correct_attempts / m.total_attempts) * 100) : Number(m.mastery_level) }))
        .sort((a, b) => a.calculatedMastery - b.calculatedMastery)
        .slice(0, 3);

  const recommendedTopics = targetConcepts.map((m) => {
    const proj = projectList.find(p => p.id === m.project_id);
    const lvl = m.calculatedMastery;
    let status: 'attention' | 'review' | 'mastered' = 'review';
    let action = 'Review with Tutor';
    let actionTab = 'tutor';
    if (lvl < 50) {
      status = 'attention';
      action = 'Study Topic';
      actionTab = 'tutor';
    } else if (lvl < 75) {
      status = 'review';
      action = 'Take Practice Quiz';
      actionTab = 'quizzes';
    } else {
      status = 'mastered';
      action = 'Practice Advanced Quiz';
      actionTab = 'quizzes';
    }

    return {
      id: m.id,
      name: m.concepts?.name || 'Concept',
      masteryLevel: lvl,
      status,
      projectName: proj?.name || 'Project',
      projectId: m.project_id,
      action,
      actionTab,
    };
  });

  // 8. Continue Learning Hero Item (most recent project and document)
  const activeProject = projectList.length > 0 ? projectList[0] : null;
  const activeDoc = recentDocs.length > 0 ? recentDocs[0] : null;

  // Calculate project-specific overall mastery for the active course
  const activeProjMasteryRows = activeProject
    ? conceptMasteryRows.filter(m => m.project_id === activeProject.id)
    : [];
  const activeProjMastery = activeProjMasteryRows.length > 0
    ? Math.round(
        activeProjMasteryRows.reduce((sum, m) => {
          const lvl = m.total_attempts > 0
            ? Math.round((m.correct_attempts / m.total_attempts) * 100)
            : Number(m.mastery_level || 0);
          return sum + lvl;
        }, 0) / activeProjMasteryRows.length
      )
    : overallMastery;

  const continueLearning = activeProject ? {
    projectId: activeProject.id,
    projectName: activeProject.name,
    spaceId: activeProject.space_id,
    documentTitle: activeDoc?.title || 'Course Materials',
    totalPages: activeDoc?.page_count || 0,
    overallMastery: activeProjMastery,
    lastStudied: activeProject.updated_at,
  } : null;

  // 9. AI-Generated Quick Prompt Starters / Questions grounded in user's concepts & weak areas
  const aiSuggestedQuestions: Array<{
    id: string;
    question: string;
    topic: string;
    projectId: string;
    tag: string;
  }> = [];

  if (activeProject) {
    // Generate grounded questions from real concepts
    conceptMasteryRows.forEach((m, idx) => {
      const cName = m.concepts?.name || 'this topic';
      const lvl = Number(m.mastery_level || 0);

      if (lvl < 50 && aiSuggestedQuestions.length < 4) {
        aiSuggestedQuestions.push({
          id: `q-attention-${m.id || idx}`,
          question: `Can you explain ${cName} with simple real-world examples?`,
          topic: cName,
          projectId: m.project_id,
          tag: 'Concept Help',
        });
      } else if (lvl >= 75 && aiSuggestedQuestions.length < 4) {
        aiSuggestedQuestions.push({
          id: `q-advanced-${m.id || idx}`,
          question: `What are advanced interview or exam questions on ${cName}?`,
          topic: cName,
          projectId: m.project_id,
          tag: 'Deep Dive',
        });
      } else if (aiSuggestedQuestions.length < 4) {
        aiSuggestedQuestions.push({
          id: `q-review-${m.id || idx}`,
          question: `Summarize the most important points of ${cName}.`,
          topic: cName,
          projectId: m.project_id,
          tag: 'Quick Summary',
        });
      }
    });

    // Fallback grounded starters if concept rows are few
    if (aiSuggestedQuestions.length < 3) {
      aiSuggestedQuestions.push(
        {
          id: 'q-starter-1',
          question: `What are the core concepts covered in ${activeDoc?.title || 'my course notes'}?`,
          topic: activeProject.name,
          projectId: activeProject.id,
          tag: 'Overview',
        },
        {
          id: 'q-starter-2',
          question: `Give me a quick 3-question diagnostic quiz on ${activeProject.name}.`,
          topic: activeProject.name,
          projectId: activeProject.id,
          tag: 'Practice',
        },
        {
          id: 'q-starter-3',
          question: `Explain the difference between machine language and high-level language in simple terms.`,
          topic: 'Programming Fundamentals',
          projectId: activeProject.id,
          tag: 'Key Distinction',
        }
      );
    }
  }

  // 10. Recent REAL activity events
  const { data: recentEvents } = await supabaseAdmin
    .from('activity_events')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  return {
    totalSpaces,
    totalProjects,
    totalDocuments,
    totalQuizzes,
    avgScore,
    overallMastery,
    recentProjects: projectList.slice(0, 4),
    continueLearning,
    areasRequiringAttention,
    recommendedTopics,
    aiSuggestedQuestions: aiSuggestedQuestions.slice(0, 4),
    recentEvents: recentEvents || [],
  };
};

export const getAdminStats = async () => {
  const [{ count: usersCount }, { count: spacesCount }, { count: docsCount }, { count: queriesCount }, { count: quizzesCount }] = await Promise.all([
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('spaces').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('documents').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('chat_messages').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('quiz_attempts').select('*', { count: 'exact', head: true }),
  ]);
  
  return {
    totalUsers: usersCount || 0,
    totalSpaces: spacesCount || 0,
    totalDocuments: docsCount || 0,
    totalQueries: queriesCount || 0,
    totalQuizzes: quizzesCount || 0,
  };
};
