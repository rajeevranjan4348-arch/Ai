import { toast } from 'sonner';

export interface VoicePersona {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'system';
  description: string;
  defaultPitch: number;
  defaultRate: number;
  voiceKeywords: string[];
}

export const VOICE_PERSONAS: VoicePersona[] = [
  {
    id: 'male-deep',
    name: 'Rishi (Male - Deep & Natural)',
    gender: 'male',
    description: 'Deep, clear male voice with focused articulation',
    defaultPitch: 0.82,
    defaultRate: 1.0,
    voiceKeywords: ['google us english male', 'google uk english male', 'alex', 'david', 'daniel', 'george', 'rishi', 'aaron', 'brian', 'guy', 'james', 'mark', 'microsoft david', 'microsoft mark'],
  },
  {
    id: 'male-warm',
    name: 'Guy (Male - Warm & Friendly)',
    gender: 'male',
    description: 'Warm, conversational male voice with smooth pitch',
    defaultPitch: 0.95,
    defaultRate: 1.05,
    voiceKeywords: ['guy', 'david', 'microsoft david', 'google us english male', 'alex', 'fred'],
  },
  {
    id: 'female-calm',
    name: 'Samantha (Female - Calm & Clear)',
    gender: 'female',
    description: 'Smooth, elegant female voice for articulate listening',
    defaultPitch: 1.0,
    defaultRate: 1.0,
    voiceKeywords: ['samantha', 'victoria', 'google us english', 'karen', 'fiona', 'microsoft zira'],
  },
  {
    id: 'female-energetic',
    name: 'Victoria (Female - Bright & Energetic)',
    gender: 'female',
    description: 'Lively, expressive female voice',
    defaultPitch: 1.1,
    defaultRate: 1.08,
    voiceKeywords: ['victoria', 'google uk english female', 'samantha', 'karen'],
  },
  {
    id: 'system-default',
    name: 'System Default Voice',
    gender: 'system',
    description: 'Uses your operating system default text-to-speech voice',
    defaultPitch: 1.0,
    defaultRate: 1.0,
    voiceKeywords: [],
  },
];

const STORAGE_KEY_PERSONA = 'rishi_ai_voice_persona';
const STORAGE_KEY_RATE = 'rishi_ai_voice_rate';
const STORAGE_KEY_PITCH = 'rishi_ai_voice_pitch';
const STORAGE_KEY_VOLUME = 'rishi_ai_voice_volume';
const STORAGE_KEY_AUTO_TTS = 'rishi_ai_auto_tts_enabled';
const STORAGE_KEY_VOICE_URI = 'rishi_ai_selected_voice_uri';

export interface TTSState {
  isSpeaking: boolean;
  isPaused: boolean;
  currentText: string;
  autoTTS: boolean;
  personaId: string;
  voiceURI: string | null;
  rate: number;
  pitch: number;
  volume: number;
}

let activeUtterance: SpeechSynthesisUtterance | null = null;
const stateListeners = new Set<(state: TTSState) => void>();

let currentTTSState: TTSState = {
  isSpeaking: false,
  isPaused: false,
  currentText: '',
  autoTTS: getAutoTTSEnabled(),
  personaId: getAIVoicePersonaId(),
  voiceURI: getSelectedVoiceURI(),
  rate: getAIVoiceRate(),
  pitch: getAIVoicePitch(),
  volume: getAIVoiceVolume(),
};

function emitTTSState(update?: Partial<TTSState>) {
  if (update) {
    currentTTSState = { ...currentTTSState, ...update };
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('tts-state-change', { detail: currentTTSState })
    );
  }
  stateListeners.forEach(listener => {
    try {
      listener(currentTTSState);
    } catch (e) {
      console.error('Error in TTS state listener:', e);
    }
  });
}

export function subscribeTTSState(listener: (state: TTSState) => void): () => void {
  stateListeners.add(listener);
  listener(currentTTSState);
  return () => {
    stateListeners.delete(listener);
  };
}

export function getTTSState(): TTSState {
  return { ...currentTTSState };
}

export function getAIVoicePersonaId(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PERSONA);
    if (saved && VOICE_PERSONAS.some(p => p.id === saved)) {
      return saved;
    }
  } catch (e) {
    console.warn('Failed to read voice persona from localStorage:', e);
  }
  return 'male-deep'; // Default male voice
}

export function saveAIVoicePersonaId(personaId: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_PERSONA, personaId);
    emitTTSState({ personaId });
  } catch (e) {
    console.error('Failed to save voice persona:', e);
  }
}

