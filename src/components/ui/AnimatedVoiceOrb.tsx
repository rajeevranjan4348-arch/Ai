import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Volume2, VolumeX, Pause, Play, Mic, Sparkles, Radio } from 'lucide-react';

export interface AnimatedVoiceOrbProps {
  /** Variant size: 'compact' (48-56px), 'medium' (100-120px), 'full' (220-280px) */
  size?: 'compact' | 'medium' | 'full';
  /** Whether the AI is currently speaking */
  isSpeaking?: boolean;
  /** Whether the microphone is currently listening */
  isListening?: boolean;
  /** Whether playback/speech is paused */
  isPaused?: boolean;
  /** External volume level from 0.0 to 1.0. If omitted, cadence is auto-simulated when active. */
  volumeLevel?: number;
  /** Status caption text to display below or beside the orb */
  statusText?: string;
  /** Subtitle / transcript text spoken by the AI */
  subtitle?: string;
  /** Click event handler (e.g. toggle speech pause/resume or open voice mode) */
  onClick?: () => void;
  /** Action button for pause/resume or stop */
  onTogglePlay?: () => void;
  /** Action button for mute/unmute */
  onToggleMute?: () => void;
  /** Custom extra styling */
  className?: string;
  /** Show floating orbit particles around orb */
  showParticles?: boolean;
  /** Show expanding audio wave rings when speaking */
  showWaves?: boolean;
  /** Show interactive playback controls overlay on hover */
  showControls?: boolean;
  /** Minimal mode without container background */
  transparentBg?: boolean;
  /** Enable standalone Web Speech API recognition inside the orb */
  enableSpeechRecognition?: boolean;
  /** Callback when transcript updates via Web Speech API */
  onTranscriptUpdate?: (transcript: string, isFinal: boolean) => void;
}

