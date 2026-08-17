import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DeepSearchIcon } from '@/components/ui/DeepSearchIcon';
import { Globe, Brain, Search, Layers, Sparkles } from 'lucide-react';

interface DeepSearchLoadingAnimationProps {
  query?: string;
  isDeepResearch?: boolean;
}

const DEEP_SEARCH_STEPS = [
  { text: 'Deconstructing query intent and semantic concept graph...', icon: Brain },
  { text: 'Scanning multiple authoritative research indexes and live web sources...', icon: Globe },
  { text: 'Extracting key claims, cross-verifying facts and empirical datasets...', icon: Search },
  { text: 'Synthesizing multi-angle consensus and structured deep insights...', icon: Layers },
];

export const DeepSearchLoadingAnimation: React.FC<DeepSearchLoadingAnimationProps> = ({
  query,
  isDeepResearch = true,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev + 1) % DEEP_SEARCH_STEPS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const currentStep = DEEP_SEARCH_STEPS[currentStepIndex];
  const StepIcon = currentStep.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full max-w-3xl mx-auto my-4 rounded-3xl overflow-hidden border border-cyan-500/30 bg-gradient-to-b from-cyan-950/40 via-[#071318]/75 to-[#02080a]/90 backdrop-blur-2xl shadow-2xl shadow-cyan-950/60 p-5 sm:p-6"
    >
      {/* ── Ambient Radial Scan Glow ── */}
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-10 left-10 w-60 h-60 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Top Header with Glowing Icon & Mode Label */}
      <div className="flex items-center justify-between gap-4 border-b border-cyan-500/20 pb-4 mb-4">
        <div className="flex items-center gap-3">
          {/* Animated Brain + Magnifier Icon */}
          <div className="w-10 h-10 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center shadow-lg shadow-cyan-900/40 shrink-0">
            <DeepSearchIcon size={24} isAnimated={true} active={true} className="text-white" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
                <span>Deep Search Reasoning</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse">
                  SEARCHING & ANALYZING
                </span>
              </h4>
            </div>
            <p className="text-xs text-cyan-200/70 mt-0.5">
              Autonomous multi-step investigation & synthesis pipeline
            </p>
          </div>
        </div>

        {/* Pulsing Scan Radar Ring */}
        <div className="relative flex items-center justify-center w-8 h-8 shrink-0">
          <motion.div
            animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-full border border-cyan-400"
          />
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-md shadow-cyan-400/80" />
        </div>
      </div>

      {/* Step Progress Visualizer */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mb-4">
        {DEEP_SEARCH_STEPS.map((step, idx) => {
          const isDone = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;
          return (
            <div key={idx} className="flex flex-col gap-1.5">
              <div className="h-1.5 w-full rounded-full overflow-hidden bg-white/10 relative">
                {isDone && <div className="h-full w-full bg-cyan-400 rounded-full" />}
                {isCurrent && (
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 2.8, ease: 'linear', repeat: Infinity }}
                    className="h-full bg-gradient-to-r from-cyan-500 to-teal-300 rounded-full shadow-sm shadow-cyan-400"
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Current Animated Status Indicator */}
      <div className="flex items-center gap-3 bg-cyan-950/50 border border-cyan-500/25 rounded-2xl p-3 sm:px-4">
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          className="w-7 h-7 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shrink-0"
        >
          <StepIcon size={15} />
        </motion.div>

        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.p
              key={currentStepIndex}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
              className="text-xs sm:text-sm font-medium text-cyan-100 truncate"
            >
              {currentStep.text}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Shimmering Scan Wave */}
        <div className="flex items-center gap-1 shrink-0">
          <span className="w-1 h-3 bg-cyan-400/80 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <span className="w-1 h-4 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <span className="w-1 h-3 bg-cyan-400/80 rounded-full animate-bounce" />
        </div>
      </div>
    </motion.div>
  );
};

export default DeepSearchLoadingAnimation;
