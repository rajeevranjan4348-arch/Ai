import React, { useState, useMemo } from 'react';
import {
  Search,
  Library,
  Folder,
  Plug,
  MessageSquare,
  SquarePen,
  X,
  Trash2,
  Sparkles,
  MapPin,
  Globe,
  Settings,
  Image as ImageIcon,
  Film,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Thread } from '@/hooks/useThreads';
import { toast } from 'sonner';
import { ProfileAvatarButton } from './ProfileAvatarButton';

interface SidebarProps {
  onNewThread: () => void;
  onSelectThread: (threadId: string) => void;
  onDeleteThread: (threadId: string) => void;
  className?: string;
  threads: Thread[];
  onToggleHistory: () => void;
  activeFeature?: string;
  onSelectFeature?: (feature: string) => void;
  currentThreadId?: string;
  onOpenAppLauncher?: () => void;
  onOpenSettings?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onNewThread,
  onSelectThread,
  onDeleteThread,
  className,
  threads,
  activeFeature,
  onSelectFeature,
  currentThreadId,
  onOpenSettings,
}) => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter threads by search query
  const filteredThreads = useMemo(() => {
    if (!searchQuery.trim()) return threads;
    return threads.filter(t =>
      (t.title || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [threads, searchQuery]);

  const pinnedThreads = useMemo(() => {
    return filteredThreads.filter(t => t.isPinned);
  }, [filteredThreads]);

  const recentThreads = useMemo(() => {
    return filteredThreads.filter(t => !t.isPinned);
  }, [filteredThreads]);

  const handleFeatureClick = (featureId: string) => {
    if (featureId === 'images') {
      toast.info('Images Mode Selected');
      if (onSelectFeature) onSelectFeature('images');
    } else if (featureId === 'library') {
      toast.info('Viewing Chat Library');
      if (onSelectFeature) onSelectFeature('library');
    } else if (featureId === 'projects') {
      toast.info('Projects Workspace Active');
      if (onSelectFeature) onSelectFeature('projects');
    } else if (featureId === 'plugins') {
      toast.info('AI Plugins Manager Active');
      if (onSelectFeature) onSelectFeature('plugins');
    } else if (featureId === 'maps') {
      toast.info('Google Maps Navigation Active');
      if (onSelectFeature) onSelectFeature('maps');
    } else if (featureId === 'resources') {
      toast.info('Resources & Google Search Hub Active');
      if (onSelectFeature) onSelectFeature('resources');
    }
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 bottom-0 w-72 flex flex-col z-50 hidden lg:flex",
        "bg-black/60 backdrop-blur-2xl text-white border-r border-white/10 shadow-2xl select-none font-sans",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <h1 className="text-2xl font-bold tracking-tight text-white">Rishi</h1>
        <button
          onClick={() => {
            setIsSearching(!isSearching);
            if (isSearching) setSearchQuery('');
          }}
          className="w-10 h-10 rounded-full bg-[#1c1c1e] hover:bg-[#2c2c2e] text-white flex items-center justify-center transition-colors cursor-pointer"
          title="Search chats"
        >
          {isSearching ? <X size={18} /> : <Search size={18} />}
        </button>
      </div>

      {/* Inline Search Bar */}
      {isSearching && (
        <div className="px-5 pb-3">
          <div className="relative flex items-center">
            <Search size={16} className="absolute left-3 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              autoFocus
              className="w-full bg-[#1c1c1e] text-white text-sm rounded-xl pl-9 pr-3 py-2 border border-white/10 focus:outline-none focus:border-blue-500 placeholder-white/40"
            />
          </div>
        </div>
      )}

      {/* Top Navigation Menu List */}
      <div className="px-4 py-2 space-y-1">
        <button
          onClick={() => {
            onNewThread();
            if (onSelectFeature) onSelectFeature('chat');
          }}
          className={cn(
            "w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-white text-lg font-medium transition-colors cursor-pointer group",
            activeFeature === 'chat' || !activeFeature ? "hover:bg-white/10" : "hover:bg-white/10"
          )}
        >
          <SquarePen size={22} className="shrink-0 text-white group-hover:scale-105 transition-transform" />
          <span>New chat</span>
        </button>

        <button
          onClick={() => handleFeatureClick('library')}
          className={cn(
            "w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-white text-lg font-medium transition-colors cursor-pointer group",
            activeFeature === 'library' ? "bg-white/15 font-semibold text-amber-300" : "hover:bg-white/10"
          )}
        >
          <Library size={22} className="shrink-0 text-white group-hover:scale-105 transition-transform" />
          <div className="flex flex-col items-start min-w-0 text-left">
            <span className="text-base font-semibold leading-tight">Library</span>
            <span className="text-[11px] text-white/50 font-normal leading-tight truncate">Picture, Video & File Store</span>
          </div>
        </button>

        <button
          onClick={() => handleFeatureClick('projects')}
          className={cn(
            "w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-white text-lg font-medium transition-colors cursor-pointer group",
            activeFeature === 'projects' ? "bg-white/15 font-semibold text-blue-300" : "hover:bg-white/10"
          )}
        >
          <Folder size={22} className="shrink-0 text-white group-hover:scale-105 transition-transform" />
          <span>Projects</span>
        </button>

        <button
          onClick={() => handleFeatureClick('plugins')}
          className={cn(
            "w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-white text-lg font-medium transition-colors cursor-pointer group",
            activeFeature === 'plugins' ? "bg-white/15 font-semibold text-emerald-300" : "hover:bg-white/10"
          )}
        >
          <Plug size={22} className="shrink-0 text-white group-hover:scale-105 transition-transform" />
          <span>Plugins</span>
        </button>

        <button
          onClick={() => handleFeatureClick('maps')}
          className={cn(
            "w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-white text-lg font-medium transition-colors cursor-pointer group",
            activeFeature === 'maps' ? "bg-white/15 font-semibold text-sky-300" : "hover:bg-white/10"
          )}
        >
          <MapPin size={22} className="shrink-0 text-sky-400 group-hover:scale-105 transition-transform" />
          <div className="flex flex-col items-start min-w-0 text-left">
            <span className="text-base font-semibold leading-tight">Google Maps</span>
            <span className="text-[11px] text-white/50 font-normal leading-tight truncate">Live GPS & Places</span>
          </div>
        </button>

        <button
          onClick={() => handleFeatureClick('resources')}
          className={cn(
            "w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-white text-lg font-medium transition-colors cursor-pointer group",
            activeFeature === 'resources' ? "bg-white/15 font-semibold text-blue-300" : "hover:bg-white/10"
          )}
        >
          <Globe size={22} className="shrink-0 text-blue-400 group-hover:scale-105 transition-transform" />
          <div className="flex flex-col items-start min-w-0 text-left">
            <span className="text-base font-semibold leading-tight">Resources & Search</span>
            <span className="text-[11px] text-white/50 font-normal leading-tight truncate">Google Search & Docs</span>
          </div>
        </button>

        <button
          onClick={() => {
            if (onOpenSettings) onOpenSettings();
          }}
          className={cn(
            "w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-white text-lg font-medium transition-colors cursor-pointer group hover:bg-white/10"
          )}
        >
          <Settings size={22} className="shrink-0 text-white/90 group-hover:scale-105 transition-transform" />
          <div className="flex flex-col items-start min-w-0 text-left">
            <span className="text-base font-semibold leading-tight">Settings</span>
            <span className="text-[11px] text-white/50 font-normal leading-tight truncate">Models, Wallpapers & Themes</span>
          </div>
        </button>
      </div>

      {/* Main Threads List Area */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-5 scrollbar-thin scrollbar-thumb-white/10">
        {/* Pinned Section */}
        {pinnedThreads.length > 0 && (
          <div className="space-y-1">
            <div className="px-3 text-base font-semibold text-white/70">
              Pinned
            </div>
            {pinnedThreads.map((thread) => (
              <div
                key={thread.id}
                onClick={() => onSelectThread(thread.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-base font-normal transition-colors truncate cursor-pointer group relative",
                  currentThreadId === thread.id
                    ? "bg-[#1c1c1e] text-white font-medium"
                    : "text-white/90 hover:bg-white/8 hover:text-white"
                )}
              >
                <MessageSquare size={18} className="shrink-0 text-white/60" />
                <span className="truncate flex-1">{thread.title || 'Untitled Chat'}</span>
              </div>
            ))}
          </div>
        )}

        {/* Recents Section */}
        <div className="space-y-1">
          <div className="px-3 text-base font-semibold text-white/70">
            Recents
          </div>
          {recentThreads.length === 0 ? (
            <div className="px-3 py-2 text-sm text-white/40 italic">
              No recent conversations
            </div>
          ) : (
            recentThreads.map((thread) => (
              <div
                key={thread.id}
                onClick={() => onSelectThread(thread.id)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-base font-normal transition-colors truncate cursor-pointer group relative",
                  currentThreadId === thread.id
                    ? "bg-[#1c1c1e] text-white font-medium"
                    : "text-white/90 hover:bg-white/8 hover:text-white"
                )}
              >
                <span className="truncate flex-1 pr-2">{thread.title || 'Untitled Chat'}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteThread(thread.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-white/40 hover:text-red-400 rounded transition-opacity"
                  title="Delete chat"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Bottom Floating Action Bar */}
      <div className="p-4 pt-3 flex items-center justify-between border-t border-white/10 bg-black/40 backdrop-blur-md">
        <button
          onClick={onNewThread}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#1d6bf3] hover:bg-[#1558c0] active:scale-95 text-white font-semibold text-base shadow-lg transition-all cursor-pointer"
        >
          <SquarePen size={18} />
          <span>Chat</span>
        </button>

        <div className="flex items-center gap-2">
          <ProfileAvatarButton onClick={onOpenSettings} size="md" />
        </div>
      </div>
    </aside>
  );
};

