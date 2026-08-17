import React, { useMemo, useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { motion } from 'framer-motion';
import { Share2, Copy, RefreshCw, Layers, Globe, ExternalLink, Volume2, VolumeX, Settings, Sliders, Search, Telescope, MessageSquare, Sparkles, Pause, Play, Square, Languages, Check, ChevronDown, MoreVertical, MoreHorizontal, Bookmark, FileText, Brain, Download, Trash2, RotateCw, ThumbsUp, ThumbsDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SourcesSidebar } from './SourcesSidebar';
import { SearchCitationsPanel } from './SearchCitationsPanel';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { WeatherWidget } from '@/components/research/WeatherWidget';
import { MapRouteCard } from '@/components/research/MapRouteCard';
import { MiniMapPlaceCard } from '@/components/research/MiniMapPlaceCard';
import { GeneratingLoader } from '@/components/ui/GeneratingLoader';
import { INSTALLED_APPS, AppItem } from '@/lib/launcher/appsData';
import { launchApp, launchInAppAction } from '@/lib/launcher/appLauncherEngine';
import { PluginArtifactView } from '@/components/research/PluginArtifactView';
import { PluginExecutionResult } from '@/lib/plugins/PluginEngine';
import { ToolResultDisplay } from '@/lib/plugins/PluginComposerSystem';
import { checkFactAlignment, computeSemanticSimilarity, FactCheckResult } from '@/lib/factChecker';

interface AppInAppActionCardProps {
  appId: string;
  appName: string;
  actionType: string;
  searchQuery: string;
  deepUrl: string;
  deepScheme: string;
  launchType: string;
  onOpenAppLauncher?: () => void;
}

export const AppInAppActionCard: React.FC<AppInAppActionCardProps> = ({
  appId,
  appName,
  actionType = 'search',
  searchQuery: initialQuery = '',
  deepUrl: initialDeepUrl,
  deepScheme: initialDeepScheme,
  launchType: initialLaunchType,
  onOpenAppLauncher,
}) => {
  const decodedInitialQuery = useMemo(() => {
    try {
      return decodeURIComponent(initialQuery);
    } catch {
      return initialQuery;
    }
  }, [initialQuery]);

  const [currentQuery, setCurrentQuery] = useState(decodedInitialQuery);

  const decodedUrl = useMemo(() => {
    try {
      return decodeURIComponent(initialDeepUrl);
    } catch {
      return initialDeepUrl;
    }
  }, [initialDeepUrl]);

  const app: AppItem = useMemo(() => {
    return (
      INSTALLED_APPS.find(
        a => a.id === appId || a.name.toLowerCase() === appName.toLowerCase()
      ) || {
        id: appId || 'app',
        name: appName || 'Application',
        category: 'Media',
        packageName: `com.${appId || 'android'}.app`,
        scheme: `intent://launch#Intent;package=com.${appId || 'android'}.app;end`,
        fallbackUrl: decodedUrl || 'https://www.google.com',
        iconBg: 'from-cyan-600 via-blue-600 to-indigo-700',
        iconColor: '#FFFFFF',
        iconType: 'generic' as const,
        keywords: [],
        description: `Execute ${actionType} in ${appName}`,
      }
    );
  }, [appId, appName, actionType, decodedUrl]);

  const handleExecute = (queryToRun?: string) => {
    const q = (queryToRun !== undefined ? queryToRun : currentQuery).trim();
    launchInAppAction(app, q, (actionType as any) || 'search');
    toast.success(`Opening ${app.name} (${actionType}: "${q}")`, {
      description: `Dispatched deep intent to ${app.name}`,
    });
  };

  const handleOpenAppHome = () => {
    launchApp(app);
    toast.success(`Opening ${app.name} homepage`);
  };

  const suggestions = useMemo(() => {
    return app.actionConfig?.quickSuggestions || ['Trending', 'Latest', 'Top Searches', 'Explore'];
  }, [app]);

  const actionVerbLabel = useMemo(() => {
    switch (actionType) {
      case 'play':
        return 'Play in';
      case 'navigate':
        return 'Navigate with';
      case 'message':
        return 'Message via';
      case 'calculate':
        return 'Calculate in';
      case 'setting':
        return 'Open Setting in';
      default:
        return 'Search on';
    }
  }, [actionType]);

  return (
    <div className="my-5 w-full max-w-2xl rounded-2xl border border-cyan-500/40 bg-gradient-to-b from-zinc-900/95 via-zinc-950 to-black p-5 sm:p-6 shadow-2xl backdrop-blur-2xl relative overflow-hidden group">
      {/* Dynamic ambient background glow */}
      <div className="absolute -right-20 -top-20 w-56 h-56 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none group-hover:bg-cyan-500/30 transition-all duration-700" />
      <div className="absolute -left-20 -bottom-20 w-56 h-56 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Card Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-white/10 relative z-10">
        <div className="flex items-center gap-3.5">
          <div className={cn("w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg shrink-0 border border-white/20", app.iconBg)}>
            {app.id === 'youtube' ? <Play className="w-6 h-6 fill-current" /> :
             app.id === 'spotify' ? <Sparkles className="w-6 h-6" /> :
             app.id === 'whatsapp' ? <MessageSquare className="w-6 h-6" /> :
             app.id === 'chrome' ? <Globe className="w-6 h-6" /> :
             app.id === 'calculator' ? <Brain className="w-6 h-6" /> :
             <Search className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">{app.name}</h3>
              <span className="text-[10px] font-semibold tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase">
                {actionType.toUpperCase()} ACTION
              </span>
            </div>
            <p className="text-xs text-white/50 font-mono mt-0.5">{app.packageName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {initialLaunchType === 'intent' ? 'Android Intent Dispatched' : 'Direct Deep Search Active'}
          </span>
        </div>
      </div>

      {/* Search Input Bar (Interactive query modifier) */}
      <div className="mt-4 relative z-10">
        <label className="block text-xs font-medium text-white/70 mb-1.5">
          {actionVerbLabel} {app.name}:
        </label>
        <div className="flex items-center gap-2 bg-black/60 border border-white/15 focus-within:border-cyan-400/80 rounded-xl p-1.5 pl-3.5 transition-all shadow-inner">
          <Search size={16} className="text-cyan-400 shrink-0" />
          <input
            type="text"
            value={currentQuery}
            onChange={(e) => setCurrentQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleExecute();
              }
            }}
            placeholder={app.actionConfig?.defaultQueryPlaceholder || `Search inside ${app.name}...`}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
          />
          <button
            onClick={() => handleExecute()}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-xs shadow-md hover:shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer border border-cyan-400/30 shrink-0"
          >
            Launch Search
          </button>
        </div>
      </div>

      {/* Quick Action Suggestions Chips */}
      {suggestions.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 relative z-10">
          <span className="text-[10px] uppercase font-semibold text-white/40 tracking-wider mr-1">Suggestions:</span>
          {suggestions.slice(0, 5).map((sugg, sIdx) => (
            <button
              key={sIdx}
              onClick={() => {
                setCurrentQuery(sugg);
                handleExecute(sugg);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/40 text-[11px] text-white/80 hover:text-cyan-200 transition-all cursor-pointer"
            >
              <span>{sugg}</span>
            </button>
          ))}
        </div>
      )}

      {/* Action Buttons Footer */}
      <div className="mt-4 pt-3.5 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 relative z-10">
        <button
          onClick={() => handleExecute()}
          className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 active:scale-[0.98] transition-all cursor-pointer border border-cyan-400/30"
        >
          <ExternalLink size={15} className="shrink-0" />
          <span>{actionVerbLabel} {app.name} Directly</span>
        </button>

        <button
          onClick={handleOpenAppHome}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/15 hover:border-white/30 text-xs font-medium text-white/80 hover:text-white transition-all cursor-pointer"
        >
          <span>Open App Home</span>
        </button>
      </div>
    </div>
  );
};

interface AppLauncherCardProps {
  appId: string;
  appName: string;
  packageName: string;
  category: string;
  fallbackUrl: string;
  launchType: string;
  onOpenAppLauncher?: () => void;
}

export const AppLauncherCard: React.FC<AppLauncherCardProps> = ({
  appId,
  appName,
  packageName,
  category,
  fallbackUrl,
  launchType,
  onOpenAppLauncher,
}) => {
  const decodedUrl = useMemo(() => {
    try {
      return decodeURIComponent(fallbackUrl);
    } catch {
      return fallbackUrl || 'https://www.youtube.com';
    }
  }, [fallbackUrl]);

  const app = useMemo(() => {
    return INSTALLED_APPS.find(
      a => a.id === appId || a.name.toLowerCase() === appName.toLowerCase()
    ) || {
      id: appId || 'app',
      name: appName || 'Application',
      category: (category as any) || 'Media',
      packageName: packageName || 'com.android.app',
      scheme: `intent://launch#Intent;package=${packageName};end`,
      fallbackUrl: decodedUrl,
      iconBg: 'from-cyan-600 to-blue-700',
      iconColor: '#FFFFFF',
      iconType: 'generic' as const,
      keywords: [],
      description: `Launch ${appName} application on device`,
    };
  }, [appId, appName, category, packageName, decodedUrl]);

  const handleLaunch = () => {
    launchApp(app);
    toast.success(`Launching ${app.name}...`);
  };

  const quickApps = useMemo(() => {
    return INSTALLED_APPS.filter(a => ['youtube', 'whatsapp', 'spotify', 'chrome', 'camera', 'maps'].includes(a.id));
  }, []);

  return (
    <div className="my-5 w-full max-w-2xl rounded-2xl border border-cyan-500/35 bg-gradient-to-b from-zinc-900/95 via-zinc-950 to-black p-5 shadow-2xl backdrop-blur-xl relative overflow-hidden group">
      {/* Glow accents */}
      <div className="absolute -right-16 -top-16 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none group-hover:bg-cyan-500/25 transition-all duration-500" />
      <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10 relative z-10">
        <div className="flex items-center gap-3.5">
          <div className={cn("w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg shrink-0 border border-white/20", app.iconBg)}>
            {app.id === 'youtube' ? <Play className="w-6 h-6 fill-current" /> :
             app.id === 'whatsapp' ? <MessageSquare className="w-6 h-6" /> :
             app.id === 'spotify' ? <Sparkles className="w-6 h-6" /> :
             app.id === 'chrome' ? <Globe className="w-6 h-6" /> :
             app.id === 'camera' ? <ExternalLink className="w-6 h-6" /> :
             app.id === 'calculator' ? <Brain className="w-6 h-6" /> :
             <Sparkles className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">{app.name}</h3>
              <span className="text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase">
                {app.category}
              </span>
            </div>
            <p className="text-xs text-white/50 font-mono mt-0.5">{app.packageName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {launchType === 'intent' ? 'Android Intent Dispatched' : 'Web Application Active'}
          </span>
        </div>
      </div>

      {/* Action Area */}
      <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 relative z-10">
        <button
          onClick={handleLaunch}
          className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white font-semibold text-sm shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border border-cyan-400/30"
        >
          <ExternalLink size={16} className="shrink-0" />
          <span>Launch {app.name} Directly</span>
        </button>
      </div>

      {/* Quick Access Bar */}
      <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap items-center gap-2 relative z-10">
        <span className="text-[11px] font-medium text-white/40 uppercase tracking-wider mr-1">Quick Launch:</span>
        {quickApps.map(qApp => (
          <button
            key={qApp.id}
            onClick={() => {
              launchApp(qApp);
              toast.success(`Opening ${qApp.name}...`);
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 hover:border-cyan-500/40 text-xs text-white/80 hover:text-white transition-all cursor-pointer"
          >
            <span className={cn("w-2 h-2 rounded-full bg-gradient-to-r", qApp.iconBg)} />
            <span>{qApp.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export interface WeatherIntentData {
  location: string;
  country: string;
  date: string;
  temp: string;
  scale: string;
  hasTag: boolean;
}

export function detectWeatherIntent(text: string): WeatherIntentData | null {
  if (!text) return null;
  const lower = text.toLowerCase();

  // 1. Check for explicit tag [[WEATHER_WIDGET:Location|Country|Date|Temp|Scale]]
  const tagMatch = text.match(/\[\[WEATHER_WIDGET(?::([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^\]]*))?\]\]/);
  if (tagMatch) {
    return {
      location: tagMatch[1] || 'Messadine, Susah',
      country: tagMatch[2] || 'Tunisia',
      date: tagMatch[3] || 'March 13',
      temp: tagMatch[4] || '23°',
      scale: tagMatch[5] || 'Celcius',
      hasTag: true,
    };
  }

  // 2. Natural language weather intent detection in AI response (requires explicit weather report phrasing)
  const hasWeatherKeywords = /\b(weather forecast|weather report|current weather|weather in|forecast for|weather today|weather for|temperature report|climate report|weather conditions|weather card)\b/i.test(lower);

  if (!hasWeatherKeywords) return null;

  let location = "Messadine, Susah";
  let country = "Tunisia";
  let date = "Today";
  let temp = "23°";
  let scale = "Celcius";

  const locMatch = text.match(/(?:weather|forecast|temperature|temp|climate)\s+(?:in|for|at|of)\s+([A-Za-z\s,]+?)(?:\.|,|\n|$|\s+today|\s+is|\s+was|\s+for)/i) ||
                   text.match(/in\s+([A-Z][a-zA-Z\s,]+?)(?:'s|\s+weather|\s+forecast|\.|,|$)/i);
  if (locMatch && locMatch[1]?.trim()) {
    const candidate = locMatch[1].trim().replace(/[?~!.:,;]+$/, '');
    if (candidate.length > 2 && candidate.length < 35 && !/^(today|tomorrow|this|current|here|there|now|the|a|an)$/i.test(candidate)) {
      location = candidate;
      country = "Current Forecast";
    }
  }

  const tempMatch = text.match(/(\d{1,3})\s*(?:°|deg|degrees)\s*([CFcf])?/i) || text.match(/temperature\s*(?:is|of)?\s*(\d{1,3})/i);
  if (tempMatch) {
    temp = `${tempMatch[1]}°`;
    if (tempMatch[2] && tempMatch[2].toUpperCase() === 'F') {
      scale = "Fahrenheit";
    }
  }

  if (/fahrenheit/i.test(text)) scale = "Fahrenheit";

  return { location, country, date, temp, scale, hasTag: false };
}

interface Source {
  url: string;
  title: string;
  index: number;
  snippet?: string;
  domain?: string;
}

interface AnswerViewProps {
  content: string;
  userPrompt?: string;
  sources?: Array<{ title: string; url: string; snippet?: string; index?: number }>;
  groundingMetadata?: any;
  pluginArtifacts?: PluginExecutionResult[];
  toolResult?: any;
  isLinksTab?: boolean;
  isImagesTab?: boolean;
  isStreaming?: boolean;
  onShare?: () => void;
  onReSearch?: (modeOverride?: 'chat' | 'search' | 'research') => void;
  onRefineAnswer?: (instruction: string) => void;
  onOpenAppLauncher?: () => void;
}

function useTypewriter(text: string, speed = 10, enabled = true) {
  const [displayedText, setDisplayedText] = useState('');
  const textRef = useRef(text);

  useEffect(() => {
    textRef.current = text;
  }, [text]);

  useEffect(() => {
    if (!enabled) {
      setDisplayedText(text);
      return;
    }

    if (!text) {
      setDisplayedText('');
      return;
    }

    if (displayedText === text) {
      return;
    }

    if (!text.startsWith(displayedText)) {
      setDisplayedText(text.slice(0, Math.min(text.length, displayedText.length + 1)));
      return;
    }

    const interval = setInterval(() => {
      setDisplayedText((prev) => {
        if (prev.length >= textRef.current.length) {
          clearInterval(interval);
          return prev;
        }
        const diff = textRef.current.length - prev.length;
        const step = diff > 40 ? Math.ceil(diff / 6) : 1;
        return prev + textRef.current.slice(prev.length, prev.length + step);
      });
    }, speed);

    return () => clearInterval(interval);
  }, [text, enabled, speed, displayedText]);

  return displayedText;
}

const safeHostname = (urlStr: string): string => {
  if (!urlStr) return 'source';
  try {
    const formatted = urlStr.startsWith('http://') || urlStr.startsWith('https://') ? urlStr : `https://${urlStr}`;
    return new URL(formatted).hostname.replace(/^www\./, '');
  } catch (_) {
    return 'source';
  }
};

const safeFaviconUrl = (urlStr: string): string => {
  const host = safeHostname(urlStr);
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`;
};

const Citation = ({ 
  index, 
  source,
  onOpenSidebar,
  totalSourcesCount,
}: { 
  index: number; 
  source?: Source;
  onOpenSidebar?: (sourceIndex?: number) => void;
  totalSourcesCount?: number;
}) => {
  if (!source) {
    return (
      <span 
        onClick={() => onOpenSidebar && onOpenSidebar(index)}
        className="inline-flex items-center justify-center min-w-[18px] h-4 px-1 ml-1 -mt-2 align-super text-[10px] font-bold font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-500/30 rounded-md cursor-pointer hover:bg-cyan-500/20 hover:border-cyan-400/60 transition-all select-none shadow-[0_0_8px_rgba(6,182,212,0.15)]"
        title={`Source [${index}]`}
      >
        {index}
      </span>
    );
  }

  const host = safeHostname(source.url);

  return (
    <HoverCard openDelay={150} closeDelay={200}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onOpenSidebar) {
              onOpenSidebar(index);
            } else {
              window.open(source.url, '_blank', 'noopener,noreferrer');
            }
          }}
          className="inline-flex items-center justify-center min-w-[18px] h-4 px-1.5 ml-1 -mt-2 align-super text-[10px] font-bold font-mono text-cyan-300 bg-cyan-950/90 border border-cyan-500/35 hover:border-cyan-400 hover:text-cyan-200 hover:bg-cyan-900/60 rounded-md transition-all cursor-pointer no-underline shadow-[0_0_10px_rgba(6,182,212,0.2)] active:scale-95 group"
          title={`Click to view source: ${source.title || host}`}
        >
          <span>{index}</span>
        </button>
      </HoverCardTrigger>
      <HoverCardContent 
        className="w-84 p-3.5 bg-[#0b0f19]/95 backdrop-blur-xl border border-cyan-500/25 shadow-2xl rounded-2xl z-50 text-left" 
        align="start"
        side="top"
        sideOffset={6}
      >
        <div className="flex flex-col gap-2.5">
          {/* Header */}
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
              <img 
                src={safeFaviconUrl(source.url)} 
                alt="" 
                className="w-4 h-4 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                }}
              />
              <Globe size={14} className="text-cyan-400 hidden" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-[10px] text-cyan-400 font-mono font-medium mb-0.5">
                <span className="px-1.5 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/20">Source [{index}]</span>
                <span className="truncate text-white/50">{host}</span>
              </div>
              <h4 className="text-xs font-semibold text-white/95 leading-snug line-clamp-2">
                {source.title || host}
              </h4>
            </div>
          </div>

          {/* Snippet preview if available */}
          {source.snippet && (
            <p className="text-[11px] text-white/70 bg-white/[0.03] p-2 rounded-lg border border-white/5 line-clamp-2 italic">
              "{source.snippet}"
            </p>
          )}

          {/* Action links */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10">
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-cyan-300 hover:text-cyan-100 hover:underline transition-colors cursor-pointer"
            >
              <span>Visit website</span>
              <ExternalLink size={12} />
            </a>

            {onOpenSidebar && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenSidebar(index);
                }}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-white/60 hover:text-white bg-white/5 hover:bg-white/10 px-2 py-1 rounded-lg border border-white/10 transition-all cursor-pointer"
              >
                <Layers size={11} className="text-cyan-400" />
                <span>All sources {totalSourcesCount ? `(${totalSourcesCount})` : ''}</span>
              </button>
            )}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

const LANGUAGE_META: Record<string, { name: string; native: string; flag: string }> = {
  'en': { name: 'English', native: 'English', flag: '🇺🇸' },
  'es': { name: 'Spanish', native: 'Español', flag: '🇪🇸' },
  'fr': { name: 'French', native: 'Français', flag: '🇫🇷' },
  'de': { name: 'German', native: 'Deutsch', flag: '🇩🇪' },
  'hi': { name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
  'ja': { name: 'Japanese', native: '日本語', flag: '🇯🇵' },
  'zh': { name: 'Chinese', native: '中文', flag: '🇨🇳' },
  'it': { name: 'Italian', native: 'Italiano', flag: '🇮🇹' },
  'pt': { name: 'Portuguese', native: 'Português', flag: '🇧🇷' },
  'ru': { name: 'Russian', native: 'Русский', flag: '🇷🇺' },
  'ar': { name: 'Arabic', native: 'العربية', flag: '🇸🇦' },
  'ko': { name: 'Korean', native: '한국어', flag: '🇰🇷' },
  'nl': { name: 'Dutch', native: 'Nederlands', flag: '🇳🇱' },
  'pl': { name: 'Polish', native: 'Polski', flag: '🇵🇱' },
  'tr': { name: 'Turkish', native: 'Türkçe', flag: '🇹🇷' },
  'sv': { name: 'Swedish', native: 'Svenska', flag: '🇸🇪' },
  'vi': { name: 'Vietnamese', native: 'Tiếng Việt', flag: '🇻🇳' },
  'id': { name: 'Indonesian', native: 'Bahasa Indonesia', flag: '🇮🇩' },
  'th': { name: 'Thai', native: 'ไทย', flag: '🇹🇭' },
  'uk': { name: 'Ukrainian', native: 'Українська', flag: '🇺🇦' },
  'cs': { name: 'Czech', native: 'Čeština', flag: '🇨🇿' },
  'el': { name: 'Greek', native: 'Ελληνικά', flag: '🇬🇷' },
  'he': { name: 'Hebrew', native: 'עברית', flag: '🇮🇱' },
  'ro': { name: 'Romanian', native: 'Română', flag: '🇷🇴' },
  'da': { name: 'Danish', native: 'Dansk', flag: '🇩🇰' },
  'fi': { name: 'Finnish', native: 'Suomi', flag: '🇫🇮' },
  'hu': { name: 'Hungarian', native: 'Magyar', flag: '🇭🇺' },
  'no': { name: 'Norwegian', native: 'Norsk', flag: '🇳🇴' },
};

const getLangPrefix = (langStr: string) => {
  if (!langStr) return 'en';
  return langStr.split(/[-_]/)[0].toLowerCase();
};

interface CodeBlockProps {
  codeString: string;
  lang: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ codeString, lang }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    toast.success('Code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-5 rounded-2xl overflow-hidden border border-cyan-500/20 bg-[#0a0b12] shadow-2xl transition-all">
      <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.04] border-b border-white/10 text-xs text-white/70 font-mono select-none">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 mr-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <span className="uppercase font-bold tracking-wider text-[11px] text-cyan-300 bg-cyan-500/15 px-2.5 py-0.5 rounded-md border border-cyan-500/25">
            {lang || 'CODE'}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/35 text-white/80 hover:text-cyan-300 transition-all cursor-pointer text-xs font-medium active:scale-95"
          title="Copy code snippet"
        >
          {copied ? <Check size={13} className="text-emerald-400 shrink-0" /> : <Copy size={13} className="shrink-0" />}
          <span>{copied ? 'Copied!' : 'Copy Code'}</span>
        </button>
      </div>
      <SyntaxHighlighter
        language={lang || 'text'}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          padding: '1.25rem',
          background: 'rgba(0, 0, 0, 0.65)',
          fontSize: '13px',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        }}
        codeTagProps={{
          style: {
            fontFamily: 'inherit',
          }
        }}
      >
        {codeString}
      </SyntaxHighlighter>
    </div>
  );
};

/**
 * Fact-Check Verified Checkmark Badge
 * Automatically computes semantic similarity between a user prompt and AI response
 * via the factChecker utility and displays a "Verified" checkmark when similarity score exceeds 0.8.
 */
interface FactCheckBadgeProps {
  content: string;
  userPrompt?: string;
  isStreaming?: boolean;
  threshold?: number;
}

export const FactCheckBadge: React.FC<FactCheckBadgeProps> = ({ 
  content, 
  userPrompt = '', 
  isStreaming,
  threshold = 0.8 
}) => {
  const factResult: FactCheckResult | null = useMemo(() => {
    if (!content || isStreaming) return null;
    const cleanContent = content.trim();
    if (!cleanContent) return null;

    return checkFactAlignment(userPrompt, cleanContent, threshold);
  }, [content, userPrompt, isStreaming, threshold]);

  if (isStreaming || !content || !factResult || !factResult.isVerified) {
    return null;
  }

  const scorePct = Math.round(factResult.similarityScore * 100);

  return (
    <div className="relative inline-flex items-center">
      <HoverCard openDelay={150} closeDelay={150}>
        <HoverCardTrigger asChild>
          <div 
            id="fact-check-verified-badge"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-[11px] font-semibold tracking-wide shadow-[0_0_12px_rgba(16,185,129,0.2)] cursor-pointer hover:bg-emerald-500/25 transition-all select-none group"
          >
            <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center text-black font-bold shrink-0 shadow-sm">
              <Check size={10} strokeWidth={3.5} />
            </div>
            <span className="text-emerald-200">Verified</span>
            <span className="text-[10px] text-emerald-400/80 font-mono">({scorePct}%)</span>
          </div>
        </HoverCardTrigger>
        <HoverCardContent className="w-80 p-3.5 bg-[#09101d]/95 border border-emerald-500/30 rounded-2xl shadow-2xl backdrop-blur-2xl z-50 text-xs text-slate-100">
          <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Check size={14} strokeWidth={3} />
              </div>
              <div>
                <h4 className="font-bold text-emerald-300 text-xs">Fact-Check Verified</h4>
                <p className="text-[10px] text-emerald-400/80 font-mono">Score: {(factResult.similarityScore * 100).toFixed(1)}% (Threshold: &ge;{(threshold * 100).toFixed(0)}%)</p>
              </div>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase font-mono">
              {factResult.intent}
            </span>
          </div>
          
          <p className="text-[11px] text-slate-300 leading-relaxed mb-2">
            {factResult.summary}
          </p>

          {factResult.matchedKeywords.length > 0 && (
            <div className="pt-2 border-t border-white/5">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Matched Semantic Entities:</span>
              <div className="flex flex-wrap gap-1">
                {factResult.matchedKeywords.slice(0, 6).map((kw, i) => (
                  <span key={i} className="px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/25 text-[10px] font-mono text-emerald-300">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
        </HoverCardContent>
      </HoverCard>
    </div>
  );
};

export const AnswerView: React.FC<AnswerViewProps> = React.memo(({ 
  content, 
  userPrompt,
  sources: rawSourcesProp,
  groundingMetadata,
  pluginArtifacts, 
  toolResult, 
  isLinksTab, 
  isImagesTab, 
  isStreaming, 
  onShare, 
  onReSearch, 
  onRefineAnswer, 
  onOpenAppLauncher 
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedLang, setSelectedLang] = useState<string>('en');
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [speechPitch, setSpeechPitch] = useState<number>(1.0);
  const [voiceGenderFilter, setVoiceGenderFilter] = useState<'all' | 'male' | 'female'>('all');
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showReSearchMenu, setShowReSearchMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(null);
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const typedContent = useTypewriter(content, 12, !!isStreaming);

  const isMaleVoice = (voice: SpeechSynthesisVoice) => {
    return /male|david|george|guy|daniel|rishi|james|mark|oliver|google uk english male|google us english male|alex|brian|fred/i.test(voice.name);
  };

  const isFemaleVoice = (voice: SpeechSynthesisVoice) => {
    return /female|zira|susan|hazel|samantha|victoria|karen|google us english|google uk english female|fiona|veena/i.test(voice.name);
  };

  const applyMaleVoicePreset = () => {
    const maleVoice = voices.find(v => (selectedLang === 'all' || getLangPrefix(v.lang) === selectedLang) && isMaleVoice(v)) || voices[0];
    if (maleVoice) {
      setSelectedVoiceURI(maleVoice.voiceURI);
    }
    setSpeechPitch(0.85);
    setSpeechRate(1.0);
    toast.success('Applied Male Voice preset');
  };

  const applyFemaleVoicePreset = () => {
    const femaleVoice = voices.find(v => (selectedLang === 'all' || getLangPrefix(v.lang) === selectedLang) && isFemaleVoice(v)) || voices[0];
    if (femaleVoice) {
      setSelectedVoiceURI(femaleVoice.voiceURI);
    }
    setSpeechPitch(1.05);
    setSpeechRate(1.0);
    toast.success('Applied Female Voice preset');
  };

  const handleExportMarkdown = () => {
    try {
      const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `answer-${Date.now()}.md`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Downloaded answer as Markdown (.md)');
    } catch {
      toast.error('Failed to export file');
    }
  };

  // Populate all available voices
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const updateVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
        
        if (availableVoices.length > 0 && !selectedVoiceURI) {
          const maleVoice = availableVoices.find(v => v.lang.startsWith('en') && isMaleVoice(v));
          const defaultVoice = maleVoice || 
                               availableVoices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) || 
                               availableVoices.find(v => v.lang.startsWith('en')) || 
                               availableVoices[0];
          if (defaultVoice) {
            setSelectedVoiceURI(defaultVoice.voiceURI);
            setSelectedLang(getLangPrefix(defaultVoice.lang));
            if (maleVoice) {
              setSpeechPitch(0.85);
            }
          }
        }
      };
      
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, [selectedVoiceURI]);

  // Derived available languages list
  const availableLanguages = useMemo(() => {
    const langMap = new Map<string, number>();
    voices.forEach(v => {
      const prefix = getLangPrefix(v.lang);
      langMap.set(prefix, (langMap.get(prefix) || 0) + 1);
    });

    return Array.from(langMap.entries()).map(([code, count]) => {
      const meta = LANGUAGE_META[code] || { name: code.toUpperCase(), native: code.toUpperCase(), flag: '🌐' };
      return { code, count, meta };
    }).sort((a, b) => a.meta.name.localeCompare(b.meta.name));
  }, [voices]);

  // Handle switching language
  const handleSelectLanguage = (code: string) => {
    setSelectedLang(code);
    setShowLangMenu(false);

    if (code === 'all') {
      toast.info('Showing voices for all languages');
      return;
    }

    const langVoices = voices.filter(v => getLangPrefix(v.lang) === code);
    if (langVoices.length > 0) {
      const preferredVoice = langVoices.find(isMaleVoice) || langVoices[0];
      setSelectedVoiceURI(preferredVoice.voiceURI);
      const meta = LANGUAGE_META[code];
      toast.success(`Set language to ${meta?.flag || '🌐'} ${meta?.name || code.toUpperCase()} (${langVoices.length} voices)`);
    } else {
      toast.info(`Switched to ${code.toUpperCase()}`);
    }
  };

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const cleanTextForSpeech = (rawText: string): string => {
    if (!rawText) return '';
    return rawText
      .replace(/```[\s\S]*?```/g, ' [Code Snippet] ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[\d+(?:,\s*\d+)*\]/g, '')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      .replace(/[*#_~>]/g, ' ')
      .replace(/^\s*[-+*]\s+/gm, '')
      .replace(/^\s*\d+\.\s+/gm, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const handleSpeak = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      toast.error('Text-to-speech is not supported in this browser.');
      return;
    }

    if (isSpeaking && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      toast.info('Speech paused');
      return;
    }

    if (isSpeaking && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      toast.info('Speech resumed');
      return;
    }

    const cleanText = cleanTextForSpeech(content);
    if (!cleanText) {
      toast.error('No readable text for speech synthesis.');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    let activeVoice = voices.find(v => v.voiceURI === selectedVoiceURI);
    if (!activeVoice && selectedLang !== 'all') {
      activeVoice = voices.find(v => getLangPrefix(v.lang) === selectedLang);
    }
    
    if (activeVoice) {
      utterance.voice = activeVoice;
      utterance.lang = activeVoice.lang;
    }
    
    utterance.rate = speechRate;
    utterance.pitch = speechPitch;
    utteranceRef.current = utterance;

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onerror = (event) => {
      if (event.error !== 'interrupted') {
        console.error('Speech synthesis error:', event);
      }
      setIsSpeaking(false);
      setIsPaused(false);
    };

    window.speechSynthesis.cancel();
    setIsSpeaking(true);
    setIsPaused(false);
    window.speechSynthesis.speak(utterance);

    const voiceLangMeta = activeVoice ? LANGUAGE_META[getLangPrefix(activeVoice.lang)] : null;
    toast.success(`Reading aloud ${voiceLangMeta ? `${voiceLangMeta.flag} ${voiceLangMeta.name}` : ''}`);
  };

  const handleStopSpeak = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
      toast.info('Stopped read aloud');
    }
  };

  // Extract and combine sources from groundingMetadata, rawSourcesProp, and markdown content
  const { cleanContent, sources } = useMemo(() => {
    const lines = typedContent.split('\n');
    // More robust heading detection (case insensitive, various markers)
    const sourcesHeadingIndex = lines.findIndex(l => {
      const lower = l.toLowerCase().trim();
      return /^(#+\s*)?[\*_]*(sources?|references?|citations?)[\*_]*:?$/i.test(lower);
    });
    
    let cleanContent = typedContent;
    let textExtractedSources: Source[] = [];

    if (sourcesHeadingIndex !== -1) {
      cleanContent = lines.slice(0, sourcesHeadingIndex).join('\n');
      const sourcesLines = lines.slice(sourcesHeadingIndex + 1);
      
      textExtractedSources = sourcesLines
        .filter(line => line.trim() !== '')
        .map((line) => {
          const cleanLine = line.replace(/^\s*(?:\[\d+\]|\d+\.|-|\*)\s*/, '').trim();
          
          const markdownMatch = cleanLine.match(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/);
          if (markdownMatch) {
            return {
              title: markdownMatch[1].trim(),
              url: markdownMatch[2].trim(),
              index: 0
            };
          }

          const urlMatch = cleanLine.match(/(?:(.+?)(?::|–|-)\s*)?(https?:\/\/[^\s\)]+)/);
          if (urlMatch) {
            return {
              title: (urlMatch[1] || safeHostname(urlMatch[2])).trim(),
              url: urlMatch[2].trim(),
              index: 0
            };
          }
          
          return null;
        })
        .filter((s): s is Source => s !== null);
    } else {
        const lastLines = lines.slice(-10);
        const linkLines = lastLines.filter(l => /https?:\/\//.test(l));
        
        if (linkLines.length > 0 && linkLines.length >= lastLines.filter(l => l.trim()).length * 0.5) {
             const potentialSources = linkLines.map((line) => {
                const urlMatch = line.match(/https?:\/\/[^\s\)]+/);
                if (urlMatch) {
                    return {
                        url: urlMatch[0],
                        title: safeHostname(urlMatch[0]),
                        index: 0
                    };
                }
                return null;
             }).filter((s): s is Source => s !== null);

             if (potentialSources.length > 0) {
                 textExtractedSources = potentialSources;
                 const firstSourceLine = lastLines.find(l => l.includes(potentialSources[0].url));
                 if (firstSourceLine) {
                     const idx = lines.lastIndexOf(firstSourceLine);
                     if (idx !== -1) {
                         cleanContent = lines.slice(0, idx).join('\n');
                     }
                 }
             }
        }
    }

    // Process groundingMetadata groundingChunks
    const groundingChunksSources: Source[] = [];
    if (groundingMetadata?.groundingChunks && Array.isArray(groundingMetadata.groundingChunks)) {
      groundingMetadata.groundingChunks.forEach((chunk: any, i: number) => {
        if (chunk?.web?.uri) {
          groundingChunksSources.push({
            title: chunk.web.title || `Source ${i + 1}`,
            url: chunk.web.uri,
            index: i + 1,
            domain: safeHostname(chunk.web.uri),
          });
        }
      });
    }

    // Process rawSourcesProp
    const propSources: Source[] = (rawSourcesProp || []).map((s, i) => ({
      title: s.title || `Source ${i + 1}`,
      url: s.url,
      snippet: s.snippet,
      index: s.index ?? i + 1,
      domain: safeHostname(s.url),
    }));

    // Combine all sources with deduplication by URL
    const combinedMap = new Map<string, Source>();
    
    // Priority order: groundingMetadata -> rawSourcesProp -> textExtractedSources
    [...groundingChunksSources, ...propSources, ...textExtractedSources].forEach((src) => {
      if (!src.url) return;
      const normalizedUrl = src.url.trim().replace(/\/$/, '');
      if (!combinedMap.has(normalizedUrl)) {
        combinedMap.set(normalizedUrl, {
          ...src,
          url: src.url.trim(),
          title: src.title || safeHostname(src.url),
        });
      }
    });

    const finalSources = Array.from(combinedMap.values()).map((s, idx) => ({
      ...s,
      index: idx + 1,
    }));
    
    return { cleanContent, sources: finalSources };
  }, [typedContent, rawSourcesProp, groundingMetadata]);

  if (isLinksTab) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Layers className="w-5 h-5" />
          {sources.length} Sources
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {sources.map((source, i) => (
            <a 
              key={i} 
              href={source.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="group p-4 bg-card border border-border/50 rounded-xl hover:bg-muted/50 hover:border-border transition-all duration-200"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  <img 
                    src={safeFaviconUrl(source.url)} 
                    alt="Favicon" 
                    className="w-4 h-4 opacity-70"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                    {source.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="truncate">{safeHostname(source.url)}</span>
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                    <span>{i + 1}</span>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    );
  }

  const weatherIntent = useMemo(() => detectWeatherIntent(cleanContent), [cleanContent]);
  const hasExplicitWeatherTag = useMemo(() => cleanContent.includes('[[WEATHER_WIDGET'), [cleanContent]);

  if (isImagesTab) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
          <Globe size={24} className="opacity-20" />
        </div>
        <p className="text-sm font-medium">No images found</p>
      </div>
    );
  }

  if (!content || !content.trim()) return null;

  return (
    <div className="space-y-6 animate-fade-in group">
      {isStreaming && (
        <div className="mb-2">
          <GeneratingLoader variant="compact" message="Generating AI response..." />
        </div>
      )}

      {/* Plugin Artifact Views (Image Creation, Video, Study, Thinking, etc.) */}
      {pluginArtifacts && pluginArtifacts.length > 0 && (
        <div className="space-y-4 my-3">
          {pluginArtifacts.map((art, artIdx) => (
            <PluginArtifactView key={artIdx} artifact={art} />
          ))}
        </div>
      )}

      {toolResult && (
        <div className="my-3 animate-fade-in">
          <ToolResultDisplay result={toolResult} />
        </div>
      )}

      {/* Dynamic WeatherWidget Injection on Weather Intent */}
      {weatherIntent && !hasExplicitWeatherTag && (
        <div className="my-4 flex justify-start animate-fade-in">
          <WeatherWidget
            location={weatherIntent.location}
            country={weatherIntent.country}
            date={weatherIntent.date}
            temp={weatherIntent.temp}
            scale={weatherIntent.scale}
          />
        </div>
      )}

      <div className="prose prose-zinc prose-sm sm:prose-base max-w-none text-foreground/90">
        {cleanContent.split(/(\[\[ULTRA_FAST_REPLY:[^\]]+\]\]|\[\[WEATHER_WIDGET(?::[^\]]+)?\]\]|\[\[APP_LAUNCH_CARD:[^\]]+\]\]|\[\[APP_ACTION_CARD:[^\]]+\]\]|\[\[MAP_ROUTE_CARD:[^\]]+\]\]|\[\[MAP_PLACE_CARD:[^\]]+\]\])/g).map((chunk, idx) => {
          const placeMatch = chunk.match(/\[\[MAP_PLACE_CARD:([^|]*)(?:\|([^|]*)\|([^|]*)\|([^|]*)\|([^\]]*))?\]\]/);
          if (placeMatch) {
            const query = placeMatch[1] || 'Taj Mahal';
            const title = placeMatch[2] || undefined;
            const address = placeMatch[3] || undefined;
            const lat = placeMatch[4] ? parseFloat(placeMatch[4]) : undefined;
            const lng = placeMatch[5] ? parseFloat(placeMatch[5]) : undefined;

            return (
              <div key={idx} className="my-4 flex justify-start w-full">
                <MiniMapPlaceCard
                  query={query}
                  placeTitle={title}
                  placeAddress={address}
                  lat={lat}
                  lng={lng}
                />
              </div>
            );
          }

          const routeMatch = chunk.match(/\[\[MAP_ROUTE_CARD:([^|]*)\|([^|]*)(?:\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^\]]*))?\]\]/);
          if (routeMatch) {
            const originName = routeMatch[1] || 'My Location';
            const destinationName = routeMatch[2] || 'Rajasthan';
            const originLat = routeMatch[3] ? parseFloat(routeMatch[3]) : undefined;
            const originLng = routeMatch[4] ? parseFloat(routeMatch[4]) : undefined;
            const destLat = routeMatch[5] ? parseFloat(routeMatch[5]) : undefined;
            const destLng = routeMatch[6] ? parseFloat(routeMatch[6]) : undefined;
            const distance = routeMatch[7] || '280 km';
            const duration = routeMatch[8] || '4.5 hrs';

            return (
              <div key={idx} className="my-5 flex justify-start w-full">
                <MapRouteCard
                  originName={originName}
                  destinationName={destinationName}
                  originLat={originLat}
                  originLng={originLng}
                  destLat={destLat}
                  destLng={destLng}
                  distance={distance}
                  duration={duration}
                />
              </div>
            );
          }
          const fastReplyMatch = chunk.match(/\[\[ULTRA_FAST_REPLY:([^|]*)\|([^|]*)(?:\|([^\]]*))?\]\]/);
          if (fastReplyMatch) {
            const timeVal = fastReplyMatch[1] ? `${fastReplyMatch[1]}ms` : '<5ms';
            const source = fastReplyMatch[2] || 'instant_engine';
            const category = fastReplyMatch[3] || 'general';
            return (
              <div key={idx} className="my-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-xs font-medium backdrop-blur-md shadow-sm">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
                </span>
                <span className="font-semibold text-cyan-200">⚡ Ultra-Fast Reply</span>
                <span className="text-white/30">•</span>
                <span className="font-mono text-cyan-300 font-medium">{timeVal}</span>
                <span className="text-white/30">•</span>
                <span className="text-white/60 capitalize text-[11px]">
                  {source === 'instant_cache' ? 'Instant Cache' : source === 'instant_engine' ? 'Instant Engine' : 'Turbo Stream'}
                </span>
                {category && category !== 'general' && (
                  <>
                    <span className="text-white/30">•</span>
                    <span className="text-cyan-400/80 capitalize text-[11px]">{category}</span>
                  </>
                )}
              </div>
            );
          }

          const match = chunk.match(/\[\[WEATHER_WIDGET(?::([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^\]]*))?\]\]/);
          if (match) {
            const location = match[1] || 'Messadine, Susah';
            const country = match[2] || 'Tunisia';
            const date = match[3] || 'March 13';
            const temp = match[4] || '23°';
            const scale = match[5] || 'Celcius';

            return (
              <div key={idx} className="my-5 flex justify-start">
                <WeatherWidget
                  location={location}
                  country={country}
                  date={date}
                  temp={temp}
                  scale={scale}
                />
              </div>
            );
          }

          const actionMatch = chunk.match(/\[\[APP_ACTION_CARD:([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^\]]*)\]\]/);
          if (actionMatch) {
            return (
              <div key={idx} className="my-5 flex justify-start">
                <AppInAppActionCard
                  appId={actionMatch[1]}
                  appName={actionMatch[2]}
                  actionType={actionMatch[3]}
                  searchQuery={actionMatch[4]}
                  deepUrl={actionMatch[5]}
                  deepScheme={actionMatch[6]}
                  launchType={actionMatch[7]}
                  onOpenAppLauncher={onOpenAppLauncher}
                />
              </div>
            );
          }

          const appMatch = chunk.match(/\[\[APP_LAUNCH_CARD:([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^\]]*)\]\]/);
          if (appMatch) {
            return (
              <div key={idx} className="my-5 flex justify-start">
                <AppLauncherCard
                  appId={appMatch[1]}
                  appName={appMatch[2]}
                  packageName={appMatch[3]}
                  category={appMatch[4]}
                  fallbackUrl={appMatch[5]}
                  launchType={appMatch[6]}
                  onOpenAppLauncher={onOpenAppLauncher}
                />
              </div>
            );
          }

          if (!chunk.trim()) return null;

          return (
            <ReactMarkdown 
              key={idx}
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => {
                   // Helper to process children and replace [1] with citations
                   const processText = (text: string) => {
                     const parts = text.split(/(\[\d+\])/g);
                     return parts.map((part, i) => {
                       const match = part.match(/\[(\d+)\]/);
                       if (match) {
                         const index = parseInt(match[1]);
                         const source = sources.find(s => s.index === index);
                         return (
                           <Citation 
                             key={`${index}-${i}`} 
                             index={index} 
                             source={source} 
                             onOpenSidebar={() => setIsSidebarOpen(true)}
                             totalSourcesCount={sources.length}
                           />
                         );
                       }
                       return part;
                     });
                   };

                   return (
                     <p className="mb-4 last:mb-0 text-[15px] sm:text-base leading-[1.75] text-slate-100/90 tracking-normal font-normal">
                       {React.Children.map(children, child => {
                         if (typeof child === 'string') return processText(child);
                         return child;
                       })}
                       {isStreaming && (
                         <span className="inline-block w-2 h-4 ml-1.5 bg-cyan-400/90 rounded-sm animate-pulse align-middle shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                       )}
                     </p>
                   );
                },
                li: ({ children }) => {
                   const processText = (text: string) => {
                     const parts = text.split(/(\[\d+\])/g);
                     return parts.map((part, i) => {
                       const match = part.match(/\[(\d+)\]/);
                       if (match) {
                         const index = parseInt(match[1]);
                         const source = sources.find(s => s.index === index);
                         return (
                           <Citation 
                             key={`${index}-${i}`} 
                             index={index} 
                             source={source} 
                             onOpenSidebar={() => setIsSidebarOpen(true)}
                             totalSourcesCount={sources.length}
                           />
                         );
                       }
                       return part;
                     });
                   };

                   return (
                     <li className="pl-1 text-slate-200/90 leading-[1.7]">
                       {React.Children.map(children, child => {
                         if (typeof child === 'string') return processText(child);
                         return child;
                       })}
                     </li>
                   );
                },
                pre: ({ children }) => <>{children}</>,
                a: ({ href, children }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 hover:underline underline-offset-4 font-medium transition-colors">
                    {children}
                  </a>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-cyan-50/95 tracking-wide">
                    {children}
                  </strong>
                ),
                h1: ({ children }) => (
                  <h1 className="text-xl sm:text-2xl font-bold mt-8 mb-4 text-white tracking-tight flex items-center gap-2 border-b border-white/10 pb-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-lg sm:text-xl font-bold mt-7 mb-3.5 text-white tracking-tight flex items-center gap-2 border-b border-white/10 pb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-base sm:text-lg font-semibold mt-6 mb-3 text-cyan-200/95 tracking-tight flex items-center gap-2">
                    <span className="w-1 h-3 rounded-full bg-cyan-400/80 shrink-0" />
                    {children}
                  </h3>
                ),
                ul: ({ children }) => <ul className="list-disc pl-6 space-y-2.5 mb-5 marker:text-cyan-400/80">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-6 space-y-2.5 mb-5 marker:text-cyan-400/80 font-medium">{children}</ol>,
                blockquote: ({ children }) => (
                  <blockquote className="my-4 border-l-4 border-cyan-400/80 bg-cyan-950/30 pl-4 py-2.5 pr-4 rounded-r-xl text-sm text-cyan-100/90 font-mono leading-relaxed shadow-sm">
                    {children}
                  </blockquote>
                ),
                code: ({ node, inline, className, children, ...props }: any) => {
                  const codeString = String(children).replace(/\n$/, '');
                  const match = /language-(\w+)/.exec(className || '');
                  const lang = match ? match[1] : '';

                  const isInline = inline || (!className && !codeString.includes('\n'));

                  if (isInline) {
                    return (
                      <code className="bg-cyan-950/60 text-cyan-300 font-mono text-[13px] px-2 py-0.5 rounded-md border border-cyan-500/25 shadow-sm inline-block my-0.5" {...props}>
                        {children}
                      </code>
                    );
                  }

                  return <CodeBlock codeString={codeString} lang={lang} />;
                }
              }}
            >
              {chunk}
            </ReactMarkdown>
          );
        })}
      </div>



      <div className="flex flex-wrap items-center gap-2 pt-2 pb-1">
        <div className="flex items-center gap-2 mr-2">
           <FactCheckBadge content={content} userPrompt={userPrompt} isStreaming={isStreaming} threshold={0.8} />
           {sources.length > 0 && (
             <div className="flex items-center gap-1.5">
               <SearchCitationsPanel
                 sources={sources.map((s, idx) => ({ title: s.title, url: s.url, index: s.index ?? idx + 1 }))}
                 mode="popover"
                 trigger={
                   <button 
                     className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 text-teal-300 text-xs font-semibold hover:bg-teal-500/20 transition-all cursor-pointer group shadow-sm"
                     title="Quick Citations Popover"
                   >
                     <div className="flex items-center -space-x-1.5 mr-0.5">
                       {sources.slice(0, 3).map((source, i) => (
                         <div key={i} className="relative w-4.5 h-4.5 rounded-full border border-teal-900/60 bg-teal-950 flex items-center justify-center overflow-hidden shadow-sm" style={{ zIndex: 10 - i }}>
                           <img 
                             src={safeFaviconUrl(source.url)}
                             alt=""
                             className="w-3 h-3 object-cover opacity-90"
                             onError={(e) => {
                               (e.target as HTMLImageElement).style.display = 'none';
                             }}
                           />
                         </div>
                       ))}
                     </div>
                     <span>{sources.length} sources</span>
                     <Globe size={12} className="text-teal-400 opacity-70 group-hover:opacity-100 transition-opacity" />
                   </button>
                 }
               />
               <button
                 onClick={() => setIsSidebarOpen(true)}
                 className="p-1.5 rounded-full border border-teal-500/20 bg-teal-500/5 hover:bg-teal-500/15 text-teal-400 hover:text-teal-200 transition-all cursor-pointer"
                 title="Open Citations Sidebar Drawer"
               >
                 <Layers size={13} />
               </button>
             </div>
           )}
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2 ml-auto relative">
          {/* 1. Copy Icon */}
          <button
            onClick={() => {
              navigator.clipboard.writeText(content);
              toast.success('Response copied to clipboard!');
            }}
            className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer active:scale-95"
            title="Copy response"
            aria-label="Copy response"
          >
            <Copy size={18} />
          </button>

          {/* 2. Thumbs Up Icon */}
          <button
            onClick={() => {
              setFeedback(prev => prev === 'like' ? null : 'like');
              toast.success('Thank you for your feedback!');
            }}
            className={cn(
              "p-2 rounded-xl transition-colors cursor-pointer active:scale-95",
              feedback === 'like'
                ? "text-cyan-400 bg-cyan-500/20"
                : "text-white/50 hover:text-white hover:bg-white/10"
            )}
            title="Good response"
            aria-label="Good response"
          >
            <ThumbsUp size={18} />
          </button>

          {/* 3. Thumbs Down Icon */}
          <button
            onClick={() => {
              setFeedback(prev => prev === 'dislike' ? null : 'dislike');
              toast.info('Feedback recorded. We will work to improve.');
            }}
            className={cn(
              "p-2 rounded-xl transition-colors cursor-pointer active:scale-95",
              feedback === 'dislike'
                ? "text-rose-400 bg-rose-500/20"
                : "text-white/50 hover:text-white hover:bg-white/10"
            )}
            title="Poor response"
            aria-label="Poor response"
          >
            <ThumbsDown size={18} />
          </button>

          {/* 4. Speaker / Read Aloud Icon */}
          <button
            onClick={handleSpeak}
            className={cn(
              "p-2 rounded-xl transition-colors cursor-pointer active:scale-95 relative",
              isSpeaking && !isPaused
                ? "text-cyan-400 bg-cyan-500/20 animate-pulse"
                : isSpeaking && isPaused
                ? "text-amber-400 bg-amber-500/20"
                : "text-white/50 hover:text-white hover:bg-white/10"
            )}
            title={isSpeaking ? (isPaused ? "Resume Speech" : "Pause Speech") : "Read Aloud"}
            aria-label="Read Aloud"
          >
            <Volume2 size={18} />
          </button>

          {/* Stop Speech button if speaking */}
          {isSpeaking && (
            <button
              onClick={handleStopSpeak}
              className="p-1.5 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors cursor-pointer"
              title="Stop Speech"
            >
              <Square size={12} className="fill-current" />
            </button>
          )}

          {/* 5. Share Icon */}
          <button
            onClick={onShare}
            className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer active:scale-95"
            title="Share response"
            aria-label="Share response"
          >
            <Share2 size={18} />
          </button>

          {/* 6. More Options Icon (Vertical Ellipsis) */}
          <div className="relative">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className={cn(
                "p-2 rounded-xl transition-colors cursor-pointer active:scale-95",
                showMoreMenu
                  ? "text-cyan-400 bg-white/15"
                  : "text-white/50 hover:text-white hover:bg-white/10"
              )}
              title="More options"
              aria-label="More options"
            >
              <MoreVertical size={18} />
            </button>

            {/* More Options Dropdown Menu */}
            {showMoreMenu && (
              <div className="absolute bottom-full right-0 mb-2 w-56 p-2 bg-[#121218] border border-cyan-500/30 rounded-2xl shadow-2xl z-50 text-xs text-white animate-fade-in flex flex-col gap-1 backdrop-blur-xl">
                <div className="text-[10px] uppercase font-bold text-cyan-400 px-2.5 py-1 tracking-wider border-b border-white/10 flex items-center justify-between">
                  <span>Message Options</span>
                  <button onClick={() => setShowMoreMenu(false)} className="text-white/40 hover:text-white text-xs">✕</button>
                </div>

                {onReSearch && (
                  <button
                    onClick={() => {
                      setShowMoreMenu(false);
                      setShowReSearchMenu(!showReSearchMenu);
                    }}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer text-left"
                  >
                    <RefreshCw size={14} className="text-cyan-400" />
                    <span>Re-search / Regenerate</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    setShowLangMenu(!showLangMenu);
                  }}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer text-left"
                >
                  <Languages size={14} className="text-cyan-400" />
                  <span>TTS Language ({selectedLang === 'all' ? 'Auto' : selectedLang.toUpperCase()})</span>
                </button>

                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    setShowVoiceSettings(!showVoiceSettings);
                  }}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer text-left"
                >
                  <Settings size={14} className="text-cyan-400" />
                  <span>Voice & Speech Settings</span>
                </button>

                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    handleExportMarkdown();
                  }}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer text-left"
                >
                  <FileText size={14} className="text-cyan-400" />
                  <span>Export as Markdown</span>
                </button>
              </div>
            )}

            {/* Re-search mode popup */}
            {showReSearchMenu && (
              <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-[#121218] border border-cyan-500/30 rounded-2xl shadow-2xl z-50 text-xs text-white animate-fade-in flex flex-col gap-1 backdrop-blur-xl">
                <div className="text-[10px] uppercase font-bold text-white/40 px-2 py-1 tracking-wider">
                  Re-search Mode
                </div>
                <button
                  onClick={() => {
                    setShowReSearchMenu(false);
                    onReSearch?.('chat');
                    toast.success('Switching to Chat mode...');
                  }}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer text-left"
                >
                  <MessageSquare size={13} className="text-cyan-400" />
                  <span>Chat Mode</span>
                </button>
                <button
                  onClick={() => {
                    setShowReSearchMenu(false);
                    onReSearch?.('research');
                    toast.success('Re-searching in Deep Research mode...');
                  }}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer text-left"
                >
                  <Telescope size={13} className="text-cyan-400" />
                  <span>Deep Research</span>
                </button>
              </div>
            )}

            {/* Language Selection Popup */}
            {showLangMenu && (
              <div className="absolute bottom-full right-0 mb-2 w-64 max-h-72 overflow-y-auto p-2 bg-[#121218] border border-cyan-500/30 rounded-2xl shadow-2xl z-50 text-xs text-white animate-fade-in flex flex-col gap-1 backdrop-blur-xl custom-scrollbar">
                <div className="text-[10px] uppercase font-bold text-cyan-400 px-2.5 py-1 tracking-wider border-b border-white/10 flex items-center justify-between">
                  <span>Select TTS Language</span>
                  <button onClick={() => setShowLangMenu(false)} className="text-white/40 hover:text-white text-xs">✕</button>
                </div>

                <button
                  onClick={() => { handleSelectLanguage('all'); setShowLangMenu(false); }}
                  className={cn(
                    "flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-colors cursor-pointer text-xs",
                    selectedLang === 'all' ? "bg-cyan-500/20 text-cyan-300 font-semibold" : "hover:bg-white/10 text-white/80 hover:text-white"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span>🌐</span>
                    <span>All System Languages</span>
                  </span>
                  {selectedLang === 'all' && <Check size={14} className="text-cyan-400" />}
                </button>

                {availableLanguages.map(({ code, count, meta }) => (
                  <button
                    key={code}
                    onClick={() => { handleSelectLanguage(code); setShowLangMenu(false); }}
                    className={cn(
                      "flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-colors cursor-pointer text-xs",
                      selectedLang === code ? "bg-cyan-500/20 text-cyan-300 font-semibold" : "hover:bg-white/10 text-white/80 hover:text-white"
                    )}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span>{meta.flag}</span>
                      <span className="truncate">{meta.name} <span className="text-white/40 text-[10px]">({meta.native})</span></span>
                    </span>
                    <span className="flex items-center gap-1.5 shrink-0 ml-2">
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-white/60">{count} voices</span>
                      {selectedLang === code && <Check size={14} className="text-cyan-400" />}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Voice Settings Popup */}
            {showVoiceSettings && (
              <div className="absolute bottom-full right-0 mb-2 w-80 p-4 bg-[#121218] border border-cyan-500/30 rounded-2xl shadow-2xl z-50 text-xs text-white animate-fade-in backdrop-blur-xl">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Volume2 size={16} className="text-cyan-400" />
                    <span className="font-semibold text-sm text-white">Voice & Language Settings</span>
                  </div>
                  <button 
                    onClick={() => setShowVoiceSettings(false)}
                    className="text-white/50 hover:text-white text-xs px-2 py-0.5 rounded bg-white/5"
                  >
                    Close
                  </button>
                </div>

                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-white/70 font-medium block text-[11px] uppercase tracking-wider">Target Language</label>
                    <select
                      value={selectedLang}
                      onChange={(e) => handleSelectLanguage(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-2 outline-none focus:border-cyan-500 text-xs text-white"
                    >
                      <option value="all" className="bg-[#121218] text-white">🌐 All Languages ({voices.length} voices)</option>
                      {availableLanguages.map(({ code, count, meta }) => (
                        <option key={code} value={code} className="bg-[#121218] text-white">
                          {meta.flag} {meta.name} ({meta.native}) - {count} voices
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-white/70 font-medium block text-[11px] uppercase tracking-wider">Quick Presets</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={applyMaleVoicePreset}
                        className="flex-1 px-2.5 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 font-medium text-[11px] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span>👨 Male Voice</span>
                      </button>
                      <button
                        type="button"
                        onClick={applyFemaleVoicePreset}
                        className="flex-1 px-2.5 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 font-medium text-[11px] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span>👩 Female Voice</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
                    <button
                      type="button"
                      onClick={() => setVoiceGenderFilter('all')}
                      className={cn(
                        "flex-1 py-1 text-[11px] rounded-lg font-medium transition-colors cursor-pointer",
                        voiceGenderFilter === 'all' ? "bg-cyan-500/25 text-cyan-300 font-semibold" : "text-white/60 hover:text-white"
                      )}
                    >
                      All ({voices.filter(v => selectedLang === 'all' || getLangPrefix(v.lang) === selectedLang).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setVoiceGenderFilter('male')}
                      className={cn(
                        "flex-1 py-1 text-[11px] rounded-lg font-medium transition-colors cursor-pointer",
                        voiceGenderFilter === 'male' ? "bg-cyan-500/25 text-cyan-300 font-semibold" : "text-white/60 hover:text-white"
                      )}
                    >
                      👨 Male
                    </button>
                    <button
                      type="button"
                      onClick={() => setVoiceGenderFilter('female')}
                      className={cn(
                        "flex-1 py-1 text-[11px] rounded-lg font-medium transition-colors cursor-pointer",
                        voiceGenderFilter === 'female' ? "bg-cyan-500/25 text-cyan-300 font-semibold" : "text-white/60 hover:text-white"
                      )}
                    >
                      👩 Female
                    </button>
                  </div>

                  <div className="space-y-1">
                    <label className="text-white/70 font-medium block text-[11px] uppercase tracking-wider">Voice Profile</label>
                    <select
                      value={selectedVoiceURI}
                      onChange={(e) => setSelectedVoiceURI(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-2 outline-none focus:border-cyan-500 text-xs text-white"
                    >
                      {voices
                        .filter(v => {
                          if (selectedLang !== 'all' && getLangPrefix(v.lang) !== selectedLang) return false;
                          if (voiceGenderFilter === 'male') return isMaleVoice(v);
                          if (voiceGenderFilter === 'female') return isFemaleVoice(v);
                          return true;
                        })
                        .map((voice) => (
                          <option key={voice.voiceURI} value={voice.voiceURI} className="bg-[#121218] text-white">
                            {isMaleVoice(voice) ? '👨 ' : isFemaleVoice(voice) ? '👩 ' : '🗣️ '}
                            {voice.name} ({voice.lang})
                          </option>
                        ))}
                      {voices.length === 0 && (
                        <option value="" className="bg-[#121218] text-white">Default System Voice</option>
                      )}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-white/70 font-medium text-[11px]">
                      <span className="uppercase tracking-wider">Speed Rate</span>
                      <span className="text-cyan-400 font-mono font-bold">{speechRate}x</span>
                    </div>
                    <div className="flex gap-1.5 mb-1">
                      {[0.8, 1.0, 1.25, 1.5].map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => setSpeechRate(rate)}
                          className={cn(
                            "flex-1 py-0.5 rounded-lg text-[10px] font-mono transition-colors border cursor-pointer",
                            speechRate === rate 
                              ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold" 
                              : "bg-white/5 text-white/60 border-white/10 hover:text-white"
                          )}
                        >
                          {rate}x
                        </button>
                      ))}
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={speechRate}
                      onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 bg-white/10 h-1 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-white/70 font-medium text-[11px]">
                      <span className="uppercase tracking-wider">Pitch / Tone</span>
                      <span className="text-cyan-400 font-mono font-bold">{speechPitch}</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="1.5"
                      step="0.1"
                      value={speechPitch}
                      onChange={(e) => setSpeechPitch(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 bg-white/10 h-1 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <SourcesSidebar 
        open={isSidebarOpen} 
        onOpenChange={setIsSidebarOpen} 
        sources={sources} 
      />
    </div>
  );
});

AnswerView.displayName = 'AnswerView';
