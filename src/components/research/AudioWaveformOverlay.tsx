import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Radio, Activity, Volume2, Sparkles, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioWaveformOverlayProps {
  isListening: boolean;
  transcript?: string;
  interimTranscript?: string;
  language?: string;
  className?: string;
}

export type WaveformStyleMode = 'fluid' | 'bars' | 'spectrum';

export const AudioWaveformOverlay: React.FC<AudioWaveformOverlayProps> = ({
  isListening,
  transcript = '',
  interimTranscript = '',
  language = 'en-US',
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [waveformStyle, setWaveformStyle] = useState<WaveformStyleMode>('fluid');
  const [peakLevel, setPeakLevel] = useState<number>(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  // Initialize Web Audio API Analyser stream on microphone activation
  useEffect(() => {
    if (!isListening) {
      // Clean up audio context
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        try {
          audioCtxRef.current.close();
        } catch (e) {
          // ignore
        }
        audioCtxRef.current = null;
      }
      setAudioLevel(0);
      setPeakLevel(0);
      return;
    }

    let isSubscribed = true;

    async function initAudioAnalyser() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) return;

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        if (!isSubscribed) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        mediaStreamRef.current = stream;

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;

        const audioCtx = new AudioContextClass();
        audioCtxRef.current = audioCtx;

        if (audioCtx.state === 'suspended') {
          await audioCtx.resume();
        }

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.75;
        analyserRef.current = analyser;

        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        dataArrayRef.current = dataArray;

        let lastPeak = 0;

        const draw = () => {
          if (!isSubscribed || !analyserRef.current || !dataArrayRef.current) return;

          analyserRef.current.getByteFrequencyData(dataArrayRef.current as any);

          // Calculate average volume intensity (RMS / frequency sum)
          let sum = 0;
          for (let i = 0; i < dataArrayRef.current.length; i++) {
            sum += dataArrayRef.current[i];
          }
          const avg = sum / dataArrayRef.current.length;
          const normalizedLevel = Math.min(100, Math.round((avg / 128) * 100));

          setAudioLevel(normalizedLevel);
          if (normalizedLevel > lastPeak) {
            lastPeak = normalizedLevel;
            setPeakLevel(lastPeak);
          } else {
            lastPeak = Math.max(0, lastPeak - 1);
            setPeakLevel(lastPeak);
          }

          // Canvas rendering logic
          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              const width = canvas.width;
              const height = canvas.height;
              const centerY = height / 2;

              ctx.clearRect(0, 0, width, height);

              const time = Date.now() * 0.003;
              const intensityFactor = Math.max(0.1, normalizedLevel / 100);

              if (waveformStyle === 'fluid') {
                // Multi-layered glowing sine waves
                const waves = [
                  { color: 'rgba(6, 182, 212, 0.85)', speed: 1.2, freq: 0.02, amp: height * 0.38 * intensityFactor },
                  { color: 'rgba(244, 63, 94, 0.75)', speed: -0.9, freq: 0.03, amp: height * 0.28 * intensityFactor },
                  { color: 'rgba(168, 85, 247, 0.65)', speed: 1.5, freq: 0.015, amp: height * 0.42 * intensityFactor },
                ];

                waves.forEach((w) => {
                  ctx.beginPath();
                  ctx.lineWidth = 2.5;
                  ctx.strokeStyle = w.color;
                  ctx.shadowColor = w.color;
                  ctx.shadowBlur = 12 * intensityFactor;

                  for (let x = 0; x < width; x += 3) {
                    const y = centerY + Math.sin(x * w.freq + time * w.speed) * w.amp * Math.sin((x / width) * Math.PI);
                    if (x === 0) {
                      ctx.moveTo(x, y);
                    } else {
                      ctx.lineTo(x, y);
                    }
                  }
                  ctx.stroke();
                });
              } else if (waveformStyle === 'bars') {
                // Responsive Frequency Equalizer Bars
                const barCount = 32;
                const barWidth = (width / barCount) * 0.65;
                const gap = (width / barCount) * 0.35;

                for (let i = 0; i < barCount; i++) {
                  const dataIndex = Math.floor((i / barCount) * dataArrayRef.current.length);
                  const value = dataArrayRef.current[dataIndex] || 0;
                  const barHeight = Math.max(4, (value / 255) * height * 0.85);
                  const x = i * (barWidth + gap) + gap / 2;
                  const y = centerY - barHeight / 2;

                  const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
                  gradient.addColorStop(0, '#06b6d4');
                  gradient.addColorStop(0.5, '#f43f5e');
                  gradient.addColorStop(1, '#a855f7');

                  ctx.fillStyle = gradient;
                  ctx.shadowColor = '#06b6d4';
                  ctx.shadowBlur = Math.min(15, barHeight * 0.3);

                  ctx.beginPath();
                  ctx.roundRect(x, y, barWidth, barHeight, [ barWidth / 2 ]);
                  ctx.fill();
                }
              } else {
                // Mirror Spectrum Pulse
                const sliceWidth = width / dataArrayRef.current.length;
                ctx.beginPath();
                ctx.lineWidth = 3;
                ctx.strokeStyle = '#06b6d4';
                ctx.shadowColor = '#06b6d4';
                ctx.shadowBlur = 16;

                let x = 0;
                for (let i = 0; i < dataArrayRef.current.length; i++) {
                  const v = dataArrayRef.current[i] / 128.0;
                  const y = (v * height) / 2;

                  if (i === 0) {
                    ctx.moveTo(x, y);
                  } else {
                    ctx.lineTo(x, y);
                  }
                  x += sliceWidth;
                }
                ctx.stroke();
              }
            }
          }

          animationFrameRef.current = requestAnimationFrame(draw);
        };

        draw();
      } catch (err) {
        console.warn('Could not connect microphone stream to Web Audio Analyser:', err);
      }
    }

    initAudioAnalyser();

    return () => {
      isSubscribed = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        try { audioCtxRef.current.close(); } catch (e) {}
      }
    };
  }, [isListening, waveformStyle]);

  // Sync canvas width and height dynamically to match container
  useEffect(() => {
    if (!isListening) return;

    const handleResize = () => {
      if (canvasRef.current && canvasRef.current.parentElement) {
        const rect = canvasRef.current.parentElement.getBoundingClientRect();
        canvasRef.current.width = rect.width;
        canvasRef.current.height = Math.max(48, rect.height);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isListening]);

  if (!isListening) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0, scaleY: 0.95 }}
        animate={{ opacity: 1, height: 'auto', scaleY: 1 }}
        exit={{ opacity: 0, height: 0, scaleY: 0.95 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className={cn(
          "relative w-full rounded-2xl overflow-hidden bg-gradient-to-r from-cyan-950/40 via-zinc-900/90 to-rose-950/40 border border-cyan-500/30 backdrop-blur-md p-3 mb-2 shadow-2xl",
          className
        )}
      >
        {/* Subtle glowing ambient background effect */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-rose-500/10 to-purple-500/10 opacity-60 transition-opacity duration-300 pointer-events-none"
          style={{ opacity: Math.max(0.2, audioLevel / 100) }}
        />

        <div className="relative z-10 flex flex-col gap-2">
          {/* Top Info Header Bar */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2.5">
              {/* Mic Icon with dynamic pulsing ring */}
              <div className="relative flex items-center justify-center shrink-0">
                <span
                  className="w-7 h-7 rounded-full bg-cyan-500/30 animate-ping absolute"
                  style={{ animationDuration: `${Math.max(0.4, 2 - (audioLevel / 60))}s` }}
                />
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/40 relative z-10">
                  <Mic size={14} className="animate-pulse" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
                    Dynamic Voice Waveform
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  </span>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    LIVE AUDIO
                  </span>
                </div>
                <p className="text-[11px] text-white/70 truncate max-w-xs sm:max-w-md">
                  {interimTranscript ? `"${interimTranscript}"` : transcript ? `"${transcript}"` : 'Speak into your microphone...'}
                </p>
              </div>
            </div>

            {/* Right: Real-time Audio Intensity Badge & Waveform Mode Switcher */}
            <div className="flex items-center gap-2">
              {/* Live Audio Level Meter Badge */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 border border-white/10 text-[11px] font-mono text-white/90 shadow-inner">
                <Activity size={12} className={cn("transition-colors", audioLevel > 40 ? "text-rose-400 animate-bounce" : "text-cyan-400")} />
                <span className="text-white/60">Voice Intensity:</span>
                <span className={cn(
                  "font-bold transition-all",
                  audioLevel > 60 ? "text-rose-400 scale-105" : audioLevel > 20 ? "text-cyan-300" : "text-white/50"
                )}>
                  {audioLevel}%
                </span>
              </div>

              {/* Waveform Visualization Style Switcher */}
              <div className="flex items-center p-0.5 bg-black/40 rounded-xl border border-white/10 shrink-0">
                {(['fluid', 'bars', 'spectrum'] as WaveformStyleMode[]).map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setWaveformStyle(style)}
                    className={cn(
                      "px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer capitalize",
                      waveformStyle === style
                        ? "bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 shadow-sm"
                        : "text-white/50 hover:text-white/90"
                    )}
                    title={`Switch to ${style} waveform style`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Canvas Waveform Container */}
          <div className="relative w-full h-14 rounded-xl overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center p-1">
            <canvas
              ref={canvasRef}
              className="w-full h-full block"
            />

            {/* Intensity Level Bottom Bar */}
            <div className="absolute bottom-0 inset-x-0 h-1 bg-white/5">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 via-rose-500 to-purple-500 transition-all duration-75"
                style={{ width: `${audioLevel}%` }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
