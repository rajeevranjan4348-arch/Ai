import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

function geminiApiPlugin(): Plugin {
  const callGeminiModel = async (ai: any, params: { contents: any; config: any; preferredModel?: string }) => {
    const defaultModels = params.preferredModel 
      ? [params.preferredModel, 'gemini-3.1-flash-lite', 'gemini-3.7-flash']
      : ['gemini-3.7-flash', 'gemini-3.1-flash-lite'];
    const models = Array.from(new Set(defaultModels));
    let lastErr: any = null;

    for (const model of models) {
      try {
        return await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
      } catch (err: any) {
        lastErr = err;
        const errMsg = err?.message || String(err);
        const isRateLimit =
          err?.status === 429 ||
          errMsg.includes('429') ||
          errMsg.includes('quota') ||
          errMsg.includes('RESOURCE_EXHAUSTED') ||
          errMsg.includes('rate limit');

        if (!isRateLimit) throw err;
      }
    }

    if (params.config?.tools?.length) {
      try {
        const configNoTools = { ...params.config, tools: undefined };
        return await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: params.contents,
          config: configNoTools,
        });
      } catch (err: any) {
        lastErr = err;
      }
    }

    throw lastErr;
  };

  const callGeminiStream = async (ai: any, params: { contents: any; config: any; preferredModel?: string }) => {
    const defaultModels = params.preferredModel 
      ? [params.preferredModel, 'gemini-3.1-flash-lite', 'gemini-3.7-flash']
      : ['gemini-3.7-flash', 'gemini-3.1-flash-lite'];
    const models = Array.from(new Set(defaultModels));
    let lastErr: any = null;

    for (const model of models) {
      try {
        return await ai.models.generateContentStream({
          model,
          contents: params.contents,
          config: params.config,
        });
      } catch (err: any) {
        lastErr = err;
        const errMsg = err?.message || String(err);
        const isRateLimit =
          err?.status === 429 ||
          errMsg.includes('429') ||
          errMsg.includes('quota') ||
          errMsg.includes('RESOURCE_EXHAUSTED') ||
          errMsg.includes('rate limit');

        if (!isRateLimit) throw err;
      }
    }

    if (params.config?.tools?.length) {
      try {
        const configNoTools = { ...params.config, tools: undefined };
        return await ai.models.generateContentStream({
          model: 'gemini-3.1-flash-lite',
          contents: params.contents,
          config: configNoTools,
        });
      } catch (err: any) {
        lastErr = err;
      }
    }

    throw lastErr;
  };

  const handleGeminiRequest = async (req: any, res: any) => {
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }

    let body = '';
    req.on('data', (chunk: any) => { body += chunk; });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body || '{}');
        const { 
          prompt, 
          history, 
          mode = 'chat', 
          systemInstruction, 
          stream = false,
          model: requestedModel,
          temperature,
          turboMode = false,
        } = data;

        const effectiveModel = turboMode 
          ? (requestedModel || 'gemini-3.1-flash-lite')
          : (requestedModel || 'gemini-3.7-flash');

        const effectiveTemperature = typeof temperature === 'number'
          ? temperature
          : (turboMode ? 0.2 : 0.7);

        const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

        if (!apiKey) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            error: 'GEMINI_API_KEY is not configured in server environment.',
            success: false
          }));
          return;
        }

        // Dynamic import to keep build bundle lightweight
        const { GoogleGenAI } = await import('@google/genai');

        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });

        let sysInst = systemInstruction;
        if (!sysInst) {
          sysInst = `You are a modern AI assistant equipped with an intelligent ChatGPT-Style Web Search Engine capability, Multimodal Vision + File Understanding System, and an AI Emoji & Smart Response System.

Your responses must be:
- Clear
- Concise
- Professional
- Friendly
- Visually structured

EMOJI RULES & GUIDELINES:
Use relevant emojis naturally to enhance readability and visual structure:
💡 = idea/tip
✅ = correct/confirmed
❌ = error/problem
⚠️ = warning
🔥 = important
🚀 = action/progress
📌 = key information
💻 = coding
🔧 = how it works / configuration
🧠 = explanation / logic
📚 = education / concept
🔍 = search/research
🌐 = web information
🎯 = final answer
🛠️ = fix/tool
⚡ = performance
🔒 = security

- DO NOT use emojis after every sentence.
- Use emojis only when they improve scannability and readability.
- Never put unnecessary emojis inside code blocks or variable names.

FORMATTING RULES:
Use Markdown with proper hierarchy:
## Headings
**Bold text**
*Italic text*
- Bullet lists
1. Numbered lists
\`inline code\`
\`\`\`language
code block
\`\`\`

SPECIALIZED STRUCTURED TEMPLATES:

1. CODING RESPONSES:
💻 **Solution**
[Code block with proper syntax and imports]

🔧 **How it works**
[Concise explanation of the mechanism]

🚀 **Result / Next Steps**
[Expected outcome or execution command]

2. ERROR & DEBUGGING RESPONSES:
❌ **Problem**
[Direct description of the error]

🔍 **Cause**
[Root cause analysis]

✅ **Fix**
[Working fix or corrected code]

3. EDUCATION & CONCEPT RESPONSES:
📚 **Concept**
[Core definition or principle]

🧠 **Easy Explanation**
[Intuitive, clear breakdown]

🎯 **Final Answer**
[Key takeaway or summary]

LANGUAGE MATCHING:
Match the user's language and tone seamlessly:
- English → English
- Hindi → Hindi (हिंदी)
- Hinglish → Hinglish (natural conversational blend)

Keep simple questions short and direct.
Make complex answers structured and easy to scan.`;
        }

        const currentLiveTime = new Date().toLocaleString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZoneName: 'short'
        });

        sysInst = `${sysInst}\n\n[ANTI-HALLUCINATION & REAL-TIME GROUNDING ACTIVE]\n- Current Live Timestamp: ${currentLiveTime} (ISO: ${new Date().toISOString()})\n- Real-Time Google Search Grounding active: ground all facts, names, dates, and current events.\n- Anti-Hallucination Policy: Verify facts before outputting. Correctness > speed.`;

        const config: any = {
          systemInstruction: sysInst,
          temperature: effectiveTemperature,
          tools: [{ googleSearch: {} }],
        };

        let contents: any[] = [];
        if (history && Array.isArray(history) && history.length > 0) {
          for (const msg of history.slice(-10)) {
            if (msg.content && typeof msg.content === 'string' && msg.content.trim()) {
              contents.push({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
              });
            }
          }
        }

        contents.push({
          role: 'user',
          parts: [{ text: prompt }]
        });

        if (stream) {
          // Streaming mode with Server-Sent Events (SSE)
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
          });

          const responseStream = await callGeminiStream(ai, { 
            contents, 
            config,
            preferredModel: effectiveModel 
          });

          for await (const chunk of responseStream) {
            const text = chunk.text || '';
            const groundingMetadata = chunk.candidates?.[0]?.groundingMetadata;
            const groundingChunks = groundingMetadata?.groundingChunks;
            const sources: Array<{ title: string; url: string }> = [];

            if (groundingChunks && Array.isArray(groundingChunks)) {
              groundingChunks.forEach((c: any, index: number) => {
                if (c.web?.uri) {
                  sources.push({
                    title: c.web.title || `Source ${index + 1}`,
                    url: c.web.uri,
                  });
                }
              });
            }

            res.write(`data: ${JSON.stringify({ text, sources, groundingMetadata })}\n\n`);
          }

          res.write('data: [DONE]\n\n');
          res.end();
          return;
        }

        // Non-streaming mode
        const response = await callGeminiModel(ai, { 
          contents, 
          config,
          preferredModel: effectiveModel 
        });

        const text = response.text || '';
        const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
        const groundingChunks = groundingMetadata?.groundingChunks;
        const sources: Array<{ title: string; url: string }> = [];

        if (groundingChunks && Array.isArray(groundingChunks)) {
          groundingChunks.forEach((chunk: any, index: number) => {
            if (chunk.web?.uri) {
              sources.push({
                title: chunk.web.title || `Source ${index + 1}`,
                url: chunk.web.uri,
              });
            }
          });
        }

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          text,
          sources,
          groundingMetadata,
          success: true
        }));
      } catch (err: any) {
        const errMsg = err?.message || 'Gemini API call failed';
        const isRateLimit =
          err?.status === 429 ||
          errMsg.includes('429') ||
          errMsg.includes('quota') ||
          errMsg.includes('RESOURCE_EXHAUSTED') ||
          errMsg.includes('rate limit');

        if (isRateLimit) {
          console.warn('Gemini API quota/rate limit notice: Free tier limit reached.');
        } else {
          console.error('Gemini API endpoint error:', errMsg);
        }

        const statusCode = isRateLimit ? 429 : 500;
        const errorCode = isRateLimit ? 'RATE_LIMIT_EXCEEDED' : 'API_ERROR';
        const userFacingMessage = isRateLimit
          ? 'Gemini API free tier quota or rate limit reached. Please wait a moment before sending another request.'
          : errMsg;

        if (!res.headersSent) {
          res.statusCode = statusCode;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            success: false,
            error: userFacingMessage,
            code: errorCode,
            isRateLimit,
            status: statusCode,
          }));
        } else {
          res.write(`data: ${JSON.stringify({ error: userFacingMessage, isRateLimit, code: errorCode })}\n\n`);
          res.end();
        }
      }
    });
  };

  const handleSearchRequest = async (req: any, res: any) => {
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }

    let body = '';
    req.on('data', (chunk: any) => { body += chunk; });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body || '{}');
        const { query } = data;
        const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

        if (!apiKey) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'GEMINI_API_KEY is not configured', success: false }));
          return;
        }

        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey });

        const response = await callGeminiModel(ai, {
          contents: [{ role: 'user', parts: [{ text: `Perform live web search for: ${query}` }] }],
          config: {
            tools: [{ googleSearch: {} }],
            systemInstruction: 'Provide real-time accurate information based on web search.',
          }
        });

        const text = response.text || '';
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        const sources: Array<{ title: string; url: string }> = [];

        if (groundingChunks && Array.isArray(groundingChunks)) {
          groundingChunks.forEach((chunk: any, index: number) => {
            if (chunk.web?.uri) {
              sources.push({
                title: chunk.web.title || `Source ${index + 1}`,
                url: chunk.web.uri,
              });
            }
          });
        }

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          query,
          summary: text,
          results: text,
          sources,
          success: true
        }));
      } catch (err: any) {
        const errMsg = err?.message || 'Search failed';
        const isRateLimit =
          err?.status === 429 ||
          errMsg.includes('429') ||
          errMsg.includes('quota') ||
          errMsg.includes('RESOURCE_EXHAUSTED') ||
          errMsg.includes('rate limit');

        if (isRateLimit) {
          console.warn('Search API quota/rate limit notice.');
        } else {
          console.error('Search API error:', errMsg);
        }

        res.statusCode = isRateLimit ? 429 : 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          error: isRateLimit ? 'Search rate limit or quota reached. Please try again shortly.' : errMsg,
          isRateLimit,
          success: false
        }));
      }
    });
  };

  const handleAiRequest = async (req: any, res: any) => {
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }

    let body = '';
    req.on('data', (chunk: any) => { body += chunk; });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body || '{}');
        const { message, tools, history = [] } = data;
        const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

        if (!apiKey) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'GEMINI_API_KEY not configured', success: false }));
          return;
        }

        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey });

        let contextInfo = `Runtime Context:\n- Timestamp: ${tools?.runtime?.timestamp || new Date().toISOString()}\n- Timezone: ${tools?.runtime?.timezone || 'UTC'}\n- Online: ${tools?.runtime?.online ?? true}`;
        if (tools?.location) {
          contextInfo += `\n- User Location: Lat ${tools.location.latitude}, Lon ${tools.location.longitude} (Accuracy: ${tools.location.accuracy}m)`;
        }
        if (tools?.realtime?.enabled && tools?.realtime?.results) {
          contextInfo += `\n- Real-time Web Search Results: ${JSON.stringify(tools.realtime.results)}`;
        }

        const sysInst = `You are Rishi AI, an intelligent assistant equipped with real-time web access and precise location context.\n\n${contextInfo}\n\nAnswer the user directly and incorporate location/realtime facts when relevant.`;

        const contents: any[] = [];
        if (Array.isArray(history)) {
          for (const msg of history.slice(-10)) {
            if (msg.content) {
              contents.push({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
              });
            }
          }
        }
        contents.push({ role: 'user', parts: [{ text: message }] });

        const config: any = {
          systemInstruction: sysInst,
          tools: [{ googleSearch: {} }],
        };

        const response = await callGeminiModel(ai, { contents, config });

        const text = response.text || '';
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        const sources: Array<{ title: string; url: string }> = [];

        if (groundingChunks && Array.isArray(groundingChunks)) {
          groundingChunks.forEach((c: any, i: number) => {
            if (c.web?.uri) {
              sources.push({ title: c.web.title || `Source ${i + 1}`, url: c.web.uri });
            }
          });
        }

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          text,
          sources,
          toolsUsed: tools,
          success: true
        }));
      } catch (err: any) {
        const errMsg = err?.message || 'AI request failed';
        const isRateLimit =
          err?.status === 429 ||
          errMsg.includes('429') ||
          errMsg.includes('quota') ||
          errMsg.includes('RESOURCE_EXHAUSTED') ||
          errMsg.includes('rate limit');

        if (isRateLimit) {
          console.warn('AI API quota/rate limit notice.');
        } else {
          console.error('AI endpoint error:', errMsg);
        }

        res.statusCode = isRateLimit ? 429 : 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          error: isRateLimit ? 'AI rate limit or quota reached. Please try again shortly.' : errMsg,
          isRateLimit,
          success: false
        }));
      }
    });
  };

  return {
    name: 'gemini-api-plugin',
    configureServer(server) {
      server.middlewares.use('/api/gemini/chat', handleGeminiRequest);
      server.middlewares.use('/api/search', handleSearchRequest);
      server.middlewares.use('/api/ai', handleAiRequest);
      server.middlewares.use('/api/gemini/stream', (req, res) => {
        req.url = '/api/gemini/chat';
        handleGeminiRequest(req, res);
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/gemini/chat', handleGeminiRequest);
      server.middlewares.use('/api/search', handleSearchRequest);
      server.middlewares.use('/api/ai', handleAiRequest);
      server.middlewares.use('/api/gemini/stream', handleGeminiRequest);
    }
  };
}

export default defineConfig({
  plugins: [react(), geminiApiPlugin()],
  // GitHub Pages serves this repository under /Ai/; local development stays at /.
  base: process.env.GITHUB_ACTIONS ? '/Ai/' : '/',
  define: {
    'process.env.GOOGLE_MAPS_PLATFORM_KEY': JSON.stringify(process.env.GOOGLE_MAPS_PLATFORM_KEY || ''),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
  },
  preview: {
    port: 3000,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
