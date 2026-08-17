import React from 'react';
import {
  Youtube,
  MessageCircle,
  Chrome,
  Settings,
  Camera,
  Calculator,
  Instagram,
  Music,
  Mail,
  MapPin,
  Image as ImageIcon,
  HardDrive,
  Twitter,
  Tv,
  Send,
  Users,
  Calendar,
  Clock,
  Phone,
  MessageSquare,
  ShoppingBag,
  Folder,
  Smartphone,
} from 'lucide-react';
import { AppItem } from '@/lib/launcher/appsData';
import { cn } from '@/lib/utils';

interface AppIconProps {
  app: AppItem;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBadge?: boolean;
}

export const AppIcon: React.FC<AppIconProps> = ({
  app,
  size = 'md',
  className,
  showBadge = false,
}) => {
  const sizeClasses = {
    sm: 'w-9 h-9 text-xs rounded-xl',
    md: 'w-12 h-12 text-sm rounded-2xl',
    lg: 'w-16 h-16 text-base rounded-[22px]',
    xl: 'w-20 h-20 text-lg rounded-[28px]',
  };

  const iconSizes = {
    sm: 18,
    md: 24,
    lg: 32,
    xl: 40,
  };

  const currentIconSize = iconSizes[size];

  const renderIconGraphic = () => {
    switch (app.iconType) {
      case 'youtube':
        return <Youtube size={currentIconSize} className="text-white fill-white/20" />;
      case 'whatsapp':
        return <MessageCircle size={currentIconSize} className="text-white fill-white/20" />;
      case 'chrome':
        return <Chrome size={currentIconSize} className="text-white" />;
      case 'settings':
        return <Settings size={currentIconSize} className="text-white/90 animate-spin-slow" />;
      case 'camera':
        return <Camera size={currentIconSize} className="text-white" />;
      case 'calculator':
        return <Calculator size={currentIconSize} className="text-white" />;
      case 'instagram':
        return <Instagram size={currentIconSize} className="text-white" />;
      case 'spotify':
        return <Music size={currentIconSize} className="text-white" />;
      case 'gmail':
        return <Mail size={currentIconSize} className="text-white" />;
      case 'maps':
        return <MapPin size={currentIconSize} className="text-white fill-white/20" />;
      case 'photos':
        return <ImageIcon size={currentIconSize} className="text-white" />;
      case 'drive':
        return <HardDrive size={currentIconSize} className="text-white" />;
      case 'twitter':
        return <Twitter size={currentIconSize} className="text-white" />;
      case 'netflix':
        return <Tv size={currentIconSize} className="text-white" />;
      case 'telegram':
        return <Send size={currentIconSize} className="text-white" />;
      case 'contacts':
        return <Users size={currentIconSize} className="text-white" />;
      case 'calendar':
        return <Calendar size={currentIconSize} className="text-white" />;
      case 'clock':
        return <Clock size={currentIconSize} className="text-white" />;
      case 'phone':
        return <Phone size={currentIconSize} className="text-white fill-white/20" />;
      case 'messages':
        return <MessageSquare size={currentIconSize} className="text-white fill-white/20" />;
      case 'store':
        return <ShoppingBag size={currentIconSize} className="text-white" />;
      case 'file':
        return <Folder size={currentIconSize} className="text-white" />;
      default:
        return <Smartphone size={currentIconSize} className="text-white" />;
    }
  };

  return (
    <div className="relative inline-block group">
      <div
        className={cn(
          'flex items-center justify-center bg-gradient-to-br shadow-lg transition-all duration-300 transform group-hover:scale-105 group-active:scale-95 border border-white/10 shrink-0',
          app.iconBg,
          sizeClasses[size],
          className
        )}
      >
        {renderIconGraphic()}
      </div>

      {showBadge && app.isSystem && (
        <span
          className="absolute -top-1 -right-1 bg-cyan-500 text-black font-extrabold text-[9px] px-1.5 py-0.2 rounded-full border border-black shadow-md tracking-tighter"
          title="Android System App"
        >
          SYS
        </span>
      )}
    </div>
  );
};
