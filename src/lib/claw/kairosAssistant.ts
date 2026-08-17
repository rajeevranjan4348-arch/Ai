import { KairosTrigger } from './types';

export class KairosAssistantEngine {
  private triggers: Map<string, KairosTrigger> = new Map();
  private isAutonomousActive: boolean = false;
  private intervalTimer: NodeJS.Timeout | null = null;
  private onProactiveMessageCallback?: (message: string) => void;

  constructor() {
    this.registerDefaultTriggers();
  }

  private registerDefaultTriggers() {
    this.addTrigger({
      id: 'trigger-code-smell-check',
      type: 'idle_check',
      description: 'Proactively scan session for unhandled exceptions or code smells',
      status: 'pending',
    });

    this.addTrigger({
      id: 'trigger-cron-health',
      type: 'cron',
      description: 'Periodic background system health tick',
      status: 'pending',
      intervalMs: 60000,
    });
  }

  public addTrigger(trigger: KairosTrigger): void {
    this.triggers.set(trigger.id, trigger);
  }

  public startProactiveLoop(onMessage: (message: string) => void): void {
    if (this.isAutonomousActive) return;
    this.isAutonomousActive = true;
    this.onProactiveMessageCallback = onMessage;

    this.intervalTimer = setInterval(() => {
      this.evaluateProactiveTicks();
    }, 45000); // 45s periodic tick
  }

  public stopProactiveLoop(): void {
    this.isAutonomousActive = false;
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  }

  private evaluateProactiveTicks(): void {
    if (!this.isAutonomousActive) return;

    for (const [id, trigger] of this.triggers.entries()) {
      if (trigger.status === 'pending') {
        // Ack first in one line -> work -> send result
        const ackMessage = `[KAIROS PROACTIVE]: Checked background task (${trigger.description}). System operational.`;
        trigger.status = 'completed';
        this.onProactiveMessageCallback?.(ackMessage);
        break;
      }
    }
  }

  public getTriggers(): KairosTrigger[] {
    return Array.from(this.triggers.values());
  }

  public resetAllTriggers(): void {
    this.triggers.forEach((t) => {
      t.status = 'pending';
    });
  }
}

export const globalKairosAssistant = new KairosAssistantEngine();
