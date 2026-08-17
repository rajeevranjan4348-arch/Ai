import OpenAI from 'openai';
import { getOpenAIKeyInfo } from './settings';

let openaiClient: OpenAI | null = null;
let currentClientKey: string | null = null;

export function getOpenAIClient(): OpenAI | null {
  const { key: apiKey } = getOpenAIKeyInfo();

  if (!apiKey) return null;

  if (!openaiClient || currentClientKey !== apiKey) {
    currentClientKey = apiKey;
    openaiClient = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true, // Client-side fallback for preview environment
    });
  }
  return openaiClient;
}

export interface OpenAIResponseOptions {
  prompt: string;
  systemPrompt?: string;
  mode?: 'search' | 'research' | 'chat';
  model?: string;
}

/**
 * Generate completion using OpenAI API for chat, search, or research (re-search).
 */
export async function runOpenAIQuery(options: OpenAIResponseOptions): Promise<string> {
  const client = getOpenAIClient();
  if (!client) {
    throw new Error('OpenAI API key is missing or not configured');
  }

  const { prompt, systemPrompt, mode = 'chat', model = 'gpt-4o-mini' } = options;

  let baseSystem = systemPrompt || 'You are an intelligent AI research assistant.';

  if (mode === 'search') {
    baseSystem += `\n\nMode: FAST SEARCH.
Provide a clear, direct, and well-structured answer with inline citations [1], [2] where appropriate.
Structure key findings with bold headers and bullet points. End with a Sources section if real web URLs or authoritative entities are referenced.`;
  } else if (mode === 'research') {
    baseSystem += `\n\nMode: DEEP RESEARCH (Re-Search).
Perform deep multi-perspective analysis. Cross-check facts, provide comprehensive explanations, break down technical or key aspects, compare viewpoints, and include detailed citation markers [1], [2], [3]. Format response in polished Markdown.`;
  }

  const response = await client.chat.completions.create({
    model: mode === 'research' ? 'gpt-4o' : model,
    messages: [
      { role: 'system', content: baseSystem },
      { role: 'user', content: prompt },
    ],
    temperature: mode === 'research' ? 0.3 : 0.5,
  });

  return response.choices[0]?.message?.content || 'No response generated from OpenAI.';
}
