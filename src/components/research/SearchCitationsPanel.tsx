import React, { useState, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Globe, 
  ExternalLink, 
  Search, 
  Copy, 
  Check, 
  Layers, 
  X, 
  ShieldCheck, 
  Filter, 
  Sparkles, 
  Share2, 
  PanelRight, 
  Maximize2,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';

export interface SourceItem {
  title: string;
  url: string;
  snippet?: string;
  index?: number;
  domain?: string;
  searchQuery?: string;
}

export interface SearchCitationsPanelProps {
  sources: SourceItem[];
  searchQueries?: string[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  mode?: 'sidebar' | 'popover' | 'inline';
  trigger?: React.ReactNode;
}

export const SearchCitationsPanel: React.FC<SearchCitationsPanelProps> = ({
  sources = [],
  searchQueries = [],
  open = false,
  onOpenChange,
  mode = 'sidebar',
  trigger
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // Extract unique domains for filtering
  const domains = useMemo(() => {
    const set = new Set<string>();
    sources.forEach(s => {
      try {
        const host = new URL(s.url).hostname.replace(/^www\./, '');
        if (host) set.add(host);
      } catch (_) {}
    });
    return Array.from(set);
  }, [sources]);

  // Filter sources based on search query and selected domain filter
  const filteredSources = useMemo(() => {
    return sources.filter((s, idx) => {
      let hostname = '';
      try {
        hostname = new URL(s.url).hostname;
      } catch (_) {}

      const matchesDomain = selectedDomain === 'all' || hostname.includes(selectedDomain);
      const matchesSearch = !filterQuery.trim() || 
        s.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
        s.url.toLowerCase().includes(filterQuery.toLowerCase()) ||
        (s.snippet && s.snippet.toLowerCase().includes(filterQuery.toLowerCase()));

      return matchesDomain && matchesSearch;
    });
  }, [sources, selectedDomain, filterQuery]);

  const handleCopyCitation = (source: SourceItem, idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const markdown = `[${source.title || 'Source'}](${source.url})`;
    navigator.clipboard.writeText(markdown);
    setCopiedIdx(idx);
    toast.success('Citation markdown copied');
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleCopyAll = () => {
    if (sources.length === 0) return;
    const allMarkdown = sources.map((s, i) => `${i + 1}. [${s.title || 'Source'}](${s.url})`).join('\n');
    navigator.clipboard.writeText(allMarkdown);
    setCopiedAll(true);
    toast.success('All citations copied to clipboard');
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const isVerifiedDomain = (urlStr: string) => {
    try {
      const host = new URL(urlStr).hostname;
      return host.endsWith('.gov') || host.endsWith('.edu') || host.includes('wikipedia.org') || host.includes('pmindia.gov.in') || host.includes('github.com');
    } catch (_) {
      return false;
    }
  };

  // Render list of source cards
  const renderSourcesList = () => (
    <div className="space-y-3.5">
      {/* Search & Domain Filter Bar */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search sources or topics..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-500/50 transition-colors"
          />
          {filterQuery && (
            <button
              onClick={() => setFilterQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Domain Filter Pills */}
        {domains.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px]">
            <button
              onClick={() => setSelectedDomain('all')}
              className={`px-2.5 py-1 rounded-lg border transition-all shrink-0 cursor-pointer ${
                selectedDomain === 'all'
                  ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 font-medium'
                  : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              All ({sources.length})
            </button>
            {domains.map((dom) => (
              <button
                key={dom}
                onClick={() => setSelectedDomain(dom)}
                className={`px-2.5 py-1 rounded-lg border transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                  selectedDomain === dom
                    ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 font-medium'
                    : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <img
                  src={`https://www.google.com/s2/favicons?domain=${dom}&sz=32`}
                  alt=""
                  className="w-3 h-3 rounded-full opacity-80"
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                />
                <span className="truncate max-w-[100px]">{dom}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grounding Info / Stats Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-transparent border border-cyan-500/20 rounded-xl text-xs text-cyan-200">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-cyan-400 animate-pulse" />
          <span className="font-medium">Web Grounded Content</span>
        </div>
        <button
          onClick={handleCopyAll}
          className="flex items-center gap-1 text-[11px] font-medium text-cyan-300 hover:text-white transition-colors cursor-pointer"
          title="Copy all citations as Markdown"
        >
          {copiedAll ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          <span>{copiedAll ? 'Copied' : 'Copy All'}</span>
        </button>
      </div>

      {/* Sources List */}
      {filteredSources.length === 0 ? (
        <div className="text-center py-8 text-white/40 text-xs">
          No matching sources found.
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {filteredSources.map((source, i) => {
            let host = '';
            try {
              host = new URL(source.url).hostname.replace(/^www\./, '');
            } catch (_) {
              host = source.url;
            }
            const isVerified = isVerifiedDomain(source.url);

            return (
              <a
                key={i}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block p-3.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-cyan-500/40 rounded-xl transition-all duration-200 shadow-sm relative overflow-hidden"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/15 overflow-hidden">
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${host}&sz=64`}
                        alt=""
                        className="w-3.5 h-3.5 object-cover"
                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                      />
                    </div>
                    <span className="text-xs font-medium text-cyan-300/90 truncate max-w-[180px]">
                      {host}
                    </span>
                    {isVerified && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold border border-emerald-500/30">
                        <ShieldCheck size={9} /> Verified
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-white/60">
                      #{source.index ?? i + 1}
                    </span>
                    <button
                      onClick={(e) => handleCopyCitation(source, i, e)}
                      className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white transition-colors cursor-pointer"
                      title="Copy Markdown citation"
                    >
                      {copiedIdx === i ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    </button>
                    <ExternalLink size={12} className="text-white/40 group-hover:text-cyan-300 transition-colors" />
                  </div>
                </div>

                <h4 className="text-xs font-semibold text-white/95 group-hover:text-cyan-200 transition-colors line-clamp-2 leading-relaxed">
                  {source.title || 'Web Search Result'}
                </h4>

                {source.snippet && (
                  <p className="text-[11px] text-white/50 line-clamp-2 mt-1 leading-normal font-normal">
                    {source.snippet}
                  </p>
                )}

                <div className="text-[10px] font-mono text-white/30 truncate mt-1.5">
                  {source.url}
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );

  // Popover mode rendering
  if (mode === 'popover') {
    return (
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          {trigger || (
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-medium hover:bg-cyan-500/20 transition-all cursor-pointer">
              <Globe size={13} />
              <span>{sources.length} sources</span>
            </button>
          )}
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 sm:w-96 p-4 bg-[#0e0f18]/95 border-cyan-500/30 backdrop-blur-xl text-white shadow-2xl rounded-2xl z-50">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Globe size={16} className="text-cyan-400" />
              <span className="font-semibold text-sm">Grounded Sources ({sources.length})</span>
            </div>
          </div>
          {renderSourcesList()}
        </PopoverContent>
      </Popover>
    );
  }

  // Default Sidebar Drawer Mode
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md bg-[#0e1018]/95 border-l border-white/10 text-white p-0 overflow-y-auto backdrop-blur-2xl">
        <div className="p-5 border-b border-white/10 sticky top-0 bg-[#0e1018]/95 backdrop-blur z-10 flex items-center justify-between">
          <SheetHeader className="p-0">
            <SheetTitle className="flex items-center gap-2 text-base font-bold text-white">
              <Globe size={18} className="text-cyan-400" />
              <span>Web Search Citations</span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
                {sources.length}
              </span>
            </SheetTitle>
          </SheetHeader>
          <SheetClose className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer">
            <X size={16} />
          </SheetClose>
        </div>

        <div className="p-5">
          {renderSourcesList()}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SearchCitationsPanel;
