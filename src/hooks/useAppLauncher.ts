import { useState, useEffect, useMemo, useCallback } from 'react';
import { AppItem, INSTALLED_APPS, InAppActionType } from '@/lib/launcher/appsData';
import {
  launchApp,
  launchApp as executeLaunch,
  launchInAppAction,
  parseAndLaunchAppFromCommand,
  parseInAppActionFromCommand,
  LaunchResult,
} from '@/lib/launcher/appLauncherEngine';
import { toast } from 'sonner';

const PINNED_STORAGE_KEY = 'ai_app_launcher_pinned';
const RECENT_STORAGE_KEY = 'ai_app_launcher_recent';

export interface RecentAppEntry {
  appId: string;
  launchedAt: number;
}

export function useAppLauncher() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [pinnedAppIds, setPinnedAppIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(PINNED_STORAGE_KEY);
      return saved ? JSON.parse(saved) : ['youtube', 'whatsapp', 'chrome', 'settings', 'camera'];
    } catch {
      return ['youtube', 'whatsapp', 'chrome', 'settings', 'camera'];
    }
  });

  const [recentApps, setRecentApps] = useState<RecentAppEntry[]>(() => {
    try {
      const saved = localStorage.getItem(RECENT_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [
        { appId: 'whatsapp', launchedAt: Date.now() - 3600000 },
        { appId: 'youtube', launchedAt: Date.now() - 7200000 },
        { appId: 'chrome', launchedAt: Date.now() - 14400000 },
        { appId: 'settings', launchedAt: Date.now() - 28800000 }
      ];
    } catch {
      return [];
    }
  });

  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');

  // Persist pinned apps
  useEffect(() => {
    try {
      localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(pinnedAppIds));
    } catch (e) {
      console.warn('Failed to save pinned apps', e);
    }
  }, [pinnedAppIds]);

  // Persist recent apps
  useEffect(() => {
    try {
      localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(recentApps));
    } catch (e) {
      console.warn('Failed to save recent apps', e);
    }
  }, [recentApps]);

  // Toggle Pin / Favorite
  const togglePinApp = useCallback((appId: string) => {
    setPinnedAppIds(prev => {
      if (prev.includes(appId)) {
        toast.info('Removed from Favorites');
        return prev.filter(id => id !== appId);
      } else {
        toast.success('Pinned to Favorites');
        return [...prev, appId];
      }
    });
  }, []);

  // Record app launch and execute
  const handleLaunchApp = useCallback((app: AppItem): LaunchResult => {
    const result = executeLaunch(app);

    // Update recents
    setRecentApps(prev => {
      const filtered = prev.filter(r => r.appId !== app.id);
      return [{ appId: app.id, launchedAt: Date.now() }, ...filtered].slice(0, 12);
    });

    if (result.success) {
      toast.success(`Launching ${app.name}`, {
        description: result.message,
        duration: 3000,
      });
    } else {
      toast.error(`App Not Found`, {
        description: `${app.name} is not installed or available on this device.`,
        duration: 3500,
      });
    }

    return result;
  }, []);

  // Clear recents
  const clearRecentApps = useCallback(() => {
    setRecentApps([]);
    toast.info('Cleared recently used apps');
  }, []);

  // In-App Action & Deep Search Launcher
  const handleLaunchInAppAction = useCallback((app: AppItem, query: string, actionType: InAppActionType = 'search') => {
    const result = launchInAppAction(app, query, actionType);

    // Update recents
    setRecentApps(prev => {
      const filtered = prev.filter(r => r.appId !== app.id);
      return [{ appId: app.id, launchedAt: Date.now() }, ...filtered].slice(0, 12);
    });

    if (result.success) {
      toast.success(`${app.name}: ${actionType === 'play' ? 'Playing' : actionType === 'navigate' ? 'Navigating' : 'Searching'} "${query}"`, {
        description: result.message,
        duration: 3500,
      });
    }

    return result;
  }, []);

  // AI Command Launcher
  const handleAICommand = useCallback((commandStr: string) => {
    const actionData = parseInAppActionFromCommand(commandStr);
    if (actionData.matchedApp && actionData.launchResult) {
      if (actionData.searchQuery) {
        handleLaunchInAppAction(actionData.matchedApp, actionData.searchQuery, actionData.actionType || 'search');
      } else {
        handleLaunchApp(actionData.matchedApp);
      }
      return actionData;
    } else {
      toast.error('No matching application found', {
        description: `Could not identify an installed app for "${commandStr}".`,
      });
      return { matchedApp: null, launchResult: null, confidence: 0, searchQuery: '', actionType: 'search' as InAppActionType };
    }
  }, [handleLaunchApp, handleLaunchInAppAction]);

  // Voice Search Handler using Web Speech API
  const startVoiceSearch = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice search is not supported in this browser');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceTranscript('');
        toast.info('Listening for app command or name...');
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setVoiceTranscript(transcript);
        setSearchQuery(transcript);
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        toast.error(`Voice error: ${event.error || 'Speech recognition failed'}`);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      setIsListening(false);
      toast.error('Could not start voice microphone');
    }
  }, []);

  // Filtered & Fuzzy Searched Apps
  const filteredApps = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return INSTALLED_APPS.filter(app => {
      // Category filter
      if (selectedCategory !== 'All' && app.category !== selectedCategory) {
        return false;
      }

      if (!query) return true;

      // Fuzzy Search logic
      const nameMatch = app.name.toLowerCase().includes(query);
      const pkgMatch = app.packageName.toLowerCase().includes(query);
      const kwMatch = app.keywords.some(kw => kw.toLowerCase().includes(query));

      return nameMatch || pkgMatch || kwMatch;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [searchQuery, selectedCategory]);

  // Favorite / Pinned App items
  const pinnedApps = useMemo(() => {
    return pinnedAppIds
      .map(id => INSTALLED_APPS.find(app => app.id === id))
      .filter((app): app is AppItem => app !== undefined);
  }, [pinnedAppIds]);

  // Recently used App items
  const recentAppItems = useMemo(() => {
    return recentApps
      .map(r => ({
        app: INSTALLED_APPS.find(app => app.id === r.appId),
        launchedAt: r.launchedAt,
      }))
      .filter((item): item is { app: AppItem; launchedAt: number } => item.app !== undefined);
  }, [recentApps]);

  // Categorized Groups (Alphabetical A-Z)
  const groupedAppsByLetter = useMemo(() => {
    const groups: { [key: string]: AppItem[] } = {};
    filteredApps.forEach(app => {
      const letter = app.name[0].toUpperCase();
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(app);
    });
    return groups;
  }, [filteredApps]);

  return {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    pinnedAppIds,
    togglePinApp,
    pinnedApps,
    recentAppItems,
    clearRecentApps,
    filteredApps,
    groupedAppsByLetter,
    handleLaunchApp,
    handleLaunchInAppAction,
    handleAICommand,
    startVoiceSearch,
    isListening,
    voiceTranscript,
    totalInstalledCount: INSTALLED_APPS.length,
  };
}
