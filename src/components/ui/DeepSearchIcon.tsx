import React from 'react';
import { motion } from 'framer-motion';

interface DeepSearchIconProps {
  size?: number;
  className?: string;
  isAnimated?: boolean;
  active?: boolean;
}

export const DeepSearchIcon: React.FC<DeepSearchIconProps> = ({
  size = 24,
  className = '',
  isAnimated = true,
  active = true,
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        {/* ── Brain Outline and Convolutions (Bold black/white line art) ── */}
        <g stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none">
          {/* Outer Brain Lobes Contour */}
          <path d="M 50 18
            C 40 10, 26 15, 22 28
            C 14 30, 8 40, 12 52
            C 7 60, 10 74, 20 80
            C 25 86, 38 88, 48 83
            C 50 85, 52 85, 54 83
            C 64 88, 77 86, 82 80
            C 92 74, 95 60, 90 52
            C 94 40, 88 30, 80 28
            C 76 15, 62 10, 52 18 Z" 
          />
          
          {/* Inner Sulci & Gyri Brain Creases */}
          {/* Right hemisphere folds */}
          <path d="M 64 32 C 60 40, 68 46, 74 42" strokeWidth="5.5" />
          <path d="M 58 60 C 64 56, 72 62, 70 70" strokeWidth="5.5" />
          <path d="M 62 48 C 66 50, 76 49, 78 54" strokeWidth="5.5" />
          
          {/* Left hemisphere subtle folds */}
          <path d="M 38 72 C 34 76, 28 72, 28 66" strokeWidth="5.5" />
          <path d="M 44 80 C 44 74, 38 70, 34 70" strokeWidth="5.5" />
          
          {/* Center Dividing Sulcus Base */}
          <path d="M 51 20 C 51 28, 49 34, 49 38" strokeWidth="5" />
        </g>

        {/* ── Animated Teal Magnifying Glass with Question Mark '?' ── */}
        {isAnimated ? (
          <motion.g
            animate={
              active
                ? {
                    x: [0, -3, 3, -1, 0],
                    y: [0, -2, 2, -1, 0],
                    rotate: [0, -6, 6, -3, 0],
                    scale: [1, 1.05, 0.98, 1.03, 1],
                  }
                : {}
            }
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{ originX: '36px', originY: '42px' }}
          >
            {/* Magnifier Lens Background glow */}
            <circle cx="36" cy="42" r="16" fill="rgba(6, 182, 212, 0.15)" />

            {/* Magnifier Circular Rim */}
            <circle
              cx="36"
              cy="42"
              r="16"
              stroke="#06b6d4"
              strokeWidth="6"
              strokeLinecap="round"
              fill="rgba(6, 182, 212, 0.08)"
            />

            {/* Magnifier Diagonal Handle */}
            <path
              d="M 24 54 L 11 72"
              stroke="#06b6d4"
              strokeWidth="7"
              strokeLinecap="round"
            />
            {/* Handle Grip Accent */}
            <path
              d="M 20 60 L 13 70"
              stroke="#22d3ee"
              strokeWidth="4"
              strokeLinecap="round"
            />

            {/* Question Mark '?' Inside Lens */}
            {/* Question Mark Arc */}
            <path
              d="M 31 37 C 31 32, 41 32, 41 38 C 41 42, 36 43, 36 47"
              stroke="#06b6d4"
              strokeWidth="3.8"
              strokeLinecap="round"
              fill="none"
            />
            {/* Question Mark Dot */}
            <circle cx="36" cy="51" r="2.2" fill="#06b6d4" />
          </motion.g>
        ) : (
          <g>
            {/* Static Magnifier Lens */}
            <circle cx="36" cy="42" r="16" fill="rgba(6, 182, 212, 0.15)" />
            <circle
              cx="36"
              cy="42"
              r="16"
              stroke="#06b6d4"
              strokeWidth="6"
              strokeLinecap="round"
              fill="rgba(6, 182, 212, 0.08)"
            />
            <path
              d="M 24 54 L 11 72"
              stroke="#06b6d4"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <path
              d="M 31 37 C 31 32, 41 32, 41 38 C 41 42, 36 43, 36 47"
              stroke="#06b6d4"
              strokeWidth="3.8"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="36" cy="51" r="2.2" fill="#06b6d4" />
          </g>
        )}
      </svg>
    </div>
  );
};

export default DeepSearchIcon;
