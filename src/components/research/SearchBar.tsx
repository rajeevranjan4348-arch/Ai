import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowRight, Globe, Plus, Telescope, Mic, MicOff, FileText, X, History, MessageSquare, Grid, Sparkles, Volume2, Send, Radio, Plug, Check, HardDrive, Video, Image as ImageIcon, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { AttachmentMenu } from '@/components/research/AttachmentMenu';
import { VoiceCallModal } from '@/components/research/VoiceCallModal';
import { VoiceHistory } from '@/components/research/VoiceHistory';
import { SharedMediaStoreModal } from '@/components/research/SharedMediaStoreModal';
import { saveToVoiceHistory } from '@/lib/voiceHistory';
import { useSpeechRecognition, POPULAR_SPEECH_LANGUAGES } from '@/hooks/useSpeechRecognition';
import { SpeechRecognitionErrorBanner } from '@/components/research/SpeechRecognitionErrorBanner';
import { AudioWaveformOverlay } from '@/components/research/AudioWaveformOverlay';
import { usePluginStore } from '@/lib/plugins/PluginStore';
import { PLUGINS, pluginManager, PluginPickerStrip, ActivePluginChip } from '@/lib/plugins/PluginComposerSystem';
import { DeepSearchIcon } from '@/components/ui/DeepSearchIcon';
import { CirclePlusIcon } from '@/components/ui/CirclePlusIcon';
import { getUltraFastReply } from '@/lib/fastReply';

export type SearchModeType = 'chat' | 'search' | 'research';

