import React from 'react';
import { Settings } from 'lucide-react';

interface ProfileAvatarButtonProps {
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ProfileAvatarButton: React.FC<ProfileAvatarButtonProps> = ({
  onClick,
  className = '',
  size = 'md',
}) => {
  const sizeStyles = {
    sm: { outer: 'w-8 h-8', icon: 16 },
    md: { outer: 'w-10 h-10', icon: 20 },
    lg: { outer: 'w-12 h-12', icon: 22 },
  }[size];

  return (
    <button
      onClick={onClick}
      className={`relative group focus:outline-none cursor-pointer shrink-0 rounded-full ${sizeStyles.outer} bg-white/10 hover:bg-white/20 active:bg-white/25 border border-white/15 hover:border-white/30 text-white/90 hover:text-white flex items-center justify-center shadow-md backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-95 ${className}`}
      title="Settings & System Configuration"
      aria-label="Settings"
    >
      <Settings 
        size={sizeStyles.icon} 
        className="transition-transform duration-500 ease-out group-hover:rotate-90 text-white/90 group-hover:text-white" 
        strokeWidth={1.75}
      />
    </button>
  );
};

export default ProfileAvatarButton;
