import { ThinkingStage, ThinkingState, IntentCategory } from './types';

export class ThinkingStateManager {
  private currentState: ThinkingState;
  private listeners: ((state: ThinkingState) => void)[] = [];

  constructor() {
    this.currentState = {
      stage: 'idle',
      stageMessage: '',
      startTime: Date.now(),
    };
  }

  public subscribe(listener: (state: ThinkingState) => void): () => void {
    this.listeners.push(listener);
    listener(this.currentState);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public setStage(stage: ThinkingStage, extraInfo?: {
    intent?: IntentCategory;
    planSteps?: string[];
    memoriesRetrieved?: number;
    searchQueries?: string[];
    customMessage?: string;
  }) {
    let stageMessage = '';

    switch (stage) {
      case 'understanding':
        stageMessage = 'Thinking...';
        break;
      case 'checking_memory':
        stageMessage = 'Thinking...';
        break;
      case 'planning':
        stageMessage = 'Thinking...';
        break;
      case 'searching':
        stageMessage = 'Thinking...';
        break;
      case 'generating':
        stageMessage = 'Generating...';
        break;
      case 'finalizing':
        stageMessage = 'Generating...';
        break;
      case 'idle':
      default:
        stageMessage = '';
        break;
    }

    if (extraInfo?.customMessage) {
      stageMessage = extraInfo.customMessage;
    }

    this.currentState = {
      stage,
      stageMessage,
      intent: extraInfo?.intent || this.currentState.intent,
      planSteps: extraInfo?.planSteps || this.currentState.planSteps,
      memoriesRetrieved: extraInfo?.memoriesRetrieved !== undefined ? extraInfo.memoriesRetrieved : this.currentState.memoriesRetrieved,
      searchQueries: extraInfo?.searchQueries || this.currentState.searchQueries,
      startTime: stage === 'understanding' ? Date.now() : this.currentState.startTime,
    };

    this.listeners.forEach(listener => listener(this.currentState));
  }

  public getState(): ThinkingState {
    return this.currentState;
  }

  public reset() {
    this.setStage('idle');
  }
}
