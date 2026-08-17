import React, { useState, useMemo, useEffect } from 'react';
import { Search, Globe, ChevronDown, Check, Loader2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchCitationsPanel } from './SearchCitationsPanel';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface WorkingTimelineProps {
  parts: any[];
  userQuery: string;
  isComplete?: boolean;
  mode?: 'chat' | 'search' | 'research';
  hasContent?: boolean;
}

export const WorkingTimeline: React.FC<WorkingTimelineProps> = React.memo(({
  parts,
  userQuery,
  isComplete = false,
  mode = 'search',
  hasContent = true,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [hasAutoCollapsed, setHasAutoCollapsed] = useState(false);

  useEffect(() => {
    if (isComplete && hasContent && !hasAutoCollapsed) {
      const t = setTimeout(() => {
        setIsOpen(false);
        setHasAutoCollapsed(true);
      }, 2200);
      return () => clearTimeout(t);
    }
  }, [isComplete, hasContent, hasAutoCollapsed]);

  const toolCalls = useMemo(() => parts.filter(p => p.type === 'tool-invocation'), [parts]);

  const searchQueries = useMemo(() =>
    Array.from(new Set(
      toolCalls
        .filter(t => ['webSearch', 'web_search', 'google_search'].includes(t.toolName))
        .map(t => (t.args || t.input || {}).query || (t.args || t.input || {}).prompt)
        .filter(Boolean)
    )), [toolCalls]);

  const sources = useMemo(() =>
    toolCalls
      .filter(t => ['webSearch', 'web_search', 'google_search'].includes(t.toolName) && t.state === 'result')
      .flatMap(t => {
        const out = t.result || t.output;
        if (!out) return [];
        if (Array.isArray(out)) return out;
        if (out.results) return out.results;
        return [];
      })
      .slice(0, 8),
    [toolCalls]);

  if (mode === 'chat' && parts.length === 0) return null;
  if (!userQuery && parts.length === 0) return null;

  const isLive = !isComplete && searchQueries.length > 0;

  const statusLabel = isComplete
    ? (mode === 'research' ? 'Research complete' : 'Search complete')
    : (searchQueries.length > 0 ? 'Searching the web…' : 'Thinking…');

  return (
    <div className="mb-2 w-full">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="group flex items-center gap-2 mb-3 cursor-pointer">
          <div className="flex items-center gap-2">
            {isComplete ? (
              <div className="w-4 h-4 rounded-full bg-emerald-500/15 flex items-center justify-center">
                <Check size={9} className="text-emerald-400" strokeWidth={3} />
              </div>
            ) : (
              <Loader2 size={14} className="animate-spin text-white/40" />
            )}
            <span className={cn(
              "text-[13px] font-medium transition-colors",
              isComplete ? "text-white/60" : "text-white/80"
            )}>
              {statusLabel}
            </span>

            {/* Live indicator */}
            {isLive && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1"
              >
                <Zap size={10} className="text-emerald-400 animate-pulse" />
                <span className="text-[10px] text-emerald-400/70 font-medium tracking-wide">
                  LIVE
                </span>
              </motion.div>
            )}

            {isComplete && (
              <span className="text-[11px] text-white/25">
                · {sources.length > 0 ? `${sources.length} sources` : 'done'}
              </span>
            )}

            {/* Real-time source count while streaming */}
            {!isComplete && sources.length > 0 && (
              <motion.span
                key={sources.length}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[10px] text-white/30"
              >
                · {sources.length} found
              </motion.span>
            )}
          </div>
          <ChevronDown
            size={12}
            className={cn(
              "text-white/25 transition-transform duration-300",
              isOpen ? 'rotate-180' : ''
            )}
          />
        </CollapsibleTrigger>

        <CollapsibleContent>
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative pl-4 border-l border-white/8 space-y-4 ml-2 pb-1"
            >
              {/* Plan step */}
              <motion.div
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="relative"
              >
                <div className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full border border-white/20 bg-black" />
                <p className="text-[12.5px] text-white/40 leading-relaxed">
                  {mode === 'research'
                    ? <>In-depth research on <span className="text-white/65 font-medium">{userQuery}</span></>
                    : <>Searching for <span className="text-white/65 font-medium">{userQuery}</span></>
                  }
                </p>
              </motion.div>

              {/* Search queries */}
              {searchQueries.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="relative"
                >
                  <div className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full border border-white/20 bg-black" />
                  <div className="flex flex-wrap gap-1.5">
                    {searchQueries.map((q, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.06 }}
                        className="flex items-center gap-1 px-2.5 py-1 glass rounded-full text-[11.5px] text-white/50"
                      >
                        <Search size={9} className="text-white/30" />
                        <span className="max-w-[180px] truncate">{q}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Enhanced Sources */}
              {sources.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="relative"
                >
                  <div className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full border border-white/20 bg-black" />

                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <p className="text-[11.5px] text-white/35">
                        {isComplete ? 'Reviewed' : 'Reviewing'}{' '}
                        <motion.span
                          key={sources.length}
                          initial={{ opacity: 0.4, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="tabular-nums font-semibold text-cyan-400"
                        >
                          {sources.length}
                        </motion.span>{' '}
                        source{sources.length !== 1 ? 's' : ''}
                      </p>
                      {!isComplete && (
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60 animate-pulse" />
                          <Globe size={9} className="text-white/20" />
                        </span>
                      )}
                    </div>

                    <SearchCitationsPanel
                      sources={sources.map((s: any, idx: number) => ({ title: s.title || s.name || 'Source', url: s.url || s.link, index: idx + 1 }))}
                      mode="popover"
                      trigger={
                        <button className="text-[10px] font-semibold text-cyan-400/90 hover:text-cyan-200 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 px-2 py-0.5 rounded-full transition-all cursor-pointer flex items-center gap-1">
                          <Globe size={10} />
                          <span>View Citations</span>
                        </button>
                      }
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    {sources.slice(0, 5).map((s: any, i: number) => {
                      let hostname = s.url;
                      try { hostname = new URL(s.url).hostname.replace('www.', ''); } catch {}
                      return (
                        <motion.a
                          key={i}
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          initial={{ opacity: 0, y: 6, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{
                            delay: i * 0.08,
                            duration: 0.25,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                          className="flex items-center gap-2.5 p-2 glass rounded-xl hover:bg-white/5 transition-colors group relative overflow-hidden"
                        >
                          {/* "Reading..." shimmer overlay when streaming */}
                          {!isComplete && (
                            <motion.div
                              className="absolute inset-0 pointer-events-none"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: [0, 0.035, 0] }}
                              transition={{
                                duration: 2.2,
                                repeat: Infinity,
                                delay: i * 0.3,
                                ease: 'easeInOut',
                              }}
                              style={{
                                background:
                                  'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)',
                              }}
                            />
                          )}

                          <div className="w-4 h-4 rounded bg-white/5 flex items-center justify-center overflow-hidden shrink-0">
                            <img
                              src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
                              alt=""
                              className="w-full h-full object-cover opacity-60 group-hover:opacity-90 transition-opacity"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>

                          <span className="text-[11.5px] text-white/50 truncate group-hover:text-white/75 transition-colors">
                            {s.title || hostname}
                          </span>

                          <div className="flex items-center gap-1.5 ml-auto shrink-0">
                            {!isComplete && (
                              <span className="text-[9px] text-emerald-400/40 animate-pulse font-medium">
                                Reading…
                              </span>
                            )}
                            <span className="text-[10px] text-white/25">{hostname}</span>
                          </div>
                        </motion.a>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Active pulse */}
              {!isComplete && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="relative"
                >
                  <div className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full bg-emerald-400/70 animate-pulse" />
                  <span className="text-[12px] text-white/35 animate-pulse">
                    {sources.length > 0
                      ? 'Composing answer…'
                      : searchQueries.length > 0
                      ? 'Browsing results…'
                      : 'Planning…'}
                  </span>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
});

WorkingTimeline.displayName = 'WorkingTimeline';

