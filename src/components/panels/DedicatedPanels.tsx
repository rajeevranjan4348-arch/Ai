import React, { useState, useMemo, useEffect } from 'react';
import { formatAppError, showErrorToast } from '@/lib/errorHandler';
import { cn } from '@/lib/utils';
import {
  Image as ImageIcon,
  Library as LibraryIcon,
  Folder as FolderIcon,
  Search,
  Plus,
  Upload,
  FileText,
  Trash2,
  MoreVertical,
  ExternalLink,
  Copy,
  Check,
  X,
  ArrowLeft,
  Mic,
  ArrowUp,
  Share2,
  Download,
  Film,
  Globe,
  Clapperboard,
  MessageSquare,
  Sparkles,
  Edit2,
  Archive,
  FileCode,
  FileUp,
  Grid,
  List,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';

import { sendImageToChat, ImageItem } from '@/lib/chatHandoff';
import {
  getSharedMediaItems,
  addSharedMediaItem,
  deleteSharedMediaItem,
  clearSharedMediaStore,
  SharedMediaItem
} from '@/lib/mediaStore';
import { HardDrive, Send, Video as VideoIcon } from 'lucide-react';

import { ImageGeneratorUI } from './ImageGeneratorUI';
import { ResourceSearchUI } from '@/components/resources/ResourceSearchUI';

export type PanelType = 'chat' | 'images' | 'library' | 'projects' | 'manus' | 'maps' | 'resources';

// ============================================================
// DATA TYPES & LOCAL STORAGE HELPERS
// ============================================================

export interface GeneratedImage {
  id: string;
  title: string;
  prompt: string;
  url: string;
  aspect?: string;
  style?: string;
  createdAt: string;
  projectId?: string;
}

export interface LibraryItem {
  id: string;
  name: string;
  type: string; // 'pdf' | 'video' | 'link' | 'image' | 'doc'
  category: 'All' | 'Images' | 'Files';
  size?: string;
  createdAt: string;
  url?: string;
  thumbnail?: string;
  projectId?: string;
}

export interface ProjectItem {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  createdAt: string;
  updatedAt?: string;
  category?: 'Created by you' | 'Shared';
  instructions?: string;
}

const DEFAULT_INSPIRATIONS = [
  {
    id: 'insp-1',
    title: 'Create a caricature',
    prompt: 'A funny caricature of a doctor reading anatomy textbook with digital tablet in mountain backdrop',
    thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'insp-2',
    title: 'Tiranga outfit',
    prompt: 'A handsome man wearing traditional Indian tricolor sash outdoors, golden hour lighting, high resolution portrait',
    thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'insp-3',
    title: 'Anime',
    prompt: 'Stylish anime boy character wink portrait with vibrant lighting, Studio Ghibli artistic style',
    thumbnail: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'insp-4',
    title: 'Under water',
    prompt: 'Underwater deep sea coral reef explosion of colors with tropical fish and natural sun rays',
    thumbnail: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'insp-5',
    title: 'Cyberpunk metropolis',
    prompt: 'Neon synthwave cityscape at night with futuristic flying vehicles and rain reflections',
    thumbnail: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=600&q=80',
  },
];

const DEFAULT_IMAGES: GeneratedImage[] = [
  {
    id: 'img-1',
    title: 'Google Dashboard Mockup',
    prompt: 'Minimal dark mode UI dashboard with analytics graphs and navigation sidebar',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    createdAt: 'July 16',
  },
  {
    id: 'img-2',
    title: 'AI Mobile Interface',
    prompt: 'Sleek dark themed mobile chat application screen design with purple highlights',
    url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
    createdAt: 'July 15',
  },
  {
    id: 'img-3',
    title: 'AI Bubble Logo',
    prompt: '3D glowing neon blue AI chat speech bubble icon on pure dark background',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    createdAt: 'July 12',
  },
  {
    id: 'img-4',
    title: 'Science Diagrams',
    prompt: 'Detailed biology textbook illustration of plant and animal cells with labels',
    url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80',
    createdAt: 'July 10',
  },
];

const DEFAULT_LIBRARY: LibraryItem[] = [
  { id: 'lib-1', name: 'AAA_Original_Horror...', type: 'pdf', category: 'Files', createdAt: 'July 16' },
  { id: 'lib-2', name: '1000104963', type: 'video', category: 'Files', createdAt: 'July 16' },
  { id: 'lib-3', name: 'Standing_Instruction...', type: 'pdf', category: 'Files', createdAt: 'July 15' },
  { id: 'lib-4', name: 'Standing_Instruction...', type: 'pdf', category: 'Files', createdAt: 'July 14' },
  { id: 'lib-5', name: 'Standing_Instruction...', type: 'doc', category: 'Files', createdAt: 'July 12' },
  { id: 'lib-6', name: 'IRIS-AI-Frontend-UI-...', type: 'link', category: 'Files', createdAt: 'July 10' },
  { id: 'lib-7', name: 'AI_Bubble_Logo.png', type: 'image', category: 'Images', createdAt: 'July 12' },
];

const DEFAULT_PROJECTS: ProjectItem[] = [
  {
    id: 'proj-1',
    name: 'Prompt',
    description: 'Personal prompt engineering and chat experiments',
    createdAt: 'July 16',
    updatedAt: 'July 16',
    category: 'Created by you',
  },
  {
    id: 'proj-2',
    name: 'Mobile App Redesign',
    description: 'Android & Web interface development for AI Studio app',
    createdAt: 'July 12',
    updatedAt: 'July 14',
    category: 'Created by you',
  },
];

// Helper to get state from localStorage
function getStoredData<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setStoredData<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Storage error:', err);
  }
}

