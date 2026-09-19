import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { z } from 'zod';
import { validateBody } from '../middleware/validate.js';
import { generateQuiz } from '../services/ai/quiz.js';
import { evaluateAnswer } from '../services/ai/evaluation.js';
import { retrieveRelevantChunks, buildContext } from '../services/rag/retriever.js';
import { embedQuery } from '../services/ai/embeddings.js';
import { getProjectMastery, updateMasteryFromQuiz, createGrowthSnapshot } from '../services/mastery/tracker.js';
import { trackEvent } from '../services/analytics/events.js';
import { supabaseAdmin } from '../lib/supabase.js';

const router = Router();
router.use(requireAuth);

const generateSchema = z.object({
  topic: z.string().optional(),
  type: z.enum(['mcq', 'open_ended', 'mixed']),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  questionCount: z.number().min(1).max(20).default(5)
});

router.post('/projects/:projectId/quizzes/generate', validateBody(generateSchema), async (req, res, next) => {
  try {
    const { topic, type, difficulty, questionCount } = req.body;
    const { projectId } = req.params;

    // 1. Verify project has uploaded documents
    const { data: projectDocs, error: docError } = await supabaseAdmin
      .from('documents')
      .select('id, title, status')
      .eq('project_id', projectId);

    if (docError) throw docError;

    if (!projectDocs || projectDocs.length === 0) {
      return res.status(400).json({
        error: 'No PDF uploaded',
        message: 'No PDF uploaded. Quizzes can only be generated from uploaded study materials. Please upload a PDF first.'
      });
    }

    const readyDocs = projectDocs.filter(d => d.status === 'ready');
    if (readyDocs.length === 0) {
      return res.status(400).json({
        error: 'Documents still processing',
        message: 'Your uploaded documents are still processing. Please wait until they are ready before generating a quiz.'
      });
    }

    // 2. Fetch direct chunks from project documents
    const { data: directChunks, error: chunkErr } = await supabaseAdmin
      .from('document_chunks')
      .select('*')
      .eq('project_id', projectId)
      .limit(15);

    if (chunkErr) throw chunkErr;

    if (!directChunks || directChunks.length === 0) {
      return res.status(400).json({
        error: 'No document content available',
        message: 'No text chunks available from your uploaded documents to generate questions.'
      });
    }

    // 3. Retrieve relevant chunks if topic specified
    let chunks: any[] = [];
    if (topic && topic.trim()) {
      try {
        const queryEmbedding = await embedQuery(topic.trim(), req.user.id);
        chunks = await retrieveRelevantChunks({ queryEmbedding, projectId, threshold: 0.4, limit: 12 });
      } catch (embErr) {
        console.warn('Vector retrieval warning:', embErr);
      }
    }

    if (!chunks || chunks.length === 0) {
      chunks = directChunks;
    }

    const context = buildContext(chunks || []);
    if (!context || context.trim().length === 0) {
      return res.status(400).json({
        error: 'No context available',
        message: 'Unable to extract study context from your documents to generate questions.'
      });
    }
    const masteryData = await getProjectMastery(projectId, req.user.id);

    const questions = await generateQuiz({
      topic,
      type,
      difficulty,
      count: questionCount,
      context,
      masteryData,
      userId: req.user.id
    });

    const VALID_BLOOMS = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];

    // Save quiz using supabaseAdmin to ensure RLS does not block
    const { data: quiz, error: quizError } = await supabaseAdmin
      .from('quizzes')
      .insert({
        project_id: projectId,
        user_id: req.user!.id,
        title: topic ? `Quiz: ${topic}` : `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Quiz`,
        quiz_type: type,
        difficulty,
        topic: topic || null,
        question_count: questionCount,
      })
      .select()
      .single();

    if (quizError) throw quizError;

    // Save questions
    const qs = questions.map((q: any, idx: number) => {
      let qType = (q.type || type || 'mcq').toLowerCase();
      if (qType.includes('choice') || qType === 'mcq') qType = 'mcq';
      else if (qType.includes('open')) qType = 'open_ended';
      else qType = 'mcq';

      let blooms = 'Understand';
      if (q.blooms_level) {
        const found = VALID_BLOOMS.find(b => b.toLowerCase() === String(q.blooms_level).toLowerCase());
        if (found) blooms = found;
      }

      return {
        quiz_id: quiz.id,
        question_type: qType,
        question: q.question || 'Untitled Question',
        options: Array.isArray(q.options) ? q.options : [],
        correct_answer: String(q.correct_answer || ''),
        correct_option_index: typeof q.correct_option_index === 'number' ? q.correct_option_index : null,
        explanation: q.explanation || '',
        blooms_level: blooms,
        concept: q.concept || topic || 'General Knowledge',
        page_references: Array.isArray(q.page_references) ? q.page_references : [],
        sort_order: idx,
      };
    });

    const { data: savedQs, error: qError } = await supabaseAdmin
      .from('quiz_questions')
      .insert(qs)
      .select();

    if (qError) throw qError;

    trackEvent({
      userId: req.user.id,
      eventType: 'quiz_generated',
      projectId,
      eventData: { quizId: quiz.id, questionCount }
    });

    res.status(201).json({ ...quiz, questions: savedQs, quiz_questions: savedQs });
  } catch (err) {
    next(err);
  }
});

