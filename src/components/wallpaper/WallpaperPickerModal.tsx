import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Upload,
  Film,
  Image as ImageIcon,
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Check,
  Trash2,
  Link,
  Sliders,
  RotateCcw,
  Maximize2,
  Info,
  Clock,
  HardDrive,
} from 'lucide-react';
import { useSettingsStore } from '@/lib/settingsStore';
import {
  saveWallpaperBlob,
  getAllCustomWallpapers,
  deleteCustomWallpaper,
  getVideoMetadata,
  CustomWallpaperRecord,
} from '@/lib/wallpaperStorage';
import { toast } from 'sonner';

interface WallpaperPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'video' | 'image' | 'live' | 'presets';
}

interface CuratedVideo {
  id: string;
  name: string;
  category: string;
  icon: string;
  url: string;
  description: string;
}

const CURATED_VIDEO_WALLPAPERS: CuratedVideo[] = [
  {
    id: 'samurai-eclipse',
    name: 'Samurai Blood Eclipse',
    category: 'Anime Action',
    icon: '⚔️',
    url: '/samurai-background.mp4',
    description: 'Cinematic anime warrior with glowing blood moon and cherry petals',
  },
  {
    id: 'quantum-circuit',
    name: 'Quantum Circuit',
    category: 'Sci-Fi Tech',
    icon: '⚡',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-circuit-board-with-moving-electrons-41525-large.mp4',
    description: 'Pulsing electron streams moving along high-tech microchip tracks',
  },
  {
    id: 'ocean-surface',
    name: 'Deep Blue Ocean',
    category: 'Nature / Calm',
    icon: '🌊',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-blue-water-surface-in-slow-motion-41517-large.mp4',
    description: 'Slow-motion azure water caustic ripples and reflections',
  },
  {
    id: 'cosmic-starfield',
    name: 'Cosmic Starfield',
    category: 'Space / Galaxy',
    icon: '🌠',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-background-1610-large.mp4',
    description: 'Deep cosmic journey through twinkling constellations & galaxies',
  },
  {
    id: 'cyber-neon-city',
    name: 'Cyberpunk Neon Rain',
    category: 'Cyberpunk',
    icon: '🌆',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-top-view-of-a-futuristic-city-42616-large.mp4',
    description: 'Futuristic neon skyline with atmospheric volumetric fog',
  },
  {
    id: 'abstract-fluid',
    name: 'Iridescent Fluid Dynamics',
    category: 'Abstract 4K',
    icon: '🎨',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-ink-swirling-in-water-in-slow-motion-41528-large.mp4',
    description: 'Luminous metallic fluid swirls drifting gracefully in 60FPS',
  },
];

