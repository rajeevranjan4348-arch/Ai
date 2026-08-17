import { StoredMessage } from './types';

const LOCAL_STORAGE_KEY_MESSAGES = 'perplexity_local_messages';

/**
 * MessageStore handles transactional appends, message retrieval, and persistence.
 */
export class MessageStore {
  private static lock: Promise<void> = Promise.resolve();

  /**
   * Get all local messages safely.
   */
  public static getAllLocalMessages(): StoredMessage[] {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY_MESSAGES);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.warn('MessageStore: Failed to read local messages', err);
      return [];
    }
  }

  /**
   * Save messages array back to local storage.
   */
  public static saveAllLocalMessages(messages: StoredMessage[]): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_MESSAGES, JSON.stringify(messages));
    } catch (err) {
      console.warn('MessageStore: Failed to write local messages', err);
    }
  }

  /**
   * Get messages for a specific conversation ID.
   */
  public static getConversationMessages(conversationId: string): StoredMessage[] {
    const all = this.getAllLocalMessages();
    return all
      .filter(m => m.conversationId === conversationId || (m as any).threadId === conversationId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  /**
   * Transactional append message to state to prevent race conditions.
   */
  public static async appendMessage(message: StoredMessage): Promise<StoredMessage[]> {
    return new Promise((resolve) => {
      this.lock = this.lock.then(async () => {
        const all = this.getAllLocalMessages();
        // Check if message ID already exists
        const index = all.findIndex(m => m.id === message.id);
        if (index >= 0) {
          all[index] = { ...all[index], ...message };
        } else {
          all.push(message);
        }
        this.saveAllLocalMessages(all);
        resolve(this.getConversationMessages(message.conversationId));
      });
    });
  }

  /**
   * Update existing message content or metadata.
   */
  public static async updateMessage(
    messageId: string, 
    updates: Partial<StoredMessage>
  ): Promise<void> {
    return new Promise((resolve) => {
      this.lock = this.lock.then(async () => {
        const all = this.getAllLocalMessages();
        const index = all.findIndex(m => m.id === messageId);
        if (index >= 0) {
          all[index] = { ...all[index], ...updates };
          this.saveAllLocalMessages(all);
        }
        resolve();
      });
    });
  }

  /**
   * Delete all messages for a given conversation ID.
   */
  public static async deleteConversationMessages(conversationId: string): Promise<void> {
    return new Promise((resolve) => {
      this.lock = this.lock.then(async () => {
        const all = this.getAllLocalMessages();
        const filtered = all.filter(
          m => m.conversationId !== conversationId && (m as any).threadId !== conversationId
        );
        this.saveAllLocalMessages(filtered);
        resolve();
      });
    });
  }

  /**
   * Search older messages across all conversations using keyword / token similarity.
   */
  public static searchMessages(
    query: string, 
    excludeConversationId?: string, 
    limit = 10
  ): StoredMessage[] {
    const all = this.getAllLocalMessages();
    const cleanQuery = query.toLowerCase().trim();
    if (!cleanQuery) return [];

    const tokens = cleanQuery.split(/\s+/).filter(t => t.length > 2);
    if (tokens.length === 0) return [];

    const scored = all
      .filter(m => !excludeConversationId || m.conversationId !== excludeConversationId)
      .map(m => {
        const contentLower = m.content.toLowerCase();
        let matches = 0;
        tokens.forEach(t => {
          if (contentLower.includes(t)) matches++;
        });
        const score = matches / tokens.length;
        return { message: m, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score || new Date(b.message.timestamp).getTime() - new Date(a.message.timestamp).getTime());

    return scored.slice(0, limit).map(item => item.message);
  }
}
