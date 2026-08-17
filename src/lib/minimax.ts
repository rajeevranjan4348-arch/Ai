import {
  MiniMaxService,
  MiniMaxChatOptions,
  MiniMaxResponseResult,
  MiniMaxModel,
  ReasoningEffort,
  callMiniMax,
  streamMiniMax,
} from './services/miniMaxService';

export type {
  MiniMaxChatOptions,
  MiniMaxResponseResult,
  MiniMaxModel,
  ReasoningEffort,
};

export interface MiniMaxRequestOptions {
  prompt: string;
  history?: Array<{ role: 'user' | 'assistant' | 'system' | 'developer' | 'tool'; content: string }>;
  systemPrompt?: string;
  model?: MiniMaxModel;
  reasoningEffort?: ReasoningEffort;
  stream?: boolean;
}

export interface MiniMaxResponse {
  text: string;
  reasoningText?: string;
  success: boolean;
  error?: string;
}

/**
 * Call MiniMax OpenAI Responses API compatible endpoint (/v1/responses).
 * Generates model replies with optional reasoning support.
 */
export async function callMiniMaxAPI(options: MiniMaxRequestOptions): Promise<MiniMaxResponse> {
  const res = await MiniMaxService.createResponse({
    prompt: options.prompt,
    history: options.history,
    systemPrompt: options.systemPrompt,
    model: options.model || 'MiniMax-M3',
    reasoningEffort: options.reasoningEffort,
  });

  return {
    text: res.text,
    reasoningText: res.reasoningText,
    success: res.success,
    error: res.error,
  };
}

/**
 * Stream MiniMax OpenAI Responses API compatible endpoint (/v1/responses).
 */
export async function streamMiniMaxAPI(
  options: MiniMaxRequestOptions,
  onChunk: (delta: string, accumulated: string) => void,
  onReasoning?: (delta: string, accumulated: string) => void
): Promise<MiniMaxResponse> {
  const res = await MiniMaxService.streamResponse(
    {
      prompt: options.prompt,
      history: options.history,
      systemPrompt: options.systemPrompt,
      model: options.model || 'MiniMax-M3',
      reasoningEffort: options.reasoningEffort,
    },
    onChunk,
    onReasoning
  );

  return {
    text: res.text,
    reasoningText: res.reasoningText,
    success: res.success,
    error: res.error,
  };
}

export { MiniMaxService, callMiniMax, streamMiniMax };
