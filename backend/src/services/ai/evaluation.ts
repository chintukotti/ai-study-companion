import { generateStructuredContent } from '../../lib/gemini.js';
import { trackAIUsage } from './usage-tracker.js';

interface EvalParams {
  question: string;
  correctAnswer: string;
  studentAnswer: string;
  concept: string;
  userId: string;
}

const evalSchema = {
  type: 'object',
  properties: {
    score: { type: 'number' }, // 0-100
    is_correct: { type: 'boolean' },
    strengths: { type: 'array', items: { type: 'string' } },
    misconceptions: { type: 'array', items: { type: 'string' } },
    feedback: { type: 'string' },
    concept: { type: 'string' }
  },
  required: ['score', 'is_correct', 'strengths', 'misconceptions', 'feedback', 'concept']
};

export const evaluateAnswer = async (params: EvalParams) => {
  const start = Date.now();
  const systemPrompt = `Evaluate the student's answer against the correct answer for the given question.
Question: ${params.question}
Correct Answer: ${params.correctAnswer}
Student Answer: ${params.studentAnswer}
Concept: ${params.concept}

Provide a score out of 100, identify if it's generally correct, and provide constructive feedback.`;

  try {
    const result = await generateStructuredContent<any>(systemPrompt, evalSchema);
    
    await trackAIUsage({
      userId: params.userId,
      model: 'gemini-3.6-flash',
      operation: 'evaluateAnswer',
      inputTokens: Math.ceil(systemPrompt.length / 4),
      outputTokens: Math.ceil(JSON.stringify(result).length / 4),
      latencyMs: Date.now() - start,
      success: true
    });

    return result;
  } catch (error: any) {
    await trackAIUsage({
      userId: params.userId,
      model: 'gemini-3.6-flash',
      operation: 'evaluateAnswer',
      inputTokens: Math.ceil(systemPrompt.length / 4),
      outputTokens: 0,
      latencyMs: Date.now() - start,
      success: false,
      error: error.message
    });
    throw error;
  }
};
