export type ExecutionTarget =
  | 'KOTLIN_DSP_ENGINE'
  | 'C_CPP_NDK_ENGINE'
  | 'JAVA_SECURITY_AUTHENTICATOR'
  | 'KOTLIN_CANVAS_VIEW'
  | 'GEMINI_LIVE_PROCESSOR'
  | 'SYSTEM_AUTOMATION_SERVICE';

export interface IntentRequest {
  queryText: string;
  audioRms?: number;
  sessionId?: string;
  context?: Record<string, string>;
}

export interface IntentResponse {
  intentName: string;
  confidence: number;
  slots: Record<string, string>;
  executionTarget: ExecutionTarget;
  latencyMs: number;
}

export interface VoiceSession {
  sessionId: string;
  userId: string;
  createdAt: string;
  lastActive: string;
  audioFormat: string;
  sampleRate: number;
  isAuthVerified: boolean;
}

export interface SpeakerVerificationResult {
  authenticated: boolean;
  similarityScore: number;
  thresholdRequired: number;
  verificationLatencyMs: number;
}

export interface TokenClaims {
  sub: string;
  role: string;
  iat: number;
  exp: number;
}

export interface SystemTelemetryMetrics {
  cpuUsagePct: number;
  memoryUsageMb: number;
  activeSessionsCount: number;
  totalIntentsRouted: number;
  averageLatencyMs: number;
  systemStatus: 'OPTIMAL' | 'DEGRADED' | 'MAINTENANCE';
}
