import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Download, 
  Share2, 
  RefreshCw, 
  Edit3, 
  ArrowUp, 
  Image as ImageIcon, 
  Trash2, 
  Copy, 
  Check, 
  Maximize2, 
  X, 
  MessageSquare,
  Wand2,
  Mic,
  MicOff,
  Heart,
  Sliders,
  Layers,
  Sparkle,
  Bookmark,
  CheckCircle2,
  ExternalLink,
  Shuffle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { formatAppError, showErrorToast } from '@/lib/errorHandler';
import { sendImageToChat } from '@/lib/chatHandoff';
import { callGeminiAPI } from '@/lib/gemini';
import { generateFluxImage } from '@/lib/bfl';
import { addSharedMediaItem, SharedMediaItem } from '@/lib/mediaStore';

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

export interface GeneratedImage {
  id: string;
  title: string;
  prompt: string;
  enhancedPrompt?: string;
  url: string;
  aspect?: string;
  style?: string;
  createdAt: string;
  isFavorite?: boolean;
}

const DEFAULT_PROMPT_SUGGESTIONS = [
  {
    title: 'Futuristic Neon City',
    category: 'Cyberpunk',
    prompt: 'A futuristic cyberpunk metropolis at night with towering holographic billboards, rain-slicked reflective streets, and glowing neon sky bridges'
  },
  {
    title: 'Cosmic Nebula Explorer',
    category: 'Sci-Fi',
    prompt: 'An astronaut in a reflective gold-visor spacesuit standing on an alien crystal planet gazing at an intricate purple and gold spiral galaxy'
  },
  {
    title: 'Enchanted Forest Spirit',
    category: 'Fantasy',
    prompt: 'A mystical ethereal glowing deer spirit standing beside a bioluminescent waterfall in an ancient twilight forest, cinematic volumetric lighting'
  },
  {
    title: 'Cyberpunk Geisha Portrait',
    category: 'Portrait',
    prompt: 'Studio portrait of a cyberpunk character with delicate golden circuitry patterns on porcelain skin, surrounded by neon ambient backlighting'
  },
  {
    title: 'Cozy Rain-dappled Cafe',
    category: 'Anime',
    prompt: 'Warm aesthetic anime coffee shop on a rainy afternoon with steam rising from a ceramic mug, soft pastel lighting and detailed raindrops'
  },
  {
    title: 'Epic Dragon Peaks',
    category: 'Epic',
    prompt: 'An ancient colossal dragon perched on snowy mountain peaks overlooking a radiant golden sunrise through soft sea mist clouds'
  }
];

const STAGES = [
  'Understanding prompt & semantics…',
  'Planning composition & layout…',
  'Synthesizing visual structure…',
  'Rendering textures & lighting…',
  'Generating high-res details…',
  'Color grading & refinement…',
  'Finalizing masterpiece…'
];

export interface AspectRatioOption {
  label: string;
  name: string;
  width: number;
  height: number;
  iconRatio: string;
}

const ASPECT_RATIOS: AspectRatioOption[] = [
  { label: '1:1', name: 'Square', width: 1024, height: 1024, iconRatio: 'aspect-square' },
  { label: '16:9', name: 'Landscape', width: 1280, height: 720, iconRatio: 'aspect-video' },
  { label: '9:16', name: 'Story', width: 720, height: 1280, iconRatio: 'aspect-[9/16]' },
  { label: '4:3', name: 'Standard', width: 1024, height: 768, iconRatio: 'aspect-[4/3]' },
  { label: '3:4', name: 'Portrait', width: 768, height: 1024, iconRatio: 'aspect-[3/4]' },
  { label: '21:9', name: 'Cinema', width: 1344, height: 576, iconRatio: 'aspect-[21/9]' },
];

