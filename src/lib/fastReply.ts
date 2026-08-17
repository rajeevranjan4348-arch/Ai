/**
 * Ultra-Fast Reply Engine for Small Questions & Micro-Inquiries
 * Handles instant calculations, unit conversions, dictionary definitions,
 * common knowledge lookups, programming snippets, HTTP status codes, and
 * fast-path Gemini AI responses (<150ms) for small queries.
 */

import { callGeminiAPI } from './gemini';

export interface FastReplyResult {
  isSmallQuestion: boolean;
  answer?: string;
  category?: 'math' | 'conversion' | 'knowledge' | 'definition' | 'coding' | 'general' | 'science';
  confidence: number; // 0 to 1
  responseTimeMs?: number;
  source?: 'instant_cache' | 'instant_engine' | 'gemini_fast_lite';
}

// 1. Core Quick Knowledge Base (Capitals, Constants, Chemical Elements, World Facts, Tech)
const FAST_KNOWLEDGE_BASE: Record<string, string> = {
  // Constants & Physics
  'speed of light': '**299,792,458 m/s** (approximately **3.00 × 10⁸ m/s** or ~186,282 miles/second in vacuum).',
  'speed of sound': '**343 m/s** (in dry air at 20 °C / 68 °F, or approximately 1,235 km/h / 767 mph).',
  'value of pi': '**π ≈ 3.141592653589793** (commonly approximated as 3.14159 or 22/7).',
  'value of e': '**e ≈ 2.718281828459045** (Euler\'s number, the base of natural logarithms).',
  'acceleration due to gravity': '**g ≈ 9.80665 m/s²** (standard Earth gravity, ~32.174 ft/s²).',
  'gravitational constant': '**G ≈ 6.67430 × 10⁻¹¹ N⋅m²/kg²**.',
  'planck constant': '**h ≈ 6.62607015 × 10⁻³⁴ J⋅s**.',
  'avogadro number': '**N_A ≈ 6.02214076 × 10²³ mol⁻¹**.',
  'boiling point of water': '**100 °C** (212 °F / 373.15 K) at standard atmospheric pressure (1 atm).',
  'freezing point of water': '**0 °C** (32 °F / 273.15 K) at standard atmospheric pressure.',
  'absolute zero': '**0 K** (−273.15 °C or −459.67 °F).',
  'earth to sun distance': 'Approximately **149.6 million kilometers** (93 million miles), defined as **1 Astronomical Unit (AU)**.',
  'earth to moon distance': 'Approximately **384,400 kilometers** (238,855 miles).',
  'radius of earth': 'Mean radius of **6,371 km** (approx. 3,959 miles).',
  'how many days in a year': 'A standard year has **365 days** (a leap year has **366 days**).',
  'how many hours in a week': '**168 hours** (7 days × 24 hours).',
  'how many seconds in a day': '**86,400 seconds** (24 hours × 60 minutes × 60 seconds).',
  'how many minutes in a day': '**1,440 minutes** (24 × 60).',
  'how many weeks in a year': '**52 weeks** (and 1 extra day in standard years, 2 extra days in leap years).',

  // Chemistry
  'chemical formula of water': '**H₂O** (two Hydrogen atoms and one Oxygen atom).',
  'chemical formula of table salt': '**NaCl** (Sodium Chloride).',
  'chemical formula of carbon dioxide': '**CO₂** (Carbon Dioxide).',
  'chemical formula of glucose': '**C₆H₁₂O₆** (Glucose / Dextrose).',
  'chemical formula of methane': '**CH₄** (Methane).',
  'chemical formula of ethanol': '**C₂H₅OH** (Ethanol / Ethyl Alcohol).',
  'chemical formula of ozone': '**O₃** (Trioxygen).',
  'chemical formula of baking soda': '**NaHCO₃** (Sodium Bicarbonate).',
  'chemical formula of bleach': '**NaClO** (Sodium Hypochlorite).',
  'atomic number of hydrogen': '**1** (Symbol: H, standard atomic weight: 1.008 u).',
  'atomic number of helium': '**2** (Symbol: He, noble gas).',
  'atomic number of carbon': '**6** (Symbol: C, nonmetal).',
  'atomic number of nitrogen': '**7** (Symbol: N, gas).',
  'atomic number of oxygen': '**8** (Symbol: O, reactive nonmetal).',
  'atomic number of gold': '**79** (Symbol: Au, transition metal).',
  'atomic number of silver': '**47** (Symbol: Ag, transition metal).',
  'atomic number of iron': '**26** (Symbol: Fe, transition metal).',
  'symbol of gold': '**Au** (from Latin *aurum*).',
  'symbol of silver': '**Ag** (from Latin *argentum*).',
  'symbol of iron': '**Fe** (from Latin *ferrum*).',
  'symbol of lead': '**Pb** (from Latin *plumbum*).',
  'symbol of mercury': '**Hg** (from Greek *hydrargyrum*).',
  'symbol of potassium': '**K** (from Neo-Latin *kalium*).',
  'symbol of sodium': '**Na** (from Neo-Latin *natrium*).',

  // World Capitals
  'capital of france': 'The capital of France is **Paris**.',
  'capital of germany': 'The capital of Germany is **Berlin**.',
  'capital of italy': 'The capital of Italy is **Rome**.',
  'capital of spain': 'The capital of Spain is **Madrid**.',
  'capital of united kingdom': 'The capital of the United Kingdom is **London**.',
  'capital of uk': 'The capital of the United Kingdom is **London**.',
  'capital of japan': 'The capital of Japan is **Tokyo**.',
  'capital of china': 'The capital of China is **Beijing**.',
  'capital of india': 'The capital of India is **New Delhi**.',
  'capital of usa': 'The capital of the United States is **Washington, D.C.**',
  'capital of united states': 'The capital of the United States is **Washington, D.C.**',
  'capital of canada': 'The capital of Canada is **Ottawa**.',
  'capital of australia': 'The capital of Australia is **Canberra**.',
  'capital of russia': 'The capital of Russia is **Moscow**.',
  'capital of brazil': 'The capital of Brazil is **Brasília**.',
  'capital of argentina': 'The capital of Argentina is **Buenos Aires**.',
  'capital of egypt': 'The capital of Egypt is **Cairo**.',
  'capital of south africa': 'South Africa has three capital cities: **Pretoria** (Executive), **Cape Town** (Legislative), and **Bloemfontein** (Judicial).',
  'capital of saudi arabia': 'The capital of Saudi Arabia is **Riyadh**.',
  'capital of uae': 'The capital of the United Arab Emirates is **Abu Dhabi**.',
  'capital of south korea': 'The capital of South Korea is **Seoul**.',
  'capital of turkey': 'The capital of Turkey is **Ankara**.',
  'capital of mexico': 'The capital of Mexico is **Mexico City**.',
  'capital of indonesia': 'The capital of Indonesia is **Jakarta** (transitioning to Nusantara).',
  'capital of thailand': 'The capital of Thailand is **Bangkok** (Krung Thep Maha Nakhon).',
  'capital of switzerland': 'The de facto federal city / capital of Switzerland is **Bern**.',
  'capital of norway': 'The capital of Norway is **Oslo**.',
  'capital of sweden': 'The capital of Sweden is **Stockholm**.',
  'capital of netherlands': 'The capital of the Netherlands is **Amsterdam** (The Hague is the seat of government).',
  'capital of greece': 'The capital of Greece is **Athens**.',
  'capital of portugal': 'The capital of Portugal is **Lisbon**.',
  'capital of singapore': 'The capital of Singapore is **Singapore**.',
  'capital of new zealand': 'The capital of New Zealand is **Wellington**.',

  // Geography & Records
  'largest ocean': 'The **Pacific Ocean** is the largest and deepest ocean on Earth, covering over 165 million km².',
  'highest mountain': '**Mount Everest** (8,848.86 m / 29,031.7 ft above sea level) in the Himalayas.',
  'longest river': 'The **Nile River** (approx. 6,650 km / 4,132 miles), closely followed by the **Amazon River**.',
  'largest desert': 'The **Antarctic Desert** is the largest desert overall (polar), while the **Sahara** is the largest hot desert.',
  'largest country by area': '**Russia** (approx. 17.1 million km² / 6.6 million sq miles).',
  'most populous country': '**India** (surpassing China with over 1.43 billion people).',
  'powerhouse of the cell': 'The **mitochondrion** (mitochondria) is known as the powerhouse of the cell because it produces cellular energy (ATP).',
  'who discovered penicillin': '**Alexander Fleming** in 1928.',
  'who invented the telephone': '**Alexander Graham Bell** (patented in 1876).',
  'who invented the light bulb': '**Thomas Edison** (commercial practical bulb, 1879) and **Joseph Swan**.',
  'who developed the theory of relativity': '**Albert Einstein** (Special relativity in 1905, General relativity in 1915).',

  // Common Greetings & Quick Banter
  'hello': 'Hello! How can I assist you with your research or questions today?',
  'hi': 'Hi there! What can I help you find or calculate today?',
  'hey': 'Hey! Ready to help you with instant answers and in-depth research.',
  'who are you': 'I am **Rishi AI**, your lightning-fast intelligent research and assistance agent powered by Gemini.',
  'what can you do': 'I can provide **instant answers to calculations and quick facts**, conduct **deep web research**, execute Python/JS code, summarize conversations, generate media, and organize notes.',
  'thank you': 'You\'re very welcome! Let me know if you need anything else.',
  'thanks': 'Glad I could help! Feel free to ask more questions anytime.',
};

