/**
 * Adaptive Deep Research - Topic Tracker & Semantic Topic Matching
 */

export interface TopicState {
  topicKey: string;
  displayName: string;
  keywords: string[];
  count: number;
  isDeepResearchActive: boolean;
  lastUpdated: number;
}

export interface ThreadTopicTracker {
  threadId: string;
  activeTopicKey: string | null;
  topics: Record<string, TopicState>;
}

const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can', 'can\'t', 'cannot',
  'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down', 'during', 'each',
  'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t', 'have', 'haven\'t', 'having', 'he', 'he\'d',
  'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'how\'s', 'i',
  'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself', 'let\'s',
  'me', 'more', 'most', 'mustn\'t', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or',
  'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'shan\'t', 'she', 'she\'d', 'she\'ll',
  'she\'s', 'should', 'shouldn\'t', 'so', 'some', 'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs',
  'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re', 'they\'ve',
  'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll',
  'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when', 'when\'s', 'where', 'where\'s', 'which', 'while',
  'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t', 'would', 'wouldn\'t', 'you', 'you\'d', 'you\'ll',
  'you\'re', 'you\'ve', 'your', 'yours', 'yourself', 'yourselves', 'tell', 'me', 'please', 'know', 'find', 'search'
]);

const GREETINGS_AND_ACKNOWLEDGMENTS = new Set([
  'hi', 'hello', 'hey', 'hii', 'hiii', 'greetings', 'good morning', 'good afternoon', 'good evening',
  'thanks', 'thank you', 'thankyou', 'thx', 'ok', 'okay', 'got it', 'cool', 'nice', 'great', 'awesome',
  'yes', 'no', 'sure', 'fine', 'perfect', 'alright', 'bye', 'goodbye', 'good night'
]);

const PRONOUNS_AND_REFERENTIALS = [
  'he', 'his', 'him', 'she', 'her', 'hers', 'it', 'its', 'they', 'them', 'their',
  'this', 'that', 'these', 'those', 'there', 'the country', 'the pm', 'the president',
  'the company', 'the leader', 'the minister', 'himself', 'herself', 'itself'
];

export const TOPIC_THRESHOLD_COUNT = 5;
export const TOPIC_SIMILARITY_THRESHOLD = 0.35;

/**
 * Filter out non-topic queries like simple greetings or confirmations.
 */
export function isConversationalFiller(query: string): boolean {
  const clean = query.trim().toLowerCase().replace(/[^\w\s]/g, '');
  if (!clean || clean.length < 2) return true;
  if (GREETINGS_AND_ACKNOWLEDGMENTS.has(clean)) return true;
  
  const words = clean.split(/\s+/);
  if (words.length === 1 && GREETINGS_AND_ACKNOWLEDGMENTS.has(words[0])) return true;
  if (words.length <= 3 && words.every(w => GREETINGS_AND_ACKNOWLEDGMENTS.has(w) || STOP_WORDS.has(w))) {
    return true;
  }
  return false;
}

/**
 * Extract topic tokens and normalized display topic name from a user query.
 */
export function extractQueryTokens(query: string): string[] {
  const clean = query.toLowerCase().replace(/[^\w\s]/g, ' ');
  const tokens = clean.split(/\s+/).filter(w => w.length > 1 && !STOP_WORDS.has(w));
  return tokens;
}

/**
 * Extract normalized topic name from query.
 */
