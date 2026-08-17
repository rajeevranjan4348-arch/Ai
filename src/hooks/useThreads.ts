import { useState, useEffect, useCallback } from 'react';
import { blink } from '@/lib/blink';

export interface Message {
  id: string;
  threadId?: string;
  thread_id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
  parts?: any[];
  sources?: any[];
  groundingMetadata?: any;
  pluginArtifacts?: any[];
  toolResult?: any;
  images?: any[];
  isStreaming?: boolean;
  createdAt?: string;
  created_at?: string;
}

export interface Thread {
  id: string;
  userId?: string;
  sessionId?: string;
  title: string;
  preview?: string;
  model?: string;
  createdAt: string | number;
  updatedAt: string | number;
  messages?: Message[];
  isPinned?: boolean;
  isFavorite?: boolean;
  isArchived?: boolean;
  totalMessages?: number;
  tags?: string[];
  // snake_case aliases returned by SDK
  user_id?: string;
  session_id?: string;
  created_at?: string;
  updated_at?: string;
}

export type Conversation = Thread;

// Canonical LocalStorage Keys
const STORAGE_KEY_CONVERSATIONS = 'ai_conversations';
const STORAGE_KEY_ACTIVE_CONV = 'ai_active_conversation';
const LEGACY_STORAGE_THREADS = 'perplexity_local_threads';
const LEGACY_STORAGE_MESSAGES = 'perplexity_local_messages';

// Helper to generate robust unique IDs
export function generateConversationId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {}
  }
  return `conv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function generateMessageId(role: 'user' | 'assistant' | 'system' = 'user'): string {
  return `${role}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// Helper functions for persistent storage
export const getStoredConversations = (): Conversation[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONVERSATIONS);
    if (raw) {
      const parsed: Conversation[] = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('Error reading ai_conversations from storage:', err);
  }

  // Fallback / migration from legacy storage keys
  try {
    const legacyThreadsRaw = localStorage.getItem(LEGACY_STORAGE_THREADS);
    const legacyMessagesRaw = localStorage.getItem(LEGACY_STORAGE_MESSAGES);
    const legacyThreads: Thread[] = legacyThreadsRaw ? JSON.parse(legacyThreadsRaw) : [];
    const legacyMessages: Message[] = legacyMessagesRaw ? JSON.parse(legacyMessagesRaw) : [];

    if (legacyThreads.length > 0) {
      const migrated: Conversation[] = legacyThreads.map(t => {
        const threadMsgs = legacyMessages.filter(m => (m.threadId === t.id || (m as any).thread_id === t.id));
        return {
          ...t,
          messages: threadMsgs,
          totalMessages: threadMsgs.length || t.totalMessages || 0,
        };
      });
      // Save migrated data back to canonical key
      try {
        localStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(migrated));
      } catch {}
      return migrated;
    }
  } catch {}

  return [];
};

export const persistConversations = (conversations: Conversation[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(conversations));
  } catch (e) {
    console.warn('Failed to persist conversations to localStorage:', e);
  }

  // Also sync to legacy keys for external components
  try {
    const flatThreads: Thread[] = conversations.map(c => {
      const { messages, ...rest } = c;
      return { ...rest, totalMessages: messages?.length || c.totalMessages || 0 };
    });
    localStorage.setItem(LEGACY_STORAGE_THREADS, JSON.stringify(flatThreads));

    const flatMessages: Message[] = [];
    conversations.forEach(c => {
      if (Array.isArray(c.messages)) {
        c.messages.forEach(m => {
          flatMessages.push({
            ...m,
            threadId: c.id,
            createdAt: typeof m.createdAt === 'string' ? m.createdAt : new Date(m.timestamp || Date.now()).toISOString(),
          });
        });
      }
    });
    localStorage.setItem(LEGACY_STORAGE_MESSAGES, JSON.stringify(flatMessages));
  } catch {}
};

export const getStoredActiveConversationId = (): string | null => {
  try {
    const id = localStorage.getItem(STORAGE_KEY_ACTIVE_CONV);
    return id && id.trim() ? id.trim() : null;
  } catch {
    return null;
  }
};

export const persistActiveConversationId = (activeId: string | null): void => {
  try {
    if (activeId) {
      localStorage.setItem(STORAGE_KEY_ACTIVE_CONV, activeId);
    } else {
      localStorage.removeItem(STORAGE_KEY_ACTIVE_CONV);
    }
  } catch {}
};

