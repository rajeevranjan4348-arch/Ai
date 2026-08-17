import { useState, useEffect } from 'react';
import { KeySource, getOpenAIKeyInfo, getGeminiKeyInfo, saveCustomKeys, clearCustomKeys } from './settings';
import { getAIVoicePersonaId, saveAIVoicePersonaId, getAIVoiceRate, saveAIVoiceRate } from './voiceService';

export interface AppSettings {
  // Account
  profileName: string;
  profileEmail: string;
  profileAvatar: string;
  
  // Appearance
  theme: 'system' | 'light' | 'dark';
  accentColor: 'default' | 'cyan' | 'purple' | 'emerald' | 'amber' | 'rose' | 'blue';
  chatBackground: 'default' | 'subtle-grid' | 'dots' | 'gradient';
  backgroundMode: 'anime-warrior' | 'gojo-anime' | 'samurai-video' | 'custom-image' | 'custom-video' | 'live-wallpaper';
  customBackgroundImage: string;
  customImageId?: string;
  customVideoUrl: string;
  customVideoId?: string;
  customVideoName?: string;
  liveWallpaperPreset: 'cyber-matrix' | 'neon-nebula' | 'iridescent-aurora' | 'hyperspace' | 'sakura-embers' | 'quantum-circuit';
  videoPlaybackSpeed: number;
  videoMuted: boolean;
  videoVolume: number; // 0.0 - 1.0
  videoBackgroundEnabled: boolean;
  videoBackgroundOverlay: number; // 0.1 to 0.9
  videoBackgroundSrc: string;
  videoFit: 'cover' | 'contain';
  videoBlur: number; // 0, 4, 8, 12 px
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
  animationEffects: boolean;
  reduceMotion: boolean;

  // AI Behavior
  personality: 'balanced' | 'concise' | 'creative' | 'precise' | 'socratic';
  responseStyle: 'natural' | 'academic' | 'bullet-points' | 'casual';
  responseLength: 'concise' | 'balanced' | 'detailed';
  creativity: number; // 0.0 - 1.0
  reasoning: boolean;
  deepResearch: boolean;
  autoWebSearch: boolean;
  followUpSuggestions: boolean;
  askBeforeAction: boolean;

  // Model
  selectedModel: 'gemini-3.6-flash' | 'gemini-3.1-flash-lite' | 'gpt-4o' | 'claude-3.5-sonnet' | 'deepseek-r1';
  modelMode: 'fast' | 'balanced' | 'advanced';
  turboMode: boolean; // Ultra-fast lightweight model execution for simple queries
  turboModel: 'gemini-3.1-flash-lite' | 'gemini-flash-latest';
  turboTemperature: number; // Low temperature for near-instant deterministic outputs
  autoModelSelect: boolean;
  contextWindow: number; // e.g. 32000

  // Voice
  voiceMode: boolean;
  voicePersona: string;
  voiceGender: 'male' | 'female' | 'any';
  speechEngine: 'browser-speech-synthesis' | 'neural-natural' | 'ultra-hd-neural' | 'realtime-synth';
  speechLanguage: string;
  voicePitch: number; // 0.5 - 1.5
  voiceSpeed: number; // 0.5 - 2.0
  voiceVolume: number; // 0.0 - 1.0
  autoPlay: boolean;
  backgroundVoice: boolean;
  micPermissionGranted: boolean;
  wakeWordEnabled: boolean;

  // Memory
  memory: boolean;
  conversationMemory: boolean;
  temporaryChatMode: boolean;
  savedMemories: string[];

  // Chat
  newChatBehavior: 'clear' | 'archive';
  enterToSend: boolean;
  showTimestamps: boolean;
  codeFormatting: boolean;
  markdownRendering: boolean;
  autoScroll: boolean;
  showMessageActions: boolean;
  regenerateResponse: boolean;
  editMessage: boolean;
  copyResponse: boolean;

  // Search & Sources
  webSearch: boolean;
  deepSearch: boolean;
  autoSearchNeeded: boolean;
  showSources: boolean;
  showLinks: boolean;
  showImages: boolean;
  searchHistoryEnabled: boolean;
  safeSearch: 'strict' | 'moderate' | 'off';

  // Files & Vision
  fileUploads: boolean;
  pdfAnalysis: boolean;
  imageUnderstanding: boolean;
  videoUnderstanding: boolean;
  zipSupport: boolean;
  maxFileSize: number; // MB
  autoFileProcessing: boolean;

  // Privacy & Security
  dataControls: boolean;
  chatHistory: boolean;
  temporaryChats: boolean;
  appLock: boolean;
  appLockPin: string;
  permissionManagement: boolean;

  // Notifications
  notifications: boolean;
  completionNotifications: boolean;
  voiceNotifications: boolean;
  sound: boolean;
  vibration: boolean;
  quietHours: boolean;

  // Performance
  fpsBoost: boolean;
  hardwareAcceleration: boolean;
  reduceAnimations: boolean;
  lowPowerMode: boolean;
  cacheManagement: boolean;