export const STYLE_PRESETS = [
  { id: 'Photorealistic', label: 'Photorealistic', icon: '📸', desc: 'True-to-life camera capture with realistic lighting' },
  { id: 'Cinematic', label: 'Cinematic', icon: '🎬', desc: 'Anamorphic lens flares, dramatic lighting and movie grading' },
  { id: 'Anime', label: 'Anime & Manga', icon: '🌸', desc: 'Vibrant modern Japanese animation aesthetic' },
  { id: 'Cyberpunk', label: 'Cyberpunk', icon: '⚡', desc: 'High-tech neon glows, holographic reflections & moody darks' },
  { id: '3D Render', label: '3D Digital', icon: '💎', desc: 'Smooth Octane-style 3D models and studio illumination' },
  { id: 'Oil Painting', label: 'Oil Painting', icon: '🎨', desc: 'Rich textural brushstrokes and classical art palette' },
  { id: 'Fantasy Art', label: 'Fantasy Art', icon: '✨', desc: 'Mythical atmosphere, glowing magic and dreamscapes' },
  { id: 'Watercolor', label: 'Watercolor', icon: '🖌️', desc: 'Delicate pigment washes and organic paper textures' },
  { id: 'Minimalist', label: 'Minimalist', icon: '📐', desc: 'Clean vector silhouettes, bold balance and negative space' },
  { id: 'Pixel Art', label: 'Pixel Art', icon: '👾', desc: 'Retro 16-bit arcade pixel aesthetics with crisp grids' },
];

interface ImageGeneratorUIProps {
  onBackToChat?: () => void;
}

