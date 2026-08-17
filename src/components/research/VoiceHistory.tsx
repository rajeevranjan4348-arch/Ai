import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Trash2, X, Search, Clock, ArrowUpRight, MessageSquareText, Telescope } from 'lucide-react';
import { 
  VoiceHistoryItem, 
  getVoiceHistory, 
  deleteVoiceHistoryItem, 
  clearVoiceHistory 
} from '@/lib/voiceHistory';
import { toast } from 'sonner';

interface VoiceHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTranscription: (text: string) => void;
  onSearchTranscription?: (text: string, mode: 'search' | 'research') => void;
}

export const VoiceHistory: React.FC<VoiceHistoryProps> = ({
  isOpen,
  onClose,
  onSelectTranscription,
  onSearchTranscription,
}) => {
  const [history, setHistory] = useState<VoiceHistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Load history and subscribe to real-time updates
  useEffect(() => {
    setHistory(getVoiceHistory());

    const handleUpdate = (e: any) => {
      if (e.detail) {
        setHistory(e.detail);
      } else {
        setHistory(getVoiceHistory());
      }
    };

    window.addEventListener('voice_history_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('voice_history_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const handleDelete = (id: string) => {
    const updated = deleteVoiceHistoryItem(id);
    setHistory(updated);
    toast.success('Voice transcription deleted');
  };

  const handleClearAll = () => {
    const updated = clearVoiceHistory();
    setHistory(updated);
    toast.success('Voice history cleared');
  };

  const handleItemClick = (text: string) => {
    onSelectTranscription(text);
    toast.success('Populated chat input with voice transcription');
    onClose();
  };

  const filteredHistory = history.filter(item =>
    item.text.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-50 backdrop-blur-xs cursor-pointer"
          />

          {/* Voice History Drawer Panel */}
          <motion.div
            initial={{ x: '100%', opacity: 0.8 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 340, mass: 0.8 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-80 sm:w-96 bg-[#121218]/95 border-l border-white/10 p-5 flex flex-col shadow-2xl backdrop-blur-2xl text-left"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
                  <Mic size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">Voice History</h3>
                  <p className="text-[11px] text-white/40">
                    {history.length} {history.length === 1 ? 'transcription' : 'transcriptions'} saved
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {history.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="p-2 text-white/40 hover:text-red-400 hover:bg-white/5 rounded-xl transition-all cursor-pointer"
                    title="Clear All Voice History"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Search Filter */}
            {history.length > 0 && (
              <div className="relative my-3">
                <Search size={14} className="absolute left-3 top-2.5 text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter voice transcriptions..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-cyan-500/50"
                />
              </div>
            )}

            {/* List of Voice Transcriptions */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 mt-2 custom-scrollbar">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-cyan-400/50 mb-3 border border-white/10">
                    <Mic size={22} />
                  </div>
                  <p className="text-xs font-semibold text-white/80">No Voice Transcriptions</p>
                  <p className="text-[11px] text-white/40 mt-1.5 max-w-[210px] leading-relaxed">
                    Voice queries submitted via dictation or voice mode are saved here so you can re-populate your chat input anytime.
                  </p>
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="text-center py-8 text-xs text-white/40">
                  No matching transcriptions found.
                </div>
              ) : (
                filteredHistory.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04, duration: 0.2 }}
                    onClick={() => handleItemClick(item.text)}
                    className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/40 rounded-2xl p-3.5 transition-all cursor-pointer flex flex-col justify-between gap-2.5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1">
                        {/* Visual indicator identifying voice transcription */}
                        <div className="mt-0.5 w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0 text-cyan-400" title="Voice Transcription">
                          <Mic size={13} />
                        </div>
                        <p className="text-xs font-medium text-white/90 leading-relaxed break-words flex-1">
                          "{item.text}"
                        </p>
                      </div>

                      {/* Delete button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item.id);
                        }}
                        className="opacity-60 sm:opacity-0 group-hover:opacity-100 p-1.5 text-white/40 hover:text-red-400 hover:bg-white/10 rounded-lg transition-all cursor-pointer shrink-0"
                        title="Delete query from history"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-white/40 pt-2 border-t border-white/5 gap-1">
                      <span className="flex items-center gap-1 shrink-0">
                        <Clock size={11} />
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>

                      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                        {onSearchTranscription && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSearchTranscription(item.text, 'search');
                                toast.success('Searching voice query...');
                                onClose();
                              }}
                              className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-[10px] font-medium transition-colors cursor-pointer border border-cyan-500/20"
                              title="Search this voice query"
                            >
                              <Search size={10} />
                              <span>Search</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSearchTranscription(item.text, 'research');
                                toast.success('Researching voice query...');
                                onClose();
                              }}
                              className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-[10px] font-medium transition-colors cursor-pointer border border-indigo-500/20"
                              title="Deep Research this voice query"
                            >
                              <Telescope size={10} />
                              <span>Research</span>
                            </button>
                          </>
                        )}

                        <span className="flex items-center gap-1 text-[11px] font-semibold text-cyan-400 group-hover:text-cyan-300 pl-1">
                          <MessageSquareText size={11} />
                          <span>Use</span>
                          <ArrowUpRight size={10} />
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
