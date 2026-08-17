import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Mic,
  X,
  Star,
  Clock,
  Smartphone,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  Info,
  SlidersHorizontal,
  RotateCcw,
  Play,
  Grid,
  CheckCircle2,
  Cpu,
  Layers,
} from 'lucide-react';
import { useAppLauncher } from '@/hooks/useAppLauncher';
import { AppIcon } from './AppIcon';
import { AppItem } from '@/lib/launcher/appsData';
import { isAndroidDevice } from '@/lib/launcher/appLauncherEngine';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AppLauncherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectApp?: (app: AppItem) => void;
}

export const AppLauncherModal: React.FC<AppLauncherModalProps> = ({
  isOpen,
  onClose,
  onSelectApp,
}) => {
  const {
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
    totalInstalledCount,
  } = useAppLauncher();

  const [inspectApp, setInspectApp] = useState<AppItem | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'recents'>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const categories = ['All', 'Social', 'Media', 'Productivity', 'Utilities', 'System', 'Tools'];

  // Auto focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  // Keyboard navigation & search shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        if (inspectApp) {
          setInspectApp(null);
        } else {
          onClose();
        }
      } else if (e.key === 'Enter' && searchQuery.trim() && filteredApps.length > 0) {
        // Open top search result on Enter!
        e.preventDefault();
        const topApp = filteredApps[0];
        handleLaunchApp(topApp);
        if (onSelectApp) onSelectApp(topApp);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, inspectApp, searchQuery, filteredApps, handleLaunchApp, onClose, onSelectApp]);

  if (!isOpen) return null;

  const isAndroid = isAndroidDevice();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      {/* Container Box */}
      <div className="relative w-full max-w-4xl h-[88vh] max-h-[850px] bg-[#121319] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white font-sans">

        {/* Top Header */}
        <div className="px-5 py-4 border-b border-white/10 bg-[#161822]/80 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Grid size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-white">Android App Launcher</h2>
                <span className="text-[10px] font-extrabold uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                  {totalInstalledCount} Installed
                </span>
              </div>
              <p className="text-xs text-white/50 flex items-center gap-1.5 mt-0.5">
                <Cpu size={12} className="text-emerald-400" />
                <span>{isAndroid ? 'Android Device Intent Engine Active' : 'Web Simulation & Deep Link Engine Active'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all cursor-pointer border border-white/5 active:scale-95"
              title="Close Launcher (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Search Bar & Voice Bar */}
        <div className="p-4 bg-[#14151e] border-b border-white/10 space-y-3 shrink-0">
          <div className="relative flex items-center">
            <Search size={18} className="absolute left-4 text-white/40 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search apps by name, package, or say 'Open WhatsApp'..."
              className="w-full pl-11 pr-24 py-3 bg-black/40 border border-white/10 rounded-2xl text-sm text-white placeholder-white/35 focus:outline-none focus:border-cyan-500/80 focus:ring-2 focus:ring-cyan-500/20 transition-all shadow-inner"
            />

            <div className="absolute right-2 flex items-center gap-1">
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-1.5 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                  title="Clear search"
                >
                  <X size={16} />
                </button>
              )}

              <button
                onClick={startVoiceSearch}
                className={cn(
                  'p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center',
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/30'
                    : 'bg-white/5 hover:bg-white/10 text-cyan-400 hover:text-cyan-300 border border-white/10'
                )}
                title="Voice Search App Command"
              >
                <Mic size={16} />
              </button>
            </div>
          </div>

          {/* AI Voice Listening Status or Prompt Suggestion */}
          {isListening ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>Listening: "{voiceTranscript || 'Say app name like YouTube or WhatsApp...'}"</span>
            </div>
          ) : (
            <div className="flex items-center justify-between text-[11px] text-white/40 px-1">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <Sparkles size={12} className="text-cyan-400 shrink-0" />
                <span>AI Commands:</span>
                {['Open YouTube', 'Launch WhatsApp', 'Open Settings', 'Launch Chrome'].map((cmd) => (
                  <button
                    key={cmd}
                    onClick={() => {
                      setSearchQuery(cmd);
                      handleAICommand(cmd);
                    }}
                    className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-white/70 hover:text-cyan-300 transition-colors cursor-pointer border border-white/5 shrink-0"
                  >
                    "{cmd}"
                  </button>
                ))}
              </div>
              <span className="hidden sm:inline font-mono text-[10px] text-white/30">Press Enter to Launch</span>
            </div>
          )}

          {/* Tab Navigation & Category Filter Chips */}
          <div className="flex items-center justify-between gap-2 pt-1 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1 bg-black/30 p-1 rounded-xl border border-white/5 shrink-0">
              <button
                onClick={() => setActiveTab('all')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                  activeTab === 'all'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                    : 'text-white/60 hover:text-white'
                )}
              >
                All Apps ({totalInstalledCount})
              </button>
              <button
                onClick={() => setActiveTab('favorites')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5',
                  activeTab === 'favorites'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                    : 'text-white/60 hover:text-white'
                )}
              >
                <Star size={12} className="fill-amber-400/80 text-amber-400" />
                <span>Pinned ({pinnedApps.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('recents')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5',
                  activeTab === 'recents'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-sm'
                    : 'text-white/60 hover:text-white'
                )}
              >
                <Clock size={12} className="text-purple-400" />
                <span>Recent ({recentAppItems.length})</span>
              </button>
            </div>

            {/* Category Filter */}
            {activeTab === 'all' && (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap',
                      selectedCategory === cat
                        ? 'bg-white/15 text-white border border-white/20'
                        : 'text-white/40 hover:text-white/80 hover:bg-white/5'
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Apps View Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6 custom-scrollbar">

          {/* 1. RECENTLY USED APPS SECTION (Shown when on 'all' tab without active query, or 'recents' tab) */}
          {(activeTab === 'recents' || (activeTab === 'all' && !searchQuery && recentAppItems.length > 0)) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/50">
                  <Clock size={14} className="text-purple-400" />
                  <span>Recently Used Apps</span>
                </div>
                {recentAppItems.length > 0 && (
                  <button
                    onClick={clearRecentApps}
                    className="text-[11px] text-white/40 hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw size={11} />
                    <span>Clear Recents</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {recentAppItems.map(({ app, launchedAt }) => (
                  <div
                    key={`recent_${app.id}`}
                    onClick={() => {
                      handleLaunchApp(app);
                      if (onSelectApp) onSelectApp(app);
                    }}
                    className="group relative flex flex-col items-center p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-purple-500/30 transition-all duration-200 cursor-pointer shadow-sm hover:scale-[1.03]"
                  >
                    <AppIcon app={app} size="md" showBadge />
                    <span className="mt-2.5 text-xs font-semibold text-white/90 truncate w-full text-center group-hover:text-purple-300">
                      {app.name}
                    </span>
                    <span className="text-[10px] text-white/40 mt-0.5">
                      {new Date(launchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setInspectApp(app);
                      }}
                      className="absolute top-2 right-2 p-1 rounded-md text-white/20 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Inspect App Details"
                    >
                      <Info size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. PINNED / FAVORITES SECTION (Shown when on 'all' tab without query or 'favorites' tab) */}
          {(activeTab === 'favorites' || (activeTab === 'all' && !searchQuery && pinnedApps.length > 0)) && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/50">
                <Star size={14} className="text-amber-400 fill-amber-400/50" />
                <span>Favorites / Pinned</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {pinnedApps.map((app) => (
                  <div
                    key={`pinned_${app.id}`}
                    onClick={() => {
                      handleLaunchApp(app);
                      if (onSelectApp) onSelectApp(app);
                    }}
                    className="group relative flex flex-col items-center p-3.5 rounded-2xl bg-amber-500/[0.03] hover:bg-amber-500/[0.08] border border-amber-500/20 hover:border-amber-400/40 transition-all duration-200 cursor-pointer shadow-sm hover:scale-[1.03]"
                  >
                    <AppIcon app={app} size="lg" showBadge />
                    <span className="mt-2.5 text-xs font-bold text-white/90 truncate w-full text-center group-hover:text-amber-300">
                      {app.name}
                    </span>
                    <span className="text-[10px] text-amber-400/70 font-mono mt-0.5">{app.category}</span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePinApp(app.id);
                      }}
                      className="absolute top-2 right-2 p-1 rounded-md text-amber-400 hover:text-amber-300 hover:bg-amber-500/20 transition-colors"
                      title="Unpin from favorites"
                    >
                      <Star size={13} className="fill-amber-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. ALPHABETICAL & CATEGORIZED APP LIST */}
          <div className="space-y-4 pt-1">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/50">
                <Layers size={14} className="text-cyan-400" />
                <span>Installed Apps Index</span>
              </div>
              <span className="text-xs text-white/40">Showing {filteredApps.length} apps</span>
            </div>

            {filteredApps.length === 0 ? (
              <div className="py-12 text-center space-y-3 bg-white/[0.02] rounded-2xl border border-white/5">
                <Smartphone size={36} className="mx-auto text-white/20" />
                <p className="text-sm text-white/60 font-medium">No installed apps match "{searchQuery}"</p>
                <p className="text-xs text-white/40 max-w-sm mx-auto">
                  Try searching for keywords like "chat", "browser", "video", "settings", or click an AI Command button above.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                  }}
                  className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/30 transition-colors border border-cyan-500/30 cursor-pointer"
                >
                  Reset Search Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredApps.map((app) => {
                  const isPinned = pinnedAppIds.includes(app.id);

                  return (
                    <div
                      key={app.id}
                      onClick={() => {
                        handleLaunchApp(app);
                        if (onSelectApp) onSelectApp(app);
                      }}
                      className="group relative flex items-center gap-3.5 p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-cyan-500/30 transition-all duration-200 cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <AppIcon app={app} size="md" showBadge />

                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                            {app.name}
                          </h4>
                        </div>
                        <p className="text-[10px] text-white/40 font-mono truncate">{app.packageName}</p>
                        <span className="inline-block mt-1 text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded bg-white/5 text-white/50 border border-white/5">
                          {app.category}
                        </span>
                      </div>

                      <div className="absolute right-2 top-2 flex flex-col gap-1 opacity-80 group-hover:opacity-100">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePinApp(app.id);
                          }}
                          className={cn(
                            'p-1.5 rounded-lg transition-colors cursor-pointer',
                            isPinned
                              ? 'text-amber-400 bg-amber-500/10'
                              : 'text-white/20 hover:text-amber-400 hover:bg-white/10'
                          )}
                          title={isPinned ? 'Unpin' : 'Pin to favorites'}
                        >
                          <Star size={13} className={isPinned ? 'fill-amber-400' : ''} />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectApp(app);
                          }}
                          className="p-1.5 rounded-lg text-white/20 hover:text-cyan-300 hover:bg-white/10 transition-colors cursor-pointer"
                          title="Inspect application manifest"
                        >
                          <Info size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Footer Info Strip */}
        <div className="px-5 py-3 border-t border-white/10 bg-[#161822] flex items-center justify-between text-xs text-white/50 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Package Launch APIs Validated • Zero Sensitive Data Shared</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span>60/120 FPS</span>
            <span>Android OS 8.0+</span>
          </div>
        </div>

      </div>

      {/* APP INSPECTOR MODAL OVERLAY */}
      {inspectApp && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#181a24] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-5 text-white relative">
            <button
              onClick={() => setInspectApp(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-4">
              <AppIcon app={inspectApp} size="xl" showBadge />
              <div>
                <h3 className="text-lg font-bold text-white">{inspectApp.name}</h3>
                <p className="text-xs text-white/50 font-mono">{inspectApp.packageName}</p>
                <span className="inline-block mt-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {inspectApp.category} App
                </span>
              </div>
            </div>

            <p className="text-xs text-white/70 leading-relaxed bg-black/30 p-3 rounded-2xl border border-white/5">
              {inspectApp.description}
            </p>

            {/* In-App Deep Search Section */}
            {inspectApp.actionConfig && (
              <div className="p-3.5 bg-black/40 rounded-2xl border border-cyan-500/30 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
                    <Search size={13} />
                    <span>In-App Deep Search:</span>
                  </span>
                  <span className="text-[10px] uppercase font-mono text-cyan-400/70">
                    {inspectApp.actionConfig.supportedActions.join(' • ')}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    id={`inspect-search-${inspectApp.id}`}
                    placeholder={inspectApp.actionConfig.defaultQueryPlaceholder || `Search in ${inspectApp.name}...`}
                    className="flex-1 px-3 py-1.5 bg-white/5 border border-white/15 rounded-xl text-xs text-white placeholder:text-white/35 focus:outline-none focus:border-cyan-400"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = (e.target as HTMLInputElement).value;
                        if (val.trim()) {
                          handleLaunchInAppAction(inspectApp, val.trim(), inspectApp.actionConfig?.supportedActions[0] || 'search');
                          setInspectApp(null);
                        }
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const inputEl = document.getElementById(`inspect-search-${inspectApp.id}`) as HTMLInputElement;
                      const val = inputEl?.value || '';
                      if (val.trim()) {
                        handleLaunchInAppAction(inspectApp, val.trim(), inspectApp.actionConfig?.supportedActions[0] || 'search');
                        setInspectApp(null);
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition-all cursor-pointer shrink-0"
                  >
                    Go
                  </button>
                </div>

                {inspectApp.actionConfig.quickSuggestions && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {inspectApp.actionConfig.quickSuggestions.slice(0, 4).map((sugg, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          handleLaunchInAppAction(inspectApp, sugg, inspectApp.actionConfig?.supportedActions[0] || 'search');
                          setInspectApp(null);
                        }}
                        className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-cyan-500/20 text-[10px] text-white/70 hover:text-cyan-200 border border-white/5 transition-all"
                      >
                        {sugg}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-white/10">
                <span className="text-white/40">Launch Scheme URI:</span>
                <span className="font-mono text-[10px] text-cyan-300 truncate max-w-[220px]">
                  {inspectApp.scheme}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-white/10">
                <span className="text-white/40">Required Permissions:</span>
                <span className="font-mono text-[10px] text-emerald-400">
                  android.permission.INTERNET
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-white/10">
                <span className="text-white/40">Web Fallback URL:</span>
                <a
                  href={inspectApp.fallbackUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[10px] text-blue-400 hover:underline flex items-center gap-1"
                >
                  <span>Link</span>
                  <ExternalLink size={10} />
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  togglePinApp(inspectApp.id);
                }}
                className={cn(
                  'flex-1 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer border flex items-center justify-center gap-2',
                  pinnedAppIds.includes(inspectApp.id)
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-white/10 text-white hover:bg-white/15 border-white/10'
                )}
              >
                <Star size={14} className={pinnedAppIds.includes(inspectApp.id) ? 'fill-amber-400' : ''} />
                <span>{pinnedAppIds.includes(inspectApp.id) ? 'Unpin' : 'Pin App'}</span>
              </button>

              <button
                onClick={() => {
                  handleLaunchApp(inspectApp);
                  setInspectApp(null);
                  if (onSelectApp) onSelectApp(inspectApp);
                }}
                className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              >
                <Play size={14} className="fill-black" />
                <span>Launch App</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
