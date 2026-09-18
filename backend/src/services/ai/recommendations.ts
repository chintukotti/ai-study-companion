import { generateStructuredContent } from '../../lib/gemini.js';
import { trackAIUsage } from './usage-tracker.js';

interface RecParams {
  masteryData: any;
  recentActivity: any;
  learningContext: any;
  userId: string;
}

const recSchema = {
  type: 'object',
  properties: {
    recommendations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['review', 'quiz', 'read', 'practice', 'explore'] },
          title: { type: 'string' },
          description: { type: 'string' },
          priority: { type: 'number' }, // 1-5
          metadata: { type: 'object' }
        },
        required: ['type', 'title', 'description', 'priority']
      }
    }
  },
  required: ['recommendations']
};

export const generateRecommendations = async (params: RecParams) => {
  const start = Date.now();
  const systemPrompt = `Based on the student's mastery data, recent activity, and learning context, recommend 3-5 next actions to improve their understanding.
Mastery Data: ${JSON.stringify(params.masteryData)}
Recent Activity: ${JSON.stringify(params.recentActivity)}
Learning Context: ${JSON.stringify(params.learningContext)}

Prioritize addressing weak areas or reinforcing newly learned concepts.`;

  try {
    const result = await generateStructuredContent<any>(systemPrompt, recSchema);
    
    await trackAIUsage({
      userId: params.userId,
      model: 'gemini-3.6-flash',
      operation: 'generateRecommendations',
      inputTokens: Math.ceil(systemPrompt.length / 4),
      outputTokens: Math.ceil(JSON.stringify(result).length / 4),
      latencyMs: Date.now() - start,
      success: true
    });

    const recs = Array.isArray(result) ? result : (result?.recommendations || []);
    return recs;
  } catch (error: any) {
    await trackAIUsage({
      userId: params.userId,
      model: 'gemini-3.5-flash-lite',
      operation: 'generateRecommendations',
      inputTokens: Math.ceil(systemPrompt.length / 4),
      outputTokens: 0,
      latencyMs: Date.now() - start,
      success: false,
      error: error.message
    });
    
    // Provide grounded fallback recommendations so UI remains functional
    return [
      {
        type: 'review',
        title: 'Review Core Concepts',
        description: 'Focus on concepts where your mastery score is under 70% to strengthen understanding.',
        priority: 5,
        metadata: {}
      },
      {
        type: 'quiz',
        title: 'Reinforce With Practice Quiz',
        description: 'Generate and take another quiz to improve retention on recent topics.',
        priority: 4,
        metadata: {}
      }
    ];
  }
};
