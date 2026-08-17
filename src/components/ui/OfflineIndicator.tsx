import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi, RefreshCw, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export const OfflineIndicator: React.FC = () => {
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [showOnlineRestored, setShowOnlineRestored] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      setIsDismissed(false);
      toast.error('Network connection lost. You are offline.', {
        id: 'offline-toast',
        duration: 4000,
      });
    };

    const handleOnline = () => {
      setIsOffline(false);
      setIsDismissed(false);
      setShowOnlineRestored(true);
      toast.success('Connection restored. You are back online!', {
        id: 'online-toast',
        duration: 3000,
      });

      const timer = setTimeout(() => {
        setShowOnlineRestored(false);
      }, 3500);

      return () => clearTimeout(timer);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const handleManualCheck = async () => {
    setIsChecking(true);
    try {
      // Attempt a lightweight fetch to check active connectivity
      const response = await fetch('/metadata.json', { method: 'HEAD', cache: 'no-store' });
      if (response.ok) {
        setIsOffline(false);
        setIsDismissed(false);
        setShowOnlineRestored(true);
        toast.success('Connected to network!');
        setTimeout(() => setShowOnlineRestored(false), 3000);
      } else {
        throw new Error('Offline check failed');
      }
    } catch {
      setIsOffline(true);
      toast.error('Still offline. Please check your internet connection.');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <AnimatePresence>
      {/* Offline Alert Banner */}
      {isOffline && !isDismissed && (
        <motion.div
          initial={{ y: -50, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -50, opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-md w-[92%] sm:w-auto"
        >
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-[#1c1213] border border-amber-500/30 text-amber-200 shadow-2xl backdrop-blur-xl transform-gpu">
            <div className="flex items-center gap-2.5 text-xs font-medium">
              <div className="relative flex items-center justify-center p-1.5 rounded-xl bg-amber-500/15 text-amber-400 shrink-0">
                <WifiOff size={16} className="animate-pulse" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-amber-300">You are offline</span>
                <span className="text-[11px] text-amber-200/70 leading-tight">
                  Responses & search features may be unavailable
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 pl-2 border-l border-amber-500/20 shrink-0">
              <button
                type="button"
                onClick={handleManualCheck}
                disabled={isChecking}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 active:scale-95 text-[11px] font-semibold text-amber-200 transition-all cursor-pointer border border-amber-500/30 disabled:opacity-50"
                title="Retry network connection"
              >
                <RefreshCw size={12} className={cn(isChecking && "animate-spin")} />
                <span>{isChecking ? 'Checking...' : 'Retry'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsDismissed(true)}
                className="p-1 rounded-lg hover:bg-amber-500/20 text-amber-300/60 hover:text-amber-200 transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Online Restored Indicator Banner */}
      {!isOffline && showOnlineRestored && (
        <motion.div
          initial={{ y: -50, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -50, opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100]"
        >
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#0d1e16] border border-emerald-500/40 text-emerald-200 shadow-2xl backdrop-blur-xl text-xs font-semibold transform-gpu">
            <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400">
              <Wifi size={14} />
            </div>
            <span>Back online</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
