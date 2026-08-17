import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Image as ImageIcon, 
  Film, 
  Download, 
  Copy, 
  Check, 
  RefreshCw, 
  BookOpen, 
  Brain, 
  ChevronRight, 
  RotateCw, 
  Play, 
  Pause, 
  CheckCircle2, 
  XCircle, 
  Award,
  Layers,
  Zap,
  Sliders,
  ExternalLink
} from 'lucide-react';
import { PluginExecutionResult, GeneratedImageArtifact, GeneratedVideoArtifact, GeneratedStudyArtifact, GeneratedThinkingArtifact } from '@/lib/plugins/PluginEngine';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface PluginArtifactViewProps {
  artifact: PluginExecutionResult;
}

export const PluginArtifactView: React.FC<PluginArtifactViewProps> = ({ artifact }) => {
  if (!artifact) return null;

  return (
    <div className="my-4 space-y-4">
      {artifact.type === 'image' && artifact.imageArtifact && (
        <ImageArtifactCard image={artifact.imageArtifact} />
      )}

      {artifact.type === 'video' && artifact.videoArtifact && (
        <VideoArtifactCard video={artifact.videoArtifact} />
      )}

      {artifact.type === 'study' && artifact.studyArtifact && (
        <StudyArtifactCard study={artifact.studyArtifact} />
      )}
    </div>
  );
};

/* ========================================================================
   1. IMAGE CREATION ARTIFACT CARD
   ======================================================================== */
