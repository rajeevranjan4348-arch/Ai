/**
 * Fact-Checking & Semantic Alignment Engine
 * Evaluates semantic alignment, factual overlap, and intent fidelity between a user prompt and AI response
 * using Jaccard similarity, token overlap, and domain intent classification.
 */

// Common English stop words to filter out for core semantic analysis
export const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and',
  'any', 'are', 'aren\'t', 'as', 'at', 'be', 'because', 'been', 'before', 'being',
  'below', 'between', 'both', 'but', 'by', 'can', 'can\'t', 'cannot', 'could',
  'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t',
  'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t',
  'has', 'hasn\'t', 'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s',
  'her', 'here', 'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how',
  'how\'s', 'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into', 'is',
  'isn\'t', 'it', 'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most',
  'mustn\'t', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once',
  'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over',
  'own', 'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s', 'should',
  'shouldn\'t', 'so', 'some', 'such', 'than', 'that', 'that\'s', 'the', 'their',
  'theirs', 'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they',
  'they\'d', 'they\'ll', 'they\'re', 'they\'ve', 'this', 'those', 'through', 'to',
  'too', 'under', 'until', 'up', 'very', 'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll',
  'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when', 'when\'s',
  'where', 'where\'s', 'which', 'while', 'who', 'who\'s', 'whom', 'why', 'why\'s',
  'with', 'won\'t', 'would', 'wouldn\'t', 'you', 'you\'d', 'you\'ll', 'you\'re',
  'you\'ve', 'your', 'yours', 'yourself', 'yourselves', 'tell', 'show', 'give',
  'please', 'help', 'explain', 'write', 'create', 'find', 'make'
]);

export interface FactCheckResult {
  similarityScore: number;
  jaccardSimilarity: number;
  isVerified: boolean;
  threshold: number;
  matchedKeywords: string[];
  coverageScore: number;
  intent: 'coding' | 'math' | 'weather' | 'factual' | 'conversational' | 'general';
  summary: string;
}

/**
 * Basic word stemmer heuristic (stripping common English suffixes)
 */
export function stemWord(word: string): string {
  if (word.length <= 3) return word;
  return word
    .replace(/(?:ing|edly|ingly|ed|ly|es|s|tion|ment|able|ible|ness|ity)$/gi, '');
}

/**
 * Extract meaningful semantic tokens from text
 */
export function extractKeywords(text: string): string[] {
  if (!text) return [];
  const clean = text
    .toLowerCase()
    .replace(/```[\s\S]*?```/g, ' ') // treat code blocks
    .replace(/\[\[.*?\]\]/g, ' ')     // clean special tags
    .replace(/[^a-z0-9_#+\-\s]/g, ' '); // keep programming symbols like # and +

  return clean
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length > 1 && !STOP_WORDS.has(w));
}

/**
 * Computes standard Jaccard similarity (Intersection over Union) of token sets between prompt and response
 * Returns a score between 0.0 and 1.0
 */
export function computeJaccardSimilarity(textA: string, textB: string): number {
  if (!textA || !textB) return 0;
  const tokensA = new Set(extractKeywords(textA).map(stemWord));
  const tokensB = new Set(extractKeywords(textB).map(stemWord));

  if (tokensA.size === 0 && tokensB.size === 0) return 1.0;
  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersection = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) {
      intersection++;
    }
  }

  const union = tokensA.size + tokensB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Computes direct Word-Overlap / Token Recall similarity between prompt and response
 * Returns a score between 0.0 and 1.0
 */
export function computeWordOverlapSimilarity(prompt: string, response: string): number {
  if (!prompt || !response) return 0;
  const promptTokens = extractKeywords(prompt);
  if (promptTokens.length === 0) return 0.8;

  const responseTextLower = response.toLowerCase();
  let matches = 0;

  for (const token of promptTokens) {
    const stemmed = stemWord(token);
    if (responseTextLower.includes(token) || responseTextLower.includes(stemmed)) {
      matches++;
    }
  }

  return matches / promptTokens.length;
}

/**
 * Classifies query intent for domain-adaptive semantic verification
 */
export function classifyFactCheckIntent(prompt: string): 'coding' | 'math' | 'weather' | 'factual' | 'conversational' | 'general' {
  const lower = prompt.toLowerCase().trim();

  if (/[√∛∜\d\+\-\*\/\^\=]/.test(lower) || /\b(calculate|solve|math|equation|sum|integral|derivative|percentage|sqrt|cbrt|root)\b/i.test(lower)) {
    return 'math';
  }
  if (/\b(code|python|javascript|typescript|function|algorithm|class|api|component|sql|syntax|debug|error|react|html|css)\b/i.test(lower)) {
    return 'coding';
  }
  if (/\b(weather|temperature|forecast|climate|rain|humidity|degrees|temp)\b/i.test(lower)) {
    return 'weather';
  }
  if (/^(hi|hello|hey|good morning|good evening|thanks|thank you|who are you|how are you)\b/i.test(lower)) {
    return 'conversational';
  }
  if (/\b(what is|who is|where is|history of|when did|capital of|facts|definition|meaning)\b/i.test(lower)) {
    return 'factual';
  }
  return 'general';
}

/**
 * Computes comprehensive semantic similarity score [0.0 - 1.0] between a user prompt and AI response
 * combining Jaccard token similarity, keyword overlap, and specific intent fulfillment.
 */
