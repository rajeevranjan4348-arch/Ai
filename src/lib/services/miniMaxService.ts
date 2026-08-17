import { getMiniMaxKeyInfo } from '../settings';

/**
 * Supported MiniMax Model Identifiers
 */
export type MiniMaxModel =
  | 'MiniMax-M3'
  | 'MiniMax-Text-01'
  | 'abab6.5s-chat'
  | string;

/**
 * Reasoning control level for MiniMax-M3 and supported models.
 * For MiniMax-M3:
 * - 'none' / omitted disables reasoning (no output item with type: "reasoning")
 * - 'minimal', 'low', 'medium', 'high' enable Adaptive Thinking reasoning output
 */
export type ReasoningEffort = 'none' | 'minimal' | 'low' | 'medium' | 'high';

export type ServiceTier = 'standard' | 'priority';

export type ToolChoice = 'none' | 'auto';

export interface ToolFunctionParameter {
  type: string;
  description?: string;
  properties?: Record<string, any>;
  required?: string[];
  enum?: string[];
  [key: string]: any;
}

export interface MiniMaxTool {
  type: 'function';
  name: string;
  description?: string;
  parameters?: ToolFunctionParameter;
}

export interface TextContentPart {
  type: 'input_text' | 'output_text';
  text: string;
}

export interface ImageContentPart {
  type: 'input_image';
  image_url: string | { url: string; detail?: 'low' | 'default' | 'high' };
}

export interface VideoContentPart {
  type: 'input_video';
  video_url: string | { url: string; fps?: number };
}

export type ContentPart = TextContentPart | ImageContentPart | VideoContentPart;

export interface InputItem {
  type?: 'message' | 'function_call' | 'function_call_output' | 'reasoning';
  role?: 'user' | 'assistant' | 'system' | 'developer' | 'tool';
  content?: string | ContentPart[];
  call_id?: string;
  name?: string;
  arguments?: string;
  output?: string | ContentPart[];
  summary?: Array<{ type: 'summary_text'; text: string }>;
}

export interface CreateResponseReq {
  model: MiniMaxModel;
  input: string | InputItem[];
  instructions?: string;
  service_tier?: ServiceTier;
  max_output_tokens?: number;
  temperature?: number;
  top_p?: number;
  stream?: boolean;
  tools?: MiniMaxTool[];
  tool_choice?: ToolChoice;
  metadata?: Record<string, string>;
  prompt_cache_key?: string;
  text?: {
    format?: {
      type: 'text';
    };
  };
  reasoning?: {
    effort: ReasoningEffort;
  };
}

export interface OutputMessageItem {
  id: string;
  type: 'message';
  status: 'completed';
  role: 'assistant';
  content: Array<{
    type: 'output_text';
    text: string;
    annotations?: any[];
  }>;
}

export interface OutputReasoningItem {
  id: string;
  type: 'reasoning';
  status: 'completed';
  summary?: Array<{ type: 'summary_text'; text: string }>;
  content: Array<{
    type: 'reasoning_text';
    text: string;
  }>;
}

export interface OutputFunctionCallItem {
  id: string;
  type: 'function_call';
  status: 'completed';
  call_id: string;
  name: string;
  arguments: string;
}

export type OutputItem = OutputMessageItem | OutputReasoningItem | OutputFunctionCallItem;

export interface MiniMaxUsage {
  input_tokens: number;
  input_tokens_details?: {
    cached_tokens: number;
  };
  output_tokens: number;
  output_tokens_details?: {
    reasoning_tokens: number;
  };
  total_tokens: number;
}

export interface CreateResponseResp {
  id: string;
  object: 'response';
  created_at: number;
  model: string;
  status: 'completed' | 'incomplete' | 'failed';
  output: OutputItem[];
  output_text: string | null;
  usage?: MiniMaxUsage;
  error?: {
    code?: string;
    message?: string;
  };
  incomplete_details?: {
    reason?: 'max_output_tokens' | 'content_filter';
  };
  parallel_tool_calls?: boolean;
  store?: boolean;
  truncation?: 'disabled';
}

export interface MiniMaxChatOptions {
  prompt: string;
  history?: Array<{
    role: 'user' | 'assistant' | 'system' | 'developer' | 'tool';
    content: string;
  }>;
  instructions?: string;
  systemPrompt?: string;
  model?: MiniMaxModel;
  reasoningEffort?: ReasoningEffort;
  temperature?: number;
  top_p?: number;
  max_output_tokens?: number;
  service_tier?: ServiceTier;
  tools?: MiniMaxTool[];
  tool_choice?: ToolChoice;
  customApiKey?: string;
}

export interface MiniMaxResponseResult {
  text: string;
  reasoningText?: string;
  model: string;
  usage?: MiniMaxUsage;
  responseId?: string;
  success: boolean;
  error?: string;
}

