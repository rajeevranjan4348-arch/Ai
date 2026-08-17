import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Smartphone, 
  Play, 
  RotateCcw, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Terminal, 
  Code2, 
  Copy, 
  Check, 
  Mic, 
  MicOff, 
  Search, 
  Layers, 
  Activity, 
  FileText, 
  Zap, 
  Wifi, 
  ArrowLeft, 
  Home, 
  Square, 
  ChevronRight,
  ExternalLink,
  Shield,
  Eye,
  Lock,
  Loader2,
  ShieldAlert
} from 'lucide-react';
import { 
  PhoneControlAgent, 
  LogEntry, 
  ScreenSnapshot, 
  SIMULATED_SCREENS,
  ActionRequest 
} from '@/lib/agent/phoneControlEngine';
import { KOTLIN_SOURCE_FILES, KotlinFile } from '@/lib/agent/kotlinSourceCode';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { VoiceInput } from '@/components/ui/VoiceInput';

interface PhoneControlAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCommand?: string;
}

export const PhoneControlAgentModal: React.FC<PhoneControlAgentModalProps> = ({
  isOpen,
  onClose,
  initialCommand = 'Open YouTube and search Minecraft'
}) => {
  const [activeTab, setActiveTab] = useState<'simulator' | 'code' | 'architecture'>('simulator');
  const [commandText, setCommandText] = useState(initialCommand);
  const [isRunning, setIsRunning] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [waitingReason, setWaitingReason] = useState<string>('');
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    action: ActionRequest;
    reason: string;
    resolve: (approved: boolean) => void;
  } | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [currentScreen, setCurrentScreen] = useState<ScreenSnapshot>(SIMULATED_SCREENS.home);
  const [highlightedElementId, setHighlightedElementId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [activeCodeFile, setActiveCodeFile] = useState<KotlinFile>(KOTLIN_SOURCE_FILES[0]);
  const [copiedCode, setCopiedCode] = useState(false);
  const [accessibilityEnabled, setAccessibilityEnabled] = useState(true);

  const agentRef = useRef<PhoneControlAgent>(new PhoneControlAgent());
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Sync log scroll
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Update current screen snapshot periodically during execution
  useEffect(() => {
    const interval = setInterval(() => {
      const liveScreen = agentRef.current.getScreenReader().getCurrentScreen();
      setCurrentScreen(liveScreen);
    }, 150);
    return () => clearInterval(interval);
  }, []);

  const handleRunAgentCommand = async (reqToRun?: string) => {
    const query = reqToRun || commandText;
    if (!query.trim()) {
      toast.error('Please enter a phone control command.');
      return;
    }

    if (!accessibilityEnabled) {
      toast.error('Accessibility Service is disabled. Please enable it in Settings.');
      return;
    }

    setIsRunning(true);
    setIsWaiting(false);
    setWaitingReason('');
    setLogs([]);
    setPendingConfirmation(null);
    
    // Announce start
    toast.info('Agent Loop Initiated', {
      description: `Target Goal: "${query}"`
    });

    try {
      const result = await agentRef.current.runLoop(
        query, 
        (entry) => {
          setLogs(prev => [...prev, entry]);
          
          // Highlight element if action clicked or searched
          if (entry.payload && entry.payload.type === 'click_text' && entry.payload.text) {
            const match = currentScreen.elements.find(el => 
              el.text && el.text.toLowerCase().includes(entry.payload.text.toLowerCase())
            );
            if (match) {
              setHighlightedElementId(match.id);
              setTimeout(() => setHighlightedElementId(null), 1200);
            }
          }
        },
        // onRequireConfirmation callback
        (action, reason) => {
          return new Promise<boolean>((resolve) => {
            setPendingConfirmation({
              action,
              reason,
              resolve: (approved: boolean) => {
                setPendingConfirmation(null);
                resolve(approved);
              }
            });
          });
        },
        // onWaitingChange callback
        (waiting, reason) => {
          setIsWaiting(waiting);
          setWaitingReason(reason || '');
        }
      );

      if (result.type === 'success') {
        toast.success('Task Executed Successfully!', {
          description: result.message
        });
      } else {
        toast.error('Task Stopped', {
          description: result.message
        });
      }
    } catch (err: any) {
      toast.error('Execution Error', { description: err?.message || 'Unknown error occurred' });
    } finally {
      setIsRunning(false);
      setIsWaiting(false);
      setWaitingReason('');
      setPendingConfirmation(null);
    }
  };

  const handleVoiceInput = () => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      try {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
          toast.info('Listening for phone control command...');
        };

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setCommandText(transcript);
          toast.success(`Voice Recognized: "${transcript}"`);
          handleRunAgentCommand(transcript);
        };

        recognition.onerror = (event: any) => {
          setIsListening(false);
          toast.error(`Voice input error: ${event.error}`);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.start();
      } catch (e) {
        toast.error('Speech recognition failed to initialize');
      }
    } else {
      toast.error('Web Speech Recognition API is not supported in this browser.');
    }
  };

  const handleResetPhone = () => {
    agentRef.current.getScreenReader().setScreen('home');
    setCurrentScreen(SIMULATED_SCREENS.home);
    setLogs([]);
    toast.info('Phone state reset to Android Home');
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeCodeFile.code);
    setCopiedCode(true);
    toast.success(`Copied ${activeCodeFile.filename} to clipboard!`);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xl animate-fade-in">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-6xl h-[92vh] max-h-[900px] bg-[#0c0c12] border border-cyan-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-white"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400">
                <Smartphone size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold tracking-tight text-white">Gemini Phone Control Agent</h2>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                    Android Spec
                  </span>
                </div>
                <p className="text-xs text-white/60">
                  Autonomous Android AccessibilityService gesture planner & screen execution loop
                </p>
              </div>
            </div>

            {/* Controls & Tab Buttons */}
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => setActiveTab('simulator')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",
                    activeTab === 'simulator' ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "text-white/60 hover:text-white"
                  )}
                >
                  <Terminal size={14} />
                  <span>Agent Simulator</span>
                </button>
                <button
                  onClick={() => setActiveTab('code')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",
                    activeTab === 'code' ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "text-white/60 hover:text-white"
                  )}
                >
                  <Code2 size={14} />
                  <span>Kotlin Code ({KOTLIN_SOURCE_FILES.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab('architecture')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",
                    activeTab === 'architecture' ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "text-white/60 hover:text-white"
                  )}
                >
                  <Layers size={14} />
                  <span>Architecture</span>
                </button>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Subheader Accessibility Service Switch & Safety Status */}
          <div className="px-6 py-2.5 bg-[#08080e] border-b border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={accessibilityEnabled}
                  onChange={(e) => {
                    setAccessibilityEnabled(e.target.checked);
                    if (e.target.checked) toast.success('AIAccessibilityService bound and connected');
                    else toast.warning('AIAccessibilityService unbind requested');
                  }}
                  className="rounded accent-cyan-400 w-4 h-4 cursor-pointer"
                />
                <span className="font-mono font-medium text-white/90">
                  Accessibility Service: <span className={accessibilityEnabled ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                    {accessibilityEnabled ? 'ACTIVE (BIND_ACCESSIBILITY_SERVICE)' : 'DISABLED'}
                  </span>
                </span>
              </label>

              <div className="hidden sm:flex items-center gap-1.5 text-white/50 border-l border-white/10 pl-4">
                <ShieldCheck size={14} className="text-cyan-400" />
                <span>Action Validator Whitelist Guard: <strong className="text-cyan-300">STRICT</strong></span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-white/40">Active App:</span>
              <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-cyan-300 text-[11px]">
                {currentScreen.packageName}
              </span>
            </div>
          </div>

          {/* TAB 1: SIMULATOR & AGENT CONSOLE */}
          {activeTab === 'simulator' && (
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
              
              {/* Left Column: Simulated Android Phone Frame (5 Cols) */}
              <div className="lg:col-span-5 border-r border-white/10 p-5 bg-[#07070b] flex flex-col items-center justify-between overflow-y-auto">
                <div className="w-full flex items-center justify-between mb-3 text-xs">
                  <span className="font-bold uppercase tracking-wider text-white/50 text-[10px]">Simulated Device Display</span>
                  <button
                    onClick={handleResetPhone}
                    className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    <RotateCcw size={12} />
                    <span>Reset Home</span>
                  </button>
                </div>

                {/* Smartphone Device Frame */}
                <div className="relative w-full max-w-[280px] h-[520px] bg-[#101018] border-[6px] border-[#222230] rounded-[36px] shadow-2xl flex flex-col overflow-hidden text-white my-auto">
                  
                  {/* Phone Status Bar */}
                  <div className="h-7 bg-black/60 px-4 flex items-center justify-between text-[10px] font-mono text-white/70 select-none shrink-0 border-b border-white/5">
                    <span>9:41</span>
                    <div className="w-12 h-3 bg-black rounded-full mx-auto" /> {/* Dynamic Island / Notch */}
                    <div className="flex items-center gap-1.5">
                      <Wifi size={10} className="text-cyan-400" />
                      <span>100%</span>
                    </div>
                  </div>

                  {/* App Screen Header Title */}
                  <div className="px-3 py-2 bg-white/5 border-b border-white/10 flex items-center justify-between shrink-0">
                    <span className="text-xs font-bold truncate text-cyan-300">{currentScreen.title}</span>
                    <span className="text-[9px] font-mono text-white/40">{currentScreen.screenId}</span>
                  </div>

                  {/* Dynamic Screen Content Canvas */}
                  <div className="flex-1 p-3 overflow-y-auto space-y-2 relative bg-[#09090f]">
                    {/* Visual Waiting Indicator during delay / transition phases */}
                    <AnimatePresence>
                      {isWaiting && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          className="sticky top-0 z-30 px-2.5 py-1.5 rounded-xl bg-cyan-950/90 border border-cyan-500/50 text-cyan-200 text-[10px] font-mono flex items-center justify-between shadow-lg backdrop-blur-md mb-2"
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <Loader2 size={12} className="animate-spin text-cyan-400 shrink-0" />
                            <span className="truncate">{waitingReason || 'Pausing for transition...'}</span>
                          </div>
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0 ml-1" />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {currentScreen.elements.map((el) => {
                      const isHighlighted = highlightedElementId === el.id;
                      return (
                        <div
                          key={el.id}
                          className={cn(
                            "p-2.5 rounded-xl border text-xs transition-all relative",
                            isHighlighted
                              ? "bg-cyan-500/30 border-cyan-400 scale-102 shadow-lg shadow-cyan-500/20"
                              : el.clickable
                              ? "bg-white/5 border-white/10 hover:border-cyan-500/40 cursor-pointer"
                              : "bg-white/[0.02] border-transparent text-white/50"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-white truncate">{el.text || el.description}</span>
                            {el.clickable && (
                              <span className="text-[8px] font-mono px-1 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                Clickable
                              </span>
                            )}
                            {el.editable && (
                              <span className="text-[8px] font-mono px-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                Editable
                              </span>
                            )}
                          </div>

                          {el.description && el.text !== el.description && (
                            <p className="text-[10px] text-white/50 mt-0.5 truncate">{el.description}</p>
                          )}

                          {isHighlighted && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-ping"
                            />
                          )}
                        </div>
                      );
                    })}

                    {currentScreen.elements.length === 0 && (
                      <div className="h-full flex items-center justify-center text-center p-4 text-white/40 text-xs">
                        Screen empty or scanning AccessibilityNodeInfo...
                      </div>
                    )}
                  </div>

                  {/* Android Bottom Navigation Bar */}
                  <div className="h-10 bg-black/80 px-8 flex items-center justify-around border-t border-white/10 shrink-0">
                    <button
                      onClick={() => {
                        agentRef.current.getScreenReader().setScreen('home');
                        setCurrentScreen(SIMULATED_SCREENS.home);
                      }}
                      className="text-white/60 hover:text-cyan-400 transition-colors p-1"
                      title="Back Action"
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <button
                      onClick={() => {
                        agentRef.current.getScreenReader().setScreen('home');
                        setCurrentScreen(SIMULATED_SCREENS.home);
                      }}
                      className="text-white/60 hover:text-cyan-400 transition-colors p-1"
                      title="Home Action"
                    >
                      <Home size={16} />
                    </button>
                    <button
                      onClick={() => {
                        agentRef.current.getScreenReader().setScreen('recents');
                        setCurrentScreen(SIMULATED_SCREENS.recents);
                      }}
                      className="text-white/60 hover:text-cyan-400 transition-colors p-1"
                      title="Recents Action"
                    >
                      <Square size={14} />
                    </button>
                  </div>
                </div>

                {/* Preset Fast Sample Commands */}
                <div className="w-full mt-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1.5 block">
                    Preset Agent Commands
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Open YouTube and search Minecraft',
                      'Open Settings and open Wi-Fi',
                      'Clear all recent apps',
                      'Delete message',
                      'Send message to Alex',
                      'Go Home'
                    ].map((cmd) => (
                      <button
                        key={cmd}
                        onClick={() => {
                          setCommandText(cmd);
                          handleRunAgentCommand(cmd);
                        }}
                        className={cn(
                          "px-2.5 py-1 rounded-lg border text-[11px] transition-all cursor-pointer truncate max-w-full flex items-center gap-1",
                          (cmd.includes('Clear') || cmd.includes('Delete') || cmd.includes('Send'))
                            ? "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-200 hover:text-amber-100"
                            : "bg-white/5 hover:bg-cyan-500/15 border-white/10 hover:border-cyan-500/30 text-white/80 hover:text-cyan-300"
                        )}
                      >
                        <span>{(cmd.includes('Clear') || cmd.includes('Delete') || cmd.includes('Send')) ? '⚠️' : '⚡'}</span>
                        <span>{cmd}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Execution Trace Console & Command Runner (7 Cols) */}
              <div className="lg:col-span-7 flex flex-col p-5 bg-[#0a0a10] overflow-hidden">
                
                {/* Agent Control Input Form */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Zap size={14} className="text-cyan-400" />
                      <span>Natural Language Voice/Text Command</span>
                    </label>
                    <span className="text-[10px] font-mono text-white/40">AI Planner → Action JSON</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={commandText}
                        onChange={(e) => setCommandText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !isRunning && handleRunAgentCommand()}
                        placeholder="e.g. Open YouTube and search Minecraft..."
                        className="w-full bg-[#12121c] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/40 outline-none focus:border-cyan-500 transition-all"
                      />
                    </div>

                    {/* Microphone Voice Input */}
                    <VoiceInput
                      value={commandText}
                      onTranscriptChange={(text) => setCommandText(text)}
                      onSearchSubmit={(text) => handleRunAgentCommand(text)}
                      autoSubmit={true}
                      buttonSize="md"
                    />

                    {/* Run Execution Button */}
                    <button
                      onClick={() => handleRunAgentCommand()}
                      disabled={isRunning}
                      className={cn(
                        "px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-lg shadow-cyan-500/25",
                        isRunning && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {isRunning ? (
                        <>
                          <Activity size={15} className="animate-spin" />
                          <span>Executing Loop...</span>
                        </>
                      ) : (
                        <>
                          <Play size={15} className="fill-current" />
                          <span>Run Agent</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Real-time Execution Logs Console */}
                <div className="flex-1 flex flex-col bg-[#050508] border border-white/10 rounded-2xl p-4 overflow-hidden">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-xs">
                    <div className="flex items-center gap-2">
                      <Terminal size={15} className="text-cyan-400" />
                      <span className="font-bold text-white">Agent Loop Audit Trace</span>
                      <span className="text-[10px] font-mono text-white/40">({logs.length} entries)</span>
                      {isWaiting && (
                        <span className="ml-2 px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono flex items-center gap-1.5 animate-pulse">
                          <Loader2 size={11} className="animate-spin text-cyan-400" />
                          <span>{waitingReason || 'Waiting...'}</span>
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => setLogs([])}
                      className="text-[11px] text-white/40 hover:text-white transition-colors cursor-pointer"
                    >
                      Clear Logs
                    </button>
                  </div>

                  {/* Scrollable Log Stream */}
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-xs custom-scrollbar">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className={cn(
                          "p-2.5 rounded-xl border text-[11px] space-y-1 transition-all",
                          log.type === 'info' && "bg-blue-500/10 border-blue-500/20 text-blue-200",
                          log.type === 'screen' && "bg-purple-500/10 border-purple-500/20 text-purple-200",
                          log.type === 'action' && "bg-cyan-500/10 border-cyan-500/25 text-cyan-200",
                          log.type === 'validation' && "bg-amber-500/10 border-amber-500/20 text-amber-200",
                          log.type === 'success' && "bg-emerald-500/10 border-emerald-500/25 text-emerald-200",
                          log.type === 'error' && "bg-red-500/10 border-red-500/20 text-red-200"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold uppercase tracking-wider text-[9px] opacity-80">
                            [{log.timestamp}] {log.type}
                          </span>
                          <span className="text-[10px] font-semibold">{log.title}</span>
                        </div>

                        {log.detail && (
                          <p className="text-[10px] opacity-90 leading-relaxed">{log.detail}</p>
                        )}

                        {log.payload && (
                          <pre className="mt-1 p-1.5 rounded bg-black/40 text-[9px] text-white/70 overflow-x-auto max-h-28">
                            {JSON.stringify(log.payload, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))}

                    {logs.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 text-white/30 space-y-2">
                        <Terminal size={28} className="text-white/20" />
                        <p className="text-xs">
                          No execution logs yet. Enter a command above or click a preset to launch the Phone Control Agent loop.
                        </p>
                      </div>
                    )}
                    <div ref={logsEndRef} />
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: KOTLIN CODE VIEWER */}
          {activeTab === 'code' && (
            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden bg-[#0a0a10]">
              
              {/* Left Column: File List Sidebar (4 Cols) */}
              <div className="md:col-span-4 border-r border-white/10 p-4 overflow-y-auto space-y-1 custom-scrollbar">
                <div className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider mb-2 px-2">
                  Android Architecture Source Files
                </div>

                {KOTLIN_SOURCE_FILES.map((file) => (
                  <button
                    key={file.filename}
                    onClick={() => setActiveCodeFile(file)}
                    className={cn(
                      "w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-start gap-2.5 cursor-pointer",
                      activeCodeFile.filename === file.filename
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold"
                        : "text-white/70 hover:text-white hover:bg-white/5 border border-transparent"
                    )}
                  >
                    <FileText size={16} className="text-cyan-400 shrink-0 mt-0.5" />
                    <div className="truncate">
                      <div className="font-mono text-xs text-white">{file.filename}</div>
                      <div className="text-[10px] text-white/40 truncate font-normal">{file.description}</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Right Column: Code Editor Display (8 Cols) */}
              <div className="md:col-span-8 flex flex-col p-4 bg-[#050508] overflow-hidden">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Code2 size={16} className="text-cyan-400" />
                    <span className="font-mono text-xs font-bold text-white">{activeCodeFile.filename}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-white/50 border border-white/10">
                      {activeCodeFile.language.toUpperCase()}
                    </span>
                  </div>

                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-semibold transition-all cursor-pointer"
                  >
                    {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedCode ? 'Copied!' : 'Copy File'}</span>
                  </button>
                </div>

                {/* Code Text Window */}
                <div className="flex-1 overflow-auto bg-[#0a0a12] p-4 rounded-xl border border-white/10 font-mono text-xs text-cyan-100 leading-relaxed custom-scrollbar">
                  <pre>{activeCodeFile.code}</pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ARCHITECTURE & SECURITY SPEC */}
          {activeTab === 'architecture' && (
            <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-[#0a0a10] custom-scrollbar">
              
              {/* Architecture Diagram */}
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
                  <Layers size={16} className="text-cyan-400" />
                  <span>Gemini Phone Control Agent Architecture</span>
                </h3>
                
                <div className="p-4 rounded-xl bg-black/60 font-mono text-xs text-cyan-200 border border-cyan-500/20 overflow-x-auto leading-loose">
                  User Voice / Text Request → Speech-to-Text → AI Planner → Structured Action JSON → Action Validator Whitelist Guard → AIAccessibilityService / Android Intent → Tap / Swipe / Type / Scroll / Open App → Read Current Screen Snapshot → AI Checks Goal Result → Retry / Next Action / Done
                </div>
              </div>

              {/* Whitelist Actions Grid */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white/50">Whitelisted Control Actions</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  {[
                    { action: 'open_app', desc: 'Launches package via Intent.FLAG_ACTIVITY_NEW_TASK' },
                    { action: 'click_text', desc: 'Finds AccessibilityNodeInfo by text & performs ACTION_CLICK' },
                    { action: 'type_text', desc: 'Finds editable input & sets ACTION_SET_TEXT bundle' },
                    { action: 'back', desc: 'Triggers GLOBAL_ACTION_BACK accessibility event' },
                    { action: 'home', desc: 'Triggers GLOBAL_ACTION_HOME accessibility event' },
                    { action: 'recents', desc: 'Triggers GLOBAL_ACTION_RECENTS accessibility overview' },
                    { action: 'swipe', desc: 'Dispatches gesture stroke path via dispatchGesture()' },
                    { action: 'scroll', desc: 'Executes ACTION_SCROLL_FORWARD on scrollable container' },
                    { action: 'wait', desc: 'Pauses execution loop for UI rendering settlement' },
                  ].map((item) => (
                    <div key={item.action} className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                      <div className="font-mono font-bold text-cyan-300">{item.action}</div>
                      <div className="text-[11px] text-white/60">{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Important Security Rules */}
              <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                  <Shield size={16} />
                  <span>Key Security & Safety Rules</span>
                </div>
                <ul className="list-disc list-inside text-xs text-amber-200/90 space-y-1">
                  <li>User must manually enable Accessibility Service in Android Settings.</li>
                  <li>Never enter passwords, PINs, OTPs, or banking credentials automatically.</li>
                  <li>Never send messages or change security settings without explicit user confirmation.</li>
                  <li>Whitelisted actions only — strictly block execution of arbitrary code.</li>
                  <li>Action loop limit set to maximum 10 iterations to prevent infinite loops.</li>
                </ul>
              </div>
            </div>
          )}

          {/* Sensitive Action Manual Confirmation Dialog Overlay */}
          <AnimatePresence>
            {pendingConfirmation && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  className="w-full max-w-lg bg-[#12121e] border-2 border-amber-500/60 rounded-2xl p-6 shadow-2xl text-white space-y-4"
                >
                  <div className="flex items-center gap-3 text-amber-400">
                    <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40">
                      <ShieldAlert size={28} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Manual User Confirmation Required</h3>
                      <p className="text-xs text-amber-300/80">Sensitive Action Detected by Safety Guard</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-white/60 font-mono">Action Type:</span>
                      <span className="font-mono font-bold text-amber-300 px-2 py-0.5 rounded bg-amber-500/20">
                        {pendingConfirmation.action.type.toUpperCase()}
                      </span>
                    </div>

                    {(pendingConfirmation.action.text || pendingConfirmation.action.target) && (
                      <div className="flex items-center justify-between">
                        <span className="text-white/60 font-mono">Target Parameter:</span>
                        <span className="font-mono text-cyan-300 font-semibold truncate max-w-[240px]">
                          "{pendingConfirmation.action.text || pendingConfirmation.action.target}"
                        </span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-amber-500/20 text-white/90 leading-relaxed">
                      <strong className="text-amber-300">Reason:</strong> {pendingConfirmation.reason}
                    </div>
                  </div>

                  <p className="text-xs text-white/70">
                    The agent loop is paused waiting for your decision. Do you grant explicit authorization to execute this sensitive action on your phone?
                  </p>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => pendingConfirmation.resolve(false)}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-red-500/20 border border-white/20 hover:border-red-500/40 text-white hover:text-red-300 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <X size={15} />
                      <span>Reject & Cancel Task</span>
                    </button>

                    <button
                      onClick={() => pendingConfirmation.resolve(true)}
                      className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
                    >
                      <Check size={15} />
                      <span>Confirm & Proceed</span>
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
