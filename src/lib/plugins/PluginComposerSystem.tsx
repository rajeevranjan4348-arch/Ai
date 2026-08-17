import React from 'react';
import { 
  X, 
  Wrench, 
  FileText, 
  ExternalLink, 
  Check, 
  AlertCircle, 
  Loader2,
  Sparkles,
  Search,
  Code,
  Paperclip
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Plugin, PluginContext, PluginExecutionResult } from './pluginTypes';
import { PLUGINS, hasPermission } from './PluginRegistry';
import { pluginManager } from './PluginManager';

export { PLUGINS, hasPermission, pluginManager };
export type { Plugin, PluginContext, PluginExecutionResult };

// ============================================================
// REACT COMPONENTS: PLUGIN PICKER STRIP & ACTIVE CHIP
// ============================================================

export interface PluginPickerProps {
  activePluginId: string | null;
  onSelectPlugin: (pluginId: string) => void;
  onRemovePlugin: () => void;
  className?: string;
}

export const PluginPickerStrip: React.FC<PluginPickerProps> = ({
  activePluginId,
  onSelectPlugin,
  onRemovePlugin,
  className = ""
}) => {
  return (
    <div className={cn("flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1.5 px-1", className)}>
      {PLUGINS.map((plugin) => {
        const isActive = activePluginId === plugin.id;
        return (
          <button
            key={plugin.id}
            type="button"
            onClick={() => {
              if (isActive) {
                onRemovePlugin();
              } else {
                onSelectPlugin(plugin.id);
              }
            }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border shrink-0 active:scale-95",
              isActive
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm shadow-cyan-500/20"
                : "bg-white/6 hover:bg-white/12 text-white/70 hover:text-white border-white/10"
            )}
          >
            <span>{plugin.icon}</span>
            <span>{plugin.name}</span>
            {isActive && <X size={13} className="ml-0.5 text-cyan-400 hover:text-white" />}
          </button>
        );
      })}
    </div>
  );
};

export interface ActivePluginChipProps {
  plugin: Plugin;
  onRemove: () => void;
  file?: File | null;
}