export function useThreads(sessionId?: string) {
  const [threads, setThreads] = useState<Conversation[]>(() => {
    const local = getStoredConversations();
    return local.sort((a, b) => {
      const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchThreads = useCallback(async () => {
    // 1. Always load local conversations first for instantaneous rendering
    const local = getStoredConversations().filter(t => !sessionId || t.userId === sessionId || t.sessionId === sessionId);
    const sortedLocal = local.sort((a, b) => {
      const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return timeB - timeA;
    });
    setThreads(sortedLocal);

    if (!sessionId) return;

    try {
      setIsLoading(true);
      const cloudData = await blink.db.table<Thread>('threads').list({
        where: { userId: sessionId },
        orderBy: { updatedAt: 'desc' },
        limit: 50,
      });

      if (cloudData && cloudData.length > 0) {
        const mergedMap = new Map<string, Conversation>();
        sortedLocal.forEach(t => mergedMap.set(t.id, t));

        cloudData.forEach(t => {
          const existing = mergedMap.get(t.id);
          if (!existing) {
            mergedMap.set(t.id, { ...t, messages: [] });
          } else {
            const cloudTime = new Date(t.updatedAt || t.created_at || t.createdAt || 0).getTime();
            const localTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
            if (cloudTime >= localTime) {
              mergedMap.set(t.id, { ...existing, ...t, messages: existing.messages || [] });
            }
          }
        });

        const mergedList = Array.from(mergedMap.values()).sort((a, b) => {
          const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
          const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
          return timeB - timeA;
        });

        setThreads(mergedList);
        persistConversations(mergedList);
      }
    } catch (error) {
      console.warn('Failed to fetch threads from cloud, keeping local storage:', error);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  /**
   * Save or update an entire conversation, persisting its full messages array.
   */
  const saveConversation = useCallback((conversation: Conversation): void => {
    if (!conversation || !conversation.id) return;

    console.log('Active conversation:', conversation.id);
    console.log('Saving conversation:', conversation);

    const now = new Date().toISOString();
    const updatedConv: Conversation = {
      ...conversation,
      updatedAt: conversation.updatedAt || now,
      messages: conversation.messages || [],
      totalMessages: conversation.messages?.length || 0,
      preview: conversation.preview || (conversation.messages && conversation.messages.length > 0 ? (conversation.messages[conversation.messages.length - 1].content.slice(0, 60)) : undefined),
    };

    setThreads(prev => {
      const existingIdx = prev.findIndex(c => c.id === conversation.id);
      let updated: Conversation[];
      if (existingIdx !== -1) {
        updated = [...prev];
        updated[existingIdx] = { ...updated[existingIdx], ...updatedConv };
        // Bring to top
        const [target] = updated.splice(existingIdx, 1);
        updated.unshift(target);
      } else {
        updated = [updatedConv, ...prev];
      }
      persistConversations(updated);
      return updated;
    });
  }, []);

  /**
   * Load an entire conversation object by ID, restoring all user and assistant messages.
   */
  const loadConversation = useCallback(async (conversationId: string): Promise<Conversation | null> => {
    console.log('Loading conversation:', conversationId);
    const all = getStoredConversations();
    let conversation = all.find(c => c.id === conversationId) || null;

    if (conversation) {
      console.log('Loaded messages:', conversation.messages);
      persistActiveConversationId(conversation.id);
      return conversation;
    }

    // Try fetching from cloud if not found locally
    try {
      const cloudThread = await blink.db.table<Thread>('threads').get(conversationId);
      if (cloudThread) {
        const cloudMsgs = await blink.db.table<Message>('messages').list({
          where: { threadId: conversationId },
          orderBy: { createdAt: 'asc' },
        });

        const messages: Message[] = (cloudMsgs || []).map(m => {
          let parsedParts = m.parts;
          if (typeof m.parts === 'string') {
            try { parsedParts = JSON.parse(m.parts); } catch {}
          }
          return { ...m, parts: parsedParts };
        });

        conversation = {
          ...cloudThread,
          messages,
          totalMessages: messages.length,
        };

        console.log('Loaded messages from cloud:', conversation.messages);
        saveConversation(conversation);
        persistActiveConversationId(conversation.id);
        return conversation;
      }
    } catch (e) {
      console.warn('Could not load conversation from cloud:', e);
    }

    return null;
  }, [saveConversation]);

  const createThread = async (title: string, sid?: string): Promise<Thread | null> => {
    const effectiveSessionId = sid || sessionId || 'anonymous';
    const now = new Date().toISOString();
    const cleanTitle = title && title !== 'New Chat' ? (title.length > 38 ? title.slice(0, 35) + '...' : title) : 'New Chat';
    
    const newThread: Conversation = {
      id: generateConversationId(),
      userId: effectiveSessionId,
      sessionId: effectiveSessionId,
      title: cleanTitle,
      createdAt: now,
      updatedAt: now,
      messages: [],
      totalMessages: 0,
    };

    // Save locally IMMEDIATELY
    saveConversation(newThread);

    try {
      const created = await (blink.db.table('threads') as any).create({
        id: newThread.id,
        userId: effectiveSessionId,
        sessionId: effectiveSessionId,
        title: cleanTitle,
        createdAt: now,
        updatedAt: now,
      }) as Thread;
      return created || newThread;
    } catch (error) {
      console.warn('Failed to create thread on cloud, saved locally:', error);
      return newThread;
    }
  };

  const deleteThread = async (threadId: string): Promise<void> => {
    try {
      await blink.db.table('messages').deleteMany({ where: { threadId } });
      await blink.db.table('threads').delete(threadId);
    } catch (error) {
      console.warn('Failed to delete thread from cloud, deleting locally:', error);
    } finally {
      setThreads(prev => {
        const filtered = prev.filter(t => t.id !== threadId);
        persistConversations(filtered);
        return filtered;
      });

      const currentActive = getStoredActiveConversationId();
      if (currentActive === threadId) {
        persistActiveConversationId(null);
      }
    }
  };

  const saveMessage = useCallback(async (threadId: string, message: any): Promise<void> => {
    if (!threadId || !message) return;

    const messageId =
      message.id || generateMessageId(message.role || 'user');

    let parts = message.parts || [];
    if (parts.length === 0 && message.toolInvocations?.length > 0) {
      parts = message.toolInvocations.map((ti: any) => ({
        type: 'tool-invocation',
        ...ti,
      }));
    }

    const content = message.content || '';
    const now = new Date().toISOString();
    const timestamp = message.timestamp || Date.now();

    const formattedMessage: Message = {
      ...message,
      id: messageId,
      threadId,
      role: message.role || 'user',
      content,
      parts,
      timestamp,
      createdAt: message.createdAt || now,
    };

    // Update in-memory and persisted conversation
    setThreads(prev => {
      const idx = prev.findIndex(t => t.id === threadId);
      let updated: Conversation[];
      let targetConv: Conversation;

      let titleUpdate: string | undefined;
      if (formattedMessage.role === 'user' && content) {
        const currentTitle = idx !== -1 ? prev[idx].title : undefined;
        if (!currentTitle || currentTitle === 'New Chat') {
          const cleanText = content.trim().replace(/\n/g, ' ');
          titleUpdate = cleanText.length > 38 ? cleanText.slice(0, 35) + '...' : cleanText;
        }
      }

      if (idx !== -1) {
        const existing = prev[idx];
        const existingMsgs = [...(existing.messages || [])];
        const msgIdx = existingMsgs.findIndex(m => m.id === messageId);
        if (msgIdx !== -1) {
          existingMsgs[msgIdx] = { ...existingMsgs[msgIdx], ...formattedMessage };
        } else {
          existingMsgs.push(formattedMessage);
        }

        targetConv = {
          ...existing,
          title: titleUpdate || existing.title,
          updatedAt: now,
          preview: content ? (content.length > 60 ? content.slice(0, 58) + '...' : content) : existing.preview,
          totalMessages: existingMsgs.length,
          messages: existingMsgs,
        };

        updated = [...prev];
        updated.splice(idx, 1);
        updated.unshift(targetConv);
      } else {
        targetConv = {
          id: threadId,
          userId: sessionId || 'anonymous',
          sessionId: sessionId || 'anonymous',
          title: titleUpdate || 'New Chat',
          preview: content ? (content.length > 60 ? content.slice(0, 58) + '...' : content) : undefined,
          createdAt: now,
          updatedAt: now,
          totalMessages: 1,
          messages: [formattedMessage],
        };
        updated = [targetConv, ...prev];
      }

      console.log('Active conversation:', threadId);
      console.log('Saving conversation:', targetConv);
      persistConversations(updated);
      return updated;
    });

    // Sync to Cloud DB in background
    try {
      let partsStr = '[]';
      try { partsStr = JSON.stringify(parts); } catch {}

      const msgData = {
        id: messageId,
        threadId,
        userId: sessionId || 'anonymous',
        role: formattedMessage.role,
        content,
        parts: partsStr,
        createdAt: formattedMessage.createdAt || now,
      };

      const existing = await blink.db.table('messages').get(messageId);
      if (existing) {
        await blink.db.table('messages').update(messageId, msgData);
      } else {
        await blink.db.table('messages').create(msgData);
      }

      await blink.db.table('threads').update(threadId, {
        updatedAt: now,
        ...(content ? { preview: content.length > 60 ? content.slice(0, 58) + '...' : content } : {}),
      });
    } catch (error) {
      console.warn('Cloud sync error for message:', error);
    }
  }, [sessionId]);

  const updateThread = async (threadId: string, updates: Partial<Conversation>): Promise<void> => {
    const now = new Date().toISOString();
    setThreads(prev => {
      const updated = prev.map(t => (t.id === threadId ? { ...t, ...updates, updatedAt: now } : t));
      persistConversations(updated);
      return updated;
    });

    try {
      await blink.db.table('threads').update(threadId, updates);
    } catch (error) {
      console.warn('Failed to update thread on cloud, updated locally:', error);
    }
  };

  const renameThread = (threadId: string, newTitle: string) => {
    return updateThread(threadId, { title: newTitle });
  };

  const togglePinThread = (threadId: string) => {
    const thread = threads.find(t => t.id === threadId);
    return updateThread(threadId, { isPinned: !thread?.isPinned });
  };

  const toggleFavoriteThread = (threadId: string) => {
    const thread = threads.find(t => t.id === threadId);
    return updateThread(threadId, { isFavorite: !thread?.isFavorite });
  };

  const toggleArchiveThread = (threadId: string) => {
    const thread = threads.find(t => t.id === threadId);
    return updateThread(threadId, { isArchived: !thread?.isArchived });
  };

  const duplicateThread = async (threadId: string): Promise<Thread | null> => {
    const target = threads.find(t => t.id === threadId);
    if (!target) return null;
    const newTitle = `${target.title} (Copy)`;
    const newThread = await createThread(newTitle, target.sessionId || target.userId);
    if (newThread) {
      const messages = await getThreadMessages(threadId);
      for (const m of messages) {
        await saveMessage(newThread.id, m);
      }
    }
    return newThread;
  };

  const getThreadMessages = useCallback(async (threadId: string): Promise<Message[]> => {
    const all = getStoredConversations();
    const target = all.find(t => t.id === threadId);
    if (target && target.messages && target.messages.length > 0) {
      return [...target.messages].sort((a, b) => {
        const timeA = new Date(a.createdAt || (a as any).created_at || a.timestamp || 0).getTime();
        const timeB = new Date(b.createdAt || (b as any).created_at || b.timestamp || 0).getTime();
        return timeA - timeB;
      });
    }

    try {
      const cloudMsgs = await blink.db.table<Message>('messages').list({
        where: { threadId },
        orderBy: { createdAt: 'asc' },
      });

      if (cloudMsgs && cloudMsgs.length > 0) {
        const parsed = cloudMsgs.map(m => {
          let parsedParts: any[] | undefined;
          try {
            parsedParts = m.parts ? (typeof m.parts === 'string' ? JSON.parse(m.parts as any) : m.parts) : undefined;
          } catch {}
          return { ...m, parts: parsedParts };
        });
        return parsed;
      }
    } catch (error) {
      console.warn('getThreadMessages from cloud failed:', error);
    }

    return target?.messages || [];
  }, []);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  return {
    threads,
    isLoading,
    fetchThreads,
    createThread,
    deleteThread,
    saveMessage,
    saveConversation,
    loadConversation,
    getThreadMessages,
    updateThread,
    renameThread,
    togglePinThread,
    toggleFavoriteThread,
    toggleArchiveThread,
    duplicateThread,
  };
}

