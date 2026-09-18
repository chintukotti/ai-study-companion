import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// Models confirmed active on Google GenAI API endpoint
export const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'gemini-embedding-001';
export const GENERATION_MODEL = process.env.GENERATION_MODEL || 'gemini-3.5-flash-lite';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

export async function generateEmbedding(text: string, taskType: string = 'RETRIEVAL_DOCUMENT'): Promise<number[]> {
  try {
    const response = await ai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: text,
      config: {
        outputDimensionality: 768,
      },
    });
    const values = (response as any).embedding?.values || (response as any).embeddings?.[0]?.values;
    if (!values) {
      throw new Error('Failed to generate embedding');
    }
    return values;
  } catch (err: any) {
    // If primary fails, try fallback
    if (EMBEDDING_MODEL !== 'text-embedding-004') {
      try {
        const fallback = await ai.models.embedContent({
          model: 'text-embedding-004',
          contents: text,
          config: {
            outputDimensionality: 768,
          },
        });
        const vals = (fallback as any).embedding?.values || (fallback as any).embeddings?.[0]?.values;
        if (vals) return vals;
      } catch {}
    }
    throw err;
  }
}

export async function generateBatchEmbeddings(texts: string[], taskType: string = 'RETRIEVAL_DOCUMENT'): Promise<number[][]> {
  const BATCH_SIZE = 10;
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const promises = batch.map(text => generateEmbedding(text, taskType));
    const results = await Promise.all(promises);
    allEmbeddings.push(...results);
  }
  return allEmbeddings;
}

// Fallback to Groq if Gemini is experiencing 503 high demand
async function callGroqChat(prompt: string, isJson: boolean = false): Promise<string> {
  if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY not configured');

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-120b',
      messages: [
        {
          role: 'system',
          content: isJson
            ? 'You are an AI study tutor. You MUST output strictly valid JSON matching the requested schema.'
            : 'You are an AI study tutor.',
        },
        { role: 'user', content: prompt }
      ],
      ...(isJson ? { response_format: { type: 'json_object' } } : {})
    })
  });

  const data: any = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || 'Groq API request failed');
  }

  return data.choices?.[0]?.message?.content || '';
}

export async function generateContent(prompt: string, options?: any): Promise<string> {
  const modelsToTry = [GENERATION_MODEL, 'gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-3.8-flash'];
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          temperature: options?.temperature ?? 0.3,
          ...options?.config,
        },
      });
      return response.text || '';
    } catch (err: any) {
      lastError = err;
      console.warn(`Model ${model} unavailable (${err.message}), trying fallback...`);
    }
  }

  // Fallback to Groq
  if (GROQ_API_KEY) {
    try {
      console.log('Using Groq fallback for generateContent...');
      return await callGroqChat(prompt, false);
    } catch (groqErr: any) {
      console.error('Groq fallback also failed:', groqErr.message);
    }
  }

  throw lastError;
}

function safeJsonParse<T>(raw: string): T {
  let cleaned = (raw || '').trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '').trim();
  }
  return JSON.parse(cleaned || '{}') as T;
}

export async function generateStructuredContent<T>(prompt: string, schema: any, options?: any): Promise<T> {
  const modelsToTry = [GENERATION_MODEL, 'gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-3.8-flash'];
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          temperature: options?.temperature ?? 0.3,
          responseMimeType: 'application/json',
          responseSchema: schema,
          ...options?.config,
        },
      });
      return safeJsonParse<T>(response.text || '{}');
    } catch (err: any) {
      lastError = err;
      console.warn(`Structured generation with ${model} unavailable (${err.message}), trying fallback...`);
    }
  }

  // Fallback to Groq with JSON format
  if (GROQ_API_KEY) {
    try {
      console.log('Using Groq fallback for structured JSON generation...');
      const schemaPrompt = `${prompt}\n\nYou MUST respond in strictly valid JSON format conforming to this JSON schema:\n${JSON.stringify(schema, null, 2)}`;
      const rawJson = await callGroqChat(schemaPrompt, true);
      return safeJsonParse<T>(rawJson);
    } catch (groqErr: any) {
      console.error('Groq structured fallback failed:', groqErr.message);
    }
  }

  throw lastError;
}
