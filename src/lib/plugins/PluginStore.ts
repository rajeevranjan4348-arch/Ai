import { useState, useEffect } from 'react';

export interface PluginItem {
  id: string;
  name: string;
  category: 'creative' | 'study' | 'search' | 'reasoning' | 'utility';
  description: string;
  icon: string; // Emoji or Lucide name
  badge?: string;
  enabled: boolean;
  capabilities: string[];
}

export const DEFAULT_PLUGINS: PluginItem[] = [
  {
    id: 'image-creation',
    name: 'Image Creation AI',
    category: 'creative',
    description: 'Generate photorealistic images, artwork, 3D models, and visual concepts.',
    icon: '🎨',
    badge: 'Pro AI',
    enabled: true,
    capabilities: ['image_generation', 'aspect_ratio', 'style_presets', 'svg_canvas'],
  },
  {
    id: 'video-creation',
    name: 'Video Creation AI',
    category: 'creative',
    description: 'Generate animated AI video clips, storyboards, motion graphics, and scene scripts.',
    icon: '🎬',
    badge: 'Gen-2',
    enabled: true,
    capabilities: ['video_storyboard', 'motion_preview', 'audio_keyframes'],
  },
  {
    id: 'study-master',
    name: 'Study & Education',
    category: 'study',
    description: 'Create interactive flashcard decks, quizzes, practice tests, and structured notes.',
    icon: '📚',
    badge: 'Popular',
    enabled: true,
    capabilities: ['flashcards', 'multiple_choice_quiz', 'key_takeaways', 'concept_map'],
  },
  {
    id: 'web-search',
    name: 'Live Web Search',
    category: 'search',
    description: 'Fetch real-time information, breaking news, articles, and domain source citations.',
    icon: '🌐',
    badge: 'Live',
    enabled: true,
    capabilities: ['live_web_index', 'source_citations', 'news_extract'],
  },
  {
    id: 'deep-search',
    name: 'Deep Search & Research',
    category: 'search',
    description: 'Multi-query agentic deep research pipeline with cross-referenced source synthesis.',
    icon: '🔬',
    badge: 'Deep',
    enabled: true,
    capabilities: ['multi_source_report', 'data_tables', 'fact_verification'],
  },
  {
    id: 'thinking-mode',
    name: 'Thinking Mode',
    category: 'reasoning',
    description: 'Extended Chain-of-Thought (CoT) reasoning with self-correction and step breakdown.',
    icon: '🧠',
    badge: 'Reasoning',
    enabled: true,
    capabilities: ['chain_of_thought', 'step_verification', 'logic_proofs'],
  },
  {
    id: 'interpreter',
    name: 'Code Interpreter',
    category: 'utility',
    description: 'Safely execute and benchmark JavaScript, TypeScript, Python, and data scripts.',
    icon: '💻',
    badge: 'Runtime',
    enabled: true,
    capabilities: ['js_python_eval', 'benchmark', 'syntax_highlight'],
  },
  {
    id: 'calculator',
    name: 'Math & Formulas',
    category: 'utility',
    description: 'Solves complex math equations, unit conversions, matrix algebra, and physics.',
    icon: '🧮',
    badge: 'Exact',
    enabled: true,
    capabilities: ['math_eval', 'unit_convert', 'physics_formulas'],
  },
  {
    id: 'doc-analysis',
    name: 'Document Analysis',
    category: 'utility',
    description: 'Extract structured insights, summaries, and key points from PDFs and files.',
    icon: '📁',
    badge: 'OCR',
    enabled: true,
    capabilities: ['pdf_extract', 'spreadsheet_tables', 'file_summarizer'],
  },
  {
    id: 'weather',
    name: 'Weather & Climate',
    category: 'utility',
    description: 'Fetch real-time atmospheric metrics, 7-day weather forecasts, and satellite data.',
    icon: '☁️',
    badge: 'Live',
    enabled: true,
    capabilities: ['current_weather', 'forecast_chart', 'geo_location'],
  },
];

const STORAGE_KEY = 'ai_studio_plugins_v2';

// Global listeners for reactive store updates across all components
const listeners = new Set<() => void>();

export function getPlugins(): PluginItem[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed: PluginItem[] = JSON.parse(saved);
      // Merge with default plugins in case new plugins were added
      return DEFAULT_PLUGINS.map(defaultP => {
        const found = parsed.find(p => p.id === defaultP.id);
        return found ? { ...defaultP, enabled: found.enabled } : defaultP;
      });
    }
  } catch (err) {
    console.warn('Failed to parse saved plugins:', err);
  }
  return DEFAULT_PLUGINS;
}

export function savePlugins(plugins: PluginItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plugins));
    listeners.forEach(fn => fn());
  } catch (err) {
    console.error('Failed to save plugins:', err);
  }
}

export function togglePluginState(id: string): PluginItem[] {
  const current = getPlugins();
  const updated = current.map(p => (p.id === id ? { ...p, enabled: !p.enabled } : p));
  savePlugins(updated);
  return updated;
}

export function isPluginEnabled(id: string): boolean {
  const plugins = getPlugins();
  const found = plugins.find(p => p.id === id);
  return found ? found.enabled : false;
}

export function usePluginStore() {
  const [plugins, setPlugins] = useState<PluginItem[]>(getPlugins);

  useEffect(() => {
    const handleChange = () => {
      setPlugins(getPlugins());
    };

    listeners.add(handleChange);
    return () => {
      listeners.delete(handleChange);
    };
  }, []);

  const toggle = (id: string) => {
    const updated = togglePluginState(id);
    setPlugins(updated);
  };

  return { plugins, toggle };
}