export function extractTopicName(query: string, activeTopicState?: TopicState | null): { key: string; name: string; tokens: string[] } {
  const cleanQuery = query.trim();
  const lowerQuery = cleanQuery.toLowerCase();

  // Check if query contains referential pronouns and we have an active topic
  let resolvedText = cleanQuery;
  const hasPronoun = PRONOUNS_AND_REFERENTIALS.some(p => {
    const regex = new RegExp(`\\b${p}\\b`, 'i');
    return regex.test(lowerQuery);
  });

  if (hasPronoun && activeTopicState) {
    resolvedText = `${cleanQuery} ${activeTopicState.displayName}`;
  }

  const tokens = extractQueryTokens(resolvedText);
  if (tokens.length === 0) {
    return { key: 'general', name: 'General Topic', tokens: [] };
  }

  // Common entity mappings
  if (lowerQuery.includes('prime minister') || lowerQuery.includes('pm of india') || lowerQuery.includes('narendra modi') || lowerQuery.includes('modi')) {
    return { key: 'pm_india', name: 'Prime Minister of India', tokens: ['prime', 'minister', 'pm', 'india', 'modi'] };
  }
  if (lowerQuery.includes('president of us') || lowerQuery.includes('potus') || lowerQuery.includes('us president')) {
    return { key: 'us_president', name: 'President of the United States', tokens: ['president', 'us', 'usa', 'united', 'states'] };
  }
  if (lowerQuery.includes('quantum') && (lowerQuery.includes('computer') || lowerQuery.includes('physics') || lowerQuery.includes('qubit'))) {
    return { key: 'quantum_computing', name: 'Quantum Computing', tokens: ['quantum', 'computing', 'qubit', 'physics'] };
  }
  if (lowerQuery.includes('artificial intelligence') || lowerQuery.includes('ai model') || lowerQuery.includes('llm') || lowerQuery.includes('deep learning')) {
    return { key: 'ai_technology', name: 'Artificial Intelligence', tokens: ['artificial', 'intelligence', 'ai', 'llm', 'learning'] };
  }

  // Default key from top 3 significant tokens
  const keyTokens = tokens.slice(0, 3);
  const key = keyTokens.sort().join('_');
  const name = tokens.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(' ');

  return { key, name, tokens };
}

/**
 * Calculate similarity (0 to 1) between query tokens and a topic state.
 */
export function calculateTopicSimilarity(query: string, topicState: TopicState): number {
  const queryTokens = extractQueryTokens(query);
  if (queryTokens.length === 0 || topicState.keywords.length === 0) return 0;

  const lowerQuery = query.toLowerCase();
  const lowerTopicName = topicState.displayName.toLowerCase();

  // Direct entity or substring match bonus
  if (lowerQuery.includes(lowerTopicName) || lowerTopicName.includes(lowerQuery)) {
    return 0.85;
  }

  // Check pronoun reference to active topic name
  const containsPronoun = PRONOUNS_AND_REFERENTIALS.some(p => {
    const regex = new RegExp(`\\b${p}\\b`, 'i');
    return regex.test(lowerQuery);
  });
  if (containsPronoun && topicState.keywords.some(kw => lowerQuery.includes(kw))) {
    return 0.75;
  }

  // Jaccard similarity between query tokens and topic keywords
  const topicSet = new Set(topicState.keywords);
  let matchCount = 0;

  for (const token of queryTokens) {
    if (topicSet.has(token)) {
      matchCount++;
    } else {
      // Partial stemming match
      for (const kw of topicState.keywords) {
        if (token.length > 3 && kw.length > 3 && (token.startsWith(kw) || kw.startsWith(token))) {
          matchCount += 0.8;
          break;
        }
      }
    }
  }

  const unionSize = new Set([...queryTokens, ...topicState.keywords]).size;
  const similarity = unionSize > 0 ? matchCount / unionSize : 0;

  if (containsPronoun && similarity > 0) {
    return Math.min(1, similarity + 0.3);
  }

  return similarity;
}

/**
 * Global or session-based topic tracker storage.
 */
const sessionTrackers: Record<string, ThreadTopicTracker> = {};

export function getThreadTracker(threadId: string = 'default'): ThreadTopicTracker {
  if (!sessionTrackers[threadId]) {
    sessionTrackers[threadId] = {
      threadId,
      activeTopicKey: null,
      topics: {}
    };
  }
  return sessionTrackers[threadId];
}

export function resetThreadTracker(threadId: string = 'default'): void {
  delete sessionTrackers[threadId];
}

export interface ProcessQueryResult {
  effectiveMode: 'chat' | 'search' | 'research';
  isAutoDeepResearch: boolean;
  topicName: string;
  topicCount: number;
  similarity: number;
}

