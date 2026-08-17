import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

export type SpeechRecognitionErrorType =
  | 'permission-denied'
  | 'unsupported-language'
  | 'network-error'
  | 'no-microphone'
  | 'no-speech'
  | 'not-supported'
  | 'generic';

export interface SpeechRecognitionErrorDetails {
  type: SpeechRecognitionErrorType;
  title: string;
  message: string;
  technicalDetails?: string;
  actionType?: 'permission_prompt' | 'switch_language' | 'retry_network' | 'check_hardware' | 'dismiss';
  suggestedActionLabel?: string;
  timestamp: number;
}

export interface SpeechLanguage {
  code: string;
  name: string;
  nativeName: string;
  flag?: string;
}

export const POPULAR_SPEECH_LANGUAGES: SpeechLanguage[] = [
  { code: 'en-US', name: 'English (United States)', nativeName: 'English (US)', flag: '🇺🇸' },
  { code: 'en-GB', name: 'English (United Kingdom)', nativeName: 'English (UK)', flag: '🇬🇧' },
  { code: 'en-IN', name: 'English (India)', nativeName: 'English (IN)', flag: '🇮🇳' },
  { code: 'es-ES', name: 'Spanish (Spain)', nativeName: 'Español (ES)', flag: '🇪🇸' },
  { code: 'es-MX', name: 'Spanish (Mexico)', nativeName: 'Español (MX)', flag: '🇲🇽' },
  { code: 'fr-FR', name: 'French (France)', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de-DE', name: 'German (Germany)', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'hi-IN', name: 'Hindi (India)', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ja-JP', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '中文 (简体)', flag: '🇨🇳' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)', nativeName: 'Português (BR)', flag: '🇧🇷' },
  { code: 'it-IT', name: 'Italian (Italy)', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'ru-RU', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'ko-KR', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'ar-SA', name: 'Arabic (Saudi Arabia)', nativeName: 'العربية', flag: '🇸🇦' },
];

export interface UseSpeechRecognitionOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  autoSubmitOnSilence?: boolean;
  silenceDuration?: number; // ms, default 2000
  onTranscriptChange?: (transcript: string, isFinal: boolean) => void;
  onAutoSubmit?: (transcript: string) => void;
  onError?: (error: SpeechRecognitionErrorDetails) => void;
}

export interface UseSpeechRecognitionReturn {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  interimTranscript: string;
  autoSubmitOnSilence: boolean;
  setAutoSubmitOnSilence: (enabled: boolean) => void;
  currentLanguage: string;
  setLanguage: (langCode: string) => void;
  availableLanguages: SpeechLanguage[];
  error: SpeechRecognitionErrorDetails | null;
  clearError: () => void;
  startListening: (initialBaseText?: string) => void;
  stopListening: () => void;
  toggleListening: (currentText?: string) => void;
  retryListening: () => void;
  requestMicrophonePermission: () => Promise<boolean>;
  fallbackToDefaultLanguage: () => void;
  resetTranscript: () => void;
}

