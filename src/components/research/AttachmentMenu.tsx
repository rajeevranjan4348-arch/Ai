import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  Image as ImageIcon, 
  Upload, 
  MessageSquare, 
  Phone, 
  Box, 
  Plug, 
  Layers, 
  Globe, 
  ChevronRight, 
  X,
  Sparkles,
  Check,
  Grid,
  HardDrive,
  Video,
  Wrench,
  Mic
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { usePluginStore } from '@/lib/plugins/PluginStore';
import { PLUGINS, pluginManager } from '@/lib/plugins/PluginComposerSystem';

interface AttachmentMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFiles: (files: FileList | File[]) => void;
  onSelectPhrase?: (phrase: string) => void;
  webSearchMode: 'Auto' | 'Always' | 'Off';
  onToggleWebSearch: (mode: 'Auto' | 'Always' | 'Off') => void;
  onStartCall?: () => void;
  onOpenAppLauncher?: () => void;
  onSelectPlugin?: (pluginId: string) => void;
  onOpenMediaStore?: () => void;
}

const COMMON_PHRASES = [
  "Summarize the key points of this topic",
  "Write a clean, production-ready TypeScript code",
  "Explain this concept simply with examples",
  "Analyze and extract structured insights",
  "Draft a professional report summary",
  "Translate to English and refine grammar"
];

