import React, { useState } from 'react';
import { 
  Globe, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  Share2, 
  MoreHorizontal, 
  Library, 
  Plus, 
  Pin, 
  FolderPlus, 
  Paperclip, 
  Search, 
  Home, 
  Archive, 
  Trash2, 
  ChevronRight,
  Brain,
  Settings,
  Grid,
  Phone,
  Mic,
  Users,
  Gauge
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ModelSelector } from '@/components/layout/ModelSelector';
import { CirclePlusIcon } from '@/components/ui/CirclePlusIcon';
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher';
import { Volume2 } from 'lucide-react';

interface NavbarProps {
  activeTab: 'answer' | 'links' | 'images';
  onTabChange: (tab: 'answer' | 'links' | 'images') => void;
  onNewThread?: () => void;
  onToggleHistory?: () => void;
  onShare?: () => void;
  onDeleteThread?: () => void;
  onOpenMemoryManager?: () => void;
  onOpenSettings?: () => void;
  onOpenAppLauncher?: () => void;
  onOpenContacts?: () => void;
  threadTitle?: string;
  showTabs?: boolean;
  showModelSelector?: boolean;
  showTTS?: boolean;
  latestResponseText?: string;
  isCallActive?: boolean;
  onToggleCallMode?: () => void;
  children?: React.ReactNode;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  activeTab, 
  onTabChange, 
  onNewThread, 
  onToggleHistory, 
  onShare, 
  onDeleteThread,
  onOpenMemoryManager,
  onOpenSettings,
  onOpenAppLauncher,
  onOpenContacts,
  threadTitle = 'AI Chat UI Repos',
  showModelSelector = false,
  showTTS = true,
  latestResponseText,
  isCallActive = false,
  onToggleCallMode,
  children 
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  const tabs = [
    { id: 'answer', label: 'Answer', icon: Globe },
    { id: 'links', label: 'Links', icon: LinkIcon },
    { id: 'images', label: 'Images', icon: ImageIcon },
  ] as const;

  const handleShareClick = () => {
    setIsMenuOpen(false);
    if (onShare) {
      onShare();
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Conversation link copied to clipboard!');
    }
  };

  const handlePinClick = () => {
    setIsMenuOpen(false);
    setIsPinned(!isPinned);
    toast.success(isPinned ? 'Thread unpinned' : 'Thread pinned to top');
  };

  const handleAddToProject = () => {
    setIsMenuOpen(false);
    toast.success('Added conversation to project');
  };

  const handleUploadedFiles = () => {
    setIsMenuOpen(false);
    toast.info('No files attached to this thread');
  };

  const handleFindInChat = () => {
    setIsMenuOpen(false);
    toast.info('Press Cmd+F or Ctrl+F to search within chat');
  };

  const handleAddToHome = () => {
    setIsMenuOpen(false);
    toast.success('Shortcut added to home screen');
  };

  const handleArchive = () => {
    setIsMenuOpen(false);
    toast.success('Conversation archived');
  };

  const handleDelete = () => {
    setIsMenuOpen(false);
    if (onDeleteThread) {
      onDeleteThread();
    } else {
      toast.success('Conversation deleted');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/6"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
    >
      <div className="max-w-3xl mx-auto px-4 h-12 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onToggleHistory && (
            <button
              onClick={onToggleHistory}
              className="p-1.5 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors shrink-0 flex items-center gap-1.5 text-xs font-medium mr-1 cursor-pointer"
              title="Chat History"
            >
              <Library size={15} />
              <span className="hidden sm:inline">History</span>
            </button>
          )}
        </div>

        <div className="relative flex items-center gap-1.5 sm:gap-2 text-white/80">
          {children}

          {/* Model Selector dropdown (only rendered on Home page) */}
          {showModelSelector && <ModelSelector align="right" />}

          {/* Theme Switcher Toggle */}
          <ThemeSwitcher className="w-8 h-8 p-0" />

          {/* New Chat Icon-Only Button */}
          {onNewThread && (
            <button
              onClick={onNewThread}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white transition-all shrink-0 cursor-pointer shadow-sm flex items-center justify-center hover:scale-105 active:scale-95"
              title="New Chat"
            >
              <CirclePlusIcon size={16} className="text-white" />
            </button>
          )}

