import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  ChevronDown,
  Info,
  AlertTriangle,
  X,
  Search,
  ShieldAlert,
  RotateCcw,
  Sparkles
} from 'lucide-react';

// ==========================================
// 1. TOGGLE SWITCH COMPONENT
// ==========================================
interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  size = 'md'
}) => {
  const dimensions = {
    sm: { track: 'w-8 h-4.5 p-0.5', thumb: 'w-3.5 h-3.5', translate: 'translate-x-3.5' },
    md: { track: 'w-11 h-6 p-1', thumb: 'w-4 h-4', translate: 'translate-x-5' },
    lg: { track: 'w-14 h-7 p-1', thumb: 'w-5 h-5', translate: 'translate-x-7' },
  }[size];

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex items-center rounded-full transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${
        checked ? 'bg-cyan-500' : 'bg-white/15'
      } ${dimensions.track} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      <span
        className={`inline-block rounded-full bg-white shadow-md transform transition-transform duration-200 ${
          dimensions.thumb
        } ${checked ? dimensions.translate : 'translate-x-0'}`}
      />
    </button>
  );
};

// ==========================================
// 2. SLIDER CONTROL COMPONENT
// ==========================================
interface SliderControlProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (val: number) => void;
  unit?: string;
  formatValue?: (val: number) => string;
}

export const SliderControl: React.FC<SliderControlProps> = ({
  value,
  min,
  max,
  step = 1,
  onChange,
  unit = '',
  formatValue
}) => {
  return (
    <div className="flex items-center gap-3 w-full max-w-[200px]">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-white/15 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
      />
      <span className="text-xs font-mono font-medium text-cyan-300 shrink-0 min-w-[40px] text-right">
        {formatValue ? formatValue(value) : `${value}${unit}`}
      </span>
    </div>
  );
};

// ==========================================
// 3. SEGMENTED CONTROL COMPONENT
// ==========================================
interface Option<T> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

interface SegmentedControlProps<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (val: T) => void;
  size?: 'sm' | 'md';
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div className="inline-flex p-1 bg-white/5 border border-white/10 rounded-xl gap-1 max-w-full overflow-x-auto">
      {options.map(opt => {
        const isSelected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`relative px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              isSelected
                ? 'bg-cyan-500 text-black font-semibold shadow-md shadow-cyan-500/20'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            {opt.icon}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ==========================================
// 4. DROPDOWN SELECT COMPONENT
// ==========================================
interface DropdownSelectProps<T extends string> {
  options: { value: T; label: string; description?: string }[];
  value: T;
  onChange: (val: T) => void;
}

export function DropdownSelect<T extends string>({
  options,
  value,
  onChange
}: DropdownSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOpt = options.find(o => o.value === value) || options[0];

  return (
    <div className="relative inline-block text-left min-w-[160px]">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-3.5 py-2 text-xs font-medium text-white flex items-center justify-between gap-2 transition-colors cursor-pointer"
      >
        <span>{selectedOpt?.label}</span>
        <ChevronDown size={14} className={`text-white/50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            className="absolute right-0 z-50 mt-1.5 w-56 rounded-2xl bg-[#181820] border border-white/10 shadow-2xl p-1.5 space-y-0.5"
          >
            {options.map(opt => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-white/80 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div>
                    <div>{opt.label}</div>
                    {opt.description && (
                      <div className="text-[10px] text-white/40">{opt.description}</div>
                    )}
                  </div>
                  {isSelected && <Check size={14} className="text-cyan-400 shrink-0 ml-2" />}
                </button>
              );
            })}
          </motion.div>
        </>
      )}
    </div>
  );
}

