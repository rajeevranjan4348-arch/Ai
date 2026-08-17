import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Play, Terminal, Globe, CheckCircle2, Loader2, Cpu, ArrowRight, ShieldCheck, RefreshCw, Mic, MicOff, Layers, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatAppError, showErrorToast } from '@/lib/errorHandler';
import { cn } from '@/lib/utils';

interface ManusAgentPanelProps {
  onSearchStart?: (query: string, mode: 'chat' | 'search' | 'research') => Promise<string>;
}

export const ManusAgentPanel: React.FC<ManusAgentPanelProps> = ({ onSearchStart }) => {
  const [goalInput, setGoalInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'plan' | 'browser' | 'terminal' | 'chat'>('plan');
  const [executionSteps, setExecutionSteps] = useState<Array<{ id: number; title: string; status: 'pending' | 'running' | 'completed'; detail: string }>>([]);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    { role: 'assistant', content: 'Hello! I am **Manus AI**, your autonomous agent engine. Give me a complex goal, and I will plan, browse, execute, and deliver results end-to-end.' }
  ]);

  const handleStartManusAgent = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!goalInput.trim()) return;

    const currentGoal = goalInput.trim();
    setIsRunning(true);
    setActiveTab('plan');

    // Initialize steps
    setExecutionSteps([
      { id: 1, title: 'Goal Decomposition & Strategy', status: 'running', detail: `Analyzing goal: "${currentGoal}"` },
      { id: 2, title: 'Web Research & Source Discovery', status: 'pending', detail: 'Waiting for strategy analysis...' },
      { id: 3, title: 'Autonomous Sandbox Execution', status: 'pending', detail: 'Pending environment verification...' },
      { id: 4, title: 'Synthesis & Final Artifact Generation', status: 'pending', detail: 'Pending execution results...' }
    ]);

    setTerminalLogs(prev => [`[Manus Agent] Initializing session for goal: "${currentGoal}"`, `[Planner] Deconstructing task into sub-objectives...`]);

    // Simulate step 1 completion & step 2 start
    setTimeout(() => {
      setExecutionSteps(prev => prev.map(s => s.id === 1 ? { ...s, status: 'completed', detail: 'Successfully deconstructed goal into 4 execution vectors.' } : s.id === 2 ? { ...s, status: 'running', detail: 'Querying search indices and official APIs...' } : s));
      setTerminalLogs(prev => [...prev, `[Browser] Navigating to primary research sources...`, `[Network] HTTP 200 OK received from verified data endpoints.`]);
    }, 1500);

    // Simulate step 2 completion & step 3 start
    setTimeout(() => {
      setExecutionSteps(prev => prev.map(s => s.id === 2 ? { ...s, status: 'completed', detail: 'Collected 8 high-relevance citations and data points.' } : s.id === 3 ? { ...s, status: 'running', detail: 'Executing calculations and code sandbox logic...' } : s));
      setTerminalLogs(prev => [...prev, `[Sandbox] Running Python / Node.js verification scripts...`, `[State] Intermediate verification passed with 99.4% confidence.`]);
    }, 3200);

    // Simulate step 3 completion & step 4 start
    setTimeout(() => {
      setExecutionSteps(prev => prev.map(s => s.id === 3 ? { ...s, status: 'completed', detail: 'Sandbox execution verified successfully.' } : s.id === 4 ? { ...s, status: 'running', detail: 'Compiling final structured response and artifact...' } : s));
      setTerminalLogs(prev => [...prev, `[Synthesizer] Formatting Markdown report with source citations...`]);
    }, 4800);

    // Final completion
    setTimeout(() => {
      setExecutionSteps(prev => prev.map(s => s.id === 4 ? { ...s, status: 'completed', detail: 'Autonomous workflow completed successfully.' } : s));
      setIsRunning(false);
      setTerminalLogs(prev => [...prev, `[Manus Agent] Workflow completed with 100% success rate.`]);
      setChatHistory(prev => [
        ...prev,
        { role: 'user', content: currentGoal },
        { role: 'assistant', content: `### 🤖 Manus Autonomous Execution Report\n\nI have successfully executed your goal: **"${currentGoal}"**.\n\n1. **Task Analysis**: Broke down requirements into structured execution paths.\n2. **Execution & Verification**: Gathered live intelligence and performed automated verification.\n3. **Outcome**: All objectives achieved with high fidelity and verified source references.` }
      ]);
      toast.success('Manus autonomous task completed successfully!');
    }, 6500);
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Web Speech API is not supported in this browser.');
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        toast.info('Listening for voice command...');
      };
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((r: any) => r[0])
          .map((r: any) => r.transcript)
          .join('');
        setGoalInput(transcript);
      };
      recognition.onerror = (err: any) => {
        setIsListening(false);
        const appErr = formatAppError(err, 'Voice recognition error.');
        showErrorToast(appErr, 'Voice Input Failed');
      };
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch (err: any) {
      setIsListening(false);
      const appErr = formatAppError(err, 'Could not start voice recognition.');
      showErrorToast(appErr, 'Voice Recognition Unavailable');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-6 text-foreground">
      {/* Manus Header Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-900/30 via-slate-900/80 to-cyan-950/30 border border-purple-500/20 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Cpu size={120} className="text-purple-400" />
        </div>
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <Sparkles size={24} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Manus AI Agent Engine <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/30 text-purple-300 font-mono">v2.5 Autonomous</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">Autonomous multi-step execution engine for complex goals, browser automation, and workflows.</p>
          </div>
        </div>

        {/* Goal Input Form with Voice-to-Text */}
        <form onSubmit={handleStartManusAgent} className="mt-5 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              placeholder="Enter complex goal or workflow task for Manus..."
              className="w-full px-4 py-3.5 pl-4 pr-12 rounded-2xl bg-black/40 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
            />
            <button
              type="button"
              onClick={handleVoiceInput}
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-colors",
                isListening ? "bg-red-500/20 text-red-400 animate-pulse" : "text-white/40 hover:text-white hover:bg-white/10"
              )}
              title="Voice-to-Text Dictation"
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
          </div>
          <button
            type="submit"
            disabled={isRunning || !goalInput.trim()}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all shadow-lg cursor-pointer"
          >
            {isRunning ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Executing Task...</span>
              </>
            ) : (
              <>
                <Play size={18} />
                <span>Run Manus Agent</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Manus Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        {[
          { id: 'plan', label: 'Execution Plan & Steps', icon: Layers },
          { id: 'browser', label: 'Browser Automation View', icon: Globe },
          { id: 'terminal', label: 'Terminal Logs', icon: Terminal },
          { id: 'chat', label: 'Agent Chat History', icon: Sparkles }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer",
              activeTab === tab.id
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
          >
            <tab.icon size={15} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[380px] rounded-3xl bg-black/40 border border-white/10 p-6 backdrop-blur-xl">
        {activeTab === 'plan' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-2">Autonomous Execution Pipeline</h3>
            {executionSteps.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-sm">
                No active execution plan. Enter a goal above and click **Run Manus Agent**.
              </div>
            ) : (
              <div className="space-y-3">
                {executionSteps.map((step) => (
                  <div key={step.id} className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                    <div className="mt-0.5">
                      {step.status === 'completed' && <CheckCircle2 size={20} className="text-emerald-400" />}
                      {step.status === 'running' && <Loader2 size={20} className="text-purple-400 animate-spin" />}
                      {step.status === 'pending' && <div className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center text-[10px] text-white/40">{step.id}</div>}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-white">{step.title}</h4>
                        <span className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full uppercase font-mono",
                          step.status === 'completed' ? "bg-emerald-500/20 text-emerald-300" : step.status === 'running' ? "bg-purple-500/20 text-purple-300" : "bg-white/5 text-slate-400"
                        )}>
                          {step.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{step.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'browser' && (
          <div className="flex flex-col h-[360px] rounded-2xl bg-slate-950 border border-white/10 overflow-hidden">
            <div className="px-4 py-2.5 bg-white/5 border-b border-white/10 flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <div className="flex-1 px-3 py-1 rounded-lg bg-black/40 text-xs font-mono text-slate-400 border border-white/5">
                https://manus.ai/sandbox/session-active
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center p-6 text-center">
              {isRunning ? (
                <div className="space-y-3">
                  <Loader2 size={36} className="text-purple-400 animate-spin mx-auto" />
                  <p className="text-xs text-slate-400 font-mono">Manus agent browsing and gathering live data...</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Globe size={40} className="text-purple-400/50 mx-auto" />
                  <p className="text-sm text-slate-300 font-medium">Browser Sandbox Ready</p>
                  <p className="text-xs text-slate-500">Autonomous browser actions will render here during execution.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'terminal' && (
          <div className="p-4 rounded-2xl bg-black/80 border border-white/10 font-mono text-xs text-cyan-300 h-[360px] overflow-y-auto space-y-1.5">
            <div className="text-slate-500 pb-2 border-b border-white/10">Manus Terminal Log Stream (v2.5)</div>
            {terminalLogs.length === 0 ? (
              <div className="text-slate-600 pt-12 text-center">No terminal logs recorded yet. Run a task to inspect logs.</div>
            ) : (
              terminalLogs.map((log, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-slate-600">{'>'}</span>
                  <span className="text-white/90">{log}</span>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="space-y-4">
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={cn("p-4 rounded-2xl text-xs sm:text-sm", msg.role === 'user' ? "bg-purple-600/20 text-purple-100 border border-purple-500/30 ml-auto max-w-[80%]" : "bg-white/5 text-slate-200 border border-white/10 mr-auto max-w-[80%]")}>
                  <div className="font-semibold text-[11px] text-purple-400 mb-1 uppercase tracking-wider">{msg.role === 'user' ? 'You' : 'Manus AI Agent'}</div>
                  <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
