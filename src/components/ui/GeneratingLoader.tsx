import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Brain, Cpu, Zap, RefreshCw } from 'lucide-react';
import { getThinkingWordsForQuery } from '@/lib/thinkingWords';

interface GeneratingLoaderProps {
  message?: string;
  subtext?: string;
  variant?: 'compact' | 'full' | 'bubble';
  showSubtextSequence?: boolean;
  userQuery?: string;
}

export const GeneratingLoader: React.FC<GeneratingLoaderProps> = ({
  message = 'Generating response...',
  subtext,
  variant = 'full',
  showSubtextSequence = true,
  userQuery
}) => {
  const [subtextIndex, setSubtextIndex] = useState(0);

  const subtextList = useMemo(() => {
    return getThinkingWordsForQuery(userQuery);
  }, [userQuery]);

  useEffect(() => {
    if (!showSubtextSequence) return;
    const interval = setInterval(() => {
      setSubtextIndex((prev) => (prev + 1) % subtextList.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [showSubtextSequence, subtextList]);

  const activeSubtext = subtext || (showSubtextSequence ? subtextList[subtextIndex] : null);

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-medium backdrop-blur-md shadow-sm w-fit"
      >
        <div className="relative flex items-center justify-center w-3.5 h-3.5">
          <span className="absolute w-full h-full rounded-full bg-cyan-400/50 animate-ping" />
          <Sparkles size={13} className="text-cyan-400 animate-spin" style={{ animationDuration: '3s' }} />
        </div>
        <span className="tracking-wide font-semibold">{message}</span>
      </motion.div>
    );
  }

  if (variant === 'bubble') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -6, scale: 0.98 }}
        className="flex items-center gap-4 px-4 py-3 rounded-2xl bg-[#12121c]/95 border border-cyan-500/30 backdrop-blur-xl shadow-xl w-fit my-2"
      >
        {/* Hamster Wheel Animation */}
        <div className="relative flex items-center justify-center shrink-0 my-0.5">
          <div className="wheel-and-hamster" style={{ fontSize: '9px' }} aria-label="AI is thinking hamster animation">
            <div className="wheel" />
            <div className="hamster">
              <div className="hamster__body">
                <div className="hamster__head">
                  <div className="hamster__ear" />
                  <div className="hamster__eye" />
                  <div className="hamster__nose" />
                </div>
                <div className="hamster__limb hamster__limb--fr" />
                <div className="hamster__limb hamster__limb--fl" />
                <div className="hamster__limb hamster__limb--br" />
                <div className="hamster__limb hamster__limb--bl" />
                <div className="hamster__tail" />
              </div>
            </div>
            <div className="spoke" />
          </div>
        </div>

        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-white/95 tracking-wide">
              {message.replace(/Generating response\.\.\.|Generating AI response\.\.\./i, 'AI is thinking')}
            </span>
            <div className="inline-flex items-center text-cyan-400 font-bold text-xs">
              <span className="animate-bounce" style={{ animationDelay: '0s' }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: '0.15s' }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: '0.3s' }}>.</span>
            </div>
          </div>
          {activeSubtext && (
            <motion.span
              key={activeSubtext}
              initial={{ opacity: 0, y: 2 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[11px] text-cyan-300/80 font-mono truncate max-w-xs"
            >
              {activeSubtext}
            </motion.span>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      className="flex flex-col gap-3 p-4 rounded-2xl bg-gradient-to-b from-[#14141e]/95 to-[#0e0e16]/95 border border-cyan-500/20 shadow-2xl backdrop-blur-xl my-3 max-w-md relative overflow-hidden group"
    >
      {/* Background Animated Gradient Glow */}
      <div className="absolute -top-12 -left-12 w-28 h-28 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-cyan-500/20 transition-all duration-700" />
      <div className="absolute -bottom-12 -right-12 w-28 h-28 bg-purple-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-purple-500/20 transition-all duration-700" />

      <div className="flex items-center justify-between gap-3 z-10">
        <div className="flex items-center gap-3">
          {/* Animated AI Core Icon */}
          <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 shadow-inner shrink-0">
            <span className="absolute inset-0 rounded-xl bg-cyan-400/20 animate-ping opacity-75" style={{ animationDuration: '2s' }} />
            <Brain size={16} className="text-cyan-300 animate-pulse" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white tracking-wide bg-gradient-to-r from-white via-white/90 to-cyan-200 bg-clip-text text-transparent">
                {message}
              </span>
              <div className="inline-flex items-center text-cyan-400 font-bold text-xs">
                <span className="animate-bounce" style={{ animationDelay: '0s' }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: '0.15s' }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: '0.3s' }}>.</span>
              </div>
            </div>
            {activeSubtext && (
              <motion.span
                key={activeSubtext}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="text-[11px] text-cyan-300/70 font-mono tracking-tight truncate"
              >
                {activeSubtext}
              </motion.span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Zap size={14} className="text-amber-400 animate-pulse shrink-0" />
        </div>
      </div>

      {/* Shimmering Progress Scanner Line */}
      <div className="relative w-full h-1 bg-white/10 rounded-full overflow-hidden z-10">
        <motion.div
          className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
          animate={{
            left: ['-50%', '100%']
          }}
          transition={{
            repeat: Infinity,
            duration: 1.8,
            ease: 'easeInOut'
          }}
        />
      </div>
    </motion.div>
  );
};