// ==========================================
// 5. COLOR PICKER PALETTE COMPONENT
// ==========================================
interface ColorPickerProps {
  value: string;
  onChange: (color: any) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange }) => {
  const colors = [
    { id: 'cyan', label: 'Cyan Accent', hex: '#06b6d4', bgClass: 'bg-cyan-500' },
    { id: 'purple', label: 'Purple Accent', hex: '#a855f7', bgClass: 'bg-purple-500' },
    { id: 'emerald', label: 'Emerald Accent', hex: '#10b981', bgClass: 'bg-emerald-500' },
    { id: 'amber', label: 'Amber Accent', hex: '#f59e0b', bgClass: 'bg-amber-500' },
    { id: 'rose', label: 'Rose Accent', hex: '#f43f5e', bgClass: 'bg-rose-500' },
    { id: 'blue', label: 'Blue Accent', hex: '#3b82f6', bgClass: 'bg-blue-500' },
  ];

  return (
    <div className="flex items-center gap-2">
      {colors.map(c => {
        const isSelected = value === c.id || value === c.hex;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onChange(c.id)}
            title={c.label}
            className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${c.bgClass} flex items-center justify-center ${
              isSelected ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-[#121218]' : 'hover:scale-105 opacity-80 hover:opacity-100'
            }`}
          >
            {isSelected && <Check size={12} className="text-black font-bold" />}
          </button>
        );
      })}
    </div>
  );
};

// ==========================================
// 6. SEARCH INPUT HEADER
// ==========================================
interface SearchInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Search settings (e.g. "voice", "theme", "memory")...'
}) => {
  return (
    <div className="relative w-full">
      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-9 py-2.5 text-xs text-white placeholder-white/35 focus:outline-none focus:border-cyan-500/60 transition-all shadow-inner"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};

// ==========================================
// 7. SETTING CARD CONTAINER
// ==========================================
interface SettingCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  warning?: string;
  info?: string;
  categoryBadge?: string;
  children: React.ReactNode;
}

export const SettingCard: React.FC<SettingCardProps> = ({
  title,
  description,
  icon,
  warning,
  info,
  categoryBadge,
  children
}) => {
  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/15 transition-all shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-1 max-w-xl">
        <div className="flex items-center gap-2 flex-wrap">
          {icon && <span className="text-cyan-400 shrink-0">{icon}</span>}
          <h4 className="text-xs sm:text-sm font-semibold text-white/95">{title}</h4>
          {categoryBadge && (
            <span className="text-[10px] font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-2 py-0.5 rounded-full">
              {categoryBadge}
            </span>
          )}
        </div>
        <p className="text-[11px] sm:text-xs text-white/50 leading-relaxed">{description}</p>
        {warning && (
          <div className="flex items-center gap-1.5 text-[11px] text-amber-300 mt-1">
            <AlertTriangle size={12} className="shrink-0" />
            <span>{warning}</span>
          </div>
        )}
        {info && (
          <div className="flex items-center gap-1.5 text-[11px] text-cyan-300 mt-1">
            <Info size={12} className="shrink-0" />
            <span>{info}</span>
          </div>
        )}
      </div>

      <div className="shrink-0 flex items-center justify-start sm:justify-end">
        {children}
      </div>
    </div>
  );
};

// ==========================================
// 8. INFORMATION ROW
// ==========================================
interface InformationRowProps {
  label: string;
  value: string | React.ReactNode;
  icon?: React.ReactNode;
  status?: 'success' | 'warning' | 'info';
}

export const InformationRow: React.FC<InformationRowProps> = ({
  label,
  value,
  icon,
  status
}) => {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 text-xs">
      <div className="flex items-center gap-2 text-white/70">
        {icon && <span className="text-cyan-400">{icon}</span>}
        <span>{label}</span>
      </div>
      <div className="font-mono font-medium text-white flex items-center gap-1.5">
        {status === 'success' && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
        {status === 'warning' && <span className="w-2 h-2 rounded-full bg-amber-400" />}
        {status === 'info' && <span className="w-2 h-2 rounded-full bg-cyan-400" />}
        <span>{value}</span>
      </div>
    </div>
  );
};

// ==========================================
// 9. CONFIRMATION MODAL
// ==========================================
interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = true,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 8 }}
        className="bg-[#181820] border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5 text-white"
      >
        <div className="flex items-start gap-3">
          <div className={`p-3 rounded-2xl shrink-0 ${danger ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20' : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20'}`}>
            <ShieldAlert size={22} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-white">{title}</h3>
            <p className="text-xs text-white/60 leading-relaxed">{description}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white/80 transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-lg cursor-pointer flex items-center gap-1.5 ${
              danger
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20'
                : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-cyan-500/20'
            }`}
          >
            {danger && <RotateCcw size={13} />}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
