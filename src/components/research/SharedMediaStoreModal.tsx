import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Image as ImageIcon, 
  Video, 
  FileText, 
  Upload, 
  Trash2, 
  Send, 
  Sparkles, 
  Download, 
  Search, 
  HardDrive, 
  Check, 
  ExternalLink,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  getSharedMediaItems, 
  deleteSharedMediaItem, 
  clearSharedMediaStore, 
  addSharedMediaItem, 
  SharedMediaItem 
} from '@/lib/mediaStore';

interface SharedMediaStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShareToAI?: (item: SharedMediaItem) => void;
}

export const SharedMediaStoreModal: React.FC<SharedMediaStoreModalProps> = ({
  isOpen,
  onClose,
  onShareToAI
}) => {
  const [items, setItems] = useState<SharedMediaItem[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'image' | 'video' | 'document' | 'ai'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPreview, setSelectedPreview] = useState<SharedMediaItem | null>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const loadItems = () => {
    setItems(getSharedMediaItems());
  };

  useEffect(() => {
    if (isOpen) {
      loadItems();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleUpdate = () => loadItems();
    window.addEventListener('shared_media_updated', handleUpdate);
    return () => window.removeEventListener('shared_media_updated', handleUpdate);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const fileList = Array.from(e.target.files);

    fileList.forEach(file => {
      let type: 'image' | 'video' | 'document' | 'other' = 'document';
      if (file.type.startsWith('image/')) type = 'image';
      else if (file.type.startsWith('video/')) type = 'video';

      const fileUrl = URL.createObjectURL(file);

      addSharedMediaItem({
        name: file.name,
        type,
        url: fileUrl,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        source: 'user_uploaded',
        mimeType: file.type
      });
    });

    toast.success(`Stored ${fileList.length} item(s) in AI Media Store`);
  };

  const handleDelete = (id: string, name: string) => {
    deleteSharedMediaItem(id);
    toast.info(`Removed ${name}`);
    if (selectedPreview?.id === id) {
      setSelectedPreview(null);
    }
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear all stored media and files?")) {
      clearSharedMediaStore();
      toast.success("Media store cleared");
    }
  };

  const filteredItems = items.filter(item => {
    if (activeTab === 'image' && item.type !== 'image') return false;
    if (activeTab === 'video' && item.type !== 'video') return false;
    if (activeTab === 'document' && item.type !== 'document') return false;
    if (activeTab === 'ai' && item.source !== 'ai_generated') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchPrompt = item.prompt?.toLowerCase().includes(q);
      return matchName || matchPrompt;
    }

    return true;
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          className="bg-[#121620] border border-white/12 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Hidden File Input */}
          <input
            ref={uploadInputRef}
            type="file"
            multiple
            accept="image/*,video/*,.pdf,.doc,.docx,.txt,.csv,.json"
            className="hidden"
            onChange={handleFileUpload}
          />

          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between gap-3 bg-[#181d2a]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center font-bold">
                <HardDrive size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>AI Picture, Video & File Store</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold">
                    {items.length} Saved
                  </span>
                </h2>
                <p className="text-xs text-white/50">
                  Central repository of pictures, videos & documents shared with AI
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => uploadInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus size={14} />
                <span className="hidden sm:inline">Upload New</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Controls Bar: Search & Tabs */}
          <div className="p-3 sm:p-4 border-b border-white/8 bg-[#141924] flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                placeholder="Search stored pictures, videos, files..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-white/40 focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            {/* Category Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
              {[
                { id: 'all', label: 'All', icon: HardDrive },
                { id: 'image', label: 'Pictures', icon: ImageIcon },
                { id: 'video', label: 'Videos', icon: Video },
                { id: 'document', label: 'Files', icon: FileText },
                { id: 'ai', label: 'AI Made', icon: Sparkles }
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer shrink-0 border",
                      isActive
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                        : "bg-white/5 text-white/60 hover:text-white border-transparent"
                    )}
                  >
                    <Icon size={13} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grid Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[280px]">
            {filteredItems.length === 0 ? (
              <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center p-6 text-white/40">
                <HardDrive size={36} className="mb-2 text-white/20" />
                <p className="text-sm font-semibold text-white/70">No shared media found</p>
                <p className="text-xs text-white/40 mt-1 max-w-xs">
                  Upload pictures, videos, or files here, or generate images and videos in chat to populate this library.
                </p>
                <button
                  type="button"
                  onClick={() => uploadInputRef.current?.click()}
                  className="mt-4 px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold flex items-center gap-2 cursor-pointer"
                >
                  <Upload size={14} />
                  <span>Upload File or Picture</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {filteredItems.map(item => (
                  <div
                    key={item.id}
                    className="group bg-[#1a202c] border border-white/8 hover:border-cyan-500/40 rounded-2xl p-3 transition-all flex flex-col justify-between shadow-md relative"
                  >
                    {/* Top Preview Area */}
                    <div className="aspect-video w-full rounded-xl bg-black/60 overflow-hidden relative mb-2.5 flex items-center justify-center border border-white/5">
                      {item.type === 'image' && item.url ? (
                        <img
                          src={item.url}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : item.type === 'video' && item.url ? (
                        <video
                          src={item.url}
                          className="w-full h-full object-cover"
                          muted
                          loop
                          onMouseOver={e => (e.target as any).play().catch(() => {})}
                          onMouseOut={e => (e.target as any).pause()}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center p-3 text-white/40 text-center">
                          <FileText size={28} className="text-cyan-400 mb-1" />
                          <span className="text-[10px] font-mono text-white/60 truncate max-w-full px-2">
                            {item.size || 'Document'}
                          </span>
                        </div>
                      )}

                      {/* Source Tag Badge */}
                      <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider backdrop-blur-md bg-black/70 border border-white/10 text-white flex items-center gap-1">
                        {item.source === 'ai_generated' ? (
                          <>
                            <Sparkles size={10} className="text-cyan-400" />
                            <span className="text-cyan-300">AI Generated</span>
                          </>
                        ) : (
                          <>
                            <Upload size={10} className="text-amber-400" />
                            <span className="text-amber-300">Uploaded</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Metadata & Actions */}
                    <div>
                      <h4 className="text-xs font-bold text-white truncate" title={item.name}>
                        {item.name}
                      </h4>
                      {item.prompt && (
                        <p className="text-[10px] text-white/50 italic line-clamp-1 mt-0.5">
                          "{item.prompt}"
                        </p>
                      )}
                      <div className="text-[10px] text-white/40 mt-1 flex items-center justify-between">
                        <span>{item.size || 'Saved'}</span>
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="mt-3 pt-2 border-t border-white/6 flex items-center justify-between gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (onShareToAI) {
                            onShareToAI(item);
                            toast.success(`Shared "${item.name}" with AI`);
                            onClose();
                          }
                        }}
                        className="flex-1 py-1 px-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        title="Send this file to AI prompt"
                      >
                        <Send size={11} />
                        <span>Share to AI</span>
                      </button>

                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                          title="Open full preview"
                        >
                          <ExternalLink size={13} />
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDelete(item.id, item.name)}
                        className="p-1.5 text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/20 rounded-lg transition-colors cursor-pointer"
                        title="Delete from store"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="p-3 sm:p-4 border-t border-white/10 bg-[#141924] flex items-center justify-between text-xs text-white/50">
            <span>
              Total {items.length} item(s) available for AI reference
            </span>
            {items.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-rose-400 hover:text-rose-300 hover:underline text-xs cursor-pointer font-medium"
              >
                Clear All
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