// 2. Dictionary Definitions (Instant Lookup)
const FAST_DEFINITIONS: Record<string, { definition: string; partOfSpeech: string; example: string }> = {
  'algorithm': {
    partOfSpeech: 'noun',
    definition: 'A step-by-step procedure or set of rules to be followed in calculations or problem-solving operations, especially by a computer.',
    example: 'Search engines use sophisticated algorithms to rank web pages.'
  },
  'serendipity': {
    partOfSpeech: 'noun',
    definition: 'The occurrence and development of events by chance in a happy or beneficial way.',
    example: 'Finding my dream job while browsing casual articles was pure serendipity.'
  },
  'ubiquitous': {
    partOfSpeech: 'adjective',
    definition: 'Present, appearing, or found everywhere at the same time.',
    example: 'Smartphones have become ubiquitous across modern society.'
  },
  'ephemeral': {
    partOfSpeech: 'adjective',
    definition: 'Lasting for a very short time; fleeting or momentary.',
    example: 'Social media stories offer an ephemeral glimpse into daily moments.'
  },
  'paradigm': {
    partOfSpeech: 'noun',
    definition: 'A typical example or pattern of something; a model or overarching framework.',
    example: 'Quantum computing represents a major paradigm shift in computer science.'
  },
  'entropy': {
    partOfSpeech: 'noun',
    definition: 'A measure of thermal energy unavailable for work, or a thermodynamic measure of disorder and randomness in a closed system.',
    example: 'According to the second law of thermodynamics, entropy in an isolated system always increases.'
  },
  'photosynthesis': {
    partOfSpeech: 'noun',
    definition: 'The biological process by which green plants and other organisms use sunlight to synthesize nutrients from carbon dioxide and water.',
    example: 'Photosynthesis generates oxygen as a byproduct, sustaining aerobic life on Earth.'
  },
  'dna': {
    partOfSpeech: 'noun',
    definition: 'Deoxyribonucleic acid, a self-replicating material present in nearly all living organisms that carries genetic instructions.',
    example: 'DNA double helix structure was uncovered by Watson, Crick, Franklin, and Wilkins.'
  },
  'api': {
    partOfSpeech: 'noun',
    definition: 'Application Programming Interface, a set of protocols, routines, and tools for building software and allowing applications to communicate.',
    example: 'The web app connects to the weather API to fetch live forecasts.'
  },
  'recursion': {
    partOfSpeech: 'noun',
    definition: 'A programming and mathematical technique where a function or formula calls itself to solve smaller instances of the same problem.',
    example: 'Calculating factorial numbers is a classic example of recursion.'
  },
  'http': {
    partOfSpeech: 'noun',
    definition: 'Hypertext Transfer Protocol, the foundational protocol used for transmitting hypermedia documents across the World Wide Web.',
    example: 'HTTP/2 and HTTP/3 offer multiplexed connections over secure TLS.'
  },
  'json': {
    partOfSpeech: 'noun',
    definition: 'JavaScript Object Notation, a lightweight data-interchange format that is easy for humans to read and write, and easy for machines to parse.',
    example: 'REST APIs communicate structured state using JSON payloads.'
  },
  'rest': {
    partOfSpeech: 'noun',
    definition: 'Representational State Transfer, a software architectural style that defines a set of constraints for creating web services.',
    example: 'The RESTful API provides standard GET, POST, PUT, and DELETE endpoints.'
  },
  'sql': {
    partOfSpeech: 'noun',
    definition: 'Structured Query Language, a domain-specific language used in programming and designed for managing data held in a relational database management system.',
    example: 'SQL queries enable fast filtering and aggregations across relational tables.'
  },
  'llm': {
    partOfSpeech: 'noun',
    definition: 'Large Language Model, a type of artificial intelligence algorithm that uses deep learning and vast datasets to recognize, summarize, translate, predict, and generate text.',
    example: 'Gemini is a state-of-the-art multimodal LLM developed by Google.'
  }
};