/**
 * Process user query to update topic tracker and determine effective execution mode.
 */
export function processQueryTopic(
  query: string,
  userRequestedMode: 'chat' | 'search' | 'research',
  threadId: string = 'default'
): ProcessQueryResult {
  const tracker = getThreadTracker(threadId);

  // If user query is a conversational filler (e.g. "hi", "thanks", "ok"), do not increment counters
  if (isConversationalFiller(query)) {
    const activeState = tracker.activeTopicKey ? tracker.topics[tracker.activeTopicKey] : null;
    return {
      effectiveMode: userRequestedMode,
      isAutoDeepResearch: activeState?.isDeepResearchActive && userRequestedMode === 'research',
      topicName: activeState?.displayName || '',
      topicCount: activeState?.count || 0,
      similarity: 1.0,
    };
  }

  // Get active topic state if exists
  const activeTopicState = tracker.activeTopicKey ? tracker.topics[tracker.activeTopicKey] : null;

  // Check similarity with current active topic
  let currentSimilarity = 0;
  if (activeTopicState) {
    currentSimilarity = calculateTopicSimilarity(query, activeTopicState);
  }

  let targetTopicKey: string;
  let targetDisplayName: string;
  let queryTokens = extractQueryTokens(query);

  if (activeTopicState && currentSimilarity >= TOPIC_SIMILARITY_THRESHOLD) {
    // Same topic!
    targetTopicKey = activeTopicState.topicKey;
    targetDisplayName = activeTopicState.displayName;
  } else {
    // Check if query matches any previously tracked topic in this session
    let bestPrevKey: string | null = null;
    let bestPrevSimilarity = 0;

    for (const [key, state] of Object.entries(tracker.topics)) {
      const sim = calculateTopicSimilarity(query, state);
      if (sim >= TOPIC_SIMILARITY_THRESHOLD && sim > bestPrevSimilarity) {
        bestPrevSimilarity = sim;
        bestPrevKey = key;
      }
    }

    if (bestPrevKey) {
      targetTopicKey = bestPrevKey;
      targetDisplayName = tracker.topics[bestPrevKey].displayName;
      currentSimilarity = bestPrevSimilarity;
    } else {
      // New topic!
      const extracted = extractTopicName(query, activeTopicState);
      targetTopicKey = extracted.key;
      targetDisplayName = extracted.name;
      queryTokens = extracted.tokens;
      currentSimilarity = 1.0;
    }
  }

  // Update or create topic state
  if (!tracker.topics[targetTopicKey]) {
    tracker.topics[targetTopicKey] = {
      topicKey: targetTopicKey,
      displayName: targetDisplayName,
      keywords: queryTokens,
      count: 1,
      isDeepResearchActive: false,
      lastUpdated: Date.now(),
    };
  } else {
    const state = tracker.topics[targetTopicKey];
    state.count += 1;
    state.lastUpdated = Date.now();
    // Merge new keywords
    const combined = Array.from(new Set([...state.keywords, ...queryTokens]));
    state.keywords = combined.slice(0, 15);
  }

  // Update active topic key
  tracker.activeTopicKey = targetTopicKey;
  const currentState = tracker.topics[targetTopicKey];

  // Check if count >= TOPIC_THRESHOLD_COUNT (5)
  if (currentState.count >= TOPIC_THRESHOLD_COUNT) {
    currentState.isDeepResearchActive = true;
  }

  // Determine effective mode
  let effectiveMode: 'chat' | 'search' | 'research' = userRequestedMode;
  let isAutoDeepResearch = false;

  if (userRequestedMode === 'research') {
    effectiveMode = 'research';
    isAutoDeepResearch = false;
  } else if (userRequestedMode === 'chat') {
    effectiveMode = 'chat';
    isAutoDeepResearch = false;
  } else if (currentState.isDeepResearchActive) {
    effectiveMode = 'research';
    isAutoDeepResearch = true;
  }

  return {
    effectiveMode,
    isAutoDeepResearch,
    topicName: currentState.displayName,
    topicCount: currentState.count,
    similarity: currentSimilarity,
  };
}
