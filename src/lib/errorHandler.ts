import { toast } from 'sonner';

export type ErrorCode =
  | 'RATE_LIMIT_EXCEEDED'
  | 'NETWORK_ERROR'
  | 'TIMEOUT_ERROR'
  | 'API_ERROR'
  | 'INVALID_INPUT'
  | 'TOOL_EXECUTION_ERROR'
  | 'PARSE_ERROR'
  | 'UNKNOWN_ERROR';

export interface AppError {
  message: string;
  code: ErrorCode;
  details?: string;
  status?: number;
  isRateLimit: boolean;
  isNetwork: boolean;
  retryable: boolean;
  timestamp: string;
}

/**
 * Normalizes any error object, string, or unknown thrown value into a standardized AppError format.
 */
export function formatAppError(error: unknown, fallbackMessage: string = 'An unexpected error occurred.'): AppError {
  const timestamp = new Date().toISOString();

  if (typeof error === 'string') {
    const isRateLimit = checkIsRateLimit(error);
    const isNetwork = checkIsNetworkError(error);
    return {
      message: error,
      code: isRateLimit ? 'RATE_LIMIT_EXCEEDED' : isNetwork ? 'NETWORK_ERROR' : 'UNKNOWN_ERROR',
      isRateLimit,
      isNetwork,
      retryable: isRateLimit || isNetwork,
      timestamp,
    };
  }

  if (error && typeof error === 'object') {
    const errObj = error as Record<string, any>;
    const rawMessage = errObj.message || errObj.error || errObj.statusText || fallbackMessage;
    const status = errObj.status || errObj.statusCode;
    
    const isRateLimit = status === 429 || checkIsRateLimit(rawMessage) || errObj.code === 'RATE_LIMIT_EXCEEDED' || errObj.isRateLimit === true;
    const isNetwork = checkIsNetworkError(rawMessage) || errObj.name === 'TypeError' || errObj.code === 'NETWORK_ERROR' || errObj.isNetwork === true;
    const isTimeout = errObj.name === 'AbortError' || rawMessage.toLowerCase().includes('timeout');

    let code: ErrorCode = 'API_ERROR';
    if (isRateLimit) code = 'RATE_LIMIT_EXCEEDED';
    else if (isTimeout) code = 'TIMEOUT_ERROR';
    else if (isNetwork) code = 'NETWORK_ERROR';
    else if (errObj.code && typeof errObj.code === 'string') code = errObj.code as ErrorCode;

    return {
      message: sanitizeErrorMessage(rawMessage),
      code,
      details: errObj.details ? String(errObj.details) : errObj.stack ? String(errObj.stack) : undefined,
      status: typeof status === 'number' ? status : undefined,
      isRateLimit,
      isNetwork,
      retryable: isRateLimit || isNetwork || isTimeout || status === 502 || status === 503 || status === 504,
      timestamp,
    };
  }

  return {
    message: fallbackMessage,
    code: 'UNKNOWN_ERROR',
    isRateLimit: false,
    isNetwork: false,
    retryable: true,
    timestamp,
  };
}

function checkIsRateLimit(msg: string): boolean {
  if (!msg) return false;
  const lower = String(msg).toLowerCase();
  return (
    lower.includes('429') ||
    lower.includes('quota') ||
    lower.includes('rate limit') ||
    lower.includes('resource_exhausted') ||
    lower.includes('too many requests')
  );
}

function checkIsNetworkError(msg: string): boolean {
  if (!msg) return false;
  const lower = String(msg).toLowerCase();
  return (
    lower.includes('failed to fetch') ||
    lower.includes('network error') ||
    lower.includes('networkerror') ||
    lower.includes('offline') ||
    lower.includes('econnrefused')
  );
}

function sanitizeErrorMessage(msg: string): string {
  if (!msg) return 'An error occurred during request processing.';
  // Hide sensitive raw stack traces or internal JSON if formatted as huge unparsed string
  if (msg.includes('RESOURCE_EXHAUSTED')) {
    return 'Gemini API rate limit or free tier quota reached. Please wait a moment before trying again.';
  }
  if (msg.includes('Failed to fetch')) {
    return 'Network connection issue. Please check your internet connection and try again.';
  }
  return msg;
}

/**
 * Standardized Toast Notification helper for consistent UI error reporting across all components.
 */
export function showErrorToast(error: unknown, customTitle?: string, onRetry?: () => void): AppError {
  const appError = formatAppError(error);
  const title = customTitle || (appError.isRateLimit ? 'Rate Limit Exceeded' : appError.isNetwork ? 'Network Connection Issue' : 'Action Failed');

  toast.error(title, {
    description: appError.message,
    duration: appError.isRateLimit ? 7000 : 5000,
    action: onRetry && appError.retryable ? {
      label: 'Retry',
      onClick: () => onRetry(),
    } : undefined,
  });

  return appError;
}

/**
 * Standardized fetch wrapper with timeout, status checking, and automatic AppError transformation.
 */
export async function safeFetch<T = any>(
  url: string,
  options?: RequestInit,
  timeoutMs: number = 25000
): Promise<{ data: T | null; error: AppError | null }> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const body = isJson ? await response.json().catch(() => ({})) : await response.text();

    if (!response.ok) {
      const errMsg = typeof body === 'object' && body?.error?.message ? body.error.message : typeof body === 'object' && body?.error ? body.error : typeof body === 'string' ? body : `HTTP error ${response.status}`;
      const appErr = formatAppError({
        message: errMsg,
        status: response.status,
        details: body,
      });
      return { data: null, error: appErr };
    }

    return { data: body as T, error: null };
  } catch (err: any) {
    clearTimeout(id);
    const appErr = formatAppError(err);
    return { data: null, error: appErr };
  }
}