// 3. Instant HTTP Status Codes
const HTTP_STATUS_CODES: Record<string, string> = {
  '200': '**200 OK**: The standard response for successful HTTP requests.',
  '201': '**201 Created**: The request has been fulfilled and resulted in a new resource being created.',
  '204': '**204 No Content**: The server successfully processed the request, but is not returning any content.',
  '301': '**301 Moved Permanently**: This and all future requests should be directed to the given URI.',
  '302': '**302 Found (Temporary Redirect)**: The requested resource resides temporarily under a different URI.',
  '304': '**304 Not Modified**: Indicates that the resource has not been modified since the version specified by request headers.',
  '400': '**400 Bad Request**: The server cannot or will not process the request due to perceived client error (e.g., malformed syntax).',
  '401': '**401 Unauthorized**: Authentication is required and has failed or has not yet been provided.',
  '403': '**403 Forbidden**: The request contained valid data and was understood, but the server refuses action (permission denied).',
  '404': '**404 Not Found**: The requested resource could not be found but may be available in the future.',
  '405': '**405 Method Not Allowed**: A request method is not supported for the requested resource (e.g., POST on a read-only endpoint).',
  '429': '**429 Too Many Requests**: The user has sent too many requests in a given amount of time (Rate Limiting).',
  '500': '**500 Internal Server Error**: A generic error message when an unexpected condition was encountered on the server.',
  '502': '**502 Bad Gateway**: The server, acting as a gateway or proxy, received an invalid response from the upstream server.',
  '503': '**503 Service Unavailable**: The server cannot handle the request (due to overload or maintenance).',
  '504': '**504 Gateway Timeout**: The server, acting as a gateway, did not receive a timely response from an upstream server.',
};