export function getSelectedVoiceURI(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_VOICE_URI);
  } catch (e) {
    return null;
  }
}

export function saveSelectedVoiceURI(uri: string | null): void {
  try {
    if (uri) {
      localStorage.setItem(STORAGE_KEY_VOICE_URI, uri);
    } else {
      localStorage.removeItem(STORAGE_KEY_VOICE_URI);
    }
    emitTTSState({ voiceURI: uri });
  } catch (e) {}
}

export function getAIVoiceRate(): number {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_RATE);
    if (saved) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed) && parsed >= 0.5 && parsed <= 3.0) {
        return parsed;
      }
    }
  } catch (e) {}
  return 1.0;
}

export function saveAIVoiceRate(rate: number): void {
  try {
    localStorage.setItem(STORAGE_KEY_RATE, rate.toString());
    emitTTSState({ rate });
  } catch (e) {}
}

export function getAIVoicePitch(): number {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PITCH);
    if (saved) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed) && parsed >= 0.5 && parsed <= 2.0) {
        return parsed;
      }
    }
  } catch (e) {}
  return 1.0;
}

export function saveAIVoicePitch(pitch: number): void {
  try {
    localStorage.setItem(STORAGE_KEY_PITCH, pitch.toString());
    emitTTSState({ pitch });
  } catch (e) {}
}

export function getAIVoiceVolume(): number {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_VOLUME);
    if (saved) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed) && parsed >= 0.0 && parsed <= 1.0) {
        return parsed;
      }
    }
  } catch (e) {}
  return 1.0;
}

export function saveAIVoiceVolume(volume: number): void {
  try {
    localStorage.setItem(STORAGE_KEY_VOLUME, volume.toString());
    emitTTSState({ volume });
  } catch (e) {}
}

export function getAutoTTSEnabled(): boolean {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_AUTO_TTS);
    return saved === 'true';
  } catch (e) {
    return false;
  }
}

export function saveAutoTTSEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY_AUTO_TTS, enabled ? 'true' : 'false');
    emitTTSState({ autoTTS: enabled });
  } catch (e) {}
}