          {/* Three Dots Menu Button */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            title="Chat Options & Settings"
            className={cn(
              "w-8 h-8 rounded-full transition-all cursor-pointer flex items-center justify-center border",
              isMenuOpen 
                ? "bg-white/20 text-white border-white/20" 
                : "bg-white/5 hover:bg-white/15 text-white/70 hover:text-white border-white/10"
            )}
          >
            <MoreHorizontal size={18} />
          </button>

          {/* Three Dots Dropdown Menu */}
          <AnimatePresence>
            {isMenuOpen && (
              <>
                {/* Backdrop to close menu when clicking outside */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsMenuOpen(false)} 
                />

                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute right-0 top-full mt-2 w-60 bg-[#1a1a1e] border border-white/12 rounded-2xl p-1.5 shadow-2xl z-50 backdrop-blur-xl text-left"
                >
                  {/* Chat Title Header */}
                  <div className="px-3 py-2 text-[13px] font-semibold text-white/40 border-b border-white/5 mb-1 truncate">
                    {threadTitle}
                  </div>

                  {/* Menu Options */}
                  <div className="space-y-0.5">
                    {/* Settings Option inside 3-dots */}
                    {onOpenSettings && (
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          onOpenSettings();
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-white hover:text-white hover:bg-white/10 transition-colors cursor-pointer text-left"
                      >
                        <Settings size={16} className="text-white/80 shrink-0" />
                        <span className="font-semibold flex-1">Settings</span>
                      </button>
                    )}

                    {onNewThread && (
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          onNewThread();
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-cyan-400 hover:text-cyan-300 hover:bg-white/8 transition-colors cursor-pointer text-left border-b border-white/5 pb-2 mb-1"
                      >
                        <CirclePlusIcon size={16} className="text-cyan-400 shrink-0" />
                        <span>New Chat</span>
                      </button>
                    )}

                    {/* Maximum FPS Performance Option */}
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        const event = new CustomEvent('open_fps_boost');
                        window.dispatchEvent(event);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors cursor-pointer text-left"
                    >
                      <Gauge size={16} className="text-emerald-400 shrink-0" />
                      <span className="flex-1">FPS & Performance</span>
                      <span className="text-[10px] bg-emerald-500/25 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold">120 FPS</span>
                    </button>

                    {onOpenContacts && (
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          onOpenContacts();
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-blue-300 hover:text-blue-200 hover:bg-white/8 transition-colors cursor-pointer text-left"
                      >
                        <Users size={16} className="text-blue-400 shrink-0" />
                        <span>Google Contacts</span>
                      </button>
                    )}

                    <button
                      onClick={handleShareClick}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-white/80 hover:text-white hover:bg-white/8 transition-colors cursor-pointer text-left"
                    >
                      <Share2 size={16} className="text-white/70 shrink-0" />
                      <span>Share</span>
                    </button>

                    <button
                      onClick={handlePinClick}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-white/80 hover:text-white hover:bg-white/8 transition-colors cursor-pointer text-left"
                    >
                      <Pin size={16} className={cn("shrink-0", isPinned ? "text-cyan-400" : "text-white/70")} />
                      <span>{isPinned ? 'Unpin' : 'Pin'}</span>
                    </button>

                    <button
                      onClick={handleAddToProject}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-white/80 hover:text-white hover:bg-white/8 transition-colors cursor-pointer text-left"
                    >
                      <FolderPlus size={16} className="text-white/70 shrink-0" />
                      <span className="flex-1">Add to project</span>
                      <ChevronRight size={14} className="text-white/40" />
                    </button>

                    <button
                      onClick={handleUploadedFiles}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-white/80 hover:text-white hover:bg-white/8 transition-colors cursor-pointer text-left"
                    >
                      <Paperclip size={16} className="text-white/70 shrink-0" />
                      <span>Uploaded files</span>
                    </button>

                    <button
                      onClick={handleFindInChat}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-white/80 hover:text-white hover:bg-white/8 transition-colors cursor-pointer text-left"
                    >
                      <Search size={16} className="text-white/70 shrink-0" />
                      <span>Find in chat</span>
                    </button>

                    <button
                      onClick={handleAddToHome}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-white/80 hover:text-white hover:bg-white/8 transition-colors cursor-pointer text-left"
                    >
                      <Home size={16} className="text-white/70 shrink-0" />
                      <span>Add to home</span>
                    </button>

                    <button
                      onClick={handleArchive}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-white/80 hover:text-white hover:bg-white/8 transition-colors cursor-pointer text-left"
                    >
                      <Archive size={16} className="text-white/70 shrink-0" />
                      <span>Archive</span>
                    </button>

                    <button
                      onClick={handleDelete}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer text-left mt-1 border-t border-white/5 pt-2"
                    >
                      <Trash2 size={16} className="text-red-400 shrink-0" />
                      <span>Delete</span>
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

