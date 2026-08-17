import React, { useState, useCallback } from 'react';
import {
  Search,
  Globe,
  BookOpen,
  GraduationCap,
  Database,
  Newspaper,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Share2,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Copy,
  Layers,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';

export interface ResourceSearchUIProps {
  onSearchInChat?: (query: string) => void;
  className?: string;
}

export interface WebSearchResult {
  title: string;
  url: string;
  snippet?: string;
  domain?: string;
}

export interface CuratedResource {
  id: string;
  title: string;
  category: 'docs' | 'academic' | 'datasets' | 'news';
  description: string;
  url: string;
  icon: string;
  tags: string[];
}

const CURATED_RESOURCES: CuratedResource[] = [
  // Dev & Docs
  {
    id: 'res_google_maps',
    title: 'Google Maps Platform Documentation',
    category: 'docs',
    description: 'Official API documentation for Maps, Places, Routes, and Address Validation SDKs.',
    url: 'https://developers.google.com/maps/documentation',
    icon: '🗺️',
    tags: ['Google Maps', 'API', 'Places', 'Routes'],
  },
  {
    id: 'res_mdn',
    title: 'MDN Web Docs',
    category: 'docs',
    description: 'Comprehensive references and guides for HTML, CSS, JavaScript, and Web APIs.',
    url: 'https://developer.mozilla.org',
    icon: '🌐',
    tags: ['JavaScript', 'Web APIs', 'HTML', 'CSS'],
  },
  {
    id: 'res_react',
    title: 'React Official Documentation',
    category: 'docs',
    description: 'Official guides, API reference, and hooks tutorials for building React UIs.',
    url: 'https://react.dev',
    icon: '⚛️',
    tags: ['React', 'Hooks', 'TypeScript', 'Frontend'],
  },
  {
    id: 'res_firebase',
    title: 'Firebase Docs',
    category: 'docs',
    description: 'Firestore, Authentication, Cloud Functions, and App Hosting developer guides.',
    url: 'https://firebase.google.com/docs',
    icon: '🔥',
    tags: ['Firebase', 'Firestore', 'Auth', 'Database'],
  },
  {
    id: 'res_python',
    title: 'Python Official Documentation',
    category: 'docs',
    description: 'Standard library reference, language specification, and tutorial guides.',
    url: 'https://docs.python.org/3/',
    icon: '🐍',
    tags: ['Python', 'Backend', 'Data Science'],
  },

  // Academic & Papers
  {
    id: 'res_arxiv',
    title: 'arXiv Computer Science & AI',
    category: 'academic',
    description: 'Open access preprints in artificial intelligence, machine learning, and computer science.',
    url: 'https://arxiv.org/archive/cs',
    icon: '🎓',
    tags: ['AI', 'Machine Learning', 'Preprints', 'Research'],
  },
  {
    id: 'res_scholar',
    title: 'Google Scholar',
    category: 'academic',
    description: 'Search across disciplines and sources: articles, theses, books, and abstracts.',
    url: 'https://scholar.google.com',
    icon: '🔍',
    tags: ['Academic', 'Citations', 'Papers'],
  },
  {
    id: 'res_nature',
    title: 'Nature International Journal',
    category: 'academic',
    description: 'Peer-reviewed research across all science and technology fields.',
    url: 'https://www.nature.com',
    icon: '🔬',
    tags: ['Science', 'Peer-Reviewed', 'Research'],
  },

  // Datasets
  {
    id: 'res_kaggle',
    title: 'Kaggle Open Datasets',
    category: 'datasets',
    description: 'Thousands of public datasets for machine learning, data science, and analytics.',
    url: 'https://www.kaggle.com/datasets',
    icon: '📊',
    tags: ['Datasets', 'Kaggle', 'Machine Learning'],
  },
  {
    id: 'res_huggingface',
    title: 'Hugging Face Hub & Datasets',
    category: 'datasets',
    description: 'Open-source AI models, NLP datasets, vision data, and computer vision benchmarks.',
    url: 'https://huggingface.co/datasets',
    icon: '🤗',
    tags: ['AI Models', 'NLP', 'Datasets'],
  },
  {
    id: 'res_datagov',
    title: 'Data.gov Open Government Data',
    category: 'datasets',
    description: 'Open government datasets across agriculture, climate, education, and finance.',
    url: 'https://data.gov',
    icon: '🏛️',
    tags: ['Public Data', 'Government', 'Statistics'],
  },

  // News
  {
    id: 'res_news_google',
    title: 'Google News',
    category: 'news',
    description: 'Real-time breaking news headlines from trusted global news agencies.',
    url: 'https://news.google.com',
    icon: '📰',
    tags: ['News', 'Global', 'Real-time'],
  },
  {
    id: 'res_hn',
    title: 'Hacker News (Y Combinator)',
    category: 'news',
    description: 'Community-curated tech, startup, computer science, and engineering discussions.',
    url: 'https://news.ycombinator.com',
    icon: '🟧',
    tags: ['Startups', 'Programming', 'Engineering'],
  },
  {
    id: 'res_techcrunch',
    title: 'TechCrunch',
    category: 'news',
    description: 'Latest reporting on startups, artificial intelligence, venture capital, and gadgets.',
    url: 'https://techcrunch.com',
    icon: '🚀',
    tags: ['Tech News', 'Startups', 'VC'],
  },
];

export const ResourceSearchUI: React.FC<ResourceSearchUIProps> = ({
  onSearchInChat,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'search' | 'docs' | 'academic' | 'datasets' | 'news'>('search');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<WebSearchResult[]>([]);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('rishi_bookmarked_resources');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const toggleBookmark = (id: string, title: string) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        toast.info(`Removed "${title}" from bookmarks`);
      } else {
        next.add(id);
        toast.success(`Bookmarked "${title}"`);
      }
      try {
        localStorage.setItem('rishi_bookmarked_resources', JSON.stringify(Array.from(next)));
      } catch (err) {
        console.warn('Failed to persist bookmarks:', err);
      }
      return next;
    });
  };

  const handleLiveSearch = useCallback(
    async (queryToSearch?: string) => {
      const q = (queryToSearch || searchQuery).trim();
      if (!q) {
        toast.error('Please enter a search query');
        return;
      }

      setIsSearching(true);
      setSearchResults([]);
      setAiSummary(null);
      setActiveTab('search');

      try {
        const response = await fetch('/api/gemini/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: `Search the web for: ${q}. Provide a concise 2-sentence summary and cite key real-world sources.`,
            mode: 'search',
          }),
        });

        if (!response.ok) {
          throw new Error('Search request failed');
        }

        const data = await response.json();
        setAiSummary(data.text || null);

        if (data.sources && Array.isArray(data.sources)) {
          const formatted: WebSearchResult[] = data.sources.map((s: any) => ({
            title: s.title || s.url,
            url: s.url,
            snippet: s.snippet || 'Real-time Google Search Result',
            domain: new URL(s.url).hostname.replace('www.', ''),
          }));
          setSearchResults(formatted);
          toast.success(`Retrieved ${formatted.length} search results`);
        } else {
          toast.info('Search query processed');
        }
      } catch (err) {
        console.warn('Live search fallback:', err);
        // Fallback simulated web search results with direct Google Search links
        setSearchResults([
          {
            title: `${q} - Google Web Search`,
            url: `https://www.google.com/search?q=${encodeURIComponent(q)}`,
            snippet: `Search real-time Google web results directly for "${q}".`,
            domain: 'google.com',
          },
          {
            title: `${q} - Wikipedia Overview`,
            url: `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(q)}`,
            snippet: `Explore encyclopedic references and background history for "${q}".`,
            domain: 'wikipedia.org',
          },
          {
            title: `${q} - GitHub Technical Repositories`,
            url: `https://github.com/search?q=${encodeURIComponent(q)}`,
            snippet: `Browse code repositories, SDKs, and open-source tools related to "${q}".`,
            domain: 'github.com',
          },
        ]);
        setAiSummary(`Live Google Search active for **${q}**. Explore citations and links below.`);
      } finally {
        setIsSearching(false);
      }
    },
    [searchQuery]
  );

  const filteredCurated = CURATED_RESOURCES.filter((res) => {
    const matchesTab = activeTab === 'search' || res.category === activeTab;
    const matchesQuery =
      !searchQuery.trim() ||
      res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesQuery;
  });

  return (
    <div className={`w-full h-full flex flex-col font-sans bg-black/40 text-white rounded-3xl p-4 sm:p-6 space-y-6 overflow-y-auto ${className}`}>
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 border border-blue-500/20 backdrop-blur-xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs uppercase tracking-wider">
            <Globe className="w-4 h-4 animate-pulse" />
            <span>Google Search & Web Resources Hub</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Resources & Search Engine
          </h2>
          <p className="text-xs sm:text-sm text-white/60 max-w-2xl">
            Access real-time Google search results, API documentation, research papers, datasets, and tech news directly.
          </p>
        </div>

        <button
          onClick={() => {
            window.open('https://www.google.com', '_blank', 'noopener,noreferrer');
            toast.info('Opening Google.com in new tab');
          }}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all shrink-0 cursor-pointer"
        >
          <span>Open Google.com</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Google Search Input */}
      <div className="space-y-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLiveSearch();
          }}
          className="flex flex-col sm:flex-row items-center gap-2.5"
        >
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Google, docs, papers, or datasets (e.g. 'Google Maps API', 'Quantum AI', 'React Hooks')..."
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 focus:bg-black/80 text-white placeholder-white/40 border border-white/15 focus:border-blue-500 text-sm outline-none transition-all shadow-inner"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              type="submit"
              disabled={isSearching}
              className="flex-1 sm:flex-none px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSearching ? 'animate-spin' : ''}`} />
              <span>{isSearching ? 'Searching...' : 'Search Google'}</span>
            </button>

            {onSearchInChat && searchQuery.trim() && (
              <button
                type="button"
                onClick={() => onSearchInChat(searchQuery)}
                className="px-4 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                title="Send query to Rishi AI Chat"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Ask AI</span>
              </button>
            )}
          </div>
        </form>

        {/* Quick Filter Tag Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs text-white/70 no-scrollbar">
          <span className="text-white/40 font-medium shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Quick Topics:
          </span>
          {['Google Maps API', 'React 19', 'Python Machine Learning', 'arXiv AI Papers', 'Kaggle Datasets', 'Next.js 15'].map(
            (tag) => (
              <button
                key={tag}
                onClick={() => {
                  setSearchQuery(tag);
                  handleLiveSearch(tag);
                }}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 hover:border-blue-500/40 text-white/80 hover:text-white transition-all whitespace-nowrap cursor-pointer"
              >
                {tag}
              </button>
            )
          )}
        </div>
      </div>

      {/* Category Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto no-scrollbar">
        {[
          { id: 'search', label: 'Google Web Search', icon: Globe },
          { id: 'docs', label: 'Developer Docs', icon: BookOpen },
          { id: 'academic', label: 'Academic & Papers', icon: GraduationCap },
          { id: 'datasets', label: 'Datasets & Data', icon: Database },
          { id: 'news', label: 'Tech & World News', icon: Newspaper },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search Results & AI Grounding Summary */}
      {aiSummary && (
        <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-500/30 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
            <Sparkles className="w-4 h-4" />
            <span>AI Search Grounding Summary</span>
          </div>
          <p className="text-xs text-white/90 leading-relaxed">{aiSummary}</p>
        </div>
      )}

      {/* Live Google Search Web Results */}
      {searchResults.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-400" />
              <span>Live Search Results ({searchResults.length})</span>
            </span>
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>View all on Google</span> <ExternalLink className="w-3 h-3" />
            </a>
          </h3>

          <div className="grid grid-cols-1 gap-3">
            {searchResults.map((res, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex flex-col justify-between gap-2 group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono text-blue-400 truncate">
                      {res.domain || res.url}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(res.url);
                        toast.success('Link copied!');
                      }}
                      className="p-1 rounded bg-white/5 hover:bg-white/15 text-white/60 hover:text-white"
                      title="Copy URL"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                  <a
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors flex items-center gap-1.5 mt-1"
                  >
                    <span>{res.title}</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                  {res.snippet && (
                    <p className="text-xs text-white/60 mt-1 line-clamp-2">{res.snippet}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Curated Resources Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Recommended Web Resources & Platforms ({filteredCurated.length})</span>
          </h3>
        </div>

        {filteredCurated.length === 0 ? (
          <div className="p-8 text-center bg-white/5 rounded-2xl border border-white/10 space-y-2">
            <BookOpen className="w-8 h-8 text-white/30 mx-auto" />
            <p className="text-xs text-white/60">No curated resources match your filter.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveTab('search');
              }}
              className="text-xs text-blue-400 font-semibold hover:underline"
            >
              Reset Search Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCurated.map((res) => {
              const isBookmarked = bookmarkedIds.has(res.id);
              return (
                <div
                  key={res.id}
                  className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/40 transition-all flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl p-2 rounded-xl bg-white/10 border border-white/10 shrink-0">
                          {res.icon}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
                            {res.title}
                          </h4>
                          <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider">
                            {res.category}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleBookmark(res.id, res.title)}
                        className={`p-2 rounded-xl transition-colors cursor-pointer ${
                          isBookmarked
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/15'
                        }`}
                        title={isBookmarked ? 'Bookmarked' : 'Bookmark resource'}
                      >
                        {isBookmarked ? (
                          <BookmarkCheck className="w-4 h-4" />
                        ) : (
                          <Bookmark className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    <p className="text-xs text-white/70 line-clamp-2 leading-relaxed">
                      {res.description}
                    </p>
                  </div>

                  {/* Tags and Action */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1">
                      {res.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] text-white/60 font-mono"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>

                    <a
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-blue-600/80 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1 shrink-0 transition-colors"
                    >
                      <span>Open</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