export const ActivePluginChip: React.FC<ActivePluginChipProps> = ({
  plugin,
  onRemove,
  file
}) => {
  return (
    <div className="flex items-center gap-2 mb-2 px-1">
      <div className="flex items-center gap-2 bg-[#1e293b]/90 border border-cyan-500/40 rounded-full px-3 py-1 text-cyan-300 text-xs font-semibold shadow-md shadow-cyan-950/30 animate-fade-in-up">
        <span className="text-sm">{plugin.composerIcon || plugin.icon}</span>
        <span>{plugin.composerLabel}</span>
        {file && (
          <span className="text-[11px] text-white/60 truncate max-w-[120px]">
            ({file.name})
          </span>
        )}
        <button
          type="button"
          onClick={onRemove}
          className="ml-1 p-0.5 text-cyan-400/80 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          title="Deactivate plugin"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

// ============================================================
// TOOL EXECUTION STATUS INDICATOR (SECTION 11)
// ============================================================

export interface ToolExecutionStatusProps {
  pluginId: string;
  status: 'executing' | 'completed' | 'failed';
  errorMessage?: string;
}

export const ToolExecutionStatus: React.FC<ToolExecutionStatusProps> = ({
  pluginId,
  status,
  errorMessage
}) => {
  const plugin = pluginManager.get(pluginId);
  const icon = plugin?.icon || '✦';
  const name = plugin?.name || 'Plugin';

  const getExecutingText = () => {
    switch (pluginId) {
      case 'image': return 'Creating image...';
      case 'search': return 'Searching the web...';
      case 'code': return 'Running code...';
      case 'file': return 'Analyzing file...';
      default: return `Running ${name}...`;
    }
  };

  const getCompletedText = () => {
    switch (pluginId) {
      case 'image': return 'Image created';
      case 'search': return 'Search completed';
      case 'code': return 'Code executed';
      case 'file': return 'File analyzed';
      default: return `${name} completed`;
    }
  };

  const getFailedText = () => {
    switch (pluginId) {
      case 'image': return 'Image generation failed';
      case 'search': return 'Search unavailable';
      case 'code': return 'Code execution failed';
      case 'file': return 'File analysis failed';
      default: return `${name} execution failed`;
    }
  };

  return (
    <div className="my-2 p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2.5 transition-all bg-[#111827]/80 backdrop-blur-md border-white/10">
      <div className="flex items-center gap-2">
        <span className="text-sm">{icon}</span>
        <span className="font-semibold text-white/90">
          {status === 'executing' && getExecutingText()}
          {status === 'completed' && getCompletedText()}
          {status === 'failed' && (errorMessage || getFailedText())}
        </span>
      </div>

      <div>
        {status === 'executing' && (
          <Loader2 size={15} className="animate-spin text-cyan-400" />
        )}
        {status === 'completed' && (
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Check size={12} />
          </div>
        )}
        {status === 'failed' && (
          <div className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
            <AlertCircle size={12} />
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// TOOL RESULT CARD DISPLAY FOR CHAT MESSAGES
// ============================================================

export const ToolResultDisplay: React.FC<{ result?: PluginExecutionResult; data?: any; pluginId?: string; toolId?: string }> = ({
  result,
  data: directData,
  pluginId: directPluginId,
  toolId: directToolId
}) => {
  const data = result?.data || directData;
  const pluginId = result?.pluginId || directPluginId;
  const toolId = result?.toolId || directToolId;
  const error = result?.error;

  if (result && !result.success) {
    return (
      <div className="mt-3 p-3 bg-rose-950/40 border border-rose-500/30 rounded-2xl text-xs text-rose-300 flex items-center gap-2">
        <AlertCircle size={16} className="shrink-0 text-rose-400" />
        <div>
          <span className="font-bold">Plugin Error ({pluginId}):</span> {error || 'Execution failed.'}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="mt-3 p-3.5 bg-[#12161f] border border-white/12 rounded-2xl text-xs text-white/90 space-y-2.5 shadow-lg">
      <div className="flex items-center justify-between text-[11px] text-cyan-400 font-semibold uppercase tracking-wider pb-1.5 border-b border-white/8">
        <div className="flex items-center gap-1.5">
          <Wrench size={13} />
          <span>Plugin Output • {pluginId || data.type}</span>
        </div>
        {result?.metadata?.duration && (
          <span className="text-white/40 font-mono text-[10px] lowercase">{result.metadata.duration}ms</span>
        )}
      </div>

      {data.type === 'image' && data.imageUrl && (
        <div className="space-y-2 pt-1">
          <p className="font-semibold text-white text-sm">{data.title}</p>
          <div className="aspect-video rounded-xl overflow-hidden bg-black/50 border border-white/10 relative group shadow-md">
            <img src={data.imageUrl} alt={data.prompt} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <a
              href={data.imageUrl}
              target="_blank"
              rel="noreferrer"
              className="absolute bottom-2 right-2 px-2.5 py-1 bg-black/70 backdrop-blur-md rounded-lg text-[11px] font-semibold text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
            >
              <span>Full View</span>
              <ExternalLink size={12} />
            </a>
          </div>
          {data.revisedPrompt && (
            <p className="text-[11px] text-white/50 italic leading-snug">
              Prompt tuning: {data.revisedPrompt}
            </p>
          )}
        </div>
      )}

      {data.type === 'search' && data.results && (
        <div className="space-y-2 pt-1">
          <p className="text-white/80 font-medium">Search results for "{data.query}":</p>
          <div className="space-y-2">
            {data.results.map((res: any, idx: number) => (
              <a
                key={idx}
                href={res.url}
                target="_blank"
                rel="noreferrer"
                className="block p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5 hover:border-cyan-500/30 group"
              >
                <div className="font-semibold text-cyan-300 group-hover:underline flex items-center justify-between">
                  <span>{res.title}</span>
                  <ExternalLink size={12} className="text-white/40 group-hover:text-cyan-300 shrink-0 ml-1" />
                </div>
                <div className="text-[11px] text-white/65 line-clamp-2 mt-1 leading-relaxed">{res.snippet}</div>
              </a>
            ))}
          </div>
        </div>
      )}

      {data.type === 'code' && (
        <div className="space-y-1.5 font-mono pt-1">
          <div className="flex items-center justify-between text-[11px] text-emerald-400 font-semibold mb-1">
            <span>Execution Sandbox Output</span>
            {data.executionTimeMs && <span>{data.executionTimeMs}ms</span>}
          </div>
          <div className="p-3 bg-black/80 rounded-xl border border-white/10 text-emerald-400 text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-inner">
            {data.output}
          </div>
        </div>
      )}

      {data.type === 'file-analysis' && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-2 font-bold text-amber-400 text-sm">
            <FileText size={16} />
            <span>{data.name} ({data.size})</span>
          </div>
          <p className="text-white/80 leading-relaxed">{data.summary}</p>
          {data.contentPreview && (
            <div className="p-2.5 bg-black/50 border border-white/10 rounded-xl text-[11px] font-mono text-white/70 overflow-x-auto max-h-32">
              {data.contentPreview}
            </div>
          )}
        </div>
      )}

      {data.type === 'video' && (
        <div className="space-y-2 pt-1">
          <p className="font-bold text-pink-400 text-sm">{data.title}</p>
          <video src={data.videoPreviewUrl} controls className="w-full rounded-xl border border-white/10 shadow-md" />
          <p className="text-white/70 italic text-[11px]">{data.script}</p>
        </div>
      )}

      {data.type === 'study' && (
        <div className="space-y-1 pt-1">
          <p className="font-bold text-emerald-400 text-sm">📚 Study Deck: {data.topic}</p>
          <p className="text-white/80 leading-relaxed">{data.summary}</p>
        </div>
      )}

      {data.type === 'thinking' && (
        <div className="space-y-2 pt-1">
          <p className="font-bold text-purple-400 text-sm">🧠 Step-by-Step Chain of Thought:</p>
          <div className="space-y-1.5 pl-1">
            {data.steps?.map((st: any, i: number) => (
              <div key={i} className="pl-2.5 border-l-2 border-purple-500/50 text-white/80 text-[11px] leading-relaxed">
                <span className="font-semibold text-white">{st.title}:</span> {st.desc}
              </div>
            ))}
          </div>
        </div>
      )}

      {data.type === 'math' && (
        <div className="pt-1 font-mono text-rose-300 space-y-1">
          <p className="font-bold text-xs">Math Solution:</p>
          <div className="p-2.5 bg-black/60 rounded-xl border border-rose-500/20 text-rose-200 text-xs">
            {data.solution}
          </div>
        </div>
      )}
    </div>
  );
};