// Get the browser-specific SpeechRecognition constructor
export function getBrowserSpeechRecognition(): any {
  if (typeof window === 'undefined') return null;
  return (
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition ||
    (window as any).mozSpeechRecognition ||
    (window as any).msSpeechRecognition ||
    null
  );
}

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}): UseSpeechRecognitionReturn {
  const {
    lang: initialLang = (typeof navigator !== 'undefined' ? navigator.language : 'en-US') || 'en-US',
    continuous = true,
    interimResults = true,
    autoSubmitOnSilence: initialAutoSubmit = true,
    silenceDuration = 2000,
    onTranscriptChange,
    onAutoSubmit,
    onError,
  } = options;

  const [currentLanguage, setCurrentLanguage] = useState<string>(initialLang);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [autoSubmitOnSilence, setAutoSubmitOnSilence] = useState(initialAutoSubmit);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<SpeechRecognitionErrorDetails | null>(null);

  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const baseTextRef = useRef<string>('');
  const fullTranscriptRef = useRef<string>('');
  const isListeningRef = useRef<boolean>(false);
  const hasAutoSubmittedRef = useRef<boolean>(false);
  const currentLangRef = useRef<string>(initialLang);
  const retryCountRef = useRef<number>(0);

  // Keep callback refs fresh
  const onTranscriptChangeRef = useRef(onTranscriptChange);
  const onAutoSubmitRef = useRef(onAutoSubmit);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onTranscriptChangeRef.current = onTranscriptChange;
    onAutoSubmitRef.current = onAutoSubmit;
    onErrorRef.current = onError;
  }, [onTranscriptChange, onAutoSubmit, onError]);

  useEffect(() => {
    currentLangRef.current = currentLanguage;
  }, [currentLanguage]);

  // Check support on mount
  useEffect(() => {
    const SpeechRecognition = getBrowserSpeechRecognition();
    const supported = Boolean(SpeechRecognition);
    setIsSupported(supported);
    if (!supported) {
      const errDetails: SpeechRecognitionErrorDetails = {
        type: 'not-supported',
        title: 'Browser Not Supported',
        message: 'SpeechRecognition API is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Safari for voice dictation.',
        suggestedActionLabel: 'Use Chrome or Edge',
        timestamp: Date.now(),
      };
      setError(errDetails);
    }
  }, []);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    hasAutoSubmittedRef.current = false;
    clearSilenceTimer();

    if (recognitionRef.current) {
      try {
        const instance = recognitionRef.current;
        recognitionRef.current = null;
        instance.onresult = null;
        instance.onend = null;
        instance.onerror = null;
        instance.stop();
      } catch (e) {
        // Safe ignore
      }
    }

    setIsListening(false);
    setInterimTranscript('');
  }, [clearSilenceTimer]);

  const triggerAutoSubmit = useCallback((textToSubmit: string) => {
    if (hasAutoSubmittedRef.current) return;
    hasAutoSubmittedRef.current = true;

    const cleaned = textToSubmit.trim();
    if (!cleaned) {
      stopListening();
      return;
    }

    stopListening();

    if (onAutoSubmitRef.current) {
      onAutoSubmitRef.current(cleaned);
    }
  }, [stopListening]);

  const requestMicrophonePermission = useCallback(async (): Promise<boolean> => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop all tracks after permission granted
      stream.getTracks().forEach((track) => track.stop());
      clearError();
      toast.success('Microphone permission granted!');
      return true;
    } catch (err: any) {
      console.warn('Microphone permission request rejected:', err);
      const errDetails: SpeechRecognitionErrorDetails = {
        type: 'permission-denied',
        title: 'Microphone Permission Denied',
        message: 'Microphone access was blocked. Please click the camera/lock icon in your browser address bar and select "Allow" for microphone access.',
        actionType: 'permission_prompt',
        suggestedActionLabel: 'Allow in Browser Settings',
        technicalDetails: err?.message || 'Permission denied',
        timestamp: Date.now(),
      };
      setError(errDetails);
      onErrorRef.current?.(errDetails);
      return false;
    }
  }, [clearError]);

  const startListening = useCallback((initialBaseText: string = '') => {
    const SpeechRecognition = getBrowserSpeechRecognition();
    if (!SpeechRecognition) {
      const errDetails: SpeechRecognitionErrorDetails = {
        type: 'not-supported',
        title: 'Speech Recognition Unavailable',
        message: 'SpeechRecognition API is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Safari.',
        timestamp: Date.now(),
      };
      setError(errDetails);
      toast.error(errDetails.message);
      onErrorRef.current?.(errDetails);
      return;
    }

    // Clear previous error
    clearError();

    // Stop any existing instance
    if (isListeningRef.current || recognitionRef.current) {
      stopListening();
    }

    baseTextRef.current = initialBaseText;
    hasAutoSubmittedRef.current = false;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.lang = currentLangRef.current || 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        isListeningRef.current = true;
        hasAutoSubmittedRef.current = false;
        retryCountRef.current = 0;
        setIsListening(true);
        setInterimTranscript('');
        clearError();
        toast.success(`Microphone active (${recognition.lang}): Speak clearly`, { id: 'speech-recognition-active' });
      };

      recognition.onresult = (event: any) => {
        if (!isListeningRef.current || hasAutoSubmittedRef.current) return;

        let accumulatedFinal = '';
        let accumulatedInterim = '';

        for (let i = 0; i < event.results.length; ++i) {
          const result = event.results[i];
          const chunk = result[0]?.transcript || '';
          if (!chunk) continue;

          if (result.isFinal) {
            accumulatedFinal += chunk.trim() + ' ';
          } else {
            accumulatedInterim += chunk.trim() + ' ';
          }
        }

        const spokenWords = `${accumulatedFinal}${accumulatedInterim}`.replace(/\s+/g, ' ').trim();
        const base = baseTextRef.current.trim();
        const combined = base ? `${base} ${spokenWords}` : spokenWords;

        setTranscript(combined);
        setInterimTranscript(spokenWords);
        fullTranscriptRef.current = combined;

        onTranscriptChangeRef.current?.(combined, Boolean(accumulatedFinal && !accumulatedInterim));

        // Auto-submit silence detection
        clearSilenceTimer();

        if (autoSubmitOnSilence && combined.length > 2) {
          silenceTimerRef.current = setTimeout(() => {
            if (isListeningRef.current && !hasAutoSubmittedRef.current && fullTranscriptRef.current.trim()) {
              triggerAutoSubmit(fullTranscriptRef.current.trim());
            }
          }, silenceDuration);
        }
      };

      recognition.onerror = (event: any) => {
        const errorKey = event.error;
        console.warn('SpeechRecognition error encountered:', errorKey, event);

        let errDetails: SpeechRecognitionErrorDetails;

        switch (errorKey) {
          case 'not-allowed':
          case 'service-not-allowed':
            errDetails = {
              type: 'permission-denied',
              title: 'Microphone Permission Blocked',
              message: 'Your browser denied access to the microphone. Please click the site permission/lock icon in your address bar and set Microphone to "Allow".',
              actionType: 'permission_prompt',
              suggestedActionLabel: 'Grant Permission',
              technicalDetails: `Error: ${errorKey}`,
              timestamp: Date.now(),
            };
            toast.error(errDetails.title + ': ' + errDetails.message, { id: 'speech-recognition-active', duration: 5000 });
            stopListening();
            break;

          case 'language-not-supported':
            errDetails = {
              type: 'unsupported-language',
              title: 'Language Not Supported',
              message: `The speech recognition engine does not support language code "${currentLangRef.current}". Switch to English (US) or another supported language.`,
              actionType: 'switch_language',
              suggestedActionLabel: 'Switch to English (US)',
              technicalDetails: `Error: language-not-supported for ${currentLangRef.current}`,
              timestamp: Date.now(),
            };
            toast.error(errDetails.title + ': ' + errDetails.message, { id: 'speech-recognition-active', duration: 5000 });
            stopListening();
            break;

          case 'network':
            errDetails = {
              type: 'network-error',
              title: 'Network Interrupted',
              message: 'Speech transcription failed due to network connectivity issues with the speech recognition service. Please check your internet connection and try again.',
              actionType: 'retry_network',
              suggestedActionLabel: 'Retry Connection',
              technicalDetails: 'Network communication error with speech server',
              timestamp: Date.now(),
            };
            toast.error(errDetails.title + ': ' + errDetails.message, { id: 'speech-recognition-active', duration: 5000 });
            stopListening();
            break;

          case 'audio-capture':
            errDetails = {
              type: 'no-microphone',
              title: 'No Audio Capture Device',
              message: 'No microphone was detected, or your audio hardware is currently occupied by another program.',
              actionType: 'check_hardware',
              suggestedActionLabel: 'Check Audio Input',
              technicalDetails: 'Audio capture device unavailable',
              timestamp: Date.now(),
            };
            toast.error(errDetails.title, { id: 'speech-recognition-active' });
            stopListening();
            break;

          case 'no-speech':
            // Non-fatal warning when user pauses or doesn't speak
            errDetails = {
              type: 'no-speech',
              title: 'No Speech Detected',
              message: 'No speech was detected. Please speak closer to your microphone.',
              actionType: 'dismiss',
              suggestedActionLabel: 'Speak Again',
              technicalDetails: 'No speech detected within timeout window',
              timestamp: Date.now(),
            };
            break;

          case 'bad-grammar':
            errDetails = {
              type: 'generic',
              title: 'Grammar Error',
              message: 'Speech recognition grammar compilation failed.',
              timestamp: Date.now(),
            };
            stopListening();
            break;

          case 'aborted':
            // User or script intentionally aborted, do not flag as error
            return;

          default:
            errDetails = {
              type: 'generic',
              title: 'Speech Recognition Error',
              message: `Speech transcription encountered an issue (${errorKey || 'unknown'}).`,
              technicalDetails: errorKey,
              actionType: 'retry_network',
              suggestedActionLabel: 'Try Again',
              timestamp: Date.now(),
            };
            stopListening();
            break;
        }

        setError(errDetails);
        onErrorRef.current?.(errDetails);
      };

      recognition.onend = () => {
        // If still marked as listening and hasn't submitted, attempt seamless restart if continuous
        if (isListeningRef.current && !hasAutoSubmittedRef.current && !error) {
          try {
            recognition.start();
            return;
          } catch (e) {
            // End gracefully
          }
        }
        stopListening();
      };

      recognitionRef.current = recognition;
      isListeningRef.current = true;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to start SpeechRecognition:', err);
      stopListening();
      const errDetails: SpeechRecognitionErrorDetails = {
        type: 'generic',
        title: 'Initialization Failed',
        message: 'Failed to start speech recognition: ' + (err.message || String(err)),
        technicalDetails: String(err),
        timestamp: Date.now(),
      };
      setError(errDetails);
      toast.error(errDetails.message);
      onErrorRef.current?.(errDetails);
    }
  }, [
    clearError,
    continuous,
    interimResults,
    autoSubmitOnSilence,
    silenceDuration,
    clearSilenceTimer,
    stopListening,
    triggerAutoSubmit,
    error,
  ]);

  const toggleListening = useCallback((currentText: string = '') => {
    if (isListeningRef.current || isListening) {
      stopListening();
      toast.dismiss('speech-recognition-active');
      toast.info('Dictation stopped.');
    } else {
      startListening(currentText);
    }
  }, [isListening, startListening, stopListening]);

  const retryListening = useCallback(() => {
    clearError();
    startListening(baseTextRef.current);
  }, [clearError, startListening]);

  const fallbackToDefaultLanguage = useCallback(() => {
    setCurrentLanguage('en-US');
    currentLangRef.current = 'en-US';
    clearError();
    toast.success('Dictation language reset to English (US)');
    startListening(baseTextRef.current);
  }, [clearError, startListening]);

  const setLanguage = useCallback((langCode: string) => {
    setCurrentLanguage(langCode);
    currentLangRef.current = langCode;
    clearError();
    // If currently listening, restart with new language
    if (isListeningRef.current) {
      const current = fullTranscriptRef.current;
      stopListening();
      setTimeout(() => {
        startListening(current);
      }, 150);
    }
  }, [clearError, startListening, stopListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    fullTranscriptRef.current = '';
    baseTextRef.current = '';
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    autoSubmitOnSilence,
    setAutoSubmitOnSilence,
    currentLanguage,
    setLanguage,
    availableLanguages: POPULAR_SPEECH_LANGUAGES,
    error,
    clearError,
    startListening,
    stopListening,
    toggleListening,
    retryListening,
    requestMicrophonePermission,
    fallbackToDefaultLanguage,
    resetTranscript,
  };
}
