import { VoiceSession } from './types';

export class IrisSessionManager {
  private sessions: Map<string, VoiceSession> = new Map();

  public createSession(userId: string = 'user_default'): VoiceSession {
    const randomHex = Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    const sessionId = `sess_${randomHex}`;
    const now = new Date().toISOString();

    const session: VoiceSession = {
      sessionId,
      userId,
      createdAt: now,
      lastActive: now,
      audioFormat: 'PCM_16BIT_MONO',
      sampleRate: 44100,
      isAuthVerified: true,
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  public getSession(sessionId: string): VoiceSession | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActive = new Date().toISOString();
    }
    return session;
  }

  public closeSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  public getActiveSessions(): VoiceSession[] {
    return Array.from(this.sessions.values());
  }
}

export const globalIrisSessionManager = new IrisSessionManager();