export const WallpaperPickerModal: React.FC<WallpaperPickerModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'video',
}) => {
  const { settings, setSetting } = useSettingsStore();
  const [activeTab, setActiveTab] = useState<'video' | 'image' | 'live' | 'presets'>(initialTab);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [savedWallpapers, setSavedWallpapers] = useState<CustomWallpaperRecord[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [previewVideoSrc, setPreviewVideoSrc] = useState<string | null>(null);
  const [previewMeta, setPreviewMeta] = useState<{ duration?: number; width?: number; height?: number; name?: string } | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(true);

  const videoInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadSavedWallpapers();
      if (settings.backgroundMode === 'custom-video' && settings.customVideoUrl) {
        setPreviewVideoSrc(settings.customVideoUrl);
        setPreviewMeta({ name: settings.customVideoName || 'Custom Video' });
      }
    }
  }, [isOpen]);

  const loadSavedWallpapers = async () => {
    try {
      const records = await getAllCustomWallpapers();
      setSavedWallpapers(records);
    } catch (e) {
      console.warn('Could not load custom wallpapers from storage', e);
    }
  };

  const handleVideoFileUpload = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('video/') && !file.name.match(/\.(mp4|webm|mov|mkv|m4v|avi)$/i)) {
      toast.error('Please select a valid video file (.mp4, .webm, .mov, .mkv, .m4v)');
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading(`Importing & indexing video "${file.name}"...`);

    try {
      const meta = await getVideoMetadata(file);
      const id = `video_${Date.now()}`;
      const blobUrl = await saveWallpaperBlob(id, file, 'video', file.name, meta.thumbnail);

      setSetting('customVideoUrl', blobUrl);
      setSetting('customVideoId', id);
      setSetting('customVideoName', file.name);
      setSetting('backgroundMode', 'custom-video');
      setSetting('videoBackgroundEnabled', true);

      setPreviewVideoSrc(blobUrl);
      setPreviewMeta({
        name: file.name,
        duration: meta.duration,
        width: meta.width,
        height: meta.height,
      });

      toast.success(`Video wallpaper "${file.name}" applied & saved!`, { id: toastId });
      await loadSavedWallpapers();
    } catch (err) {
      console.error('Error saving video wallpaper:', err);
      // Fallback object URL
      const directUrl = URL.createObjectURL(file);
      setSetting('customVideoUrl', directUrl);
      setSetting('customVideoName', file.name);
      setSetting('backgroundMode', 'custom-video');
      setSetting('videoBackgroundEnabled', true);
      setPreviewVideoSrc(directUrl);
      setPreviewMeta({ name: file.name });
      toast.success(`Video wallpaper applied!`, { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageFileUpload = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        setSetting('customBackgroundImage', dataUrl);
        setSetting('backgroundMode', 'custom-image');
        setSetting('videoBackgroundEnabled', true);
        toast.success('Custom image wallpaper applied!');

        try {
          const id = `img_${Date.now()}`;
          await saveWallpaperBlob(id, file, 'image', file.name, dataUrl);
          await loadSavedWallpapers();
        } catch {
          // ignore
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyVideoUrl = () => {
    const url = customUrlInput.trim();
    if (!url) {
      toast.error('Please enter a valid video URL');
      return;
    }

    setSetting('customVideoUrl', url);
    setSetting('customVideoName', 'Web Video Stream');
    setSetting('backgroundMode', 'custom-video');
    setSetting('videoBackgroundEnabled', true);
    setPreviewVideoSrc(url);
    setPreviewMeta({ name: 'Web Video Stream' });
    toast.success('Web video wallpaper applied!');
    setCustomUrlInput('');
  };

  const handleSelectCuratedVideo = (video: CuratedVideo) => {
    if (video.id === 'samurai-eclipse') {
      setSetting('customVideoUrl', '');
      setSetting('backgroundMode', 'samurai-video');
    } else {
      setSetting('customVideoUrl', video.url);
      setSetting('customVideoName', video.name);
      setSetting('backgroundMode', 'custom-video');
    }
    setSetting('videoBackgroundEnabled', true);
    setPreviewVideoSrc(video.url);
    setPreviewMeta({ name: video.name });
    toast.success(`Applied "${video.name}" wallpaper!`);
  };

  const handleApplySavedWallpaper = (rec: CustomWallpaperRecord) => {
    if (rec.type === 'video') {
      const url = URL.createObjectURL(rec.blob);
      setSetting('customVideoUrl', url);
      setSetting('customVideoId', rec.id);
      setSetting('customVideoName', rec.name);
      setSetting('backgroundMode', 'custom-video');
      setSetting('videoBackgroundEnabled', true);
      setPreviewVideoSrc(url);
      setPreviewMeta({
        name: rec.name,
        duration: rec.duration,
        width: rec.width,
        height: rec.height,
      });
      toast.success(`Applied video "${rec.name}"!`);
    } else {
      const url = rec.dataUrl || URL.createObjectURL(rec.blob);
      setSetting('customBackgroundImage', url);
      setSetting('customImageId', rec.id);
      setSetting('backgroundMode', 'custom-image');
      setSetting('videoBackgroundEnabled', true);
      toast.success(`Applied image "${rec.name}"!`);
    }
  };

  const handleDeleteSavedWallpaper = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteCustomWallpaper(id);
      await loadSavedWallpapers();
      toast.info('Wallpaper removed from saved list');
    } catch {
      toast.error('Failed to delete wallpaper');
    }
  };

  const handleResetToDefault = () => {
    setSetting('backgroundMode', 'anime-warrior');
    setSetting('customVideoUrl', '');
    setSetting('customBackgroundImage', '');
    setSetting('videoPlaybackSpeed', 1.0);
    setSetting('videoBackgroundOverlay', 0.35);
    setSetting('videoBlur', 0);
    setSetting('videoMuted', true);
    setPreviewVideoSrc(null);
    setPreviewMeta(null);
    toast.info('Reset to default Anime Warrior wallpaper');
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('video/') || file.name.match(/\.(mp4|webm|mov|mkv|m4v)$/i)) {
        setActiveTab('video');
        handleVideoFileUpload(file);
      } else if (file.type.startsWith('image/')) {
        setActiveTab('image');
        handleImageFileUpload(file);
      } else {
        toast.error('Please drop a video (.mp4, .webm, .mov) or image file.');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={`bg-[#0e0e14] border rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl text-white transition-colors duration-200 ${
            isDraggingOver
              ? 'border-orange-500 ring-4 ring-orange-500/20 shadow-orange-500/20'
              : 'border-white/12'
          }`}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-black/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500/20 to-purple-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
                <Film size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Dynamic Wallpaper & Video Studio</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30">
                    60-120 FPS
                  </span>
                </h2>
                <p className="text-xs text-white/50">
                  Select and display local video files, live shader presets, or 4K animated backgrounds.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetToDefault}
                title="Reset to default wallpaper"
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer border border-white/10"
              >
                <RotateCcw size={13} />
                <span className="hidden sm:inline">Reset</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="px-6 pt-3 pb-2 border-b border-white/10 flex items-center gap-2 bg-black/20 overflow-x-auto no-scrollbar">
            {[
              { id: 'video', label: '🎥 Local & 4K Video', desc: 'Custom local files & 4K streams' },
              { id: 'live', label: '🌌 Live Shaders', desc: '60FPS Interactive' },
              { id: 'presets', label: '⚔️ Anime & Legends', desc: 'Anime & Gojo Satoru' },
              { id: 'image', label: '🖼️ Custom Image', desc: 'Photo & Art' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-2xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap border ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-orange-500/20 to-purple-500/20 border-orange-500/50 text-white shadow-lg shadow-orange-500/10 ring-1 ring-orange-500/30'
                    : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* ──────────────────────────────────────────────────────────── */}
            {/* TAB 1: LOCAL & 4K VIDEO WALLPAPERS */}
            {/* ──────────────────────────────────────────────────────────── */}
            {activeTab === 'video' && (
              <div className="space-y-6">
                {/* Upload & Dropzone Box */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Local Video File Picker & Dropzone */}
                  <div
                    onClick={() => videoInputRef.current?.click()}
                    className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 cursor-pointer transition-all ${
                      isDraggingOver
                        ? 'bg-orange-500/20 border-orange-500/80 scale-[1.01]'
                        : 'bg-gradient-to-br from-orange-500/[0.08] to-purple-500/[0.04] border-orange-500/30 hover:border-orange-500/50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-semibold text-white">
                          <Upload size={16} className="text-orange-400" />
                          <span>Select Local Video File</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-orange-500/20 text-orange-300 font-bold border border-orange-500/30">
                          Offline & Instant
                        </span>
                      </div>
                      <p className="text-xs text-white/60 mt-1.5 leading-relaxed">
                        Drag and drop your local video or click to select from storage. Supports <strong>.mp4, .webm, .mov, .mkv</strong> up to 4K 120 FPS.
                      </p>
                    </div>

                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime,video/m4v,video/x-matroska,video/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleVideoFileUpload(file);
                      }}
                    />

                    <div className="w-full py-3 px-4 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all">
                      <Film size={16} />
                      <span>{isUploading ? 'Importing Video...' : 'Browse Local Files / Drop Video Here'}</span>
                    </div>
                  </div>

                  {/* Direct Web Video Stream URL */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/10 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-white">
                        <Link size={16} className="text-cyan-400" />
                        <span>Web Video Stream / URL</span>
                      </div>
                      <p className="text-xs text-white/50 mt-1.5 leading-relaxed">
                        Paste a direct URL to any remote MP4/WebM video stream or online animated wallpaper.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        placeholder="https://.../video.mp4 or stream link"
                        value={customUrlInput}
                        onChange={(e) => setCustomUrlInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleApplyVideoUrl()}
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50"
                      />
                      <button
                        type="button"
                        onClick={handleApplyVideoUrl}
                        className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold border border-cyan-500/40 transition-colors cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>

                {/* Live Video Preview Box (If a video is active) */}
                {previewVideoSrc && (
                  <div className="p-4 rounded-2xl bg-black/60 border border-orange-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-orange-400">
                        <Film size={14} />
                        <span>Active Video Background Preview</span>
                      </div>
                      {previewMeta?.name && (
                        <span className="text-[11px] text-white/60 truncate max-w-xs">
                          {previewMeta.name}
                        </span>
                      )}
                    </div>

                    <div className="relative w-full h-48 sm:h-56 rounded-xl overflow-hidden bg-black/80 border border-white/10 flex items-center justify-center group">
                      <video
                        ref={previewVideoRef}
                        src={previewVideoSrc}
                        autoPlay
                        loop
                        muted={settings.videoMuted ?? true}
                        playsInline
                        className={`w-full h-full ${
                          settings.videoFit === 'contain' ? 'object-contain' : 'object-cover'
                        }`}
                        style={{
                          filter: `brightness(${settings.backgroundMode === 'custom-video' ? 1.1 : 1}) ${
                            (settings.videoBlur ?? 0) > 0 ? `blur(${settings.videoBlur}px)` : ''
                          }`,
                        }}
                      />

                      {/* Video Overlay Tint Preview */}
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          backgroundColor: `rgba(5, 4, 10, ${settings.videoBackgroundOverlay ?? 0.35})`,
                        }}
                      />

                      {/* Play/Pause Control Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (previewVideoRef.current) {
                              if (previewVideoRef.current.paused) {
                                previewVideoRef.current.play();
                                setIsPreviewPlaying(true);
                              } else {
                                previewVideoRef.current.pause();
                                setIsPreviewPlaying(false);
                              }
                            }
                          }}
                          className="w-12 h-12 rounded-full bg-black/70 hover:bg-orange-500 text-white flex items-center justify-center transition-all shadow-xl cursor-pointer"
                        >
                          {isPreviewPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
                        </button>
                      </div>

                      {/* Resolution & Duration Tag */}
                      <div className="absolute bottom-2 left-2 flex items-center gap-2">
                        {previewMeta?.width && previewMeta?.height && (
                          <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-mono text-white/80 border border-white/10">
                            {previewMeta.width}x{previewMeta.height}
                          </span>
                        )}
                        {previewMeta?.duration ? (
                          <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-mono text-white/80 border border-white/10 flex items-center gap-1">
                            <Clock size={10} />
                            {Math.round(previewMeta.duration)}s
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )}

                {/* My Uploaded / Saved Local Video Wallpapers */}
                {savedWallpapers.filter((w) => w.type === 'video').length > 0 && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-white/80 uppercase tracking-wider flex items-center gap-1.5">
                        <HardDrive size={14} className="text-orange-400" />
                        <span>Saved Local Videos ({savedWallpapers.filter((w) => w.type === 'video').length})</span>
                      </h3>
                      <span className="text-[11px] text-white/40">Stored locally in IndexedDB</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {savedWallpapers
                        .filter((w) => w.type === 'video')
                        .map((rec) => {
                          const isActive = settings.customVideoId === rec.id;
                          return (
                            <div
                              key={rec.id}
                              onClick={() => handleApplySavedWallpaper(rec)}
                              className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 relative group ${
                                isActive
                                  ? 'bg-orange-500/20 border-orange-500/60 ring-1 ring-orange-500/40 shadow-lg shadow-orange-500/10'
                                  : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                              }`}
                            >
                              {rec.thumbnail ? (
                                <div className="w-full h-24 rounded-xl overflow-hidden bg-black/40 border border-white/10 relative">
                                  <img
                                    src={rec.thumbnail}
                                    alt={rec.name}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Play size={20} className="text-white drop-shadow" />
                                  </div>
                                </div>
                              ) : (
                                <div className="w-full h-20 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center text-white/40">
                                  <Film size={24} />
                                </div>
                              )}

                              <div className="flex items-start justify-between gap-2">
                                <div className="truncate flex-1">
                                  <div className="text-xs font-semibold text-white truncate">{rec.name}</div>
                                  <div className="text-[10px] text-white/40 flex items-center gap-1.5 mt-0.5">
                                    <span>{(rec.size / (1024 * 1024)).toFixed(1)} MB</span>
                                    {rec.duration ? <span>• {Math.round(rec.duration)}s</span> : null}
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  title="Delete video from storage"
                                  onClick={(e) => handleDeleteSavedWallpaper(e, rec.id)}
                                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-rose-500/20 hover:text-rose-300 text-white/40 flex items-center justify-center transition-colors cursor-pointer"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>

                              {isActive && (
                                <div className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                                  <Check size={11} /> Currently Active
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Featured 4K Curated Video Wallpapers */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-white/80 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles size={14} className="text-yellow-400" />
                      <span>Featured 4K Animated Wallpapers</span>
                    </h3>
                    <span className="text-[11px] text-white/40">Click to apply</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {CURATED_VIDEO_WALLPAPERS.map((video) => {
                      const isActive =
                        (settings.backgroundMode === 'custom-video' && settings.customVideoUrl === video.url) ||
                        (video.id === 'samurai-eclipse' && settings.backgroundMode === 'samurai-video');

                      return (
                        <div
                          key={video.id}
                          onClick={() => handleSelectCuratedVideo(video)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 relative overflow-hidden group ${
                            isActive
                              ? 'bg-gradient-to-br from-orange-500/20 to-purple-500/20 border-orange-500/60 ring-1 ring-orange-500/40 shadow-lg shadow-orange-500/10'
                              : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <span className="text-2xl">{video.icon}</span>
                            {isActive ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-black text-[10px] font-bold flex items-center gap-1">
                                <Check size={11} /> Active
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/60 font-medium">
                                {video.category}
                              </span>
                            )}
                          </div>

                          <div>
                            <div className="text-xs font-bold text-white group-hover:text-orange-300 transition-colors">
                              {video.name}
                            </div>
                            <div className="text-[11px] text-white/50 line-clamp-2 mt-0.5">
                              {video.description}
                            </div>
                          </div>

                          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-white/60 font-medium">
                            <span className="flex items-center gap-1 text-cyan-400 group-hover:underline">
                              <Play size={11} /> Set Video Wallpaper
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Video Playback & Styling Controls */}
                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                    <Sliders size={14} className="text-cyan-400" />
                    <span>Live Video Wallpaper Settings</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Playback Speed */}
                    <div>
                      <span className="text-[11px] text-white/60 block mb-1.5 font-medium">
                        Speed ({settings.videoPlaybackSpeed ?? 1.0}x)
                      </span>
                      <div className="flex items-center gap-1">
                        {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((spd) => (
                          <button
                            key={spd}
                            type="button"
                            onClick={() => setSetting('videoPlaybackSpeed', spd)}
                            className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                              (settings.videoPlaybackSpeed ?? 1.0) === spd
                                ? 'bg-orange-500/30 border-orange-500/60 text-orange-200'
                                : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                            }`}
                          >
                            {spd}x
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Dark Overlay Tint */}
                    <div>
                      <span className="text-[11px] text-white/60 block mb-1.5 font-medium">
                        Dark Dimmer ({Math.round((settings.videoBackgroundOverlay ?? 0.35) * 100)}%)
                      </span>
                      <div className="flex items-center gap-1">
                        {[
                          { val: 0.15, label: '15%' },
                          { val: 0.3, label: '30%' },
                          { val: 0.45, label: '45%' },
                          { val: 0.6, label: '60%' },
                        ].map((dim) => (
                          <button
                            key={dim.val}
                            type="button"
                            onClick={() => setSetting('videoBackgroundOverlay', dim.val)}
                            className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                              (settings.videoBackgroundOverlay ?? 0.35) === dim.val
                                ? 'bg-cyan-500/30 border-cyan-500/60 text-cyan-200'
                                : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                            }`}
                          >
                            {dim.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Blur Effect */}
                    <div>
                      <span className="text-[11px] text-white/60 block mb-1.5 font-medium">
                        Frost Blur ({settings.videoBlur ?? 0}px)
                      </span>
                      <div className="flex items-center gap-1">
                        {[
                          { val: 0, label: 'Off' },
                          { val: 4, label: '4px' },
                          { val: 8, label: '8px' },
                          { val: 12, label: '12px' },
                        ].map((bl) => (
                          <button
                            key={bl.val}
                            type="button"
                            onClick={() => setSetting('videoBlur', bl.val)}
                            className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                              (settings.videoBlur ?? 0) === bl.val
                                ? 'bg-purple-500/30 border-purple-500/60 text-purple-200'
                                : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                            }`}
                          >
                            {bl.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Audio Sound Toggle */}
                    <div>
                      <span className="text-[11px] text-white/60 block mb-1.5 font-medium">
                        Audio Sound
                      </span>
                      <button
                        type="button"
                        onClick={() => setSetting('videoMuted', !settings.videoMuted)}
                        className="w-full py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-white/80 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {settings.videoMuted ? (
                          <>
                            <VolumeX size={14} className="text-white/50" />
                            <span>Muted (Silent)</span>
                          </>
                        ) : (
                          <>
                            <Volume2 size={14} className="text-emerald-400" />
                            <span className="text-emerald-300 font-semibold">Sound On</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ──────────────────────────────────────────────────────────── */}
            {/* TAB 2: LIVE 60FPS SHADERS */}
            {/* ──────────────────────────────────────────────────────────── */}
            {activeTab === 'live' && (
              <div className="space-y-4">
                <p className="text-xs text-white/60">
                  GPU-accelerated mathematical live shaders. Dynamic particle physics with 0% CPU footprint.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { id: 'neon-nebula', name: 'Neon Nebula', icon: '🌌', desc: 'Cosmic particle clouds & floating starlight' },
                    { id: 'iridescent-aurora', name: 'Iridescent Aurora', icon: '🌊', desc: 'Flowing harmonic ocean waves' },
                    { id: 'cyber-matrix', name: 'Cyber Matrix', icon: '💻', desc: 'Glowing digital rain & binary matrix streams' },
                    { id: 'hyperspace', name: 'Hyperspace Warp', icon: '🚀', desc: '3D starfield velocity warp tunnel' },
                    { id: 'sakura-embers', name: 'Sakura Embers', icon: '🌸', desc: 'Floating fiery cherry blossom embers' },
                    { id: 'quantum-circuit', name: 'Quantum Circuit', icon: '⚡', desc: 'Pulsing electron microchip grid' },
                  ].map((preset) => {
                    const isSelected =
                      settings.backgroundMode === 'live-wallpaper' &&
                      (settings.liveWallpaperPreset || 'neon-nebula') === preset.id;

                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setSetting('liveWallpaperPreset', preset.id as any);
                          setSetting('backgroundMode', 'live-wallpaper');
                          setSetting('videoBackgroundEnabled', true);
                          toast.success(`Active shader: ${preset.name}`);
                        }}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-2 ${
                          isSelected
                            ? 'bg-cyan-500/20 border-cyan-500/60 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/40'
                            : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-2xl">{preset.icon}</span>
                          {isSelected && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500 text-black font-bold flex items-center gap-1">
                              <Check size={11} /> Active
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">{preset.name}</div>
                          <div className="text-[11px] text-white/50 mt-0.5">{preset.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ──────────────────────────────────────────────────────────── */}
            {/* TAB 3: ANIME & LEGENDS */}
            {/* ──────────────────────────────────────────────────────────── */}
            {activeTab === 'presets' && (
              <div className="space-y-4">
                <p className="text-xs text-white/60">
                  Curated hand-crafted illustrated & animated anime character wallpapers.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      id: 'anime-warrior',
                      name: 'Anime Warrior',
                      icon: '🔥',
                      desc: 'Legendary anime hero with blazing aura and particle effects',
                    },
                    {
                      id: 'gojo-anime',
                      name: 'Gojo Satoru (Limitless)',
                      icon: '⚡',
                      desc: 'Six Eyes Limitless Void with glowing azure energy vortex',
                    },
                    {
                      id: 'samurai-video',
                      name: 'Samurai Blood Eclipse',
                      icon: '⚔️',
                      desc: '4K Cinematic blood moon, katana gleam, and swirling sakura',
                    },
                  ].map((preset) => {
                    const isSelected = settings.backgroundMode === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setSetting('backgroundMode', preset.id as any);
                          setSetting('videoBackgroundEnabled', true);
                          toast.success(`Selected: ${preset.name}`);
                        }}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-2 ${
                          isSelected
                            ? 'bg-orange-500/20 border-orange-500/60 shadow-lg shadow-orange-500/10 ring-1 ring-orange-500/40'
                            : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-2xl">{preset.icon}</span>
                          {isSelected && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500 text-black font-bold flex items-center gap-1">
                              <Check size={11} /> Active
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">{preset.name}</div>
                          <div className="text-[11px] text-white/50 mt-0.5">{preset.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ──────────────────────────────────────────────────────────── */}
            {/* TAB 4: CUSTOM IMAGE */}
            {/* ──────────────────────────────────────────────────────────── */}
            {activeTab === 'image' && (
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-white">
                      <ImageIcon size={16} className="text-cyan-400" />
                      <span>Upload Static Wallpaper Image</span>
                    </div>
                    <p className="text-xs text-white/50 mt-1">
                      Upload high-resolution JPG, PNG, WEBP, or GIF images.
                    </p>
                  </div>

                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageFileUpload(file);
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="py-2.5 px-4 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shrink-0"
                  >
                    <Upload size={15} />
                    <span>Choose Image</span>
                  </button>
                </div>

                {settings.customBackgroundImage && (
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex items-center gap-4">
                    <img
                      src={settings.customBackgroundImage}
                      alt="Current Custom Wallpaper"
                      className="w-28 h-18 rounded-xl object-cover border border-white/20"
                    />
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-white">Active Custom Image</div>
                      <div className="text-[11px] text-white/50">Full-screen background applied</div>
                      <button
                        type="button"
                        onClick={() => {
                          setSetting('customBackgroundImage', '');
                          setSetting('backgroundMode', 'anime-warrior');
                          toast.info('Reset to default wallpaper');
                        }}
                        className="text-xs text-rose-400 hover:underline cursor-pointer text-left block mt-1"
                      >
                        Remove Image
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-white/10 flex items-center justify-between bg-black/50">
            <div className="text-xs text-white/50 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Background mode: <strong className="text-white capitalize">{settings.backgroundMode.replace('-', ' ')}</strong></span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-bold text-xs shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
            >
              Done & Apply
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default WallpaperPickerModal;
