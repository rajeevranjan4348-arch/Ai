import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { blink } from '@/lib/blink';

interface CollaborationBarProps {
  threadId: string;
  sessionId: string;
}

interface ViewerUser {
  userId: string;
  metadata?: { name?: string };
  joinedAt?: number;
  lastSeen?: number;
}

export interface CollaborationBarHandle {
  publishTyping: () => void;
}

const CollaborationBar = React.forwardRef<CollaborationBarHandle, CollaborationBarProps>(
  ({ threadId, sessionId }, ref) => {
    const [viewers, setViewers] = useState<ViewerUser[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [copied, setCopied] = useState(false);
    const channelRef = useRef<any>(null);
    const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Expose publishTyping via ref
    React.useImperativeHandle(ref, () => ({
      publishTyping: () => {
        if (!channelRef.current) return;
        try {
          channelRef.current.publish('typing', { ts: Date.now() }, { userId: sessionId });
        } catch {
          // silently fail
        }
      },
    }));

    useEffect(() => {
      if (!threadId || !sessionId) return;

      let channel: any = null;
      let mounted = true;

      const connect = async () => {
        try {
          channel = blink.realtime.channel(`thread_${threadId}`);
          channelRef.current = channel;

          await channel.subscribe({
            userId: sessionId,
            metadata: { name: `User ${sessionId.slice(-4)}` },
          });

          if (!mounted) return;

          channel.onPresence((users: ViewerUser[]) => {
            if (!mounted) return;
            setViewers(users);
          });

          channel.onMessage((msg: any) => {
            if (!mounted) return;
            if (msg.type === 'typing' && msg.userId !== sessionId) {
              setIsTyping(true);
              if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
              typingTimerRef.current = setTimeout(() => {
                if (mounted) setIsTyping(false);
              }, 3000);
            }
          });
        } catch {
          // Graceful degradation — auth may be unavailable
          if (mounted) setViewers([]);
        }
      };

      connect();

      return () => {
        mounted = false;
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        channel?.unsubscribe();
        channelRef.current = null;
      };
    }, [threadId, sessionId]);

    const shareThread = useCallback(async () => {
      const url = `${window.location.origin}${window.location.pathname}?thread=${threadId}`;
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // fallback: show url in prompt
        window.prompt('Copy thread URL:', url);
      }
    }, [threadId]);

    // Don't render if only this user or nobody
    const otherViewers = viewers.filter(v => v.userId !== sessionId);
    const totalViewers = viewers.length;

    return (
      <div className="flex items-center gap-3 px-4 py-2 border-b border-white/5 text-xs text-white/40 bg-black/20">
        {/* Viewer presence */}
        <div className="flex items-center gap-1.5">
          <div className="flex -space-x-1">
            <AnimatePresence>
              {viewers.slice(0, 5).map((v, i) => (
                <motion.div
                  key={v.userId}
                  initial={{ opacity: 0, scale: 0.6, x: -4 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={{ delay: i * 0.04, duration: 0.2 }}
                  className={cn(
                    'w-5 h-5 rounded-full border border-white/10 flex items-center justify-center',
                    'text-[9px] font-bold text-white/60 shrink-0',
                    v.userId === sessionId
                      ? 'bg-gradient-to-br from-white/25 to-white/10'
                      : 'bg-gradient-to-br from-emerald-500/30 to-teal-500/20'
                  )}
                  title={v.metadata?.name || v.userId}
                >
                  {(v.metadata?.name || v.userId).slice(-2).toUpperCase()}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <span className="tabular-nums">
            {totalViewers > 0 ? `${totalViewers} viewing` : 'Only you'}
          </span>
        </div>

        {/* Typing indicator */}
        <AnimatePresence>
          {isTyping && otherViewers.length > 0 && (
            <motion.span
              key="typing"
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -4 }}
              transition={{ duration: 0.2 }}
              className="animate-pulse text-emerald-400/60"
            >
              · someone is contributing...
            </motion.span>
          )}
        </AnimatePresence>

        {/* Share button */}
        <button
          onClick={shareThread}
          className="ml-auto flex items-center gap-1 hover:text-white/70 transition-colors"
          title="Copy thread link"
        >
          <Share2 size={12} />
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.span
                key="copied"
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -3 }}
                className="text-emerald-400/80"
              >
                Copied!
              </motion.span>
            ) : (
              <motion.span
                key="share"
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -3 }}
              >
                Share
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    );
  }
);

CollaborationBar.displayName = 'CollaborationBar';
export { CollaborationBar };
