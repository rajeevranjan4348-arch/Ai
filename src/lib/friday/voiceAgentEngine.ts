import {
  FridayConfig,
  VoiceTurnConfig,
  STTProvider,
  LLMProvider,
  TTSProvider,
} from './types';
import { getGreetingByTimeOfDay } from './prompts';

export class FridayVoiceAgentEngine {
  private config: FridayConfig;
  private isConnected: boolean = false;

  constructor(initialConfig?: Partial<FridayConfig>) {
    this.config = {
      sttProvider: 'sarvam',
      llmProvider: 'gemini',
      ttsProvider: 'openai',
      geminiModel: 'gemini-2.5-flash',
      openaiLlmModel: 'gpt-4o',
      openaiTtsModel: 'tts-1',
      openaiTtsVoice: 'nova',
      ttsSpeed: 1.15,
      sarvamTtsLanguage: 'en-IN',
      sarvamTtsSpeaker: 'rahul',
      mcpServerPort: 8000,
      ...initialConfig,
    };
  }

  /**
   * Turn detection mode depending on STT Provider
   * Sarvam -> "stt", Whisper -> "vad"
   */
  public getTurnDetection(): 'stt' | 'vad' {
    return this.config.sttProvider === 'sarvam' ? 'stt' : 'vad';
  }

  /**
   * Endpointing delay based on STT Provider
   */
  public getEndpointingDelay(): number {
    switch (this.config.sttProvider) {
      case 'sarvam':
        return 0.07;
      case 'whisper':
        return 0.3;
      default:
        return 0.1;
    }
  }

  public getVoiceTurnConfig(): VoiceTurnConfig {
    return {
      turnDetection: this.getTurnDetection(),
      minEndpointingDelay: this.getEndpointingDelay(),
    };
  }

  /**
   * Generates dynamic onboarding greeting instruction for LiveKit voice agent
   */
  public generateSessionGreeting() {
    const greeting = getGreetingByTimeOfDay();
    return {
      greeting,
      instruction: `Greet user with: '${greeting.greetingText}'. Maintain tone: ${greeting.tone}`,
    };
  }

  public updateConfig(newConfig: Partial<FridayConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  public getConfig(): FridayConfig {
    return { ...this.config };
  }

  public setConnected(connected: boolean) {
    this.isConnected = connected;
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }
}

export const globalFridayVoiceAgent = new FridayVoiceAgentEngine();
