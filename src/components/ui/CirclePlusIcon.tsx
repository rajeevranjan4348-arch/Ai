import React from 'react';

interface CirclePlusIconProps {
  size?: number;
  className?: string;
}

export const CirclePlusIcon: React.FC<CirclePlusIconProps> = ({
  size = 20,
  className = '',
}) => {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 overflow-visible select-none ${className}`}
    >
      {/* Outer Thick Circular Ring matching uploaded add_3914337.png */}
      <circle
        cx="50"
        cy="50"
        r="42"
        stroke="currentColor"
        strokeWidth="11"
        fill="none"
      />
      {/* Centered Thick Rounded Cross / Plus Symbol */}
      <path
        d="M 50 29 V 71 M 29 50 H 71"
        stroke="currentColor"
        strokeWidth="12"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default CirclePlusIcon;
