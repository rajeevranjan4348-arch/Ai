import { StoredMessage, ConversationState, ThinkingState, IntentCategory } from './types';
import { MessageStore } from './MessageStore';
import { MemoryManager } from './MemoryManager';
import { ConversationSummarizer } from './ConversationSummarizer';
import { IntentClassifier } from './IntentClassifier';
import { ContextBuilder } from './ContextBuilder';
import { ThinkingStateManager } from './ThinkingStateManager';
import { ResponseValidator } from './ResponseValidator';
import { processQueryTopic } from '../topicTracker';
import { executePipeline, classifyIntentAndExtractEntity } from './PipelineManager';
import { runOpenAIQuery, getOpenAIClient } from '../openai';

export class ConversationManager {
  private static thinkingManagers: Record<string, ThinkingStateManager> = {};

  /**
   * Get or initialize ThinkingStateManager for a given conversation.
   */
  public static getThinkingManager(conversationId: string): ThinkingStateManager {
    if (!this.thinkingManagers[conversationId]) {
      this.thinkingManagers[conversationId] = new ThinkingStateManager();
    }
    return this.thinkingManagers[conversationId];
  }

  /**
   * Main entry pipeline for processing user input with full memory, thinking, research & validation.
   */
  public static async executeConversationTurn(
    conversationId: string,
    userQuery: string,
    userRequestedMode: 'chat' | 'search' | 'research' = 'chat',
    attachments: any[] = [],
    onChunk?: (text: string) => void
  ): Promise<{
    userMessage: StoredMessage;
    assistantMessage: StoredMessage;
    thinkingState: ThinkingState;
    intent: IntentCategory;
    effectiveMode: 'chat' | 'search' | 'research';
    autoDeepResearch: boolean;
  }> {
    const thinking = this.getThinkingManager(conversationId);

    // 1. INTENT DETECTION
    thinking.setStage('understanding');
    const existingMessages = MessageStore.getConversationMessages(conversationId);
    const intent = IntentClassifier.classifyIntent(
      userQuery, 
      existingMessages.length > 0, 
      attachments.length > 0
    );

    // Topic tracker (Adaptive Deep Research)
    const topicResult = processQueryTopic(userQuery, userRequestedMode, conversationId);
    const effectiveMode = topicResult.effectiveMode;

    // Save user message transactionally
    const userMsgId = `msg_user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const userMessage: StoredMessage = {
      id: userMsgId,
      conversationId,
      role: 'user',
      content: userQuery,
      timestamp: new Date().toISOString(),
      attachments,
      metadata: {
        intent,
        searchMode: effectiveMode,
        autoDeepResearch: topicResult.isAutoDeepResearch,
        topicName: topicResult.topicName,
      },
    };
    await MessageStore.appendMessage(userMessage);

    // 2. LOAD CONVERSATION STATE & RETRIEVE RELEVANT MEMORY
    thinking.setStage('checking_memory', { intent });
    const updatedHistory = MessageStore.getConversationMessages(conversationId);

    // 3. BUILD CONTEXT
    thinking.setStage('planning', { intent });
    const context = ContextBuilder.buildContext(
      conversationId,
      userQuery,
      updatedHistory,
      `You are Perplexity AI, an expert AI research & conversation assistant powered by advanced language models.
Current Topic: ${topicResult.topicName || 'General Discussion'} (${topicResult.topicCount} related queries)
Intent Category: ${intent.toUpperCase()}
Mode: ${effectiveMode.toUpperCase()}

Answer the user directly, thoroughly, and accurately in Markdown format.`
    );

    // 4. PIPELINE EXECUTION (INTENT DETECTION -> ENTITY EXTRACTION -> SEARCH -> GENERATE -> RELEVANCE VALIDATION)
    let fullResponseText = '';

    if (intent === 'casual_conversation' && effectiveMode !== 'research' && userQuery.trim().length < 15) {
      thinking.setStage('generating');
      try {
        if (getOpenAIClient()) {
          fullResponseText = await runOpenAIQuery({
            prompt: `${context.systemPrompt}\n\nUser: ${userQuery}`,
            mode: 'chat',
          });
        } else {
          fullResponseText = `Hello! I'm here and ready to help. What would you like to explore, research, or work on today?`;
        }
      } catch {
        fullResponseText = `Hello! I'm here and ready to help. What would you like to explore, research, or work on today?`;
      }
      if (onChunk) onChunk(fullResponseText);
    } else {
      const extracted = classifyIntentAndExtractEntity(userQuery);
      thinking.setStage('searching', {
        searchQueries: [extracted.searchQuery]
      });

      try {
        thinking.setStage(effectiveMode === 'research' ? 'searching' : 'generating');
        const pipelineRes = await executePipeline(
          userQuery,
          effectiveMode,
          context.systemPrompt,
          onChunk
        );
        fullResponseText = pipelineRes.text;
      } catch (pipelineErr) {
        console.warn('Pipeline execution error:', pipelineErr);
        fullResponseText = `Based on available information regarding "${extracted.entity}":\n\n` +
          `I reviewed your request for "${userQuery}". Let me know if you would like to run a deeper search or explore specific aspects of this entity.`;
        if (onChunk) onChunk(fullResponseText);
      }
    }

    // 5. VALIDATE ANSWER
    thinking.setStage('finalizing');
    const validation = ResponseValidator.validateResponse(userQuery, fullResponseText);
    if (!validation.isValid && validation.correctedContent) {
      fullResponseText = validation.correctedContent;
    }

    // 6. SAVE ASSISTANT MESSAGE
    const assistantMsgId = `msg_ast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const assistantMessage: StoredMessage = {
      id: assistantMsgId,
      conversationId,
      role: 'assistant',
      content: fullResponseText,
      timestamp: new Date().toISOString(),
      metadata: {
        intent,
        searchMode: effectiveMode,
        autoDeepResearch: topicResult.isAutoDeepResearch,
        topicName: topicResult.topicName,
      },
    };
    await MessageStore.appendMessage(assistantMessage);

    // 7. UPDATE CONVERSATION SUMMARY + EXTRACT LONG-TERM MEMORIES
    setTimeout(() => {
      const allMsgs = MessageStore.getConversationMessages(conversationId);
      ConversationSummarizer.summarizeConversation(conversationId, allMsgs);
      MemoryManager.extractAndSaveMemories(userQuery, fullResponseText, conversationId);
    }, 0);

    // 8. RESET THINKING STAGE TO IDLE
    thinking.reset();

    return {
      userMessage,
      assistantMessage,
      thinkingState: thinking.getState(),
      intent,
      effectiveMode,
      autoDeepResearch: topicResult.isAutoDeepResearch,
    };
  }
}