// ============================================================
// DEDICATED PANEL CONTAINER (Mobile Native Aesthetics)
// ============================================================

interface DedicatedPanelProps {
  title: string;
  icon?: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
  onBackToChat?: () => void;
  headerRightAction?: React.ReactNode;
}

export function DedicatedPanel({
  title,
  children,
  onBackToChat,
  headerRightAction,
}: DedicatedPanelProps) {
  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col selection:bg-white/20">
      {/* Top Mobile Header */}
      <header className="sticky top-0 z-40 bg-black/95 backdrop-blur-md px-4 py-3.5 flex items-center justify-between border-b border-white/10">
        <button
          onClick={onBackToChat}
          className="w-11 h-11 rounded-full bg-[#1c1c1e] hover:bg-[#2c2c2e] text-white flex items-center justify-center border border-white/10 active:scale-95 transition-all cursor-pointer shrink-0"
          title="Back to Chat"
        >
          <ArrowLeft size={22} />
        </button>

        <h1 className="text-2xl font-bold tracking-tight text-white text-center flex-1 mx-2 truncate">
          {title}
        </h1>

        <div className="w-11 shrink-0 flex justify-end">
          {headerRightAction || (
            <div className="w-11 h-11" />
          )}
        </div>
      </header>

      {/* Screen Body */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 pt-6 pb-28">
        {children}
      </main>
    </div>
  );
}

// ============================================================
// 1. IMAGES SCREEN
// ============================================================

export function ImagesUI({ onBackToChat }: { onBackToChat?: () => void }) {
  return (
    <DedicatedPanel title="AI Image" onBackToChat={onBackToChat}>
      <ImageGeneratorUI onBackToChat={onBackToChat} />
    </DedicatedPanel>
  );
}

// ============================================================
// 2. LIBRARY SCREEN — AI PICTURE, VIDEO & FILE STORE
// ============================================================

