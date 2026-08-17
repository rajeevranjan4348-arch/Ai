import { useState, useEffect, useCallback, useRef } from 'react';
import {
  TTSState,
  getTTSState,
  subscribeTTSState,
  speakTextWithPersona,
  pauseTTS,
  resumeTTS,
  stopTTS,
  saveAIVoicePersonaId,
  saveSelectedVoiceURI,
  saveAIVoiceRate,
  saveAIVoicePitch,
  saveAIVoiceVolume,
  saveAutoTTSEnabled,
  previewVoicePersona,
  VOICE_PERSONAS,
  VoicePersona,
  SpeakOptions,
} from '@/lib/voiceService';
import { toast } from 'sonner';

export function useChatTTS() {
  const [ttsState, setLocalTTSState] = useState<TTSState>(getTTSState);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const lastSpokenTextRef = useRef<string>('');

  // Subscribe to TTS state changes
  useEffect(() => {
    return subscribeTTSState((newState) => {
      setLocalTTSState({ ...newState });
    });
  }, []);

  // Fetch and update browser SpeechSynthesis voices
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
      }
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const speak = useCallback((text: string, options?: SpeakOptions) => {
    if (!text || !text.trim()) {
      toast.info('No readable text to speak');
      return null;
    }
    lastSpokenTextRef.current = text;
    return speakTextWithPersona(text, options);
  }, []);

  const pause = useCallback(() => {
    pauseTTS();
  }, []);

  const resume = useCallback(() => {
    resumeTTS();
  }, []);

  const stop = useCallback(() => {
    stopTTS();
  }, []);

  const toggle = useCallback((fallbackText?: string) => {
    if (ttsState.isSpeaking && !ttsState.isPaused) {
      pauseTTS();
      toast.info('Audio playback paused');
      return;
    }

    if (ttsState.isSpeaking && ttsState.isPaused) {
      resumeTTS();
      toast.info('Audio playback resumed');
      return;
    }

    // If not currently speaking, speak provided fallbackText or lastSpokenText
    const targetText = fallbackText || lastSpokenTextRef.current;
    if (targetText && targetText.trim()) {
      speak(targetText, {
        onStart: () => toast.success('Reading AI response aloud'),
      });
    } else {
      toast.info('Select or generate an AI response to read aloud');
    }
  }, [ttsState.isSpeaking, ttsState.isPaused, speak]);

  const setPersona = useCallback((personaId: string) => {
    saveAIVoicePersonaId(personaId);
    saveSelectedVoiceURI(null); // Clear manual URI override when persona changes
    const persona = VOICE_PERSONAS.find(p => p.id === personaId);
    toast.success(`Voice set to: ${persona?.name.split(' (')[0] || personaId}`);
  }, []);

  const setVoiceURI = useCallback((uri: string | null) => {
    saveSelectedVoiceURI(uri);
    if (uri) {
      const voiceObj = availableVoices.find(v => v.voiceURI === uri);
      toast.success(`Selected voice: ${voiceObj?.name || 'Custom voice'}`);
    }
  }, [availableVoices]);

  const setRate = useCallback((rate: number) => {
    const clamped = Math.max(0.5, Math.min(3.0, Number(rate.toFixed(2))));
    saveAIVoiceRate(clamped);
  }, []);

  const setPitch = useCallback((pitch: number) => {
    const clamped = Math.max(0.5, Math.min(2.0, Number(pitch.toFixed(2))));
    saveAIVoicePitch(clamped);
  }, []);

  const setVolume = useCallback((volume: number) => {
    const clamped = Math.max(0.0, Math.min(1.0, Number(volume.toFixed(2))));
    saveAIVoiceVolume(clamped);
  }, []);

  const setAutoTTS = useCallback((enabled: boolean) => {
    saveAutoTTSEnabled(enabled);
    if (enabled) {
      toast.success('Auto-read AI responses enabled');
    } else {
      toast.info('Auto-read AI responses disabled');
    }
  }, []);

  const preview = useCallback((personaId?: string, rate?: number, pitch?: number, volume?: number, voiceURI?: string | null) => {
    const pId = personaId || ttsState.personaId;
    const r = rate !== undefined ? rate : ttsState.rate;
    const p = pitch !== undefined ? pitch : ttsState.pitch;
    const v = volume !== undefined ? volume : ttsState.volume;
    const vURI = voiceURI !== undefined ? voiceURI : ttsState.voiceURI;
    previewVoicePersona(pId, r, p, v, vURI);
  }, [ttsState]);

  return {
    isSpeaking: ttsState.isSpeaking,
    isPaused: ttsState.isPaused,
    currentText: ttsState.currentText,
    autoTTS: ttsState.autoTTS,
    personaId: ttsState.personaId,
    voiceURI: ttsState.voiceURI,
    rate: ttsState.rate,
    pitch: ttsState.pitch,
    volume: ttsState.volume,
    availableVoices,
    personas: VOICE_PERSONAS,
    speak,
    pause,
    resume,
    stop,
    toggle,
    setPersona,
    setVoiceURI,
    setRate,
    setPitch,
    setVolume,
    setAutoTTS,
    preview,
  };
}
