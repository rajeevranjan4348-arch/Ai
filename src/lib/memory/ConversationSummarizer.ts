import { ConversationSummary, StoredMessage } from './types';

const LOCAL_STORAGE_KEY_SUMMARIES = 'perplexity_conversation_summaries';

export class ConversationSummarizer {
  /**
   * Get all conversation summaries from local storage.
   */
  public static getAllSummaries(): Record<string, ConversationSummary> {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY_SUMMARIES);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  /**
   * Get summary for a specific conversation ID.
   */
  public static getSummary(conversationId: string): ConversationSummary | null {
    const all = this.getAllSummaries();
    return all[conversationId] || null;
  }

  /**
   * Save a conversation summary.
   */
  public static saveSummary(summary: ConversationSummary): void {
    try {
      const all = this.getAllSummaries();
      all[summary.conversationId] = summary;
      localStorage.setItem(LOCAL_STORAGE_KEY_SUMMARIES, JSON.stringify(all));
    } catch (err) {
      console.warn('ConversationSummarizer: Failed to save summary', err);
    }
  }

  /**
   * Intelligently extract summary from message history.
   */
  public static summarizeConversation(
    conversationId: string, 
    messages: StoredMessage[]
  ): ConversationSummary {
    const existing = this.getSummary(conversationId);
    
    if (messages.length === 0) {
      return existing || {
        conversationId,
        summaryText: '',
        keyFacts: [],
        unresolvedQuestions: [],
        userRequirements: [],
        decisions: [],
        lastUpdated: new Date().toISOString()
      };
    }

    const userMessages = messages.filter(m => m.role === 'user');
    const assistantMessages = messages.filter(m => m.role === 'assistant');

    // Extract main user requirements & facts
    const keyFacts: string[] = existing?.keyFacts || [];
    const userRequirements: string[] = existing?.userRequirements || [];
    const decisions: string[] = existing?.decisions || [];
    const unresolvedQuestions: string[] = [];

    userMessages.forEach(m => {
      const text = m.content.trim();
      if (text.includes('?') && !unresolvedQuestions.includes(text)) {
        if (unresolvedQuestions.length < 5) unresolvedQuestions.push(text);
      }
      if ((text.toLowerCase().includes('need') || text.toLowerCase().includes('want') || text.toLowerCase().includes('must')) && text.length > 10) {
        if (!userRequirements.includes(text) && userRequirements.length < 5) {
          userRequirements.push(text.slice(0, 100));
        }
      }
    });

    // Build concise summary text
    const topicPreview = userMessages.slice(0, 3).map(m => m.content.slice(0, 60)).join('; ');
    const summaryText = `Discussion focused on: ${topicPreview}. Total turns: ${messages.length}.`;

    const newSummary: ConversationSummary = {
      conversationId,
      summaryText,
      keyFacts: Array.from(new Set(keyFacts)).slice(0, 5),
      unresolvedQuestions: unresolvedQuestions.slice(-3),
      userRequirements: Array.from(new Set(userRequirements)).slice(0, 5),
      decisions: Array.from(new Set(decisions)).slice(0, 5),
      lastUpdated: new Date().toISOString(),
    };

    this.saveSummary(newSummary);
    return newSummary;
  }
}
