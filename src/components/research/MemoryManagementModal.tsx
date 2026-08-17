import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, X, Plus, Trash2, Database, ShieldCheck, Tag, Sparkles, RefreshCw } from 'lucide-react';
import { MemoryManager } from '@/lib/memory/MemoryManager';
import { ConversationSummarizer } from '@/lib/memory/ConversationSummarizer';
import { LongTermMemory, MemoryCategory, ConversationSummary } from '@/lib/memory/types';
import { toast } from 'sonner';

interface MemoryManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId?: string;
}

export const MemoryManagementModal: React.FC<MemoryManagementModalProps> = ({
  isOpen,
  onClose,
  conversationId,
}) => {
  const [memories, setMemories] = useState<LongTermMemory[]>([]);
  const [summary, setSummary] = useState<ConversationSummary | null>(null);
  const [newFact, setNewFact] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryCategory>('fact');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const loadData = () => {
    const all = MemoryManager.getAllMemories();
    setMemories(all);
    if (conversationId) {
      const sum = ConversationSummarizer.getSummary(conversationId);
      setSummary(sum);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, conversationId]);

  const handleAddFact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFact.trim()) return;

    MemoryManager.addMemory(newFact.trim(), newCategory, 4, conversationId);
    setNewFact('');
    toast.success('Memory saved');
    loadData();
  };

  const handleDeleteMemory = (id: string) => {
    MemoryManager.deleteMemory(id);
    toast.success('Memory deleted');
    loadData();
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear long-term memories?')) {
      MemoryManager.clearMemories();
      toast.success('All long-term memories cleared');
      loadData();
    }
  };

  const filteredMemories = memories.filter(m => {
    if (filterCategory === 'all') return true;
    return m.category === filterCategory;
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-[#121218] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl text-white"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Brain size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">AI Memory & Context Manager</h2>
                <p className="text-xs text-white/50">Manage long-term extracted facts, user preferences & chat summaries</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Conversation Summary Section */}
            {summary && summary.summaryText && (
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                  <Sparkles size={14} /> Current Chat Summary
                </div>
                <p className="text-xs text-white/80 leading-relaxed">{summary.summaryText}</p>
                {summary.userRequirements.length > 0 && (
                  <div className="pt-2 border-t border-white/5 text-[11px] text-white/60">
                    <strong>Key Requirements:</strong> {summary.userRequirements.join(', ')}
                  </div>
                )}
              </div>
            )}

            {/* Add Custom Memory Form */}
            <form onSubmit={handleAddFact} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Add new preference or fact (e.g. 'I prefer React and Tailwind')"
                value={newFact}
                onChange={e => setNewFact(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-cyan-500/50"
              />
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value as MemoryCategory)}
                className="bg-[#1a1a24] border border-white/10 rounded-xl px-3 py-2 text-xs text-white/80 focus:outline-none"
              >
                <option value="preference">Preference</option>
                <option value="fact">Fact</option>
                <option value="task">Task/Project</option>
                <option value="code">Code/Stack</option>
              </select>
              <button
                type="submit"
                className="flex items-center justify-center gap-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-4 py-2 rounded-xl text-xs transition-colors shrink-0 cursor-pointer"
              >
                <Plus size={14} /> Add Fact
              </button>
            </form>

            {/* Filter Tabs */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex gap-1.5 overflow-x-auto text-xs">
                {['all', 'preference', 'fact', 'task', 'code'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-3 py-1 rounded-full capitalize transition-colors ${
                      filterCategory === cat ? 'bg-white/20 text-white font-medium' : 'text-white/50 hover:text-white/80'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <button
                onClick={handleClearAll}
                className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
              >
                <Trash2 size={12} /> Clear All
              </button>
            </div>

            {/* Memory List */}
            <div className="space-y-2.5">
              {filteredMemories.length === 0 ? (
                <div className="text-center py-8 text-white/40 text-xs">
                  No long-term memories stored yet. Facts and preferences will be extracted automatically as you chat!
                </div>
              ) : (
                filteredMemories.map(mem => (
                  <div
                    key={mem.id}
                    className="flex items-start justify-between gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 text-[10px] uppercase font-semibold border border-cyan-500/20">
                          {mem.category}
                        </span>
                        <span className="text-[10px] text-white/40">
                          Importance: {'★'.repeat(mem.importance)}
                        </span>
                      </div>
                      <p className="text-white/90 font-medium">{mem.fact}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteMemory(mem.id)}
                      className="text-white/30 hover:text-rose-400 p-1 transition-colors shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-white/50 bg-white/2">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-400" /> Persistent & Private Local Memory
            </span>
            <span>Total Memories: {memories.length}</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
