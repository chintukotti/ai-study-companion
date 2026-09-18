import { generateEmbedding, generateBatchEmbeddings } from '../../lib/gemini.js';
import { trackAIUsage } from './usage-tracker.js';

export const embedQuery = async (text: string, userId?: string) => {
  const start = Date.now();
  try {
    const embedding = await generateEmbedding(text, 'RETRIEVAL_QUERY');
    if (userId) {
      await trackAIUsage({
        userId,
        model: 'gemini-embedding-001',
        operation: 'embedQuery',
        inputTokens: Math.ceil(text.length / 4), // Rough estimate
        outputTokens: 0,
        latencyMs: Date.now() - start,
        success: true
      });
    }
    return embedding;
  } catch (error: any) {
    if (userId) {
      await trackAIUsage({
        userId,
        model: 'gemini-embedding-001',
        operation: 'embedQuery',
        inputTokens: Math.ceil(text.length / 4),
        outputTokens: 0,
        latencyMs: Date.now() - start,
        success: false,
        error: error.message
      });
    }
    throw error;
  }
};

export const embedDocumentChunks = async (chunks: string[], userId?: string) => {
  const start = Date.now();
  try {
    const embeddings = await generateBatchEmbeddings(chunks, 'RETRIEVAL_DOCUMENT');
    if (userId) {
      await trackAIUsage({
        userId,
        model: 'gemini-embedding-001',
        operation: 'embedDocumentChunks',
        inputTokens: Math.ceil(chunks.join(' ').length / 4), // Rough estimate
        outputTokens: 0,
        latencyMs: Date.now() - start,
        success: true
      });
    }
    return embeddings;
  } catch (error: any) {
    if (userId) {
      await trackAIUsage({
        userId,
        model: 'gemini-embedding-001',
        operation: 'embedDocumentChunks',
        inputTokens: Math.ceil(chunks.join(' ').length / 4),
        outputTokens: 0,
        latencyMs: Date.now() - start,
        success: false,
        error: error.message
      });
    }
    throw error;
  }
};