export function cleanTextForSpeech(rawText: string): string {
  if (!rawText) return '';
  return rawText
    // Remove code blocks with friendly placeholder
    .replace(/```[\s\S]*?```/g, ' [Code Block omitted for audio] ')
    .replace(/`([^`]+)`/g, '$1')
    // Remove markdown links but keep text
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    // Remove numeric reference citations like [1], [2, 3]
    .replace(/\[\d+(?:,\s*\d+)*\]/g, '')
    // Remove table headers / markdown formatting artifacts
    .replace(/\|/g, ', ')
    .replace(/[*#_~>]/g, ' ')
    .replace(/^\s*[-+*]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/https?:\/\/[^\s]+/g, 'link')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getVoiceForPersona(
  availableVoices: SpeechSynthesisVoice[],
  personaId: string,
  explicitVoiceURI?: string | null
): { voice: SpeechSynthesisVoice | null; pitch: number } {
  if (availableVoices.length === 0) {
    const persona = VOICE_PERSONAS.find(p => p.id === personaId) || VOICE_PERSONAS[0];
    return { voice: null, pitch: persona.defaultPitch };
  }

  // If explicit voice URI provided and exists in availableVoices
  if (explicitVoiceURI) {
    const directVoice = availableVoices.find(v => v.voiceURI === explicitVoiceURI);
    if (directVoice) {
      return { voice: directVoice, pitch: 1.0 };
    }
  }

  const persona = VOICE_PERSONAS.find(p => p.id === personaId) || VOICE_PERSONAS[0];

  if (persona.id === 'system-default') {
    const defaultVoice = availableVoices.find(v => v.default) || availableVoices[0];
    return { voice: defaultVoice, pitch: 1.0 };
  }

  // Search through available voices for persona keywords
  let matchedVoice: SpeechSynthesisVoice | undefined;

  for (const keyword of persona.voiceKeywords) {
    matchedVoice = availableVoices.find(v => v.name.toLowerCase().includes(keyword));
    if (matchedVoice) break;
  }

  if (!matchedVoice && persona.gender === 'male') {
    // Fallback search for any English male voice
    matchedVoice = availableVoices.find(
      v => v.lang.startsWith('en') && /male|david|george|guy|daniel|rishi|james|mark|aaron/i.test(v.name)
    );
  } else if (!matchedVoice && persona.gender === 'female') {
    // Fallback search for female voice
    matchedVoice = availableVoices.find(
      v => v.lang.startsWith('en') && /female|samantha|victoria|zira|karen|fiona|catherine/i.test(v.name)
    );
  }

  // Final fallback to any English voice or first available voice
  if (!matchedVoice) {
    matchedVoice = availableVoices.find(v => v.lang.startsWith('en')) || availableVoices[0];
  }

  return {
    voice: matchedVoice || null,
    pitch: persona.defaultPitch,
  };
}

export interface SpeakOptions {
  personaId?: string;
  voiceURI?: string | null;
  rate?: number;
  pitch?: number;
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
  showToast?: boolean;
}

export function stopTTS(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  activeUtterance = null;
  emitTTSState({ isSpeaking: false, isPaused: false, currentText: '' });
}

export function pauseTTS(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    if (currentTTSState.isSpeaking && !currentTTSState.isPaused) {
      window.speechSynthesis.pause();
      emitTTSState({ isPaused: true });
    }
  }
}

export function resumeTTS(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    if (currentTTSState.isSpeaking && currentTTSState.isPaused) {
      window.speechSynthesis.resume();
      emitTTSState({ isPaused: false });
    }
  }
}

export function speakTextWithPersona(
  text: string,
  options?: SpeakOptions
): SpeechSynthesisUtterance | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (options?.showToast !== false) {
      toast.error('Text-to-speech is not supported in this browser.');
    }
    return null;
  }

  const personaId = options?.personaId || currentTTSState.personaId || getAIVoicePersonaId();
  const voiceURI = options?.voiceURI !== undefined ? options.voiceURI : currentTTSState.voiceURI || getSelectedVoiceURI();
  const rate = options?.rate !== undefined ? options.rate : currentTTSState.rate || getAIVoiceRate();
  const pitchOverride = options?.pitch !== undefined ? options.pitch : currentTTSState.pitch || getAIVoicePitch();
  const volume = options?.volume !== undefined ? options.volume : currentTTSState.volume || getAIVoiceVolume();

  const availableVoices = window.speechSynthesis.getVoices();
  const { voice, pitch: defaultPersonaPitch } = getVoiceForPersona(availableVoices, personaId, voiceURI);

  const cleanText = cleanTextForSpeech(text);
  if (!cleanText) return null;

  // Stop any active speech before starting new one
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(cleanText);
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  } else {
    utterance.lang = 'en-US';
  }

  // Pitch calculation: multiply base persona pitch with user pitch multiplier
  utterance.pitch = Math.max(0.5, Math.min(2.0, defaultPersonaPitch * pitchOverride));
  utterance.rate = Math.max(0.5, Math.min(3.0, rate));
  utterance.volume = Math.max(0.0, Math.min(1.0, volume));

  activeUtterance = utterance;

  utterance.onstart = () => {
    emitTTSState({ isSpeaking: true, isPaused: false, currentText: cleanText });
    if (options?.onStart) options.onStart();
  };

  utterance.onend = () => {
    activeUtterance = null;
    emitTTSState({ isSpeaking: false, isPaused: false, currentText: '' });
    if (options?.onEnd) options.onEnd();
  };

  utterance.onerror = (event) => {
    activeUtterance = null;
    emitTTSState({ isSpeaking: false, isPaused: false, currentText: '' });
    if (event.error !== 'interrupted' && event.error !== 'canceled') {
      console.error('Speech synthesis error:', event);
      if (options?.onError) options.onError(event);
    }
  };

  try {
    window.speechSynthesis.speak(utterance);
    return utterance;
  } catch (err) {
    console.error('Failed to trigger speech synthesis:', err);
    emitTTSState({ isSpeaking: false, isPaused: false });
    return null;
  }
}

export function previewVoicePersona(
  personaId: string,
  rate = 1.0,
  pitch = 1.0,
  volume = 1.0,
  voiceURI?: string | null
): void {
  const samplePersona = VOICE_PERSONAS.find(p => p.id === personaId);
  const name = samplePersona ? samplePersona.name.split(' (')[0] : 'AI';
  const samplePhrase = `Hello! I am ${name}. How can I assist you with your research today?`;
  
  speakTextWithPersona(samplePhrase, {
    personaId,
    voiceURI,
    rate,
    pitch,
    volume,
    showToast: false,
    onStart: () => toast.info(`Voice preview playing: ${name}`),
  });
}

