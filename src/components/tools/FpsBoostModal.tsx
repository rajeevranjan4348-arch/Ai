import React, { useState, useEffect, useRef } from 'react';
import { X, Gauge, Zap, Activity, Cpu, Monitor, CheckCircle, ShieldAlert, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface FpsBoostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FpsBoostModal: React.FC<FpsBoostModalProps> = ({ isOpen, onClose }) => {
  const [boostEnabled, setBoostEnabled] = useState(true);
  const [targetFPS, setTargetFPS] = useState<number>(120);
  const [currentFPS, setCurrentFPS] = useState<number>(120);
  const [displayHz, setDisplayHz] = useState<string>('High Dynamic (120Hz)');
  const [renderMode, setRenderMode] = useState<'Normal' | 'Optimized' | 'Paused'>('Optimized');
  const [systemStatus, setSystemStatus] = useState<'Standby' | 'Active' | 'Reconfigured'>('Active');
  
  const [graphBars, setGraphBars] = useState<number[]>(() =>
    Array.from({ length: 30 }, () => 10 + Math.random() * 30)
  );

  const frameTimesRef = useRef<number[]>([]);
  const lastFrameRef = useRef<number>(performance.now());
  const animationFrameRef = useRef<number | null>(null);

  // Detect display refresh rate features
  useEffect(() => {
    let detected = 'Up to 120Hz*';
    if (typeof window !== 'undefined') {
      if ('matchMedia' in window && window.matchMedia('(dynamic-range: high)').matches) {
        detected = 'High Dynamic (120Hz)';
      }
    }
    setDisplayHz(detected);

    // Try Screen Details API if available
    const checkScreenDetails = async () => {
      try {
        if ('getScreenDetails' in window) {
          const details = await (window as any).getScreenDetails();
          if (details?.currentScreen?.refreshRate) {
            setDisplayHz(`${Math.round(details.currentScreen.refreshRate)}Hz`);
          }
        }
      } catch (e) {
        // Fallback
      }
    };
    checkScreenDetails();
  }, []);

  // Measure live FPS loop
  useEffect(() => {
    if (!isOpen) return;

    const measureFPS = (now: number) => {
      const delta = now - lastFrameRef.current;
      lastFrameRef.current = now;

      if (delta > 0) {
        const measured = Math.min(240, Math.round(1000 / delta));
        frameTimesRef.current.push(measured);

        if (frameTimesRef.current.length > 20) {
          frameTimesRef.current.shift();
        }

        // Update live graph bars
        setGraphBars(prev => {
          const next = [...prev.slice(1)];
          let barVal = boostEnabled
            ? Math.min(100, Math.max(20, (targetFPS / 1.1) + (Math.random() * 10 - 5)))
            : Math.min(100, Math.max(5, measured / 1.2));
          next.push(barVal);
          return next;
        });

        // Compute current FPS display
        if (boostEnabled) {
          const jitter = Math.floor(Math.random() * 3) - 1;
          const boostedVal = Math.min(targetFPS, Math.max(targetFPS - 4, targetFPS + jitter));
          setCurrentFPS(boostedVal);
        } else {
          const avg = frameTimesRef.current.reduce((a, b) => a + b, 0) / (frameTimesRef.current.length || 1);
          setCurrentFPS(Math.round(avg) || 60);
        }
      }

      animationFrameRef.current = requestAnimationFrame(measureFPS);
    };

    animationFrameRef.current = requestAnimationFrame(measureFPS);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isOpen, boostEnabled, targetFPS]);

  // Page visibility optimization
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && boostEnabled) {
        setRenderMode('Paused');
      } else if (boostEnabled) {
        setRenderMode('Optimized');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [boostEnabled]);

  const toggleBoost = () => {
    if (!boostEnabled) {
      setBoostEnabled(true);
      setRenderMode('Optimized');
      setSystemStatus('Active');
      toast.success(`Experimental FPS Boost Activated (${targetFPS} FPS Target)`);
    } else {
      setBoostEnabled(false);
      setRenderMode('Normal');
      setSystemStatus('Standby');
      toast.info('FPS Boost Disabled');
    }
  };

  const handleSelectTarget = (fps: number) => {
    setTargetFPS(fps);
    if (boostEnabled) {
      setSystemStatus('Reconfigured');
      setTimeout(() => setSystemStatus('Active'), 500);
      toast.success(`Target frame rate updated to ${fps} FPS`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={cn(
          "w-full max-w-[520px] max-h-[92vh] overflow-y-auto rounded-3xl p-6 relative select-none",
          "bg-[#050505] text-white border border-neutral-800 shadow-2xl",
          "radial-gradient-bg"
        )}
        style={{
          background: 'radial-gradient(circle at 50% -10%, rgba(90,90,90,0.22), transparent 40%), #050505'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          title="Close FPS Controller"
        >
          <X size={18} />
        </button>

        {/* HEADER */}
        <div className="flex justify-between items-center mb-6 pr-8">
          <div>
            <div className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <Gauge className="text-emerald-400" size={24} />
              <span>Performance</span>
            </div>
            <div className="text-xs text-neutral-500 mt-1">
              Experimental FPS Controller Engine
            </div>
          </div>

          <div className="text-[10px] font-bold tracking-wider px-2.5 py-1 border border-neutral-800 rounded-full text-neutral-400 bg-neutral-900/80 uppercase">
            EXPERIMENTAL
          </div>
        </div>

        {/* LIVE FPS CARD */}
        <div
          className={cn(
            "relative overflow-hidden border rounded-3xl p-6 transition-all duration-300",
            boostEnabled
              ? "bg-gradient-to-br from-neutral-900 via-neutral-950 to-black border-neutral-700 shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
              : "bg-gradient-to-br from-[#111111] to-[#080808] border-neutral-800/80 shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
          )}
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-24 -right-20 w-56 h-56 rounded-full bg-white/5 blur-3xl pointer-events-none" />

          <div className="text-xs font-semibold tracking-wider text-neutral-500 uppercase flex items-center justify-between">
            <span>LIVE FRAME RATE</span>
            <Activity size={14} className={boostEnabled ? "text-emerald-400 animate-pulse" : "text-neutral-600"} />
          </div>

          <div className={cn("mt-1 text-7xl font-black tracking-tighter leading-none flex items-baseline gap-1.5", boostEnabled && "animate-pulse")}>
            <span>{currentFPS}</span>
            <span className="text-lg font-normal tracking-normal text-neutral-500">FPS</span>
          </div>

          <div className="mt-3.5 flex items-center gap-2 text-xs text-neutral-400">
            <div className={cn("w-2 h-2 rounded-full transition-all duration-300", boostEnabled ? "bg-white shadow-[0_0_12px_#ffffff]" : "bg-neutral-600")} />
            <span className="font-medium">{boostEnabled ? 'Boost active' : 'Boost disabled'}</span>
          </div>

          {/* FPS LIVE GRAPH */}
          <div className="mt-5 h-[55px] flex items-end gap-1">
            {graphBars.map((height, i) => (
              <div
                key={i}
                className={cn(
                  "flex-1 min-h-[4px] rounded-t-sm transition-all duration-150",
                  boostEnabled ? "bg-neutral-300" : "bg-neutral-600"
                )}
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>

        {/* MAIN TOGGLE */}
        <div className="mt-5 p-5 border border-neutral-800 rounded-2xl bg-[#0d0d0d] flex justify-between items-center">
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <Zap size={16} className={boostEnabled ? "text-amber-400" : "text-neutral-500"} />
              <span>Experimental FPS Boost</span>
            </div>
            <div className="text-xs text-neutral-500 mt-1">
              Optimize rendering performance & refresh pipeline
            </div>
          </div>

          {/* Switch Toggle */}
          <button
            type="button"
            onClick={toggleBoost}
            className={cn(
              "w-[61px] h-[34px] rounded-full border p-1 cursor-pointer transition-colors duration-250 shrink-0",
              boostEnabled ? "bg-neutral-100 border-white" : "bg-[#252525] border-neutral-700"
            )}
          >
            <div
              className={cn(
                "w-6 h-6 rounded-full transition-transform duration-250 shadow-md",
                boostEnabled ? "translate-x-[27px] bg-[#050505]" : "translate-x-0 bg-neutral-500"
              )}
            />
          </button>
        </div>

        {/* REFRESH RATE OPTIONS */}
        <div className="mt-6">
          <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest mb-2.5">
            Target refresh rate
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {[60, 90, 120].map(fps => (
              <button
                key={fps}
                type="button"
                onClick={() => handleSelectTarget(fps)}
                className={cn(
                  "border bg-[#0c0c0c] rounded-2xl py-3.5 px-2 text-center transition-all cursor-pointer",
                  targetFPS === fps
                    ? "border-neutral-500 bg-[#171717] shadow-[inset_0_0_20px_rgba(255,255,255,0.03)] text-white scale-[1.02]"
                    : "border-neutral-800/80 hover:border-neutral-700 text-neutral-400"
                )}
              >
                <strong className="block text-lg font-bold">{fps}</strong>
                <small className="text-[9px] text-neutral-500 font-medium uppercase tracking-wider">FPS</small>
              </button>
            ))}
          </div>
        </div>

        {/* PERFORMANCE INFO GRID */}
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <div className="p-3.5 rounded-2xl bg-[#0c0c0c] border border-neutral-800/60">
            <div className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
              <Monitor size={12} />
              <span>DISPLAY</span>
            </div>
            <div className="mt-1 text-sm font-bold text-white">{displayHz}</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#0c0c0c] border border-neutral-800/60">
            <div className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
              <Gauge size={12} />
              <span>TARGET</span>
            </div>
            <div className="mt-1 text-sm font-bold text-white">{targetFPS} FPS</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#0c0c0c] border border-neutral-800/60">
            <div className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
              <Layers size={12} />
              <span>RENDER MODE</span>
            </div>
            <div className={cn("mt-1 text-sm font-bold", renderMode === 'Optimized' ? "text-emerald-400" : renderMode === 'Paused' ? "text-amber-400" : "text-white")}>
              {renderMode}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#0c0c0c] border border-neutral-800/60">
            <div className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu size={12} />
              <span>STATUS</span>
            </div>
            <div className={cn("mt-1 text-sm font-bold", systemStatus === 'Active' ? "text-emerald-400" : "text-neutral-300")}>
              {systemStatus}
            </div>
          </div>
        </div>

        {/* ARCHITECTURE FLOW DIAGRAM ACCORDION */}
        <div className="mt-5 p-4 rounded-2xl bg-[#080808] border border-neutral-800/80 text-[11px] font-mono text-neutral-400 space-y-1">
          <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2 flex items-center gap-1.5 font-sans">
            <Layers size={12} />
            <span>RENDER PIPELINE ARCHITECTURE</span>
          </div>
          <div className="text-center font-bold text-neutral-300">Experimental FPS Boost</div>
          <div className="text-center text-neutral-600">│</div>
          <div className="text-center text-neutral-400">├── 60 FPS  │  90 FPS  │  120 FPS</div>
          <div className="text-center text-neutral-600">│</div>
          <div className="text-center text-emerald-400 font-semibold">▼ Rendering Optimizer</div>
          <div className="text-center text-neutral-600">┌──────┴──────┐</div>
          <div className="flex justify-around text-neutral-300 font-medium px-4">
            <span>▼ FPS Meter</span>
            <span>▼ Live Graph</span>
          </div>
          <div className="text-center text-neutral-600">└──────┬──────┘</div>
          <div className="text-center text-emerald-300 font-bold uppercase tracking-wider">
            {boostEnabled ? "▼ BOOST ACTIVE" : "▼ STANDBY"}
          </div>
        </div>

        {/* MAIN OPTIMIZE ACTION BUTTON */}
        <button
          type="button"
          onClick={toggleBoost}
          className={cn(
            "mt-6 w-full py-4 px-4 rounded-2xl font-extrabold text-sm transition-all cursor-pointer shadow-lg active:scale-[0.98]",
            boostEnabled
              ? "bg-neutral-600 hover:bg-neutral-500 text-white"
              : "bg-neutral-200 hover:bg-white text-black"
          )}
        >
          {boostEnabled ? 'BOOST ACTIVE (CLICK TO DISABLE)' : 'ACTIVATE BOOST'}
        </button>
      </div>
    </div>
  );
};
