import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Send, Radio, X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

export interface VoiceInputProps {
  onTranscriptChange: (text: string) => void;
  onSearchSubmit?: (query: string) => void;
  value?: string;
  autoSubmit?: boolean;
  className?: string;
  buttonSize?: 'sm' | 'md' | 'lg';
  showVisualizerBanner?: boolean;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({
  onTranscriptChange,
  onSearchSubmit,
  value = '',
  autoSubmit = true,
  className,
  buttonSize = 'md',
  showVisualizerBanner = false,
}) => {
  const {
    isListening,
    interimTranscript,
    autoSubmitOnSilence,
    setAutoSubmitOnSilence,
    error,
    clearError,
    retryListening,
    toggleListening,
    stopListening,
  } = useSpeechRecognition({
    autoSubmitOnSilence: autoSubmit,
    silenceDuration: 2000,
    onTranscriptChange: (text) => {
      onTranscriptChange(text);
    },
    onAutoSubmit: (text) => {
      if (onSearchSubmit) {
        onSearchSubmit(text);
      }
    },
  });

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (error) {
      clearError();
      retryListening();
    } else {
      toggleListening(value);
    }
  };

  const handleManualSubmit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const textToSubmit = value.trim();
    if (textToSubmit && onSearchSubmit) {
      stopListening();
      onSearchSubmit(textToSubmit);
    }
  };

  const buttonSizeClasses = {
    sm: 'p-1.5 min-w-[32px] h-[32px]',
    md: 'p-2 min-w-[38px] h-[38px]',
    lg: 'p-2.5 min-w-[44px] h-[44px]',
  }[buttonSize];

  const iconSizes = {
    sm: 15,
    md: 18,
    lg: 20,
  }[buttonSize];

  return (
    <div className={cn("inline-flex items-center gap-2 relative", className)}>
      {/* Microphone Toggle Button */}
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          "relative rounded-xl flex items-center justify-center transition-all cursor-pointer select-none",
          buttonSizeClasses,
          isListening
            ? "bg-red-500/20 text-red-400 border border-red-500/50 shadow-lg shadow-red-500/30 scale-105"
            : error
            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30"
            : "text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20"
        )}
        title={
          isListening
            ? "Dictation active: Click to stop microphone"
            : error
            ? `${error.title}: ${error.message} (Click to retry)`
            : "Click to dictate query using browser SpeechRecognition (or press Alt+V)"
        }
        aria-label="Voice Dictation Speech Recognition"
      >
        {isListening ? (
          <>
            <span className="absolute inset-0 rounded-xl bg-red-500/20 animate-ping" />
            <Mic size={iconSizes} className="text-red-400 animate-pulse relative z-10" />
          </>
        ) : error ? (
          <>
            <MicOff size={iconSizes} className="text-amber-400" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-400 rounded-full" />
          </>
        ) : (
          <Mic size={iconSizes} />
        )}
      </button>

      {/* Mini Error Toast if error exists and not in banner mode */}
      <AnimatePresence>
        {error && !isListening && (
          <motion.div
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -5 }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/80 border border-amber-500/40 text-[10px] text-amber-200"
          >
            <AlertTriangle size={11} className="text-amber-400 shrink-0" />
            <span className="truncate max-w-[120px]">{error.title}</span>
            <button
              type="button"
              onClick={() => clearError()}
              className="p-0.5 hover:text-white cursor-pointer ml-1"
            >
              <X size={10} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Visualizer Banner if enabled */}
      <AnimatePresence>
        {isListening && showVisualizerBanner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-950/40 border border-red-500/40 text-xs text-red-200 backdrop-blur-md"
          >
            <div className="flex items-center gap-0.5 h-3">
              {[1, 2, 3].map((i) => (
                <motion.span
                  key={i}
                  animate={{ height: [3, 12, 4, 14, 3] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                  className="w-1 bg-red-400 rounded-full"
                />
              ))}
            </div>
            <span className="truncate max-w-[150px] font-medium text-[11px]">
              {interimTranscript || 'Listening...'}
            </span>
            <button
              type="button"
              onClick={() => setAutoSubmitOnSilence(!autoSubmitOnSilence)}
              className={cn(
                "px-1.5 py-0.5 rounded text-[10px] uppercase font-bold border transition-colors cursor-pointer",
                autoSubmitOnSilence ? "bg-cyan-500/30 border-cyan-500/50 text-cyan-200" : "bg-white/10 border-white/20 text-white/50"
              )}
              title="Toggle auto submit on speech pause"
            >
              <Radio size={10} className="inline mr-1" />
              Auto
            </button>
            {value.trim() && (
              <button
                type="button"
                onClick={handleManualSubmit}
                className="p-1 rounded bg-red-500 text-white hover:bg-red-600 transition-colors cursor-pointer"
                title="Submit Voice Query Now"
              >
                <Send size={11} />
              </button>
            )}
            <button
              type="button"
              onClick={() => stopListening()}
              className="p-1 text-white/60 hover:text-white transition-colors cursor-pointer"
              title="Cancel"
            >
              <X size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

