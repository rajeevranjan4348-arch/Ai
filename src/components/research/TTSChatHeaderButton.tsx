import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Volume2, 
  VolumeX, 
  Volume1,
  Play, 
  Pause, 
  Square, 
  Sliders, 
  Check, 
  Sparkles, 
  RotateCcw, 
  Radio, 
  User, 
  ChevronDown, 
  Settings2,
  Headphones,
  Gauge
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChatTTS } from '@/hooks/useChatTTS';
import { AnimatedVoiceOrb } from '@/components/ui/AnimatedVoiceOrb';
import { toast } from 'sonner';

interface TTSChatHeaderButtonProps {
  latestResponseText?: string;
  className?: string;
}

export const TTSChatHeaderButton: React.FC<TTSChatHeaderButtonProps> = ({
  latestResponseText,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAdvancedVoices, setShowAdvancedVoices] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    isSpeaking,
    isPaused,
    autoTTS,
    personaId,
    voiceURI,
    rate,
    pitch,
    volume,
    availableVoices,
    personas,
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
  } = useChatTTS();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const speedPresets = [0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

  const handleMainAction = () => {
    if (isSpeaking && !isPaused) {
      pause();
    } else if (isSpeaking && isPaused) {
      resume();
    } else if (latestResponseText) {
      speak(latestResponseText, {
        onStart: () => toast.success('Reading AI answer aloud'),
      });
    } else {
      setIsOpen(true);
    }
  };

  const currentPersona = personas.find(p => p.id === personaId) || personas[0];

  return (
    <div className={cn("relative inline-block text-left", className)} ref={dropdownRef}>
      {/* Header Button */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={handleMainAction}
          title={
            isSpeaking 
              ? (isPaused ? 'Audio Paused (Click to Resume)' : 'Speaking AI Response (Click to Pause)')
              : (autoTTS ? 'Auto-TTS Active (Click to Speak / Configure)' : 'Text-to-Speech (TTS)')
          }
          className={cn(
            "relative h-8 px-2.5 rounded-l-full sm:rounded-full flex items-center gap-1.5 transition-all text-xs font-medium cursor-pointer border shadow-sm select-none",
            isSpeaking && !isPaused
              ? "bg-cyan-500/20 text-cyan-300 border-cyan-400/40 shadow-cyan-500/10 shadow-md"
              : isPaused
              ? "bg-amber-500/20 text-amber-300 border-amber-400/40"
              : autoTTS
              ? "bg-white/10 text-white hover:bg-white/20 border-white/20"
              : "bg-white/5 hover:bg-white/15 text-white/70 hover:text-white border-white/10"
          )}
        >
          {/* Animated Voice Orb Icon when Speaking */}
          {isSpeaking && !isPaused ? (
            <div className="-my-1">
              <AnimatedVoiceOrb
                size="compact"
                isSpeaking={true}
                showWaves={false}
                showParticles={false}
              />
            </div>
          ) : isPaused ? (
            <Pause size={14} className="text-amber-400 shrink-0" />
          ) : volume === 0 ? (
            <VolumeX size={14} className="text-white/40 shrink-0" />
          ) : (
            <Volume2 size={14} className={cn("shrink-0", autoTTS ? "text-cyan-400" : "text-white/70")} />
          )}

          <span className="hidden sm:inline font-semibold">
            {isSpeaking 
              ? (isPaused ? 'Paused' : 'Playing') 
              : 'TTS'}
          </span>

          {/* Rate indicator pill if not 1.0x */}
          {rate !== 1.0 && (
            <span className="text-[10px] bg-white/10 px-1 py-0.2 rounded font-mono text-white/80 hidden md:inline">
              {rate}x
            </span>
          )}

          {/* Green active dot for AutoTTS */}
          {autoTTS && !isSpeaking && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </button>

        {/* Quick Settings Dropdown Toggle Button */}
        <button
          onClick={() => setIsOpen(prev => !prev)}
          title="TTS Voice & Speed Settings"
          className={cn(
            "h-8 w-6 rounded-r-full sm:rounded-full flex items-center justify-center transition-all cursor-pointer border -ml-1 sm:ml-0.5",
            isOpen
              ? "bg-white/20 text-white border-white/30"
              : "bg-white/5 hover:bg-white/15 text-white/60 hover:text-white border-white/10"
          )}
        >
          <ChevronDown size={12} className={cn("transition-transform duration-200", isOpen && "rotate-180")} />
        </button>
      </div>

      {/* Popover Settings Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 6 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-[#141417]/95 border border-white/15 rounded-2xl p-4 shadow-2xl z-50 backdrop-blur-2xl text-left divide-y divide-white/10 max-h-[85vh] overflow-y-auto"
            style={{
              boxShadow: '0 20px 40px -15px rgba(0,0,0,0.8), 0 0 20px 0 rgba(6, 182, 212, 0.1)'
            }}
          >
            {/* Header / Playback Banner */}
            <div className="pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border",
                  isSpeaking 
                    ? "bg-cyan-500/20 border-cyan-400/40 text-cyan-400" 
                    : "bg-white/10 border-white/10 text-white/80"
                )}>
                  <Headphones size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white tracking-wide">Text-to-Speech (TTS)</h4>
                  <p className="text-[11px] text-white/50">
                    {isSpeaking 
                      ? (isPaused ? 'Playback paused' : 'Reading response aloud...') 
                      : (autoTTS ? 'Auto-TTS enabled' : 'Ready to read')}
                  </p>
                </div>
              </div>

              {/* Direct Play / Pause / Stop Controls */}
              <div className="flex items-center gap-1">
                {isSpeaking ? (
                  <>
                    <button
                      onClick={() => isPaused ? resume() : pause()}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                      title={isPaused ? "Resume" : "Pause"}
                    >
                      {isPaused ? <Play size={14} /> : <Pause size={14} />}
                    </button>
                    <button
                      onClick={() => stop()}
                      className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-colors cursor-pointer"
                      title="Stop Audio"
                    >
                      <Square size={13} />
                    </button>
                  </>
                ) : (
                  latestResponseText && (
                    <button
                      onClick={() => speak(latestResponseText, { onStart: () => toast.success('Reading response aloud') })}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs transition-colors cursor-pointer shadow-sm"
                      title="Read Latest Answer"
                    >
                      <Play size={12} fill="currentColor" />
                      <span>Play</span>
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Auto-TTS Toggle Switch */}
            <div className="py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Sparkles size={13} className="text-cyan-400" />
                    Auto-Read AI Responses
                  </span>
                  <p className="text-[11px] text-white/50 mt-0.5 leading-tight">
                    Automatically speak new AI responses as soon as they are generated
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={autoTTS}
                  onClick={() => setAutoTTS(!autoTTS)}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                    autoTTS ? "bg-cyan-500" : "bg-white/15"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
                      autoTTS ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>
            </div>

            {/* Voice Speed (Rate) Section */}
            <div className="py-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white/90 flex items-center gap-1.5">
                  <Gauge size={13} className="text-cyan-400" />
                  Speed (Speech Rate)
                </span>
                <span className="font-mono text-cyan-400 font-bold bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20 text-[11px]">
                  {rate.toFixed(2)}x
                </span>
              </div>

              {/* Quick Preset Buttons */}
              <div className="grid grid-cols-6 gap-1">
                {speedPresets.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setRate(preset)}
                    className={cn(
                      "py-1 rounded-md text-[11px] font-mono font-medium transition-colors cursor-pointer border text-center",
                      Math.abs(rate - preset) < 0.05
                        ? "bg-cyan-500 text-black font-bold border-cyan-400 shadow-sm"
                        : "bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border-white/5"
                    )}
                  >
                    {preset}x
                  </button>
                ))}
              </div>

              {/* Fine Slider */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] text-white/40 font-mono">0.5x</span>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.05"
                  value={rate}
                  onChange={(e) => setRate(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-white/15 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <span className="text-[10px] text-white/40 font-mono">2.5x</span>
              </div>
            </div>

            {/* Voice Personas Grid */}
            <div className="py-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white/90 flex items-center gap-1.5">
                  <User size={13} className="text-cyan-400" />
                  Voice Persona
                </span>
                <button
                  onClick={() => preview()}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 cursor-pointer font-medium"
                >
                  <Play size={10} fill="currentColor" />
                  Test Voice
                </button>
              </div>

              <div className="grid grid-cols-1 gap-1.5">
                {personas.map((persona) => {
                  const isSelected = personaId === persona.id && !voiceURI;
                  return (
                    <button
                      key={persona.id}
                      onClick={() => setPersona(persona.id)}
                      className={cn(
                        "w-full px-3 py-2 rounded-xl text-left text-xs transition-all flex items-center justify-between cursor-pointer border",
                        isSelected
                          ? "bg-cyan-500/15 border-cyan-400/50 text-white shadow-sm"
                          : "bg-white/5 hover:bg-white/10 border-white/5 text-white/70 hover:text-white"
                      )}
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-white truncate">{persona.name}</span>
                          <span className={cn(
                            "text-[9px] uppercase px-1.5 py-0.2 rounded font-mono font-bold shrink-0",
                            persona.gender === 'male' ? "bg-blue-500/20 text-blue-300" :
                            persona.gender === 'female' ? "bg-rose-500/20 text-rose-300" :
                            "bg-purple-500/20 text-purple-300"
                          )}>
                            {persona.gender}
                          </span>
                        </div>
                        <p className="text-[10px] text-white/45 truncate mt-0.5">{persona.description}</p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-cyan-400 text-black flex items-center justify-center">
                            <Check size={10} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Native System Voices Toggle */}
              {availableVoices.length > 0 && (
                <div className="pt-1">
                  <button
                    onClick={() => setShowAdvancedVoices(prev => !prev)}
                    className="w-full py-1.5 px-2 rounded-lg text-[11px] text-white/50 hover:text-white hover:bg-white/5 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span>More System Voices ({availableVoices.length} detected)</span>
                    <ChevronDown size={12} className={cn("transition-transform duration-200", showAdvancedVoices && "rotate-180")} />
                  </button>

                  {showAdvancedVoices && (
                    <div className="mt-1 max-h-36 overflow-y-auto space-y-1 p-1 bg-black/30 rounded-xl border border-white/5">
                      {availableVoices.map((voice) => {
                        const isVoiceSelected = voiceURI === voice.voiceURI;
                        return (
                          <button
                            key={voice.voiceURI}
                            onClick={() => setVoiceURI(voice.voiceURI)}
                            className={cn(
                              "w-full px-2.5 py-1.5 rounded-lg text-left text-[11px] transition-colors flex items-center justify-between cursor-pointer",
                              isVoiceSelected
                                ? "bg-cyan-500/20 text-cyan-300 font-semibold"
                                : "text-white/70 hover:bg-white/5 hover:text-white"
                            )}
                          >
                            <span className="truncate flex-1 pr-2">{voice.name} ({voice.lang})</span>
                            {isVoiceSelected && <Check size={12} className="text-cyan-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Pitch & Volume Sliders */}
            <div className="py-3 space-y-2.5">
              {/* Pitch Slider */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-white/80 text-[11px]">Pitch Level</span>
                  <span className="font-mono text-white/60 text-[10px]">{pitch.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.05"
                  value={pitch}
                  onChange={(e) => setPitch(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-white/15 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              {/* Volume Slider */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-white/80 text-[11px] flex items-center gap-1">
                    {volume === 0 ? <VolumeX size={11} /> : volume < 0.5 ? <Volume1 size={11} /> : <Volume2 size={11} />}
                    Volume
                  </span>
                  <span className="font-mono text-white/60 text-[10px]">{Math.round(volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-white/15 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>
            </div>

            {/* Footer Quick Action */}
            <div className="pt-3 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  setRate(1.0);
                  setPitch(1.0);
                  setVolume(1.0);
                  setPersona('male-deep');
                  setVoiceURI(null);
                  toast.info('Voice settings reset to default');
                }}
                className="text-[11px] text-white/40 hover:text-white/70 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={10} />
                Reset Defaults
              </button>

              {latestResponseText && (
                <button
                  onClick={() => {
                    speak(latestResponseText, {
                      onStart: () => toast.success('Reading latest answer aloud'),
                    });
                    setIsOpen(false);
                  }}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Play size={12} fill="currentColor" />
                  <span>Read Latest AI Answer</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
