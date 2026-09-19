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

import { supabaseAdmin } from '../../lib/supabase.js';

export const ragQuery = async (params: RagParams) => {
  // 1. Embed query
  const queryEmbedding = await embedQuery(params.query, params.userId);

  // 2. Retrieve chunks
  const chunks = await retrieveRelevantChunks({
    queryEmbedding,
    projectId: params.projectId,
    threshold: 0.5,
    limit: 6
  });

  // 3. Fetch PDF document names for all retrieved chunks
  const docIds = [...new Set((chunks || []).map(c => c.document_id))];
  let docTitleMap = new Map<string, string>();
  if (docIds.length > 0) {
    const { data: docs } = await supabaseAdmin
      .from('documents')
      .select('id, title')
      .in('id', docIds);
    if (docs) {
      docs.forEach(d => docTitleMap.set(d.id, d.title));
    }
  }

  // 4. Build context including PDF document names
  const context = buildContext(chunks || [], docTitleMap);

  // 5. Generate response
  const response = await generateTutorResponse({
    query: params.query,
    context,
    chatHistory: params.chatHistory,
    learningContext: params.learningContext,
    userId: params.userId
  });

  // 6. Ensure every citation includes the real PDF document title
  if (response.citations && Array.isArray(response.citations)) {
    response.citations = response.citations.map((cite: any) => ({
      ...cite,
      document_title: docTitleMap.get(cite.document_id) || cite.document_title || 'Document.pdf',
    }));
  }

  return response;
};
