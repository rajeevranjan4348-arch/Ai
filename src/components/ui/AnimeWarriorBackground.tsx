import React, { useMemo } from 'react';

export interface AnimeWarriorBackgroundProps {
  customImage?: string;
  overlayOpacity?: number;
  isUIActive?: boolean;
}

export const AnimeWarriorBackground: React.FC<AnimeWarriorBackgroundProps> = ({
  customImage,
  overlayOpacity = 0.15,
  isUIActive = false,
}) => {
  // Generate floating warm golden-orange ember particles
  const embers = useMemo(() => {
    return Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: 50 + Math.random() * 50,
      size: 1.5 + Math.random() * 3,
      duration: 3 + Math.random() * 4,
      delay: Math.random() * 4,
      opacity: 0.4 + Math.random() * 0.6,
    }));
  }, []);

  return (
    <div
      id="anime-warrior-background"
      className="fixed inset-0 w-screen h-screen min-h-[100dvh] pointer-events-none overflow-hidden z-0 select-none bg-[#050302]"
    >
      {/* ── 1. If direct image supplied, render pixel-for-pixel ── */}
      {customImage ? (
        <img
          src={customImage}
          alt="Anime Wallpaper"
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
        /* ── 2. High-Fidelity Vector Artwork (Orange-Haired Warrior & Glowing Amber Eye) ── */
        <div className="absolute inset-0 pointer-events-none z-0 flex items-center justify-center">
          {/* Ambient Warm Golden Aura Glow on the Right Side */}
          <div className="absolute top-1/4 -right-20 w-[550px] h-[550px] rounded-full bg-orange-600/20 blur-[130px] pointer-events-none" />
          <div className="absolute top-1/3 right-10 w-[300px] h-[300px] rounded-full bg-amber-500/25 blur-[90px] pointer-events-none" />
          <div className="absolute top-1/2 -left-20 w-[400px] h-[400px] rounded-full bg-orange-950/30 blur-[140px] pointer-events-none" />

          {/* Dynamic Laser / Aura Horizontal Beam in Background (Right Edge) */}
          <div
            className="absolute top-[67%] right-0 w-[45vw] h-[3px] bg-gradient-to-l from-amber-400 via-orange-500 to-transparent pointer-events-none z-[1]"
            style={{
              boxShadow: '0 0 16px 4px rgba(255, 140, 0, 0.85), 0 0 35px 8px rgba(255, 100, 0, 0.5)',
            }}
          />

          <svg
            className="w-full h-full object-cover pointer-events-none z-[1]"
            viewBox="0 0 1080 1920"
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Fiery Orange Hair Gradients */}
              <linearGradient id="hairBaseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff9a3c" />
                <stop offset="30%" stopColor="#f76707" />
                <stop offset="70%" stopColor="#d9480f" />
                <stop offset="100%" stopColor="#7c2d12" />
              </linearGradient>

              <linearGradient id="hairHighlightGrad" x1="20%" y1="0%" x2="80%" y2="100%">
                <stop offset="0%" stopColor="#ffd8a8" />
                <stop offset="25%" stopColor="#ffa94d" />
                <stop offset="60%" stopColor="#fd7e14" />
                <stop offset="100%" stopColor="#c92a2a" />
              </linearGradient>

              <linearGradient id="hairDarkShade" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#451a03" />
                <stop offset="60%" stopColor="#1c0a00" />
                <stop offset="100%" stopColor="#0a0300" />
              </linearGradient>

              {/* Glowing Golden Amber Eye Gradients */}
              <radialGradient id="amberEyeGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="20%" stopColor="#fff3bf" />
                <stop offset="45%" stopColor="#fab005" />
                <stop offset="75%" stopColor="#e67700" />
                <stop offset="95%" stopColor="#a61e4d" />
                <stop offset="100%" stopColor="#210500" />
              </radialGradient>

              {/* Dark Leather High Coat & Collar */}
              <linearGradient id="coatGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#181824" />
                <stop offset="40%" stopColor="#0d0e14" />
                <stop offset="80%" stopColor="#050508" />
                <stop offset="100%" stopColor="#020204" />
              </linearGradient>

              <linearGradient id="collarRimGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#2a2b3d" />
                <stop offset="50%" stopColor="#43475d" />
                <stop offset="85%" stopColor="#ff922b" />
                <stop offset="100%" stopColor="#ffd43b" />
              </linearGradient>

              {/* Face Skin Tone & Warm Rim Lighting */}
              <linearGradient id="faceSkinGrad" x1="0%" y1="30%" x2="100%" y2="70%">
                <stop offset="0%" stopColor="#3d1e14" />
                <stop offset="45%" stopColor="#7c3a21" />
                <stop offset="80%" stopColor="#c05621" />
                <stop offset="95%" stopColor="#f6ad55" />
                <stop offset="100%" stopColor="#ffedd5" />
              </linearGradient>

              <filter id="eyeAmberGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* ── Background Deep Silhouette Shadow ── */}
            <rect width="1080" height="1920" fill="#060302" />

            {/* ── High-Contrast Face Silhouette & Nose Bridge ── */}
            <path
              d="M320,500 
                 C350,650 420,800 520,920 
                 C620,1030 720,1100 850,1180 
                 L880,950 
                 C870,820 850,750 820,680 
                 C800,600 750,550 700,500 Z"
              fill="url(#faceSkinGrad)"
              opacity="0.92"
            />

            {/* Face Shadow / Contour */}
            <path
              d="M360,550 
                 C400,680 460,800 550,900 
                 C630,980 700,1040 760,1100 
                 L480,1050 
                 C400,900 350,750 340,620 Z"
              fill="#180b06"
              opacity="0.65"
            />

            {/* ── The Piercing Golden Amber Eye ── */}
            <g id="fierceGoldenEye" filter="url(#eyeAmberGlow)">
              {/* Outer Amber Aura Glow around Eye */}
              <ellipse cx="660" cy="780" rx="90" ry="45" fill="#f76707" opacity="0.35" />
              <ellipse cx="660" cy="780" rx="55" ry="28" fill="#ffd43b" opacity="0.45" />

              {/* Eye Socket Shadow & Intense Upper Eyelid / Brow crease */}
              <path
                d="M560,745 
                   C610,725 710,740 770,785 
                   C740,795 640,760 560,745 Z"
                fill="#0a0402"
              />

              {/* Eye Sclera (Dark in shadow) */}
              <path
                d="M580,765 
                   Q660,735 745,785 
                   Q660,825 580,765 Z"
                fill="#2c1208"
              />

              {/* Glowing Amber Iris */}
              <circle cx="660" cy="775" r="32" fill="url(#amberEyeGrad)" />

              {/* Intricate Iris Radial Ring & Rings */}
              <circle cx="660" cy="775" r="26" fill="none" stroke="#ffe066" strokeWidth="2.5" opacity="0.85" />
              <circle cx="660" cy="775" r="18" fill="none" stroke="#d9480f" strokeWidth="2" opacity="0.7" />

              {/* Dark Pupil */}
              <circle cx="660" cy="775" r="11" fill="#0d0300" />

              {/* Sharp Catchlight Reflection */}
              <circle cx="650" cy="767" r="5" fill="#ffffff" />
              <circle cx="668" cy="782" r="3" fill="#ffe066" />

              {/* Sharp Dark Eyelash Rim */}
              <path
                d="M575,765 
                   C620,740 700,750 755,790"
                stroke="#080200"
                strokeWidth="7"
                strokeLinecap="round"
                fill="none"
              />
              {/* Lower Eyelid Line */}
              <path
                d="M590,775 
                   C640,810 710,810 745,790"
                stroke="#3d1305"
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
              />
            </g>

            {/* ── Spiky Fiery Orange Hair Strands (Detailed Layered Locks) ── */}
            {/* Dark Under-Hair Base */}
            <g fill="url(#hairDarkShade)">
              <path d="M0,0 L1080,0 L1080,600 C950,500 800,450 650,480 C500,400 350,380 200,450 C100,500 0,650 0,800 Z" />
            </g>

            {/* Mid-Tone Vibrant Hair Strands */}
            <g fill="url(#hairBaseGrad)">
              {/* Left Top Spikes */}
              <polygon points="120,0 220,380 50,220" />
              <polygon points="180,0 290,480 120,360" />
              <polygon points="260,0 380,560 210,420" />
              <polygon points="340,0 470,620 300,500" />
              
              {/* Center Forehead Bangs falling over Brow */}
              <polygon points="420,100 560,710 400,520" />
              <polygon points="490,150 620,730 460,560" />
              <polygon points="560,120 700,690 530,540" />

              {/* Right Crown & Sweeping Fiery Spikes */}
              <polygon points="620,0 800,490 600,380" />
              <polygon points="720,0 920,540 680,420" />
              <polygon points="820,0 1020,580 780,460" />
              <polygon points="900,100 1080,680 850,520" />
              <polygon points="960,250 1080,850 900,620" />
              <polygon points="980,450 1080,1050 920,800" />
            </g>

            {/* Fine Luminous Foreground Highlights & Hair Tips */}
            <g fill="url(#hairHighlightGrad)">
              {/* Foreground Bangs cascading near the Eye */}
              <path d="M480,250 Q540,550 580,720 Q530,580 460,350 Z" />
              <path d="M530,280 Q610,580 670,720 Q600,580 510,380 Z" />
              <path d="M600,300 Q690,560 760,680 Q680,540 580,360 Z" />
              <path d="M380,320 Q460,580 500,740 Q440,580 360,400 Z" />
              <path d="M280,300 Q360,540 410,680 Q350,540 270,390 Z" />

              {/* Right Fiery Rim Highlights */}
              <path d="M780,150 Q920,420 1040,650 Q880,440 750,220 Z" />
              <path d="M850,280 Q980,540 1080,780 Q930,560 810,360 Z" />
              <path d="M880,450 Q1010,700 1080,950 Q950,720 840,530 Z" />
            </g>

            {/* Fine Hair Strand Lines for Realistic Texture */}
            <g stroke="#ffa94d" strokeWidth="2.2" fill="none" opacity="0.8">
              <path d="M250,50 Q360,420 440,620" />
              <path d="M320,60 Q430,450 510,680" />
              <path d="M410,70 Q510,480 590,710" />
              <path d="M480,80 Q580,500 660,710" />
              <path d="M560,90 Q660,500 730,680" />
              <path d="M650,80 Q760,480 840,640" />
              <path d="M740,120 Q870,500 970,720" />
              <path d="M820,180 Q950,560 1040,820" />
            </g>
            <g stroke="#ffd8a8" strokeWidth="1.2" fill="none" opacity="0.65">
              <path d="M360,100 Q450,420 530,650" />
              <path d="M450,110 Q530,440 610,680" />
              <path d="M520,120 Q610,480 690,700" />
              <path d="M700,140 Q820,460 920,670" />
            </g>

            {/* ── Dark High Black Leather Collar / Cloak Covering Lower Face ── */}
            <g id="blackCollarCoat">
              {/* Outer Deep Coat Mass */}
              <path
                d="M0,1000 
                   L950,1220 
                   C900,1320 840,1480 800,1650 
                   C750,1800 700,1920 650,1920 
                   L0,1920 Z"
                fill="url(#coatGrad)"
              />

              {/* Main Sharp High Collar Diagonal Fold */}
              <path
                d="M-20,950 
                   L960,1210 
                   C930,1380 850,1580 750,1750 
                   L0,1920 Z"
                fill="#07080c"
              />

              {/* Collar Shadow Crease & Fold Inner Geometry */}
              <path
                d="M0,1250 
                   L820,1400 
                   C780,1550 720,1700 640,1850 
                   L0,1920 Z"
                fill="#030406"
              />

              {/* Prominent High Collar Rim Edge (Highlight with Amber Rim Glow) */}
              <path
                d="M-20,950 L960,1210"
                stroke="url(#collarRimGrad)"
                strokeWidth="5.5"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M500,1095 L960,1210"
                stroke="#ff922b"
                strokeWidth="3"
                opacity="0.85"
                fill="none"
              />

              {/* Collar Leather Stitching Line */}
              <path
                d="M-10,970 L940,1225"
                stroke="#1e202f"
                strokeWidth="2"
                strokeDasharray="8,6"
                fill="none"
                opacity="0.75"
              />

              {/* Lower Neck Shadow beneath Collar */}
              <path
                d="M480,1050 Q750,1180 940,1220 Q700,1260 450,1180 Z"
                fill="#000000"
                opacity="0.9"
              />
            </g>
          </svg>
        </div>
      )}

      {/* ── 3. Rising Warm Golden Embers ── */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden z-[2]"
        style={{ transform: 'translateZ(0)' }}
      >
        {embers.map((ember) => (
          <div
            key={`ember-${ember.id}`}
            className="absolute rounded-full pointer-events-none will-change-transform"
            style={{
              left: `${ember.x}vw`,
              top: `${ember.y}vh`,
              width: `${ember.size}px`,
              height: `${ember.size}px`,
              backgroundColor: ember.id % 3 === 0 ? '#ffea79' : ember.id % 2 === 0 ? '#ff922b' : '#f76707',
              boxShadow:
                ember.id % 3 === 0
                  ? '0 0 8px 2px rgba(255, 234, 121, 0.9), 0 0 16px 4px rgba(255, 146, 43, 0.7)'
                  : '0 0 8px 2px rgba(255, 146, 43, 0.85), 0 0 14px 4px rgba(247, 103, 7, 0.5)',
              animation: `fastEmberRise ${ember.duration}s ease-in-out infinite`,
              animationDelay: `${ember.delay}s`,
              ['--ember-opacity' as any]: ember.opacity,
              ['--ember-sway' as any]: ember.id % 2 === 0 ? 1 : -1,
              transform: 'translate3d(0, 0, 0)',
            }}
          />
        ))}
      </div>

      {/* ── 4. Clean Non-Distorting Readability Overlay ── */}
      {overlayOpacity > 0 && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300 z-[3]"
          style={{
            backgroundColor: `rgba(4, 2, 2, ${isUIActive ? overlayOpacity * 1.2 : overlayOpacity})`,
          }}
        />
      )}
    </div>
  );
};

export default AnimeWarriorBackground;
