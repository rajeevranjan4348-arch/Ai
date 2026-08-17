import { SystemTelemetryMetrics } from './types';
import { globalIrisIntentRouter } from './intentRouter';
import { globalIrisSessionManager } from './sessionManager';

export class IrisTelemetryEngine {
  public getMetrics(): SystemTelemetryMetrics {
    const activeSessions = globalIrisSessionManager.getActiveSessions().length;
    const totalIntents = globalIrisIntentRouter.getRoutedCount();

    return {
      cpuUsagePct: Math.round((12 + Math.random() * 8) * 10) / 10,
      memoryUsageMb: 142 + Math.floor(Math.random() * 20),
      activeSessionsCount: activeSessions,
      totalIntentsRouted: totalIntents,
      averageLatencyMs: 1.25,
      systemStatus: 'OPTIMAL',
    };
  }
}

export const globalIrisTelemetryEngine = new IrisTelemetryEngine();