interface SearchBarProps {
  onSearch: (query: string, mode: SearchModeType) => void;
  isLoading?: boolean;
  compact?: boolean;
  initialMode?: SearchModeType;
  onModeChange?: (mode: SearchModeType) => void;
  onOpenAppLauncher?: () => void;
  onOpenMediaStore?: () => void;
  isCallOpen?: boolean;
  onCallStateChange?: (open: boolean) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearch, 
  isLoading, 
  compact, 
  initialMode, 
  onModeChange,
  onOpenAppLauncher,
  onOpenMediaStore,
  isCallOpen: isCallOpenProp,
  onCallStateChange,
}) => {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<SearchModeType>(initialMode || 'chat');

  useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
    }
  }, [initialMode]);

  const handleModeToggle = (newMode: SearchModeType) => {
    setMode(newMode);
    onModeChange?.(newMode);
  };
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const [internalCallOpen, setInternalCallOpen] = useState(false);

  const isCallModalOpen = isCallOpenProp !== undefined ? isCallOpenProp : internalCallOpen;
  const setIsCallModalOpen = onCallStateChange || setInternalCallOpen;
  const [isMediaStoreOpen, setIsMediaStoreOpen] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [webSearchMode, setWebSearchMode] = useState<'Auto' | 'Always' | 'Off'>('Auto');
  const [isVoiceHistoryOpen, setIsVoiceHistoryOpen] = useState(false);
  const [showPluginsDropdown, setShowPluginsDropdown] = useState(false);
  const [activePluginId, setActivePluginId] = useState<string | null>(null);
  const { plugins, toggle: togglePlugin } = usePluginStore();

  const selectedPlugin = useMemo(() => {
    return activePluginId ? pluginManager.get(activePluginId) : null;
  }, [activePluginId]);

  const liveFastReply = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2 || trimmed.startsWith('[PLUGIN:')) return null;
    const res = getUltraFastReply(trimmed);
    return res.answer ? res : null;
  }, [query]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Trigger search execution from voice input
  const triggerVoiceSearch = useCallback((transcriptToSearch: string) => {
    const cleanText = transcriptToSearch.trim();
    if (!cleanText) return;

    saveToVoiceHistory(cleanText);
    toast.success(`Voice Search: "${cleanText}"`, { id: 'voice-active' });
    onSearch(cleanText, mode);
    setQuery('');
  }, [mode, onSearch]);

  // Integrated browser SpeechRecognition hook
  const {
    isListening,
    interimTranscript,
    autoSubmitOnSilence,
    setAutoSubmitOnSilence,
    currentLanguage,
    setLanguage,
    error: speechError,
    clearError: clearSpeechError,
    startListening,
    stopListening,
    retryListening,
    requestMicrophonePermission,
    fallbackToDefaultLanguage,
    toggleListening: rawToggleListening,
  } = useSpeechRecognition({
    autoSubmitOnSilence: true,
    silenceDuration: 2000,
    onTranscriptChange: (updatedText) => {
      setQuery(updatedText);
    },
    onAutoSubmit: (finalText) => {
      triggerVoiceSearch(finalText);
    },
  });

  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  const toggleListening = useCallback(() => {
    rawToggleListening(query);
  }, [query, rawToggleListening]);

  // Global Alt+V shortcut for hands-free voice dictation
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey && (e.key === 'v' || e.key === 'V')) || (e.code === 'KeyV' && e.altKey)) {
        e.preventDefault();
        toggleListening();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [toggleListening]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!query.trim()) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await fetch(`https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data?.[1])) {
            setSuggestions(data[1].slice(0, 5));
            return;
          }
        }
      } catch {
        setSuggestions([]);
      }
    };
    const t = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(t);
  }, [query]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((query.trim() || attachedFiles.length > 0) && !isLoading) {
      let finalQuery = query.trim();
      if (attachedFiles.length > 0) {
        const fileDescs = attachedFiles.map(f => {
          const typeLabel = f.type.startsWith('image/') ? 'Photo' : f.type.startsWith('video/') ? 'Video' : 'File';
          return `[Shared ${typeLabel}: ${f.name} (${(f.size / 1024).toFixed(1)} KB)]`;
        }).join('\n');
        finalQuery = finalQuery ? `${finalQuery}\n${fileDescs}` : `Analyze shared file(s):\n${fileDescs}`;
      }
      if (activePluginId) {
        finalQuery = `[PLUGIN:${activePluginId}] ${finalQuery}`;
      }
      onSearch(finalQuery, mode);
      setQuery('');
      setAttachedFiles([]);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (e.clipboardData && e.clipboardData.files.length > 0) {
      const files = Array.from(e.clipboardData.files);
      setAttachedFiles(prev => [...prev, ...files]);
      toast.success(`Received ${files.length} shared file(s) from clipboard`);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      setAttachedFiles(prev => [...prev, ...files]);
      toast.success(`Received ${files.length} shared file(s)`);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [query]);

  const canSubmit = (Boolean(query.trim()) || attachedFiles.length > 0) && !isLoading;

  return (
    <div
      ref={containerRef}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={cn(
        "relative w-full transition-all duration-300",
        compact ? "max-w-4xl" : "max-w-3xl mx-auto",
        showSuggestions && suggestions.length > 0 ? "z-50" : "z-auto"
      )}
    >
      <form
        onSubmit={handleSubmit}
        onPaste={handlePaste}
        className={cn(
          "glass-input relative flex flex-col transition-all duration-300",
          compact ? "rounded-[24px] p-3.5" : "rounded-[30px] p-5 shadow-2xl"
        )}
      >
        {/* Subtle top highlight line */}
        <div className="absolute inset-x-0 top-0 h-px rounded-t-[28px] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

        {/* Speech Recognition Error Feedback Banner */}
        <SpeechRecognitionErrorBanner
          error={speechError}
          onDismiss={clearSpeechError}
          onRetry={retryListening}
          onRequestPermission={requestMicrophonePermission}
          onSwitchLanguage={setLanguage}
          currentLanguage={currentLanguage}
        />

        {/* Active Plugin Chip */}
        {selectedPlugin && (
          <ActivePluginChip
            plugin={selectedPlugin}
            onRemove={() => setActivePluginId(null)}
            file={attachedFiles[0] || null}
          />
        )}

        {/* Attached files preview chips */}
        {attachedFiles.length > 0 && (
          <div className="flex items-center gap-2.5 px-3 pt-2.5 pb-1 overflow-x-auto no-scrollbar">
            {attachedFiles.map((file, idx) => {
              const isImage = file.type.startsWith('image/');
              const isVideo = file.type.startsWith('video/');
              const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
              const isDoc = file.name.endsWith('.docx') || file.name.endsWith('.doc') || file.name.endsWith('.txt') || file.name.endsWith('.md');
              const isSheet = file.name.endsWith('.xlsx') || file.name.endsWith('.csv');
              const isCode = file.name.endsWith('.js') || file.name.endsWith('.ts') || file.name.endsWith('.py') || file.name.endsWith('.json') || file.name.endsWith('.html') || file.name.endsWith('.css');
              const isZip = file.name.endsWith('.zip') || file.name.endsWith('.tar') || file.name.endsWith('.gz');

              const typeBadge = isImage ? 'Image' : isVideo ? 'Video' : isPdf ? 'PDF' : isDoc ? 'Doc' : isSheet ? 'Sheet' : isCode ? 'Code' : isZip ? 'Archive' : 'File';
              const previewUrl = isImage ? URL.createObjectURL(file) : null;

              return (
                <div 
                  key={idx} 
                  className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/90 border border-white/15 hover:border-cyan-500/40 rounded-2xl text-xs text-white/90 shrink-0 shadow-lg backdrop-blur-md transition-all group"
                >
                  {/* Thumbnail / Icon preview */}
                  {previewUrl ? (
                    <div className="w-6 h-6 rounded-lg overflow-hidden shrink-0 border border-white/20">
                      <img src={previewUrl} alt={file.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className={cn(
                      "w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border text-[11px] font-bold",
                      isImage ? "bg-purple-500/20 border-purple-500/40 text-purple-300" :
                      isVideo ? "bg-pink-500/20 border-pink-500/40 text-pink-300" :
                      isPdf ? "bg-rose-500/20 border-rose-500/40 text-rose-300" :
                      isSheet ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300" :
                      isCode ? "bg-amber-500/20 border-amber-500/40 text-amber-300" :
                      isZip ? "bg-orange-500/20 border-orange-500/40 text-orange-300" :
                      "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                    )}>
                      {isImage ? '📷' : isVideo ? '🎥' : isPdf ? '📄' : isSheet ? '📊' : isCode ? '💻' : isZip ? '📦' : '📁'}
                    </div>
                  )}

                  {/* Details */}
                  <div className="flex flex-col min-w-0 pr-1">
                    <div className="flex items-center gap-1.5">
                      <span className="max-w-[130px] truncate font-medium text-white">{file.name}</span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-white/10 text-white/70 font-mono">{typeBadge}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-white/50">
                      <span>{(file.size / 1024).toFixed(file.size > 1024 * 1024 ? 1 : 0)} KB</span>
                      <span className="text-emerald-400 font-medium flex items-center gap-0.5">
                        <Check size={10} className="inline" /> Ready
                      </span>
                    </div>
                  </div>

                  {/* Remove action */}
                  <button
                    type="button"
                    onClick={() => setAttachedFiles(prev => prev.filter((_, i) => i !== idx))}
                    className="p-1 rounded-lg hover:bg-white/15 text-white/40 hover:text-white transition-colors cursor-pointer"
                    title={`Remove ${file.name}`}
                  >
                    <X size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Real-time Dynamic Audio Waveform Overlay during Speech Input */}
        <AudioWaveformOverlay
          isListening={isListening}
          transcript={query}
          interimTranscript={interimTranscript}
          language={currentLanguage}
        />

        {/* Active Speech Recognition Voice Visualizer Banner */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -6 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -6 }}
              className="px-3 pt-2 pb-3 mb-2 rounded-2xl bg-gradient-to-r from-red-500/15 via-rose-500/10 to-cyan-500/15 border border-red-500/30 backdrop-blur-md relative overflow-hidden"
            >
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                {/* Left: Waveform animation + status */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative flex items-center justify-center shrink-0">
                    <span className="w-8 h-8 rounded-full bg-red-500/20 animate-ping absolute" />
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-500 to-rose-600 flex items-center justify-center text-white shadow-md shadow-red-500/40 relative z-10">
                      <Mic size={16} className="animate-pulse" />
                    </div>
                  </div>

                  {/* Audio Equalizer Bars */}
                  <div className="flex items-center gap-1 h-5 px-1 shrink-0">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <motion.span
                        key={i}
                        animate={{ height: [6, 18, 8, 20, 10, 6] }}
                        transition={{
                          repeat: Infinity,
                          duration: 0.8,
                          delay: i * 0.15,
                          ease: 'easeInOut',
                        }}
                        className="w-1 rounded-full bg-gradient-to-t from-red-500 to-cyan-400"
                      />
                    ))}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-white tracking-wide">Speech Recognition Active</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                        LIVE MIC
                      </span>
                      {/* Language badge with switcher */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsLangMenuOpen(p => !p)}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-white/90 border border-white/15 transition-all flex items-center gap-1 cursor-pointer"
                          title="Change dictation language"
                        >
                          <span>{POPULAR_SPEECH_LANGUAGES.find(l => l.code === currentLanguage)?.flag || '🌐'}</span>
                          <span>{POPULAR_SPEECH_LANGUAGES.find(l => l.code === currentLanguage)?.nativeName || currentLanguage}</span>
                        </button>

                        {isLangMenuOpen && (
                          <div className="absolute left-0 top-full mt-1.5 w-48 max-h-44 overflow-y-auto rounded-xl bg-zinc-900 border border-white/20 shadow-2xl p-1 z-30">
                            {POPULAR_SPEECH_LANGUAGES.map((l) => (
                              <button
                                key={l.code}
                                type="button"
                                onClick={() => {
                                  setLanguage(l.code);
                                  setIsLangMenuOpen(false);
                                }}
                                className={cn(
                                  "w-full text-left px-2 py-1 rounded-lg text-[11px] flex items-center justify-between transition-colors cursor-pointer",
                                  currentLanguage === l.code
                                    ? "bg-cyan-500/20 text-cyan-300 font-semibold"
                                    : "text-white/80 hover:bg-white/10"
                                )}
                              >
                                <span>{l.flag} {l.nativeName}</span>
                                <span className="text-[9px] text-white/40">{l.code}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-[11px] text-white/70 truncate">
                      {interimTranscript ? `"${interimTranscript}"` : 'Listening to your voice... Speak your query clearly'}
                    </p>
                  </div>
                </div>

                {/* Right: Auto-search toggle & quick trigger buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setAutoSubmitOnSilence(!autoSubmitOnSilence)}
                    className={cn(
                      "px-2.5 py-1 rounded-xl text-[11px] font-medium border transition-all cursor-pointer flex items-center gap-1",
                      autoSubmitOnSilence
                        ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                        : "bg-white/5 border-white/10 text-white/50"
                    )}
                    title="Automatically submit search when speech pauses for 2s"
                  >
                    <Radio size={12} className={autoSubmitOnSilence ? 'text-cyan-400 animate-pulse' : ''} />
                    <span>Auto-Search: {autoSubmitOnSilence ? 'ON' : 'OFF'}</span>
                  </button>

                  {query.trim() && (
                    <button
                      type="button"
                      onClick={() => triggerVoiceSearch(query)}
                      className="px-3 py-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-xs shadow-md shadow-cyan-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 border border-cyan-400/30"
                    >
                      <Send size={12} />
                      <span>Search Now</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => stopListening()}
                    className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
                    title="Stop Voice Recording"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <textarea
          ref={textareaRef}
          rows={1}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder={selectedPlugin?.placeholder || "Ask anything... (or press Alt+V to speak)"}
          className={cn(
            "w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 resize-none px-3.5 text-[16px] leading-relaxed placeholder:text-white/30 text-white/90",
            compact ? "min-h-[28px]" : "min-h-[52px] max-h-[220px]"
          )}
          style={{
            height: 'auto',
            overflowY: query.split('\n').length > 8 ? 'auto' : 'hidden',
          }}
        />

        <div className="flex items-center justify-between mt-3 px-1">
          {/* Left side: Active listening indicator or error chip */}
          <div className="flex items-center gap-2">
            {isListening && (
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                Listening ({POPULAR_SPEECH_LANGUAGES.find(l => l.code === currentLanguage)?.nativeName || currentLanguage})...
              </span>
            )}
            {!isListening && speechError && (
              <button
                type="button"
                onClick={() => retryListening()}
                className="flex items-center gap-1.5 text-[11px] font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                title={`${speechError.title}: Click to retry speech recognition`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>{speechError.title}</span>
                <span className="text-[10px] text-amber-400/70 underline ml-0.5">Resolve</span>
              </button>
            )}
          </div>

          {/* Right side tools */}
          <div className="flex items-center gap-1">
            {/* Plus Icon for Attachments, Plugins, Skills Menu matching uploaded image */}
            <button
              type="button"
              onClick={() => setIsAttachmentMenuOpen(true)}
              className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all cursor-pointer flex items-center justify-center relative group"
              title="Add attachments, create image/video, plugins"
              aria-label="Add attachments and plugins"
            >
              <CirclePlusIcon size={20} className="text-white/80 group-hover:text-white transition-transform duration-200 group-hover:scale-105" />
              {attachedFiles.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-500 text-black font-bold text-[9px] rounded-full flex items-center justify-center">
                  {attachedFiles.length}
                </span>
              )}
            </button>

            {/* Microphone Dictation Button (SpeechRecognition API) */}
            <button
              type="button"
              onClick={toggleListening}
              className={cn(
                "p-2 rounded-full transition-all cursor-pointer select-none relative flex items-center justify-center",
                isListening
                  ? "bg-red-500/25 text-red-400 border border-red-500/50 shadow-lg shadow-red-500/30 scale-105"
                  : speechError
                  ? "text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 border border-amber-500/30"
                  : "text-white/40 hover:text-white hover:bg-white/10"
              )}
              title={
                isListening
                  ? "Listening... Click to stop microphone"
                  : speechError
                  ? `${speechError.title}: Click to retry dictation`
                  : `Dictate query with SpeechRecognition (Alt+V) - [${currentLanguage}]`
              }
              aria-label="Dictate Query"
            >
              {isListening ? (
                <>
                  <span className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
                  <Mic size={17} className="text-red-400 animate-pulse relative z-10" />
                </>
              ) : speechError ? (
                <>
                  <MicOff size={17} className="text-amber-400" />
                  <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-amber-400 rounded-full" />
                </>
              ) : (
                <Mic size={17} strokeWidth={1.8} />
              )}
            </button>

            {/* Voice History Sidebar Trigger */}
            <button
              type="button"
              onClick={() => setIsVoiceHistoryOpen(true)}
              className="p-2 text-white/30 hover:text-cyan-400 hover:bg-white/5 rounded-full transition-all cursor-pointer flex items-center justify-center"
              title="Voice History"
            >
              <History size={17} strokeWidth={1.8} />
            </button>

            <button
              type="submit"
              disabled={!canSubmit}
              className={cn(
                "p-2 ml-1 rounded-full transition-all duration-200 flex items-center justify-center cursor-pointer",
                canSubmit
                  ? "bg-white/90 hover:bg-white text-black hover:scale-105 shadow-lg shadow-white/10"
                  : "bg-white/8 text-white/25"
              )}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <ArrowRight size={17} strokeWidth={2.5} />
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Live Ultra-Fast Reply Instant Answer Card */}
      <AnimatePresence>
        {liveFastReply && liveFastReply.answer && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="mt-2.5 p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 backdrop-blur-md flex items-start gap-3 shadow-lg shadow-cyan-950/20"
          >
            <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 shrink-0 mt-0.5">
              <Zap size={14} className="text-cyan-400 fill-cyan-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-semibold text-cyan-300 uppercase tracking-wider">Ultra-Fast Instant Answer</span>
                <span className="text-[10px] text-cyan-400/70 font-mono">
                  ({liveFastReply.responseTimeMs && liveFastReply.responseTimeMs > 0 ? `${liveFastReply.responseTimeMs}ms` : '<5ms'})
                </span>
                <span className="text-[10px] text-white/40 capitalize">
                  • {liveFastReply.source === 'instant_cache' ? 'Instant Cache' : liveFastReply.source === 'instant_engine' ? 'Instant Engine' : 'Fast Turbo'}
                </span>
              </div>
              <p className="text-xs text-white/90 line-clamp-2 leading-relaxed font-sans">
                {liveFastReply.answer.replace(/\[\[ULTRA_FAST_REPLY:[^\]]+\]\]/g, '').replace(/[#*`$]/g, '').slice(0, 150)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleSubmit()}
              className="px-2.5 py-1 text-[11px] rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-500/30 transition-all shrink-0 cursor-pointer font-medium hover:scale-105 active:scale-95"
            >
              Ask Full ↵
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attachment Feature Menu Modal */}
      <AttachmentMenu
        isOpen={isAttachmentMenuOpen}
        onClose={() => setIsAttachmentMenuOpen(false)}
        onSelectFiles={(files) => {
          const newFiles = Array.from(files);
          setAttachedFiles(prev => [...prev, ...newFiles]);
        }}
        onSelectPhrase={(phrase) => {
          setQuery(prev => prev ? `${prev} ${phrase}` : phrase);
        }}
        webSearchMode={webSearchMode}
        onToggleWebSearch={setWebSearchMode}
        onStartCall={() => setIsCallModalOpen(true)}
        onOpenAppLauncher={onOpenAppLauncher}
        onSelectPlugin={(id) => {
          if (id === 'image' || id === 'image-creation') {
            setActivePluginId('image-creation');
            if (!query.trim()) {
              setQuery('Generate an ultra-realistic image of ');
            }
            if (textareaRef.current) {
              textareaRef.current.focus();
            }
          } else if (id === 'video' || id === 'video-creation') {
            setActivePluginId('video-creation');
            if (!query.trim()) {
              setQuery('Generate a cinematic 4K video of ');
            }
            if (textareaRef.current) {
              textareaRef.current.focus();
            }
          } else {
            setActivePluginId(id);
          }
        }}
        onOpenMediaStore={() => setIsMediaStoreOpen(true)}
      />

      {/* Shared AI Media & File Store Modal */}
      <SharedMediaStoreModal
        isOpen={isMediaStoreOpen}
        onClose={() => setIsMediaStoreOpen(false)}
        onShareToAI={(item) => {
          setQuery(prev => prev ? `${prev}\n[Referencing Stored Media: ${item.name}]` : `Analyze this stored item: ${item.name}`);
        }}
      />

      {/* Interactive Voice Call Screen */}
      <VoiceCallModal
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
        aiName="K3 AI"
        onSendMessage={(msg) => onSearch(msg, mode)}
      />

      {/* Voice History Sidebar */}
      <VoiceHistory
        isOpen={isVoiceHistoryOpen}
        onClose={() => setIsVoiceHistoryOpen(false)}
        onSelectTranscription={(text) => {
          setQuery(text);
          if (textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
          }
        }}
        onSearchTranscription={(text, searchMode) => {
          onSearch(text, searchMode);
          setIsVoiceHistoryOpen(false);
        }}
      />

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 glass rounded-2xl overflow-hidden z-50 shadow-2xl animate-fade-in-up">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              className="w-full text-left px-4 py-3 hover:bg-white/5 flex items-center gap-3 transition-colors group border-b border-white/5 last:border-0"
              onClick={() => {
                setQuery(suggestion);
                onSearch(suggestion, mode);
                setShowSuggestions(false);
              }}
            >
              <Search size={14} className="text-white/30 group-hover:text-white/60 transition-colors mt-0.5 shrink-0" />
              <span className="text-sm text-white/70 group-hover:text-white/90 transition-colors">{suggestion}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
