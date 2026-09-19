import { generateStructuredContent } from '../../lib/gemini.js';
import { trackAIUsage } from './usage-tracker.js';

interface QuizParams {
  topic?: string;
  type: string; // mcq, open_ended, mixed
  difficulty: string; // easy, medium, hard
  count: number;
  context: string;
  masteryData?: any;
  userId: string;
}

const quizSchema = {
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          question: { type: 'string' },
          type: { type: 'string', enum: ['mcq', 'open_ended'] },
          options: { type: 'array', items: { type: 'string' } },
          correct_answer: { type: 'string' },
          correct_option_index: { type: 'number' },
          explanation: { type: 'string' },
          blooms_level: { type: 'string', enum: ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'] },
          concept: { type: 'string' },
          page_references: { type: 'array', items: { type: 'number' } }
        },
        required: ['question', 'type', 'correct_answer', 'explanation', 'blooms_level', 'concept', 'page_references']
      }
    }
  },
  required: ['questions']
};

const VALID_BLOOMS = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];

export const generateQuiz = async (params: QuizParams) => {
  const start = Date.now();
  const typeInstruction = params.type === 'mcq'
    ? "Every question must have type 'mcq' with an array of 4 distinct options and correct_option_index (0, 1, 2, or 3)."
    : params.type === 'open_ended'
    ? "Every question must have type 'open_ended', with options as an empty array and correct_option_index as null."
    : "Mix of 'mcq' (with 4 options and correct_option_index) and 'open_ended' questions.";

  const systemPrompt = `You are an expert academic tutor creating a quiz STRICTLY based on the provided document excerpts.

CRITICAL GROUNDING RULES:
1. Every single question, multiple choice option, correct answer, and explanation MUST be directly and strictly derived from the Document Context provided below.
2. DO NOT invent questions or test outside general knowledge that is not supported by the Document Context.
3. Every question MUST cite real page numbers in page_references matching the pages indicated in the Document Context.

Topic: ${params.topic || 'Core concepts from the uploaded documents'}
Document Context:
${params.context}

Quiz Type Rules: ${typeInstruction}
Taxonomy Rules: For blooms_level, you MUST use one of the following exact capitalized values: 'Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'. Do NOT use any other value (never use difficulty words like 'Intermediate' or 'Beginner' for blooms_level).

Mastery Data: ${JSON.stringify(params.masteryData || {})}

Return strictly a JSON object with a "questions" array matching the requested schema.`;

  try {
    const result = await generateStructuredContent<any>(systemPrompt, quizSchema);
    const rawQuestions = Array.isArray(result) ? result : (result?.questions || []);

    const questions = rawQuestions.map((q: any) => {
      let qType = (q.type || params.type || 'mcq').toLowerCase();
      if (qType.includes('choice') || qType === 'mcq') qType = 'mcq';
      else if (qType.includes('open')) qType = 'open_ended';
      else qType = params.type === 'open_ended' ? 'open_ended' : 'mcq';

      let blooms = 'Understand';
      if (q.blooms_level) {
        const found = VALID_BLOOMS.find(b => b.toLowerCase() === String(q.blooms_level).toLowerCase());
        if (found) blooms = found;
      }

      let options = Array.isArray(q.options) ? q.options : [];
      let correctOptIdx = typeof q.correct_option_index === 'number' ? q.correct_option_index : null;
      if (qType === 'mcq') {
        if (options.length === 0 && q.correct_answer) {
          options = [q.correct_answer, 'Option B', 'Option C', 'Option D'];
          correctOptIdx = 0;
        } else if (correctOptIdx === null || correctOptIdx < 0 || correctOptIdx >= options.length) {
          const idx = options.indexOf(q.correct_answer);
          correctOptIdx = idx !== -1 ? idx : 0;
        }
      }

      return {
        ...q,
        type: qType,
        blooms_level: blooms,
        options,
        correct_option_index: correctOptIdx,
        page_references: Array.isArray(q.page_references) ? q.page_references : []
      };
    });
    
    await trackAIUsage({
      userId: params.userId,
      model: 'gemini-3.5-flash-lite',
      operation: 'generateQuiz',
      inputTokens: Math.ceil(systemPrompt.length / 4),
      outputTokens: Math.ceil(JSON.stringify(questions).length / 4),
      latencyMs: Date.now() - start,
      success: true
    });

    return questions;
  } catch (error: any) {
    await trackAIUsage({
      userId: params.userId,
      model: 'gemini-3.5-flash-lite',
      operation: 'generateQuiz',
      inputTokens: Math.ceil(systemPrompt.length / 4),
      outputTokens: 0,
      latencyMs: Date.now() - start,
      success: false,
      error: error.message
    });
    throw error;
  }
};
