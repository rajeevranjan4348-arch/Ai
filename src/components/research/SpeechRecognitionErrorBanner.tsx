import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MicOff,
  Globe,
  WifiOff,
  AlertTriangle,
  RefreshCw,
  X,
  HelpCircle,
  ChevronDown,
  VolumeX,
  Languages,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SpeechRecognitionErrorDetails, SpeechLanguage, POPULAR_SPEECH_LANGUAGES } from '@/hooks/useSpeechRecognition';

export interface SpeechRecognitionErrorBannerProps {
  error: SpeechRecognitionErrorDetails | null;
  onDismiss: () => void;
  onRetry?: () => void;
  onRequestPermission?: () => Promise<boolean>;
  onSwitchLanguage?: (langCode: string) => void;
  currentLanguage?: string;
  className?: string;
}

export const SpeechRecognitionErrorBanner: React.FC<SpeechRecognitionErrorBannerProps> = ({
  error,
  onDismiss,
  onRetry,
  onRequestPermission,
  onSwitchLanguage,
  currentLanguage = 'en-US',
  className,
}) => {
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  if (!error) return null;

  const handleGrantPermission = async () => {
    if (onRequestPermission) {
      setIsRequestingPermission(true);
      try {
        const granted = await onRequestPermission();
        if (granted && onRetry) {
          onRetry();
        }
      } finally {
        setIsRequestingPermission(false);
      }
    }
  };

  const getErrorIcon = () => {
    switch (error.type) {
      case 'permission-denied':
        return <MicOff className="w-5 h-5 text-red-400 shrink-0" />;
      case 'unsupported-language':
        return <Globe className="w-5 h-5 text-amber-400 shrink-0" />;
      case 'network-error':
        return <WifiOff className="w-5 h-5 text-orange-400 shrink-0" />;
      case 'no-microphone':
        return <VolumeX className="w-5 h-5 text-rose-400 shrink-0" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
    }
  };

  const getBorderAndBgColor = () => {
    switch (error.type) {
      case 'permission-denied':
        return 'bg-red-950/40 border-red-500/30 text-red-100 shadow-red-950/20';
      case 'unsupported-language':
        return 'bg-amber-950/40 border-amber-500/30 text-amber-100 shadow-amber-950/20';
      case 'network-error':
        return 'bg-orange-950/40 border-orange-500/30 text-orange-100 shadow-orange-950/20';
      case 'no-microphone':
        return 'bg-rose-950/40 border-rose-500/30 text-rose-100 shadow-rose-950/20';
      default:
        return 'bg-zinc-900/90 border-white/15 text-zinc-100 shadow-black/30';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.98 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'relative w-full rounded-2xl border p-3.5 shadow-lg backdrop-blur-md transition-all text-xs z-20 mb-2',
          getBorderAndBgColor(),
          className
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="p-2 rounded-xl bg-white/5 border border-white/10 shrink-0 mt-0.5">
              {getErrorIcon()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm tracking-tight text-white">{error.title}</span>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                    error.type === 'permission-denied'
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                      : error.type === 'network-error'
                      ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                      : error.type === 'unsupported-language'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-zinc-700/50 text-zinc-300 border border-zinc-600/50'
                  )}
                >
                  {error.type.replace('-', ' ')}
                </span>
              </div>

              <p className="mt-1 text-white/80 leading-relaxed">{error.message}</p>

              {/* Action Buttons specific to each state */}
              <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                {error.type === 'permission-denied' && (
                  <>
                    <button
                      type="button"
                      onClick={handleGrantPermission}
                      disabled={isRequestingPermission}
                      className="px-3 py-1.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-[11px] shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={cn('w-3 h-3', isRequestingPermission && 'animate-spin')} />
                      <span>{isRequestingPermission ? 'Requesting Access...' : 'Request Permission'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowTroubleshooting((prev) => !prev)}
                      className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/90 font-medium text-[11px] border border-white/10 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <HelpCircle className="w-3 h-3 text-red-300" />
                      <span>{showTroubleshooting ? 'Hide Guide' : 'How to unblock'}</span>
                    </button>
                  </>
                )}

                {error.type === 'unsupported-language' && (
                  <>
                    <button
                      type="button"
                      onClick={() => onSwitchLanguage?.('en-US')}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-semibold text-[11px] shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Languages className="w-3.5 h-3.5" />
                      <span>Switch to English (US)</span>
                    </button>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowLanguageDropdown((prev) => !prev)}
                        className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/90 font-medium text-[11px] border border-white/10 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <span>Choose Other</span>
                        <ChevronDown className="w-3 h-3 text-white/60" />
                      </button>

                      {showLanguageDropdown && (
                        <div className="absolute left-0 top-full mt-1.5 w-52 max-h-48 overflow-y-auto rounded-xl bg-zinc-900 border border-white/15 shadow-2xl p-1 z-30">
                          {POPULAR_SPEECH_LANGUAGES.map((lang) => (
                            <button
                              key={lang.code}
                              type="button"
                              onClick={() => {
                                onSwitchLanguage?.(lang.code);
                                setShowLanguageDropdown(false);
                              }}
                              className={cn(
                                'w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer',
                                currentLanguage === lang.code
                                  ? 'bg-amber-500/20 text-amber-300 font-semibold'
                                  : 'text-white/80 hover:bg-white/10'
                              )}
                            >
                              <span>
                                {lang.flag} {lang.nativeName}
                              </span>
                              <span className="text-[10px] text-white/40">{lang.code}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {error.type === 'network-error' && (
                  <button
                    type="button"
                    onClick={onRetry}
                    className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-[11px] shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Retry Connection</span>
                  </button>
                )}

                {(error.type === 'no-microphone' || error.type === 'generic' || error.type === 'no-speech') && (
                  <button
                    type="button"
                    onClick={onRetry}
                    className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-medium text-[11px] border border-white/15 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Try Again</span>
                  </button>
                )}
              </div>

              {/* Expandable Step-by-Step Troubleshooting for Permission Issues */}
              <AnimatePresence>
                {showTroubleshooting && error.type === 'permission-denied' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 pt-3 border-t border-red-500/20 text-[11px] text-white/85 space-y-1.5 overflow-hidden"
                  >
                    <p className="font-semibold text-red-200">How to unblock microphone in your browser:</p>
                    <ol className="list-decimal list-inside space-y-1 text-white/70 pl-1">
                      <li>
                        Look for the <strong className="text-white">lock/tune icon</strong> (🔒 / ⚙️) on the left side of your browser address bar.
                      </li>
                      <li>
                        Find <strong className="text-white">Microphone</strong> in the permissions list and change it from <em>Blocked</em> to <strong className="text-emerald-400">Allow</strong>.
                      </li>
                      <li>
                        If prompted, refresh the page or click <em>Request Permission</em> above to start dictating.
                      </li>
                    </ol>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            title="Dismiss error"
          >
            <X size={14} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
