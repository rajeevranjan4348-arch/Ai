export type QuestionTopic =
  | 'math'
  | 'coding'
  | 'science'
  | 'web_search'
  | 'image'
  | 'file'
  | 'general';

export interface QuestionTopicDetails {
  topic: QuestionTopic;
  label: string;
  description: string;
  thinkingWords: string[];
}

export const ALL_THINKING_WORDS = [
  "Thinking...",
  "Understanding your question",
  "Categorizing query...",
  "Analyzing your request",
  "Identifying what you need",
  "Searching the web",
  "Finding relevant information",
  "Finding relevant sources",
  "Opening sources",
  "Reading sources",
  "Checking sources",
  "Verifying information",
  "Cross-checking sources",
  "Comparing information",
  "Looking for recent updates",
  "Checking the latest information",
  "Gathering information",
  "Connecting the information",
  "Calculating",
  "Verifying calculations",
  "Processing the data",
  "Analyzing the data",
  "Reading the file",
  "Analyzing the file",
  "Examining the image",
  "Understanding the image",
  "Writing the code",
  "Checking the code",
  "Testing the code",
  "Fixing the issue",
  "Formulating hypothesis",
  "Evaluating empirical evidence",
  "Connecting scientific concepts",
  "Generating a response",
  "Organizing the answer",
  "Preparing the answer",
  "Finalizing the response",
  "Done"
] as const;

export const TOPIC_THINKING_MAPPINGS: Record<QuestionTopic, QuestionTopicDetails> = {
  math: {
    topic: 'math',
    label: 'Mathematics & Calculation',
    description: 'Solving mathematical equations, calculations, algebra, and numerical reasoning.',
    thinkingWords: [
      "Thinking...",
      "Understanding your question",
      "Categorizing query: Mathematics",
      "Analyzing your request",
      "Identifying mathematical principles",
      "Formulating equations",
      "Calculating",
      "Processing the data",
      "Analyzing the data",
      "Verifying calculations",
      "Connecting the information",
      "Generating a response",
      "Organizing the answer",
      "Preparing the answer",
      "Finalizing the response"
    ]
  },
  coding: {
    topic: 'coding',
    label: 'Coding & Software Engineering',
    description: 'Analyzing, writing, testing, and debugging source code and algorithms.',
    thinkingWords: [
      "Thinking...",
      "Understanding your question",
      "Categorizing query: Coding & Software",
      "Analyzing your request",
      "Identifying code requirements",
      "Analyzing syntax & dependencies",
      "Writing the code",
      "Checking the code",
      "Testing the code",
      "Fixing the issue",
      "Generating a response",
      "Organizing the answer",
      "Preparing the answer",
      "Finalizing the response"
    ]
  },
  science: {
    topic: 'science',
    label: 'Science & Theoretical Analysis',
    description: 'Applying scientific concepts, empirical evidence, physics, biology, and chemistry.',
    thinkingWords: [
      "Thinking...",
      "Understanding your question",
      "Categorizing query: Scientific Analysis",
      "Analyzing your request",
      "Identifying scientific principles",
      "Formulating hypothesis & theory",
      "Evaluating empirical evidence",
      "Connecting scientific concepts",
      "Processing scientific data",
      "Analyzing the data",
      "Generating a response",
      "Organizing the answer",
      "Preparing the answer",
      "Finalizing the response"
    ]
  },
  web_search: {
    topic: 'web_search',
    label: 'Web Search & Real-time Info',
    description: 'Searching the web, cross-checking sources, gathering recent updates and news.',
    thinkingWords: [
      "Thinking...",
      "Understanding your question",
      "Categorizing query: Web Research",
      "Analyzing your request",
      "Searching the web",
      "Finding relevant information",
      "Finding relevant sources",
      "Opening sources",
      "Reading sources",
      "Checking sources",
      "Verifying information",
      "Cross-checking sources",
      "Comparing information",
      "Looking for recent updates",
      "Checking the latest information",
      "Gathering information",
      "Connecting the information",
      "Generating a response",
      "Organizing the answer",
      "Preparing the answer",
      "Finalizing the response"
    ]
  },
  image: {
    topic: 'image',
    label: 'Visual & Image Analysis',
    description: 'Inspecting images, graphics, diagrams, or visual structures.',
    thinkingWords: [
      "Thinking...",
      "Understanding your question",
      "Categorizing query: Visual Analysis",
      "Examining the image",
      "Understanding the image",
      "Analyzing visual components",
      "Identifying key elements",
      "Processing the data",
      "Analyzing the data",
      "Generating a response",
      "Organizing the answer",
      "Preparing the answer",
      "Finalizing the response"
    ]
  },
  file: {
    topic: 'file',
    label: 'Document & File Parsing',
    description: 'Parsing uploaded documents, PDFs, CSVs, spreadsheets, and files.',
    thinkingWords: [
      "Thinking...",
      "Understanding your question",
      "Categorizing query: Document Analysis",
      "Reading the file",
      "Analyzing the file",
      "Extracting structured content",
      "Processing the data",
      "Analyzing the data",
      "Connecting the information",
      "Generating a response",
      "Organizing the answer",
      "Preparing the answer",
      "Finalizing the response"
    ]
  },
  general: {
    topic: 'general',
    label: 'General Inquiry',
    description: 'General conversational reasoning, creative synthesis, and general knowledge.',
    thinkingWords: [
      "Thinking...",
      "Understanding your question",
      "Categorizing query: General Assistance",
      "Analyzing your request",
      "Identifying what you need",
      "Gathering information",
      "Connecting the information",
      "Processing the data",
      "Analyzing the data",
      "Generating a response",
      "Organizing the answer",
      "Preparing the answer",
      "Finalizing the response"
    ]
  }
};