  // Plugins & Tools
  enablePlugins: boolean;
  installedPlugins: string[];
  toolPermissions: boolean;
  connectExternalServices: boolean;

  // Developer
  developerMode: boolean;
  debugInfo: boolean;
  logVerbosity: 'info' | 'debug' | 'verbose';
  openaiKey: string;
  geminiKey: string;
  minimaxKey: string;
  bflKey: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  // Account
  profileName: 'Rishi User',
  profileEmail: 'user@aistudio.build',
  profileAvatar: '',

  // Appearance
  theme: 'dark',
  accentColor: 'cyan',
  chatBackground: 'default',
  backgroundMode: 'anime-warrior',
  customBackgroundImage: '',
  customImageId: '',
  customVideoUrl: '',
  customVideoId: '',
  customVideoName: '',
  liveWallpaperPreset: 'neon-nebula',
  videoPlaybackSpeed: 1.0,
  videoMuted: true,
  videoVolume: 0.8,
  videoBackgroundEnabled: true,
  videoBackgroundOverlay: 0.35,
  videoBackgroundSrc: '/samurai-background.mp4',
  videoFit: 'cover',
  videoBlur: 0,
  fontSize: 'medium',
  compactMode: false,
  animationEffects: true,
  reduceMotion: false,

  // AI Behavior
  personality: 'balanced',
  responseStyle: 'natural',
  responseLength: 'balanced',
  creativity: 0.7,
  reasoning: true,
  deepResearch: false,
  autoWebSearch: true,
  followUpSuggestions: true,
  askBeforeAction: true,

  // Model
  selectedModel: 'gemini-3.6-flash',
  modelMode: 'balanced',
  turboMode: true,
  turboModel: 'gemini-3.1-flash-lite',
  turboTemperature: 0.2,
  autoModelSelect: true,
  contextWindow: 32000,

  // Voice
  voiceMode: false,
  voicePersona: 'male-deep',
  voiceGender: 'male',
  speechEngine: 'browser-speech-synthesis',
  speechLanguage: 'en-US',
  voicePitch: 1.0,
  voiceSpeed: 1.0,
  voiceVolume: 1.0,
  autoPlay: false,
  backgroundVoice: false,
  micPermissionGranted: true,
  wakeWordEnabled: false,

  // Memory
  memory: true,
  conversationMemory: true,
  temporaryChatMode: false,
  savedMemories: [
    'User prefers clean concise TypeScript code without mock data.',
    'User is building an AI assistant app with smooth UI transitions.'
  ],

  // Chat
  newChatBehavior: 'clear',
  enterToSend: true,
  showTimestamps: true,
  codeFormatting: true,
  markdownRendering: true,
  autoScroll: true,
  showMessageActions: true,
  regenerateResponse: true,
  editMessage: true,
  copyResponse: true,

  // Search & Sources
  webSearch: true,
  deepSearch: false,
  autoSearchNeeded: true,
  showSources: true,
  showLinks: true,
  showImages: true,
  searchHistoryEnabled: true,
  safeSearch: 'moderate',

  // Files & Vision
  fileUploads: true,
  pdfAnalysis: true,
  imageUnderstanding: true,
  videoUnderstanding: true,
  zipSupport: true,
  maxFileSize: 25,
  autoFileProcessing: true,

  // Privacy & Security
  dataControls: true,
  chatHistory: true,
  temporaryChats: false,
  appLock: false,
  appLockPin: '',
  permissionManagement: true,

  // Notifications
  notifications: true,
  completionNotifications: true,
  voiceNotifications: false,
  sound: true,
  vibration: true,
  quietHours: false,

  // Performance
  fpsBoost: true,
  hardwareAcceleration: true,
  reduceAnimations: false,
  lowPowerMode: false,
  cacheManagement: true,

  // Plugins & Tools
  enablePlugins: true,
  installedPlugins: ['web-search', 'code-interpreter', 'weather-widget', 'contacts-search'],
  toolPermissions: true,
  connectExternalServices: true,

  // Developer
  developerMode: false,
  debugInfo: false,
  logVerbosity: 'info',
  openaiKey: '',
  geminiKey: '',
  minimaxKey: '',
  bflKey: '',
};

const STORAGE_KEY = 'ai_assistant_centralized_settings_v1';
const listeners: Set<(settings: AppSettings) => void> = new Set();

let currentSettings: AppSettings = { ...DEFAULT_SETTINGS };

/**
 * Initialize and load settings from localStorage
 */
function loadInitialSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      currentSettings = { ...DEFAULT_SETTINGS, ...parsed };
    } else {
      currentSettings = { ...DEFAULT_SETTINGS };
    }

    // Sync legacy API key stores if present
    try {
      const savedOpenAI = localStorage.getItem('perplexity_openai_api_key');
      const savedGemini = localStorage.getItem('perplexity_gemini_api_key');
      const savedMiniMax = localStorage.getItem('perplexity_minimax_api_key');
      const savedBFL = localStorage.getItem('perplexity_bfl_api_key');
      if (savedOpenAI) currentSettings.openaiKey = savedOpenAI;
      if (savedGemini) currentSettings.geminiKey = savedGemini;
      if (savedMiniMax) currentSettings.minimaxKey = savedMiniMax;
      if (savedBFL) currentSettings.bflKey = savedBFL;
    } catch (e) {
      // Ignore
    }

    // Sync voice settings
    currentSettings.voicePersona = getAIVoicePersonaId();
    currentSettings.voiceSpeed = getAIVoiceRate();

  } catch (e) {
    console.warn('Failed to load settings from localStorage, using defaults:', e);
    currentSettings = { ...DEFAULT_SETTINGS };
  }

  applyGlobalSettingsSideEffects(currentSettings);
  return currentSettings;
}

/**
 * Apply global visual & DOM side effects whenever settings change
 */
function applyGlobalSettingsSideEffects(settings: AppSettings) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // 1. Theme application
  if (settings.theme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else if (settings.theme === 'light') {
    root.classList.add('light');
    root.classList.remove('dark');
  } else {
    // System
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }

  // 2. Accent Color
  const accentHexes: Record<string, string> = {
    default: '#06b6d4',
    cyan: '#06b6d4',
    purple: '#a855f7',
    emerald: '#10b981',
    amber: '#f59e0b',
    rose: '#f43f5e',
    blue: '#3b82f6',
  };
  const activeAccent = accentHexes[settings.accentColor] || accentHexes.cyan;
  root.style.setProperty('--accent-color', activeAccent);

  // 3. Compact & Font size
  root.setAttribute('data-font-size', settings.fontSize);
  if (settings.compactMode) {
    root.setAttribute('data-compact', 'true');
  } else {
    root.removeAttribute('data-compact');
  }

  // 4. Reduce motion
  if (settings.reduceMotion || settings.reduceAnimations) {
    root.setAttribute('data-reduce-motion', 'true');
  } else {
    root.removeAttribute('data-reduce-motion');
  }

  // 5. FPS Boost & Full Potential Hardware Acceleration
  if (settings.fpsBoost !== false) {
    root.setAttribute('data-fps-mode', 'maximum');
    root.style.setProperty('--app-target-fps', '120');
  } else {
    root.removeAttribute('data-fps-mode');
    root.style.removeProperty('--app-target-fps');
  }
}

// Auto-run load on import
loadInitialSettings();

/**
 * Get setting value by key
 */
export function getSetting<K extends keyof AppSettings>(key: K): AppSettings[K] {
  return currentSettings[key];
}

/**
 * Get all current settings
 */
export function getAllSettings(): AppSettings {
  return { ...currentSettings };
}

/**
 * Update a setting value and persist immediately
 */
export function setSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
  currentSettings = {
    ...currentSettings,
    [key]: value,
  };

  saveSettingsToDisk(currentSettings);
  applyGlobalSettingsSideEffects(currentSettings);

  // Legacy sync
  if (key === 'openaiKey') {
    saveCustomKeys({ openaiKey: value as string });
  } else if (key === 'geminiKey') {
    saveCustomKeys({ geminiKey: value as string });
  } else if (key === 'minimaxKey') {
    saveCustomKeys({ minimaxKey: value as string });
  } else if (key === 'bflKey') {
    saveCustomKeys({ bflKey: value as string });
  } else if (key === 'voicePersona') {
    saveAIVoicePersonaId(value as string);
  } else if (key === 'voiceSpeed') {
    saveAIVoiceRate(value as number);
  }

  notifyListeners();
}

/**
 * Reset a single setting key to default
 */
export function resetSetting<K extends keyof AppSettings>(key: K): void {
  setSetting(key, DEFAULT_SETTINGS[key]);
}

/**
 * Reset all settings to default values
 */
export function resetAllSettings(): AppSettings {
  currentSettings = { ...DEFAULT_SETTINGS };
  saveSettingsToDisk(currentSettings);
  clearCustomKeys();
  applyGlobalSettingsSideEffects(currentSettings);
  notifyListeners();
  return currentSettings;
}

/**
 * Save settings object to localStorage
 */
function saveSettingsToDisk(settings: AppSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings to localStorage:', e);
  }
}

/**
 * Dispatch settings-change event and run subscribers
 */
function notifyListeners() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('settings-change', {
        detail: currentSettings,
      })
    );
  }

  listeners.forEach(fn => fn(currentSettings));
}

/**
 * Subscribe to settings changes
 */
export function subscribeSettings(listener: (settings: AppSettings) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * React Hook to subscribe to real-time settings changes
 */
export function useSettingsStore() {
  const [settings, setLocalSettings] = useState<AppSettings>(getAllSettings);

  useEffect(() => {
    return subscribeSettings((newSettings) => {
      setLocalSettings({ ...newSettings });
    });
  }, []);

  return {
    settings,
    setSetting,
    resetSetting,
    resetAllSettings,
  };
}

export const useSettings = useSettingsStore;

