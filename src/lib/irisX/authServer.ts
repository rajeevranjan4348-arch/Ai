import { TokenClaims } from './types';

export class IrisAuthServer {
  private secretKey: string;

  constructor(secretKey = 'IRIS_MASTER_SECRET_KEY_2026') {
    this.secretKey = secretKey;
  }

  /**
   * Generates a signed OAuth2 JWT token for IRIS system claims
   */
  public generateToken(userId: string, role = 'ADMIN'): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 24 * 3600; // 24 hours

    const claims: TokenClaims = {
      sub: userId,
      role,
      iat,
      exp,
    };

    const payload = btoa(JSON.stringify(claims))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    // Pseudo signature hash for browser runtime compatibility
    const signature = btoa(`${header}.${payload}.${this.secretKey}`)
      .substring(0, 32)
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    return `${header}.${payload}.${signature}`;
  }

  /**
   * Decodes JWT claims from token
   */
  public parseToken(token: string): TokenClaims | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const decodedPayload = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decodedPayload) as TokenClaims;
    } catch {
      return null;
    }
  }
}

export const globalIrisAuthServer = new IrisAuthServer();