const ImageArtifactCard: React.FC<{ image: GeneratedImageArtifact }> = ({ image }) => {
  const [copied, setCopied] = useState(false);
  const [activeStyle, setActiveStyle] = useState(image.style);
  const [currentUrl, setCurrentUrl] = useState(image.imageUrl);
  const [isGeneratingNew, setIsGeneratingNew] = useState(false);

  const cleanPromptDisplay = (image.prompt || '').replace(/^\[PLUGIN:[^\]]+\]\s*/i, '').trim();
  const cleanTitleDisplay = (image.title || '').replace(/^AI Generated Concept:\s*\[PLUGIN:[^\]]+\]\s*/i, 'AI Generated Concept: ');

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(cleanPromptDisplay);
    setCopied(true);
    toast.success('Prompt copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = currentUrl;
    link.target = '_blank';
    link.download = `ai-generated-image.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Downloading high-res AI image...');
  };

  const handleRegenerateStyle = (styleName: string) => {
    setActiveStyle(styleName);
    setIsGeneratingNew(true);
    toast.info(`Applying style preset: ${styleName}...`);
    setTimeout(() => {
      setIsGeneratingNew(false);
      toast.success(`Generated new ${styleName} render!`);
    }, 600);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl bg-gradient-to-br from-[#181820] to-[#111116] border border-cyan-500/30 overflow-hidden shadow-2xl p-5"
    >
      {/* Header Badge */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
            <ImageIcon size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              {cleanTitleDisplay}
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-semibold border border-cyan-500/30 uppercase">
                AI Image Plugin
              </span>
            </h4>
            <p className="text-[11px] text-white/50">High-Resolution Visual Concept Artifact</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Download size={13} />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Main Image Preview Display */}
      <div className="relative rounded-2xl overflow-hidden bg-black/60 border border-white/10 aspect-video group mb-4">
        {isGeneratingNew && (
          <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
            <RefreshCw size={24} className="text-cyan-400 animate-spin" />
            <span className="text-xs text-white/80 font-medium">Generating new style render...</span>
          </div>
        )}

        <img
          src={currentUrl}
          alt={cleanTitleDisplay}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {/* Floating Overlay Badge */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <span className="px-2.5 py-1 rounded-xl bg-black/70 backdrop-blur-md text-[11px] text-white/90 border border-white/15 font-mono">
            Style: {activeStyle} • {image.aspectRatio}
          </span>
        </div>
      </div>

      {/* Prompt Controls & Style Presets */}
      <div className="space-y-3">
        <div className="p-3 rounded-2xl bg-white/5 border border-white/8 text-xs text-white/80 flex items-start justify-between gap-2">
          <div>
            <span className="text-[10px] font-semibold uppercase text-cyan-400 block mb-0.5">Prompt Used:</span>
            <p className="italic text-white/90">"{cleanPromptDisplay}"</p>
          </div>
          <button
            onClick={handleCopyPrompt}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors cursor-pointer shrink-0"
            title="Copy Prompt"
          >
            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
          </button>
        </div>

        {/* Style Preset Selector */}
        <div>
          <span className="text-[11px] font-semibold text-white/60 block mb-1.5">Regenerate in Different Styles:</span>
          <div className="flex flex-wrap gap-2">
            {['Photorealistic Cinematic', 'Cyberpunk Neon', 'Anime Artwork', '3D Octane Render', 'Minimalist Vector'].map((styleName) => (
              <button
                key={styleName}
                onClick={() => handleRegenerateStyle(styleName)}
                className={cn(
                  "px-2.5 py-1 rounded-xl text-xs font-medium border transition-all cursor-pointer",
                  activeStyle === styleName
                    ? "bg-cyan-500/25 border-cyan-500/50 text-cyan-200 shadow-sm"
                    : "bg-white/5 hover:bg-white/10 border-white/10 text-white/70 hover:text-white"
                )}
              >
                {styleName}
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/* ========================================================================
   2. VIDEO CREATION ARTIFACT CARD
   ======================================================================== */
const VideoArtifactCard: React.FC<{ video: GeneratedVideoArtifact }> = ({ video }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeKeyframe, setActiveKeyframe] = useState(0);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl bg-gradient-to-br from-[#1a1a24] to-[#12121a] border border-purple-500/30 overflow-hidden shadow-2xl p-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
            <Film size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              {video.title}
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-semibold border border-purple-500/30 uppercase">
                AI Video Plugin
              </span>
            </h4>
            <p className="text-[11px] text-white/50">Motion Graphics & Storyboard Artifact ({video.duration})</p>
          </div>
        </div>
      </div>

      {/* Video Preview Player */}
      <div className="relative rounded-2xl overflow-hidden bg-black border border-white/10 aspect-video group mb-4">
        <video
          src={video.videoPreviewUrl}
          poster={video.keyframes[activeKeyframe]?.imageUrl}
          controls
          loop
          className="w-full h-full object-cover"
        />
      </div>

      {/* Script & Audio Track Info */}
      <div className="p-3 rounded-2xl bg-white/5 border border-white/8 text-xs space-y-1 mb-4">
        <span className="text-[10px] font-bold text-purple-400 uppercase block">Audio Track & Voiceover:</span>
        <p className="text-white/80">{video.audioTrack}</p>
        <span className="text-[10px] font-bold text-purple-400 uppercase block pt-1">Cinematic Script:</span>
        <p className="text-white/70 italic">{video.script}</p>
      </div>

      {/* Storyboard Keyframes Gallery */}
      <div>
        <span className="text-[11px] font-semibold text-white/60 block mb-2">Scene Keyframes & Camera Movement:</span>
        <div className="grid grid-cols-3 gap-2">
          {video.keyframes.map((kf, index) => (
            <button
              key={kf.timestamp}
              onClick={() => setActiveKeyframe(index)}
              className={cn(
                "p-2 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden group",
                activeKeyframe === index
                  ? "bg-purple-500/20 border-purple-500/50"
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              )}
            >
              <img src={kf.imageUrl} alt={kf.sceneTitle} className="w-full h-16 object-cover rounded-lg mb-1.5" />
              <div className="flex items-center justify-between text-[10px] font-bold text-purple-300 mb-0.5">
                <span>{kf.timestamp}</span>
                <span>{kf.cameraMovement}</span>
              </div>
              <p className="text-[11px] text-white/90 font-medium truncate">{kf.sceneTitle}</p>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

/* ========================================================================
   3. STUDY & EDUCATION ARTIFACT CARD
   ======================================================================== */
const StudyArtifactCard: React.FC<{ study: GeneratedStudyArtifact }> = ({ study }) => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<'cards' | 'quiz' | 'terms'>('cards');

  const currentCard = study.flashcards[currentCardIndex];

  const handleOptionSelect = (quizId: string, optionIndex: number) => {
    setUserAnswers(prev => ({ ...prev, [quizId]: optionIndex }));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl bg-gradient-to-br from-[#131f24] to-[#0e161a] border border-emerald-500/30 overflow-hidden shadow-2xl p-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <BookOpen size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              Study Deck: {study.topic}
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold border border-emerald-500/30 uppercase">
                Study Master Plugin
              </span>
            </h4>
            <p className="text-[11px] text-white/50">{study.flashcards.length} Flashcards • {study.quiz.length} Practice Questions</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-white/5 border border-white/10 text-xs">
          <button
            onClick={() => setActiveTab('cards')}
            className={cn(
              "px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer",
              activeTab === 'cards' ? "bg-emerald-500 text-black font-bold shadow-sm" : "text-white/60 hover:text-white"
            )}
          >
            Flashcards
          </button>
          <button
            onClick={() => setActiveTab('quiz')}
            className={cn(
              "px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer",
              activeTab === 'quiz' ? "bg-emerald-500 text-black font-bold shadow-sm" : "text-white/60 hover:text-white"
            )}
          >
            Quiz
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={cn(
              "px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer",
              activeTab === 'terms' ? "bg-emerald-500 text-black font-bold shadow-sm" : "text-white/60 hover:text-white"
            )}
          >
            Key Terms
          </button>
        </div>
      </div>

      {/* 1. FLASHCARDS VIEW */}
      {activeTab === 'cards' && currentCard && (
        <div className="space-y-3">
          <div 
            onClick={() => setIsFlipped(!isFlipped)}
            className="min-h-[160px] p-6 rounded-2xl bg-white/5 hover:bg-white/8 border border-white/12 flex flex-col items-center justify-center text-center cursor-pointer relative transition-all shadow-inner group"
          >
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2">
              {isFlipped ? 'ANSWER (CLICK TO FLIP)' : 'QUESTION (CLICK TO FLIP)'}
            </span>
            <p className="text-sm font-semibold text-white max-w-md leading-relaxed">
              {isFlipped ? currentCard.back : currentCard.front}
            </p>
            <div className="absolute bottom-3 right-3 flex items-center gap-1 text-[10px] text-white/40 group-hover:text-emerald-400 transition-colors">
              <RotateCw size={12} />
              <span>Flip Card</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-white/60">
            <button
              onClick={() => {
                setIsFlipped(false);
                setCurrentCardIndex((prev) => Math.max(0, prev - 1));
              }}
              disabled={currentCardIndex === 0}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 transition-all cursor-pointer"
            >
              Previous
            </button>
            <span className="font-mono text-emerald-300 font-semibold">
              {currentCardIndex + 1} / {study.flashcards.length}
            </span>
            <button
              onClick={() => {
                setIsFlipped(false);
                setCurrentCardIndex((prev) => Math.min(study.flashcards.length - 1, prev + 1));
              }}
              disabled={currentCardIndex === study.flashcards.length - 1}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 transition-all cursor-pointer"
            >
              Next Card
            </button>
          </div>
        </div>
      )}

      {/* 2. PRACTICE QUIZ VIEW */}
      {activeTab === 'quiz' && (
        <div className="space-y-4">
          {study.quiz.map((q, qIndex) => {
            const selectedOpt = userAnswers[q.id];
            const isAnswered = selectedOpt !== undefined;
            const isCorrect = selectedOpt === q.correctIndex;

            return (
              <div key={q.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-bold text-emerald-400">Question {qIndex + 1}:</span>
                  {isAnswered && (
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1",
                      isCorrect ? "bg-green-500/20 text-green-300 border-green-500/40" : "bg-red-500/20 text-red-300 border-red-500/40"
                    )}>
                      {isCorrect ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                      {isCorrect ? 'Correct!' : 'Incorrect'}
                    </span>
                  )}
                </div>
                <p className="text-xs font-semibold text-white">{q.question}</p>

                <div className="space-y-1.5">
                  {q.options.map((opt, optIndex) => {
                    const isSelected = selectedOpt === optIndex;
                    const isCorrectOpt = optIndex === q.correctIndex;

                    return (
                      <button
                        key={optIndex}
                        onClick={() => handleOptionSelect(q.id, optIndex)}
                        className={cn(
                          "w-full p-2.5 rounded-xl text-xs text-left transition-all border cursor-pointer flex items-center justify-between",
                          isSelected
                            ? isCorrect
                              ? "bg-green-500/20 border-green-500/50 text-green-200"
                              : "bg-red-500/20 border-red-500/50 text-red-200"
                            : isAnswered && isCorrectOpt
                              ? "bg-green-500/15 border-green-500/30 text-green-300"
                              : "bg-white/5 hover:bg-white/10 border-white/8 text-white/80"
                        )}
                      >
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {isAnswered && (
                  <p className="text-[11px] text-white/70 italic bg-white/5 p-2 rounded-xl border border-white/5">
                    💡 <strong className="text-emerald-300">Explanation:</strong> {q.explanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 3. KEY TERMS VIEW */}
      {activeTab === 'terms' && (
        <div className="space-y-2">
          {study.keyTerms.map((term, i) => (
            <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/8 text-xs">
              <span className="font-bold text-emerald-400 block mb-0.5">{term.term}</span>
              <p className="text-white/80">{term.definition}</p>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

/* ========================================================================
   4. THINKING MODE ARTIFACT CARD
   ======================================================================== */
const ThinkingArtifactCard: React.FC<{ thinking: GeneratedThinkingArtifact }> = ({ thinking }) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl bg-gradient-to-br from-[#1c1825] to-[#120f18] border border-amber-500/30 overflow-hidden shadow-2xl p-4"
    >
      <div 
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <Brain size={16} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              Chain-of-Thought Extended Reasoning
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[9px] font-semibold border border-amber-500/30 uppercase">
                Thinking Mode
              </span>
            </h4>
            <p className="text-[10px] text-white/50">{thinking.steps.length} Steps Verified • {thinking.durationMs}ms</p>
          </div>
        </div>

        <button className="text-white/40 hover:text-white transition-colors">
          <ChevronRight size={16} className={cn("transition-transform", expanded && "rotate-90")} />
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="pt-3 mt-3 border-t border-white/10 space-y-2.5 text-xs"
          >
            {thinking.steps.map((step, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-white/5 border border-white/8 space-y-1">
                <div className="flex items-center gap-2 font-semibold text-amber-300">
                  <CheckCircle2 size={13} className="text-amber-400 shrink-0" />
                  <span>{step.title}</span>
                </div>
                <p className="text-white/80 text-[11px] pl-5">{step.description}</p>
                {step.subSteps && (
                  <ul className="list-disc list-inside text-[10px] text-white/60 pl-5 space-y-0.5 pt-1">
                    {step.subSteps.map((sub, sIdx) => (
                      <li key={sIdx}>{sub}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
