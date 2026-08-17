const STORAGE_KEYS = {
  OPENAI_API_KEY: 'perplexity_openai_api_key',
  GEMINI_API_KEY: 'perplexity_gemini_api_key',
  MINIMAX_API_KEY: 'perplexity_minimax_api_key',
  BFL_API_KEY: 'perplexity_bfl_api_key',
};

const DEFAULT_OPENAI_KEY = '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';
const DEFAULT_MINIMAX_KEY = 'sk-api-UJwKoymob0AUQ39_TeUrlqNZzioRF378y7nrTJgZy5J2om0gLkOCCC0AO4CKh2lGhD27MiWtLd9UTdokWXFQBqDimW3jSTarqVjK2l-pGes9ix1EYdYKeDI';
const DEFAULT_BFL_KEY = 'bfl_dFWKvi1QFPOdxjydfIh7gSQV78o4gSaB';

export interface KeySource {
  key: string;
  source: 'custom' | 'env' | 'default' | 'none';
}

/**
 * Get active Black Forest Labs (BFL Flux) API key with source metadata.
 */
export function getBFLKeyInfo(): KeySource {
  try {
    const customKey = localStorage.getItem(STORAGE_KEYS.BFL_API_KEY)?.trim();
    if (customKey) {
      return { key: customKey, source: 'custom' };
    }
  } catch (e) {
    console.warn('Failed to read custom BFL key from localStorage:', e);
  }

  const processEnvKey = typeof globalThis !== 'undefined' && (globalThis as any).process?.env?.BFL_API_KEY;
  const envKey = (import.meta as any).env?.VITE_BFL_API_KEY || (import.meta as any).env?.BFL_API_KEY || processEnvKey;

  if (envKey && envKey.trim()) {
    return { key: envKey.trim(), source: 'env' };
  }

  if (DEFAULT_BFL_KEY && DEFAULT_BFL_KEY.trim()) {
    return { key: DEFAULT_BFL_KEY.trim(), source: 'default' };
  }

  return { key: '', source: 'none' };
}

/**
 * Get active MiniMax API key with source metadata.
 */
export function getMiniMaxKeyInfo(): KeySource {
  try {
    const customKey = localStorage.getItem(STORAGE_KEYS.MINIMAX_API_KEY)?.trim();
    if (customKey) {
      return { key: customKey, source: 'custom' };
    }
  } catch (e) {
    console.warn('Failed to read custom MiniMax key from localStorage:', e);
  }

  const processEnvKey = typeof globalThis !== 'undefined' && (globalThis as any).process?.env?.MINIMAX_API_KEY;
  const envKey = (import.meta as any).env?.VITE_MINIMAX_API_KEY || processEnvKey;

  if (envKey && envKey.trim()) {
    return { key: envKey.trim(), source: 'env' };
  }

  if (DEFAULT_MINIMAX_KEY && DEFAULT_MINIMAX_KEY.trim()) {
    return { key: DEFAULT_MINIMAX_KEY.trim(), source: 'default' };
  }

  return { key: '', source: 'none' };
}

/**
 * Get active OpenAI API key with source metadata.
 * Resolution order:
 * 1. User custom key saved in localStorage
 * 2. VITE_OPENAI_API_KEY or OPENAI_API_KEY environment variables
 * 3. Default fallback key
 */
export function getOpenAIKeyInfo(): KeySource {
  try {
    const customKey = localStorage.getItem(STORAGE_KEYS.OPENAI_API_KEY)?.trim();
    if (customKey) {
      return { key: customKey, source: 'custom' };
    }
  } catch (e) {
    console.warn('Failed to read custom OpenAI key from localStorage:', e);
  }

  const processEnvKey = typeof globalThis !== 'undefined' && (globalThis as any).process?.env?.OPENAI_API_KEY;
  const envKey = (import.meta as any).env?.VITE_OPENAI_API_KEY || processEnvKey;

  if (envKey && envKey.trim()) {
    return { key: envKey.trim(), source: 'env' };
  }

  if (DEFAULT_OPENAI_KEY && DEFAULT_OPENAI_KEY.trim()) {
    return { key: DEFAULT_OPENAI_KEY.trim(), source: 'default' };
  }

  return { key: '', source: 'none' };
}

/**
 * Get active Gemini API key with source metadata.
 */
export function getGeminiKeyInfo(): KeySource {
  try {
    const customKey = localStorage.getItem(STORAGE_KEYS.GEMINI_API_KEY)?.trim();
    if (customKey) {
      return { key: customKey, source: 'custom' };
    }
  } catch (e) {
    console.warn('Failed to read custom Gemini key from localStorage:', e);
  }

  const processEnvKey = typeof globalThis !== 'undefined' && (globalThis as any).process?.env?.GEMINI_API_KEY;
  const envKey = (import.meta as any).env?.GEMINI_API_KEY || processEnvKey;

  if (envKey && envKey.trim()) {
    return { key: envKey.trim(), source: 'env' };
  }

  return { key: '', source: 'none' };
}

/**
 * Save user custom API keys to localStorage.
 */
export function saveCustomKeys(keys: { openaiKey?: string; geminiKey?: string; minimaxKey?: string; bflKey?: string }): void {
  try {
    if (keys.openaiKey !== undefined) {
      if (keys.openaiKey.trim()) {
        localStorage.setItem(STORAGE_KEYS.OPENAI_API_KEY, keys.openaiKey.trim());
      } else {
        localStorage.removeItem(STORAGE_KEYS.OPENAI_API_KEY);
      }
    }

    if (keys.geminiKey !== undefined) {
      if (keys.geminiKey.trim()) {
        localStorage.setItem(STORAGE_KEYS.GEMINI_API_KEY, keys.geminiKey.trim());
      } else {
        localStorage.removeItem(STORAGE_KEYS.GEMINI_API_KEY);
      }
    }

    if (keys.minimaxKey !== undefined) {
      if (keys.minimaxKey.trim()) {
        localStorage.setItem(STORAGE_KEYS.MINIMAX_API_KEY, keys.minimaxKey.trim());
      } else {
        localStorage.removeItem(STORAGE_KEYS.MINIMAX_API_KEY);
      }
    }

    if (keys.bflKey !== undefined) {
      if (keys.bflKey.trim()) {
        localStorage.setItem(STORAGE_KEYS.BFL_API_KEY, keys.bflKey.trim());
      } else {
        localStorage.removeItem(STORAGE_KEYS.BFL_API_KEY);
      }
    }
  } catch (e) {
    console.error('Failed to save API keys to localStorage:', e);
  }
}

/**
 * Clear custom saved keys from localStorage.
 */
export function clearCustomKeys(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.OPENAI_API_KEY);
    localStorage.removeItem(STORAGE_KEYS.GEMINI_API_KEY);
    localStorage.removeItem(STORAGE_KEYS.MINIMAX_API_KEY);
    localStorage.removeItem(STORAGE_KEYS.BFL_API_KEY);
  } catch (e) {
    console.error('Failed to clear API keys from localStorage:', e);
  }
}