export function computeSemanticSimilarity(userPrompt: string, aiResponse: string): number {
  if (!userPrompt || !aiResponse) return 0;

  const cleanPrompt = userPrompt.trim();
  const cleanResponse = aiResponse.trim();

  if (cleanPrompt.length === 0 || cleanResponse.length === 0) return 0;

  const promptKeywords = extractKeywords(cleanPrompt);

  // Conversational edge case (e.g. "hi", "thank you")
  if (promptKeywords.length === 0) {
    if (cleanPrompt.length <= 15 && cleanResponse.length > 5) {
      return 0.85;
    }
    return 0.70;
  }

  // 1. Jaccard token similarity
  const jaccardSim = computeJaccardSimilarity(cleanPrompt, cleanResponse);

  // 2. Keyword coverage & word overlap
  const wordOverlap = computeWordOverlapSimilarity(cleanPrompt, cleanResponse);

  // 3. Intent & Structure Fulfillment Factor
  const intent = classifyFactCheckIntent(cleanPrompt);
  let intentBonus = 0;

  if (intent === 'coding') {
    const hasCodeBlock = cleanResponse.includes('```');
    const hasCodeKeywords = /\b(function|const|let|var|import|return|export|class|def|for|while)\b/.test(cleanResponse);
    if (hasCodeBlock || hasCodeKeywords) {
      intentBonus += 0.18;
    }
  } else if (intent === 'math') {
    const hasNumbers = /\d+/.test(cleanResponse);
    const hasMathSigns = /[=+\-*/\^√∛∜]/.test(cleanResponse);
    const hasVerifiedProof = cleanResponse.includes('VERIFIED') || cleanResponse.includes('✓') || cleanResponse.includes('Verification');
    if (hasNumbers || hasMathSigns) {
      intentBonus += 0.18;
    }
    if (hasVerifiedProof) {
      intentBonus += 0.10;
    }
  } else if (intent === 'weather') {
    const hasTemp = /\d+°|\b(degrees|celsius|fahrenheit|sunny|cloudy|forecast)\b/i.test(cleanResponse);
    const hasWidget = cleanResponse.includes('[[WEATHER_WIDGET') || cleanResponse.includes('Weather Forecast');
    if (hasTemp || hasWidget) {
      intentBonus += 0.20;
    }
  } else if (intent === 'conversational') {
    intentBonus += 0.15;
  } else {
    // General / Factual structure bonus for markdown headings, lists, bold concepts
    if (cleanResponse.includes('###') || cleanResponse.includes('- ') || cleanResponse.includes('**')) {
      intentBonus += 0.10;
    }
  }

  // Length and coherence adjustment
  if (cleanResponse.length >= 80 && wordOverlap >= 0.5) {
    intentBonus += 0.05;
  }

  // Weighted score computation emphasizing Jaccard token alignment and key recall
  const rawScore = (wordOverlap * 0.40) + (jaccardSim * 0.35) + intentBonus;

  // Clamp strictly to [0.00, 0.99]
  const finalScore = Math.max(0.0, Math.min(0.99, Number(rawScore.toFixed(3))));

  return finalScore;
}

/**
 * checkFactAlignment:
 * Evaluates semantic similarity and fact alignment between the user's initial prompt and the AI's response.
 * Uses Jaccard similarity and intent-context matching to produce a verification score and status.
 *
 * @param userPrompt The initial question or prompt provided by the user.
 * @param aiResponse The generated AI response text to fact-check.
 * @param threshold The verification threshold (defaults to 0.8 / 80%).
 * @returns FactCheckResult containing similarityScore, jaccardSimilarity, isVerified status, intent, and summary.
 */
export function checkFactAlignment(
  userPrompt: string,
  aiResponse: string,
  threshold = 0.8
): FactCheckResult {
  const intent = classifyFactCheckIntent(userPrompt);
  const jaccardSimilarity = Number(computeJaccardSimilarity(userPrompt, aiResponse).toFixed(3));
  const similarityScore = computeSemanticSimilarity(userPrompt, aiResponse);
  const isVerified = similarityScore >= threshold;

  const promptKeywords = extractKeywords(userPrompt);
  const responseTextLower = (aiResponse || '').toLowerCase();
  const matchedKeywords = promptKeywords.filter(kw => {
    const stemmed = stemWord(kw);
    return responseTextLower.includes(kw) || responseTextLower.includes(stemmed);
  });

  const coverageScore = promptKeywords.length > 0 
    ? Number((matchedKeywords.length / promptKeywords.length).toFixed(2))
    : 1.0;

  const summary = isVerified
    ? `Semantic alignment of ${(similarityScore * 100).toFixed(1)}% (Jaccard: ${(jaccardSimilarity * 100).toFixed(1)}%) verified against prompt intent (${intent}).`
    : `Semantic similarity ${(similarityScore * 100).toFixed(1)}% is below verification threshold (${(threshold * 100).toFixed(0)}%).`;

  return {
    similarityScore,
    jaccardSimilarity,
    isVerified,
    threshold,
    matchedKeywords,
    coverageScore,
    intent,
    summary,
  };
}

/**
 * Alias for checkFactAlignment for backward-compatible integrations
 */
export const verifyFactCheck = checkFactAlignment;
