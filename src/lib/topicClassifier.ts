export type QuestionCategory = 'math' | 'coding' | 'science' | 'general';

/**
 * Categorizes a given user question/query into 'math', 'coding', 'science', or 'general'
 * based on keyword and semantic pattern matching.
 */
export function classifyQuestion(query: string): QuestionCategory {
  if (!query || !query.trim()) {
    return 'general';
  }

  const q = query.toLowerCase().trim();

  // 1. Math / Calculation / Geometry / Algebra / Calculus
  if (
    /\b(math|maths|calculate|calc|sum|add|subtract|multiply|divide|equation|formula|algebra|geometry|calculus|integral|derivative|trigonometry|percentage|theorem|matrix|logarithm|arithmetic|%)\b/i.test(q) ||
    /\d+\s*[\+\-\*\/]\s*\d+/.test(q) ||
    /\bwhat\s+is\s+\d+/.test(q)
  ) {
    return 'math';
  }

  // 2. Code / Software Engineering / Syntax / Scripts / Programming
  if (
    /\b(code|coding|function|script|program|developer|python|javascript|typescript|react|html|css|bug|error|fix|refactor|compile|build|repo|git|api|sql|json|database|component|class|variable|array|object|method|loop)\b/i.test(q)
  ) {
    return 'coding';
  }

  // 3. Science / Physics / Chemistry / Biology / Astronomy / Quantum / Genetics
  if (
    /\b(science|scientific|physics|chemistry|biology|astronomy|quantum|thermodynamics|genetics|dna|atom|molecule|gravity|evolution|photosynthesis|element|periodic table|particle|cosmology|neuroscience|biochemistry|ecosystem|velocity|acceleration|force|energy|mass)\b/i.test(q)
  ) {
    return 'science';
  }

  // 4. Fallback: General
  return 'general';
}

/**
 * Returns topic-specific sequential thinking action steps based on the question domain
 */
export function getDomainThinkingSteps(category: QuestionCategory): string[] {
  switch (category) {
    case 'math':
      return [
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
        "Finalizing the response",
        "Done"
      ];
    case 'coding':
      return [
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
        "Finalizing the response",
        "Done"
      ];
    case 'science':
      return [
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
        "Finalizing the response",
        "Done"
      ];
    case 'general':
    default:
      return [
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
        "Finalizing the response",
        "Done"
      ];
  }
}
