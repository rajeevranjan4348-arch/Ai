import React, { useMemo, useRef, useEffect, useState } from 'react';
import { useSettingsStore } from '@/lib/settingsStore';
import { GojoAnimeBackground } from './GojoAnimeBackground';
import { AnimeWarriorBackground } from './AnimeWarriorBackground';
import { LiveWallpaperCanvas } from './LiveWallpaperCanvas';
import { VideoWallpaperBackground } from './VideoWallpaperBackground';

interface MotionBackgroundProps {
  videoSrc?: string;
  posterSrc?: string;
  overlayOpacity?: number; // 0.0 - 1.0
  playbackSpeed?: number; // 1.0 - 3.0
  brightness?: number; // 1.0 - 2.5
  isUIActive?: boolean;
}

interface Ember {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

interface Petal {
  id: number;
  startX: number;
  startY: number;
  size: number;
  rotation: number;
  duration: number;
  delay: number;
}

interface SamuraiVideoBackgroundProps {
  videoSrc?: string;
  posterSrc?: string;
  overlayOpacity: number;
  playbackSpeed: number;
  brightness: number;
  reduceMotion?: boolean;
}

export const SamuraiVideoBackground: React.FC<SamuraiVideoBackgroundProps> = ({
  videoSrc = '/samurai-background.mp4',
  posterSrc = '/samurai-poster.jpg',
  overlayOpacity,
  playbackSpeed = 1.1,
  brightness = 1.2,
  reduceMotion = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState<boolean>(false);
  const [hasVideoError, setHasVideoError] = useState<boolean>(false);

  // Lifecycle control: Autoplay, Loop, Seamless playback speed and pause/resume on tab blur/visibility
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const applyPlaybackRate = () => {
      try {
        video.playbackRate = playbackSpeed;
      } catch {
        // Fallback gracefully
      }
    };

    const handleLoaded = () => {
      setIsVideoLoaded(true);
      applyPlaybackRate();
      video.play().catch(() => {});
    };

    const handleError = () => {
      setHasVideoError(true);
      setIsVideoLoaded(true);
    };

    // Performance optimization: Pause video when page is hidden/tab is inactive, resume on active
    const handleVisibilityChange = () => {
      if (document.hidden) {
        video.pause();
      } else {
        video.play().then(applyPlaybackRate).catch(() => {});
      }
    };

    video.addEventListener('loadeddata', handleLoaded);
    video.addEventListener('loadedmetadata', applyPlaybackRate);
    video.addEventListener('play', applyPlaybackRate);
    video.addEventListener('playing', applyPlaybackRate);
    video.addEventListener('canplay', handleLoaded);
    video.addEventListener('error', handleError);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initial trigger
    if (video.readyState >= 2) {
      setIsVideoLoaded(true);
      applyPlaybackRate();
    }

    return () => {
      video.removeEventListener('loadeddata', handleLoaded);
      video.removeEventListener('loadedmetadata', applyPlaybackRate);
      video.removeEventListener('play', applyPlaybackRate);
      video.removeEventListener('playing', applyPlaybackRate);
      video.removeEventListener('canplay', handleLoaded);
      video.removeEventListener('error', handleError);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [playbackSpeed, videoSrc]);

  // Dynamic animation durations scaled by playbackSpeed for pure CSS keyframe speed
  const speedFactor = Math.max(0.5, playbackSpeed);

  // Generate deterministic ultra-fast embers (boosted speed, count & high luminosity)
  const embers: Ember[] = useMemo(() => {
    return Array.from({ length: 36 }, (_, i) => ({
      id: i,
      x: ((i * 31) % 100),
      y: 35 + ((i * 23) % 60),
      size: 2.5 + ((i * 3) % 4),
      // Fast, dynamic rising speed adjusted by speedFactor
      duration: Math.max(0.7, (1.2 + ((i * 5) % 15) / 10) / speedFactor),
      delay: (i * 0.1) % 1.8,
      opacity: 0.8 + ((i * 11) % 20) / 100,
    }));
  }, [speedFactor]);

  // Generate fast-drifting wind-blown cherry blossom petals
  const petals: Petal[] = useMemo(() => {
    return Array.from({ length: 28 }, (_, i) => ({
      id: i,
      startX: ((i * 19) % 85) + 5,
      startY: ((i * 11) % 35) - 15,
      size: 7 + ((i * 4) % 8),
      rotation: (i * 35) % 360,
      // High-velocity wind drift adjusted by speedFactor
      duration: Math.max(1.2, (2.2 + ((i * 7) % 17) / 10) / speedFactor),
      delay: (i * 0.15) % 2.5,
    }));
  }, [speedFactor]);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 w-screen h-screen min-h-[100dvh] pointer-events-none overflow-hidden z-0 select-none bg-[#050308]"
      aria-hidden="true"
      style={{
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
        perspective: '1000px',
      }}
    >
      {/* ── High-FPS GPU Keyframe Styles (No CPU Overhead, Pure 60-120 FPS Compositor) ── */}
      <style>{`
        @keyframes fastEmberRise {
          0% {
            transform: translate3d(0, 0, 0) scale(0.8);
            opacity: 0;
          }
          15% {
            opacity: var(--ember-opacity, 1);
            transform: translate3d(calc(var(--ember-sway, 1) * 10px), -15vh, 0) scale(1.4);
          }
          80% {
            opacity: var(--ember-opacity, 0.9);
            transform: translate3d(calc(var(--ember-sway, 1) * -14px), -50vh, 0) scale(1.1);
          }
          100% {
            transform: translate3d(calc(var(--ember-sway, 1) * 18px), -75vh, 0) scale(0.3);
            opacity: 0;
          }
        }

        @keyframes fastPetalDrift {
          0% {
            transform: translate3d(0, 0, 0) rotate(0deg);
            opacity: 0;
          }
          12% {
            opacity: 1;
          }
          88% {
            opacity: 0.95;
          }
          100% {
            transform: translate3d(38vw, 120vh, 0) rotate(480deg);
            opacity: 0;
          }
        }

        @keyframes eclipsePulseFast {
          0%, 100% {
            transform: translate3d(-50%, 0, 0) scale(1);
            opacity: 0.7;
          }
          50% {
            transform: translate3d(-50%, 0, 0) scale(1.12);
            opacity: 0.95;
          }
        }

        @keyframes waterCausticShimmer {
          0%, 100% {
            opacity: 0.8;
            transform: scaleX(1) translate3d(0, 0, 0);
          }
          50% {
            opacity: 1;
            transform: scaleX(1.04) translate3d(0, -3px, 0);
          }
        }

        @keyframes bladeGleamFlash {
          0%, 75%, 100% {
            opacity: 0.85;
            filter: drop-shadow(0 0 8px rgba(255, 60, 80, 0.9));
          }
          88% {
            opacity: 1;
            filter: drop-shadow(0 0 18px rgba(255, 255, 255, 1)) drop-shadow(0 0 28px rgba(255, 30, 60, 1));
          }
        }
      `}</style>

      {/* ── Fallback Static Poster (Shown while loading or if video playback fails) ── */}
      <div 
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 pointer-events-none z-0 ${
          isVideoLoaded && !hasVideoError ? 'opacity-0' : 'opacity-100'
        }`}
        style={{
          backgroundImage: `url(${posterSrc})`,
          filter: `brightness(${brightness}) contrast(1.15) saturate(1.25)`,
          transform: 'translateZ(0)',
          willChange: 'transform',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
        }}
      />

      {/* ── Full-Screen Background Video Layer (Fixed, Edge-to-Edge, Smooth Fade-in, Object-cover) ── */}
      {videoSrc && !hasVideoError && (
        <div 
          className={`absolute inset-0 overflow-hidden pointer-events-none z-0 transition-opacity duration-700 ${
            isVideoLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            transform: 'translateZ(0)',
            willChange: 'transform',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          <video
            ref={videoRef}
            src={videoSrc}
            poster={posterSrc}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            disablePictureInPicture
            disableRemotePlayback
            className="w-full h-full object-cover pointer-events-none"
            style={{
              filter: `brightness(${brightness}) contrast(1.2) saturate(1.3) drop-shadow(0 0 20px rgba(255, 30, 60, 0.2))`,
              imageRendering: '-webkit-optimize-contrast',
              transform: 'translate3d(0, 0, 0)',
              willChange: 'transform, filter',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transition: 'filter 0.4s ease-out',
            }}
            onError={() => {
              setHasVideoError(true);
            }}
          />
        </div>
      )}

      {/* ── Bright Vibrant Crimson Cosmic Nebula Atmosphere ── */}
      <div 
        className="absolute inset-0 opacity-80 mix-blend-screen pointer-events-none z-[1]"
        style={{
          backgroundImage: `radial-gradient(ellipse 95% 65% at 50% 20%, rgba(255, 35, 65, 0.6), transparent 75%),
                            radial-gradient(ellipse 80% 55% at 80% 30%, rgba(255, 25, 55, 0.5), transparent 65%),
                            radial-gradient(ellipse 70% 45% at 15% 15%, rgba(235, 15, 45, 0.5), transparent 65%)`,
          transform: 'translateZ(0)',
        }}
      />

      {/* ── High-Fidelity Razor-Sharp SVG Art: Blood Eclipse, Twisted Cherry Tree, Ronin Samurai & Crimson Water ── */}
      <svg
        className="absolute inset-0 w-full h-full object-cover pointer-events-none z-[2]"
        viewBox="0 0 1000 1800"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        style={{ 
          willChange: 'transform', 
          transform: 'translateZ(0)',
          shapeRendering: 'geometricPrecision',
          textRendering: 'geometricPrecision',
        }}
      >
        <defs>
          {/* Luminous Blood Eclipse Halo Radial Flare */}
          <radialGradient id="eclipseHalo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ff2848" stopOpacity="1" />
            <stop offset="30%" stopColor="#ff0f2c" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#d9051c" stopOpacity="0.55" />
            <stop offset="85%" stopColor="#800010" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>

          {/* Intense Inner Eclipse Ring Flare */}
          <linearGradient id="ringGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="18%" stopColor="#ff6677" />
            <stop offset="50%" stopColor="#ff142e" />
            <stop offset="82%" stopColor="#e6001a" />
            <stop offset="100%" stopColor="#ff4455" />
          </linearGradient>

          {/* Water Crimson Glow & Reflection Gradient */}
          <linearGradient id="waterGlowGrad" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#ff2238" stopOpacity="0.95" />
            <stop offset="25%" stopColor="#e6001c" stopOpacity="0.7" />
            <stop offset="60%" stopColor="#7a0010" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0d0205" stopOpacity="0.95" />
          </linearGradient>

          {/* Katana Edge Blade Gradient */}
          <linearGradient id="katanaBlade" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="20%" stopColor="#fff0f2" />
            <stop offset="60%" stopColor="#ff3b50" />
            <stop offset="100%" stopColor="#55000a" />
          </linearGradient>

          {/* Crisp, Sharp Subtle Glow Filters */}
          <filter id="crispGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
          </filter>
          <filter id="bladeGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
          </filter>
        </defs>

        {/* ── 1. The Blood Solar Eclipse (Center-Top Sky) ── */}
        <g transform="translate(500, 390)">
          {/* Outer Atmospheric Corona Flare */}
          <circle cx="0" cy="0" r="320" fill="url(#eclipseHalo)" />

          {/* Second Atmospheric Ring Flare */}
          <circle cx="0" cy="0" r="236" fill="none" stroke="#ff283e" strokeWidth="32" opacity="0.65" filter="url(#crispGlow)" />

          {/* Sharp Intense Crimson Solar Eclipse Ring */}
          <circle cx="0" cy="0" r="210" fill="none" stroke="url(#ringGlow)" strokeWidth="15" filter="url(#bladeGlow)" />
          <circle cx="0" cy="0" r="210" fill="none" stroke="#ffffff" strokeWidth="4.5" opacity="0.98" />

          {/* Jet Black Occulting Moon Core */}
          <circle cx="0" cy="0" r="202" fill="#040306" />

          {/* Internal Moon Shadow Depth */}
          <circle cx="-14" cy="-14" r="193" fill="#020103" opacity="0.95" />
        </g>

        {/* ── 2. Gnarled Twisted Cherry Blossom Tree (Left Flank & Top Arch) ── */}
        <g fill="#0b0a10" stroke="#040407" strokeWidth="1">
          {/* Main Massive Trunk on Left */}
          <path d="M-50,0 C-10,350 40,550 120,780 C180,950 140,1180 -20,1400 L-100,1800 L-150,0 Z" />
          
          {/* Big Gnarled Primary Branch Arching Over Eclipse */}
          <path d="M120,780 C200,660 270,510 320,380 C360,270 420,180 560,110 C620,80 720,60 840,90 C800,110 700,125 610,165 C480,225 400,345 340,490 C260,670 190,820 120,780 Z" />

          {/* Secondary Upper Branch System */}
          <path d="M320,380 C300,280 320,190 360,120 C380,80 430,40 480,20 C440,35 390,75 355,140 C320,210 290,290 320,380 Z" />

          {/* Upper Right Twigs Covering Eclipse */}
          <path d="M560,110 C630,170 710,210 790,230 C740,235 670,210 600,165 Z" />
          <path d="M420,180 C480,230 520,310 560,390 C530,360 490,290 440,240 Z" />
          <path d="M220,600 C280,570 360,575 440,610 C380,600 300,605 240,630 Z" />
        </g>

        {/* Glowing Crimson Cherry Blossoms & Leaves - High Contrast & Vibrancy */}
        <g fill="#ff2842" opacity="0.98" filter="drop-shadow(0 0 6px rgba(255, 40, 65, 0.9))">
          {/* Cluster near Top Eclipse Arc */}
          <circle cx="580" cy="130" r="6.5" /><circle cx="595" cy="140" r="5.5" /><circle cx="570" cy="150" r="7.5" />
          <circle cx="630" cy="180" r="6.5" /><circle cx="650" cy="190" r="5.5" /><circle cx="680" cy="205" r="7.5" />
          <circle cx="730" cy="220" r="6.5" /><circle cx="750" cy="210" r="5.5" /><circle cx="790" cy="235" r="8.5" />
          <circle cx="820" cy="220" r="6.5" /><circle cx="850" cy="170" r="7.5" /><circle cx="870" cy="160" r="5.5" />
          {/* Cluster on Left Branches */}
          <circle cx="340" cy="150" r="7.5" /><circle cx="370" cy="110" r="6.5" /><circle cx="440" cy="60" r="6.5" />
          <circle cx="280" cy="300" r="6.5" /><circle cx="250" cy="340" r="7.5" /><circle cx="220" cy="420" r="6.5" />
          <circle cx="310" cy="480" r="7.5" /><circle cx="360" cy="460" r="6.5" /><circle cx="420" cy="490" r="7.5" />
          <circle cx="160" cy="700" r="7.5" /><circle cx="190" cy="670" r="8.5" /><circle cx="230" cy="650" r="6.5" />
        </g>

        {/* ── 3. Reflective Crimson Water Basin (Bottom) ── */}
        <g transform="translate(0, 1340)" style={{ animation: reduceMotion ? 'none' : 'waterCausticShimmer 2.5s ease-in-out infinite' }}>
          {/* Water Base Surface Gradient */}
          <rect x="0" y="0" width="1000" height="460" fill="url(#waterGlowGrad)" opacity="0.9" />

          {/* Blood Eclipse Vertical Water Caustic Reflection */}
          <ellipse cx="500" cy="40" rx="170" ry="15" fill="#ff2842" opacity="0.85" filter="url(#crispGlow)" />
          <ellipse cx="500" cy="90" rx="210" ry="19" fill="#ee1830" opacity="0.75" filter="url(#crispGlow)" />
          <ellipse cx="500" cy="160" rx="250" ry="23" fill="#d90f25" opacity="0.65" filter="url(#crispGlow)" />
          <ellipse cx="500" cy="250" rx="300" ry="27" fill="#b3061a" opacity="0.5" filter="url(#crispGlow)" />
          <ellipse cx="500" cy="340" rx="360" ry="32" fill="#7a0011" opacity="0.4" filter="url(#crispGlow)" />

          {/* Water Wave Ripples Line Highlights */}
          <path d="M320,30 Q500,45 680,30" stroke="#ff6072" strokeWidth="3.5" fill="none" opacity="0.95" />
          <path d="M260,70 Q500,90 740,70" stroke="#ff4055" strokeWidth="3.8" fill="none" opacity="0.9" />
          <path d="M200,120 Q500,145 800,120" stroke="#ff263e" strokeWidth="3.2" fill="none" opacity="0.8" />
          <path d="M150,180 Q500,210 850,180" stroke="#eb162d" strokeWidth="2.8" fill="none" opacity="0.75" />
          <path d="M100,260 Q500,295 900,260" stroke="#c41024" strokeWidth="2.2" fill="none" opacity="0.65" />
          <path d="M50,350 Q500,390 950,350" stroke="#a0091a" strokeWidth="2" fill="none" opacity="0.5" />

          {/* Concentric Footstep Water Ripples Under Samurai */}
          <ellipse cx="500" cy="80" rx="125" ry="17" fill="none" stroke="#ff7585" strokeWidth="3.5" opacity="0.95" />
          <ellipse cx="500" cy="80" rx="185" ry="25" fill="none" stroke="#ff384e" strokeWidth="2.8" opacity="0.8" />
          <ellipse cx="500" cy="80" rx="260" ry="33" fill="none" stroke="#e6152a" strokeWidth="2" opacity="0.6" />

          {/* Floating Crimson Petals on Water Surface */}
          <ellipse cx="380" cy="65" rx="9.5" ry="5" fill="#ff3045" opacity="0.98" />
          <ellipse cx="620" cy="110" rx="11.5" ry="6" fill="#ff3b50" opacity="0.95" />
          <ellipse cx="440" cy="190" rx="10.5" ry="5.5" fill="#ff2238" opacity="0.9" />
          <ellipse cx="570" cy="230" rx="12.5" ry="6.5" fill="#ff4055" opacity="0.98" />
          <ellipse cx="310" cy="140" rx="8.5" ry="4.5" fill="#f8182f" opacity="0.9" />
          <ellipse cx="710" cy="270" rx="13.5" ry="7" fill="#ff263e" opacity="0.95" />
          <ellipse cx="230" cy="290" rx="10.5" ry="5.5" fill="#eb1228" opacity="0.85" />
          <ellipse cx="820" cy="180" rx="9.5" ry="5" fill="#ff485d" opacity="0.9" />
        </g>

        {/* ── 4. The Lone Ronin Samurai Silhouette ── */}
        <g id="roninSamurai">
          {/* Ambient Fiery Rim Light on Samurai Silhouette */}
          <path
            d="M500,560 
               C420,620 370,690 350,770 
               C335,840 310,950 280,1080 
               C260,1170 230,1260 210,1350 
               L790,1350 
               C770,1260 740,1170 720,1080 
               C690,950 665,840 650,770 
               C630,690 580,620 500,560 Z"
            fill="none"
            stroke="#ff2b42"
            strokeWidth="4.5"
            opacity="0.55"
            filter="url(#crispGlow)"
          />

          {/* Main Samurai Cloak & Body Silhouette */}
          <path
            d="M500,565 
               C430,615 385,680 365,760 
               C348,830 325,930 300,1050 
               C275,1160 250,1270 220,1380
               C290,1385 360,1390 430,1390
               C460,1320 480,1240 495,1140
               C505,1240 525,1320 555,1390
               C630,1390 710,1385 780,1380
               C750,1270 725,1160 700,1050
               C675,930 652,830 635,760
               C615,680 570,615 500,565 Z"
            fill="#06060a"
          />

          {/* Tattered Cloak Shreds & Wind-Blown Ribbons (Left Flank) */}
          <path d="M300,1050 C240,1100 180,1190 140,1290 C190,1270 230,1220 275,1160 Z" fill="#040407" />
          <path d="M340,920 C270,960 210,1040 170,1150 C220,1120 260,1060 310,990 Z" fill="#050509" />
          <path d="M260,1180 C200,1240 150,1330 110,1430 C160,1390 200,1320 240,1250 Z" fill="#030306" />

          {/* Wind-Blown Ribbons (Right Flank) */}
          <path d="M700,1050 C760,1100 820,1190 860,1290 C810,1270 770,1220 725,1160 Z" fill="#040407" />
          <path d="M660,920 C730,960 790,1040 830,1150 C780,1120 740,1060 690,990 Z" fill="#050509" />

          {/* Traditional Conical Kasa Straw Hat (Top Silhouette) */}
          <polygon points="500,520 670,655 330,655" fill="#040407" />
          <path d="M320,655 C430,642 570,642 680,655 L670,668 C560,655 440,655 330,668 Z" fill="#08080f" />
          {/* Hat Top Peak Crimson Edge Highlight */}
          <path d="M495,520 L505,520 L665,652 L655,654 Z" fill="#ff2a40" opacity="0.45" />

          {/* The Gleaming Katana Sword */}
          {/* Scabbard / Saya at Waist */}
          <path d="M550,960 L645,1020 L640,1030 L545,970 Z" fill="#020204" stroke="#ff3045" strokeWidth="1.4" opacity="0.95" />
          <circle cx="548" cy="965" r="8.5" fill="#e6b855" opacity="1" />

          {/* Drawn Curved Katana Blade */}
          <g style={{ animation: reduceMotion ? 'none' : 'bladeGleamFlash 2.2s ease-in-out infinite' }}>
            {/* Katana Tsuka (Hilt) */}
            <path d="M435,1070 L455,1110" stroke="#1f1f2a" strokeWidth="12" strokeLinecap="round" />
            {/* Tsuba (Guard) */}
            <ellipse cx="455" cy="1110" rx="11" ry="6.5" fill="#e6b855" transform="rotate(30, 455, 1110)" />
            {/* Steel Blade */}
            <path
              d="M458,1114 Q520,1250 610,1400 Q515,1250 456,1116 Z"
              fill="url(#katanaBlade)"
              filter="url(#bladeGlow)"
            />
            {/* Ultra Sharp White Edge Reflection on Katana */}
            <path
              d="M458,1114 Q520,1250 610,1400"
              stroke="#ffffff"
              strokeWidth="4"
              fill="none"
              opacity="1"
            />
            {/* Red Blood Light Glint on Tip in Water */}
            <circle cx="610" cy="1400" r="19" fill="#ff2238" opacity="0.95" filter="url(#crispGlow)" />
          </g>
        </g>
      </svg>

      {/* ── 5. Ultra Fast-Rising GPU-Accelerated Embers & Wind Petals ── */}
      {!reduceMotion && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-[3]" style={{ transform: 'translateZ(0)' }}>
          {/* Fast Floating Embers */}
          {embers.map((ember) => (
            <div
              key={`ember-${ember.id}`}
              className="absolute rounded-full pointer-events-none will-change-transform"
              style={{
                left: `${ember.x}vw`,
                top: `${ember.y}vh`,
                width: `${ember.size}px`,
                height: `${ember.size}px`,
                backgroundColor: ember.id % 4 === 0 ? '#ffffff' : ember.id % 2 === 0 ? '#ff5265' : '#ff1c32',
                boxShadow: ember.id % 4 === 0 
                  ? '0 0 10px 3px rgba(255, 255, 255, 0.95), 0 0 16px 6px rgba(255, 40, 70, 0.95)'
                  : '0 0 10px 3px rgba(255, 40, 70, 0.98), 0 0 18px 5px rgba(255, 15, 35, 0.75)',
                animation: `fastEmberRise ${ember.duration}s ease-in-out infinite`,
                animationDelay: `${ember.delay}s`,
                ['--ember-opacity' as any]: ember.opacity,
                ['--ember-sway' as any]: ember.id % 2 === 0 ? 1 : -1,
                transform: 'translate3d(0, 0, 0)',
              }}
            />
          ))}

          {/* Fast Swirling Wind Cherry Blossom Petals */}
          {petals.map((petal) => (
            <div
              key={`petal-${petal.id}`}
              className="absolute pointer-events-none will-change-transform"
              style={{
                left: `${petal.startX}vw`,
                top: `${petal.startY}vh`,
                width: `${petal.size * 1.5}px`,
                height: `${petal.size}px`,
                borderRadius: '60% 40% 70% 30% / 50% 60% 40% 50%',
                background: 'linear-gradient(135deg, #ff485d, #d9001a)',
                boxShadow: '0 0 10px rgba(255, 50, 75, 0.9)',
                animation: `fastPetalDrift ${petal.duration}s linear infinite`,
                animationDelay: `${petal.delay}s`,
                transform: 'translate3d(0, 0, 0)',
              }}
            />
          ))}
        </div>
      )}

      {/* ── 6. Ambient Blood Eclipse Pulsing Light ── */}
      {!reduceMotion && (
        <div
          className="absolute top-[12%] left-1/2 w-[650px] h-[650px] rounded-full bg-red-500/25 pointer-events-none will-change-transform z-[2]"
          style={{
            animation: 'eclipsePulseFast 2.5s ease-in-out infinite',
            transform: 'translate3d(-50%, 0, 0)',
          }}
        />
      )}

      {/* ── 7. Luminous Clean Dark Transparent Overlay ── */}
      <div 
        className="absolute inset-0 pointer-events-none transition-all duration-300 z-[4]"
        style={{
          backgroundColor: `rgba(4, 5, 10, ${overlayOpacity})`,
          backgroundImage: 'radial-gradient(ellipse at 50% 25%, rgba(255, 40, 70, 0.06) 0%, rgba(2, 3, 7, 0.25) 100%)',
        }}
      />

      {/* Subtle Edge Vignette */}
      <div 
        className="absolute inset-0 pointer-events-none z-[4]"
        style={{
          background: 'radial-gradient(circle at 50% 45%, transparent 60%, rgba(2, 2, 5, 0.5) 100%)',
        }}
      />
    </div>
  );
};

