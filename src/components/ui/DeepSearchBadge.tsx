import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DeepSearchIcon } from './DeepSearchIcon';
import { Sparkles, X, ChevronRight, Cpu } from 'lucide-react';

interface DeepSearchBadgeProps {
  isActive: boolean;
  onDisable?: () => void;
  onClick?: () => void;
  className?: string;
  topicName?: string;
}

export const DeepSearchBadge: React.FC<DeepSearchBadgeProps> = ({
  isActive,
  onDisable,
  onClick,
  className = '',
  topicName,
}) => {
  if (!isActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.94 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-cyan-200 text-xs backdrop-blur-xl shadow-lg shadow-cyan-950/50 select-none ${className}`}
      >
        {/* Animated Icon */}
        <div className="w-5 h-5 flex items-center justify-center shrink-0">
          <DeepSearchIcon size={20} isAnimated={true} active={true} className="text-white" />
        </div>

        {/* Text Details */}
        <button
          type="button"
          onClick={onClick}
          className="flex items-center gap-1.5 text-left font-medium hover:text-white transition-colors cursor-pointer"
        >
          <span className="font-semibold text-cyan-300 tracking-tight">Deep Search Active</span>
          {topicName ? (
            <span className="text-[11px] text-cyan-200/80 truncate max-w-[150px]">
              • {topicName}
            </span>
          ) : (
            <span className="text-[11px] text-cyan-200/70 hidden sm:inline">
              • Multi-step synthesis & web exploration
            </span>
          )}
        </button>

        {/* Optional close/toggle button */}
        {onDisable && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDisable();
            }}
            className="p-1 -mr-1 rounded-full text-cyan-300/60 hover:text-cyan-100 hover:bg-cyan-500/20 transition-all cursor-pointer"
            title="Switch back to Standard Chat"
          >
            <X size={13} strokeWidth={2.2} />
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default DeepSearchBadge;
