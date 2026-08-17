import { UndercoverFilterResult } from './types';

// Anthropic internal codenames & unreleased model numbers
const INTERNAL_CODENAMES = [
  'capybara',
  'tengu',
  'opus-4-7',
  'sonnet-4-8',
  'haiku-4-5',
  'internal-ant-prompt',
  'growthbook-secret-key',
];

const SECRET_PATTERNS = [
  /sk-ant-api03-[A-Za-z0-9_-]{32,}/g,
  /AIzaSy[A-Za-z0-9_-]{33}/g,
  /ghp_[A-Za-z0-9]{36}/g,
];

export class UndercoverSanitizer {
  private isUndercoverActive: boolean;

  constructor(forceUndercover = true) {
    this.isUndercoverActive = forceUndercover;
  }

  /**
   * Sanitizes outgoing commits, PR descriptions, or public messages to prevent blowing cover or leaking internal codenames
   */
  public sanitizeOutput(text: string): UndercoverFilterResult {
    if (!text || !this.isUndercoverActive) {
      return {
        originalText: text,
        sanitizedText: text,
        isSanitized: false,
        strippedCodenames: [],
      };
    }

    let sanitized = text;
    const strippedCodenames: string[] = [];

    // Strip internal animal/model codenames
    for (const codename of INTERNAL_CODENAMES) {
      const regex = new RegExp(`\\b${codename}\\b`, 'gi');
      if (regex.test(sanitized)) {
        strippedCodenames.push(codename);
        sanitized = sanitized.replace(regex, '[REDACTED_MODEL_NAME]');
      }
    }

    // Strip sensitive secrets or API keys
    for (const pattern of SECRET_PATTERNS) {
      if (pattern.test(sanitized)) {
        sanitized = sanitized.replace(pattern, '[REDACTED_API_KEY]');
      }
    }

    return {
      originalText: text,
      sanitizedText: sanitized,
      isSanitized: strippedCodenames.length > 0 || sanitized !== text,
      strippedCodenames,
    };
  }

  public setUndercoverActive(active: boolean) {
    this.isUndercoverActive = active;
  }

  public getIsUndercoverActive(): boolean {
    return this.isUndercoverActive;
  }
}

export const globalUndercoverSanitizer = new UndercoverSanitizer(true);