/**
 * Categorizes a user query into one of the main topics: 'math', 'coding', 'science', 'web_search', 'image', 'file', 'general'
 */
export function categorizeQuestionTopic(query?: string): QuestionTopic {
  if (!query || !query.trim()) return 'general';
  const q = query.toLowerCase().trim();

  // 1. Math / Calculation / Geometry / Algebra / Calculus / Physics numbers
  if (
    /\b(math|maths|calculate|calc|sum|add|subtract|multiply|divide|equation|formula|algebra|geometry|calculus|integral|derivative|trigonometry|percentage|theorem|matrix|logarithm|arithmetic|%)\b/i.test(q) ||
    /\d+\s*[\+\-\*\/]\s*\d+/.test(q) ||
    /\bwhat\s+is\s+\d+/.test(q)
  ) {
    return 'math';
  }

  // 2. Code / Scripting / Programming / Software Engineering
  if (
    /\b(code|coding|function|script|program|developer|python|javascript|typescript|react|html|css|bug|error|fix|refactor|compile|build|repo|git|api|sql|json|database|component|class|variable)\b/i.test(q)
  ) {
    return 'coding';
  }

  // 3. Science / Physics / Chemistry / Biology / Astronomy / Genetics / Quantum
  if (
    /\b(science|scientific|physics|chemistry|biology|astronomy|quantum|thermodynamics|genetics|dna|atom|molecule|gravity|evolution|photosynthesis|element|periodic table|particle|cosmology|neuroscience)\b/i.test(q)
  ) {
    return 'science';
  }

  // 4. Image / Visual
  if (
    /\b(image|photo|picture|diagram|graphic|visual|examine|look at|png|jpg|jpeg|svg|screenshot|illustration)\b/i.test(q)
  ) {
    return 'image';
  }

  // 5. File / Document
  if (
    /\b(file|document|pdf|csv|json|txt|doc|docx|sheet|excel|read file|analyze file)\b/i.test(q)
  ) {
    return 'file';
  }

  // 6. Web Search / Research / News / Weather / Latest Updates / Citations
  if (
    /\b(search|research|web|google|weather|news|latest|update|who is|where is|find|source|site|url|link|article|today|current)\b/i.test(q)
  ) {
    return 'web_search';
  }

  return 'general';
}

/**
 * Returns full topic details and domain-specific thinking words mapping for a query
 */
export function getTopicAndThinkingWordsForQuery(query?: string): {
  topic: QuestionTopic;
  label: string;
  description: string;
  thinkingWords: string[];
} {
  const topic = categorizeQuestionTopic(query);
  const details = TOPIC_THINKING_MAPPINGS[topic];
  return {
    topic,
    label: details.label,
    description: details.description,
    thinkingWords: details.thinkingWords,
  };
}

/**
 * Returns domain-specific thinking words array for a given query
 */
export function getThinkingWordsForQuery(query?: string): string[] {
  return getTopicAndThinkingWordsForQuery(query).thinkingWords;
}
