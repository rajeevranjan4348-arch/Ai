import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, SunMedium, Contrast } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getSetting, setSetting, subscribeSettings } from '@/lib/settingsStore';

interface ThemeSwitcherProps {
  variant?: 'button' | 'segmented' | 'dropdown' | 'pill';
  className?: string;
  showLabel?: boolean;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  variant = 'button',
  className,
  showLabel = false,
}) => {
  const [currentTheme, setCurrentTheme] = React.useState<'dark' | 'light' | 'system'>(() => {
    return (getSetting('theme') as 'dark' | 'light' | 'system') || 'dark';
  });

  React.useEffect(() => {
    const unsub = subscribeSettings((newSettings) => {
      setCurrentTheme(newSettings.theme || 'dark');
    });
    return unsub;
  }, []);

  const toggleTheme = () => {
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setSetting('theme', nextTheme);
    setCurrentTheme(nextTheme);
    
    // Explicitly update document classes and root dataset
    const root = document.documentElement;
    if (nextTheme === 'light') {
      root.classList.add('light', 'light-high-contrast');
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'high-contrast-light');
      toast.success('High-Contrast Light Mode activated', { icon: '☀️' });
    } else {
      root.classList.add('dark');
      root.classList.remove('light', 'light-high-contrast');
      root.setAttribute('data-theme', 'dark');
      toast.success('Dark Mode activated', { icon: '🌙' });
    }
  };

  const handleSelectTheme = (theme: 'dark' | 'light' | 'system') => {
    setSetting('theme', theme);
    setCurrentTheme(theme);
    
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light', 'light-high-contrast');
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'high-contrast-light');
      toast.success('High-Contrast Light Mode activated', { icon: '☀️' });
    } else if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light', 'light-high-contrast');
      root.setAttribute('data-theme', 'dark');
      toast.success('Dark Mode activated', { icon: '🌙' });
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
        root.classList.remove('light', 'light-high-contrast');
        root.setAttribute('data-theme', 'dark');
      } else {
        root.classList.add('light', 'light-high-contrast');
        root.classList.remove('dark');
        root.setAttribute('data-theme', 'high-contrast-light');
      }
      toast.success('System Theme mode active', { icon: '💻' });
    }
  };

  const isLight = currentTheme === 'light';

  if (variant === 'segmented') {
    return (
      <div className={cn("flex items-center p-1 bg-black/20 dark:bg-white/5 light:bg-black/5 border border-white/10 light:border-black/10 rounded-2xl gap-1", className)}>
        <button
          type="button"
          onClick={() => handleSelectTheme('dark')}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
            currentTheme === 'dark'
              ? "bg-white/15 dark:bg-white/20 text-white shadow-sm border border-white/10"
              : "text-white/60 hover:text-white hover:bg-white/5"
          )}
        >
          <Moon size={14} />
          <span>Dark Mode</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectTheme('light')}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
            currentTheme === 'light'
              ? "bg-amber-400 text-black shadow-md font-bold"
              : "text-white/60 hover:text-white hover:bg-white/5"
          )}
        >
          <Sun size={14} />
          <span>High-Contrast Light</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectTheme('system')}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
            currentTheme === 'system'
              ? "bg-cyan-500/30 text-cyan-200 shadow-sm border border-cyan-400/30"
              : "text-white/60 hover:text-white hover:bg-white/5"
          )}
        >
          <Contrast size={14} />
          <span>System</span>
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "relative flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer rounded-full p-2 select-none group border",
        isLight
          ? "bg-black/5 hover:bg-black/10 text-neutral-900 border-black/15 shadow-sm"
          : "bg-white/10 hover:bg-white/20 text-white border-white/10 shadow-sm",
        className
      )}
      title={isLight ? "Switch to Dark Mode" : "Switch to High-Contrast Light Mode"}
      aria-label="Toggle theme mode"
    >
      <motion.div
        key={isLight ? 'light' : 'dark'}
        initial={{ rotate: -90, scale: 0.7, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        exit={{ rotate: 90, scale: 0.7, opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="flex items-center justify-center"
      >
        {isLight ? (
          <Sun className="w-4.5 h-4.5 text-amber-500 fill-amber-500/20" strokeWidth={2.2} />
        ) : (
          <Moon className="w-4.5 h-4.5 text-cyan-300" strokeWidth={2} />
        )}
      </motion.div>

      {showLabel && (
        <span className="text-xs font-semibold tracking-wide">
          {isLight ? 'Light Mode' : 'Dark Mode'}
        </span>
      )}
    </button>
  );
};
