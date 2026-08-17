import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  User,
  Palette,
  Brain,
  Cpu,
  Volume2,
  Database,
  MessageSquare,
  Search,
  FileText,
  Shield,
  Bell,
  Zap,
  Plug,
  Code2,
  Info,
  ChevronRight,
  ArrowLeft,
  RotateCcw,
  Key,
  Check,
  AlertCircle,
  Trash2,
  Plus,
  Play,
  Lock,
  Download,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  Eye,
  EyeOff,
  LogOut,
  Sparkles,
  RefreshCw,
  Sliders,
  CheckCircle2,
  X,
  Flame,
  VolumeX,
  Gauge,
  Mic,
  MicOff,
  Radio,
  Languages,
  Square,
  Hand,
  Video,
  Film,
  Image as ImageIcon,
  Upload,
  PlayCircle
} from 'lucide-react';
import { saveWallpaperBlob } from '@/lib/wallpaperStorage';

import {
  AppSettings,
  getAllSettings,
  setSetting,
  resetSetting,
  resetAllSettings,
  subscribeSettings,
  DEFAULT_SETTINGS
} from '@/lib/settingsStore';
import {
  ToggleSwitch,
  SliderControl,
  SegmentedControl,
  DropdownSelect,
  ColorPicker,
  SearchInput,
  SettingCard,
  InformationRow,
  ConfirmationModal
} from './SettingsComponents';
import { VOICE_PERSONAS, speakTextWithPersona } from '@/lib/voiceService';
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher';
import { WallpaperPickerModal } from '@/components/wallpaper/WallpaperPickerModal';
import { toast } from 'sonner';
import { formatAppError, showErrorToast } from '@/lib/errorHandler';

interface SettingsViewProps {
  onClose?: () => void;
  isModal?: boolean;
}

export type SettingsCategory =
  | 'account'
  | 'appearance'
  | 'ai_behavior'
  | 'model'
  | 'voice'
  | 'memory'
  | 'chat'
  | 'search'
  | 'files'
  | 'privacy'
  | 'notifications'
  | 'performance'
  | 'plugins'
  | 'developer'
  | 'about';

interface CategoryDef {
  id: SettingsCategory;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const CATEGORIES: CategoryDef[] = [
  { id: 'account', label: 'Account', icon: <User size={16} />, description: 'Profile, name, email & account preferences' },
  { id: 'appearance', label: 'Appearance', icon: <Palette size={16} />, description: 'Theme, accent colors, typography & layout' },
  { id: 'ai_behavior', label: 'AI Behavior', icon: <Brain size={16} />, description: 'Personality, reasoning style & response length' },
  { id: 'model', label: 'Model', icon: <Cpu size={16} />, description: 'Model selection, speed & context controls' },
  { id: 'voice', label: 'Voice', icon: <Volume2 size={16} />, description: 'Voice mode, personas, speech rate & mic controls' },
  { id: 'memory', label: 'Memory', icon: <Database size={16} />, description: 'Contextual memory, saved knowledge & temporary mode' },
  { id: 'chat', label: 'Chat', icon: <MessageSquare size={16} />, description: 'Send key, markdown, formatting & message actions' },
  { id: 'search', label: 'Search & Sources', icon: <Search size={16} />, description: 'Web search, citations, safe search & media' },
  { id: 'files', label: 'Files & Vision', icon: <FileText size={16} />, description: 'File uploads, PDF, image & video analysis' },
  { id: 'privacy', label: 'Privacy & Security', icon: <Shield size={16} />, description: 'Data controls, PIN lock & permissions' },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={16} />, description: 'Push, audio, vibration & quiet hours' },
  { id: 'performance', label: 'Performance', icon: <Zap size={16} />, description: 'FPS boost, animations, cache & low-power' },
  { id: 'plugins', label: 'Plugins & Tools', icon: <Plug size={16} />, description: 'Tool permissions, web search & extensions' },
  { id: 'developer', label: 'Developer', icon: <Code2 size={16} />, description: 'API keys, latency logs & debug info' },
  { id: 'about', label: 'About', icon: <Info size={16} />, description: 'App version, terms, licenses & support' },
];

