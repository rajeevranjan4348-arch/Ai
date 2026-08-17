import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Search, 
  Clock, 
  Trash2, 
  MessageSquare, 
  Plus, 
  SquarePen,
  Pin, 
  Star, 
  Archive, 
  Edit2, 
  Copy, 
  MoreVertical, 
  Check, 
  Share2,
  Sparkles,
  Image as ImageIcon,
  Video,
  Library,
  Grid,
  Folder,
  Plug,
  Settings,
  Film,
} from 'lucide-react';
import {
  format,
  formatDistanceToNow,
  isToday,
  isYesterday,
  differenceInDays,
} from 'date-fns';
import { cn } from '@/lib/utils';
import { Thread } from '@/hooks/useThreads';
import { toast } from 'sonner';
import { ProfileAvatarButton } from './ProfileAvatarButton';

interface HistoryPanelProps {
  threads: Thread[];
  isOpen: boolean;
  onClose: () => void;
  onSelectThread: (id: string) => void;
  onDeleteThread: (id: string) => void;
  onRenameThread?: (id: string, newTitle: string) => void;
  onPinThread?: (id: string) => void;
  onFavoriteThread?: (id: string) => void;
  onArchiveThread?: (id: string) => void;
  onDuplicateThread?: (id: string) => void;
  currentThreadId?: string;
  onNewThread?: () => void;
  onOpenAppLauncher?: () => void;
  onSelectFeature?: (feature: string) => void;
  onOpenSettings?: () => void;
}

type DateGroup = 'Pinned' | 'Today' | 'Yesterday' | 'Last 7 Days' | 'Last 30 Days' | 'Older';
type FilterTab = 'all' | 'pinned' | 'favorites' | 'archived';

function getDateGroup(thread: Thread): DateGroup {
  if (thread.isPinned) return 'Pinned';
  const dateStr = thread.updatedAt || thread.updated_at || thread.createdAt || thread.created_at || new Date().toISOString();
  const date = new Date(dateStr);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  const days = differenceInDays(new Date(), date);
  if (days <= 7) return 'Last 7 Days';
  if (days <= 30) return 'Last 30 Days';
  return 'Older';
}

function getRelativeTime(dateInput: string | number | Date): string {
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '';
    if (isToday(date)) {
      return formatDistanceToNow(date, { addSuffix: true });
    }
    if (isYesterday(date)) {
      return `Yesterday ${format(date, 'h:mm a')}`;
    }
    if (differenceInDays(new Date(), date) <= 7) {
      return format(date, 'EEEE h:mm a');
    }
    return format(date, 'MMM d, yyyy');
  } catch {
    return '';
  }
}