router.get('/projects/:projectId/quizzes', async (req, res, next) => {
  try {
    const { data: quizzes, error } = await supabaseAdmin
      .from('quizzes')
      .select('*')
      .eq('project_id', req.params.projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Fetch latest completed attempt for each quiz by this user
    const quizIds = (quizzes || []).map(q => q.id);
    const attemptsMap: Record<string, any> = {};
    if (quizIds.length > 0) {
      const { data: attempts } = await supabaseAdmin
        .from('quiz_attempts')
        .select('*')
        .in('quiz_id', quizIds)
        .eq('user_id', req.user.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });

      if (attempts) {
        for (const att of attempts) {
          if (!attemptsMap[att.quiz_id]) {
            attemptsMap[att.quiz_id] = att;
          }
        }
      }
    }

    const enriched = (quizzes || []).map(q => ({
      ...q,
      score: attemptsMap[q.id]?.score !== undefined ? Number(attemptsMap[q.id].score) : undefined,
      completed: !!attemptsMap[q.id],
      latest_attempt: attemptsMap[q.id] || null,
    }));

    res.json(enriched);
  } catch (err) {
    next(err);
  }
});

router.get('/quizzes/:id', async (req, res, next) => {
  try {
    const { data: quiz, error: quizError } = await supabaseAdmin
      .from('quizzes')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (quizError) throw quizError;

    const { data: questions, error: qError } = await supabaseAdmin
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', req.params.id)
      .order('sort_order', { ascending: true });

    if (qError) throw qError;

    res.json({
      ...quiz,
      questions: questions || [],
      quiz_questions: questions || []
    });
  } catch (err) {
    next(err);
  }
});

const submitSchema = z.object({
  answers: z.array(z.object({
    questionId: z.string(),
    answer: z.string(),
    selectedOptionIndex: z.number().optional()
  }))
});

