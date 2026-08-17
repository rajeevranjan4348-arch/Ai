import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PhoneOff, 
  Pause, 
  Play, 
  SlidersHorizontal, 
  Keyboard, 
  X, 
  Check, 
  MessageSquare, 
  Mic, 
  Volume2, 
  History, 
  Trash2, 
  Search, 
  Send, 
  Minimize2, 
  Maximize2, 
  Hand, 
  Sparkles,
  Radio,
  Square
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { FluidIridescentOrb } from '@/components/ui/FluidIridescentOrb';
import { getAIVoicePersonaId, getVoiceForPersona, VOICE_PERSONAS } from '@/lib/voiceService';
import { containsCallCommand, processAndExecuteCallCommand } from '@/lib/callRouter';
import { getCityAndWeatherContext } from '@/lib/weatherService';
import { 
  saveToVoiceHistory, 
  getVoiceHistory, 
  deleteVoiceHistoryItem, 
  clearVoiceHistory, 
  VoiceHistoryItem 
} from '@/lib/voiceHistory';

interface VoiceCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  aiName?: string;
  onSendMessage?: (message: string) => void;
}

// Web Speech Recognition types helper
const getSpeechRecognition = () => {
  if (typeof window === 'undefined') return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
};

// Text cleaning utility
function cleanText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export const VoiceCallModal: React.FC<VoiceCallModalProps> = ({
  isOpen,
  onClose,
  aiName = 'My AI',
  onSendMessage,
}) => {
  // Mode switch: 'voice' | 'text'
  const [activeTab, setActiveTab] = useState<'voice' | 'text'>('voice');
  
  // Voice engine state
  const [voiceModeActive, setVoiceModeActive] = useState<boolean>(false);
  const [callState, setCallState] = useState<'ready' | 'listening' | 'thinking' | 'speaking' | 'paused' | 'connecting'>('ready');
  const [statusLabel, setStatusLabel] = useState<string>('Ready');
  const [stateMessage, setStateMessage] = useState<string>('Tap Start to talk');
  
  // Transcripts
  const [finalTranscript, setFinalTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [aiSpeechText, setAiSpeechText] = useState<string>('');
  const [showVoiceTranscript, setShowVoiceTranscript] = useState<boolean>(false);

  // Chat message history (Text mode & Voice sync)
  const [conversation, setConversation] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('voice_mode_chat_messages');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Settings & Overlays
  const [showSettings, setShowSettings] = useState(false);
  const [showHistorySidebar, setShowHistorySidebar] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [orbStyle, setOrbStyle] = useState<'classic' | 'liquid'>('classic');
  const [textInput, setTextInput] = useState<string>('');
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');
  
  // Audio settings
  const [speechRate, setSpeechRate] = useState<string>('1.0x');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en-IN');
  const [wakeWordEnabled, setWakeWordEnabled] = useState<boolean>(true);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Voice History storage
  const [voiceHistory, setVoiceHistory] = useState<VoiceHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('voice_chat_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Engine Refs
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(false);
  const isSpeakingRef = useRef<boolean>(false);
  const isThinkingRef = useRef<boolean>(false);
  const voiceModeRef = useRef<boolean>(false);
  const finalTranscriptRef = useRef<string>('');
  const interimTranscriptRef = useRef<string>('');
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  const SILENCE_DELAY = 1200;
  const WAKE_WORD = 'hey ai';

  // Persist conversation
  useEffect(() => {
    try {
      localStorage.setItem('voice_mode_chat_messages', JSON.stringify(conversation));
    } catch (e) {}
  }, [conversation]);

  // Persist voice history
  useEffect(() => {
    try {
      localStorage.setItem('voice_chat_history', JSON.stringify(voiceHistory));
    } catch (e) {}
  }, [voiceHistory]);

  // Auto scroll chat in text mode
  useEffect(() => {
    if (activeTab === 'text' && chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [conversation, activeTab]);

  // Load available speech synthesis voices
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v && v.length > 0) {
        setAvailableVoices(v);
      }
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Sync Status and UI labels
  const updateUI = useCallback((mode: 'ready' | 'listening' | 'thinking' | 'speaking' | 'paused' | 'error', customMsg?: string) => {
    if (mode === 'listening') {
      setCallState('listening');
      setStatusLabel('Listening');
      setStateMessage(customMsg || "I'm listening…");
    } else if (mode === 'thinking') {
      setCallState('thinking');
      setStatusLabel('Thinking');
      setStateMessage(customMsg || 'Thinking…');
    } else if (mode === 'speaking') {
      setCallState('speaking');
      setStatusLabel('Speaking');
      setStateMessage(customMsg || 'AI is speaking…');
    } else if (mode === 'paused') {
      setCallState('paused');
      setStatusLabel('Paused');
      setStateMessage(customMsg || 'Call paused');
    } else if (mode === 'error') {
      setStatusLabel('Error');
      setStateMessage(customMsg || 'Speech recognition error');
    } else {
      setCallState('ready');
      setStatusLabel('Ready');
      setStateMessage(customMsg || 'Tap Start to talk');
    }
  }, []);

  // Stop Speech Recognition instance
  const stopRecognition = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    isListeningRef.current = false;
  }, []);

  // Start Speech Recognition
  const startRecognition = useCallback(() => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      updateUI('error', 'Speech recognition is not supported');
      return;
    }

    if (!voiceModeRef.current) return;
    if (isListeningRef.current || isSpeakingRef.current || isThinkingRef.current) return;
    if (typeof window !== 'undefined' && window.speechSynthesis?.speaking) return;

    try {
      stopRecognition();

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedLanguage;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        isListeningRef.current = true;
        isThinkingRef.current = false;
        updateUI('listening');
      };

      recognition.onresult = (event: any) => {
        if (!voiceModeRef.current || isSpeakingRef.current || isThinkingRef.current) return;

        let newFinal = '';
        let newInterim = '';

        // Read EVERY result index so phrases like "who is prime minister of India" are captured in full
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const text = result[0]?.transcript || '';
          if (result.isFinal) {
            newFinal += ' ' + text;
          } else {
            newInterim += ' ' + text;
          }
        }

        if (newFinal) {
          finalTranscriptRef.current = cleanText(finalTranscriptRef.current + ' ' + newFinal);
          setFinalTranscript(finalTranscriptRef.current);
        }

        const cleanedInterim = cleanText(newInterim);
        interimTranscriptRef.current = cleanedInterim;
        setInterimTranscript(cleanedInterim);

        const currentLiveTranscript = cleanText(finalTranscriptRef.current + ' ' + cleanedInterim);
        if (currentLiveTranscript) {
          setShowVoiceTranscript(true);
        }

        // Reset silence timer - AI will wait until user finishes speaking
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }
        silenceTimerRef.current = setTimeout(() => {
          processVoiceInput();
        }, SILENCE_DELAY);
      };

      recognition.onerror = (event: any) => {
        console.log('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          stopVoice();
          updateUI('error', 'Microphone permission denied');
          toast.error('Microphone permission denied');
          return;
        }

        // Ignore temporary browser silence/no-speech errors and restart if in voice mode
        if (voiceModeRef.current && !isSpeakingRef.current && !isThinkingRef.current) {
          setTimeout(() => {
            if (voiceModeRef.current && !isSpeakingRef.current && !isThinkingRef.current && !isListeningRef.current) {
              startRecognition();
            }
          }, 300);
        }
      };

      recognition.onend = () => {
        isListeningRef.current = false;
        // Automatically restart if voice mode is on and not speaking/thinking
        if (voiceModeRef.current && !isSpeakingRef.current && !isThinkingRef.current && isOpen) {
          setTimeout(() => {
            if (voiceModeRef.current && !isSpeakingRef.current && !isThinkingRef.current && !isListeningRef.current && isOpen) {
              startRecognition();
            }
          }, 150);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (error) {
      console.warn('Start recognition exception:', error);
      isListeningRef.current = false;
    }
  }, [selectedLanguage, updateUI, stopRecognition, isOpen]);

  // Voice AI Synthesis Response Output
  const speakVoiceReply = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        resolve();
        return;
      }

      // Stop previous utterance
      window.speechSynthesis.cancel();

      isSpeakingRef.current = true;
      updateUI('speaking');
      setAiSpeechText(text);
      setShowVoiceTranscript(true);

      const utterance = new SpeechSynthesisUtterance(text);
      const parsedRate = parseFloat(speechRate.replace('x', ''));
      utterance.rate = isNaN(parsedRate) ? 1.0 : parsedRate;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      utterance.lang = selectedLanguage;

      const voicesList = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
      const activePersonaId = getAIVoicePersonaId();
      const { voice, pitch } = getVoiceForPersona(voicesList, activePersonaId);

      if (voice) {
        utterance.voice = voice;
      } else {
        const preferredVoice = voicesList.find(v => v.lang.toLowerCase().includes('en-in')) ||
          voicesList.find(v => v.lang.toLowerCase().startsWith('en')) ||
          voicesList[0];
        if (preferredVoice) utterance.voice = preferredVoice;
      }
      utterance.pitch = pitch;

      currentUtteranceRef.current = utterance;

      utterance.onstart = () => {
        isSpeakingRef.current = true;
        updateUI('speaking');
      };

      const handleEnd = () => {
        isSpeakingRef.current = false;
        currentUtteranceRef.current = null;
        setAiSpeechText('');

        // ChatGPT STYLE: AI finishes speaking -> automatically listens again!
        if (voiceModeRef.current && isOpen) {
          updateUI('listening');
          startRecognition();
        } else {
          updateUI('ready');
        }
        resolve();
      };

      utterance.onend = handleEnd;
      utterance.onerror = (err) => {
        console.log('Speech synthesis error:', err);
        handleEnd();
      };

      window.speechSynthesis.speak(utterance);
    });
  }, [availableVoices, speechRate, selectedLanguage, updateUI, isOpen, startRecognition]);

  // Voice AI Query Request Dispatcher
  const askAIFromVoice = useCallback(async (text: string) => {
    isThinkingRef.current = true;
    updateUI('thinking');

    // Save user voice query to history
    const updatedHistory = saveToVoiceHistory(text);
    setVoiceHistory(updatedHistory);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    setConversation(prev => [...prev, userMsg]);

    // Background search sync
    if (onSendMessage) {
      try {
        onSendMessage(text);
      } catch (e) {}
    }

    try {
      // Check phone/call commands
      if (containsCallCommand(text)) {
        const callResult = await processAndExecuteCallCommand(text, { speakResponse: false });
        isThinkingRef.current = false;
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: callResult.spokenMessage,
          timestamp: Date.now(),
        };
        setConversation(prev => [...prev, aiMsg]);
        await speakVoiceReply(callResult.spokenMessage);
        return;
      }

      // Fetch live context & weather
      const weatherContext = await getCityAndWeatherContext(text);

      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: text }],
          systemInstruction: `You are My AI, a friendly voice assistant. Provide a concise, clear spoken reply in 1-2 natural sentences suitable for voice conversation.\n\n${weatherContext}`,
        }),
      });

      let reply = '';
      if (response.ok) {
        const data = await response.json();
        reply = data?.text?.trim() || `I received "${text}". How can I help you next?`;
      } else {
        reply = `I processed "${text}". How can I assist you further?`;
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: Date.now(),
      };
      setConversation(prev => [...prev, aiMsg]);

      isThinkingRef.current = false;
      await speakVoiceReply(reply);
    } catch (error) {
      console.error('Voice AI request error:', error);
      isThinkingRef.current = false;
      const fallback = `I got "${text}". I'm ready for your next question.`;
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: fallback,
        timestamp: Date.now(),
      };
      setConversation(prev => [...prev, aiMsg]);
      await speakVoiceReply(fallback);
    }
  }, [onSendMessage, speakVoiceReply, updateUI]);

  // Process Voice Input when Silence Threshold reached
  const processVoiceInput = useCallback(async () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    let text = finalTranscriptRef.current.trim();
    if (!text) {
      text = interimTranscriptRef.current.trim();
    }

    if (!text) return;

    // Wake word filter
    if (wakeWordEnabled) {
      const wakeRegex = new RegExp(WAKE_WORD, 'ig');
      text = text.replace(wakeRegex, '').trim();
    }

    if (!text) return;

    // Clear buffer before sending to AI
    finalTranscriptRef.current = '';
    interimTranscriptRef.current = '';
    setFinalTranscript('');
    setInterimTranscript('');
    setShowVoiceTranscript(false);

    // Stop microphone recognition while AI thinks
    stopRecognition();

    await askAIFromVoice(text);
  }, [askAIFromVoice, stopRecognition, wakeWordEnabled]);

  // Start Voice Mode
  const startVoice = useCallback(async () => {
    if (voiceModeRef.current && isListeningRef.current) return;

    voiceModeRef.current = true;
    setVoiceModeActive(true);
    finalTranscriptRef.current = '';
    interimTranscriptRef.current = '';
    setFinalTranscript('');
    setInterimTranscript('');
    setShowVoiceTranscript(false);

    // Request microphone permission
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch (error) {
      console.error('Microphone permission error:', error);
      voiceModeRef.current = false;
      setVoiceModeActive(false);
      updateUI('error', 'Allow microphone permission');
      toast.error('Please allow microphone access to talk');
      return;
    }

    startRecognition();
  }, [startRecognition, updateUI]);

  // Stop Voice Mode
  const stopVoice = useCallback(() => {
    voiceModeRef.current = false;
    setVoiceModeActive(false);
    isListeningRef.current = false;
    isSpeakingRef.current = false;
    isThinkingRef.current = false;

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    // Stop TTS
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    // Stop recognition
    stopRecognition();

    finalTranscriptRef.current = '';
    interimTranscriptRef.current = '';
    setFinalTranscript('');
    setInterimTranscript('');
    setAiSpeechText('');
    setShowVoiceTranscript(false);

    updateUI('ready');
  }, [stopRecognition, updateUI]);

  // Interrupt AI Speech
  const handleInterrupt = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    isSpeakingRef.current = false;
    isThinkingRef.current = false;
    currentUtteranceRef.current = null;
    setAiSpeechText('');

    finalTranscriptRef.current = '';
    interimTranscriptRef.current = '';
    setFinalTranscript('');
    setInterimTranscript('');
    setShowVoiceTranscript(false);

    toast.info('Interrupted AI');

    // Resume microphone immediately
    if (voiceModeRef.current) {
      updateUI('listening');
      startRecognition();
    }
  }, [startRecognition, updateUI]);

  // Spacebar = Interrupt AI
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === 'Space' &&
        (isSpeakingRef.current || (typeof window !== 'undefined' && window.speechSynthesis?.speaking)) &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        handleInterrupt();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleInterrupt]);

  // Auto-start on modal open
  useEffect(() => {
    if (!isOpen) {
      stopVoice();
      setIsMinimized(false);
      return;
    }

    // Initial gentle greeting and launch
    updateUI('ready', 'Starting voice session…');
    const timer = setTimeout(() => {
      if (isOpen) {
        startVoice();
      }
    }, 600);

    return () => {
      clearTimeout(timer);
      stopVoice();
    };
  }, [isOpen, startVoice, stopVoice, updateUI]);

  // Send Text Mode message
  const handleSendText = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = textInput.trim();
    if (!text) return;

    setTextInput('');
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    setConversation(prev => [...prev, userMsg]);

    if (onSendMessage) {
      try {
        onSendMessage(text);
      } catch (e) {}
    }

    updateUI('thinking', 'AI is replying…');

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: text }],
          systemInstruction: `You are My AI, a modern AI assistant.
Your responses must be clear, concise, professional, friendly, and visually structured.
Use relevant emojis naturally (💡, ✅, ❌, ⚠️, 🔥, 🚀, 📌, 💻, 🔧, 🧠, 📚, 🔍, 🎯, ⚡) where they improve readability.
Format using Markdown with headings, bold, bullet points, and code blocks.
For coding: 💻 **Solution** → 🔧 **How it works** → 🚀 **Result**.
For errors: ❌ **Problem** → 🔍 **Cause** → ✅ **Fix**.
For education: 📚 **Concept** → 🧠 **Easy Explanation** → 🎯 **Final Answer**.
Match the user's language (English, Hindi, Hinglish).`,
        }),
      });

      let reply = '';
      if (response.ok) {
        const data = await response.json();
        reply = data?.text?.trim() || `Got "${text}". How can I help further?`;
      } else {
        reply = `Got "${text}". What would you like to explore next?`;
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: Date.now(),
      };
      setConversation(prev => [...prev, aiMsg]);
      updateUI('ready');
    } catch (err) {
      const fallback = `I received your message: "${text}".`;
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: fallback,
        timestamp: Date.now(),
      };
      setConversation(prev => [...prev, aiMsg]);
      updateUI('ready');
    }
  };

  const handleClose = () => {
    stopVoice();
    setIsMinimized(false);
    onClose();
  };

  if (!isOpen) return null;

  const combinedVoiceTranscript = cleanText(`${finalTranscript} ${interimTranscript}`);

  return (
    <>
      {/* Minimized Dock Bar */}
      {isMinimized && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3.5 bg-[#121216]/95 border border-white/20 shadow-2xl backdrop-blur-2xl px-4 py-2.5 rounded-2xl text-white max-w-lg w-[92%]"
        >
          <div className="relative shrink-0 flex items-center justify-center">
            <div className={cn(
              "w-8 h-8 rounded-full border border-white/30",
              callState === 'speaking' && "animate-pulse bg-white/20",
              callState === 'listening' && "ring-2 ring-white/50 bg-white/10"
            )} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white truncate">{aiName}</span>
              <span className="text-[10px] bg-white/10 text-white px-2 py-0.2 rounded-full font-semibold border border-white/20">
                {statusLabel}
              </span>
            </div>
            <p className="text-xs text-white/70 truncate font-normal mt-0.5">{stateMessage}</p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {callState === 'speaking' && (
              <button
                onClick={handleInterrupt}
                className="p-2 rounded-xl bg-[#202020] hover:bg-[#303030] text-white transition-colors cursor-pointer text-xs"
                title="Interrupt AI"
              >
                <Hand size={14} />
              </button>
            )}
            <button
              onClick={() => setIsMinimized(false)}
              className="p-2 rounded-xl bg-white text-black hover:bg-neutral-200 transition-colors cursor-pointer"
              title="Maximize Voice View"
            >
              <Maximize2 size={14} />
            </button>
            <button
              onClick={handleClose}
              className="p-2 rounded-xl bg-[#321919] hover:bg-[#452020] text-[#ff8d8d] transition-colors cursor-pointer"
              title="Close Voice Mode"
            >
              <PhoneOff size={14} />
            </button>
          </div>
        </motion.div>
      )}

      {/* Main Voice & Chat Modal View */}
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="fixed inset-0 z-50 flex flex-col justify-between bg-[#050505] text-white font-sans select-none overflow-hidden"
          >
            {/* 1. HEADER (Exact Specification) */}
            <header className="h-16 px-5 flex items-center justify-between border-b border-[#202020] shrink-0 z-20">
              <div className="flex items-center gap-3">
                <span className="text-[19px] font-bold tracking-tight text-white">{aiName}</span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/10 text-white/80 border border-white/10">
                  Voice Mode
                </span>
              </div>

              {/* Center Status indicator */}
              <div className="flex items-center gap-2">
                <span className={cn(
                  "w-2 h-2 rounded-full",
                  callState === 'listening' ? "bg-white animate-ping" :
                  callState === 'thinking' ? "bg-amber-400 animate-spin" :
                  callState === 'speaking' ? "bg-emerald-400 animate-pulse" :
                  "bg-neutral-500"
                )} />
                <span id="status" className="text-xs font-medium text-[#888]">
                  {statusLabel}
                </span>
              </div>

              {/* Right Header Actions */}
              <div className="flex items-center gap-2">
                {/* Voice / Text Mode Tab Switcher */}
                <div className="flex items-center bg-[#151515] p-1 rounded-xl border border-[#242424]">
                  <button
                    onClick={() => setActiveTab('voice')}
                    className={cn(
                      "px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer",
                      activeTab === 'voice' ? "bg-white text-black font-semibold" : "text-[#888] hover:text-white"
                    )}
                  >
                    Voice
                  </button>
                  <button
                    onClick={() => setActiveTab('text')}
                    className={cn(
                      "px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer",
                      activeTab === 'text' ? "bg-white text-black font-semibold" : "text-[#888] hover:text-white"
                    )}
                  >
                    Text
                  </button>
                </div>

                {/* History Drawer Toggle */}
                <button
                  onClick={() => setShowHistorySidebar(!showHistorySidebar)}
                  className="w-9 h-9 rounded-xl bg-[#151515] hover:bg-[#202020] border border-[#242424] text-[#888] hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                  title="Voice History"
                >
                  <History size={16} />
                </button>

                {/* Settings Toggle */}
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="w-9 h-9 rounded-xl bg-[#151515] hover:bg-[#202020] border border-[#242424] text-[#888] hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                  title="Settings"
                >
                  <SlidersHorizontal size={16} />
                </button>

                {/* Minimize */}
                <button
                  onClick={() => setIsMinimized(true)}
                  className="w-9 h-9 rounded-xl bg-[#151515] hover:bg-[#202020] border border-[#242424] text-[#888] hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                  title="Minimize"
                >
                  <Minimize2 size={16} />
                </button>

                {/* Close Button */}
                <button
                  onClick={handleClose}
                  className="w-9 h-9 rounded-xl bg-[#251010] hover:bg-[#381515] border border-[#401818] text-[#ff8d8d] flex items-center justify-center cursor-pointer transition-colors"
                  title="Close"
                >
                  <X size={17} />
                </button>
              </div>
            </header>

            {/* 2. MAIN BODY: VOICE MODE OR TEXT CHAT */}
            {activeTab === 'voice' ? (
              <main className="relative flex-1 flex flex-col items-center justify-center p-6 w-full max-w-3xl mx-auto my-auto">
                {/* FLOATING VOICE TRANSCRIPT PANEL (Separate from normal chat) */}
                <div
                  id="voiceTranscript"
                  className={cn(
                    "mb-8 max-w-[600px] w-[90%] text-center text-[#aaa] text-[15px] leading-relaxed transition-all duration-300 min-h-[50px] flex items-center justify-center",
                    (showVoiceTranscript || combinedVoiceTranscript || aiSpeechText) ? "opacity-100 transform translate-y-0" : "opacity-0 transform translate-y-2 pointer-events-none"
                  )}
                >
                  <p className="bg-[#121212]/90 border border-[#242424] px-5 py-3 rounded-2xl backdrop-blur-md shadow-xl text-neutral-200">
                    {callState === 'speaking' && aiSpeechText
                      ? aiSpeechText
                      : combinedVoiceTranscript
                      ? `"${combinedVoiceTranscript}"`
                      : stateMessage}
                  </p>
                </div>

                {/* AI ORB AREA */}
                <section className="voice-area flex flex-col items-center justify-center gap-5 my-4">
                  {orbStyle === 'classic' ? (
                    /* Monochromatic 3D AI Orb with Exact Radial Gradient & CSS Keyframes */
                    <div
                      id="orb"
                      className={cn(
                        "ai-orb-core cursor-pointer active:scale-95",
                        callState === 'listening' && "listening",
                        callState === 'thinking' && "thinking",
                        callState === 'speaking' && "speaking"
                      )}
                      onClick={() => {
                        if (callState === 'speaking') handleInterrupt();
                        else if (!voiceModeActive) startVoice();
                        else handleInterrupt();
                      }}
                      title={callState === 'speaking' ? "Tap to Interrupt" : "Tap to Speak"}
                    />
                  ) : (
                    /* Alternate Fluid Iridescent Orb */
                    <FluidIridescentOrb
                      size={200}
                      isSpeaking={callState === 'speaking'}
                      isListening={callState === 'listening'}
                      isPaused={callState === 'paused'}
                      volumeLevel={callState === 'speaking' ? 0.75 : callState === 'listening' ? 0.45 : 0.1}
                    />
                  )}

                  {/* State Description */}
                  <div id="state" className="text-[#888] text-[13px] font-medium tracking-wide">
                    {stateMessage}
                  </div>

                  {/* VOICE CONTROLS (Exact Button Specs) */}
                  <div className="controls flex items-center gap-2.5 mt-2">
                    <button
                      id="startBtn"
                      onClick={startVoice}
                      disabled={voiceModeActive && isListeningRef.current}
                      className={cn(
                        "primary font-semibold transition-transform active:scale-95 cursor-pointer",
                        "bg-[#fff] text-[#000] px-5 py-2.5 rounded-full hover:bg-neutral-200 text-sm disabled:opacity-50"
                      )}
                    >
                      🎙 Start
                    </button>

                    <button
                      id="interruptBtn"
                      onClick={handleInterrupt}
                      className="bg-[#202020] hover:bg-[#303030] text-[#fff] px-4 py-2.5 rounded-full text-sm font-medium transition-colors cursor-pointer active:scale-95"
                    >
                      ✋ Interrupt
                    </button>

                    <button
                      id="stopBtn"
                      onClick={stopVoice}
                      className="danger bg-[#321919] hover:bg-[#452020] text-[#ff8d8d] px-4 py-2.5 rounded-full text-sm font-medium transition-colors cursor-pointer active:scale-95"
                    >
                      ■ Stop
                    </button>
                  </div>
                </section>
              </main>
            ) : (
              /* TEXT CHAT MODE VIEW */
              <div className="flex-1 flex flex-col h-full overflow-hidden max-w-3xl w-full mx-auto p-4">
                {/* Scrollable Chat Area */}
                <main ref={chatScrollRef} id="chat" className="chat flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                  {conversation.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-[#666] text-sm gap-2">
                      <MessageSquare size={32} className="opacity-40" />
                      <p>No messages yet. Send a message below or switch to Voice Mode.</p>
                    </div>
                  ) : (
                    conversation.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "message max-w-[82%] px-4 py-3 rounded-[18px] text-[15px] leading-relaxed",
                          msg.role === 'user'
                            ? "user-message self-end bg-[#252525] text-white"
                            : "ai-message self-start bg-[#111] border border-[#242424] text-neutral-200"
                        )}
                      >
                        {msg.content}
                      </div>
                    ))
                  )}
                </main>

                {/* Text Input Area */}
                <section className="text-area block p-3 pt-2 shrink-0 border-t border-[#202020]">
                  <form onSubmit={handleSendText} className="flex flex-col gap-2">
                    <textarea
                      id="textInput"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendText();
                        }
                      }}
                      className="text-input w-full min-h-[50px] max-h-36 resize-none rounded-[22px] bg-[#181818] text-white px-4 py-3 text-[15px] outline-none border border-[#242424] focus:border-neutral-500"
                      placeholder="Message AI..."
                    />
                    <div className="text-row flex justify-end gap-2">
                      <button
                        type="submit"
                        id="sendTextBtn"
                        disabled={!textInput.trim()}
                        className="primary bg-[#fff] text-[#000] font-semibold px-5 py-2 rounded-full text-sm hover:bg-neutral-200 transition-colors disabled:opacity-40 cursor-pointer"
                      >
                        Send
                      </button>
                    </div>
                  </form>
                </section>
              </div>
            )}

            {/* 3. SETTINGS DRAWER OVERLAY */}
            <AnimatePresence>
              {showSettings && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowSettings(false)}
                    className="fixed inset-0 bg-black/60 z-30 backdrop-blur-xs"
                  />
                  <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                    className="fixed top-0 right-0 bottom-0 z-40 w-80 bg-[#121217] border-l border-[#242424] p-5 flex flex-col justify-between shadow-2xl text-left"
                  >
                    <div className="space-y-5 overflow-y-auto">
                      <div className="flex items-center justify-between pb-3 border-b border-[#242424]">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <SlidersHorizontal size={16} /> Voice Settings
                        </h3>
                        <button
                          onClick={() => setShowSettings(false)}
                          className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/5 cursor-pointer"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      {/* Orb Design Switcher */}
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-neutral-300">Orb Appearance</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setOrbStyle('classic')}
                            className={cn(
                              "px-3 py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer",
                              orbStyle === 'classic'
                                ? "bg-white/15 border-white text-white font-semibold"
                                : "bg-[#181818] border-[#282828] text-neutral-400 hover:text-white"
                            )}
                          >
                            Classic 3D Orb
                          </button>
                          <button
                            onClick={() => setOrbStyle('liquid')}
                            className={cn(
                              "px-3 py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer",
                              orbStyle === 'liquid'
                                ? "bg-white/15 border-white text-white font-semibold"
                                : "bg-[#181818] border-[#282828] text-neutral-400 hover:text-white"
                            )}
                          >
                            Liquid Iridescent
                          </button>
                        </div>
                      </div>

                      {/* Speech Rate */}
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-neutral-300">Speech Rate</label>
                        <div className="grid grid-cols-4 gap-1.5">
                          {['0.8x', '1.0x', '1.2x', '1.5x'].map((rate) => (
                            <button
                              key={rate}
                              onClick={() => setSpeechRate(rate)}
                              className={cn(
                                "py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                                speechRate === rate
                                  ? "bg-white text-black font-semibold"
                                  : "bg-[#181818] text-neutral-400 hover:text-white border border-[#242424]"
                              )}
                            >
                              {rate}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Language Selection */}
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-neutral-300">Recognition Language</label>
                        <select
                          value={selectedLanguage}
                          onChange={(e) => setSelectedLanguage(e.target.value)}
                          className="w-full bg-[#181818] border border-[#282828] rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
                        >
                          <option value="en-IN">English (India - en-IN)</option>
                          <option value="en-US">English (US - en-US)</option>
                          <option value="en-GB">English (UK - en-GB)</option>
                          <option value="hi-IN">Hindi (India - hi-IN)</option>
                        </select>
                      </div>

                      {/* Wake Word */}
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#181818] border border-[#242424]">
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-white">Wake Word Filter</span>
                          <span className="text-[10px] text-neutral-400">Ignore "Hey AI" preface</span>
                        </div>
                        <button
                          onClick={() => setWakeWordEnabled(!wakeWordEnabled)}
                          className={cn(
                            "w-10 h-6 rounded-full transition-colors relative p-1 cursor-pointer",
                            wakeWordEnabled ? "bg-white" : "bg-neutral-700"
                          )}
                        >
                          <div className={cn(
                            "w-4 h-4 rounded-full transition-transform",
                            wakeWordEnabled ? "translate-x-4 bg-black" : "translate-x-0 bg-white"
                          )} />
                        </button>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#242424]">
                      <button
                        onClick={() => setShowSettings(false)}
                        className="w-full py-2 bg-white text-black font-semibold rounded-xl text-xs hover:bg-neutral-200 transition-colors cursor-pointer"
                      >
                        Done
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* 4. VOICE HISTORY DRAWER */}
            <AnimatePresence>
              {showHistorySidebar && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowHistorySidebar(false)}
                    className="fixed inset-0 bg-black/60 z-30 backdrop-blur-xs"
                  />
                  <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                    className="fixed top-0 left-0 bottom-0 z-40 w-80 sm:w-96 bg-[#121217] border-r border-[#242424] p-5 flex flex-col justify-between shadow-2xl text-left"
                  >
                    <div className="flex flex-col h-full">
                      <div className="flex items-center justify-between pb-3 border-b border-[#242424]">
                        <div className="flex items-center gap-2">
                          <History size={16} className="text-white" />
                          <h3 className="text-sm font-bold text-white">Voice History</h3>
                        </div>
                        <div className="flex items-center gap-1">
                          {voiceHistory.length > 0 && (
                            <button
                              onClick={() => {
                                clearVoiceHistory();
                                setVoiceHistory([]);
                                toast.success('Voice history cleared');
                              }}
                              className="p-1.5 text-neutral-400 hover:text-red-400 rounded-lg hover:bg-white/5 cursor-pointer"
                              title="Clear History"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                          <button
                            onClick={() => setShowHistorySidebar(false)}
                            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/5 cursor-pointer"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto py-3 space-y-2">
                        {voiceHistory.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-center text-neutral-500 text-xs py-10">
                            <Mic size={24} className="opacity-30 mb-2" />
                            <p>No voice history recorded yet.</p>
                          </div>
                        ) : (
                          voiceHistory.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => {
                                askAIFromVoice(item.text);
                                setShowHistorySidebar(false);
                              }}
                              className="p-3 bg-[#181818] hover:bg-[#222222] border border-[#282828] rounded-xl text-xs text-neutral-200 transition-colors cursor-pointer flex items-center justify-between group"
                            >
                              <span className="truncate pr-2">{item.text}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const updated = deleteVoiceHistoryItem(item.id);
                                  setVoiceHistory(updated);
                                }}
                                className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-400 p-1 rounded transition-opacity"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
