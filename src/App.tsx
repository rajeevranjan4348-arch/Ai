import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { HistoryPanel } from '@/components/layout/HistoryPanel';
import { SettingsModal } from '@/components/layout/SettingsModal';
import { ChatInterface } from '@/components/research/ChatInterface';
import { ManusAgentPanel } from '@/components/research/ManusAgentPanel';
import { AppLauncherModal } from '@/components/launcher/AppLauncherModal';
import { FpsBoostModal } from '@/components/tools/FpsBoostModal';
import { WallpaperPickerModal } from '@/components/wallpaper/WallpaperPickerModal';
import { DedicatedPanel, ImagesUI, LibraryUI, ProjectsUI, ResourceSearchUI, PanelType } from '@/components/panels/DedicatedPanels';
import { GoogleMapsView } from '@/components/maps/GoogleMapsView';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { Image as ImageIcon, Library as LibraryIcon, Folder as FolderIcon } from 'lucide-react';
import { CHAT_HANDOFF_EVENT, ChatHandoff, ImageItem } from '@/lib/chatHandoff';
import { useThreads, getStoredActiveConversationId, persistActiveConversationId } from '@/hooks/useThreads';
import { useSession } from '@/hooks/useSession';
import { LoadingIndicator } from '@/components/ui/loading-indicator';
import { OfflineIndicator } from '@/components/ui/OfflineIndicator';
import { MotionBackground } from '@/components/ui/MotionBackground';
import { Toaster, toast } from 'sonner';