/**
 * Service class managing MiniMax Responses API (/v1/responses) requests.
 */
export class MiniMaxService {
  private static readonly API_ENDPOINT = 'https://api.minimax.io/v1/responses';

  /**
   * Get the active MiniMax API Key.
   */
  public static getApiKey(overrideKey?: string): string {
    if (overrideKey && overrideKey.trim()) {
      return overrideKey.trim();
    }
    const info = getMiniMaxKeyInfo();
    return info.key || '';
  }

  /**
   * Check if a MiniMax API key is currently available.
   */
  public static isConfigured(overrideKey?: string): boolean {
    return Boolean(this.getApiKey(overrideKey));
  }

  /**
   * Builds the CreateResponseReq payload from user chat options.
   */
  private static buildRequestBody(options: MiniMaxChatOptions, stream: boolean = false): CreateResponseReq {
    const {
      prompt,
      history = [],
      instructions,
      systemPrompt,
      model = 'MiniMax-M3',
      reasoningEffort,
      temperature,
      top_p,
      max_output_tokens,
      service_tier = 'standard',
      tools,
      tool_choice,
    } = options;

    const inputItems: InputItem[] = [];

    // Map conversation history
    if (Array.isArray(history) && history.length > 0) {
      for (const item of history) {
        if (item.content && item.content.trim()) {
          inputItems.push({
            type: 'message',
            role: item.role === 'assistant' ? 'assistant' : item.role === 'system' ? 'system' : 'user',
            content: item.content,
          });
        }
      }
    }

    // Add current user prompt
    inputItems.push({
      type: 'message',
      role: 'user',
      content: prompt,
    });

    const body: CreateResponseReq = {
      model,
      input: inputItems.length === 1 && typeof prompt === 'string' ? prompt : inputItems,
      stream,
      service_tier,
    };

    const effectiveInstructions = instructions || systemPrompt;
    if (effectiveInstructions) {
      body.instructions = effectiveInstructions;
    }

    if (reasoningEffort !== undefined) {
      body.reasoning = {
        effort: reasoningEffort,
      };
    }

    if (temperature !== undefined) {
      body.temperature = Math.max(0.01, Math.min(1, temperature));
    }

    if (top_p !== undefined) {
      body.top_p = Math.max(0.01, Math.min(1, top_p));
    }

    if (max_output_tokens !== undefined) {
      body.max_output_tokens = max_output_tokens;
    }

    if (tools && tools.length > 0) {
      body.tools = tools;
      if (tool_choice) {
        body.tool_choice = tool_choice;
      }
    }

    return body;
  }