/**
 * Computes Instant Math & Scientific Calculations
 */
export function solveInstantMath(query: string): string | null {
  const clean = query.trim().replace(/[?!=]+$/, '').trim();
  const lower = clean.toLowerCase();

  // 1. Direct arithmetic square roots
  const sqrtMatch = lower.match(/(?:sqrt\s*\(\s*([0-9.]+)\s*\)|square\s+root\s+of\s+([0-9.]+))/i);
  if (sqrtMatch) {
    const val = parseFloat(sqrtMatch[1] || sqrtMatch[2]);
    if (!isNaN(val) && val >= 0) {
      const res = Math.sqrt(val);
      return `**√${val} = ${Number.isInteger(res) ? res : res.toFixed(6).replace(/\.?0+$/, '')}**\n\n### 🧮 Instant Calculation:\n$$\\sqrt{${val}} = ${res}$$`;
    }
  }

  // Powers: "2^8" or "2 to the power of 8"
  const powerMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:\^|\*\*|\s+to\s+the\s+power\s+of\s+)(\d+(?:\.\d+)?)/i);
  if (powerMatch) {
    const base = parseFloat(powerMatch[1]);
    const exp = parseFloat(powerMatch[2]);
    if (!isNaN(base) && !isNaN(exp) && exp <= 1000) {
      const res = Math.pow(base, exp);
      return `**${base}^${exp} = ${res.toLocaleString()}**\n\n### 🧮 Exponential Evaluation:\n$$${base}^{${exp}} = ${res}$$`;
    }
  }

  // Percentages: "20% of 1500" or "what is 15 percent of 80"
  const pctMatch = lower.match(/(?:what\s+is\s+)?(\d+(?:\.\d+)?)\s*(?:%|percent)\s*(?:of)\s*(\d+(?:\.\d+)?)/i);
  if (pctMatch) {
    const pct = parseFloat(pctMatch[1]);
    const total = parseFloat(pctMatch[2]);
    const res = (pct / 100) * total;
    return `**${pct}% of ${total} = ${res.toLocaleString()}**\n\n### 🧮 Step-by-Step:\n$$\\frac{${pct}}{100} \\times ${total} = ${res}$$`;
  }

  // Factorials: "6!" or "factorial of 6"
  const factMatch = lower.match(/(?:factorial\s+of\s+|factorial\s+)?(\d+)!?/i);
  if (lower.includes('factorial') || clean.endsWith('!')) {
    if (factMatch) {
      const n = parseInt(factMatch[1], 10);
      if (!isNaN(n) && n >= 0 && n <= 170) {
        let f = 1;
        for (let i = 2; i <= n; i++) f *= i;
        return `**${n}! = ${f.toLocaleString()}**\n\n### 🧮 Mathematical Definition:\n$$${n}! = ${n === 0 ? '1' : Array.from({length: Math.min(n, 8)}, (_, i) => i + 1).join(' \\times ') + (n > 8 ? ' \\times \\dots' : '')} = ${f.toLocaleString()}$$`;
      }
    }
  }

  // General expression evaluation
  const cleanExpr = clean
    .replace(/^(what\s+is|calculate|evaluate|solve|compute)\s+/i, '')
    .replace(/\s*=\s*$/, '')
    .trim();

  if (/^[0-9\s+\-*/().^]+$/.test(cleanExpr) && /[0-9]/.test(cleanExpr) && /[+\-*/^]/.test(cleanExpr)) {
    try {
      const sanitized = cleanExpr.replace(/\^/g, '**');
      const fn = new Function(`return (${sanitized})`);
      const val = fn();
      if (typeof val === 'number' && !isNaN(val) && isFinite(val)) {
        const formatted = Number.isInteger(val) ? val.toLocaleString() : parseFloat(val.toFixed(8)).toString();
        return `**${cleanExpr} = ${formatted}**\n\n### 🧮 Result:\n$$${cleanExpr} = ${formatted}$$`;
      }
    } catch {
      // Fallback
    }
  }

  return null;
}