function App() {
  const { sessionId } = useSession();
  const [isAppLauncherOpen, setIsAppLauncherOpen] = useState(false);
  const [isFpsModalOpen, setIsFpsModalOpen] = useState(false);
  const [isWallpaperPickerOpen, setIsWallpaperPickerOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<PanelType>('chat');
  const {
    createThread,
    deleteThread,
    saveMessage,
    saveConversation,
    loadConversation,
    getThreadMessages,
    threads,
    renameThread,
    togglePinThread,
    toggleFavoriteThread,
    toggleArchiveThread,
    duplicateThread,
  } = useThreads(sessionId);

  const [currentThreadId, setCurrentThreadId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlThread = params.get('thread');
      if (urlThread) return urlThread;
      const storedActive = getStoredActiveConversationId();
      if (storedActive) return storedActive;
    }
    return null;
  });
  const [initialMessages, setInitialMessages] = useState<any[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [pendingQuery, setPendingQuery] = useState<string | null>(null);
  const [pendingImages, setPendingImages] = useState<ImageItem[]>([]);
  const [pendingMode, setPendingMode] = useState<'chat' | 'search' | 'research'>('chat');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [newChatCounter, setNewChatCounter] = useState(0);

  // Listen for Image Panel → Chat handoffs
  useEffect(() => {
    const handleHandoff = (e: Event) => {
      const customEvent = e as CustomEvent<ChatHandoff>;
      if (customEvent.detail) {
        const { text, images } = customEvent.detail;
        setPendingQuery(text || (images.length > 0 ? 'Discussing attached image' : ''));
        setPendingImages(images || []);
        setActivePanel('chat');
      }
    };
    window.addEventListener(CHAT_HANDOFF_EVENT, handleHandoff);

    const handleOpenFps = () => setIsFpsModalOpen(true);
    window.addEventListener('open_fps_boost', handleOpenFps);

    const handleOpenWallpaper = () => setIsWallpaperPickerOpen(true);
    window.addEventListener('open_wallpaper_studio', handleOpenWallpaper);

    return () => {
      window.removeEventListener(CHAT_HANDOFF_EVENT, handleHandoff);
      window.removeEventListener('open_fps_boost', handleOpenFps);
      window.removeEventListener('open_wallpaper_studio', handleOpenWallpaper);
    };
  }, []);

  // History panel toggle
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const handleSearchStart = async (query: string, mode: 'chat' | 'search' | 'research') => {
    try {
      const thread = await createThread(query, sessionId);
      if (thread && thread.id) {
        setPendingQuery(query);
        setPendingMode(mode);
        setCurrentThreadId(thread.id);
        setActivePanel('chat');
        return thread.id;
      }
      throw new Error('Thread creation returned empty result');
    } catch (error) {
      console.warn('Error creating thread (expected fallback to local storage):', error);
      return '';
    }
  };

  const handleNewThread = () => {
    persistActiveConversationId(null);
    setCurrentThreadId(null);
    setInitialMessages([]);
    setPendingQuery(null);
    setPendingMode('chat');
    setActivePanel('chat');
    setNewChatCounter(prev => prev + 1);
  };

  const handleSelectThread = async (threadId: string) => {
    setActivePanel('chat');
    if (!threadId) return;

    setLoadingThread(true);
    try {
      const conversation = await loadConversation(threadId);
      if (conversation) {
        const messages = conversation.messages || [];
        setInitialMessages(messages);
        setCurrentThreadId(conversation.id);
        persistActiveConversationId(conversation.id);
        console.log('Active conversation:', conversation.id);
        console.log('Loading conversation:', threadId);
        console.log('Loaded messages:', messages);
      } else {
        const fallbackMsgs = await getThreadMessages(threadId);
        setInitialMessages(fallbackMsgs);
        setCurrentThreadId(threadId);
        persistActiveConversationId(threadId);
      }
    } catch (error) {
      console.warn('Error loading conversation:', error);
    } finally {
      setLoadingThread(false);
    }
  };

  const handleDeleteThread = async (threadId: string) => {
    setIsLoading(true);
    setLoadingMessage('Deleting thread...');
    try {
      await deleteThread(threadId);
      toast.success('Conversation deleted', { duration: 2000 });
      if (currentThreadId === threadId) {
        handleNewThread();
      }
    } catch (error) {
      console.warn('Error deleting thread:', error);
      toast.error('Failed to delete conversation', { duration: 2000 });
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  // Restore conversation from URL query param or active session on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const threadIdFromUrl = params.get('thread');
    const storedActiveId = getStoredActiveConversationId();
    const targetId = threadIdFromUrl || storedActiveId;
    if (targetId) {
      handleSelectThread(targetId);
    }
  }, []);

  // Global Keyboard Shortcuts (Cmd+K / Ctrl+K for New Chat, Cmd+H / Ctrl+H for History)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleNewThread();
        toast.info('Started New Chat');
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setIsHistoryOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update URL search params when currentThreadId changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (currentThreadId && activePanel === 'chat') {
      params.set('thread', currentThreadId);
    } else {
      params.delete('thread');
    }
    const newRelativePathQuery = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
    window.history.replaceState(null, '', newRelativePathQuery);
  }, [currentThreadId, activePanel]);

  return (
    <div className="relative min-h-screen bg-transparent flex flex-col font-sans text-foreground selection:bg-primary/10 selection:text-primary overflow-x-hidden">
      {/* Performance-optimized continuous video background loop */}
      <MotionBackground />

      <Toaster position="top-center" />
      <OfflineIndicator />
      <LoadingIndicator isVisible={isLoading} message={loadingMessage} />

      {/* App Launcher Modal */}
      <AppLauncherModal
        isOpen={isAppLauncherOpen}
        onClose={() => setIsAppLauncherOpen(false)}
        onSelectApp={(app) => {
          if (app.id === 'fps_boost') {
            setIsFpsModalOpen(true);
          } else if (app.id === 'wallpaper_studio') {
            setIsWallpaperPickerOpen(true);
          }
        }}
      />

      {/* Experimental FPS Controller Modal */}
      <FpsBoostModal
        isOpen={isFpsModalOpen}
        onClose={() => setIsFpsModalOpen(false)}
      />

      {/* Dynamic Wallpaper & Video Studio Modal */}
      <WallpaperPickerModal
        isOpen={isWallpaperPickerOpen}
        onClose={() => setIsWallpaperPickerOpen(false)}
      />

      {/* Global Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      {/* History panel */}
      <HistoryPanel
        threads={threads}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectThread={handleSelectThread}
        onDeleteThread={handleDeleteThread}
        onRenameThread={renameThread}
        onPinThread={togglePinThread}
        onFavoriteThread={toggleFavoriteThread}
        onArchiveThread={toggleArchiveThread}
        onDuplicateThread={duplicateThread}
        currentThreadId={currentThreadId ?? undefined}
        onNewThread={handleNewThread}
        onOpenAppLauncher={() => setIsAppLauncherOpen(true)}
        onSelectFeature={(feat) => setActivePanel(feat as PanelType)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      />

      <Sidebar
        onNewThread={handleNewThread}
        onSelectThread={handleSelectThread}
        onDeleteThread={handleDeleteThread}
        threads={threads}
        onToggleHistory={() => setIsHistoryOpen(prev => !prev)}
        onOpenAppLauncher={() => setIsAppLauncherOpen(true)}
        activeFeature={activePanel}
        onSelectFeature={(feat) => setActivePanel(feat as PanelType)}
        currentThreadId={currentThreadId ?? undefined}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      />

      <div className="flex-1 flex flex-col min-w-0 lg:pl-72 transition-all duration-300">
        <ErrorBoundary fallbackTitle="Panel View Error">
          {activePanel === 'manus' ? (
            <div className="flex-1 overflow-y-auto">
              <div className="sticky top-0 z-30 px-6 py-3 bg-black/80 backdrop-blur-xl border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActivePanel('chat')}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-colors cursor-pointer"
                  >
                    ← Back to Rishi AI
                  </button>
                  <span className="text-sm font-bold text-purple-300 flex items-center gap-1.5">
                    ✨ Manus Autonomous Agent Mode
                  </span>
                </div>
              </div>
              <ManusAgentPanel onSearchStart={handleSearchStart} />
            </div>
          ) : activePanel === 'images' ? (
            <ImagesUI onBackToChat={() => setActivePanel('chat')} />
          ) : activePanel === 'library' ? (
            <LibraryUI onBackToChat={() => setActivePanel('chat')} />
          ) : activePanel === 'projects' ? (
            <ProjectsUI
              onBackToChat={() => setActivePanel('chat')}
              onSelectProject={() => {
                handleNewThread();
                setActivePanel('chat');
              }}
            />
          ) : activePanel === 'maps' ? (
            <div className="flex-1 p-6 space-y-4 max-w-7xl mx-auto w-full">
              <div className="flex items-center justify-between bg-black/60 backdrop-blur-xl border border-white/10 p-4 rounded-2xl">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActivePanel('chat')}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-colors cursor-pointer"
                  >
                    ← Back to Rishi AI
                  </button>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    🗺️ Google Maps Location Platform
                  </h2>
                </div>
              </div>
              <GoogleMapsView className="h-[calc(100vh-140px)]" />
            </div>
          ) : activePanel === 'resources' ? (
            <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
              <ResourceSearchUI
                onSearchInChat={(q) => {
                  setPendingQuery(q);
                  setActivePanel('chat');
                }}
              />
            </div>
          ) : loadingThread ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-pulse w-8 h-8 rounded-full bg-muted" />
            </div>
          ) : (
            <ChatInterface
              key={currentThreadId ? currentThreadId : `new_${newChatCounter}`}
              initialMessages={initialMessages}
              threadId={currentThreadId || undefined}
              threadTitle={threads.find(t => t.id === currentThreadId)?.title || 'AI Chat UI Repos'}
              onSearchStart={handleSearchStart}
              onMessageComplete={saveMessage}
              onUserMessage={saveMessage}
              pendingQuery={pendingQuery}
              pendingImages={pendingImages}
              onClearPendingQuery={() => {
                setPendingQuery(null);
                setPendingImages([]);
              }}
              pendingMode={pendingMode}
              sessionId={sessionId}
              onToggleHistory={() => setIsHistoryOpen(prev => !prev)}
              onNewThread={handleNewThread}
              onDeleteThread={() => currentThreadId && handleDeleteThread(currentThreadId)}
              onOpenAppLauncher={() => setIsAppLauncherOpen(true)}
              onOpenSettings={() => setIsSettingsModalOpen(true)}
            />
          )}
        </ErrorBoundary>
      </div>
    </div>
  );
}

export default App;
