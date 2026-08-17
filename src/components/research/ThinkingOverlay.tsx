import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, StopCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThinkingOverlayProps {
  isThinking: boolean;
  statusText?: string;
  onCancel?: () => void;
  className?: string;
}

export const ThinkingOverlay: React.FC<ThinkingOverlayProps> = ({
  isThinking,
  statusText = 'AI is thinking...',
  onCancel,
  className
}) => {
  return (
    <AnimatePresence>
      {isThinking && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.92 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className={cn(
            "flex items-center justify-between gap-4 px-5 py-3 rounded-2xl glass border border-cyan-500/30 backdrop-blur-2xl shadow-2xl text-white mx-auto max-w-md my-2 z-30 select-none relative overflow-hidden group",
            className
          )}
        >
          {/* Subtle ambient glows */}
          <div className="absolute -top-10 -left-10 w-20 h-20 bg-cyan-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="absolute -bottom-10 -right-10 w-20 h-20 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />

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

          {/* Status text & Bouncing dots */}
          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <Sparkles size={13} className="text-cyan-400 animate-pulse shrink-0" />
              <span className="text-xs font-semibold bg-gradient-to-r from-cyan-300 via-white to-purple-300 bg-clip-text text-transparent truncate">
                {statusText}
              </span>
              <div className="inline-flex items-center text-cyan-400 font-bold text-xs">
                <span className="animate-bounce" style={{ animationDelay: '0s' }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: '0.15s' }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: '0.3s' }}>.</span>
              </div>
            </div>
            <span className="text-[10px] text-white/50 font-mono tracking-wide truncate">
              Processing request & generating response
            </span>
          </div>

          {/* Optional Cancel/Stop Button */}
          {onCancel && (
            <button
              onClick={onCancel}
              className="p-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 transition-colors cursor-pointer shrink-0 active:scale-95"
              title="Stop generating"
            >
              <StopCircle size={16} />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
