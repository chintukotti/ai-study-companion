import { supabaseAdmin } from '../../lib/supabase.js';

export interface AIUsageParams {
  userId: string;
  model: string;
  operation: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  success: boolean;
  error?: string;
}

export const calculateCost = (model: string, inputTokens: number, outputTokens: number): number => {
  // Rough estimate based on gemini-2.0-flash pricing (example rates)
  const inputRate = 0.0001 / 1000;
  const outputRate = 0.0004 / 1000;
  return (inputTokens * inputRate) + (outputTokens * outputRate);
};

export const trackAIUsage = async (params: AIUsageParams): Promise<void> => {
  const cost = calculateCost(params.model, params.inputTokens, params.outputTokens);
  const totalTokens = (params.inputTokens || 0) + (params.outputTokens || 0);
  
  const { error } = await supabaseAdmin.from('ai_usage_logs').insert({
    user_id: params.userId,
    model: params.model,
    operation: params.operation,
    input_tokens: params.inputTokens,
    output_tokens: params.outputTokens,
    total_tokens: totalTokens,
    latency_ms: params.latencyMs,
    success: params.success,
    error_message: params.error || null,
    cost_estimate: cost
  });

  if (error) {
    console.error('Failed to log AI usage to database:', error);
  }
};
