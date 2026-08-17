import React from 'react';
import { motion } from 'framer-motion';

interface HamsterLoaderProps {
  label?: string;
  subtext?: string;
}

export const HamsterLoader: React.FC<HamsterLoaderProps> = ({
  label = 'AI is thinking...',
  subtext
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl bg-gradient-to-b from-[#141420]/90 via-[#0f101a]/90 to-[#0a0a12]/90 border border-cyan-500/30 backdrop-blur-2xl shadow-2xl text-center max-w-sm my-3 mx-auto sm:mx-0 overflow-hidden relative group"
    >
      {/* Background glow effects */}
      <div className="absolute -top-10 -left-10 w-24 h-24 bg-cyan-500/15 rounded-full blur-xl pointer-events-none group-hover:bg-cyan-500/25 transition-all duration-500" />
      <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-purple-500/15 rounded-full blur-xl pointer-events-none group-hover:bg-purple-500/25 transition-all duration-500" />

      {/* Hamster Wheel Animation Container */}
      <div className="relative flex items-center justify-center p-2">
        <div className="wheel-and-hamster" aria-label="AI is thinking hamster animation">
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

      {/* Label and bouncing dots */}
      <div className="flex flex-col items-center gap-1 z-10">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-wide bg-gradient-to-r from-cyan-300 via-white to-purple-300 bg-clip-text text-transparent">
            {label}
          </span>
          <div className="inline-flex items-center text-cyan-400 font-bold text-sm">
            <span className="animate-bounce" style={{ animationDelay: '0s' }}>.</span>
            <span className="animate-bounce" style={{ animationDelay: '0.15s' }}>.</span>
            <span className="animate-bounce" style={{ animationDelay: '0.3s' }}>.</span>
          </div>
        </div>

        {subtext && (
          <span className="text-[11px] text-white/50 font-mono tracking-wide">
            {subtext}
          </span>
        )}
      </div>
    </motion.div>
  );
};
