import React, { useRef, useEffect, useState } from 'react';
import { useSettingsStore } from '@/lib/settingsStore';

interface VideoWallpaperBackgroundProps {
  videoSrc?: string;
  posterSrc?: string;
  overlayOpacity?: number; // 0.0 - 1.0
  playbackSpeed?: number;
  brightness?: number;
  isUIActive?: boolean;
  blur?: number;
  fit?: 'cover' | 'contain';
  muted?: boolean;
  volume?: number;
}

export const VideoWallpaperBackground: React.FC<VideoWallpaperBackgroundProps> = ({
  videoSrc: customVideoSrc,
  posterSrc,
  overlayOpacity: customOverlayOpacity,
  playbackSpeed: customPlaybackSpeed = 1.0,
  brightness: customBrightness = 1.15,
  isUIActive = false,
  blur: customBlur,
  fit: customFit,
  muted: customMuted,
  volume: customVolume,
}) => {
  const { settings } = useSettingsStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState<boolean>(false);
  const [hasVideoError, setHasVideoError] = useState<boolean>(false);

  const activeVideoSrc =
    customVideoSrc ||
    settings.customVideoUrl ||
    settings.videoBackgroundSrc ||
    '/samurai-background.mp4';

  const overlayOpacity =
    customOverlayOpacity ??
    (settings.videoBackgroundOverlay !== undefined
      ? Math.min(settings.videoBackgroundOverlay, 0.7)
      : 0.3);

  const playbackRate = settings.videoPlaybackSpeed || customPlaybackSpeed;
  const isMuted = customMuted ?? (settings.videoMuted ?? true);
  const volume = customVolume ?? (settings.videoVolume ?? 0.8);
  const blurAmount = customBlur ?? (settings.videoBlur ?? 0);
  const objectFit = customFit ?? (settings.videoFit ?? 'cover');
  const activeBrightness = isUIActive ? customBrightness * 0.9 : customBrightness;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setHasVideoError(false);
    setIsVideoLoaded(false);

    const applyPlaybackSettings = () => {
      try {
        video.playbackRate = playbackRate;
        video.muted = isMuted;
        video.volume = Math.max(0, Math.min(1, volume));
      } catch {
        // Fallback gracefully
      }
    };

    const handleLoaded = () => {
      setIsVideoLoaded(true);
      setHasVideoError(false);
      applyPlaybackSettings();
      video.play().catch(() => {});
    };

    const handleError = () => {
      setHasVideoError(true);
      setIsVideoLoaded(false);
    };

    // Performance optimization: Pause video when page is hidden/tab is inactive, resume on active
    const handleVisibilityChange = () => {
      if (document.hidden) {
        video.pause();
      } else {
        video.play().then(applyPlaybackSettings).catch(() => {});
      }
    };

    video.addEventListener('loadeddata', handleLoaded);
    video.addEventListener('loadedmetadata', applyPlaybackSettings);
    video.addEventListener('play', applyPlaybackSettings);
    video.addEventListener('playing', applyPlaybackSettings);
    video.addEventListener('canplay', handleLoaded);
    video.addEventListener('error', handleError);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    if (video.readyState >= 2) {
      setIsVideoLoaded(true);
      applyPlaybackSettings();
    }

    return () => {
      video.removeEventListener('loadeddata', handleLoaded);
      video.removeEventListener('loadedmetadata', applyPlaybackSettings);
      video.removeEventListener('play', applyPlaybackSettings);
      video.removeEventListener('playing', applyPlaybackSettings);
      video.removeEventListener('canplay', handleLoaded);
      video.removeEventListener('error', handleError);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activeVideoSrc, playbackRate, isMuted, volume]);

  return (
    <div
      className="fixed inset-0 w-screen h-screen min-h-[100dvh] pointer-events-none overflow-hidden z-0 select-none bg-[#050409]"
      aria-hidden="true"
      style={{
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
      }}
    >
      {/* ── Fallback Gradient Background (Shown if video is loading or error) ── */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 pointer-events-none z-0 ${
          isVideoLoaded && !hasVideoError ? 'opacity-0' : 'opacity-100'
        }`}
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, #151221 0%, #06040b 100%)',
        }}
      />

      {/* ── High-Performance Background Video Element ── */}
      {activeVideoSrc && !hasVideoError && (
        <div
          className={`absolute inset-0 overflow-hidden pointer-events-none z-0 transition-opacity duration-700 ${
            isVideoLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            transform: 'translateZ(0)',
            willChange: 'transform',
            backfaceVisibility: 'hidden',
          }}
        >
          <video
            ref={videoRef}
            src={activeVideoSrc}
            poster={posterSrc}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            preload="auto"
            disablePictureInPicture
            disableRemotePlayback
            className={`w-full h-full pointer-events-none transition-all duration-500 ${
              objectFit === 'contain' ? 'object-contain' : 'object-cover'
            }`}
            style={{
              filter: `brightness(${activeBrightness}) contrast(1.15) saturate(1.2) ${
                blurAmount > 0 ? `blur(${blurAmount}px)` : ''
              }`,
              imageRendering: '-webkit-optimize-contrast',
              transform: 'translate3d(0, 0, 0)',
              willChange: 'transform, filter',
              backfaceVisibility: 'hidden',
            }}
          />
        </div>
      )}

      {/* ── Atmospheric Ambient Tint Overlay for Readability ── */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-300 z-[2]"
        style={{
          backgroundColor: `rgba(5, 4, 10, ${overlayOpacity})`,
          backgroundImage:
            'radial-gradient(ellipse at 50% 20%, rgba(20, 20, 35, 0.15) 0%, rgba(3, 3, 6, 0.45) 100%)',
        }}
      />

      {/* ── Soft Vignette Edge Shadow ── */}
      <div
        className="absolute inset-0 pointer-events-none z-[3]"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, transparent 65%, rgba(2, 2, 5, 0.6) 100%)',
        }}
      />
    </div>
  );
};

export default VideoWallpaperBackground;
