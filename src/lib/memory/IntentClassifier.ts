import { IntentCategory } from './types';

export class IntentClassifier {
  /**
   * Classify user query intent into fine-grained category.
   */
  public static classifyIntent(
    query: string, 
    hasPreviousMessages = false, 
    hasAttachments = false
  ): IntentCategory {
    const text = query.trim().toLowerCase();
    if (!text) return 'casual_conversation';

    // File analysis
    if (hasAttachments || text.includes('this file') || text.includes('attached document') || text.includes('pdf') || text.includes('csv')) {
      return 'file_analysis';
    }

    // Coding & Debugging
    const codeKeywords = ['function', 'class', 'import', 'export', 'react', 'typescript', 'javascript', 'python', 'bug', 'error', 'exception', 'stack trace', 'code', 'component', 'api', 'const ', 'let ', 'var ', 'async', 'await', '<div', 'css', 'tailwind'];
    const debugKeywords = ['error', 'fix', 'bug', 'failing', 'issue', 'not working', 'crash', 'exception', 'unexpected', 'undefined'];

    const containsCode = codeKeywords.some(k => text.includes(k)) || text.includes('```');
    const containsDebug = debugKeywords.some(k => text.includes(k));

    if (containsCode && containsDebug) return 'debugging';
    if (containsCode) return 'coding';

    // Casual / Greetings
    const greetings = ['hi', 'hello', 'hey', 'hii', 'greetings', 'good morning', 'good afternoon', 'good evening', 'how are you', 'what\'s up', 'thanks', 'thank you', 'bye', 'goodnight'];
    if (greetings.includes(text) || (text.length < 15 && greetings.some(g => text.startsWith(g)))) {
      return 'casual_conversation';
    }

    // Role / Office Queries (e.g. "Who is the Prime Minister of India?", "Who is the CEO of Google?")
    const roleLookupPattern = /who\s+(is|was|currently\s+is)\s+(the\s+)?(current\s+)?(prime\s+minister|president|ceo|chief\s+minister|governor|chancellor|head|founder|director|leader|chairman|secretary|minister|mayor)\s+(of|in|for)\b/i;
    if (roleLookupPattern.test(text) || text.startsWith("who is the ") || text.startsWith("who is current ")) {
      return 'role_lookup';
    }

    // Explicit Web Search or Deep Research keywords
    const researchKeywords = [
      'search', 'research', 'latest news', 'find latest', 'what is the current', 'who is', 'when did',
      'recent news', 'on the web', 'look up', 'today', '2026', '2025', '2024', 'population', 'stock price', 'weather'
    ];
    if (researchKeywords.some(k => text.includes(k))) {
      return text.includes('research') || text.includes('deep') || text.includes('comprehensive') ? 'research' : 'web_search_required';
    }

    // Follow-up question references
    const followUpReferences = [
      'he', 'she', 'it', 'them', 'that', 'this', 'above', 'earlier', 'what about', 'and why', 'how about',
      'continue', 'next step', 'go on', 'as you said', 'from yesterday', 'the code we made'
    ];
    if (hasPreviousMessages && (followUpReferences.some(r => text.includes(r)) || text.length < 30)) {
      return 'follow_up_question';
    }

    // Task execution / Action items
    if (text.startsWith('create') || text.startsWith('make') || text.startsWith('build') || text.startsWith('generate') || text.startsWith('convert') || text.startsWith('summarize')) {
      return 'task_execution';
    }

    // Creative writing
    if (text.includes('poem') || text.includes('story') || text.includes('essay') || text.includes('draft an email') || text.includes('letter')) {
      return 'creative_writing';
    }

    // Default
    return 'normal_chat';
  }
}
