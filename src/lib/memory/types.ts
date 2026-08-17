export type Role = 'user' | 'assistant' | 'system';

export type IntentCategory = 
  | 'casual_conversation'
  | 'follow_up_question'
  | 'normal_chat'
  | 'coding'
  | 'debugging'
  | 'research'
  | 'web_search_required'
  | 'role_lookup'
  | 'file_analysis'
  | 'task_execution'
  | 'creative_writing';

export type MemoryCategory = 'preference' | 'fact' | 'decision' | 'task' | 'code' | 'general';

export interface MessageAttachment {
  id: string;
  name: string;
  type: string;
  url?: string;
  size?: number;
}

export interface MessageToolCall {
  id: string;
  name: string;
  args?: any;
  result?: any;
  timestamp: string;
}

export interface StoredMessage {
  id: string;
  conversationId: string;
  role: Role;
  content: string;
  timestamp: string;
  parts?: any[];
  attachments?: MessageAttachment[];
  toolCalls?: MessageToolCall[];
  metadata?: {
    intent?: IntentCategory;
    thinkingTimeMs?: number;
    tokensUsed?: number;
    searchMode?: 'chat' | 'search' | 'research';
    autoDeepResearch?: boolean;
    topicName?: string;
  };
}

export interface LongTermMemory {
  id: string;
  conversationId?: string; // Optional if global
  fact: string;
  category: MemoryCategory;
  importance: number; // 1 to 5
  confidence: number; // 0 to 1
  createdAt: string;
  lastAccessedAt: string;
  accessCount: number;
  tags?: string[];
}

export interface MemoryRetrievalScore {
  memory: LongTermMemory;
  score: number;
  semanticSimilarity: number;
  recencyScore: number;
  importanceScore: number;
  taskRelevanceScore: number;
}

export interface ConversationSummary {
  conversationId: string;
  summaryText: string;
  keyFacts: string[];
  unresolvedQuestions: string[];
  userRequirements: string[];
  decisions: string[];
  lastUpdated: string;
}

export interface ConversationState {
  conversationId: string;
  title: string;
  summary?: ConversationSummary;
  createdAt: string;
  updatedAt: string;
  isPinned?: boolean;
  isArchived?: boolean;
  tags?: string[];
  messageCount: number;
  lastIntent?: IntentCategory;
}

export type ThinkingStage = 
  | 'idle'
  | 'understanding'
  | 'checking_memory'
  | 'planning'
  | 'searching'
  | 'generating'
  | 'finalizing';

export interface ThinkingState {
  stage: ThinkingStage;
  stageMessage: string;
  intent?: IntentCategory;
  planSteps?: string[];
  memoriesRetrieved?: number;
  searchQueries?: string[];
  startTime: number;
}