/**
 * Computes Instant Unit & Currency Conversions
 */
export function solveInstantConversion(query: string): string | null {
  const clean = query.trim().toLowerCase();

  // Temperatures
  const tempFtoC = clean.match(/(?:convert\s+)?(-?\d+(?:\.\d+)?)\s*(?:°|deg|degrees?)?\s*(f|fahrenheit)\s*(?:to|in)\s*(c|celsius)/i);
  if (tempFtoC) {
    const val = parseFloat(tempFtoC[1]);
    const res = ((val - 32) * 5 / 9).toFixed(2);
    return `**${val} °F = ${res} °C**\n\n### 🌡️ Temperature Conversion:\n$$(${val}^\\circ\\text{F} - 32) \\times \\frac{5}{9} = ${res}^\\circ\\text{C}$$`;
  }

  const tempCtoF = clean.match(/(?:convert\s+)?(-?\d+(?:\.\d+)?)\s*(?:°|deg|degrees?)?\s*(c|celsius)\s*(?:to|in)\s*(f|fahrenheit)/i);
  if (tempCtoF) {
    const val = parseFloat(tempCtoF[1]);
    const res = ((val * 9 / 5) + 32).toFixed(2);
    return `**${val} °C = ${res} °F**\n\n### 🌡️ Temperature Conversion:\n$$(${val}^\\circ\\text{C} \\times \\frac{9}{5}) + 32 = ${res}^\\circ\\text{F}$$`;
  }

  // Lengths / Distances
  const kmToMi = clean.match(/(?:convert\s+)?(\d+(?:\.\d+)?)\s*(km|kilometers?)\s*(?:to|in)\s*(miles?|mi)/i);
  if (kmToMi) {
    const val = parseFloat(kmToMi[1]);
    const res = (val * 0.621371).toFixed(4);
    return `**${val} km = ${res} miles**\n\n### 📏 Distance Conversion:\n$${val} \\times 0.621371 \\approx ${res}\\text{ miles}$`;
  }

  const miToKm = clean.match(/(?:convert\s+)?(\d+(?:\.\d+)?)\s*(miles?|mi)\s*(?:to|in)\s*(km|kilometers?)/i);
  if (miToKm) {
    const val = parseFloat(miToKm[1]);
    const res = (val * 1.60934).toFixed(4);
    return `**${val} miles = ${res} km**\n\n### 📏 Distance Conversion:\n$${val} \\times 1.60934 \\approx ${res}\\text{ km}$`;
  }

  // Mass / Weight
  const kgToLbs = clean.match(/(?:convert\s+)?(\d+(?:\.\d+)?)\s*(kg|kilograms?)\s*(?:to|in)\s*(lbs?|pounds?)/i);
  if (kgToLbs) {
    const val = parseFloat(kgToLbs[1]);
    const res = (val * 2.20462).toFixed(2);
    return `**${val} kg = ${res} lbs**\n\n### ⚖️ Weight Conversion:\n$${val} \\times 2.20462 \\approx ${res}\\text{ lbs}$`;
  }

  const lbsToKg = clean.match(/(?:convert\s+)?(\d+(?:\.\d+)?)\s*(lbs?|pounds?)\s*(?:to|in)\s*(kg|kilograms?)/i);
  if (lbsToKg) {
    const val = parseFloat(lbsToKg[1]);
    const res = (val / 2.20462).toFixed(2);
    return `**${val} lbs = ${res} kg**\n\n### ⚖️ Weight Conversion:\n$${val} \\div 2.20462 \\approx ${res}\\text{ kg}$`;
  }

  // Digital Storage
  const gbToMb = clean.match(/(?:convert\s+)?(\d+(?:\.\d+)?)\s*(gb|gigabytes?)\s*(?:to|in)\s*(mb|megabytes?)/i);
  if (gbToMb) {
    const val = parseFloat(gbToMb[1]);
    const res = (val * 1024).toLocaleString();
    return `**${val} GB = ${res} MB** (in binary $1024\\text{ MB} = 1\\text{ GB}$).`;
  }

  const tbToGb = clean.match(/(?:convert\s+)?(\d+(?:\.\d+)?)\s*(tb|terabytes?)\s*(?:to|in)\s*(gb|gigabytes?)/i);
  if (tbToGb) {
    const val = parseFloat(tbToGb[1]);
    const res = (val * 1024).toLocaleString();
    return `**${val} TB = ${res} GB** (in binary $1024\\text{ GB} = 1\\text{ TB}$).`;
  }

  return null;
}