router.post('/quizzes/:id/submit', validateBody(submitSchema), async (req, res, next) => {
  try {
    const { answers } = req.body;
    const quizId = req.params.id;

    // Fetch questions to evaluate
    const { data: quizData } = await supabaseAdmin
      .from('quizzes')
      .select('*, quiz_questions(*)')
      .eq('id', quizId)
      .single();

    if (!quizData) throw new Error('Quiz not found');

    const { data: attemptData } = await supabaseAdmin
      .from('quiz_attempts')
      .insert({
        quiz_id: quizId,
        user_id: req.user!.id,
        total_questions: answers.length,
        correct_count: 0,
        status: 'in_progress',
      })
      .select()
      .single();

    if (!attemptData) throw new Error('Failed to create attempt');
    const attemptId = attemptData.id;

    let totalScore = 0;
    let correctCount = 0;
    const evaluatedAnswers: any[] = [];
    const dbAnswers: any[] = [];

    for (const ans of answers) {
      const q = quizData.quiz_questions.find((qq: any) => qq.id === ans.questionId);
      if (!q) continue;

      let isCorrect = false;
      let score = 0;
      let aiEvaluation: any = { explanation: q.explanation };

      if (q.question_type === 'mcq') {
        isCorrect = ans.selectedOptionIndex === q.correct_option_index;
        score = isCorrect ? 100 : 0;
      } else {
        const evalResult = await evaluateAnswer({
          question: q.question,
          correctAnswer: q.correct_answer,
          studentAnswer: ans.answer,
          concept: q.concept,
          userId: req.user!.id
        });
        isCorrect = evalResult.is_correct;
        score = evalResult.score;
        aiEvaluation = evalResult;
      }

      if (isCorrect) correctCount++;
      totalScore += score;

      dbAnswers.push({
        attempt_id: attemptId,
        question_id: q.id,
        user_answer: ans.answer || null,
        selected_option_index: ans.selectedOptionIndex ?? null,
        is_correct: isCorrect,
        score,
        ai_evaluation: aiEvaluation,
      });

      evaluatedAnswers.push({
        attempt_id: attemptId,
        question_id: q.id,
        questionText: q.question,
        question_text: q.question,
        type: q.question_type,
        question_type: q.question_type,
        userAnswer: ans.answer || null,
        user_answer: ans.answer || null,
        correctAnswer: q.correct_answer,
        correct_answer: q.correct_answer,
        selected_option_index: ans.selectedOptionIndex ?? null,
        isCorrect,
        is_correct: isCorrect,
        pointsEarned: score,
        pointsTotal: 100,
        score,
        feedback: aiEvaluation?.feedback || aiEvaluation?.explanation || q.explanation,
        strengths: aiEvaluation?.strengths || [],
        misconceptions: aiEvaluation?.misconceptions || [],
        ai_evaluation: aiEvaluation,
      });
    }

    const finalScore = answers.length > 0 ? Math.round(totalScore / answers.length) : 0;

    await supabaseAdmin
      .from('quiz_attempts')
      .update({ score: finalScore, correct_count: correctCount, status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', attemptId);

    await supabaseAdmin
      .from('quiz_answers')
      .insert(dbAnswers);

    await updateMasteryFromQuiz(attemptId);
    await createGrowthSnapshot(quizData.project_id, req.user.id);

    trackEvent({
      userId: req.user.id,
      eventType: 'quiz_completed',
      projectId: quizData.project_id,
      eventData: { quizId, attemptId, score: finalScore }
    });

    res.json({ attemptId, score: finalScore, answers: evaluatedAnswers });
  } catch (err) {
    next(err);
  }
});

router.get('/quizzes/:id/results', async (req, res, next) => {
  try {
    const { data: attempts, error } = await supabaseAdmin
      .from('quiz_attempts')
      .select('*, quiz_answers(*)')
      .eq('quiz_id', req.params.id)
      .eq('user_id', req.user.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    if (!attempts || attempts.length === 0) {
      return res.json(null);
    }

    const latestAttempt = attempts[0];

    // Fetch quiz questions to enrich answers
    const { data: questions } = await supabaseAdmin
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', req.params.id);

    const questionsMap = new Map((questions || []).map(q => [q.id, q]));

    const enrichedAnswers = (latestAttempt.quiz_answers || []).map((ans: any) => {
      const q = questionsMap.get(ans.question_id);
      return {
        ...ans,
        questionText: q?.question || 'Question',
        question_text: q?.question || 'Question',
        type: q?.question_type || 'mcq',
        question_type: q?.question_type || 'mcq',
        userAnswer: ans.user_answer,
        correctAnswer: q?.correct_answer || '',
        correct_answer: q?.correct_answer || '',
        isCorrect: ans.is_correct,
        score: ans.score,
        pointsEarned: ans.score,
        pointsTotal: 100,
        feedback: ans.ai_evaluation?.feedback || ans.ai_evaluation?.explanation || q?.explanation || '',
        strengths: ans.ai_evaluation?.strengths || [],
        misconceptions: ans.ai_evaluation?.misconceptions || [],
      };
    });

    res.json({
      attemptId: latestAttempt.id,
      score: Number(latestAttempt.score || 0),
      totalQuestions: latestAttempt.total_questions,
      correctCount: latestAttempt.correct_count,
      completedAt: latestAttempt.completed_at,
      answers: enrichedAnswers,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
