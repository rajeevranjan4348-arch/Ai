import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Collaborator } from '@/hooks/useCollaboration';

interface CollaboratorAvatarsProps {
  collaborators: Collaborator[];
  isConnected: boolean;
  className?: string;
}

export const CollaboratorAvatars: React.FC<CollaboratorAvatarsProps> = ({
  collaborators,
  isConnected,
  className,
}) => {
  // Don't render at all if not connected and no one else is present
  if (!isConnected && collaborators.length === 0) return null;

  const visible = collaborators.slice(0, 4);
  const overflow = collaborators.length - 4;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <AnimatePresence>
        {collaborators.length > 0 && (
          <motion.div
            key="avatars"
            initial={{ opacity: 0, x: 6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 6 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex items-center gap-2"
          >
            {/* Stacked avatars */}
            <div className="flex -space-x-2">
              <AnimatePresence>
                {visible.map((c, i) => (
                  <motion.div
                    key={c.userId}
                    initial={{ opacity: 0, scale: 0.6, x: -4 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    transition={{ delay: i * 0.05, duration: 0.2 }}
                    className="w-6 h-6 rounded-full border-2 border-black/60 flex items-center justify-center text-[10px] font-bold text-white shadow-md shrink-0"
                    style={{ backgroundColor: c.metadata?.color || '#888888' }}
                    title={c.metadata?.name || `User ${c.userId.slice(-4)}`}
                  >
                    {(c.metadata?.name || 'R')[0].toUpperCase()}
                  </motion.div>
                ))}
              </AnimatePresence>

              {overflow > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-6 h-6 rounded-full border-2 border-black/60 bg-white/10 flex items-center justify-center text-[9px] text-white/60 font-medium"
                >
                  +{overflow}
                </motion.div>
              )}
            </div>

            {/* Count label */}
            <span className="text-[11px] text-white/30 tabular-nums">
              {collaborators.length} viewing
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live/offline indicator dot */}
      <motion.div
        animate={{
          backgroundColor: isConnected ? '#34d399' : 'rgba(255,255,255,0.15)',
          boxShadow: isConnected
            ? '0 0 6px 1px rgba(52,211,153,0.45)'
            : 'none',
        }}
        transition={{ duration: 0.4 }}
        className="w-1.5 h-1.5 rounded-full shrink-0"
        title={isConnected ? 'Live collaboration active' : 'Offline'}
      />
    </div>
  );
};
