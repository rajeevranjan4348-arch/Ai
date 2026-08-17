import React, { useState, useEffect } from 'react';
import { Sparkles, Check, ChevronRight, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { DeepSearchIcon } from '@/components/ui/DeepSearchIcon';

export type AIModelId = 'k3' | 'gemini-3.1-pro' | 'gemini-3.1-flash-image' | 'k3-swarm' | 'instant' | 'minimax-m3';
export type ThinkingEffort = 'Standard' | 'High' | 'Low';

interface AIModel {
  id: AIModelId;
  name: string;
  description: string;
}

const MODELS: AIModel[] = [
  {
    id: 'k3',
    name: 'Gemini 3.6 Flash',
    description: 'Fast, intelligent search & reasoning engine',
  },
  {
    id: 'gemini-3.1-pro',
    name: 'Gemini 3.1 Pro',
    description: 'Advanced reasoning, complex problem solving & coding',
  },
  {
    id: 'gemini-3.1-flash-image',
    name: 'Nano Banana 2 — Image',
    description: 'High-speed multimodal & visual generation model',
  },
  {
    id: 'k3-swarm',
    name: 'Gemini Deep Research',
    description: 'Massive web search & multi-perspective synthesis',
  },
  {
    id: 'minimax-m3',
    name: 'MiniMax-M3',
    description: 'Advanced reasoning and high-precision language model',
  },
  {
    id: 'instant',
    name: 'Gemini Instant',
    description: 'Ultra-fast conversational AI',
  },
];

const THINKING_EFFORTS: ThinkingEffort[] = ['Standard', 'High', 'Low'];

interface ModelSelectorProps {
  className?: string;
  showChevron?: boolean;
  align?: 'left' | 'center' | 'right' | 'auto';
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ 
  className, 
  showChevron = true,
  align = 'right'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModelId>(() => {
    return (localStorage.getItem('selected_ai_model') as AIModelId) || 'instant';
  });
  const [thinkingEffort, setThinkingEffort] = useState<ThinkingEffort>(() => {
    return (localStorage.getItem('thinking_effort') as ThinkingEffort) || 'Standard';
  });
  const [showThinkingMenu, setShowThinkingMenu] = useState(false);

  useEffect(() => {
    localStorage.setItem('selected_ai_model', selectedModel);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ai_model_changed', { detail: { modelId: selectedModel } }));
    }
  }, [selectedModel]);

  useEffect(() => {
    localStorage.setItem('thinking_effort', thinkingEffort);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('thinking_effort_changed', { detail: { effort: thinkingEffort } }));
    }
  }, [thinkingEffort]);

  // Sync state if changed elsewhere
  useEffect(() => {
    const handleModelChange = (e: any) => {
      if (e.detail?.modelId && e.detail.modelId !== selectedModel) {
        setSelectedModel(e.detail.modelId);
      }
    };
    const handleEffortChange = (e: any) => {
      if (e.detail?.effort && e.detail.effort !== thinkingEffort) {
        setThinkingEffort(e.detail.effort);
      }
    };
    window.addEventListener('ai_model_changed', handleModelChange);
    window.addEventListener('thinking_effort_changed', handleEffortChange);
    return () => {
      window.removeEventListener('ai_model_changed', handleModelChange);
      window.removeEventListener('thinking_effort_changed', handleEffortChange);
    };
  }, [selectedModel, thinkingEffort]);

  const currentModelObj = MODELS.find((m) => m.id === selectedModel) || MODELS[2];

  const handleSelectModel = (id: AIModelId) => {
    setSelectedModel(id);
    const model = MODELS.find((m) => m.id === id);
    toast.success(`Switched to ${model?.name || id}`);
    setIsOpen(false);
  };

  const handleSelectEffort = (effort: ThinkingEffort) => {
    setThinkingEffort(effort);
    toast.success(`Thinking effort set to ${effort}`);
    setShowThinkingMenu(false);
  };

  // Determine alignment classes
  const getAlignClass = () => {
    if (align === 'center') return 'left-1/2 -translate-x-1/2';
    if (align === 'left') return 'left-0 right-auto';
    // 'right' or 'auto'
    return 'right-0 left-auto';
  };

  return (
    <div className={cn("relative inline-block text-left z-50", className)}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all cursor-pointer shadow-sm active:scale-98"
        title="Select AI Model"
      >
        {/* Model Icon */}
        {selectedModel === 'k3-swarm' ? (
          <DeepSearchIcon size={16} isAnimated={true} active={true} className="text-white shrink-0" />
        ) : (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="text-cyan-400 shrink-0">
            <path 
              d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
          </svg>
        )}

        <span className="text-xs font-semibold text-white/90 tracking-wide">
          {currentModelObj.name}
        </span>

        {showChevron && (
          <ChevronDown size={13} className={cn("text-white/50 transition-transform duration-200", isOpen && "rotate-180")} />
        )}
      </button>

      {/* Dropdown Menu matching Image 3 */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => {
                setIsOpen(false);
                setShowThinkingMenu(false);
              }} 
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -4 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              className={cn(
                "absolute top-full mt-2 z-50 w-[310px] max-w-[calc(100vw-24px)] bg-[#1a1a20] border border-white/12 rounded-[28px] p-3 shadow-2xl backdrop-blur-2xl text-left",
                getAlignClass()
              )}
            >
              {!showThinkingMenu ? (
                <div className="space-y-1">
                  {/* Model List */}
                  {MODELS.map((model) => {
                    const isSelected = selectedModel === model.id;
                    return (
                      <button
                        key={model.id}
                        onClick={() => handleSelectModel(model.id)}
                        className={cn(
                          "w-full text-left p-3 rounded-2xl transition-all cursor-pointer flex items-center justify-between group",
                          isSelected 
                            ? "bg-white/8 text-white" 
                            : "hover:bg-white/5 text-white/80"
                        )}
                      >
                        <div className="pr-2 flex-1 min-w-0">
                          <div className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                            {model.id === 'k3-swarm' && (
                              <DeepSearchIcon size={16} isAnimated={true} active={isSelected} className="text-white shrink-0" />
                            )}
                            <span>{model.name}</span>
                          </div>
                          <div className="text-xs text-white/45 leading-relaxed mt-0.5 font-normal">
                            {model.description}
                          </div>
                        </div>

                        {isSelected && (
                          <Check size={18} className="text-blue-500 shrink-0 ml-2" strokeWidth={2.2} />
                        )}
                      </button>
                    );
                  })}

                  {/* Divider */}
                  <div className="border-t border-white/10 my-2 mx-1" />

                  {/* Thinking Effort Option */}
                  <button
                    onClick={() => setShowThinkingMenu(true)}
                    className="w-full text-left p-3 rounded-2xl hover:bg-white/5 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">
                        Thinking effort
                      </div>
                      <div className="text-xs text-white/45 mt-0.5 font-normal">
                        {thinkingEffort}
                      </div>
                    </div>

                    <ChevronRight size={18} className="text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                  </button>
                </div>
              ) : (
                /* Sub-menu for Thinking Effort */
                <div className="space-y-1">
                  <div className="flex items-center justify-between px-2 py-1 mb-1 border-b border-white/10 pb-2">
                    <button
                      onClick={() => setShowThinkingMenu(false)}
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer"
                    >
                      ← Back
                    </button>
                    <span className="text-xs font-semibold text-white/60">Thinking Effort</span>
                  </div>

                  {THINKING_EFFORTS.map((effort) => {
                    const isSelected = thinkingEffort === effort;
                    return (
                      <button
                        key={effort}
                        onClick={() => handleSelectEffort(effort)}
                        className={cn(
                          "w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center justify-between",
                          isSelected ? "bg-white/10 text-white" : "hover:bg-white/5 text-white/70"
                        )}
                      >
                        <span>{effort}</span>
                        {isSelected && <Check size={16} className="text-blue-500" strokeWidth={2.2} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
