import { embedQuery } from '../ai/embeddings.js';
import { retrieveRelevantChunks, buildContext } from './retriever.js';
import { generateTutorResponse } from '../ai/tutor.js';

interface RagParams {
  query: string;
  projectId: string;
  userId: string;
  chatHistory?: any[];
  learningContext?: string;
}

export const ragQuery = async (params: RagParams) => {
  // 1. Embed query
  const queryEmbedding = await embedQuery(params.query, params.userId);

  // 2. Retrieve chunks
  const chunks = await retrieveRelevantChunks({
    queryEmbedding,
    projectId: params.projectId,
    threshold: 0.6,
    limit: 5
  });

  // 3. Build context
  const context = buildContext(chunks || []);

  // 4. Generate response
  const response = await generateTutorResponse({
    query: params.query,
    context,
    chatHistory: params.chatHistory,
    learningContext: params.learningContext,
    userId: params.userId
  });

  return response;
};
