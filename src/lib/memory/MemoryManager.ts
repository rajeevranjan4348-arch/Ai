import { LongTermMemory, MemoryCategory } from './types';

const LOCAL_STORAGE_KEY_LONG_TERM_MEMORIES = 'perplexity_long_term_memories';

export class MemoryManager {
  /**
   * Get all stored long-term memories.
   */
  public static getAllMemories(): LongTermMemory[] {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY_LONG_TERM_MEMORIES);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  /**
   * Save long-term memories list.
   */
  public static saveAllMemories(memories: LongTermMemory[]): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_LONG_TERM_MEMORIES, JSON.stringify(memories));
    } catch (err) {
      console.warn('MemoryManager: Failed to save memories', err);
    }
  }

  /**
   * Add a new long-term memory entry with deduplication.
   */
  public static addMemory(
    fact: string,
    category: MemoryCategory = 'fact',
    importance = 3,
    conversationId?: string,
    tags: string[] = []
  ): LongTermMemory {
    const memories = this.getAllMemories();
    const cleanFact = fact.trim();

    // Check if duplicate or highly similar memory already exists
    const existing = memories.find(
      m => m.fact.toLowerCase() === cleanFact.toLowerCase()
    );

    const now = new Date().toISOString();

    if (existing) {
      existing.lastAccessedAt = now;
      existing.accessCount += 1;
      existing.importance = Math.max(existing.importance, importance);
      this.saveAllMemories(memories);
      return existing;
    }

    const newMemory: LongTermMemory = {
      id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      conversationId,
      fact: cleanFact,
      category,
      importance,
      confidence: 0.9,
      createdAt: now,
      lastAccessedAt: now,
      accessCount: 1,
      tags,
    };

    const updated = [newMemory, ...memories];
    this.saveAllMemories(updated);
    return newMemory;
  }

  /**
   * Delete a specific long-term memory by ID.
   */
  public static deleteMemory(id: string): void {
    const memories = this.getAllMemories();
    const filtered = memories.filter(m => m.id !== id);
    this.saveAllMemories(filtered);
  }

  /**
   * Clear all memories (or memories associated with a conversationId).
   */
  public static clearMemories(conversationId?: string): void {
    if (!conversationId) {
      localStorage.removeItem(LOCAL_STORAGE_KEY_LONG_TERM_MEMORIES);
    } else {
      const memories = this.getAllMemories();
      const filtered = memories.filter(m => m.conversationId !== conversationId);
      this.saveAllMemories(filtered);
    }
  }

  /**
   * Automatic Memory Extraction from user turn.
   * Scans text for user facts, preferences, role, requirements, project choices.
   */
  public static extractAndSaveMemories(
    userText: string,
    assistantText: string,
    conversationId: string
  ): LongTermMemory[] {
    const extracted: LongTermMemory[] = [];
    const text = userText.trim();
    if (!text || text.length < 8) return [];

    const lower = text.toLowerCase();

    // Preference patterns
    const prefMatches = [
      /(?:i prefer|i like|i always use|i want|my preference is|always use|prefer using)\s+([^\.\,\!\?]+)/gi,
      /(?:my name is|i am a|i work as|my role is)\s+([^\.\,\!\?]+)/gi,
      /(?:we are building|my project is|the app is)\s+([^\.\,\!\?]+)/gi,
      /(?:remember that|note that|keep in mind that)\s+([^\.\,\!\?]+)/gi,
    ];

    for (const pattern of prefMatches) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const captured = match[0].trim();
        if (captured.length > 5) {
          let cat: MemoryCategory = 'fact';
          if (lower.includes('prefer') || lower.includes('like') || lower.includes('want')) cat = 'preference';
          if (lower.includes('building') || lower.includes('project')) cat = 'task';
          if (lower.includes('code') || lower.includes('stack') || lower.includes('react') || lower.includes('node')) cat = 'code';

          const mem = this.addMemory(captured, cat, 4, conversationId);
          extracted.push(mem);
        }
      }
    }

    return extracted;
  }
}