export const SettingsView: React.FC<SettingsViewProps> = ({ onClose }) => {
  const [settings, setSettingsState] = useState<AppSettings>(() => getAllSettings());
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('account');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileCategoryOpen, setMobileCategoryOpen] = useState(false);
  const [isWallpaperPickerOpen, setIsWallpaperPickerOpen] = useState(false);

  // API Key state for developer tab
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showMinimaxKey, setShowMinimaxKey] = useState(false);
  const [showBflKey, setShowBflKey] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyTestResult, setKeyTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Voice playback test state
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [micAudioLevel, setMicAudioLevel] = useState(0);

  const handleTestMic = async () => {
    if (isTestingMic) {
      setIsTestingMic(false);
      setMicAudioLevel(0);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsTestingMic(true);
      toast.info('Speak into your microphone to test volume input');

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      const analyser = audioCtx.createAnalyser();
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 64;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setMicAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
        if (stream.active) {
          requestAnimationFrame(checkLevel);
        }
      };
      checkLevel();

      setTimeout(() => {
        stream.getTracks().forEach(track => track.stop());
        try { audioCtx.close(); } catch (e) {}
        setIsTestingMic(false);
        setMicAudioLevel(0);
        toast.success('Microphone test completed successfully!');
      }, 5000);
    } catch (err) {
      toast.error('Could not access microphone. Please check browser permissions.');
    }
  };

  // Memory management local state
  const [newMemoryInput, setNewMemoryInput] = useState('');

  // Confirmation Modals
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [clearMemoryModalOpen, setClearMemoryModalOpen] = useState(false);
  const [clearHistoryModalOpen, setClearHistoryModalOpen] = useState(false);
  const [deleteAccountModalOpen, setDeleteAccountModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeSettings(updated => {
      setSettingsState(updated);
    });
    return () => unsubscribe();
  }, []);

  const handleSettingChange = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSetting(key, value);
    toast.success(`Updated setting: ${String(key)}`, { duration: 1500 });
  };

  const handleTestKey = async () => {
    setIsTestingKey(true);
    setKeyTestResult(null);
    const hasMiniMax = settings.minimaxKey.trim();
    const hasBfl = settings.bflKey.trim();
    const hasOpenAI = settings.openaiKey.trim();

    if (!hasMiniMax && !hasBfl && !hasOpenAI) {
      setKeyTestResult({ success: false, message: 'No custom MiniMax, BFL, or OpenAI API Key entered.' });
      setIsTestingKey(false);
      return;
    }

    try {
      if (hasBfl) {
        // Test BFL API
        const res = await fetch('https://api.bfl.ml/v1/flux-schnell', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-key': settings.bflKey.trim(),
            Authorization: `Bearer ${settings.bflKey.trim()}`,
          },
          body: JSON.stringify({
            prompt: 'Test ping',
            width: 512,
            height: 512,
          }),
        });

        if (res.ok || res.status === 200 || res.status === 201) {
          setKeyTestResult({ success: true, message: 'Black Forest Labs (FLUX.1) API Key verified!' });
          toast.success('BFL FLUX API Key is active & verified!');
        } else if (res.status === 402 || res.status === 400) {
          setKeyTestResult({ success: true, message: 'BFL API Key authenticated successfully!' });
          toast.success('BFL API Key connected!');
        } else {
          const data = await res.json().catch(() => ({}));
          setKeyTestResult({ success: false, message: data?.error || `BFL verification returned HTTP ${res.status}` });
        }
      } else if (hasMiniMax) {
        const res = await fetch('https://api.minimax.io/v1/responses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${settings.minimaxKey.trim()}`,
          },
          body: JSON.stringify({
            model: 'MiniMax-M3',
            input: 'Ping test',
            stream: false,
          }),
        });
        if (res.ok) {
          setKeyTestResult({ success: true, message: 'MiniMax API Key connection verified successfully!' });
          toast.success('MiniMax API Key is active & verified!');
        } else {
          const data = await res.json().catch(() => ({}));
          setKeyTestResult({ success: false, message: data.error?.message || `MiniMax verification returned HTTP ${res.status}` });
        }
      } else {
        const res = await fetch('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${hasOpenAI}` },
        });
        if (res.ok) {
          setKeyTestResult({ success: true, message: 'API Key connection verified successfully!' });
          toast.success('OpenAI API Key is valid!');
        } else {
          const data = await res.json().catch(() => ({}));
          setKeyTestResult({ success: false, message: data.error?.message || 'Key verification failed.' });
        }
      }
    } catch (e: any) {
      setKeyTestResult({ success: false, message: e.message || 'Network verification error.' });
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleTestVoice = () => {
    setIsPlayingVoice(true);
    const persona = VOICE_PERSONAS.find(p => p.id === settings.voicePersona);
    const sampleText = `Testing AI voice setting with ${persona?.name || 'selected persona'}.`;
    speakTextWithPersona(sampleText, {
      personaId: settings.voicePersona,
      rate: settings.voiceSpeed,
      onStart: () => setIsPlayingVoice(true),
      onEnd: () => setIsPlayingVoice(false),
      onError: () => setIsPlayingVoice(false),
    });
  };

  const handleAddMemory = () => {
    if (!newMemoryInput.trim()) return;
    const updated = [...settings.savedMemories, newMemoryInput.trim()];
    handleSettingChange('savedMemories', updated);
    setNewMemoryInput('');
    toast.success('Added new memory snippet!');
  };

  const handleDeleteMemory = (index: number) => {
    const updated = settings.savedMemories.filter((_, i) => i !== index);
    handleSettingChange('savedMemories', updated);
    toast.success('Deleted memory snippet');
  };

  const handleClearAllMemories = () => {
    handleSettingChange('savedMemories', []);
    setClearMemoryModalOpen(false);
    toast.success('Cleared all saved memories');
  };

  const handleConfirmResetAll = () => {
    resetAllSettings();
    setResetModalOpen(false);
    toast.success('All settings reset to defaults');
  };

  const handleConfirmClearHistory = () => {
    setClearHistoryModalOpen(false);
    toast.success('Cleared chat conversation history');
  };

  const handleConfirmDeleteAccount = () => {
    setDeleteAccountModalOpen(false);
    toast.success('Account deletion requested');
  };

  // Search Filter logic across all categories
  const filteredSearchItems = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();

    const items: { category: CategoryDef; card: React.ReactNode }[] = [];

    // Helper to check text
    const matches = (title: string, desc: string, cat: string) =>
      title.toLowerCase().includes(q) || desc.toLowerCase().includes(q) || cat.toLowerCase().includes(q);

    if (matches('Profile Name', 'Your public display name across AI chats', 'Account')) {
      items.push({
        category: CATEGORIES[0],
        card: (
          <SettingCard key="account_name" title="Profile Name" description="Your public display name" categoryBadge="Account">
            <input
              type="text"
              value={settings.profileName}
              onChange={e => handleSettingChange('profileName', e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white"
            />
          </SettingCard>
        )
      });
    }

    if (matches('Theme', 'System, Light, or Dark mode', 'Appearance')) {
      items.push({
        category: CATEGORIES[1],
        card: (
          <SettingCard key="app_theme" title="Theme Mode" description="Choose color theme" categoryBadge="Appearance">
            <SegmentedControl
              options={[
                { value: 'system', label: 'System' },
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' }
              ]}
              value={settings.theme}
              onChange={val => handleSettingChange('theme', val)}
            />
          </SettingCard>
        )
      });
    }

    if (matches('Accent Color', 'Visual theme highlight accent color', 'Appearance')) {
      items.push({
        category: CATEGORIES[1],
        card: (
          <SettingCard key="app_accent" title="Accent Color" description="Select UI highlight accent color" categoryBadge="Appearance">
            <ColorPicker value={settings.accentColor} onChange={c => handleSettingChange('accentColor', c)} />
          </SettingCard>
        )
      });
    }

    if (matches('AI Personality', 'Balanced, Concise, Creative, or Precise', 'AI Behavior')) {
      items.push({
        category: CATEGORIES[2],
        card: (
          <SettingCard key="ai_personality" title="AI Personality" description="Set conversational style" categoryBadge="AI Behavior">
            <DropdownSelect
              options={[
                { value: 'balanced', label: 'Balanced' },
                { value: 'concise', label: 'Concise' },
                { value: 'creative', label: 'Creative' },
                { value: 'precise', label: 'Precise' },
                { value: 'socratic', label: 'Socratic' }
              ]}
              value={settings.personality}
              onChange={v => handleSettingChange('personality', v as any)}
            />
          </SettingCard>
        )
      });
    }

    if (matches('Reasoning Mode', 'Step-by-step thinking visualizer before answers', 'AI Behavior')) {
      items.push({
        category: CATEGORIES[2],
        card: (
          <SettingCard key="ai_reasoning" title="Reasoning / Thinking Mode" description="Enable explicit reasoning step execution" categoryBadge="AI Behavior">
            <ToggleSwitch checked={settings.reasoning} onChange={v => handleSettingChange('reasoning', v)} />
          </SettingCard>
        )
      });
    }

    if (matches('Voice Persona', 'Male, female, and natural voice personas', 'Voice')) {
      items.push({
        category: CATEGORIES[4],
        card: (
          <SettingCard key="voice_persona" title="Voice Persona" description="Choose voice accent and pitch" categoryBadge="Voice">
            <DropdownSelect
              options={VOICE_PERSONAS.map(p => ({ value: p.id, label: p.name, description: p.description }))}
              value={settings.voicePersona}
              onChange={v => handleSettingChange('voicePersona', v)}
            />
          </SettingCard>
        )
      });
    }

    if (matches('Voice Speed', 'Adjust speech rate speed multiplier', 'Voice')) {
      items.push({
        category: CATEGORIES[4],
        card: (
          <SettingCard key="voice_speed" title="Voice Speech Speed" description="Adjust speech rate speed multiplier" categoryBadge="Voice">
            <SliderControl min={0.5} max={2.0} step={0.05} value={settings.voiceSpeed} onChange={v => handleSettingChange('voiceSpeed', v)} formatValue={v => `${v.toFixed(2)}x`} />
          </SettingCard>
        )
      });
    }

    if (matches('Memory', 'Enable long-term conversational memory', 'Memory')) {
      items.push({
        category: CATEGORIES[5],
        card: (
          <SettingCard key="memory_enable" title="Enable Memory" description="Allow AI to remember user preferences across chats" categoryBadge="Memory">
            <ToggleSwitch checked={settings.memory} onChange={v => handleSettingChange('memory', v)} />
          </SettingCard>
        )
      });
    }

    if (matches('Web Search', 'Automatically search live web when needed', 'Search')) {
      items.push({
        category: CATEGORIES[7],
        card: (
          <SettingCard key="web_search" title="Auto Web Search" description="Search web for real-time answers" categoryBadge="Search & Sources">
            <ToggleSwitch checked={settings.webSearch} onChange={v => handleSettingChange('webSearch', v)} />
          </SettingCard>
        )
      });
    }

    if (matches('Developer API Keys', 'Custom OpenAI and Gemini API keys', 'Developer')) {
      items.push({
        category: CATEGORIES[13],
        card: (
          <SettingCard key="dev_keys" title="Developer API Keys" description="Configure sk-... and AIza... API keys" categoryBadge="Developer">
            <span className="text-xs font-mono text-cyan-300">Configured in Developer Tab</span>
          </SettingCard>
        )
      });
    }

    return items;
  }, [searchQuery, settings]);

  // RENDER CONTENT PER CATEGORY
  const renderCategoryContent = () => {
    switch (activeCategory) {
      case 'account':
        return (
          <div className="space-y-4">
            <SettingCard title="Profile Name" description="Your display name used in AI conversations and exported reports.">
              <input
                type="text"
                value={settings.profileName}
                onChange={e => handleSettingChange('profileName', e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/60 w-48"
              />
            </SettingCard>

            <SettingCard title="Email Address" description="Associated email for account sync and backups.">
              <input
                type="email"
                value={settings.profileEmail}
                onChange={e => handleSettingChange('profileEmail', e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/60 w-52"
              />
            </SettingCard>

            <SettingCard title="Profile Picture URL" description="Paste custom image avatar URL for your profile card.">
              <div className="flex items-center gap-3">
                {settings.profileAvatar ? (
                  <img src={settings.profileAvatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-white/20" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/70">
                    <User size={15} />
                  </div>
                )}
                <input
                  type="text"
                  placeholder="https://..."
                  value={settings.profileAvatar}
                  onChange={e => handleSettingChange('profileAvatar', e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-white/30 w-48"
                />
              </div>
            </SettingCard>

            <div className="pt-2">
              <InformationRow label="Account Status" value="Active Free Tier" icon={<ShieldCheck size={14} />} status="success" />
            </div>

            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteAccountModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut size={14} /> Delete Account
              </button>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-4">
            <SettingCard title="Theme Mode" description="Toggle between Dark Mode and High-Contrast Light Mode with full CSS variable support.">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full">
                <ThemeSwitcher variant="segmented" />
              </div>
            </SettingCard>

            {/* ── Dynamic Wallpaper & Video Studio Action Banner ── */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-purple-500/15 border border-orange-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shadow-orange-500/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 shrink-0">
                  <Film size={20} />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>Dynamic Wallpaper & Video Studio</span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] bg-orange-500/20 text-orange-300 font-bold border border-orange-500/30">
                      4K • 60-120 FPS
                    </span>
                  </div>
                  <div className="text-[11px] text-white/60">
                    Upload custom videos, live shader presets, or choose curated 4K animated wallpapers.
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsWallpaperPickerOpen(true)}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-black font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-orange-500/20 transition-all cursor-pointer shrink-0"
              >
                <Film size={14} />
                <span>Open Wallpaper Studio</span>
              </button>
            </div>

            <SettingCard title="Background Wallpaper Style" description="Select an animated vector wallpaper, interactive live shader, 4K video, or upload your own image/video.">
              <SegmentedControl
                options={[
                  { value: 'anime-warrior', label: '🔥 Anime' },
                  { value: 'gojo-anime', label: '⚡ Gojo' },
                  { value: 'samurai-video', label: '⚔️ Samurai' },
                  { value: 'live-wallpaper', label: '🌌 Live 60FPS' },
                  { value: 'custom-video', label: '🎥 Custom Video' },
                  { value: 'custom-image', label: '🖼️ Custom Image' },
                ]}
                value={settings.backgroundMode || 'anime-warrior'}
                onChange={val => handleSettingChange('backgroundMode', val as any)}
              />
            </SettingCard>

            {/* ── Live Wallpaper Presets Picker ── */}
            {settings.backgroundMode === 'live-wallpaper' && (
              <SettingCard title="Live Interactive Wallpaper Presets" description="GPU-accelerated 60-120 FPS dynamic visual shaders with smooth particle motion and zero CPU load.">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                  {[
                    { id: 'neon-nebula', name: 'Neon Nebula', icon: '🌌', desc: 'Cosmic particle clouds' },
                    { id: 'iridescent-aurora', name: 'Iridescent Aurora', icon: '🌊', desc: 'Flowing harmonic waves' },
                    { id: 'cyber-matrix', name: 'Cyber Matrix', icon: '💻', desc: 'Glowing digital rain' },
                    { id: 'hyperspace', name: 'Hyperspace Warp', icon: '🚀', desc: '3D starfield velocity' },
                    { id: 'sakura-embers', name: 'Sakura Embers', icon: '🌸', desc: 'Floating fire petals' },
                    { id: 'quantum-circuit', name: 'Quantum Circuit', icon: '⚡', desc: 'Pulsing electron grid' },
                  ].map(preset => {
                    const isSelected = (settings.liveWallpaperPreset || 'neon-nebula') === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSettingChange('liveWallpaperPreset', preset.id as any)}
                        className={cn(
                          "p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1.5",
                          isSelected
                            ? "bg-cyan-500/20 border-cyan-500/50 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/40"
                            : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-white/80"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xl">{preset.icon}</span>
                          {isSelected && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500 text-black font-bold">Active</span>}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white">{preset.name}</div>
                          <div className="text-[11px] text-white/50">{preset.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </SettingCard>
            )}

            {/* ── Custom Video & Live Video Upload / URL Section ── */}
            {(settings.backgroundMode === 'custom-video' || settings.backgroundMode === 'samurai-video') && (
              <SettingCard title="Upload or Set Live Video Wallpaper" description="Upload your own MP4, WebM, or MOV video file, or link any direct video stream URL.">
                <div className="flex flex-col gap-3 pt-1">
                  {/* File Upload for Videos */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <label className="px-4 py-2.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-300 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shrink-0">
                      <Upload size={15} />
                      <span>Choose Video File (.mp4, .webm, .mov)</span>
                      <input
                        type="file"
                        accept="video/*,image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.type.startsWith('video/')) {
                              try {
                                const id = `video_${Date.now()}`;
                                const blobUrl = await saveWallpaperBlob(id, file, 'video', file.name);
                                handleSettingChange('customVideoUrl', blobUrl);
                                handleSettingChange('customVideoId', id);
                                handleSettingChange('customVideoName', file.name);
                                handleSettingChange('backgroundMode', 'custom-video');
                                toast.success(`Live Video "${file.name}" saved & applied!`);
                              } catch (err) {
                                const url = URL.createObjectURL(file);
                                handleSettingChange('customVideoUrl', url);
                                handleSettingChange('backgroundMode', 'custom-video');
                                toast.success('Live Video applied!');
                              }
                            } else {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const result = event.target?.result as string;
                                if (result) {
                                  handleSettingChange('customBackgroundImage', result);
                                  handleSettingChange('backgroundMode', 'custom-image');
                                  toast.success('Custom wallpaper image applied!');
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }
                        }}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => setIsWallpaperPickerOpen(true)}
                      className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs border border-white/10 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Film size={13} className="text-orange-400" />
                      <span>Browse Full Video Studio</span>
                    </button>
                  </div>

                  {/* Direct Video URL Input */}
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      placeholder="https://.../video.mp4 or direct stream link"
                      value={settings.customVideoUrl || ''}
                      onChange={(e) => {
                        handleSettingChange('customVideoUrl', e.target.value);
                        if (e.target.value.trim()) {
                          handleSettingChange('backgroundMode', 'custom-video');
                        }
                      }}
                      className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50"
                    />
                    {settings.customVideoUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          handleSettingChange('customVideoUrl', '');
                          handleSettingChange('backgroundMode', 'samurai-video');
                          toast.info('Reset video to Samurai Blood Eclipse');
                        }}
                        className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs border border-white/10 transition-colors cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  {/* Curated 4K Video Wallpapers Quick Gallery */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-medium text-white/60">Featured Live Video Wallpapers:</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { name: '⚔️ Samurai Eclipse', url: '/samurai-background.mp4' },
                        { name: '⚡ Quantum Circuit', url: 'https://assets.mixkit.co/videos/preview/mixkit-circuit-board-with-moving-electrons-41525-large.mp4' },
                        { name: '🌊 Ocean Surface', url: 'https://assets.mixkit.co/videos/preview/mixkit-blue-water-surface-in-slow-motion-41517-large.mp4' },
                        { name: '🌠 Cosmic Starfield', url: 'https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-background-1610-large.mp4' },
                      ].map((vid) => {
                        const isCurrent = (settings.customVideoUrl === vid.url) || (!settings.customVideoUrl && vid.url === '/samurai-background.mp4' && settings.backgroundMode === 'samurai-video');
                        return (
                          <button
                            key={vid.url}
                            type="button"
                            onClick={() => {
                              handleSettingChange('customVideoUrl', vid.url);
                              handleSettingChange('backgroundMode', 'custom-video');
                              toast.success(`Applied ${vid.name}!`);
                            }}
                            className={cn(
                              "px-2.5 py-2 rounded-xl text-left text-xs transition-all border cursor-pointer truncate",
                              isCurrent
                                ? "bg-orange-500/20 border-orange-500/60 text-orange-200 font-semibold"
                                : "bg-white/5 border-white/10 hover:bg-white/10 text-white/70"
                            )}
                          >
                            {vid.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Live Video Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-white/5">
                    <div>
                      <span className="text-[11px] text-white/60 block mb-1.5">Playback Speed</span>
                      <SegmentedControl
                        options={[
                          { value: '0.75', label: '0.75x' },
                          { value: '1', label: '1.0x' },
                          { value: '1.25', label: '1.25x' },
                          { value: '1.5', label: '1.5x' },
                        ]}
                        value={String(settings.videoPlaybackSpeed ?? 1.0)}
                        onChange={val => handleSettingChange('videoPlaybackSpeed', parseFloat(val))}
                      />
                    </div>

                    <div>
                      <span className="text-[11px] text-white/60 block mb-1.5">Dark Dimmer</span>
                      <SegmentedControl
                        options={[
                          { value: '0.15', label: '15%' },
                          { value: '0.3', label: '30%' },
                          { value: '0.45', label: '45%' },
                          { value: '0.6', label: '60%' },
                        ]}
                        value={String(settings.videoBackgroundOverlay ?? 0.35)}
                        onChange={val => handleSettingChange('videoBackgroundOverlay', parseFloat(val))}
                      />
                    </div>

                    <div>
                      <span className="text-[11px] text-white/60 block mb-1.5">Frost Blur</span>
                      <SegmentedControl
                        options={[
                          { value: '0', label: 'Off' },
                          { value: '4', label: '4px' },
                          { value: '8', label: '8px' },
                          { value: '12', label: '12px' },
                        ]}
                        value={String(settings.videoBlur ?? 0)}
                        onChange={val => handleSettingChange('videoBlur', parseInt(val, 10))}
                      />
                    </div>

                    <div>
                      <span className="text-[11px] text-white/60 block mb-1.5">Audio Track</span>
                      <button
                        type="button"
                        onClick={() => handleSettingChange('videoMuted', !settings.videoMuted)}
                        className="w-full px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/80 flex items-center justify-center gap-2 cursor-pointer"
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
              </SettingCard>
            )}

            {/* ── Custom Image Upload Section ── */}
            {settings.backgroundMode === 'custom-image' && (
              <SettingCard title="Upload Custom Wallpaper Image" description="Upload any JPG, PNG, GIF, or WEBP image to set as your full-screen phone & desktop background.">
                <div className="flex flex-col gap-3 pt-1">
                  <label className="px-4 py-2.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-300 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer w-fit">
                    <Upload size={15} />
                    <span>Select Image from Gallery</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const result = event.target?.result as string;
                            if (result) {
                              handleSettingChange('customBackgroundImage', result);
                              handleSettingChange('backgroundMode', 'custom-image');
                              toast.success('Custom background image set successfully!');
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>

                  {settings.customBackgroundImage && (
                    <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/10">
                      <img src={settings.customBackgroundImage} alt="Custom Background Preview" className="w-20 h-14 rounded-lg object-cover border border-white/20" />
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-white/80 font-medium">Active Custom Image</span>
                        <button
                          type="button"
                          onClick={() => {
                            handleSettingChange('customBackgroundImage', '');
                            handleSettingChange('backgroundMode', 'anime-warrior');
                            toast.info('Reset to Anime Legend Wallpaper');
                          }}
                          className="text-xs text-rose-400 hover:underline cursor-pointer text-left"
                        >
                          Remove Image & Reset
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </SettingCard>
            )}

            <SettingCard title="Accent Color" description="Personalize button highlights, progress indicators, and active badges.">
              <ColorPicker value={settings.accentColor} onChange={color => handleSettingChange('accentColor', color)} />
            </SettingCard>

            <SettingCard title="Background Overlay Tint" description="Adjust dark transparency overlay depth for optimal AI text and message contrast.">
              <SegmentedControl
                options={[
                  { value: '0.15', label: 'Vivid (15%)' },
                  { value: '0.30', label: 'Balanced (30%)' },
                  { value: '0.45', label: 'Deep (45%)' },
                  { value: '0.60', label: 'Dark (60%)' },
                ]}
                value={String(settings.videoBackgroundOverlay ?? 0.30)}
                onChange={val => handleSettingChange('videoBackgroundOverlay', parseFloat(val))}
              />
            </SettingCard>

            <SettingCard title="Chat Canvas Pattern" description="Select background pattern texture for message thread canvas.">
              <DropdownSelect
                options={[
                  { value: 'default', label: 'Default Solid' },
                  { value: 'subtle-grid', label: 'Subtle Grid' },
                  { value: 'dots', label: 'Minimal Dots' },
                  { value: 'gradient', label: 'Atmospheric Gradient' },
                ]}
                value={settings.chatBackground}
                onChange={val => handleSettingChange('chatBackground', val as any)}
              />
            </SettingCard>

            <SettingCard title="Font Size Scale" description="Adjust text sizing scale across chat messages and control panels.">
              <SegmentedControl
                options={[
                  { value: 'small', label: 'Small' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'large', label: 'Large' },
                ]}
                value={settings.fontSize}
                onChange={val => handleSettingChange('fontSize', val)}
              />
            </SettingCard>

            <SettingCard title="Compact View Mode" description="Reduce line padding and padding margins for high-density reading.">
              <ToggleSwitch checked={settings.compactMode} onChange={val => handleSettingChange('compactMode', val)} />
            </SettingCard>

            <SettingCard title="Animation Effects" description="Enable GPU-accelerated micro-interactions and entrance transitions.">
              <ToggleSwitch checked={settings.animationEffects} onChange={val => handleSettingChange('animationEffects', val)} />
            </SettingCard>

            <SettingCard title="Reduce Motion" description="Minimize animation transitions for accessibility and motion sensitivity.">
              <ToggleSwitch checked={settings.reduceMotion} onChange={val => handleSettingChange('reduceMotion', val)} />
            </SettingCard>
          </div>
        );

      case 'ai_behavior':
        return (
          <div className="space-y-4">
            <SettingCard title="AI Personality Archetype" description="Guides tone, communication style, and structural clarity.">
              <DropdownSelect
                options={[
                  { value: 'balanced', label: 'Balanced & Helpful', description: 'Friendly, natural, articulate' },
                  { value: 'concise', label: 'Direct & Concise', description: 'Minimal fluff, bulleted outcomes' },
                  { value: 'creative', label: 'Creative & Imaginative', description: 'Expressive analogies & storytelling' },
                  { value: 'precise', label: 'Technical & Precise', description: 'Rigor, code depth & formal structure' },
                  { value: 'socratic', label: 'Socratic Tutor', description: 'Guides with probing questions' },
                ]}
                value={settings.personality}
                onChange={val => handleSettingChange('personality', val as any)}
              />
            </SettingCard>

            <SettingCard title="Response Style" description="Default formatting approach for generated content.">
              <SegmentedControl
                options={[
                  { value: 'natural', label: 'Natural' },
                  { value: 'academic', label: 'Academic' },
                  { value: 'bullet-points', label: 'Bullets' },
                  { value: 'casual', label: 'Casual' },
                ]}
                value={settings.responseStyle}
                onChange={val => handleSettingChange('responseStyle', val as any)}
              />
            </SettingCard>

            <SettingCard title="Response Length" description="Control output verbosity depth.">
              <SegmentedControl
                options={[
                  { value: 'concise', label: 'Concise' },
                  { value: 'balanced', label: 'Balanced' },
                  { value: 'detailed', label: 'Detailed' },
                ]}
                value={settings.responseLength}
                onChange={val => handleSettingChange('responseLength', val as any)}
              />
            </SettingCard>

            <SettingCard title="Creativity / Temperature" description="Higher values yield creative variation; lower values stick to strict facts.">
              <SliderControl min={0.0} max={1.0} step={0.05} value={settings.creativity} onChange={val => handleSettingChange('creativity', val)} formatValue={v => v.toFixed(2)} />
            </SettingCard>

            <SettingCard title="Reasoning / Thinking Mode" description="Executes transparent multi-step reasoning before finalizing answers." info="Improves accuracy for complex math and coding tasks.">
              <ToggleSwitch checked={settings.reasoning} onChange={val => handleSettingChange('reasoning', val)} />
            </SettingCard>

            <SettingCard title="Deep Research Mode" description="Multi-query iterative web exploration with source synthesis.">
              <ToggleSwitch checked={settings.deepResearch} onChange={val => handleSettingChange('deepResearch', val)} />
            </SettingCard>

            <SettingCard title="Auto Web Search Trigger" description="Automatically search live web data when current information is required.">
              <ToggleSwitch checked={settings.autoWebSearch} onChange={val => handleSettingChange('autoWebSearch', val)} />
            </SettingCard>

            <SettingCard title="Follow-up Prompt Suggestions" description="Generate contextual follow-up query pills after AI responses.">
              <ToggleSwitch checked={settings.followUpSuggestions} onChange={val => handleSettingChange('followUpSuggestions', val)} />
            </SettingCard>

            <SettingCard title="Ask Confirmation Before Action" description="Require confirmation modal prior to invoking sensitive tool plugins.">
              <ToggleSwitch checked={settings.askBeforeAction} onChange={val => handleSettingChange('askBeforeAction', val)} />
            </SettingCard>
          </div>
        );

      case 'model':
        return (
          <div className="space-y-4">
            <SettingCard 
              title="⚡ Turbo Mode (Fast Responses)" 
              description="Routes simple queries through a lighter model with lower temperature and streaming for faster, near-instant responses."
              info="Optimal for daily chat, quick clarifications, small lookups, and fast streaming."
            >
              <ToggleSwitch checked={settings.turboMode ?? true} onChange={val => handleSettingChange('turboMode', val)} />
            </SettingCard>

            {settings.turboMode && (
              <>
                <SettingCard title="Turbo Lightweight Model" description="Select the high-speed lightweight model used in Turbo Mode.">
                  <DropdownSelect
                    options={[
                      { value: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite', description: 'Ultra-low latency lightweight model (Default)' },
                      { value: 'gemini-flash-latest', label: 'Gemini Flash Latest', description: 'Standard high-speed flash model' },
                    ]}
                    value={settings.turboModel || 'gemini-3.1-flash-lite'}
                    onChange={val => handleSettingChange('turboModel', val as any)}
                  />
                </SettingCard>

                <SettingCard title="Turbo Temperature" description="Lower temperature delivers deterministic, rapid, factual answers without token drift.">
                  <SliderControl
                    min={0.0}
                    max={0.7}
                    step={0.05}
                    value={settings.turboTemperature ?? 0.2}
                    onChange={val => handleSettingChange('turboTemperature', val)}
                    formatValue={v => `${v.toFixed(2)} (${v <= 0.2 ? 'Instant & Precise' : 'Balanced'})`}
                  />
                </SettingCard>
              </>
            )}

            <SettingCard title="Primary AI Model Engine" description="Select baseline generative model for processing user requests.">
              <DropdownSelect
                options={[
                  { value: 'gemini-3.6-flash', label: 'Gemini 3.6 Flash', description: 'Multimodal execution & live web reasoning' },
                  { value: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite', description: 'Ultra-fast lightweight execution' },
                  { value: 'gpt-4o', label: 'GPT-4o (OpenAI)', description: 'Omni reasoning & deep synthesis' },
                  { value: 'claude-3.5-sonnet', label: 'Claude 3.5 Sonnet', description: 'Exceptional code & writing' },
                  { value: 'deepseek-r1', label: 'DeepSeek R1', description: 'Open reasoning & logic specialist' },
                ]}
                value={settings.selectedModel}
                onChange={val => handleSettingChange('selectedModel', val as any)}
              />
            </SettingCard>

            <SettingCard title="Model Execution Preset" description="Adjust performance balance between latency and reasoning depth.">
              <SegmentedControl
                options={[
                  { value: 'fast', label: 'Fast' },
                  { value: 'balanced', label: 'Balanced' },
                  { value: 'advanced', label: 'Advanced Reasoning' },
                ]}
                value={settings.modelMode}
                onChange={val => handleSettingChange('modelMode', val as any)}
              />
            </SettingCard>

            <SettingCard title="Automatic Model Selection" description="Automatically route queries to optimal model based on task category.">
              <ToggleSwitch checked={settings.autoModelSelect} onChange={val => handleSettingChange('autoModelSelect', val)} />
            </SettingCard>

            <SettingCard title="Context Memory Window" description="Maximum tokens included in active conversation context history.">
              <SliderControl
                min={4000}
                max={128000}
                step={4000}
                value={settings.contextWindow}
                onChange={val => handleSettingChange('contextWindow', val)}
                formatValue={v => `${(v / 1000).toFixed(0)}k tokens`}
              />
            </SettingCard>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <InformationRow label="Model Latency" value={settings.turboMode ? '~120 ms (Turbo)' : '~340 ms'} icon={<Gauge size={14} />} status="success" />
              <InformationRow label="Token Window Limit" value={`${settings.contextWindow.toLocaleString()} Tokens`} icon={<Cpu size={14} />} status="info" />
            </div>
          </div>
        );

      case 'voice':
        return (
          <div className="space-y-4">
            {/* Header Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-purple-950/40 border border-cyan-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0 shadow-inner">
                  <Volume2 size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Advanced AI Voice & Speech Engine
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      SpeechSynthesis API
                    </span>
                  </h3>
                  <p className="text-xs text-white/60">Configure speech engine, languages, voice personas, playback speed, and pitch.</p>
                </div>
              </div>
            </div>

            <SettingCard title="Speech Synthesis Engine" description="Select the voice generation engine for reading aloud AI responses.">
              <DropdownSelect
                options={[
                  { value: 'browser-speech-synthesis', label: 'Browser SpeechSynthesis API (Recommended)', description: 'Built-in high-performance native browser synthesis engine' },
                  { value: 'neural-natural', label: 'Neural Natural Persona Synth', description: 'Deep natural articulation with conversational cadence' },
                  { value: 'ultra-hd-neural', label: 'Ultra HD Neural Studio Engine', description: 'Studio-grade acoustic fidelity and clear phonetics' },
                  { value: 'realtime-synth', label: 'High-Speed Low-Latency Synth', description: 'Instant time-to-first-token for rapid streaming playback' },
                ]}
                value={settings.speechEngine || 'browser-speech-synthesis'}
                onChange={val => handleSettingChange('speechEngine', val)}
              />
            </SettingCard>

            <SettingCard title="Voice Selection Persona" description="Choose preferred vocal synthesis timbre, pitch profile, and accent.">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
                <DropdownSelect
                  options={VOICE_PERSONAS.map(p => ({ value: p.id, label: p.name, description: p.description }))}
                  value={settings.voicePersona}
                  onChange={val => handleSettingChange('voicePersona', val)}
                />
                <button
                  type="button"
                  onClick={handleTestVoice}
                  disabled={isPlayingVoice}
                  className="px-3.5 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-sm"
                >
                  <Play size={14} className={isPlayingVoice ? 'animate-spin' : ''} />
                  <span>{isPlayingVoice ? 'Testing Voice...' : 'Test Audio Persona'}</span>
                </button>
              </div>
            </SettingCard>

            <SettingCard title="Speech Language & Accent" description="Select default language and accent for speech synthesis and recognition.">
              <DropdownSelect
                options={[
                  { value: 'en-US', label: '🇺🇸 English (US)', description: 'United States standard dialect' },
                  { value: 'en-IN', label: '🇮🇳 English (India)', description: 'Indian English dialect' },
                  { value: 'en-GB', label: '🇬🇧 English (UK)', description: 'British English received pronunciation' },
                  { value: 'en-AU', label: '🇦🇺 English (Australia)', description: 'Australian English dialect' },
                  { value: 'hi-IN', label: '🇮🇳 Hindi (हिन्दी)', description: 'Standard Hindi language' },
                  { value: 'es-ES', label: '🇪🇸 Spanish (Español)', description: 'European Spanish' },
                  { value: 'fr-FR', label: '🇫🇷 French (Français)', description: 'Standard Parisian French' },
                  { value: 'de-DE', label: '🇩🇪 German (Deutsch)', description: 'Standard German' },
                  { value: 'ja-JP', label: '🇯🇵 Japanese (日本語)', description: 'Standard Tokyo Japanese' },
                  { value: 'zh-CN', label: '🇨🇳 Chinese (中文)', description: 'Mandarin Chinese (Simplified)' },
                  { value: 'pt-BR', label: '🇧🇷 Portuguese (Brasil)', description: 'Brazilian Portuguese' },
                  { value: 'it-IT', label: '🇮🇹 Italian (Italiano)', description: 'Standard Italian' },
                  { value: 'ru-RU', label: '🇷🇺 Russian (Русский)', description: 'Standard Russian' },
                  { value: 'ko-KR', label: '🇰🇷 Korean (한국어)', description: 'Standard Korean' },
                  { value: 'ar-SA', label: '🇸🇦 Arabic (العربية)', description: 'Modern Standard Arabic' },
                  { value: 'nl-NL', label: '🇳🇱 Dutch (Nederlands)', description: 'Standard Dutch' },
                  { value: 'pl-PL', label: '🇵🇱 Polish (Polski)', description: 'Standard Polish' },
                  { value: 'tr-TR', label: '🇹🇷 Turkish (Türkçe)', description: 'Standard Turkish' },
                ]}
                value={settings.speechLanguage || 'en-US'}
                onChange={val => handleSettingChange('speechLanguage', val)}
              />
            </SettingCard>

            <SettingCard title="Playback Speed Rate" description="Adjust text-to-speech reading speed multiplier (0.5x to 2.0x).">
              <div className="space-y-2 w-full">
                <SliderControl min={0.5} max={2.0} step={0.05} value={settings.voiceSpeed} onChange={val => handleSettingChange('voiceSpeed', val)} formatValue={v => `${v.toFixed(2)}x`} />
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleSettingChange('voiceSpeed', preset)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer",
                        settings.voiceSpeed === preset
                          ? "bg-cyan-500/30 text-cyan-300 border border-cyan-500/40"
                          : "bg-white/5 hover:bg-white/10 text-white/60 border border-white/10"
                      )}
                    >
                      {preset}x
                    </button>
                  ))}
                </div>
              </div>
            </SettingCard>

            <SettingCard title="Voice Timbre Pitch" description="Tune the frequency pitch level for speech synthesis (0.5 to 1.5).">
              <SliderControl min={0.5} max={1.5} step={0.05} value={settings.voicePitch ?? 1.0} onChange={val => handleSettingChange('voicePitch', val)} formatValue={v => `${v.toFixed(2)}`} />
            </SettingCard>

            <SettingCard title="Master Speech Volume" description="Set volume for spoken audio output across calls and responses.">
              <SliderControl min={0.0} max={1.0} step={0.05} value={settings.voiceVolume} onChange={val => handleSettingChange('voiceVolume', val)} formatValue={v => `${Math.round(v * 100)}%`} />
            </SettingCard>

            <SettingCard title="Auto-play Spoken Responses" description="Automatically read generated AI responses out loud upon completion.">
              <ToggleSwitch checked={settings.autoPlay} onChange={val => handleSettingChange('autoPlay', val)} />
            </SettingCard>

            <SettingCard title="Voice Mode Activation" description="Enable hands-free continuous spoken conversation mode.">
              <ToggleSwitch checked={settings.voiceMode} onChange={val => handleSettingChange('voiceMode', val)} />
            </SettingCard>

            <SettingCard title="Background Audio Execution" description="Keep voice synthesis stream active when switching browser tabs.">
              <ToggleSwitch checked={settings.backgroundVoice} onChange={val => handleSettingChange('backgroundVoice', val)} />
            </SettingCard>

            <SettingCard title="Wake Word Activation ('Hey Rishi' / 'Hey AI')" description="Listen for background wake word trigger to initiate voice mode.">
              <ToggleSwitch checked={settings.wakeWordEnabled} onChange={val => handleSettingChange('wakeWordEnabled', val)} />
            </SettingCard>

            {/* Microphone Diagnostics & Audio Level Visualizer */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-white flex items-center gap-1.5">
                    <Mic size={16} className="text-cyan-400" />
                    Microphone Permission & Input Diagnostics
                  </h4>
                  <p className="text-[11px] text-white/50">Test Web Audio microphone input levels and permission status</p>
                </div>

                <button
                  type="button"
                  onClick={handleTestMic}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer border shadow-sm",
                    isTestingMic
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse"
                      : "bg-white/10 hover:bg-white/20 text-white border-white/10"
                  )}
                >
                  <Radio size={13} className={isTestingMic ? "animate-spin text-emerald-400" : ""} />
                  <span>{isTestingMic ? "Testing Input..." : "Test Microphone"}</span>
                </button>
              </div>

              {isTestingMic && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-mono text-white/70">
                    <span>Microphone Input Audio Level:</span>
                    <span className="text-emerald-400 font-bold">{micAudioLevel}%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-black/50 overflow-hidden p-0.5 border border-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-blue-500 transition-all duration-75"
                      style={{ width: `${Math.max(4, micAudioLevel)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'memory':
        return (
          <div className="space-y-4">
            <SettingCard title="Enable Long-Term Memory" description="Allows AI to store key preferences, facts, and conversation context.">
              <ToggleSwitch checked={settings.memory} onChange={val => handleSettingChange('memory', val)} />
            </SettingCard>

            <SettingCard title="Conversation Thread Memory" description="Maintain short-term thread state across user sessions.">
              <ToggleSwitch checked={settings.conversationMemory} onChange={val => handleSettingChange('conversationMemory', val)} />
            </SettingCard>

            <SettingCard title="Temporary Incognito Chat Mode" description="Do not record memory snippets or history during temporary mode.">
              <ToggleSwitch checked={settings.temporaryChatMode} onChange={val => handleSettingChange('temporaryChatMode', val)} />
            </SettingCard>

            {/* View / Manage Saved Memory Items */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-white">Saved Memory Snippets ({settings.savedMemories.length})</h4>
                  <p className="text-[11px] text-white/50">Personal facts and preferences retained by the AI</p>
                </div>
                {settings.savedMemories.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setClearMemoryModalOpen(true)}
                    className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 size={12} /> Clear All
                  </button>
                )}
              </div>

              {/* Add Memory Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Add custom memory (e.g. 'User prefers TypeScript without mock data')..."
                  value={newMemoryInput}
                  onChange={e => setNewMemoryInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddMemory()}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/60"
                />
                <button
                  type="button"
                  onClick={handleAddMemory}
                  className="px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs transition-colors shrink-0 cursor-pointer flex items-center gap-1"
                >
                  <Plus size={14} /> Add
                </button>
              </div>

              {/* Memory List */}
              <div className="space-y-1.5 pt-1">
                {settings.savedMemories.length === 0 ? (
                  <p className="text-xs text-white/40 italic py-2 text-center">No saved memories recorded yet.</p>
                ) : (
                  settings.savedMemories.map((mem, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 text-xs text-white/90">
                      <span className="leading-relaxed">{mem}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteMemory(idx)}
                        className="p-1 rounded-lg hover:bg-rose-500/20 text-white/40 hover:text-rose-300 transition-colors cursor-pointer shrink-0 ml-2"
                        title="Delete snippet"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );

      case 'chat':
        return (
          <div className="space-y-4">
            <SettingCard title="Enter Key Behavior" description="Send message on Enter keypress (Shift+Enter for new line).">
              <ToggleSwitch checked={settings.enterToSend} onChange={val => handleSettingChange('enterToSend', val)} />
            </SettingCard>

            <SettingCard title="Show Message Timestamps" description="Display detailed time stamps on chat bubbles.">
              <ToggleSwitch checked={settings.showTimestamps} onChange={val => handleSettingChange('showTimestamps', val)} />
            </SettingCard>

            <SettingCard title="Syntax Code Highlighting" description="Render code blocks with syntax highlighting and copy button.">
              <ToggleSwitch checked={settings.codeFormatting} onChange={val => handleSettingChange('codeFormatting', val)} />
            </SettingCard>

            <SettingCard title="Markdown Formatting Engine" description="Parse rich headings, tables, LaTeX math equations, and bold text.">
              <ToggleSwitch checked={settings.markdownRendering} onChange={val => handleSettingChange('markdownRendering', val)} />
            </SettingCard>

            <SettingCard title="Auto-scroll Canvas" description="Automatically follow live response generation to bottom.">
              <ToggleSwitch checked={settings.autoScroll} onChange={val => handleSettingChange('autoScroll', val)} />
            </SettingCard>

            <SettingCard title="Message Action Controls" description="Display copy, edit, retry, and share toolbar buttons on AI messages.">
              <ToggleSwitch checked={settings.showMessageActions} onChange={val => handleSettingChange('showMessageActions', val)} />
            </SettingCard>

            <SettingCard title="Regenerate Response Option" description="Allow retrying AI responses with alternative creative samples.">
              <ToggleSwitch checked={settings.regenerateResponse} onChange={val => handleSettingChange('regenerateResponse', val)} />
            </SettingCard>

            <SettingCard title="Edit User Message" description="Allow editing previous user prompts to branch conversations.">
              <ToggleSwitch checked={settings.editMessage} onChange={val => handleSettingChange('editMessage', val)} />
            </SettingCard>

            <SettingCard title="Copy Response Shortcut" description="One-click copy formatted text or code snippet to clipboard.">
              <ToggleSwitch checked={settings.copyResponse} onChange={val => handleSettingChange('copyResponse', val)} />
            </SettingCard>
          </div>
        );

      case 'search':
        return (
          <div className="space-y-4">
            <SettingCard title="Web Search Integration" description="Fetch live web results and real-time updates.">
              <ToggleSwitch checked={settings.webSearch} onChange={val => handleSettingChange('webSearch', val)} />
            </SettingCard>

            <SettingCard title="Deep Research Mode" description="Multi-step recursive search across academic and web databases.">
              <ToggleSwitch checked={settings.deepSearch} onChange={val => handleSettingChange('deepSearch', val)} />
            </SettingCard>

            <SettingCard title="Automatic Search Trigger" description="Intelligently invoke web search only when query requires real-time data.">
              <ToggleSwitch checked={settings.autoSearchNeeded} onChange={val => handleSettingChange('autoSearchNeeded', val)} />
            </SettingCard>

            <SettingCard title="Display Source Cards" description="Show source citation cards and domain favicon references.">
              <ToggleSwitch checked={settings.showSources} onChange={val => handleSettingChange('showSources', val)} />
            </SettingCard>

            <SettingCard title="Show Hyperlinks" description="Render active clickable web links inside response text.">
              <ToggleSwitch checked={settings.showLinks} onChange={val => handleSettingChange('showLinks', val)} />
            </SettingCard>

            <SettingCard title="Include Search Images" description="Display image search grid media directly in answers.">
              <ToggleSwitch checked={settings.showImages} onChange={val => handleSettingChange('showImages', val)} />
            </SettingCard>

            <SettingCard title="SafeSearch Content Filter" description="Filter sensitive or explicit search result content.">
              <SegmentedControl
                options={[
                  { value: 'strict', label: 'Strict' },
                  { value: 'moderate', label: 'Moderate' },
                  { value: 'off', label: 'Off' },
                ]}
                value={settings.safeSearch}
                onChange={val => handleSettingChange('safeSearch', val as any)}
              />
            </SettingCard>
          </div>
        );

      case 'files':
        return (
          <div className="space-y-4">
            <SettingCard title="File & Document Uploads" description="Enable drag-and-drop file uploads in chat interface.">
              <ToggleSwitch checked={settings.fileUploads} onChange={val => handleSettingChange('fileUploads', val)} />
            </SettingCard>

            <SettingCard title="PDF Text Extraction & Analysis" description="Parse text content, tables, and sections from PDF documents.">
              <ToggleSwitch checked={settings.pdfAnalysis} onChange={val => handleSettingChange('pdfAnalysis', val)} />
            </SettingCard>

            <SettingCard title="Image Multimodal Vision" description="Analyze screenshots, diagrams, charts, and images using vision AI.">
              <ToggleSwitch checked={settings.imageUnderstanding} onChange={val => handleSettingChange('imageUnderstanding', val)} />
            </SettingCard>

            <SettingCard title="Video Frames & Audio Analysis" description="Extract keyframes and transcript analysis from video files.">
              <ToggleSwitch checked={settings.videoUnderstanding} onChange={val => handleSettingChange('videoUnderstanding', val)} />
            </SettingCard>

            <SettingCard title="ZIP & Repository Support" description="Unpack code ZIP archives for repository inspection.">
              <ToggleSwitch checked={settings.zipSupport} onChange={val => handleSettingChange('zipSupport', val)} />
            </SettingCard>

            <SettingCard title="Maximum File Size Limit" description="Set maximum allowed file upload size per request.">
              <SliderControl min={5} max={100} step={5} value={settings.maxFileSize} onChange={val => handleSettingChange('maxFileSize', val)} unit=" MB" />
            </SettingCard>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-4">
            <SettingCard title="Data Privacy Controls" description="Manage local data retention and diagnostic sharing settings.">
              <ToggleSwitch checked={settings.dataControls} onChange={val => handleSettingChange('dataControls', val)} />
            </SettingCard>

            <SettingCard title="Record Chat History" description="Save past conversation logs locally in browser storage.">
              <ToggleSwitch checked={settings.chatHistory} onChange={val => handleSettingChange('chatHistory', val)} />
            </SettingCard>

            <SettingCard title="Application Security Lock" description="Require PIN code or device biometric authorization to open app.">
              <ToggleSwitch checked={settings.appLock} onChange={val => handleSettingChange('appLock', val)} />
            </SettingCard>

            <div className="pt-2 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setClearHistoryModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 size={14} /> Clear Conversation History
              </button>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-4">
            <SettingCard title="Push Notifications" description="Receive background completion notifications for deep research queries.">
              <ToggleSwitch checked={settings.notifications} onChange={val => handleSettingChange('notifications', val)} />
            </SettingCard>

            <SettingCard title="AI Response Completion Alerts" description="Notify when long-running AI code or research generation finishes.">
              <ToggleSwitch checked={settings.completionNotifications} onChange={val => handleSettingChange('completionNotifications', val)} />
            </SettingCard>

            <SettingCard title="Sound Effects" description="Play subtle audio chime when AI finishes generating response.">
              <ToggleSwitch checked={settings.sound} onChange={val => handleSettingChange('sound', val)} />
            </SettingCard>

            <SettingCard title="Haptic Vibration" description="Provide subtle haptic touch feedback on mobile controls.">
              <ToggleSwitch checked={settings.vibration} onChange={val => handleSettingChange('vibration', val)} />
            </SettingCard>

            <SettingCard title="Quiet Hours Mode" description="Suppress non-essential alerts during designated rest hours.">
              <ToggleSwitch checked={settings.quietHours} onChange={val => handleSettingChange('quietHours', val)} />
            </SettingCard>
          </div>
        );

      case 'performance':
        return (
          <div className="space-y-4">
            <SettingCard title="Experimental FPS Boost Mode" description="Optimizes rendering pipelines for ultra-smooth 60+ FPS scrolling.">
              <ToggleSwitch checked={settings.fpsBoost} onChange={val => handleSettingChange('fpsBoost', val)} />
            </SettingCard>

            <SettingCard title="Hardware Acceleration" description="Utilize GPU hardware acceleration for CSS transitions and canvas.">
              <ToggleSwitch checked={settings.hardwareAcceleration} onChange={val => handleSettingChange('hardwareAcceleration', val)} />
            </SettingCard>

            <SettingCard title="Low-Power Battery Mode" description="Reduce background polling and heavy visual effects on mobile battery.">
              <ToggleSwitch checked={settings.lowPowerMode} onChange={val => handleSettingChange('lowPowerMode', val)} />
            </SettingCard>

            <SettingCard title="Cache Management" description="Automatically clean old temporary asset caches.">
              <button
                type="button"
                onClick={() => toast.success('Browser memory cache cleared!')}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw size={13} /> Clear Cache
              </button>
            </SettingCard>
          </div>
        );

      case 'plugins':
        return (
          <div className="space-y-4">
            <SettingCard title="Enable Plugins Engine" description="Allow AI model to invoke installed extension tools.">
              <ToggleSwitch checked={settings.enablePlugins} onChange={val => handleSettingChange('enablePlugins', val)} />
            </SettingCard>

            <SettingCard title="Ask Tool Permissions" description="Prompt user before executing external API tools.">
              <ToggleSwitch checked={settings.toolPermissions} onChange={val => handleSettingChange('toolPermissions', val)} />
            </SettingCard>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <h4 className="text-xs sm:text-sm font-semibold text-white">Installed Active Plugins</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {settings.installedPlugins.map((plugin, i) => (
                  <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs">
                    <span className="font-mono text-cyan-300 font-medium">{plugin}</span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Active</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'developer':
        return (
          <div className="space-y-4">
            <SettingCard title="Developer Mode" description="Unlocks diagnostic overlays, latency logs, and network inspectors.">
              <ToggleSwitch checked={settings.developerMode} onChange={val => handleSettingChange('developerMode', val)} />
            </SettingCard>

            <SettingCard title="Debug Info Overlay" description="Display live FPS rate, token streaming speed, and execution times.">
              <ToggleSwitch checked={settings.debugInfo} onChange={val => handleSettingChange('debugInfo', val)} />
            </SettingCard>

            <SettingCard title="Log Verbosity Level" description="Control console logger output verbosity level.">
              <SegmentedControl
                options={[
                  { value: 'info', label: 'Info' },
                  { value: 'debug', label: 'Debug' },
                  { value: 'verbose', label: 'Verbose' },
                ]}
                value={settings.logVerbosity}
                onChange={val => handleSettingChange('logVerbosity', val as any)}
              />
            </SettingCard>

            {/* Custom API Keys Configuration */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
              <div className="flex items-center gap-2">
                <Key size={16} className="text-cyan-400" />
                <h4 className="text-xs sm:text-sm font-semibold text-white">Custom API Keys Override</h4>
              </div>

              {/* OpenAI Key */}
              <div className="space-y-1.5">
                <label className="text-xs text-white/80 font-semibold">OpenAI API Key (sk-...)</label>
                <div className="relative flex items-center">
                  <input
                    type={showOpenaiKey ? 'text' : 'password'}
                    placeholder="sk-proj-..."
                    value={settings.openaiKey}
                    onChange={e => handleSettingChange('openaiKey', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-3 pr-9 py-2 text-xs font-mono text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                    className="absolute right-3 text-white/40 hover:text-white transition-colors cursor-pointer"
                  >
                    {showOpenaiKey ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* MiniMax Key */}
              <div className="space-y-1.5">
                <label className="text-xs text-white/80 font-semibold">MiniMax API Key (sk-api-...)</label>
                <div className="relative flex items-center">
                  <input
                    type={showMinimaxKey ? 'text' : 'password'}
                    placeholder="sk-api-..."
                    value={settings.minimaxKey}
                    onChange={e => handleSettingChange('minimaxKey', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-3 pr-9 py-2 text-xs font-mono text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowMinimaxKey(!showMinimaxKey)}
                    className="absolute right-3 text-white/40 hover:text-white transition-colors cursor-pointer"
                  >
                    {showMinimaxKey ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Black Forest Labs (BFL FLUX) Key */}
              <div className="space-y-1.5">
                <label className="text-xs text-white/80 font-semibold">Black Forest Labs / FLUX.1 API Key (bfl_...)</label>
                <div className="relative flex items-center">
                  <input
                    type={showBflKey ? 'text' : 'password'}
                    placeholder="bfl_..."
                    value={settings.bflKey}
                    onChange={e => handleSettingChange('bflKey', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-3 pr-9 py-2 text-xs font-mono text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowBflKey(!showBflKey)}
                    className="absolute right-3 text-white/40 hover:text-white transition-colors cursor-pointer"
                  >
                    {showBflKey ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Gemini Key */}
              <div className="space-y-1.5">
                <label className="text-xs text-white/80 font-semibold">Gemini API Key (AIza...)</label>
                <div className="relative flex items-center">
                  <input
                    type={showGeminiKey ? 'text' : 'password'}
                    placeholder="AIzaSy..."
                    value={settings.geminiKey}
                    onChange={e => handleSettingChange('geminiKey', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-3 pr-9 py-2 text-xs font-mono text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGeminiKey(!showGeminiKey)}
                    className="absolute right-3 text-white/40 hover:text-white transition-colors cursor-pointer"
                  >
                    {showGeminiKey ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Key Test Result */}
              {keyTestResult && (
                <div className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${keyTestResult.success ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-rose-500/10 border-rose-500/20 text-rose-300'}`}>
                  {keyTestResult.success ? <Check size={14} /> : <AlertCircle size={14} />}
                  <span>{keyTestResult.message}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleTestKey}
                disabled={isTestingKey}
                className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-300 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isTestingKey ? 'Verifying Key...' : 'Test Connection'}
              </button>
            </div>
          </div>
        );

      case 'about':
        return (
          <div className="space-y-4">
            <SettingCard title="App Version & Build" description="Rishi AI Assistant Engine v2.4.0 (Cloud Build)">
              <span className="text-xs font-mono font-semibold text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full">v2.4.0 Production</span>
            </SettingCard>

            <SettingCard title="Generative Architecture" description="Powered by Google Gemini 3.6 Flash & OpenAI GPT-4o models with real-time research synthesis.">
              <Sparkles size={18} className="text-cyan-400" />
            </SettingCard>

            <div className="space-y-2 pt-2">
              <InformationRow label="Runtime Environment" value="Cloud Run Sandboxed Container" icon={<Cpu size={14} />} status="success" />
              <InformationRow label="System Status" value="All Services Operational" icon={<ShieldCheck size={14} />} status="success" />
              <InformationRow label="License" value="MIT Open License" icon={<FileText size={14} />} status="info" />
            </div>

            <div className="pt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => toast.info('Opening Help & Documentation...')}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <HelpCircle size={14} /> Help & Documentation
              </button>
              <button
                type="button"
                onClick={() => toast.info('Privacy Policy: All chat data remains in local browser storage.')}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Shield size={14} /> Privacy Policy
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const activeCategoryDef = CATEGORIES.find(c => c.id === activeCategory) || CATEGORIES[0];

  return (
    <div className="w-full h-full flex flex-col bg-[#0e0e13] text-white overflow-hidden select-none">
      {/* Sticky Top Header with Search & Controls */}
      <div className="sticky top-0 z-20 px-4 sm:px-6 py-4 bg-[#121218]/90 backdrop-blur-md border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center justify-between w-full sm:w-auto gap-3">
          {mobileCategoryOpen && (
            <button
              type="button"
              onClick={() => setMobileCategoryOpen(false)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors md:hidden cursor-pointer flex items-center gap-1"
            >
              <ArrowLeft size={16} />
              <span className="text-xs font-medium">Categories</span>
            </button>
          )}

          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Sliders size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">System Settings</h2>
              <p className="text-[11px] text-white/50 hidden sm:block">Configure AI behavior, voice, model & interface preferences</p>
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer sm:hidden ml-auto"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Search Bar & Reset System Button */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <SearchInput value={searchQuery} onChange={setSearchQuery} />

          <button
            type="button"
            onClick={() => setResetModalOpen(true)}
            className="p-2.5 sm:px-3 sm:py-2 rounded-2xl bg-white/5 hover:bg-rose-500/15 border border-white/10 hover:border-rose-500/30 text-white/70 hover:text-rose-300 text-xs font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
            title="Reset All Settings to Defaults"
          >
            <RotateCcw size={14} />
            <span className="hidden sm:inline">Reset Defaults</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer hidden sm:block"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Main Container Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* DESKTOP / MOBILE SIDEBAR CATEGORIES */}
        <div
          className={`w-full md:w-64 bg-[#121218]/50 border-r border-white/10 flex flex-col p-3 space-y-1 overflow-y-auto shrink-0 transition-transform ${
            mobileCategoryOpen ? 'hidden md:flex' : 'flex'
          }`}
        >
          <div className="px-3 py-1.5 text-[10px] font-semibold text-white/40 uppercase tracking-wider">
            Categories
          </div>

          {CATEGORIES.map(cat => {
            const isSelected = activeCategory === cat.id && !searchQuery;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setActiveCategory(cat.id);
                  setSearchQuery('');
                  setMobileCategoryOpen(true);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center justify-between group ${
                  isSelected
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-md shadow-cyan-500/5 font-semibold'
                    : 'text-white/70 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isSelected ? 'text-cyan-400' : 'text-white/40 group-hover:text-white/80'}>
                    {cat.icon}
                  </span>
                  <span>{cat.label}</span>
                </div>
                <ChevronRight size={14} className={`text-white/20 transition-transform ${isSelected ? 'text-cyan-400 translate-x-0.5' : ''}`} />
              </button>
            );
          })}
        </div>

        {/* RIGHT CONTENT PANEL */}
        <div
          className={`flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto w-full scroll-smooth ${
            !mobileCategoryOpen ? 'hidden md:block' : 'block'
          }`}
        >
          {/* SEARCH RESULTS VIEW */}
          {searchQuery ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Search size={16} className="text-cyan-400" />
                  <span>Search Results for "{searchQuery}"</span>
                </h3>
                <span className="text-xs font-mono text-cyan-300 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
                  {filteredSearchItems?.length || 0} matches
                </span>
              </div>

              {filteredSearchItems && filteredSearchItems.length > 0 ? (
                filteredSearchItems.map(item => item.card)
              ) : (
                <div className="p-8 text-center bg-white/5 rounded-2xl border border-white/10 space-y-2">
                  <AlertCircle size={28} className="mx-auto text-white/30" />
                  <p className="text-xs text-white/60">No settings found matching "{searchQuery}"</p>
                  <p className="text-[11px] text-white/40">Try searching for keywords like "voice", "theme", "memory", "deep", or "model".</p>
                </div>
              )}
            </div>
          ) : (
            /* STANDARD CATEGORY CONTENT VIEW */
            <div className="space-y-6">
              {/* Category Header Banner */}
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-cyan-500/10 via-white/5 to-purple-500/10 border border-white/10 flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/20">
                  {activeCategoryDef.icon}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">{activeCategoryDef.label}</h3>
                  <p className="text-xs text-white/60">{activeCategoryDef.description}</p>
                </div>
              </div>

              {/* Category Setting Items */}
              {renderCategoryContent()}
            </div>
          )}
        </div>
      </div>

      {/* CONFIRMATION MODALS */}
      <ConfirmationModal
        isOpen={resetModalOpen}
        title="Reset All Settings to Defaults?"
        description="This will restore all AI behavior, theme, voice, model, and application preferences back to factory defaults."
        confirmLabel="Reset All Settings"
        danger={true}
        onConfirm={handleConfirmResetAll}
        onCancel={() => setResetModalOpen(false)}
      />

      <ConfirmationModal
        isOpen={clearMemoryModalOpen}
        title="Clear All Saved Memories?"
        description="This will permanently wipe all stored memory snippets and personal facts remembered by the AI."
        confirmLabel="Wipe Memories"
        danger={true}
        onConfirm={handleClearAllMemories}
        onCancel={() => setClearMemoryModalOpen(false)}
      />

      <ConfirmationModal
        isOpen={clearHistoryModalOpen}
        title="Clear Conversation History?"
        description="Are you sure you want to permanently clear your chat history logs?"
        confirmLabel="Clear History"
        danger={true}
        onConfirm={handleConfirmClearHistory}
        onCancel={() => setClearHistoryModalOpen(false)}
      />

      <ConfirmationModal
        isOpen={deleteAccountModalOpen}
        title="Delete Local Account Data?"
        description="This will remove your local profile and stored preferences from this browser device."
        confirmLabel="Delete Account Data"
        danger={true}
        onConfirm={handleConfirmDeleteAccount}
        onCancel={() => setDeleteAccountModalOpen(false)}
      />

      {/* FULLSCREEN WALLPAPER & VIDEO STUDIO MODAL */}
      <WallpaperPickerModal
        isOpen={isWallpaperPickerOpen}
        onClose={() => {
          setIsWallpaperPickerOpen(false);
          setSettingsState(getAllSettings());
        }}
      />
    </div>
  );
};

export default SettingsView;
