import { useState, useCallback, useEffect } from 'react';
import {
  globalIrisIntentRouter,
  globalIrisSessionManager,
  globalIrisSpeakerVerifier,
  globalIrisAuthServer,
  globalIrisTelemetryEngine,
  IntentResponse,
  VoiceSession,
  SpeakerVerificationResult,
  SystemTelemetryMetrics,
} from '@/lib/irisX';

export function useIrisXSystem() {
  const [activeSession, setActiveSession] = useState<VoiceSession | null>(null);
  const [telemetry, setTelemetry] = useState<SystemTelemetryMetrics | null>(null);

  // Initialize primary voice session on mount
  useEffect(() => {
    const session = globalIrisSessionManager.createSession('user_iris_primary');
    setActiveSession(session);
    setTelemetry(globalIrisTelemetryEngine.getMetrics());
  }, []);

  // Route command query intent
  const routeQuery = useCallback((queryText: string): IntentResponse => {
    const response = globalIrisIntentRouter.routeIntent({
      queryText,
      sessionId: activeSession?.sessionId,
    });
    setTelemetry(globalIrisTelemetryEngine.getMetrics());
    return response;
  }, [activeSession]);

  // Perform neural voiceprint speaker verification
  const verifyVoiceprint = useCallback((candidateVector: number[]): SpeakerVerificationResult => {
    return globalIrisSpeakerVerifier.verify(candidateVector);
  }, []);

  // Issue OAuth2 JWT auth token
  const issueToken = useCallback((userId = 'user_iris_primary', role = 'ADMIN') => {
    return globalIrisAuthServer.generateToken(userId, role);
  }, []);

  return {
    activeSession,
    telemetry,
    routeQuery,
    verifyVoiceprint,
    issueToken,
  };
}
