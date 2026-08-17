import React from 'react';

export interface GojoAnimeBackgroundProps {
  customImage?: string; // Optional user uploaded base64 / URL background
  overlayOpacity?: number;
  isUIActive?: boolean;
}

export const GojoAnimeBackground: React.FC<GojoAnimeBackgroundProps> = ({
  customImage,
  overlayOpacity = 0.15,
  isUIActive = false,
}) => {
  return (
    <div className="fixed inset-0 w-screen h-screen min-h-[100dvh] pointer-events-none overflow-hidden z-0 select-none bg-[#03050d]">
      {/* ── Immutable Source Image Background ── */}
      {customImage ? (
        <img
          src={customImage}
          alt="Immutable Protected Background Asset"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0 select-none"
          loading="eager"
          decoding="async"
          style={{
            filter: 'none',
            imageRendering: 'auto',
            transform: 'translateZ(0)',
          }}
        />
      ) : (
        /* ── High-Fidelity Static Gojo Satoru Wallpaper Artwork ── */
        <div className="absolute inset-0 pointer-events-none z-0 flex items-center justify-center">
          {/* Static Ambient Cursed Energy Glow */}
          <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] rounded-full bg-blue-600/25 blur-[130px] pointer-events-none" />
          <div className="absolute bottom-1/4 left-1/3 w-[500px] h-[500px] rounded-full bg-cyan-500/15 blur-[120px] pointer-events-none" />

          {/* Gojo Vector Portrait Artwork */}
          <svg
            className="w-full h-full object-cover pointer-events-none"
            viewBox="0 0 1000 1800"
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <radialGradient id="gojoEyeGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="25%" stopColor="#7dd3fc" />
                <stop offset="60%" stopColor="#2563eb" />
                <stop offset="90%" stopColor="#1e3a8a" />
                <stop offset="100%" stopColor="#000000" />
              </radialGradient>

              <linearGradient id="blindfoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#111827" />
                <stop offset="50%" stopColor="#030712" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>

              <linearGradient id="hairGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="40%" stopColor="#e0f2fe" />
                <stop offset="80%" stopColor="#bae6fd" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>

              <filter id="eyeGlowFilter" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="8" />
              </filter>
            </defs>

            {/* Dark High Collar Jacket Base */}
            <path
              d="M100,1800 L300,1050 C380,950 420,850 480,800 C550,800 620,880 700,980 L900,1800 Z"
              fill="#080c18"
            />
            {/* High Collar Fold */}
            <path
              d="M180,1250 C300,1100 380,920 480,880 C580,920 680,1100 800,1250 L850,1800 L150,1800 Z"
              fill="#030712"
              stroke="#1e293b"
              strokeWidth="2"
            />

            {/* Gojo Spiky Silver-White Hair Background Arc */}
            <g fill="url(#hairGrad)" opacity="0.95">
              <path d="M220,500 Q150,300 280,200 Q350,150 450,120 Q550,100 650,150 Q780,220 820,400 Q720,320 620,380 Q500,280 380,350 Z" />
              <path d="M180,420 Q100,250 250,150 Q320,100 420,80 Q520,60 620,100 Q750,160 850,320 Q720,240 620,290 Z" />
              {/* Top Hair Spikes */}
              <polygon points="450,120 420,0 490,90" />
              <polygon points="520,100 560,10 580,110" />
              <polygon points="360,160 300,30 390,130" />
              <polygon points="620,140 680,20 640,150" />
            </g>

            {/* Face Contour */}
            <path
              d="M320,450 C320,680 420,780 500,780 C580,780 680,680 680,450 Z"
              fill="#f1f5f9"
              opacity="0.9"
            />

            {/* Black Leather Blindfold/Mask */}
            <path
              d="M260,380 C360,350 640,350 740,380 L760,520 C640,560 360,560 240,520 Z"
              fill="url(#blindfoldGrad)"
              stroke="#3b82f6"
              strokeWidth="1.5"
              opacity="0.98"
            />
            {/* Blindfold Folds */}
            <path d="M280,410 Q500,430 720,410" stroke="#1e293b" strokeWidth="3" fill="none" />
            <path d="M270,460 Q500,485 730,460" stroke="#0f172a" strokeWidth="4" fill="none" />

            {/* ── Iconic Electric Blue Eye Peeking Beneath Blindfold ── */}
            <g>
              {/* Outer Cyan Halo */}
              <ellipse cx="610" cy="495" rx="38" ry="22" fill="#38bdf8" opacity="0.65" filter="url(#eyeGlowFilter)" />
              {/* Eye Shape */}
              <path
                d="M570,495 Q610,470 650,495 Q610,520 570,495 Z"
                fill="#030712"
                stroke="#60a5fa"
                strokeWidth="2"
              />
              {/* Glowing Blue Iris */}
              <circle cx="610" cy="495" r="16" fill="url(#gojoEyeGradient)" />
              <circle cx="610" cy="495" r="7" fill="#020617" />
              {/* Pupil Sparkle Highlights */}
              <circle cx="605" cy="491" r="3.5" fill="#ffffff" />
              <circle cx="615" cy="498" r="2" fill="#e0f2fe" />
            </g>

            {/* Forehead Hair Bangs overlaying Blindfold */}
            <g fill="url(#hairGrad)">
              <polygon points="320,320 360,450 400,340" />
              <polygon points="410,330 460,480 490,350" />
              <polygon points="500,340 530,440 560,330" />
              <polygon points="570,320 620,430 650,330" />
            </g>

            {/* Bottom Dark Gradient Fog */}
            <rect x="0" y="1200" width="1000" height="600" fill="url(#blindfoldGrad)" opacity="0.9" />
          </svg>
        </div>
      )}

      {/* Subtle Readability Layer */}
      {overlayOpacity > 0 && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300 z-[2]"
          style={{
            backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})`,
          }}
        />
      )}
    </div>
  );
};

