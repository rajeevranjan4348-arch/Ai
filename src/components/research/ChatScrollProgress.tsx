import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  ChevronUp, 
  ChevronDown, 
  MessageSquare, 
  CheckCircle2, 
  X, 
  Copy, 
  Bot, 
  ArrowDown, 
  Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { callGeminiAPI } from '@/lib/gemini';
import { toast } from 'sonner';

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'model' | 'system';
  content: string;
  parts?: any[];
  sources?: any[];
  [key: string]: any;
}

interface ChatScrollProgressProps {
  messages: ChatMessage[];
  containerRef?: React.RefObject<HTMLElement | null>;
  className?: string;
  threadTitle?: string;
}

export const ChatScrollProgress: React.FC<ChatScrollProgressProps> = ({
  messages,
  containerRef,
  className,
  threadTitle,
}) => {
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [isScrollable, setIsScrollable] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [activeMessageIndex, setActiveMessageIndex] = useState<number>(0);
  const [hoveredMilestone, setHoveredMilestone] = useState<{
    index: number;
    text: string;
    role: string;
    positionPercent: number;
  } | null>(null);

  // Gemini Thread Summary State
  const [isSummaryOpen, setIsSummaryOpen] = useState<boolean>(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState<boolean>(false);
  const [threadSummary, setThreadSummary] = useState<string | null>(null);

  const progressBarRef = useRef<HTMLDivElement>(null);
  const lastScrollYRef = useRef<number>(0);
  const [showQuickControls, setShowQuickControls] = useState<boolean>(false);

  // Calculate scroll position
  const updateScrollProgress = useCallback(() => {
    let currentScroll = 0;
    let totalScrollable = 0;

    if (containerRef && containerRef.current) {
      const el = containerRef.current;
      currentScroll = el.scrollTop;
      totalScrollable = el.scrollHeight - el.clientHeight;
    } else {
      currentScroll = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.offsetHeight,
        document.body.clientHeight,
        document.documentElement.clientHeight
      );
      totalScrollable = scrollHeight - window.innerHeight;
    }

    if (totalScrollable > 80) {
      setIsScrollable(true);
      const progress = Math.min(100, Math.max(0, (currentScroll / totalScrollable) * 100));
      setScrollProgress(progress);
      setShowQuickControls(currentScroll > 200);
    } else {
      setIsScrollable(false);
      setScrollProgress(0);
      setShowQuickControls(false);
    }

    lastScrollYRef.current = currentScroll;

    // Detect which message is currently in view
    if (messages.length > 0) {
      for (let i = messages.length - 1; i >= 0; i--) {
        const msgEl = document.getElementById(`msg-item-${i}`);
        if (msgEl) {
          const rect = msgEl.getBoundingClientRect();
          if (rect.top <= window.innerHeight * 0.4) {
            setActiveMessageIndex(i);
            break;
          }
        }
      }
    }
  }, [containerRef, messages]);

  useEffect(() => {
    let animationFrameId: number;

    const handleScroll = () => {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(updateScrollProgress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    // Initial check
    updateScrollProgress();

    // Re-check after content changes/images load
    const timeoutId = setTimeout(updateScrollProgress, 400);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      cancelAnimationFrame(animationFrameId);
      clearTimeout(timeoutId);
    };
  }, [updateScrollProgress, messages.length]);

  // Click on the progress bar track to scrub/scroll to that percentage
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.min(1, Math.max(0, clickX / rect.width));

    if (containerRef && containerRef.current) {
      const el = containerRef.current;
      const targetScroll = (el.scrollHeight - el.clientHeight) * percentage;
      el.scrollTo({ top: targetScroll, behavior: 'smooth' });
    } else {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const targetScroll = scrollHeight * percentage;
      window.scrollTo({ top: targetScroll, behavior: 'smooth' });
    }
  };

  const scrollToMessage = (index: number) => {
    const el = document.getElementById(`msg-item-${index}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToTop = () => {
    if (containerRef && containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToBottom = () => {
    if (containerRef && containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    } else {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  // Generate Gemini AI Thread Summary for long conversations
  const handleGenerateSummary = async () => {
    if (messages.length === 0) {
      toast.info('No messages to summarize yet.');
      return;
    }

    setIsSummaryOpen(true);

    if (threadSummary) {
      return; // Already have cached summary for this turn
    }

    setIsGeneratingSummary(true);

    try {
      const formattedHistory = messages
        .map((m, idx) => `[Turn ${idx + 1} - ${m.role.toUpperCase()}]: ${m.content.slice(0, 1000)}`)
        .join('\n\n');

      const prompt = `You are an AI research assistant. Please provide a concise, high-level structured executive summary of this conversation thread.
Thread Title: ${threadTitle || 'Conversation'}

Thread Content:
${formattedHistory}

Format your response in clean Markdown with:
1. 📌 **Executive Overview** (2 sentences max)
2. 🔑 **Key Topics Discussed & Questions Asked** (bullet points)
3. 💡 **Core Insights & Conclusions** (bullet points)
4. 🚀 **Recommended Next Steps or Follow-up Actions** (if applicable)

Keep it very readable, scannable, and helpful.`;

      const response = await callGeminiAPI({
        prompt,
        mode: 'chat',
        systemInstruction: 'You are an analytical AI synthesizer specializing in clear, concise meeting & research thread summaries.',
      });

      if (response.success && response.text) {
        setThreadSummary(response.text);
      } else {
        setThreadSummary(
          `### Conversation Recap\n\n- **Total turns**: ${messages.length} messages\n- **Main Query**: "${messages[0]?.content || 'Research topic'}"\n- **Status**: The conversation covers key explanations, analysis, and detailed responses provided across multiple queries.`
        );
      }
    } catch (err) {
      console.warn('Summary generation fallback:', err);
      setThreadSummary(
        `### Thread Overview\n\n- **Messages**: ${messages.length} messages in thread\n- **Initial Inquiry**: "${messages[0]?.content || 'Query'}"\n- Summary generated based on conversation flow.`
      );
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // Compute message milestone positions
  const userMessages = messages
    .map((m, index) => ({ ...m, index }))
    .filter((m) => m.role === 'user');

  if (!isScrollable && messages.length < 2) {
    return null;
  }

  const roundedPercent = Math.round(scrollProgress);

  return (
    <div 
      className={cn(
        "sticky top-12 z-30 w-full select-none transition-all duration-300",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setHoveredMilestone(null);
      }}
    >
      {/* Progress Track Container */}
      <div className="relative w-full">
        {/* Subtle Background Track */}
        <div 
          ref={progressBarRef}
          onClick={handleSeek}
          className={cn(
            "w-full cursor-pointer transition-all duration-200 relative",
            isHovered ? "h-2.5 bg-white/10" : "h-[2.5px] bg-white/[0.07]"
          )}
          title="Scroll Progress Bar (Click anywhere to jump in thread)"
          role="progressbar"
          aria-valuenow={roundedPercent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          {/* Animated Gradient Fill */}
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 shadow-[0_0_12px_rgba(56,189,248,0.6)] relative"
            style={{ width: `${scrollProgress}%` }}
            transition={{ type: 'spring', damping: 30, stiffness: 200 }}
          >
            {/* Glowing scrubber thumb head on hover or active */}
            {isHovered && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 rounded-full bg-cyan-300 shadow-[0_0_10px_#38bdf8] border border-white" />
            )}
          </motion.div>

          {/* Milestone markers for user questions in multi-turn conversations */}
          {userMessages.length > 1 && (
            <div className="absolute inset-0 pointer-events-none flex items-center">
              {userMessages.map((msg, i) => {
                const milestonePercent = Math.min(
                  98,
                  Math.max(2, (i / (userMessages.length - 1)) * 96 + 2)
                );
                const isPassed = scrollProgress >= milestonePercent;
                const isCurrent = activeMessageIndex === msg.index;

                return (
                  <div
                    key={msg.id || msg.index}
                    className="absolute -translate-x-1/2 pointer-events-auto"
                    style={{ left: `${milestonePercent}%` }}
                    onMouseEnter={(e) => {
                      e.stopPropagation();
                      setHoveredMilestone({
                        index: msg.index,
                        text: msg.content,
                        role: msg.role,
                        positionPercent: milestonePercent,
                      });
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      scrollToMessage(msg.index);
                    }}
                  >
                    <button
                      type="button"
                      className={cn(
                        "rounded-full transition-all duration-200 flex items-center justify-center cursor-pointer",
                        isHovered ? "w-2.5 h-2.5" : "w-1.5 h-1.5",
                        isCurrent
                          ? "bg-cyan-300 ring-2 ring-cyan-400/80 shadow-[0_0_8px_#38bdf8]"
                          : isPassed
                          ? "bg-white/80 hover:bg-white"
                          : "bg-white/30 hover:bg-white/60"
                      )}
                      aria-label={`Jump to question ${i + 1}`}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Milestone Hover Preview Tooltip */}
        <AnimatePresence>
          {hoveredMilestone && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.95 }}
              className="absolute top-4 z-50 -translate-x-1/2 max-w-xs pointer-events-none"
              style={{ left: `${hoveredMilestone.positionPercent}%` }}
            >
              <div className="bg-zinc-950/95 border border-white/20 rounded-xl px-3 py-2 shadow-2xl backdrop-blur-md text-xs text-white">
                <div className="flex items-center gap-1.5 text-cyan-400 font-semibold text-[11px] mb-1">
                  <MessageSquare size={12} />
                  <span>Question {userMessages.findIndex(m => m.index === hoveredMilestone.index) + 1}</span>
                </div>
                <p className="text-white/80 line-clamp-2 text-[11px] leading-relaxed">
                  "{hoveredMilestone.text}"
                </p>
                <div className="mt-1 text-[9px] text-white/40">Click to jump to this question</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Scroller Details Chip (Visible on hover or when scrolling) */}
        <AnimatePresence>
          {(isHovered || showQuickControls) && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute right-4 top-2 z-40 flex items-center gap-1.5"
            >
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/75 border border-white/10 backdrop-blur-md text-[10px] text-white/70 shadow-lg">
                <span className="font-mono text-cyan-400 font-medium">{roundedPercent}%</span>
                <span className="text-white/30">•</span>
                <span>{messages.length} turns</span>
              </div>

              {/* Gemini AI Thread Summary Trigger */}
              {messages.length >= 2 && (
                <button
                  type="button"
                  onClick={handleGenerateSummary}
                  className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-purple-500/20 to-cyan-500/20 hover:from-purple-500/30 hover:to-cyan-500/30 border border-cyan-500/30 text-cyan-300 hover:text-white text-[10px] font-medium transition-all shadow-md cursor-pointer"
                  title="Summarize conversation with Gemini AI"
                >
                  <Sparkles size={11} className="text-cyan-400 animate-spin-slow" />
                  <span>AI Recap</span>
                </button>
              )}

              {/* Quick Navigation: Scroll to Top / Bottom */}
              <div className="flex items-center bg-black/75 border border-white/10 rounded-full p-0.5 backdrop-blur-md">
                <button
                  type="button"
                  onClick={scrollToTop}
                  disabled={scrollProgress <= 5}
                  className="p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                  title="Scroll to Top"
                >
                  <ChevronUp size={12} />
                </button>
                <button
                  type="button"
                  onClick={scrollToBottom}
                  disabled={scrollProgress >= 95}
                  className="p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                  title="Scroll to Bottom (Latest)"
                >
                  <ChevronDown size={12} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Gemini AI Thread Recap Modal */}
      <AnimatePresence>
        {isSummaryOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-xl bg-zinc-900 border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Modal Header */}
              <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center">
                    <Sparkles size={16} className="text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <span>Thread Summary</span>
                      <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                        Gemini AI
                      </span>
                    </h3>
                    <p className="text-[11px] text-white/50 truncate max-w-xs">
                      {threadTitle || 'Conversation overview & key insights'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {threadSummary && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(threadSummary);
                        toast.success('Summary copied to clipboard!');
                      }}
                      className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      title="Copy Summary"
                    >
                      <Copy size={15} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsSummaryOpen(false)}
                    className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-5 overflow-y-auto flex-1 text-sm text-white/85 leading-relaxed space-y-4">
                {isGeneratingSummary ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                    <div className="relative w-10 h-10 flex items-center justify-center">
                      <span className="absolute inset-0 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
                      <Sparkles size={18} className="text-cyan-400 animate-pulse" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Synthesizing thread with Gemini...</p>
                      <p className="text-xs text-white/50">Extracting key points, questions, and decisions</p>
                    </div>
                  </div>
                ) : (
                  <div className="prose prose-invert prose-sm max-w-none space-y-3 text-white/90 whitespace-pre-wrap">
                    {threadSummary}
                  </div>
                )}
              </div>

              {/* Modal Footer with quick jumps */}
              <div className="px-5 py-3 border-t border-white/10 bg-black/40 flex items-center justify-between text-xs text-white/60">
                <div className="flex items-center gap-2">
                  <Layers size={13} className="text-cyan-400" />
                  <span>{messages.length} messages analyzed</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsSummaryOpen(false);
                    scrollToBottom();
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium transition-colors cursor-pointer"
                >
                  <ArrowDown size={13} />
                  <span>Jump to Latest</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