export const AnimatedVoiceOrb: React.FC<AnimatedVoiceOrbProps> = ({
  size = 'medium',
  isSpeaking: externalIsSpeaking = false,
  isListening = false,
  isPaused = false,
  volumeLevel,
  statusText,
  subtitle,
  onClick,
  onTogglePlay,
  onToggleMute,
  className,
  showParticles = true,
  showWaves = true,
  showControls = false,
  transparentBg = false,
  enableSpeechRecognition = false,
  onTranscriptUpdate,
}) => {
  const [internalVolume, setInternalVolume] = useState<number>(0);
  const [micVolume, setMicVolume] = useState<number>(0);
  const [synthSpeaking, setSynthSpeaking] = useState<boolean>(false);
  const [liveTranscript, setLiveTranscript] = useState<string>('');

  const animFrameRef = useRef<number | null>(null);
  const phaseRef = useRef<number>(0);

  const isSpeaking = externalIsSpeaking || synthSpeaking;

  // 1. Web Audio API Microphone Volume Input Analyzer
  useEffect(() => {
    if (!isListening) {
      setMicVolume(0);
      return;
    }

    let audioCtx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let stream: MediaStream | null = null;
    let animationFrameId: number | null = null;

    async function initMicAudioAnalysis() {
      try {
        if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) return;
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        audioCtx = new AudioCtx();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const measureVolume = () => {
          if (!analyser) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          // Scale average amplitude to 0.0 - 1.0 range
          const normalized = Math.min(1.0, Math.max(0, (avg - 12) / 65));
          setMicVolume(normalized);
          animationFrameId = requestAnimationFrame(measureVolume);
        };

        measureVolume();
      } catch (err) {
        console.warn('VoiceOrb Web Audio API mic analysis fallback:', err);
      }
    }

    initMicAudioAnalysis();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (source) source.disconnect();
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close();
      }
    };
  }, [isListening]);

  // 2. Web Speech API Recognition Integration
  useEffect(() => {
    if (!enableSpeechRecognition || !isListening || typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    let recognition: any = null;
    try {
      recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let interimText = '';
        let finalText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const piece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalText += piece;
          } else {
            interimText += piece;
          }
        }
        const textToDisplay = finalText || interimText;
        if (textToDisplay) {
          setLiveTranscript(textToDisplay);
          onTranscriptUpdate?.(textToDisplay, Boolean(finalText));
        }
      };

      recognition.start();
    } catch (e) {
      console.warn('VoiceOrb Web Speech API error:', e);
    }

    return () => {
      if (recognition) {
        try {
          recognition.stop();
        } catch (_) {}
      }
    };
  }, [enableSpeechRecognition, isListening, onTranscriptUpdate]);

  // 3. Web Speech Synthesis Event Listener (Detect global AI speech output)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const checkSpeech = () => {
      const active = window.speechSynthesis.speaking && !window.speechSynthesis.paused;
      setSynthSpeaking(active);
    };

    const timer = setInterval(checkSpeech, 150);
    return () => clearInterval(timer);
  }, []);

  // Smooth cadence modulation when volumeLevel is not directly passed
  useEffect(() => {
    let active = true;

    const animate = () => {
      if (!active) return;

      if (volumeLevel !== undefined && volumeLevel !== null) {
        // Smooth interpolation towards external volumeLevel
        setInternalVolume(prev => prev + (volumeLevel - prev) * 0.3);
      } else if (isListening && micVolume > 0.05) {
        // Real Web Audio mic volume reactivity
        setInternalVolume((prev) => prev + (micVolume - prev) * 0.35);
      } else if (isSpeaking && !isPaused) {
        // Natural human speech cadence simulation (vowel peaks, pauses)
        phaseRef.current += 0.08;
        const baseSine = Math.sin(phaseRef.current) * 0.35 + 0.45;
        const harmonic = Math.sin(phaseRef.current * 2.3) * 0.2;
        const randomNoise = (Math.random() - 0.5) * 0.15;
        const computed = Math.max(0.1, Math.min(1.0, baseSine + harmonic + randomNoise));
        setInternalVolume(prev => prev + (computed - prev) * 0.2);
      } else if (isListening) {
        // Gentle breathing pulse when listening
        phaseRef.current += 0.04;
        const computed = Math.sin(phaseRef.current) * 0.15 + 0.3;
        setInternalVolume(prev => prev + (computed - prev) * 0.15);
      } else {
        // Ambient resting state
        phaseRef.current += 0.02;
        const resting = Math.sin(phaseRef.current) * 0.05 + 0.08;
        setInternalVolume(prev => prev + (resting - prev) * 0.1);
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      active = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isSpeaking, isListening, isPaused, volumeLevel, micVolume]);

  // Dimensions & scale mapping
  const activeVolume = Math.max(0, Math.min(1, internalVolume));

  const sizeClasses = {
    compact: {
      container: 'w-14 h-14',
      orb: 'w-8 h-8',
      ring1: 'w-10 h-10',
      ring2: 'w-12 h-12',
      ring3: 'w-14 h-14',
      glowBlur: 'blur-md',
      particleCount: 8,
    },
    medium: {
      container: 'w-32 h-32',
      orb: 'w-16 h-16',
      ring1: 'w-22 h-22',
      ring2: 'w-26 h-26',
      ring3: 'w-30 h-30',
      glowBlur: 'blur-xl',
      particleCount: 16,
    },
    full: {
      container: 'w-64 h-64 md:w-72 md:h-72',
      orb: 'w-32 h-32 md:w-36 md:h-36',
      ring1: 'w-48 h-48',
      ring2: 'w-56 h-56',
      ring3: 'w-64 h-64',
      glowBlur: 'blur-2xl',
      particleCount: 28,
    },
  }[size];

  // Dynamic particle coordinates
  const particlesList = useMemo(() => {
    const count = sizeClasses.particleCount;
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2;
      const radiusMult = 0.8 + Math.random() * 0.6;
      const baseDistance = size === 'compact' ? 22 : size === 'medium' ? 50 : 110;
      const x = Math.cos(angle) * baseDistance * radiusMult;
      const y = Math.sin(angle) * baseDistance * radiusMult;
      const x2 = x * (0.6 + Math.random() * 0.8);
      const y2 = y * (0.6 + Math.random() * 0.8);
      const duration = 2.5 + Math.random() * 3.5;
      const delay = -Math.random() * 4;
      const sizePx = 2 + Math.floor(Math.random() * 3);
      return { id: i, x, y, x2, y2, duration, delay, sizePx };
    });
  }, [size, sizeClasses.particleCount]);

  // Derived state labels
  const defaultStatus = isSpeaking
    ? isPaused ? 'Voice Paused' : 'AI Speaking'
    : isListening
    ? 'Listening...'
    : 'AI Voice Ready';

  const displayStatus = statusText || defaultStatus;

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center justify-center select-none group transition-all",
        onClick && "cursor-pointer",
        className
      )}
    >
      {/* Orb Visualizer Area */}
      <div className={cn("relative flex items-center justify-center", sizeClasses.container)}>
        {/* Ambient Radial Background Glow */}
        <motion.div
          animate={{
            scale: isSpeaking ? 1 + activeVolume * 0.35 : isListening ? 1 + activeVolume * 0.2 : 1,
            opacity: isSpeaking ? 0.45 + activeVolume * 0.4 : isListening ? 0.3 + activeVolume * 0.25 : 0.2,
          }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className={cn(
            "absolute inset-0 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 opacity-40 transform-gpu will-change-transform pointer-events-none",
            sizeClasses.glowBlur
          )}
        />

        {/* Outer Concentric Rings */}
        <motion.div
          animate={{
            scale: isSpeaking ? 0.95 + activeVolume * 0.2 : 0.95,
            opacity: isSpeaking ? 0.3 + activeVolume * 0.4 : 0.2,
          }}
          transition={{ duration: 0.2 }}
          className={cn(
            "absolute rounded-full border border-blue-400/20 shadow-[0_0_15px_rgba(96,165,250,0.15)] pointer-events-none",
            sizeClasses.ring3
          )}
        />

        <motion.div
          animate={{
            scale: isSpeaking ? 0.96 + activeVolume * 0.18 : 0.96,
            opacity: isSpeaking ? 0.4 + activeVolume * 0.4 : 0.3,
          }}
          transition={{ duration: 0.18 }}
          className={cn(
            "absolute rounded-full border border-indigo-400/30 shadow-[0_0_20px_rgba(129,140,248,0.2)] pointer-events-none",
            sizeClasses.ring2
          )}
        />

        <motion.div
          animate={{
            scale: isSpeaking ? 0.98 + activeVolume * 0.15 : 0.98,
            opacity: isSpeaking ? 0.5 + activeVolume * 0.35 : 0.4,
          }}
          transition={{ duration: 0.15 }}
          className={cn(
            "absolute rounded-full border border-cyan-400/40 shadow-[0_0_25px_rgba(34,211,238,0.25)] pointer-events-none",
            sizeClasses.ring1
          )}
        />

        {/* Radial Waves when speaking */}
        {showWaves && isSpeaking && !isPaused && (
          <>
            {[0, 1, 2].map((waveIndex) => (
              <motion.div
                key={`wave-${waveIndex}`}
                initial={{ scale: 0.7, opacity: 0.6 }}
                animate={{
                  scale: [0.7, 1.45 + activeVolume * 0.3],
                  opacity: [0.6, 0],
                }}
                transition={{
                  duration: 1.6,
                  repeat: Infinity,
                  delay: waveIndex * 0.5,
                  ease: 'easeOut',
                }}
                className={cn(
                  "absolute rounded-full border-2 border-cyan-400/30 pointer-events-none",
                  sizeClasses.orb
                )}
              />
            ))}
          </>
        )}

        {/* Orbit Particles */}
        {showParticles && (
          <div className="absolute inset-0 pointer-events-none">
            {particlesList.map((p) => (
              <motion.span
                key={p.id}
                animate={{
                  x: [p.x, p.x2, p.x],
                  y: [p.y, p.y2, p.y],
                  scale: isSpeaking ? [0.6, 1.3 + activeVolume * 0.5, 0.6] : [0.5, 1, 0.5],
                  opacity: isSpeaking ? [0.2, 0.85, 0.2] : [0.1, 0.4, 0.1],
                }}
                transition={{
                  duration: p.duration,
                  repeat: Infinity,
                  delay: p.delay,
                  ease: 'easeInOut',
                }}
                style={{
                  width: `${p.sizePx}px`,
                  height: `${p.sizePx}px`,
                }}
                className="absolute top-1/2 left-1/2 -mt-0.5 -ml-0.5 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.8)]"
              />
            ))}
          </div>
        )}

        {/* Central Core Orb */}
        <motion.div
          animate={{
            scale: isSpeaking
              ? 1 + activeVolume * 0.28
              : isListening
              ? 1 + activeVolume * 0.15
              : [1, 1.04, 1],
            boxShadow: isSpeaking
              ? `0 0 ${30 + activeVolume * 50}px rgba(99,102,241,${0.6 + activeVolume * 0.4}), 0 0 ${70 + activeVolume * 80}px rgba(59,130,246,${0.3 + activeVolume * 0.4})`
              : isListening
              ? `0 0 35px rgba(34,211,238,0.7), 0 0 70px rgba(59,130,246,0.4)`
              : `0 0 25px rgba(99,102,241,0.5), 0 0 50px rgba(59,130,246,0.25)`,
          }}
          transition={
            isSpeaking || isListening
              ? { duration: 0.08, ease: 'linear' }
              : { duration: 3, repeat: Infinity, ease: 'easeInOut' }
          }
          className={cn(
            "relative rounded-full z-10 overflow-hidden flex items-center justify-center transform-gpu will-change-transform border border-white/20",
            sizeClasses.orb
          )}
          style={{
            background: `radial-gradient(circle at 38% 32%, #ffffff 0%, #a78bfa 12%, #6366f1 32%, #3b82f6 58%, #1e1b4b 85%, #09090b 100%)`,
          }}
        >
          {/* Inner Glare Rotating Overlay */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-2 rounded-full pointer-events-none opacity-40 mix-blend-overlay"
            style={{
              background: `conic-gradient(from 0deg, transparent, rgba(255,255,255,0.6), transparent, rgba(99,102,241,0.5), transparent)`,
              filter: 'blur(4px)',
            }}
          />

          {/* Center Icon for Compact Mode */}
          {size === 'compact' && (
            <div className="relative z-20 text-white drop-shadow-md">
              {isSpeaking ? (
                <Radio className="w-4 h-4 animate-pulse text-cyan-200" />
              ) : isListening ? (
                <Mic className="w-4 h-4 text-cyan-200" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
              )}
            </div>
          )}

          {/* Hover Control Overlay if showControls is true */}
          {showControls && (onTogglePlay || onToggleMute) && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-30">
              {onTogglePlay && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTogglePlay();
                  }}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-transform hover:scale-110"
                  title={isPaused ? 'Resume Voice' : 'Pause Voice'}
                >
                  {isPaused ? <Play size={14} className="ml-0.5" /> : <Pause size={14} />}
                </button>
              )}
              {onToggleMute && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleMute();
                  }}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-transform hover:scale-110"
                  title="Mute / Stop Voice"
                >
                  <VolumeX size={14} />
                </button>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Status Badge & Subtitle Text below Orb for medium & full sizes */}
      {size !== 'compact' && (
        <div className="mt-3 text-center max-w-md px-2 z-10 flex flex-col items-center">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-xs font-semibold text-white/90 shadow-sm">
            <span
              className={cn(
                "w-2 h-2 rounded-full animate-ping",
                isSpeaking
                  ? "bg-cyan-400"
                  : isListening
                  ? "bg-emerald-400"
                  : "bg-indigo-400"
              )}
            />
            <span className="tracking-wide">{displayStatus}</span>
            {isSpeaking && (
              <span className="text-[10px] text-cyan-300 font-mono ml-1">
                {Math.round(activeVolume * 100)}%
              </span>
            )}
          </div>

          {/* Subtitle / Transcript spoken */}
          {(subtitle || liveTranscript) && (
            <motion.p
              key={subtitle || liveTranscript}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 text-sm md:text-base font-medium text-white/90 leading-relaxed drop-shadow-sm line-clamp-2"
            >
              "{subtitle || liveTranscript}"
            </motion.p>
          )}
        </div>
      )}
    </div>
  );
};

export const VoiceOrb = AnimatedVoiceOrb;
export default AnimatedVoiceOrb;
