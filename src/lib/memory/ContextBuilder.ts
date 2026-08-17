import { StoredMessage, LongTermMemory, ConversationSummary } from './types';
import { MemoryRetriever } from './MemoryRetriever';
import { MemoryManager } from './MemoryManager';
import { ConversationSummarizer } from './ConversationSummarizer';
import { MessageStore } from './MessageStore';
import { globalUndercoverSanitizer } from '@/lib/claw';

export interface ContextPayload {
  systemPrompt: string;
  userMessage: string;
  recentMessages: StoredMessage[];
  retrievedMemories: LongTermMemory[];
  retrievedHistoricalMessages: StoredMessage[];
  summary: ConversationSummary | null;
  implicitMemoryTriggered: boolean;
  implicitMemoryText?: string;
}

export class ContextBuilder {
  /**
   * Check if user query contains implicit memory reference keywords.
   */
  public static isImplicitMemoryReference(query: string): boolean {
    const lower = query.toLowerCase();
    const triggers = [
      'that thing i asked before',
      'continue from yesterday',
      'use the code we made earlier',
      'what did i say about this',
      'continue where we stopped',
      'as we discussed earlier',
      'remember what we did',
      'what did i tell you',
      'my previous question',
      'earlier today'
    ];
    return triggers.some(t => lower.includes(t));
  }

  /**
   * Build unified context pipeline in exact required order.
   */
  public static buildContext(
    currentConversationId: string,
    currentUserMessage: string,
    recentMessages: StoredMessage[] = [],
    baseSystemPrompt = 'You are an intelligent AI assistant with long-term memory and research capabilities.'
  ): ContextPayload {
    // Apply Undercover Mode sanitization to incoming user message
    const { sanitizedText } = globalUndercoverSanitizer.sanitizeOutput(currentUserMessage);
    const isImplicit = this.isImplicitMemoryReference(sanitizedText);

    // 1. System Instructions Base
    let systemPrompt = baseSystemPrompt;

    // 2. User Profile & Preferences (when relevant)
    const allMemories = MemoryManager.getAllMemories();
    const preferences = allMemories.filter(m => m.category === 'preference');
    if (preferences.length > 0) {
      systemPrompt += `\n\n[USER PREFERENCES & PROFILE]:\n` + preferences.map(p => `- ${p.fact}`).join('\n');
    }

    // 3. Long-Term Memories (retrieved based on relevance score)
    const retrievedMemories = MemoryRetriever.retrieveRelevantMemories(
      currentUserMessage, 
      currentConversationId, 
      5
    );
    if (retrievedMemories.length > 0) {
      systemPrompt += `\n\n[RELEVANT LONG-TERM MEMORIES]:\n` + retrievedMemories.map(rm => `- ${rm.memory.fact}`).join('\n');
    }

    // 4. Current Conversation Summary
    const summary = ConversationSummarizer.getSummary(currentConversationId);
    if (summary && summary.summaryText) {
      systemPrompt += `\n\n[CONVERSATION SUMMARY & CONTEXT]:\n${summary.summaryText}`;
      if (summary.userRequirements.length > 0) {
        systemPrompt += `\nKey Requirements: ${summary.userRequirements.join('; ')}`;
      }
    }

    // 5. Retrieved Historical Messages (if implicit memory reference or keyword search needed)
    let retrievedHistoricalMessages: StoredMessage[] = [];
    let implicitText = '';

    if (isImplicit) {
      // Perform cross-conversation message search
      const searched = MessageStore.searchMessages(currentUserMessage, currentConversationId, 5);
      if (searched.length > 0) {
        retrievedHistoricalMessages = searched;
        implicitText = searched.map(m => `[From previous conversation on ${new Date(m.timestamp).toLocaleDateString()}]: ${m.content}`).join('\n\n');
        systemPrompt += `\n\n[RETRIEVED HISTORICAL MESSAGES FOR REFERENCED MEMORY]:\n${implicitText}`;
      }
    }

    systemPrompt += `\n\nCRITICAL INSTRUCTION: Be direct, comprehensive, and helpful. Always directly answer the user's core question without fluff, unnecessary refusals, or echoing.`;

    return {
      systemPrompt,
      userMessage: currentUserMessage,
      recentMessages: recentMessages.slice(-10), // Short-term memory (last 10 turns)
      retrievedMemories: retrievedMemories.map(rm => rm.memory),
      retrievedHistoricalMessages,
      summary,
      implicitMemoryTriggered: isImplicit,
      implicitMemoryText: implicitText,
    };
  }
}
