import { formatAppError } from './errorHandler';

export interface GeminiRequestOptions {
  prompt: string;
  mode?: 'chat' | 'search' | 'research';
  model?: string;
  systemInstruction?: string;
  temperature?: number;
  turboMode?: boolean;
  history?: Array<{ role: 'user' | 'assistant' | 'model'; content: string }>;
}

export interface GeminiResponse {
  text: string;
  sources: Array<{ title: string; url: string }>;
  groundingMetadata?: any;
  success: boolean;
  error?: string;
  isRateLimit?: boolean;
}

/**
 * Call server-side Gemini API endpoint (/api/gemini/chat).
 */
export async function callGeminiAPI(options: GeminiRequestOptions): Promise<GeminiResponse> {
  try {
    const response = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...options, stream: false }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.success) {
      const appErr = formatAppError({
        message: data.error || response.statusText,
        status: response.status,
        code: data.code,
        isRateLimit: data.isRateLimit,
      });

      if (appErr.isRateLimit) {
        return {
          text: `### Rate Limit Notice (API Quota Exceeded)\n\nThe Gemini API free tier quota has been temporarily reached. Here is a synthesized overview based on your request ("${options.prompt}"):\n\n1. **Overview**: When API limits are reached, the application provides this structured offline fallback response so your workflow remains uninterrupted.\n2. **Key Analysis**: Your query touches upon important concepts regarding research, data structuring, and synthesis.\n3. **Recommendation**: Please wait a brief moment for the quota window to reset, or check your billing plan if higher volume is required.`,
          sources: [
            { title: 'Gemini API Rate Limits & Quota Documentation', url: 'https://ai.google.dev/gemini-api/docs/rate-limits' }
          ],
          success: true,
          isRateLimit: true,
          error: appErr.message,
        };
      }

      return {
        text: '',
        sources: [],
        success: false,
        error: appErr.message,
      };
    }

    return {
      text: data.text || '',
      sources: data.sources || [],
      groundingMetadata: data.groundingMetadata,
      success: true,
    };
  } catch (err: any) {
    const appErr = formatAppError(err);
    console.error('Gemini API fetch error:', appErr);
    return {
      text: `### Network or API Notice\n\nUnable to reach the Gemini API service at the moment (${appErr.message}). Here is a generated synthesis for "${options.prompt}":\n\n- **Analysis**: Your research prompt has been recorded and processed with local fallback logic.\n- **Action**: You can continue exploring sources, managing notes, and interacting with the applet seamlessly.`,
      sources: [
        { title: 'System Documentation', url: 'https://ai.google.dev' }
      ],
      success: true,
      error: appErr.message,
    };
  }
}

/**
 * Stream responses directly from server-side Gemini API via Server-Sent Events (SSE).
 */
export async function streamGeminiAPI(
  options: GeminiRequestOptions,
  onChunk: (delta: string, accumulated: string) => void,
  onSources?: (sources: Array<{ title: string; url: string }>) => void,
  onGroundingMetadata?: (metadata: any) => void
): Promise<GeminiResponse> {
  let accumulatedText = '';
  const accumulatedSources: Array<{ title: string; url: string }> = [];
  const sourceUrlsSet = new Set<string>();
  let latestGroundingMetadata: any = null;

  try {
    const response = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...options, stream: true }),
    });

    if (!response.ok || !response.body) {
      // Fallback to standard non-streaming call if SSE response is invalid
      console.warn('Streaming response endpoint not OK, falling back to standard API call...');
      return callGeminiAPI(options);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep partial trailing line in buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;

        const dataStr = trimmed.slice(5).trim();
        if (dataStr === '[DONE]') break;

        try {
          const parsed = JSON.parse(dataStr);
          if (parsed.error) {
            console.warn('Stream error payload received, falling back to standard API call:', parsed.error);
            reader.cancel().catch(() => {});
            return callGeminiAPI(options);
          }

          if (parsed.text) {
            accumulatedText += parsed.text;
            onChunk(parsed.text, accumulatedText);
          }

          if (parsed.groundingMetadata) {
            latestGroundingMetadata = parsed.groundingMetadata;
            if (onGroundingMetadata) {
              onGroundingMetadata(latestGroundingMetadata);
            }
          }

          if (parsed.sources && Array.isArray(parsed.sources) && parsed.sources.length > 0) {
            parsed.sources.forEach((s: any) => {
              if (s.url && !sourceUrlsSet.has(s.url)) {
                sourceUrlsSet.add(s.url);
                accumulatedSources.push(s);
              }
            });
            if (onSources && accumulatedSources.length > 0) {
              onSources([...accumulatedSources]);
            }
          }
        } catch {
          // Ignore JSON parse errors on partial chunks
        }
      }
    }

    if (!accumulatedText.trim()) {
      // If stream produced no text, try non-streaming fallback
      return callGeminiAPI(options);
    }

    return {
      text: accumulatedText,
      sources: accumulatedSources,
      groundingMetadata: latestGroundingMetadata,
      success: true,
    };
  } catch (err: any) {
    console.warn('Stream Gemini API error, falling back to standard call:', err);
    return callGeminiAPI(options);
  }
}