export const MotionBackground: React.FC<MotionBackgroundProps> = ({
  videoSrc: customVideoSrc,
  posterSrc: customPosterSrc,
  overlayOpacity: customOverlayOpacity,
  playbackSpeed: customPlaybackSpeed = 1.1,
  brightness: customBrightness = 1.2,
  isUIActive = false,
}) => {
  const { settings } = useSettingsStore();

  const isEnabled = settings.videoBackgroundEnabled ?? true;
  const bgMode = settings.backgroundMode || 'samurai-video';
  const customImg = settings.customBackgroundImage;
  const activeVideoSrc =
    bgMode === 'custom-video'
      ? settings.customVideoUrl || customVideoSrc || settings.videoBackgroundSrc || '/samurai-background.mp4'
      : customVideoSrc || settings.videoBackgroundSrc || '/samurai-background.mp4';
  const activePosterSrc = customPosterSrc || '/samurai-poster.jpg';
  
  // Subtle dark glass overlay - transparent enough to show video clearly while keeping UI readable
  const overlayOpacity = customOverlayOpacity ?? (settings.videoBackgroundOverlay !== undefined ? Math.min(settings.videoBackgroundOverlay, 0.45) : 0.15);
  const reduceMotion = settings.reduceMotion;
  const playbackRate = settings.videoPlaybackSpeed || customPlaybackSpeed;

  // Active state brightness dimming (e.g. slightly dimmer when active chat/input is open for readability)
  const activeBrightness = isUIActive ? customBrightness * 0.88 : customBrightness;

  if (!isEnabled) {
    return (
      <div 
        className="fixed inset-0 w-screen h-screen min-h-[100dvh] pointer-events-none overflow-hidden z-0 select-none bg-[#06040a]"
        aria-hidden="true"
      />
    );
  }

  if (bgMode === 'live-wallpaper') {
    return (
      <LiveWallpaperCanvas
        preset={settings.liveWallpaperPreset || 'neon-nebula'}
        overlayOpacity={overlayOpacity}
        isUIActive={isUIActive}
      />
    );
  }

  if (bgMode === 'anime-warrior') {
    return (
      <AnimeWarriorBackground
        customImage={customImg}
        overlayOpacity={overlayOpacity}
        isUIActive={isUIActive}
      />
    );
  }

  if (bgMode === 'gojo-anime') {
    return (
      <GojoAnimeBackground
        customImage={customImg}
        overlayOpacity={overlayOpacity}
        isUIActive={isUIActive}
      />
    );
  }

  if (bgMode === 'custom-image') {
    return (
      <AnimeWarriorBackground
        customImage={customImg}
        overlayOpacity={overlayOpacity}
        isUIActive={isUIActive}
      />
    );
  }

  if (bgMode === 'custom-video') {
    return (
      <VideoWallpaperBackground
        videoSrc={activeVideoSrc}
        posterSrc={activePosterSrc}
        overlayOpacity={overlayOpacity}
        playbackSpeed={playbackRate}
        brightness={activeBrightness}
        isUIActive={isUIActive}
        blur={settings.videoBlur}
        fit={settings.videoFit}
        muted={settings.videoMuted}
        volume={settings.videoVolume}
      />
    );
  }

  return (
    <SamuraiVideoBackground
      videoSrc={activeVideoSrc}
      posterSrc={activePosterSrc}
      overlayOpacity={overlayOpacity}
      playbackSpeed={playbackRate}
      brightness={activeBrightness}
      reduceMotion={reduceMotion}
    />
  );
};

export default MotionBackground;