  /**
   * Execute a non-streaming Create Response call to the MiniMax API.
   */
  public static async createResponse(options: MiniMaxChatOptions): Promise<MiniMaxResponseResult> {
    const apiKey = this.getApiKey(options.customApiKey);

    if (!apiKey) {
      return {
        text: '',
        model: options.model || 'MiniMax-M3',
        success: false,
        error: 'MiniMax API key is not configured. Please add your key in Settings > Developer.',
      };
    }

    const requestBody = this.buildRequestBody(options, false);

    try {
      const response = await fetch(this.API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data: CreateResponseResp = await response.json().catch(() => ({} as any));

      if (!response.ok || data.error || data.status === 'failed') {
        const errorMsg =
          data?.error?.message ||
          data?.error?.code ||
          `MiniMax API error (HTTP ${response.status})`;
        return {
          text: '',
          model: options.model || 'MiniMax-M3',
          success: false,
          error: errorMsg,
        };
      }

      // Parse output text and reasoning content
      let textOutput = data.output_text || '';
      let reasoningOutput = '';

      if (Array.isArray(data.output)) {
        for (const item of data.output) {
          if (item.type === 'message' && Array.isArray(item.content)) {
            for (const part of item.content) {
              if (part.type === 'output_text' && part.text) {
                if (!textOutput) textOutput = part.text;
              }
            }
          } else if (item.type === 'reasoning' && Array.isArray(item.content)) {
            reasoningOutput = item.content.map((c) => c.text || '').join('\n');
          }
        }
      }

      return {
        text: textOutput,
        reasoningText: reasoningOutput || undefined,
        model: data.model || options.model || 'MiniMax-M3',
        usage: data.usage,
        responseId: data.id,
        success: true,
      };
    } catch (err: any) {
      console.error('MiniMax API createResponse exception:', err);
      return {
        text: '',
        model: options.model || 'MiniMax-M3',
        success: false,
        error: err?.message || 'Failed to connect to MiniMax API',
      };
    }
  }

  /**
   * Execute a real-time streaming Create Response call to the MiniMax API via Server-Sent Events (SSE).
   * Calls onChunk with incremental text updates.
   */
  public static async streamResponse(
    options: MiniMaxChatOptions,
    onChunk: (delta: string, accumulated: string) => void,
    onReasoning?: (delta: string, accumulated: string) => void
  ): Promise<MiniMaxResponseResult> {
    const apiKey = this.getApiKey(options.customApiKey);

    if (!apiKey) {
      return {
        text: '',
        model: options.model || 'MiniMax-M3',
        success: false,
        error: 'MiniMax API key is not configured. Please add your key in Settings > Developer.',
      };
    }

    const requestBody = this.buildRequestBody(options, true);
    let accumulatedText = '';
    let accumulatedReasoning = '';
    let responseId = '';
    let usage: MiniMaxUsage | undefined;
    let finalModel = options.model || 'MiniMax-M3';

    try {
      const response = await fetch(this.API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok || !response.body) {
        // If streaming fails or not supported by endpoint, fall back to non-streaming
        console.warn('MiniMax streaming endpoint returned non-OK status, falling back to non-streaming...');
        const fallbackRes = await this.createResponse(options);
        if (fallbackRes.success && fallbackRes.text) {
          onChunk(fallbackRes.text, fallbackRes.text);
        }
        return fallbackRes;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;

          const dataStr = trimmed.slice(5).trim();
          if (dataStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(dataStr);

            if (parsed.id) responseId = parsed.id;
            if (parsed.model) finalModel = parsed.model;
            if (parsed.usage) usage = parsed.usage;

            if (parsed.error) {
              console.warn('MiniMax SSE error packet:', parsed.error);
              reader.cancel().catch(() => {});
              return {
                text: accumulatedText,
                reasoningText: accumulatedReasoning || undefined,
                model: finalModel,
                success: false,
                error: parsed.error.message || parsed.error.code,
              };
            }

            // Extract delta chunks or output items
            let deltaText = '';
            let deltaReasoning = '';

            if (parsed.output_text && typeof parsed.output_text === 'string') {
              if (parsed.output_text.length > accumulatedText.length) {
                deltaText = parsed.output_text.slice(accumulatedText.length);
              }
            }

            if (Array.isArray(parsed.output)) {
              for (const item of parsed.output) {
                if (item.type === 'message' && Array.isArray(item.content)) {
                  for (const part of item.content) {
                    if (part.type === 'output_text' && part.text) {
                      if (part.text.length > accumulatedText.length) {
                        deltaText = part.text.slice(accumulatedText.length);
                      }
                    }
                  }
                } else if (item.type === 'reasoning' && Array.isArray(item.content)) {
                  const currentReasoning = item.content.map((c: any) => c.text || '').join('\n');
                  if (currentReasoning.length > accumulatedReasoning.length) {
                    deltaReasoning = currentReasoning.slice(accumulatedReasoning.length);
                  }
                }
              }
            }

            // Delta formats from OpenAI Responses API compatibility
            if (parsed.delta) {
              if (typeof parsed.delta.text === 'string') {
                deltaText = parsed.delta.text;
              } else if (typeof parsed.delta.content === 'string') {
                deltaText = parsed.delta.content;
              }

              if (typeof parsed.delta.reasoning === 'string') {
                deltaReasoning = parsed.delta.reasoning;
              }
            }

            if (deltaText) {
              accumulatedText += deltaText;
              onChunk(deltaText, accumulatedText);
            }

            if (deltaReasoning) {
              accumulatedReasoning += deltaReasoning;
              onReasoning?.(deltaReasoning, accumulatedReasoning);
            }
          } catch (jsonErr) {
            // Partial JSON buffer line, continue
          }
        }
      }

      // If nothing was streamed, fallback to non-streaming
      if (!accumulatedText) {
        const fallbackRes = await this.createResponse(options);
        if (fallbackRes.success && fallbackRes.text) {
          onChunk(fallbackRes.text, fallbackRes.text);
        }
        return fallbackRes;
      }

      return {
        text: accumulatedText,
        reasoningText: accumulatedReasoning || undefined,
        model: finalModel,
        usage,
        responseId,
        success: true,
      };
    } catch (err: any) {
      console.error('MiniMax streamResponse exception:', err);
      // Try fallback to non-streaming if network streaming aborted
      try {
        const fallbackRes = await this.createResponse(options);
        if (fallbackRes.success && fallbackRes.text) {
          onChunk(fallbackRes.text, fallbackRes.text);
        }
        return fallbackRes;
      } catch {
        return {
          text: accumulatedText,
          model: finalModel,
          success: false,
          error: err?.message || 'Streaming failed from MiniMax API',
        };
      }
    }
  }
}

// Convenience export functions
export const callMiniMax = (options: MiniMaxChatOptions) => MiniMaxService.createResponse(options);
export const streamMiniMax = (
  options: MiniMaxChatOptions,
  onChunk: (delta: string, accumulated: string) => void,
  onReasoning?: (delta: string, accumulated: string) => void
) => MiniMaxService.streamResponse(options, onChunk, onReasoning);
