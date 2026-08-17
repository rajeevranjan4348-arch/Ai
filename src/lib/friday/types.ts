export type STTProvider = 'sarvam' | 'whisper';
export type LLMProvider = 'gemini' | 'openai' | 'groq';
export type TTSProvider = 'openai' | 'sarvam';

export interface FridayConfig {
  sttProvider: STTProvider;
  llmProvider: LLMProvider;
  ttsProvider: TTSProvider;
  geminiModel: string;
  openaiLlmModel: string;
  openaiTtsModel: string;
  openaiTtsVoice: string;
  ttsSpeed: number;
  sarvamTtsLanguage: string;
  sarvamTtsSpeaker: string;
  mcpServerPort: number;
}

export interface NewsArticle {
  source: string;
  title: string;
  summary: string;
  link: string;
}

export interface WordCountResult {
  characters: number;
  words: number;
  lines: number;
}

export interface SystemInfo {
  os: string;
  osVersion: string;
  machine: string;
  pythonVersion: string;
  agentVersion: string;
}

export interface MCPToolDefinition {
  name: string;
  description: string;
  category: 'web' | 'system' | 'utils';
  parameters?: Record<string, { type: string; required?: boolean; description?: string }>;
}

export interface MCPResourceDefinition {
  uri: string;
  name: string;
  description: string;
  content: string;
}

export interface MCPPromptDefinition {
  name: string;
  description: string;
  template: (args: Record<string, string>) => string;
}

export interface VoiceTurnConfig {
  turnDetection: 'stt' | 'vad';
  minEndpointingDelay: number;
}

export interface AgentGreeting {
  timeOfDay: 'late_night' | 'morning' | 'afternoon' | 'evening';
  greetingText: string;
  tone: string;
}