export function LibraryUI({ onBackToChat }: { onBackToChat?: () => void }) {
  const [items, setItems] = useState<SharedMediaItem[]>(() => getSharedMediaItems());
  const [selectedTab, setSelectedTab] = useState<'All' | 'Pictures' | 'Videos' | 'Files' | 'AI Made'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<SharedMediaItem | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const refreshItems = () => {
    setItems(getSharedMediaItems());
  };

  useEffect(() => {
    refreshItems();
    const handleUpdate = () => refreshItems();
    window.addEventListener('shared_media_updated', handleUpdate);
    return () => window.removeEventListener('shared_media_updated', handleUpdate);
  }, []);

  const stats = useMemo(() => {
    const total = items.length;
    const pictures = items.filter(i => i.type === 'image').length;
    const videos = items.filter(i => i.type === 'video').length;
    const files = items.filter(i => i.type === 'document' || i.type === 'other').length;
    const aiMade = items.filter(i => i.source === 'ai_generated').length;
    return { total, pictures, videos, files, aiMade };
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      let matchesTab = true;
      if (selectedTab === 'Pictures') matchesTab = item.type === 'image';
      else if (selectedTab === 'Videos') matchesTab = item.type === 'video';
      else if (selectedTab === 'Files') matchesTab = item.type === 'document' || item.type === 'other';
      else if (selectedTab === 'AI Made') matchesTab = item.source === 'ai_generated';

      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.prompt && item.prompt.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.type.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesTab && matchesSearch;
    });
  }, [items, selectedTab, searchQuery]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const isImg = file.type.startsWith('image/');
      const isVid = file.type.startsWith('video/');
      const itemType = isImg ? 'image' : isVid ? 'video' : 'document';
      const fileUrl = URL.createObjectURL(file);

      addSharedMediaItem({
        name: file.name,
        type: itemType,
        url: fileUrl,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        source: 'user_uploaded',
        mimeType: file.type,
      });
    });

    toast.success(`Uploaded ${files.length} item(s) to Media Store`);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteItem = (id: string) => {
    deleteSharedMediaItem(id);
    setSelectedItem(null);
    toast.success('Deleted item from Media Store');
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <VideoIcon size={22} className="text-purple-400" />;
      case 'image':
        return <ImageIcon size={22} className="text-cyan-400" />;
      default:
        return <FileText size={22} className="text-amber-400" />;
    }
  };

  return (
    <DedicatedPanel
      title="Picture, Video & File Store"
      onBackToChat={onBackToChat}
      headerRightAction={
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs shadow-lg transition-all cursor-pointer active:scale-95"
          >
            <Upload size={14} />
            <span>Upload</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6 pb-20">
        {/* Storage Stats Overview Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <HardDrive size={18} />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Total Assets</p>
              <p className="text-base font-bold text-white font-mono">{stats.total}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ImageIcon size={18} />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Pictures</p>
              <p className="text-base font-bold text-white font-mono">{stats.pictures}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <VideoIcon size={18} />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Videos</p>
              <p className="text-base font-bold text-white font-mono">{stats.videos}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">AI Made</p>
              <p className="text-base font-bold text-white font-mono">{stats.aiMade}</p>
            </div>
          </div>
        </div>

        {/* Filter Controls & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 rounded-2xl bg-white/[0.02] border border-white/10">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vault assets..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder-white/40 focus:outline-none focus:border-cyan-500/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-1 shrink-0 justify-end">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded-xl text-xs font-medium transition-colors cursor-pointer",
                viewMode === 'grid' ? "bg-white/15 text-cyan-300" : "text-slate-400 hover:text-white"
              )}
              title="Grid View"
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2 rounded-xl text-xs font-medium transition-colors cursor-pointer",
                viewMode === 'list' ? "bg-white/15 text-cyan-300" : "text-slate-400 hover:text-white"
              )}
              title="List View"
            >
              <List size={16} />
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'All', label: `All (${stats.total})` },
            { id: 'Pictures', label: `Pictures (${stats.pictures})` },
            { id: 'Videos', label: `Videos (${stats.videos})` },
            { id: 'Files', label: `Files (${stats.files})` },
            { id: 'AI Made', label: `AI Made (${stats.aiMade})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer",
                selectedTab === tab.id
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                  : "bg-white/5 text-slate-400 hover:text-white border border-white/10"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Media Items Grid / List */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 text-white/40 space-y-3 bg-white/[0.02] border border-white/10 rounded-3xl p-8">
            <HardDrive size={48} className="mx-auto text-cyan-400/40" />
            <p className="text-base font-semibold text-white/80">No items found in Media Vault</p>
            <p className="text-xs text-white/40 max-w-sm mx-auto">
              Upload photos, videos, documents, or generate images in the Images Studio to store them here.
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 text-xs font-semibold border border-cyan-500/30 transition-colors cursor-pointer"
            >
              <Upload size={14} />
              <span>Upload Assets</span>
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="bg-[#121214] border border-white/15 rounded-2xl overflow-hidden flex flex-col justify-between group hover:border-cyan-500/50 cursor-pointer transition-all relative shadow-md"
              >
                {/* Media Preview Header */}
                <div className="h-28 bg-black/50 relative overflow-hidden flex items-center justify-center">
                  {item.type === 'image' && item.url ? (
                    <img src={item.url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : item.type === 'video' && item.url ? (
                    <div className="relative w-full h-full">
                      <video src={item.url} className="w-full h-full object-cover" muted loop onMouseOver={(e) => e.currentTarget.play()} onMouseOut={(e) => e.currentTarget.pause()} />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <VideoIcon size={24} className="text-purple-300" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-white/60">
                      {getItemIcon(item.type)}
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">{item.type}</span>
                    </div>
                  )}

                  {/* AI Generated Badge */}
                  {item.source === 'ai_generated' && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-purple-500/80 text-white font-bold text-[9px] backdrop-blur-md flex items-center gap-1 border border-purple-400/40">
                      <Sparkles size={10} />
                      AI Made
                    </span>
                  )}
                </div>

                {/* Item Details */}
                <div className="p-3 space-y-1.5 flex-1 flex flex-col justify-between">
                  <h3 className="text-xs font-bold text-white line-clamp-2 leading-snug group-hover:text-cyan-300 transition-colors">
                    {item.name}
                  </h3>
                  <div className="flex items-center justify-between text-[10px] text-white/40 pt-1 border-t border-white/5 font-mono">
                    <span>{item.size || '1.0 MB'}</span>
                    <span className="capitalize">{item.type}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="p-3 rounded-2xl bg-[#121214] border border-white/10 hover:border-cyan-500/40 flex items-center justify-between gap-3 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-black/50 border border-white/10 shrink-0 overflow-hidden flex items-center justify-center">
                    {item.type === 'image' && item.url ? (
                      <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      getItemIcon(item.type)
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {item.size || '1.0 MB'} • <span className="capitalize">{item.type}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.source === 'ai_generated' && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-semibold border border-purple-500/30">
                      AI
                    </span>
                  )}
                  <Eye size={16} className="text-slate-400 hover:text-white" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Selected Item Preview Modal */}
        {selectedItem && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#1c1c1e] border border-white/15 rounded-3xl p-6 max-w-md w-full space-y-4 relative shadow-2xl overflow-hidden">
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 text-white/50 hover:text-white p-1 rounded-full bg-white/5"
              >
                <X size={18} />
              </button>

              {/* Large Preview */}
              <div className="rounded-2xl overflow-hidden bg-black/60 max-h-64 flex items-center justify-center border border-white/10">
                {selectedItem.type === 'image' && selectedItem.url ? (
                  <img src={selectedItem.url} alt={selectedItem.name} className="max-h-60 w-auto object-contain" />
                ) : selectedItem.type === 'video' && selectedItem.url ? (
                  <video src={selectedItem.url} controls className="max-h-60 w-full" />
                ) : (
                  <div className="p-8 text-center space-y-2">
                    {getItemIcon(selectedItem.type)}
                    <p className="text-xs text-white/70 font-semibold">{selectedItem.name}</p>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-base font-bold text-white truncate">{selectedItem.name}</h3>
                <p className="text-xs text-white/50 mt-0.5">
                  Type: <span className="capitalize text-white/80">{selectedItem.type}</span> • Size: {selectedItem.size || '1.5 MB'}
                </p>
                {selectedItem.prompt && (
                  <div className="mt-2 p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-cyan-300 italic">
                    "{selectedItem.prompt}"
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => {
                    sendImageToChat(`I'd like to discuss this file asset: "${selectedItem.name}"`, selectedItem.url ? [{ id: selectedItem.id, url: selectedItem.url, name: selectedItem.name }] : []);
                    setSelectedItem(null);
                    toast.success(`Sent "${selectedItem.name}" to Chat AI!`);
                  }}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-xl text-xs font-semibold border border-cyan-500/40 transition-colors cursor-pointer"
                >
                  <MessageSquare size={14} />
                  <span>Share to Chat</span>
                </button>

                {selectedItem.url && (
                  <a
                    href={selectedItem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-3 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
                  >
                    <ExternalLink size={14} />
                    <span>Open</span>
                  </a>
                )}

                <button
                  onClick={() => handleDeleteItem(selectedItem.id)}
                  className="col-span-2 flex items-center justify-center gap-2 px-3 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl text-xs font-semibold border border-red-500/30 transition-colors cursor-pointer"
                >
                  <Trash2 size={14} />
                  <span>Delete from Store</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DedicatedPanel>
  );
}

// ============================================================
// 3. PROJECTS SCREEN & DETAIL
// ============================================================

export function ProjectsUI({
  onBackToChat,
  onSelectProject,
}: {
  onBackToChat?: () => void;
  onSelectProject?: (projectName: string) => void;
}) {
  const [projects, setProjects] = useState<ProjectItem[]>(() =>
    getStoredData('app_projects_list', DEFAULT_PROJECTS)
  );
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Created by you' | 'Shared'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeProject, setActiveProject] = useState<ProjectItem | null>(null);

  // Modal Inputs
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');

  useEffect(() => {
    setStoredData('app_projects_list', projects);
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter((proj) => {
      const matchesFilter =
        selectedFilter === 'All' ? true : proj.category === selectedFilter;
      const matchesSearch = proj.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [projects, selectedFilter, searchQuery]);

  const handleCreateProject = () => {
    if (!newProjectName.trim()) {
      toast.error('Project name is required');
      return;
    }

    const newProj: ProjectItem = {
      id: `proj-${Date.now()}`,
      name: newProjectName,
      description: newProjectDesc,
      createdAt: 'Just now',
      updatedAt: 'Just now',
      category: 'Created by you',
    };

    const updated = [newProj, ...projects];
    setProjects(updated);
    setIsCreateModalOpen(false);
    setNewProjectName('');
    setNewProjectDesc('');
    toast.success(`Project "${newProj.name}" created!`);
  };

  const handleDeleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    setActiveProject(null);
    toast.success('Project deleted');
  };

  // If viewing project detail
  if (activeProject) {
    return (
      <ProjectDetailView
        project={activeProject}
        onBack={() => setActiveProject(null)}
        onDelete={() => handleDeleteProject(activeProject.id)}
        onSelectChat={() => {
          if (onSelectProject) onSelectProject(activeProject.name);
        }}
      />
    );
  }

  return (
    <DedicatedPanel
      title="Projects"
      onBackToChat={onBackToChat}
      headerRightAction={
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="w-11 h-11 rounded-full bg-[#1c1c1e] text-white flex items-center justify-center border border-white/10 hover:bg-[#2c2c2e] cursor-pointer active:scale-95 transition-all"
        >
          <Plus size={24} />
        </button>
      }
    >
      <div className="space-y-6">
        {/* Filter Pills */}
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
          {(['All', 'Created by you', 'Shared'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-5 py-1.5 rounded-full text-base font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedFilter === filter
                  ? 'bg-[#3a3a3c] text-white shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Project List Rows */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-20 text-white/40 space-y-2">
            <FolderIcon size={44} className="mx-auto text-white/20" />
            <p className="text-lg font-medium">No projects found</p>
          </div>
        ) : (
          <div className="space-y-1.5 pb-28">
            {filteredProjects.map((proj) => (
              <div
                key={proj.id}
                onClick={() => setActiveProject(proj)}
                className="flex items-center gap-4 py-3.5 px-2.5 rounded-2xl hover:bg-white/5 cursor-pointer transition-colors border-b border-white/5 group"
              >
                {/* Folder icon in dark rounded square */}
                <div className="w-12 h-12 bg-[#1c1c1e] border border-white/10 rounded-2xl flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                  <FolderIcon size={22} />
                </div>

                {/* Project details */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white truncate">
                    {proj.name}
                  </h3>
                  <p className="text-sm text-white/50 mt-0.5">
                    {proj.updatedAt || proj.createdAt}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Floating Search Bar */}
        <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto bg-[#1c1c1e] border border-white/10 rounded-full px-5 py-3 flex items-center gap-3 text-white shadow-2xl z-40">
          <Search size={22} className="text-white/50 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            className="bg-transparent text-white text-base placeholder-white/50 focus:outline-none flex-1 min-w-0"
          />
        </div>

        {/* Create Project Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#1c1c1e] border border-white/15 rounded-3xl p-6 max-w-sm w-full space-y-5 relative shadow-2xl">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="absolute top-4 right-4 text-white/50 hover:text-white"
              >
                <X size={20} />
              </button>

              <h3 className="text-xl font-bold text-white">Create Project</h3>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-white/60 block mb-1">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="e.g. Prompt"
                    className="w-full bg-[#121214] border border-white/15 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-white/40"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-white/60 block mb-1">
                    Description
                  </label>
                  <textarea
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                    placeholder="Optional description"
                    rows={2}
                    className="w-full bg-[#121214] border border-white/15 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-white/40 resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-white/60 hover:text-white text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateProject}
                  className="px-5 py-2.5 rounded-xl bg-white text-black font-semibold text-sm hover:bg-white/90 transition-colors"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DedicatedPanel>
  );
}

// ============================================================
// PROJECT DETAIL VIEW
// ============================================================

function ProjectDetailView({
  project,
  onBack,
  onDelete,
  onSelectChat,
}: {
  project: ProjectItem;
  onBack: () => void;
  onDelete: () => void;
  onSelectChat: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'Chats' | 'Files' | 'Images' | 'Instructions'>('Chats');
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/95 backdrop-blur-md px-4 py-3.5 flex items-center justify-between border-b border-white/10">
        <button
          onClick={onBack}
          className="w-11 h-11 rounded-full bg-[#1c1c1e] text-white flex items-center justify-center border border-white/10 active:scale-95 transition-all cursor-pointer"
        >
          <ArrowLeft size={22} />
        </button>

        <h1 className="text-2xl font-bold tracking-tight text-white text-center flex-1 mx-2 truncate">
          {project.name}
        </h1>

        <div className="relative">
          <button
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            className="w-11 h-11 rounded-full bg-[#1c1c1e] text-white flex items-center justify-center border border-white/10 active:scale-95 cursor-pointer"
          >
            <MoreVertical size={20} />
          </button>

          {isMoreOpen && (
            <div className="absolute right-0 top-12 w-48 bg-[#2c2c2e] border border-white/10 rounded-2xl p-1.5 shadow-2xl space-y-1 z-50">
              <button
                onClick={() => {
                  toast.info('Rename project');
                  setIsMoreOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-white hover:bg-white/10 rounded-xl text-sm font-medium transition-colors"
              >
                <Edit2 size={16} />
                <span>Rename</span>
              </button>
              <button
                onClick={() => {
                  toast.info('Project archived');
                  setIsMoreOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-white hover:bg-white/10 rounded-xl text-sm font-medium transition-colors"
              >
                <Archive size={16} />
                <span>Archive</span>
              </button>
              <button
                onClick={() => {
                  onDelete();
                  setIsMoreOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-red-400 hover:bg-white/10 rounded-xl text-sm font-medium transition-colors"
              >
                <Trash2 size={16} />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-2xl w-full mx-auto px-4 pt-4 flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-white/10 pb-3">
        {(['Chats', 'Files', 'Images', 'Instructions'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-full text-base font-semibold transition-all cursor-pointer ${
              activeTab === tab
                ? 'bg-[#3a3a3c] text-white shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 space-y-4">
        {activeTab === 'Chats' && (
          <div className="space-y-3">
            <button
              onClick={onSelectChat}
              className="w-full py-3.5 px-4 bg-[#1c1c1e] hover:bg-[#2c2c2e] border border-white/10 rounded-2xl flex items-center justify-between font-semibold text-white transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <MessageSquare size={20} className="text-cyan-400" />
                <span>Start project chat</span>
              </div>
              <Plus size={20} />
            </button>

            <div className="p-4 bg-[#121214] border border-white/10 rounded-2xl space-y-1 cursor-pointer hover:border-white/20" onClick={onSelectChat}>
              <h4 className="font-semibold text-white">Project Research Discussion</h4>
              <p className="text-xs text-white/50">Last updated yesterday</p>
            </div>
          </div>
        )}

        {activeTab === 'Files' && (
          <div className="space-y-3">
            <label className="w-full py-3.5 px-4 bg-[#1c1c1e] hover:bg-[#2c2c2e] border border-white/10 rounded-2xl flex items-center justify-between font-semibold text-white transition-all cursor-pointer">
              <div className="flex items-center gap-3">
                <FileUp size={20} className="text-amber-400" />
                <span>Upload file to project</span>
              </div>
              <input
                type="file"
                className="hidden"
                onChange={() => toast.success('File added to project!')}
              />
            </label>
            <div className="text-center py-10 text-white/40 text-sm">
              No files uploaded to this project yet.
            </div>
          </div>
        )}

        {activeTab === 'Images' && (
          <div className="text-center py-10 text-white/40 text-sm">
            Generated images for this project will appear here.
          </div>
        )}

        {activeTab === 'Instructions' && (
          <div className="bg-[#121214] border border-white/10 rounded-2xl p-4 space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Custom AI Instructions</h4>
            <textarea
              placeholder="Add project-specific instructions or system guidance for AI..."
              rows={4}
              className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-white/30 resize-none"
            />
            <button
              onClick={() => toast.success('Instructions saved for project')}
              className="px-4 py-2 bg-white text-black font-semibold text-xs rounded-xl hover:bg-white/90"
            >
              Save Instructions
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export { ResourceSearchUI };