const GROUP_ORDER: DateGroup[] = ['Pinned', 'Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'Older'];

interface HighlightTextProps {
  text: string;
  query: string;
  className?: string;
}

const HighlightText: React.FC<HighlightTextProps> = ({ text, query, className }) => {
  if (!query.trim() || !text) {
    return <span className={className}>{text || ''}</span>;
  }

  const words = query.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return <span className={className}>{text}</span>;
  }

  const escapedWords = words.map(w => w.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'));
  const regex = new RegExp(`(${escapedWords.join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        const isMatch = words.some(w => w.toLowerCase() === part.toLowerCase());
        if (isMatch) {
          return (
            <mark
              key={i}
              className="bg-cyan-500/25 text-cyan-200 font-semibold rounded-[3px] px-0.5 py-0 border-b border-cyan-400/60 shadow-[0_0_8px_rgba(6,182,212,0.2)]"
            >
              {part}
            </mark>
          );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </span>
  );
};

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  threads,
  isOpen,
  onClose,
  onSelectThread,
  onDeleteThread,
  onRenameThread,
  onPinThread,
  onFavoriteThread,
  onArchiveThread,
  onDuplicateThread,
  currentThreadId,
  onNewThread,
  onOpenAppLauncher,
  onSelectFeature,
  onOpenSettings,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  // Filter threads by tab and search query
  const filtered = useMemo(() => {
    let list = threads;

    // Filter by tab
    if (activeTab === 'pinned') {
      list = list.filter(t => t.isPinned && !t.isArchived);
    } else if (activeTab === 'favorites') {
      list = list.filter(t => t.isFavorite && !t.isArchived);
    } else if (activeTab === 'archived') {
      list = list.filter(t => t.isArchived);
    } else {
      // 'all' shows non-archived
      list = list.filter(t => !t.isArchived);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const words = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
      list = list.filter(t => {
        const titleText = (t.title || '').toLowerCase();
        const previewText = (t.preview || '').toLowerCase();
        const modelText = (t.model || '').toLowerCase();
        const fullText = `${titleText} ${previewText} ${modelText}`;
        return words.every(w => fullText.includes(w));
      });
    }

    return list;
  }, [threads, activeTab, searchQuery]);

  // Group threads
  const grouped = useMemo(() => {
    const groups: Partial<Record<DateGroup, Thread[]>> = {};
    filtered.forEach(thread => {
      const group = getDateGroup(thread);
      if (!groups[group]) groups[group] = [];
      groups[group]!.push(thread);
    });
    return groups;
  }, [filtered]);

  const handleStartRename = (thread: Thread) => {
    setEditingId(thread.id);
    setEditTitle(thread.title || '');
    setMenuOpenId(null);
  };

  const handleSaveRename = (threadId: string) => {
    if (editTitle.trim() && onRenameThread) {
      onRenameThread(threadId, editTitle.trim());
      toast.success('Conversation renamed');
    }
    setEditingId(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="history-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="history-panel"
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280, mass: 0.8 }}
            className="fixed left-0 top-0 bottom-0 w-80 bg-black/75 backdrop-blur-2xl border-r border-white/10 z-50 flex flex-col shadow-2xl transform-gpu will-change-transform"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
              <h2 className="text-2xl font-bold tracking-tight text-white">Rishi</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSearchQuery(prev => prev ? '' : ' ')}
                  className="w-10 h-10 rounded-full bg-[#1c1c1e] hover:bg-[#2c2c2e] text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="Search chats"
                >
                  <Search size={18} />
                </button>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-full hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Close history"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Quick Feature Navigation List */}
            <div className="px-4 py-2 shrink-0 space-y-1">
              <button
                onClick={() => {
                  if (onNewThread) onNewThread();
                  if (onSelectFeature) onSelectFeature('chat');
                  onClose();
                }}
                className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-white hover:bg-white/10 text-lg font-medium transition-colors cursor-pointer group"
              >
                <SquarePen size={22} className="shrink-0 text-white group-hover:scale-105 transition-transform" />
                <span>New chat</span>
              </button>

              <button
                onClick={() => {
                  if (onSelectFeature) onSelectFeature('library');
                  onClose();
                }}
                className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-white hover:bg-white/10 text-lg font-medium transition-colors cursor-pointer group"
              >
                <Library size={22} className="shrink-0 text-white group-hover:scale-105 transition-transform" />
                <span>Library</span>
              </button>

              <button
                onClick={() => {
                  if (onSelectFeature) onSelectFeature('projects');
                  onClose();
                }}
                className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-white hover:bg-white/10 text-lg font-medium transition-colors cursor-pointer group"
              >
                <Folder size={22} className="shrink-0 text-white group-hover:scale-105 transition-transform" />
                <span>Projects</span>
              </button>

              <button
                onClick={() => {
                  if (onOpenAppLauncher) onOpenAppLauncher();
                  onClose();
                }}
                className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-white hover:bg-white/10 text-lg font-medium transition-colors cursor-pointer group"
              >
                <Plug size={22} className="shrink-0 text-white group-hover:scale-105 transition-transform" />
                <span>Plugins</span>
              </button>

              <button
                onClick={() => {
                  if (onOpenSettings) onOpenSettings();
                  onClose();
                }}
                className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-white hover:bg-white/10 text-lg font-medium transition-colors cursor-pointer group"
              >
                <Settings size={22} className="shrink-0 text-white group-hover:scale-105 transition-transform" />
                <div className="flex flex-col items-start min-w-0 text-left">
                  <span className="text-base font-semibold leading-tight">Settings</span>
                  <span className="text-[11px] text-white/50 font-normal leading-tight truncate">Models, Wallpapers & Theme</span>
                </div>
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 px-3.5 pt-2 shrink-0 overflow-x-auto no-scrollbar">
              {[
                { id: 'all', label: 'All' },
                { id: 'pinned', label: 'Pinned' },
                { id: 'favorites', label: 'Starred' },
                { id: 'archived', label: 'Archived' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as FilterTab)}
                  className={cn(
                    "px-2.5 py-1 rounded-xl text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap",
                    activeTab === tab.id
                      ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                      : "text-white/40 hover:text-white/70 hover:bg-white/5"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="px-3.5 py-2.5 shrink-0">
              <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl border border-white/8 focus-within:border-cyan-500/40 transition-colors">
                <Search size={13} className="text-white/30 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search title, content, or model…"
                  className="flex-1 bg-transparent text-xs text-white/80 placeholder:text-white/25 outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-white/30 hover:text-white/70 transition-colors"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Thread list */}
            <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1 min-h-0 custom-scrollbar">
              {filtered.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center"
                >
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                    <MessageSquare size={18} className="text-white/20" />
                  </div>
                  <p className="text-xs text-white/30 leading-relaxed">
                    {searchQuery
                      ? `No chats found matching "${searchQuery}"`
                      : activeTab !== 'all'
                      ? `No ${activeTab} chats available`
                      : 'No chat history yet. Start a conversation!'}
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-2">
                  {GROUP_ORDER.map(group => {
                    const items = grouped[group];
                    if (!items?.length) return null;
                    return (
                      <div key={group} className="space-y-1">
                        {/* Group label */}
                        <div className="px-3 pt-2 pb-1 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider">
                            {group}
                          </span>
                          <span className="text-[10px] text-white/20">
                            {items.length}
                          </span>
                        </div>

                        {/* Thread items */}
                        {items.map((thread, i) => {
                          const isActive = thread.id === currentThreadId;
                          const isHovered = hoveredId === thread.id;
                          const relTime = getRelativeTime(
                            thread.updatedAt || thread.updated_at || thread.createdAt || thread.created_at || new Date().toISOString()
                          );
                          const isEditing = editingId === thread.id;

                          return (
                            <motion.div
                              key={thread.id}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.02, duration: 0.15 }}
                              className={cn(
                                'group relative px-3 py-2.5 rounded-2xl cursor-pointer transition-all text-left border',
                                isActive
                                  ? 'bg-cyan-500/10 border-cyan-500/30 text-white'
                                  : 'hover:bg-white/6 border-transparent hover:border-white/5 text-white/70'
                              )}
                              onMouseEnter={() => setHoveredId(thread.id)}
                              onMouseLeave={() => {
                                setHoveredId(null);
                                if (menuOpenId === thread.id) setMenuOpenId(null);
                              }}
                              onClick={() => {
                                if (!isEditing) {
                                  onSelectThread(thread.id);
                                  onClose();
                                }
                              }}
                            >
                              <div className="flex items-start gap-2.5 pr-12">
                                {/* Sparkle/AI Icon */}
                                <div
                                  className={cn(
                                    'w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors',
                                    isActive ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-white/40'
                                  )}
                                >
                                  <Sparkles size={11} />
                                </div>

                                <div className="flex-1 min-w-0">
                                  {/* Title Inline Edit */}
                                  {isEditing ? (
                                    <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                                      <input
                                        type="text"
                                        value={editTitle}
                                        onChange={e => setEditTitle(e.target.value)}
                                        onKeyDown={e => {
                                          if (e.key === 'Enter') handleSaveRename(thread.id);
                                          if (e.key === 'Escape') setEditingId(null);
                                        }}
                                        autoFocus
                                        className="w-full bg-white/10 border border-cyan-500/50 rounded-lg px-2 py-0.5 text-xs text-white outline-none"
                                      />
                                      <button
                                        onClick={() => handleSaveRename(thread.id)}
                                        className="p-1 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30"
                                      >
                                        <Check size={12} />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5">
                                      <p
                                        className={cn(
                                          'text-xs font-semibold leading-snug truncate flex-1',
                                          isActive ? 'text-white' : 'text-white/85'
                                        )}
                                        title={thread.title}
                                      >
                                        <HighlightText text={thread.title || 'New Chat'} query={searchQuery} />
                                      </p>

                                      {/* Badges / Pin / Favorite indicators */}
                                      {thread.isPinned && (
                                        <Pin size={10} className="text-cyan-400 shrink-0 fill-cyan-400/30" />
                                      )}
                                      {thread.isFavorite && (
                                        <Star size={10} className="text-amber-400 shrink-0 fill-amber-400" />
                                      )}
                                    </div>
                                  )}

                                  {/* Preview text */}
                                  {thread.preview && (
                                    <p className="text-[11px] text-white/35 truncate mt-0.5">
                                      <HighlightText text={thread.preview} query={searchQuery} />
                                    </p>
                                  )}

                                  {/* Bottom meta: model + relative time */}
                                  <div className="flex items-center justify-between mt-1 text-[10px] text-white/30">
                                    <span>{relTime}</span>
                                    {thread.model && (
                                      <span className="bg-white/5 border border-white/8 px-1.5 py-0.2 rounded-md font-medium text-white/50">
                                        <HighlightText text={thread.model} query={searchQuery} />
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Action Buttons Revealed on Hover */}
                              <AnimatePresence>
                                {(isHovered || menuOpenId === thread.id) && !isEditing && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.1 }}
                                    className="absolute right-2 top-2.5 flex items-center gap-1 z-20"
                                    onClick={e => e.stopPropagation()}
                                  >
                                    {/* Quick Pin Toggle */}
                                    {onPinThread && (
                                      <button
                                        onClick={() => {
                                          onPinThread(thread.id);
                                          toast.success(thread.isPinned ? 'Unpinned' : 'Pinned');
                                        }}
                                        className={cn(
                                          "p-1 rounded-lg transition-colors cursor-pointer",
                                          thread.isPinned
                                            ? "bg-cyan-500/20 text-cyan-300"
                                            : "bg-white/8 hover:bg-white/15 text-white/50 hover:text-white"
                                        )}
                                        title={thread.isPinned ? "Unpin" : "Pin"}
                                      >
                                        <Pin size={11} />
                                      </button>
                                    )}

                                    {/* Quick Star Toggle */}
                                    {onFavoriteThread && (
                                      <button
                                        onClick={() => {
                                          onFavoriteThread(thread.id);
                                          toast.success(thread.isFavorite ? 'Removed from Starred' : 'Added to Starred');
                                        }}
                                        className={cn(
                                          "p-1 rounded-lg transition-colors cursor-pointer",
                                          thread.isFavorite
                                            ? "bg-amber-500/20 text-amber-300"
                                            : "bg-white/8 hover:bg-white/15 text-white/50 hover:text-white"
                                        )}
                                        title={thread.isFavorite ? "Unstar" : "Star"}
                                      >
                                        <Star size={11} />
                                      </button>
                                    )}

                                    {/* Rename */}
                                    {onRenameThread && (
                                      <button
                                        onClick={() => handleStartRename(thread)}
                                        className="p-1 rounded-lg bg-white/8 hover:bg-white/15 text-white/50 hover:text-white transition-colors cursor-pointer"
                                        title="Rename"
                                      >
                                        <Edit2 size={11} />
                                      </button>
                                    )}

                                    {/* Delete */}
                                    <button
                                      onClick={() => onDeleteThread(thread.id)}
                                      className="p-1 rounded-lg bg-white/8 hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-colors cursor-pointer"
                                      title="Delete"
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom Floating Action Bar */}
            <div className="p-4 pt-3 flex items-center justify-between border-t border-white/10 bg-black/40 backdrop-blur-md shrink-0">
              <button
                onClick={() => {
                  if (onNewThread) onNewThread();
                  onClose();
                }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#1d6bf3] hover:bg-[#1558c0] active:scale-95 text-white font-semibold text-base shadow-lg transition-all cursor-pointer"
              >
                <SquarePen size={18} />
                <span>Chat</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('open_wallpaper_studio'));
                    onClose();
                  }}
                  className="w-10 h-10 rounded-full bg-[#1c1c1e] hover:bg-orange-500/20 text-orange-400 hover:text-orange-300 flex items-center justify-center transition-colors cursor-pointer border border-white/5 hover:border-orange-500/30"
                  title="Dynamic Video Wallpaper Studio"
                >
                  <Film size={18} />
                </button>
                <button
                  onClick={() => {
                    if (onOpenSettings) onOpenSettings();
                    onClose();
                  }}
                  className="w-10 h-10 rounded-full bg-[#1c1c1e] hover:bg-[#2c2c2e] text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/5"
                  title="Settings & Preferences"
                >
                  <Settings size={18} />
                </button>
                <ProfileAvatarButton
                  onClick={() => {
                    if (onOpenSettings) onOpenSettings();
                    onClose();
                  }}
                  size="md"
                />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
