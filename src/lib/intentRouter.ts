import { getCityAndWeatherContext } from './weatherService';

export type IntentType = 'conversation' | 'web';
export type AutoSearchMode = 'chat' | 'search' | 'research';

export interface AutoRoutingResult {
  mode: AutoSearchMode;
  intent: IntentType;
  pluginId?: string;
  isDeepSearch: boolean;
  isWebSearch: boolean;
  reason: string;
}

/**
 * Automatically classifies a user's question into 'chat', 'search', or 'research' (Deep Search)
 * and determines if plugins should be activated.
 */
export function classifyAutoSearchMode(
  message: string,
  options?: { topicCount?: number; isAutoDeepResearch?: boolean }
): AutoRoutingResult {
  const text = message.trim();
  const lower = text.toLowerCase();

  if (!text) {
    return {
      mode: 'chat',
      intent: 'conversation',
      isDeepSearch: false,
      isWebSearch: false,
      reason: 'Empty query',
    };
  }

  // 1. Check if user already explicitly prefixed with [PLUGIN:id]
  const explicitPluginMatch = text.match(/^\[PLUGIN:([^\]]+)\]/i);
  if (explicitPluginMatch) {
    const pId = explicitPluginMatch[1].toLowerCase();
    return {
      mode: pId === 'deep-search' ? 'research' : 'chat',
      intent: pId === 'web-search' || pId === 'deep-search' ? 'web' : 'conversation',
      pluginId: pId,
      isDeepSearch: pId === 'deep-search',
      isWebSearch: pId === 'web-search',
      reason: `Explicit plugin [PLUGIN:${pId}]`,
    };
  }

  // 2. Image Generation Plugin Intent Detection
  if (
    /^(generate|create|make|draw|render|show me|produce)\s+(an?|the)?\s*(image|picture|photo|illustration|drawing|artwork|portrait|wallpaper|visual|graphic)\b/i.test(lower) ||
    /\b(image|picture|photo)\s+(of|for|showing)\b/i.test(lower) ||
    /^(draw|sketch|render)\s+/i.test(lower)
  ) {
    return {
      mode: 'chat',
      intent: 'conversation',
      pluginId: 'image-gen',
      isDeepSearch: false,
      isWebSearch: false,
      reason: 'Image generation plugin triggered',
    };
  }

  // 3. Video / Storyboard Plugin Intent Detection
  if (
    /^(generate|create|make|render|produce)\s+(a|an|the)?\s*(video|animation|clip|movie scene|storyboard)\b/i.test(lower) ||
    /\b(video|animation)\s+(of|for|about)\b/i.test(lower)
  ) {
    return {
      mode: 'chat',
      intent: 'conversation',
      pluginId: 'video-gen',
      isDeepSearch: false,
      isWebSearch: false,
      reason: 'Video creation plugin triggered',
    };
  }

  // 4. Study / Flashcards Plugin Intent Detection
  if (
    /\b(flashcards?|quiz|study guide|practice test|make a quiz|create flashcards)\b/i.test(lower)
  ) {
    return {
      mode: 'chat',
      intent: 'conversation',
      pluginId: 'study-companion',
      isDeepSearch: false,
      isWebSearch: false,
      reason: 'Study companion plugin triggered',
    };
  }

  // 5. DEEP SEARCH (RESEARCH) MODE - Deep analysis, comprehensive report, multi-step investigation
  const deepResearchPatterns = [
    /\b(deep\s*(search|research|dive|analysis|investigation|exploration))\b/i,
    /\b(comprehensive\s+(report|analysis|guide|review|comparison|breakdown))\b/i,
    /\b(in-depth\s+(analysis|report|guide|study|explanation|comparison))\b/i,
    /\b(compare\s+.+\s+(in detail|thoroughly|comprehensively|pros and cons|depth))\b/i,
    /\b(detailed\s+(breakdown|comparison|overview|investigation|study|analysis))\b/i,
    /\b(systematic\s+review|academic\s+synthesis|literature\s+review|exhaustive\s+research)\b/i,
    /\b(multi-faceted\s+analysis|step-by-step\s+deep\s+dive|thoroughly\s+research)\b/i,
    /\b(pros\s+and\s+cons\s+in\s+detail|state\s+of\s+the\s+art\s+analysis)\b/i,
    /\b(full\s+market\s+research|industry\s+analysis\s+report)\b/i,
  ];

  if (
    deepResearchPatterns.some(p => p.test(lower)) ||
    options?.isAutoDeepResearch ||
    (options?.topicCount && options.topicCount >= 3)
  ) {
    return {
      mode: 'research',
      intent: 'web',
      pluginId: 'deep-search',
      isDeepSearch: true,
      isWebSearch: true,
      reason: 'Deep multi-step research intent detected',
    };
  }

  // 6. GREETINGS & CASUAL TALK -> Pure Chat (No web search)
  const greetings = [
    "hi", "hello", "hey", "hii", "hiii", "good morning", "good afternoon",
    "good evening", "how are you", "what's up", "whats up", "yo", "sup"
  ];
  if (greetings.includes(lower)) {
    return {
      mode: 'chat',
      intent: 'conversation',
      isDeepSearch: false,
      isWebSearch: false,
      reason: 'Greeting',
    };
  }

  const casualPatterns = [
    /^how are you\b/i,
    /^who are you\b/i,
    /^what can you do\b/i,
    /^thank you\b/i,
    /^thanks\b/i,
    /^bye\b/i,
    /^good night\b/i,
    /^help me\b/i,
  ];
  if (casualPatterns.some(p => p.test(lower))) {
    return {
      mode: 'chat',
      intent: 'conversation',
      isDeepSearch: false,
      isWebSearch: false,
      reason: 'Casual conversation',
    };
  }

  // 7. WEB SEARCH (REAL-TIME FACTS & CURRENT EVENTS) -> Web Search Mode
  const roleQueryPatterns = [
    /who\s+(is|was|currently\s+is)\s+(the\s+)?(current\s+)?(prime\s+minister|president|ceo|chief\s+minister|governor|chancellor|head|founder|director|leader|chairman|secretary|minister|mayor|captain|coach)\s+(of|in|for)\b/i,
    /who\s+holds\s+the\s+office\s+of\b/i,
    /who\s+is\s+in\s+charge\s+of\b/i,
    /^who\s+is\s+the\s+/i,
    /^who\s+is\s+current\s+/i,
    /^who\s+won\s+(the\s+)?/i,
    /^who\s+is\s+leading\s+/i,
  ];

  const currentEventKeywords = [
    "latest news",
    "latest updates",
    "today's news",
    "what happened today",
    "what happened in",
    "current price of",
    "stock price of",
    "live score",
    "score of",
    "current population",
    "released in 2024",
    "released in 2025",
    "released in 2026",
    "recent events",
    "search on web",
    "search the web",
    "search google",
    "look up",
    "find on internet",
    "on the web",
  ];

  if (
    roleQueryPatterns.some(p => p.test(lower)) ||
    currentEventKeywords.some(kw => lower.includes(kw)) ||
    /^(search|find|lookup|look up)\s+/i.test(lower)
  ) {
    return {
      mode: 'search',
      intent: 'web',
      pluginId: 'web-search',
      isDeepSearch: false,
      isWebSearch: true,
      reason: 'Real-time facts / web search intent detected',
    };
  }

  // 8. General AI Chat (Coding, math, creative writing, explanations)
  return {
    mode: 'chat',
    intent: 'conversation',
    isDeepSearch: false,
    isWebSearch: false,
    reason: 'Standard conversational AI response',
  };
}

export function detectIntent(message: string): IntentType { 
  const res = classifyAutoSearchMode(message);
  return res.intent;
}

/**
 * Enriches system prompt with real-time city and weather context
 */
export async function enrichPromptWithWeatherContext(prompt: string, existingSystemInstruction?: string): Promise<{ prompt: string; systemInstruction: string }> {
  const weatherContext = await getCityAndWeatherContext(prompt);

  const enrichedSystemInstruction = existingSystemInstruction
    ? `${existingSystemInstruction}\n\n${weatherContext}`
    : `You are a modern AI assistant equipped with an AI Emoji & Smart Response System.
Your responses must be clear, concise, professional, friendly, and visually structured.
Use relevant emojis naturally (💡, ✅, ❌, ⚠️, 🔥, 🚀, 📌, 💻, 🔧, 🧠, 📚, 🔍, 🎯, ⚡).
Format with Markdown. Match user language (English, Hindi, Hinglish).\n${weatherContext}`;

  return {
    prompt,
    systemInstruction: enrichedSystemInstruction,
  };
}


