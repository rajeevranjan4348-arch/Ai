export interface ValidationResult {
  isValid: boolean;
  score: number; // 0 to 1
  issues: string[];
  correctedContent?: string;
}

export class ResponseValidator {
  /**
   * Validate generated answer quality against user request and context constraints.
   */
  public static validateResponse(
    userQuery: string, 
    generatedContent: string
  ): ValidationResult {
    const issues: string[] = [];
    const content = generatedContent.trim();
    const queryLower = userQuery.trim().toLowerCase();

    // 1. Empty or truncated content check
    if (!content || content.length < 5) {
      issues.push('Response is empty or truncated');
      return { isValid: false, score: 0, issues };
    }

    // 2. Refusal or generic placeholder check (e.g., "I cannot answer this", "As an AI model")
    const genericRefusalPatterns = [
      /i cannot answer/i,
      /as an ai language model/i,
      /i don't have access to/i,
      /sorry, i am unable/i,
    ];

    const hasRefusal = genericRefusalPatterns.some(p => p.test(content));
    // If the user query isn't explicitly asking for illegal or dangerous content, refusal is a flaw
    if (hasRefusal && !queryLower.includes('hack') && !queryLower.includes('illegal')) {
      issues.push('Unnecessary generic refusal detected');
    }

    // 3. User echo check (repeating user question verbatim without answering)
    if (content.toLowerCase() === queryLower) {
      issues.push('Response simply echoes the user query');
    }

    // 4. Banned filler phrases check
    const bannedFillers = [
      'this topic involves fundamental concepts',
      'core analytical principles',
      'practical operational frameworks',
      'in-depth breakdown of this entity',
      'here is a summary of search results',
      'this lesson covers',
      'the following document',
    ];

    const contentLower = content.toLowerCase();
    for (const filler of bannedFillers) {
      if (contentLower.includes(filler)) {
        issues.push(`Contains generic filler phrase: "${filler}"`);
      }
    }

    // 5. Formatting checks (if code requested, check for code block)
    if ((queryLower.includes('write code') || queryLower.includes('function') || queryLower.includes('component')) && !content.includes('```')) {
      issues.push('Code block missing when code was requested');
    }

    const isValid = issues.length === 0;
    const score = isValid ? 1.0 : Math.max(0.2, 1.0 - (issues.length * 0.3));

    // Optional self-correction for minor issues
    let correctedContent = content;
    if (!isValid && issues.includes('Unnecessary generic refusal detected')) {
      correctedContent = content.replace(/As an AI language model,\s*/i, '');
    }

    return {
      isValid,
      score,
      issues,
      correctedContent,
    };
  }
}