export const AttachmentMenu: React.FC<AttachmentMenuProps> = ({
  isOpen,
  onClose,
  onSelectFiles,
  onSelectPhrase,
  webSearchMode,
  onToggleWebSearch,
  onStartCall,
  onOpenAppLauncher,
  onSelectPlugin,
  onOpenMediaStore,
}) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const photosInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const shareReceiverInputRef = useRef<HTMLInputElement>(null);

  const [showPhrasesModal, setShowPhrasesModal] = useState(false);
  const [showPluginsModal, setShowPluginsModal] = useState(false);
  const [showSkillsModal, setShowSkillsModal] = useState(false);

  const { plugins, toggle: togglePlugin } = usePluginStore();

  const [skills, setSkills] = useState([
    { id: 'deepresearch', name: "Deep Research", desc: "Multi-step source retrieval and synthesis", enabled: true },
    { id: 'codesynthesis', name: "Code Synthesis", desc: "Generates full-stack modules and refactors", enabled: true },
    { id: 'dataviz', name: "Data Visualization", desc: "Creates interactive charts and tables", enabled: true },
  ]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onSelectFiles(e.target.files);
      toast.success(`Attached ${e.target.files.length} file(s)`);
      onClose();
    }
  };

  const cycleWebSearch = () => {
    const nextMode = webSearchMode === 'Auto' ? 'Always' : webSearchMode === 'Always' ? 'Off' : 'Auto';
    onToggleWebSearch(nextMode);
    toast.info(`Web search set to ${nextMode}`);
  };

  return (
    <>
      {/* Hidden File Inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={photosInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="*/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={shareReceiverInputRef}
        type="file"
        accept="*/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onSelectFiles(e.target.files);
            toast.success(`Received ${e.target.files.length} shared file(s) via AI Share Receiver`);
            onClose();
          }
        }}
      />

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 z-50 backdrop-blur-xs"
              onClick={onClose}
            />

            {/* Bottom Sheet Modal */}
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              className="fixed bottom-0 left-0 right-0 z-50 max-w-xl mx-auto bg-[#1a1a20] border-t border-white/12 rounded-t-[32px] p-5 shadow-2xl overflow-hidden text-left transform-gpu will-change-transform"
              onClick={e => e.stopPropagation()}
            >
              {/* Top Drag Indicator Handle */}
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />

              {/* Horizontal Scrollable Feature Cards */}
              <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-4 pt-1 px-1">
                {/* AI Voice Call Card (Matching Lime Reference) */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onStartCall) onStartCall();
                  }}
                  className="flex flex-col items-center justify-center gap-2.5 min-w-[108px] h-[98px] bg-[#CCFF00]/15 hover:bg-[#CCFF00]/25 active:scale-95 border border-[#CCFF00]/40 rounded-2xl transition-all cursor-pointer group shrink-0 shadow-lg shadow-[#CCFF00]/10"
                >
                  <div className="p-2 rounded-xl bg-[#CCFF00] text-black shadow-md transition-transform group-hover:scale-105">
                    <Mic size={22} strokeWidth={2.2} />
                  </div>
                  <span className="text-xs font-bold text-[#CCFF00] group-hover:text-white text-center leading-tight">Voice Call</span>
                </button>

                {/* Create Image Card */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onSelectPlugin) onSelectPlugin('image');
                  }}
                  className="flex flex-col items-center justify-center gap-2.5 min-w-[102px] h-[98px] bg-purple-500/10 hover:bg-purple-500/20 active:scale-95 border border-purple-500/30 rounded-2xl transition-all cursor-pointer group shrink-0"
                >
                  <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 transition-colors">
                    <Sparkles size={22} strokeWidth={1.8} />
                  </div>
                  <span className="text-xs font-semibold text-purple-300 group-hover:text-purple-200 text-center leading-tight">Create Image</span>
                </button>

                {/* Create Video Card */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onSelectPlugin) onSelectPlugin('video');
                  }}
                  className="flex flex-col items-center justify-center gap-2.5 min-w-[102px] h-[98px] bg-pink-500/10 hover:bg-pink-500/20 active:scale-95 border border-pink-500/30 rounded-2xl transition-all cursor-pointer group shrink-0"
                >
                  <div className="p-2 rounded-xl bg-pink-500/20 text-pink-300 transition-colors">
                    <Video size={22} strokeWidth={1.8} />
                  </div>
                  <span className="text-xs font-semibold text-pink-300 group-hover:text-pink-200 text-center leading-tight">Create Video</span>
                </button>

                {/* Camera Card */}
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2.5 min-w-[102px] h-[98px] bg-white/6 hover:bg-white/12 active:scale-95 border border-white/8 rounded-2xl transition-all cursor-pointer group shrink-0"
                >
                  <div className="p-2 rounded-xl bg-white/5 group-hover:bg-cyan-500/20 group-hover:text-cyan-300 text-white/80 transition-colors">
                    <Camera size={22} strokeWidth={1.8} />
                  </div>
                  <span className="text-xs font-semibold text-white/90 group-hover:text-white">Camera</span>
                </button>

                {/* Photos Card */}
                <button
                  type="button"
                  onClick={() => photosInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2.5 min-w-[102px] h-[98px] bg-white/6 hover:bg-white/12 active:scale-95 border border-white/8 rounded-2xl transition-all cursor-pointer group shrink-0"
                >
                  <div className="p-2 rounded-xl bg-white/5 group-hover:bg-cyan-500/20 group-hover:text-cyan-300 text-white/80 transition-colors">
                    <ImageIcon size={22} strokeWidth={1.8} />
                  </div>
                  <span className="text-xs font-semibold text-white/90 group-hover:text-white">Photos</span>
                </button>

                {/* Local file Card */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2.5 min-w-[102px] h-[98px] bg-white/6 hover:bg-white/12 active:scale-95 border border-white/8 rounded-2xl transition-all cursor-pointer group shrink-0"
                >
                  <div className="p-2 rounded-xl bg-white/5 group-hover:bg-cyan-500/20 group-hover:text-cyan-300 text-white/80 transition-colors">
                    <Upload size={22} strokeWidth={1.8} />
                  </div>
                  <span className="text-xs font-semibold text-white/90 group-hover:text-white">Local file</span>
                </button>
              </div>

              {/* Vertical Feature List */}
              <div className="mt-3 space-y-1 divide-y divide-white/6">
                {/* Voice Call Feature Item */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onStartCall) onStartCall();
                  }}
                  className="w-full text-left pt-3 pb-3 px-2 rounded-2xl hover:bg-[#CCFF00]/10 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="p-2 rounded-xl bg-[#CCFF00] text-black shadow-md shrink-0 mt-0.5">
                      <Mic size={18} strokeWidth={2.2} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white group-hover:text-[#CCFF00] transition-colors flex items-center gap-2">
                        <span>Voice Call</span>
                        <span className="text-[10px] font-semibold bg-[#CCFF00]/20 text-[#CCFF00] border border-[#CCFF00]/40 px-2 py-0.2 rounded-full">
                          AI Buddy
                        </span>
                      </div>
                      <div className="text-xs text-white/50 mt-0.5 font-normal leading-normal">
                        Speak naturally in real-time with continuous voice interaction
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-white/30 group-hover:text-[#CCFF00] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                </button>
                {/* Plugins */}
                <button
                  type="button"
                  onClick={() => setShowPluginsModal(true)}
                  className="w-full text-left pt-3.5 pb-3 px-2 rounded-2xl hover:bg-white/5 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="p-2 rounded-xl bg-white/5 text-white/60 group-hover:text-cyan-400 transition-colors shrink-0 mt-0.5">
                      <Plug size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">
                        Plugins
                      </div>
                      <div className="text-xs text-white/40 mt-0.5 font-normal leading-normal">
                        Connect apps and databases to automate actions for you
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-white/30 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                </button>

                {/* Skills */}
                <button
                  type="button"
                  onClick={() => setShowSkillsModal(true)}
                  className="w-full text-left pt-3.5 pb-3 px-2 rounded-2xl hover:bg-white/5 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="p-2 rounded-xl bg-white/5 text-white/60 group-hover:text-cyan-400 transition-colors shrink-0 mt-0.5">
                      <Layers size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">
                        Skills
                      </div>
                      <div className="text-xs text-white/40 mt-0.5 font-normal leading-normal">
                        Reuse specialized skills to handle specific tasks reliably
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-white/30 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                </button>

                {/* Web search */}
                <button
                  type="button"
                  onClick={cycleWebSearch}
                  className="w-full text-left pt-3.5 pb-2 px-2 rounded-2xl hover:bg-white/5 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-2 rounded-xl bg-white/5 text-white/60 group-hover:text-cyan-400 transition-colors shrink-0">
                      <Globe size={18} />
                    </div>
                    <div className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">
                      Web search
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-white/50 group-hover:text-white transition-colors">
                    <span>{webSearchMode}</span>
                    <ChevronRight size={16} />
                  </div>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Common Phrases Modal */}
      <AnimatePresence>
        {showPhrasesModal && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1c1c21] border border-white/12 rounded-3xl p-5 max-w-md w-full shadow-2xl text-left"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                <div className="flex items-center gap-2">
                  <Box size={18} className="text-amber-400" />
                  <h3 className="text-sm font-semibold text-white">Common Phrases</h3>
                </div>
                <button onClick={() => setShowPhrasesModal(false)} className="text-white/40 hover:text-white">
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto no-scrollbar">
                {COMMON_PHRASES.map((phrase, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (onSelectPhrase) onSelectPhrase(phrase);
                      setShowPhrasesModal(false);
                      onClose();
                      toast.success("Phrase inserted");
                    }}
                    className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-white/80 hover:text-white transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <span>{phrase}</span>
                    <Sparkles size={14} className="text-white/30 group-hover:text-amber-400 shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Plugins Modal */}
      <AnimatePresence>
        {showPluginsModal && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1c1c21] border border-white/12 rounded-3xl p-5 max-w-md w-full shadow-2xl text-left"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                <div className="flex items-center gap-2">
                  <Plug size={18} className="text-cyan-400" />
                  <h3 className="text-sm font-semibold text-white">Active Plugins</h3>
                </div>
                <button onClick={() => setShowPluginsModal(false)} className="text-white/40 hover:text-white">
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                {PLUGINS.map((plugin) => (
                  <button
                    key={plugin.id}
                    onClick={() => {
                      if (onSelectPlugin) {
                        onSelectPlugin(plugin.id);
                        toast.success(`Selected plugin: ${plugin.name}`);
                      } else {
                        togglePlugin(plugin.id);
                        toast.info(`${plugin.name} active`);
                      }
                      setShowPluginsModal(false);
                      onClose();
                    }}
                    className="w-full p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-between cursor-pointer text-left border border-white/5 group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{plugin.icon}</span>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>{plugin.name}</span>
                          <span className="px-1.5 py-0.2 rounded-md bg-cyan-500/20 text-cyan-300 text-[9px] font-semibold uppercase">
                            Tool Plugin
                          </span>
                        </div>
                        <div className="text-[11px] text-white/50">{plugin.description}</div>
                      </div>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <ChevronRight size={14} />
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Skills Modal */}
      <AnimatePresence>
        {showSkillsModal && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1c1c21] border border-white/12 rounded-3xl p-5 max-w-md w-full shadow-2xl text-left"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                <div className="flex items-center gap-2">
                  <Layers size={18} className="text-cyan-400" />
                  <h3 className="text-sm font-semibold text-white">Agent Skills</h3>
                </div>
                <button onClick={() => setShowSkillsModal(false)} className="text-white/40 hover:text-white">
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-2">
                {skills.map((skill) => (
                  <button
                    key={skill.id}
                    onClick={() => {
                      setSkills(prev =>
                        prev.map(s => s.id === skill.id ? { ...s, enabled: !s.enabled } : s)
                      );
                      toast.info(`${skill.name} ${!skill.enabled ? 'activated' : 'deactivated'}`);
                    }}
                    className="w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-between cursor-pointer text-left"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white">{skill.name}</div>
                      <div className="text-[11px] text-white/40">{skill.desc}</div>
                    </div>
                    <div className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center transition-colors",
                      skill.enabled ? "bg-cyan-500/20 text-cyan-400" : "bg-white/10 text-white/20"
                    )}>
                      <Check size={12} />
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
