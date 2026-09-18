import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { getAdminStats } from '../services/analytics/aggregator.js';
import { supabaseAdmin } from '../lib/supabase.js';

const router = Router();
router.use(requireAdmin);

router.get('/stats', async (req, res, next) => {
  try {
    const stats = await getAdminStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

router.get('/users', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin.from('profiles').select('*');
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/ai-usage', async (req, res, next) => {
  try {
    const { data: logs, error } = await supabaseAdmin
      .from('ai_usage_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
      
    if (error) throw error;
    
    const allLogs = logs || [];
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCost = 0;
    let totalLatency = 0;
    let successCount = 0;
    let failedCount = 0;

    const models: Record<string, { calls: number; inputTokens: number; outputTokens: number; totalTokens: number; estimatedCost: number; avgLatency: number; successCount: number }> = {};
    const operations: Record<string, { calls: number; inputTokens: number; outputTokens: number; totalTokens: number; estimatedCost: number }> = {};

    for (const log of allLogs) {
      const inp = Number(log.input_tokens) || 0;
      const out = Number(log.output_tokens) || 0;
      const cost = Number(log.cost_estimate ?? log.estimated_cost) || 0;
      const lat = Number(log.latency_ms) || 0;
      const isSuccess = log.success !== false;

      totalInputTokens += inp;
      totalOutputTokens += out;
      totalCost += cost;
      totalLatency += lat;
      if (isSuccess) successCount++; else failedCount++;

      // By model
      const m = log.model || 'unknown';
      if (!models[m]) {
        models[m] = { calls: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0, estimatedCost: 0, avgLatency: 0, successCount: 0 };
      }
      models[m].calls++;
      models[m].inputTokens += inp;
      models[m].outputTokens += out;
      models[m].totalTokens += (inp + out);
      models[m].estimatedCost = Number((models[m].estimatedCost + cost).toFixed(6));
      models[m].avgLatency += lat;
      if (isSuccess) models[m].successCount++;

      // By operation
      const op = log.operation || 'general';
      if (!operations[op]) {
        operations[op] = { calls: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0, estimatedCost: 0 };
      }
      operations[op].calls++;
      operations[op].inputTokens += inp;
      operations[op].outputTokens += out;
      operations[op].totalTokens += (inp + out);
      operations[op].estimatedCost = Number((operations[op].estimatedCost + cost).toFixed(6));
    }

    // Finalize model averages
    for (const m in models) {
      if (models[m].calls > 0) {
        models[m].avgLatency = Math.round(models[m].avgLatency / models[m].calls);
      }
    }

    res.json({
      summary: {
        totalCalls: allLogs.length,
        totalInputTokens,
        totalOutputTokens,
        totalTokens: totalInputTokens + totalOutputTokens,
        totalCost: Number(totalCost.toFixed(5)),
        avgLatencyMs: allLogs.length > 0 ? Math.round(totalLatency / allLogs.length) : 0,
        successRate: allLogs.length > 0 ? Math.round((successCount / allLogs.length) * 100) : 100,
        successCount,
        failedCount,
      },
      models,
      operations,
      logs: allLogs,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
