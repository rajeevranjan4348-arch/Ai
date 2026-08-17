import { IntentRequest, IntentResponse, ExecutionTarget } from './types';

export class IrisIntentRouter {
  private routedCount: number = 0;

  public routeIntent(request: IntentRequest): IntentResponse {
    const startTime = performance.now();
    this.routedCount++;

    const queryLower = request.queryText.toLowerCase().trim();
    let intentName = 'UNKNOWN_COMMAND';
    let confidence = 0.94;
    const slots: Record<string, string> = {};
    let executionTarget: ExecutionTarget = 'KOTLIN_DSP_ENGINE';

    if (queryLower.includes('status') || queryLower.includes('telemetry') || queryLower.includes('system')) {
      intentName = 'QUERY_SYSTEM_TELEMETRY';
      executionTarget = 'C_CPP_NDK_ENGINE';
      slots['category'] = 'HARDWARE_METRICS';
    } else if (queryLower.includes('voice') || queryLower.includes('auth') || queryLower.includes('biometric')) {
      intentName = 'TRIGGER_BIOMETRIC_AUTH';
      executionTarget = 'JAVA_SECURITY_AUTHENTICATOR';
      slots['security_level'] = 'ZERO_TRUST_PASSIVE';
    } else if (queryLower.includes('visualize') || queryLower.includes('spectrum') || queryLower.includes('orb')) {
      intentName = 'ACTIVATE_SPECTRUM_ORB';
      executionTarget = 'KOTLIN_CANVAS_VIEW';
      slots['mode'] = 'QUANTUM_PARTICLE_MATRIX';
    } else if (queryLower.includes('phone') || queryLower.includes('control') || queryLower.includes('open app') || queryLower.includes('call')) {
      intentName = 'EXECUTE_PHONE_AUTOMATION';
      executionTarget = 'SYSTEM_AUTOMATION_SERVICE';
      slots['automation_type'] = 'NATIVE_ACCESSIBILITY_INTENT';
    } else if (queryLower.includes('live') || queryLower.includes('gemini') || queryLower.includes('speak')) {
      intentName = 'GEMINI_LIVE_AUDIO_STREAM';
      executionTarget = 'GEMINI_LIVE_PROCESSOR';
      slots['protocol'] = 'BIDIRECTIONAL_WEBSOCKET';
    }

    const latencyMs = Math.round(performance.now() - startTime);

    return {
      intentName,
      confidence,
      slots,
      executionTarget,
      latencyMs: Math.max(1, latencyMs),
    };
  }

  public getRoutedCount(): number {
    return this.routedCount;
  }
}

export const globalIrisIntentRouter = new IrisIntentRouter();