/**
 * Instant Dictionary & Definition Resolver
 */
export function solveInstantDefinition(query: string): string | null {
  const clean = query.trim().toLowerCase().replace(/[?!.]+$/, '');

  const defMatch = clean.match(/(?:define|definition\s+of|meaning\s+of|what\s+is\s+the\s+meaning\s+of|what\s+does\s+([a-z]+)\s+mean)\s*([a-z]+)?/i);
  const targetWord = (defMatch ? (defMatch[2] || defMatch[1]) : clean).trim().toLowerCase();

  if (targetWord && FAST_DEFINITIONS[targetWord]) {
    const entry = FAST_DEFINITIONS[targetWord];
    const cap = targetWord.charAt(0).toUpperCase() + targetWord.slice(1);
    return `### 📖 Definition: **${cap}** (*${entry.partOfSpeech}*)\n\n${entry.definition}\n\n- **Example:** *"${entry.example}"*`;
  }

  // HTTP Status Code check
  const httpMatch = clean.match(/(?:http\s*(?:status\s*)?(?:code\s*)?|status\s*)(\d{3})/i);
  if (httpMatch && HTTP_STATUS_CODES[httpMatch[1]]) {
    return `### 🌐 HTTP Status Code ${httpMatch[1]}\n\n${HTTP_STATUS_CODES[httpMatch[1]]}`;
  }

  return null;
}

/**
 * Instant Knowledge Base Lookup (Capitals, Physics Constants, Inventions)
 */
export function solveInstantKnowledge(query: string): string | null {
  const clean = query
    .trim()
    .toLowerCase()
    .replace(/[?!.,]+$/, '')
    .replace(/^(what\s+is\s+the|what\s+is|who\s+is\s+the|who\s+is|who\s+was\s+the|who\s+was|tell\s+me\s+the|find\s+the)\s+/i, '')
    .trim();

  // 1. Direct match
  if (FAST_KNOWLEDGE_BASE[clean]) {
    return FAST_KNOWLEDGE_BASE[clean];
  }

  // 2. Fuzzy match keys
  for (const [key, value] of Object.entries(FAST_KNOWLEDGE_BASE)) {
    if (clean === key || clean.includes(key) || key.includes(clean)) {
      return value;
    }
  }

  return null;
}