export const ImageGeneratorUI: React.FC<ImageGeneratorUIProps> = ({ onBackToChat }) => {
  const [prompt, setPrompt] = useState('A futuristic city at night with glowing neon buildings and flying cars');
  const [selectedRatio, setSelectedRatio] = useState('1:1');
  const [selectedStyle, setSelectedStyle] = useState('Photorealistic');
  const [isHd, setIsHd] = useState(false);
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  // Generation lifecycle states: 'empty' | 'generating' | 'result'
  const [genState, setGenState] = useState<'empty' | 'generating' | 'result'>('empty');
  const [progress, setProgress] = useState(0);
  const [stageText, setStageText] = useState(STAGES[0]);
  const [currentResult, setCurrentResult] = useState<GeneratedImage | null>(null);
  
  const [myImages, setMyImages] = useState<GeneratedImage[]>(() =>
    getStoredData('app_my_images', [])
  );
  const [selectedModalImage, setSelectedModalImage] = useState<GeneratedImage | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'favorites'>('all');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const promptInputRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const cancelledRef = useRef(false);

  // Sync to local storage
  useEffect(() => {
    setStoredData('app_my_images', myImages);
  }, [myImages]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Voice Input Handler
  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Voice input is not supported in this browser environment.');
      return;
    }
    try {
      const SpeechRecognitionClass = (window as unknown as { SpeechRecognition: any; webkitSpeechRecognition: any }).SpeechRecognition ||
        (window as unknown as { SpeechRecognition: any; webkitSpeechRecognition: any }).webkitSpeechRecognition;
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        toast.info('Listening for your image description...');
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setPrompt(prev => prev ? `${prev} ${transcript}` : transcript);
        setIsListening(false);
        toast.success('Voice captured!');
      };

      recognition.onerror = () => {
        setIsListening(false);
        toast.error('Voice capture error. You can type your prompt.');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
      toast.error('Could not initialize microphone input.');
    }
  };

  // AI Prompt Polish with Gemini
  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a brief idea to enhance');
      promptInputRef.current?.focus();
      return;
    }

    setIsEnhancingPrompt(true);
    toast.info('AI is expanding and refining your prompt...');

    try {
      const res = await callGeminiAPI({
        prompt: `You are a world-class prompt engineer for text-to-image AI generators. Turn this raw idea into a highly descriptive, visually rich prompt with cinematic lighting, depth of field, atmospheric mood, and textural details: "${prompt.trim()}". Keep the result to 1-2 punchy sentences (under 35 words). Output ONLY the refined prompt text without intro or quotes.`,
        mode: 'chat',
        model: 'gemini-2.5-flash',
        temperature: 0.7,
      });

      if (res.success && res.text) {
        const enhanced = res.text.replace(/["`]/g, '').trim();
        setPrompt(enhanced);
        toast.success('Prompt magically enhanced! ✨');
      } else {
        toast.error('Could not enhance prompt right now.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Prompt enhancement failed.');
    } finally {
      setIsEnhancingPrompt(false);
    }
  };

  // Shuffle Inspiration
  const handleShufflePrompt = () => {
    const randomPick = DEFAULT_PROMPT_SUGGESTIONS[Math.floor(Math.random() * DEFAULT_PROMPT_SUGGESTIONS.length)];
    setPrompt(randomPick.prompt);
    toast.info(`Loaded: "${randomPick.title}"`);
  };

  // Core Text-to-Image Generation
  const handleGenerate = async (customPrompt?: string) => {
    const activePrompt = (customPrompt !== undefined ? customPrompt : prompt).trim();
    if (!activePrompt) {
      toast.error('Please enter a prompt to generate an image');
      promptInputRef.current?.focus();
      return;
    }

    cancelledRef.current = false;
    setProgress(0);
    setStageText(STAGES[0]);
    setGenState('generating');

    let currentProgress = 0;
    
    // Smooth progress simulation
    timerRef.current = setInterval(() => {
      if (cancelledRef.current) {
        if (timerRef.current) clearInterval(timerRef.current);
        return;
      }

      currentProgress += Math.random() * 8 + 4;
      if (currentProgress > 95) currentProgress = 95;

      setProgress(Math.floor(currentProgress));
      const stageIdx = Math.min(STAGES.length - 1, Math.floor((currentProgress / 100) * STAGES.length));
      setStageText(STAGES[stageIdx]);
    }, 250);

    try {
      // 1. Dimensions based on chosen aspect ratio and HD flag
      const ratioConfig = ASPECT_RATIOS.find(r => r.label === selectedRatio) || ASPECT_RATIOS[0];
      const width = isHd ? Math.round(ratioConfig.width * 1.25) : ratioConfig.width;
      const height = isHd ? Math.round(ratioConfig.height * 1.25) : ratioConfig.height;
      const seed = Math.floor(Math.random() * 99999999);

      // 2. Build full stylised prompt
      const fullPromptParam = `${activePrompt}, ${selectedStyle} style, masterclass composition, 8k resolution, crisp detail, flawless lighting, no artifacts`;
      const encoded = encodeURIComponent(fullPromptParam);
      let finalImageUrl = `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&seed=${seed}&nologo=true`;

      // Check if BFL is available
      try {
        const bflRes = await generateFluxImage({
          prompt: fullPromptParam,
          width: Math.min(width, 1024),
          height: Math.min(height, 1024),
        });
        if (bflRes.success && bflRes.imageUrl) {
          finalImageUrl = bflRes.imageUrl;
        }
      } catch {
        // Fallback to high-speed AI image endpoint
      }

      // Preload image in memory
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = finalImageUrl;
      });

      if (cancelledRef.current) return;

      if (timerRef.current) clearInterval(timerRef.current);
      setProgress(100);
      setStageText('Finalizing masterpiece…');

      setTimeout(() => {
        if (cancelledRef.current) return;

        const newCreatedImg: GeneratedImage = {
          id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          title: activePrompt.length > 35 ? activePrompt.slice(0, 35) + '…' : activePrompt,
          prompt: activePrompt,
          url: finalImageUrl,
          aspect: selectedRatio,
          style: selectedStyle,
          createdAt: 'Just now',
          isFavorite: false,
        };

        setCurrentResult(newCreatedImg);
        
        // Save to My Images list
        setMyImages(prev => [newCreatedImg, ...prev.filter(item => item.url !== finalImageUrl)]);
        
        // Auto-save to universal app Media Store & Library
        try {
          addSharedMediaItem({
            id: newCreatedImg.id,
            name: `${newCreatedImg.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.png`,
            type: 'image',
            url: finalImageUrl,
            size: `${(width * height * 0.000003).toFixed(1)} MB`,
            source: 'ai_generated',
            prompt: activePrompt,
            createdAt: new Date().toISOString(),
          });
        } catch (e) {
          console.warn('Media store sync note:', e);
        }

        setGenState('result');
        toast.success('Visual generated and saved to Library! ✨');
      }, 350);

    } catch (error) {
      if (timerRef.current) clearInterval(timerRef.current);
      setGenState('empty');
      const appErr = formatAppError(error, 'Image generation encountered an issue.');
      showErrorToast(appErr, 'Generation Failed', () => handleGenerate(activePrompt));
    }
  };

  const handleCancel = () => {
    cancelledRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    setProgress(0);
    setGenState(currentResult ? 'result' : 'empty');
    toast.info('Generation cancelled');
  };

  // Robust Direct Blob / File Download
  const handleDownload = async (imgToDownload?: GeneratedImage) => {
    const target = imgToDownload || currentResult;
    if (!target) return;

    setIsDownloading(true);
    toast.info('Preparing image download...');

    try {
      // Attempt fetching blob for true direct file download
      const response = await fetch(target.url, { mode: 'cors' });
      if (!response.ok) throw new Error('Fetch failed');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      const cleanName = target.title.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30);
      link.download = `ai-${cleanName || 'image'}-${target.id.slice(-6)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      toast.success('Image saved to your device!');
    } catch {
      // Fallback direct link download
      const link = document.createElement('a');
      link.href = target.url;
      link.target = '_blank';
      link.download = `ai-image-${target.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Image opened in new tab for saving!');
    } finally {
      setIsDownloading(false);
    }
  };

  // Copy Image / Link to Clipboard
  const handleCopy = async (target?: GeneratedImage) => {
    const img = target || currentResult;
    if (!img) return;

    try {
      // Try to copy image binary if possible
      const response = await fetch(img.url);
      const blob = await response.blob();
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type || 'image/png']: blob })
        ]);
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
        toast.success('Image copied directly to clipboard!');
        return;
      }
    } catch {
      // Fallback: Copy URL text
    }

    try {
      await navigator.clipboard.writeText(img.url);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
      toast.success('Image URL copied to clipboard!');
    } catch {
      toast.error('Failed to copy');
    }
  };

  // Native Share / Copy Share Link
  const handleShare = async (target?: GeneratedImage) => {
    const img = target || currentResult;
    if (!img) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AI Generated Artwork',
          text: `"${img.prompt}" (Style: ${img.style || 'Photorealistic'}, Ratio: ${img.aspect || '1:1'})`,
          url: img.url,
        });
        toast.success('Shared successfully');
      } catch {
        handleCopy(img);
      }
    } else {
      handleCopy(img);
    }
  };

  // Toggle Favorite
  const handleToggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setMyImages(prev => prev.map(img => {
      if (img.id === id) {
        const nextFav = !img.isFavorite;
        toast.success(nextFav ? 'Saved to Favorites ❤️' : 'Removed from Favorites');
        return { ...img, isFavorite: nextFav };
      }
      return img;
    }));

    if (currentResult?.id === id) {
      setCurrentResult(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
    }
    if (selectedModalImage?.id === id) {
      setSelectedModalImage(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
    }
  };

  const handleEdit = () => {
    if (currentResult) {
      setPrompt(currentResult.prompt);
    }
    promptInputRef.current?.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast.info('Prompt loaded into editor');
  };

  const handleSendToChat = (target?: GeneratedImage) => {
    const img = target || currentResult;
    if (!img) return;
    sendImageToChat(`I want to discuss and analyze this AI image: "${img.title}"`, [
      { id: img.id, url: img.url, name: img.title }
    ]);
    if (onBackToChat) onBackToChat();
    toast.success('Transferred image to Chat AI!');
  };

  const handleDeleteCreation = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setMyImages(prev => prev.filter(img => img.id !== id));
    if (currentResult?.id === id) {
      setCurrentResult(null);
      setGenState('empty');
    }
    if (selectedModalImage?.id === id) {
      setSelectedModalImage(null);
    }
    toast.success('Image deleted from gallery');
  };

  const displayedImages = activeFilter === 'favorites' 
    ? myImages.filter(img => img.isFavorite) 
    : myImages;

  return (
    <div className="w-full font-sans space-y-6">
      {/* HEADER BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-1 border-b border-white/10">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>AI Text-to-Image</span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
              <Sparkles size={11} />
              <span>Diffusion Pro</span>
            </span>
          </h2>
          <p className="text-xs text-white/50 mt-0.5">
            Turn natural language prompts into stunning visual masterpieces with full aspect & style controls.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onBackToChat && (
            <button
              type="button"
              onClick={onBackToChat}
              className="px-3 py-1.5 rounded-full text-xs font-medium text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
            >
              ← Back to Chat
            </button>
          )}
          <div className="text-xs text-[#9d9faa] px-3 py-1.5 border border-white/10 rounded-full bg-white/[0.035] flex items-center gap-2 backdrop-blur-md">
            <span className={cn(
              "w-2 h-2 rounded-full",
              genState === 'generating' ? "bg-amber-400 animate-ping" : "bg-emerald-400"
            )} />
            <span>{genState === 'generating' ? 'Generating…' : '● Ready'}</span>
          </div>
        </div>
      </div>

      {/* GENERATION CONTROL CARD */}
      <section className="border border-white/10 bg-[#14151c]/90 backdrop-blur-2xl rounded-3xl p-4 sm:p-5 shadow-2xl shadow-black/50">
        {/* Prompt Input Box */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-white/80 flex items-center gap-1.5">
              <span>Image Prompt</span>
            </label>

            <div className="flex items-center gap-1.5">
              {/* Magic Enhance Prompt */}
              <button
                type="button"
                onClick={handleEnhancePrompt}
                disabled={isEnhancingPrompt || !prompt.trim()}
                className="px-2.5 py-1 rounded-lg text-xs font-medium text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40"
                title="Use Gemini to expand and enhance this prompt"
              >
                <Wand2 size={12} className={cn(isEnhancingPrompt && "animate-spin")} />
                <span>{isEnhancingPrompt ? 'Enhancing...' : 'Magic Polish'}</span>
              </button>

              {/* Shuffle Prompt */}
              <button
                type="button"
                onClick={handleShufflePrompt}
                className="p-1.5 rounded-lg text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 transition-all cursor-pointer"
                title="Load random inspiration prompt"
              >
                <Shuffle size={13} />
              </button>
            </div>
          </div>

          <div className="relative">
            <textarea
              ref={promptInputRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
              placeholder="Describe the image you want to create in vivid detail (e.g., A futuristic cyberpunk metropolis with flying neon cars in rainy twilight)..."
              rows={3}
              className="w-full min-h-[85px] max-h-[180px] resize-y bg-white/[0.045] border border-white/10 rounded-2xl p-3.5 pr-20 text-white text-sm leading-relaxed placeholder-white/40 focus:outline-none focus:border-[#8b7cff]/60 focus:ring-2 focus:ring-[#8b7cff]/20 transition-all"
            />

            {/* In-box Actions (Clear & Mic) */}
            <div className="absolute top-3 right-3 flex items-center gap-1">
              <button
                type="button"
                onClick={handleVoiceInput}
                className={cn(
                  "p-1.5 rounded-lg transition-colors cursor-pointer",
                  isListening 
                    ? "bg-red-500/20 text-red-400 animate-pulse border border-red-500/30" 
                    : "text-white/50 hover:text-white hover:bg-white/10"
                )}
                title={isListening ? "Listening..." : "Voice input prompt"}
              >
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>

              {prompt.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPrompt('')}
                  className="text-white/40 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  title="Clear prompt"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* CONTROLS: ASPECT RATIO */}
        <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white/70 flex items-center gap-1.5">
              <Layers size={13} className="text-purple-400" />
              <span>Aspect Ratio</span>
            </span>
            <span className="text-[11px] text-white/40 font-mono">
              {ASPECT_RATIOS.find(r => r.label === selectedRatio)?.width} × {ASPECT_RATIOS.find(r => r.label === selectedRatio)?.height} px {isHd && '(HD)'}
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-7 gap-1.5">
            {ASPECT_RATIOS.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setSelectedRatio(item.label)}
                className={cn(
                  "px-2.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 border text-center",
                  selectedRatio === item.label
                    ? "bg-[#8b7cff]/20 text-white border-[#8b7cff]/60 shadow-md shadow-[#8b7cff]/20"
                    : "bg-white/[0.03] text-white/60 border-white/5 hover:text-white hover:bg-white/10"
                )}
              >
                <span className="font-bold">{item.label}</span>
                <span className="text-[10px] text-white/40 leading-none">{item.name}</span>
              </button>
            ))}

            {/* HD Resolution Toggle */}
            <button
              type="button"
              onClick={() => setIsHd(!isHd)}
              className={cn(
                "px-2.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 border text-center col-span-3 sm:col-span-1",
                isHd
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm"
                  : "bg-white/[0.03] text-white/50 border-white/5 hover:text-white hover:bg-white/10"
              )}
              title="Enhance pixel density & fidelity"
            >
              <span className="font-bold">HD 2K</span>
              <span className="text-[10px] text-white/40 leading-none">{isHd ? 'Enabled' : 'Standard'}</span>
            </button>
          </div>
        </div>

        {/* CONTROLS: STYLE SELECTOR */}
        <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white/70 flex items-center gap-1.5">
              <Sliders size={13} className="text-cyan-400" />
              <span>Artistic Style</span>
            </span>
            <span className="text-[11px] text-purple-300 font-medium">
              {STYLE_PRESETS.find(s => s.id === selectedStyle)?.desc}
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
            {STYLE_PRESETS.map((style) => (
              <button
                key={style.id}
                type="button"
                onClick={() => setSelectedStyle(style.id)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1.5 shrink-0",
                  selectedStyle === style.id
                    ? "bg-gradient-to-r from-purple-600/40 to-indigo-600/40 text-white border-purple-500/60 shadow-sm"
                    : "bg-white/[0.035] text-white/60 border-white/5 hover:text-white hover:bg-white/10"
                )}
              >
                <span>{style.icon}</span>
                <span>{style.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* GENERATE ACTION BUTTON */}
        <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between gap-3">
          <div className="text-xs text-white/50 hidden sm:block">
            Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] text-white font-mono">Enter</kbd> to generate
          </div>

          <button
            id="generateImageBtn"
            type="button"
            onClick={() => handleGenerate()}
            disabled={genState === 'generating' || !prompt.trim()}
            className={cn(
              "w-full sm:w-auto px-6 py-3 rounded-2xl cursor-pointer text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-xl",
              "bg-gradient-to-r from-[#7565ff] via-[#8e5eff] to-[#b85eff] shadow-[#7565ff]/30 hover:shadow-[#7565ff]/50 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:pointer-events-none ml-auto"
            )}
          >
            {genState === 'generating' ? (
              <>
                <Sparkles className="animate-spin text-white" size={18} />
                <span>Creating Visual…</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>Generate Visual</span>
              </>
            )}
          </button>
        </div>
      </section>

      {/* WORKSPACE & CANVAS AREA */}
      <main className="space-y-6">
        <AnimatePresence mode="wait">
          {/* 1. GENERATING STATE */}
          {genState === 'generating' && (
            <motion.section
              key="generating"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="min-h-[420px] rounded-3xl overflow-hidden relative border border-white/10 bg-[#0d0e14] shadow-2xl flex flex-col items-center justify-center p-6 text-center"
            >
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-br from-[#11131b] to-[#08090d]" />
                <div className="absolute top-[30%] left-[30%] w-72 h-72 rounded-full bg-purple-500/20 blur-3xl pointer-events-none animate-pulse" />
                <div className="absolute bottom-[20%] right-[20%] w-60 h-60 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 rounded-full bg-gradient-to-tr from-[#4a3b9c] via-[#8d7cff] to-[#d7d1ff] blur-md opacity-70 animate-pulse" />
              </div>

              <div className="relative z-10 flex flex-col items-center max-w-sm">
                <div className="w-14 h-14 rounded-2xl grid place-items-center text-2xl bg-white/[0.08] border border-white/20 backdrop-blur-xl text-white mb-3 shadow-xl animate-bounce">
                  ✦
                </div>

                <h3 className="text-xl font-bold text-white mb-1">
                  Synthesizing Image
                </h3>

                <p className="text-sm text-[#a9abb6] min-h-[22px] font-medium">
                  {stageText}
                </p>

                {/* Progress bar */}
                <div className="w-64 mt-5">
                  <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#7768ff] via-[#a865ff] to-[#e06cff] transition-all duration-300 shadow-[0_0_15px_rgba(139,124,255,0.7)]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="text-xs text-[#858895] font-mono mt-2">
                    {progress}% completed
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCancel}
                  className="mt-5 px-4 py-1.5 rounded-xl text-xs font-medium text-white/70 bg-white/[0.055] hover:bg-white/10 border border-white/15 cursor-pointer transition-all active:scale-95"
                >
                  Cancel
                </button>
              </div>
            </motion.section>
          )}

          {/* 2. RESULT STATE */}
          {genState === 'result' && currentResult && (
            <motion.section
              key="result"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-3xl overflow-hidden border border-white/10 bg-[#101117] shadow-2xl"
            >
              {/* Output Image Canvas */}
              <div className="relative bg-[#0b0c10] flex items-center justify-center max-h-[600px] overflow-hidden group">
                <img
                  id="generatedImageOutput"
                  src={currentResult.url}
                  alt={currentResult.prompt}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain max-h-[600px] transition-transform duration-500 group-hover:scale-[1.01]"
                />

                {/* Corner quick actions */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => handleToggleFavorite(currentResult.id, e)}
                    className={cn(
                      "p-2.5 rounded-xl backdrop-blur-md border transition-all cursor-pointer",
                      currentResult.isFavorite 
                        ? "bg-red-500/80 text-white border-red-400" 
                        : "bg-black/60 hover:bg-black/80 text-white border-white/10"
                    )}
                    title={currentResult.isFavorite ? "Favorited" : "Add to favorites"}
                  >
                    <Heart size={16} className={cn(currentResult.isFavorite && "fill-white")} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedModalImage(currentResult)}
                    className="p-2.5 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md text-white border border-white/10 transition-opacity cursor-pointer"
                    title="Fullscreen inspect"
                  >
                    <Maximize2 size={16} />
                  </button>
                </div>
              </div>

              {/* Output Metadata & Action Toolbar */}
              <div className="p-4 sm:p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-white text-sm sm:text-base font-medium leading-relaxed">
                      {currentResult.prompt}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-white/50">
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5 font-mono">
                        {currentResult.aspect || selectedRatio}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5">
                        Style: {currentResult.style || selectedStyle}
                      </span>
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        <span>Saved to Media Store</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* SAVEABLE & EXPORT ACTIONS */}
                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/5">
                  {/* Download to Device */}
                  <button
                    type="button"
                    onClick={() => handleDownload()}
                    disabled={isDownloading}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#7565ff] to-[#a461ff] shadow-md shadow-[#7565ff]/20 hover:shadow-[#7565ff]/40 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <Download size={14} />
                    <span>{isDownloading ? 'Saving...' : 'Save & Download'}</span>
                  </button>

                  {/* Copy Image */}
                  <button
                    type="button"
                    onClick={() => handleCopy()}
                    className="px-3.5 py-2.5 rounded-xl text-xs font-medium text-white/90 bg-white/[0.045] hover:bg-white/10 border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Copy image or link to clipboard"
                  >
                    {copiedUrl ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span>{copiedUrl ? 'Copied!' : 'Copy'}</span>
                  </button>

                  {/* Share */}
                  <button
                    type="button"
                    onClick={() => handleShare()}
                    className="px-3.5 py-2.5 rounded-xl text-xs font-medium text-white/90 bg-white/[0.045] hover:bg-white/10 border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Share2 size={14} />
                    <span>Share</span>
                  </button>

                  {/* Regenerate */}
                  <button
                    type="button"
                    onClick={() => handleGenerate(currentResult.prompt)}
                    className="px-3.5 py-2.5 rounded-xl text-xs font-medium text-white/90 bg-white/[0.045] hover:bg-white/10 border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw size={14} />
                    <span>Regenerate</span>
                  </button>

                  {/* Edit Prompt */}
                  <button
                    type="button"
                    onClick={handleEdit}
                    className="px-3.5 py-2.5 rounded-xl text-xs font-medium text-white/90 bg-white/[0.045] hover:bg-white/10 border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 size={14} />
                    <span>Edit Prompt</span>
                  </button>

                  {/* Handoff to Chat AI */}
                  <button
                    type="button"
                    onClick={() => handleSendToChat()}
                    className="px-4 py-2.5 rounded-xl text-xs font-medium text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 transition-all flex items-center gap-1.5 cursor-pointer sm:ml-auto"
                  >
                    <MessageSquare size={14} />
                    <span>Discuss with AI</span>
                  </button>
                </div>
              </div>
            </motion.section>
          )}

          {/* 3. EMPTY STATE & INSPIRATION TEMPLATES */}
          {genState === 'empty' && (
            <motion.section
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="border border-dashed border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center text-center bg-white/[0.01]"
            >
              <div className="w-14 h-14 rounded-2xl grid place-items-center text-2xl bg-[#8b7cff]/10 border border-[#8b7cff]/20 text-[#8b7cff] mb-3">
                ✦
              </div>

              <h3 className="text-lg font-bold text-white mb-1.5">
                Ready to create visuals
              </h3>

              <p className="text-xs sm:text-sm text-[#9295a1] max-w-md mb-6">
                Type any idea above or select one of the curated creative prompt seeds to instantly generate artwork.
              </p>

              {/* Inspiration Prompt Seeds */}
              <div className="w-full max-w-2xl">
                <div className="text-[11px] text-white/40 font-semibold uppercase tracking-wider mb-2.5 text-left">
                  Inspiration Prompts
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
                  {DEFAULT_PROMPT_SUGGESTIONS.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setPrompt(item.prompt);
                        handleGenerate(item.prompt);
                      }}
                      className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-purple-500/30 transition-all text-xs cursor-pointer group"
                    >
                      <div className="font-semibold text-white group-hover:text-purple-300 transition-colors flex items-center justify-between">
                        <span>{item.title}</span>
                        <span className="text-[10px] text-white/40 font-normal px-2 py-0.5 rounded bg-white/5">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-white/50 line-clamp-2 mt-1 leading-snug">
                        {item.prompt}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* MY CREATIONS GALLERY & SAVED IMAGES */}
        {myImages.length > 0 && (
          <div className="pt-6 border-t border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">
                  My Creations
                </h3>
                <span className="text-xs text-white/40 font-mono">
                  ({myImages.length})
                </span>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/5">
                <button
                  type="button"
                  onClick={() => setActiveFilter('all')}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer",
                    activeFilter === 'all' ? "bg-white/10 text-white" : "text-white/50 hover:text-white"
                  )}
                >
                  All ({myImages.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('favorites')}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1",
                    activeFilter === 'favorites' ? "bg-red-500/20 text-red-300" : "text-white/50 hover:text-white"
                  )}
                >
                  <Heart size={11} className={activeFilter === 'favorites' ? "fill-red-300" : ""} />
                  <span>Favorites ({myImages.filter(i => i.isFavorite).length})</span>
                </button>
              </div>
            </div>

            {displayedImages.length === 0 ? (
              <div className="py-8 text-center text-xs text-white/40">
                No favorite images saved yet. Click the heart icon on any image to add it here.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {displayedImages.map((img) => (
                  <div
                    key={img.id}
                    onClick={() => {
                      setCurrentResult(img);
                      setGenState('result');
                      window.scrollTo({ top: 120, behavior: 'smooth' });
                    }}
                    className="aspect-square rounded-2xl overflow-hidden bg-[#1c1c1e] border border-white/10 relative group cursor-pointer shadow-lg hover:border-purple-500/40 transition-all"
                  >
                    <img
                      src={img.url}
                      alt={img.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />

                    {/* Overlay metadata & quick action buttons */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2.5 flex flex-col justify-between">
                      <div className="flex items-center justify-between gap-1">
                        <button
                          type="button"
                          onClick={(e) => handleToggleFavorite(img.id, e)}
                          className={cn(
                            "p-1.5 rounded-lg backdrop-blur-md transition-colors cursor-pointer",
                            img.isFavorite ? "bg-red-500/80 text-white" : "bg-black/60 hover:bg-black/80 text-white"
                          )}
                          title="Toggle favorite"
                        >
                          <Heart size={12} className={cn(img.isFavorite && "fill-white")} />
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(img);
                            }}
                            className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white transition-colors cursor-pointer"
                            title="Save & Download"
                          >
                            <Download size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteCreation(img.id, e)}
                            className="p-1.5 rounded-lg bg-black/60 hover:bg-red-500/80 text-white transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-white line-clamp-2 leading-tight">
                          {img.prompt}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-white/50 mt-1">
                          <span>{img.style || 'Art'}</span>
                          <span>{img.createdAt}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* FULL-SCREEN MODAL INSPECT & SAVE DIALOG */}
      <AnimatePresence>
        {selectedModalImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col justify-between p-4 sm:p-6"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white truncate max-w-xs sm:max-w-md">
                  {selectedModalImage.title}
                </span>
                <span className="text-xs text-white/40 font-mono">
                  ({selectedModalImage.aspect || '1:1'} • {selectedModalImage.style || 'Custom'})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedModalImage(null)}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Main Preview */}
            <div className="flex-1 flex items-center justify-center p-2 min-h-0 overflow-hidden">
              <img
                src={selectedModalImage.url}
                alt={selectedModalImage.title}
                referrerPolicy="no-referrer"
                className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl"
              />
            </div>

            {/* Modal Footer Controls */}
            <div className="max-w-2xl mx-auto w-full flex flex-wrap items-center justify-center gap-2.5 pt-4">
              <button
                type="button"
                onClick={() => handleDownload(selectedModalImage)}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-lg active:scale-95"
              >
                <Download size={14} />
                <span>Save to Device</span>
              </button>

              <button
                type="button"
                onClick={() => handleCopy(selectedModalImage)}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium flex items-center gap-2 cursor-pointer"
              >
                <Copy size={14} />
                <span>Copy Image</span>
              </button>

              <button
                type="button"
                onClick={() => handleShare(selectedModalImage)}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium flex items-center gap-2 cursor-pointer"
              >
                <Share2 size={14} />
                <span>Share</span>
              </button>

              <button
                type="button"
                onClick={(e) => handleToggleFavorite(selectedModalImage.id, e)}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium flex items-center gap-2 cursor-pointer"
              >
                <Heart size={14} className={cn(selectedModalImage.isFavorite && "fill-red-400 text-red-400")} />
                <span>{selectedModalImage.isFavorite ? 'Favorited' : 'Favorite'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleSendToChat(selectedModalImage);
                  setSelectedModalImage(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-500/30 text-xs font-medium flex items-center gap-2 cursor-pointer"
              >
                <MessageSquare size={14} />
                <span>Send to Chat</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