/**
 * Main Entry Point: Detects and resolves ultra-fast reply for small questions.
 * Returns FastReplyResult in <1ms for cache/computation hits.
 */
export function getUltraFastReply(query: string): FastReplyResult {
  const startTime = performance.now();
  const trimmed = query.trim();
  const lower = trimmed.toLowerCase();
  const wordCount = trimmed.split(/\s+/).length;

  // Rule 0: If request is explicitly deep research or long prompt, it's not a small question
  if (
    wordCount > 25 ||
    lower.includes('deep search') ||
    lower.includes('deep research') ||
    lower.includes('comprehensive report') ||
    lower.includes('detailed breakdown') ||
    lower.includes('write an essay') ||
    lower.includes('build an entire')
  ) {
    return {
      isSmallQuestion: false,
      confidence: 0,
      responseTimeMs: Math.round(performance.now() - startTime),
    };
  }

  // 1. Try Instant Math Calculation
  const mathAnswer = solveInstantMath(trimmed);
  if (mathAnswer) {
    return {
      isSmallQuestion: true,
      category: 'math',
      answer: mathAnswer,
      confidence: 1.0,
      responseTimeMs: Math.round(performance.now() - startTime),
      source: 'instant_engine',
    };
  }

  // 2. Try Instant Conversion
  const conversionAnswer = solveInstantConversion(trimmed);
  if (conversionAnswer) {
    return {
      isSmallQuestion: true,
      category: 'conversion',
      answer: conversionAnswer,
      confidence: 1.0,
      responseTimeMs: Math.round(performance.now() - startTime),
      source: 'instant_engine',
    };
  }

  // 3. Try Instant Dictionary Definition & HTTP Status
  const defAnswer = solveInstantDefinition(trimmed);
  if (defAnswer) {
    return {
      isSmallQuestion: true,
      category: 'definition',
      answer: defAnswer,
      confidence: 1.0,
      responseTimeMs: Math.round(performance.now() - startTime),
      source: 'instant_cache',
    };
  }

  // 4. Try Instant Curated Knowledge
  const kbAnswer = solveInstantKnowledge(trimmed);
  if (kbAnswer) {
    return {
      isSmallQuestion: true,
      category: 'knowledge',
      answer: kbAnswer,
      confidence: 1.0,
      responseTimeMs: Math.round(performance.now() - startTime),
      source: 'instant_cache',
    };
  }

  // 5. Short Question Flag (under 12 words) that qualifies for ultra-fast low-latency stream
  const isSmallCandidate = wordCount <= 12;

  return {
    isSmallQuestion: isSmallCandidate,
    category: isSmallCandidate ? 'general' : undefined,
    confidence: isSmallCandidate ? 0.9 : 0.2,
    responseTimeMs: Math.round(performance.now() - startTime),
  };
}

/**
 * Executes a dedicated Ultra-Fast Gemini API call for small questions
 * using gemini-3.1-flash-lite with low latency temperature.
 */
export async function executeFastGeminiReply(query: string): Promise<FastReplyResult> {
  const startTime = performance.now();
  
  // First check instant local engine
  const localResult = getUltraFastReply(query);
  if (localResult.answer) {
    return localResult;
  }

  try {
    const response = await callGeminiAPI({
      prompt: query,
      mode: 'chat',
      model: 'gemini-3.1-flash-lite',
      turboMode: true,
      temperature: 0.2,
      systemInstruction: 'You are a modern ultra-fast AI assistant. Provide direct, concise, and accurate answers in clean Markdown with natural structured emojis (💡, ✅, 🚀, 📌, 💻, 🎯) where relevant. Avoid unnecessary preamble.',
    });

    if (response.success && response.text) {
      return {
        isSmallQuestion: true,
        category: 'general',
        answer: response.text.trim(),
        confidence: 0.95,
        responseTimeMs: Math.round(performance.now() - startTime),
        source: 'gemini_fast_lite',
      };
    }
  } catch (err) {
    console.warn('Fast Gemini reply error:', err);
  }

  return {
    isSmallQuestion: false,
    confidence: 0,
    responseTimeMs: Math.round(performance.now() - startTime),
  };
}
