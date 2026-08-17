import React, { useEffect, useRef } from 'react';

export type LiveWallpaperType =
  | 'cyber-matrix'
  | 'neon-nebula'
  | 'iridescent-aurora'
  | 'hyperspace'
  | 'sakura-embers'
  | 'quantum-circuit';

interface LiveWallpaperCanvasProps {
  preset?: LiveWallpaperType;
  overlayOpacity?: number;
  isUIActive?: boolean;
}

export const LiveWallpaperCanvas: React.FC<LiveWallpaperCanvasProps> = ({
  preset = 'neon-nebula',
  overlayOpacity = 0.2,
  isUIActive = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    let time = 0;
    let isRunning = true;

    // 1. Matrix state
    const cols = Math.floor(width / 18);
    const matrixDrops = Array.from({ length: cols }, () => Math.floor(Math.random() * -100));
    const chars = '0123456789ABCDEFΣΩΨЖλπΦ§Ξµ±×•';

    // 2. Nebula / particles state
    const nebulaParticles = Array.from({ length: 65 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 140 + 60,
      hue: Math.random() * 60 + 190, // cyan to purple to magenta
      alpha: Math.random() * 0.25 + 0.15,
    }));

    // 3. Hyperspace stars
    const starCount = 240;
    const stars = Array.from({ length: starCount }, () => ({
      x: (Math.random() - 0.5) * width,
      y: (Math.random() - 0.5) * height,
      z: Math.random() * width,
      pz: Math.random() * width,
      speed: Math.random() * 4 + 4,
      hue: Math.random() * 40 + 190,
    }));

    // 4. Sakura / Embers
    const embers = Array.from({ length: 35 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.8,
      vy: -(Math.random() * 1.5 + 0.5),
      size: Math.random() * 3.5 + 1.5,
      alpha: Math.random() * 0.7 + 0.3,
      sway: Math.random() * Math.PI * 2,
    }));

    const render = () => {
      if (!isRunning) return;
      time += 0.016;

      if (preset === 'cyber-matrix') {
        ctx.fillStyle = 'rgba(5, 7, 12, 0.12)';
        ctx.fillRect(0, 0, width, height);

        ctx.font = '13px monospace';
        for (let i = 0; i < matrixDrops.length; i++) {
          const char = chars[Math.floor(Math.random() * chars.length)];
          const x = i * 18;
          const y = matrixDrops[i] * 18;

          // Glowing leading head
          ctx.fillStyle = '#67e8f9';
          ctx.shadowBlur = 8;
          ctx.shadowColor = '#06b6d4';
          ctx.fillText(char, x, y);

          // Phosphor tail
          ctx.fillStyle = 'rgba(6, 182, 212, 0.4)';
          ctx.shadowBlur = 0;
          ctx.fillText(char, x, y - 18);

          if (y > height && Math.random() > 0.98) {
            matrixDrops[i] = 0;
          }
          matrixDrops[i]++;
        }
      } else if (preset === 'hyperspace') {
        ctx.fillStyle = 'rgba(3, 4, 10, 0.25)';
        ctx.fillRect(0, 0, width, height);

        const cx = width / 2;
        const cy = height / 2;

        for (let i = 0; i < stars.length; i++) {
          const s = stars[i];
          s.pz = s.z;
          s.z -= isUIActive ? 5 : 8;

          if (s.z <= 0) {
            s.z = width;
            s.pz = width;
            s.x = (Math.random() - 0.5) * width;
            s.y = (Math.random() - 0.5) * height;
          }

          const k = 280 / s.z;
          const px = s.x * k + cx;
          const py = s.y * k + cy;

          const pk = 280 / s.pz;
          const oldPx = s.x * pk + cx;
          const oldPy = s.y * pk + cy;

          if (px >= 0 && px <= width && py >= 0 && py <= height) {
            const size = Math.max(1, (1 - s.z / width) * 3);
            ctx.beginPath();
            ctx.moveTo(oldPx, oldPy);
            ctx.lineTo(px, py);
            ctx.strokeStyle = `hsla(${s.hue}, 90%, 75%, ${Math.min(1, 1 - s.z / width)})`;
            ctx.lineWidth = size;
            ctx.stroke();
          }
        }
      } else if (preset === 'iridescent-aurora') {
        // Deep midnight canvas
        ctx.fillStyle = '#05040b';
        ctx.fillRect(0, 0, width, height);

        const layers = 4;
        for (let l = 0; l < layers; l++) {
          ctx.beginPath();
          const hue = 180 + l * 45 + Math.sin(time * 0.5 + l) * 20;
          const grad = ctx.createLinearGradient(0, 0, width, height);
          grad.addColorStop(0, `hsla(${hue}, 85%, 55%, 0.18)`);
          grad.addColorStop(0.5, `hsla(${hue + 40}, 90%, 65%, 0.22)`);
          grad.addColorStop(1, `hsla(${hue + 80}, 95%, 45%, 0.05)`);

          ctx.fillStyle = grad;
          ctx.moveTo(0, height);

          for (let x = 0; x <= width; x += 25) {
            const y =
              height * 0.45 +
              Math.sin(x * 0.003 + time * 0.8 + l * 1.5) * 110 +
              Math.cos(x * 0.006 - time * 0.4 + l) * 70;
            ctx.lineTo(x, y);
          }

          ctx.lineTo(width, height);
          ctx.closePath();
          ctx.fill();
        }
      } else if (preset === 'sakura-embers') {
        ctx.fillStyle = '#070408';
        ctx.fillRect(0, 0, width, height);

        // Ambient blood moon / crimson glow
        const glow = ctx.createRadialGradient(width * 0.7, height * 0.35, 10, width * 0.7, height * 0.35, 450);
        glow.addColorStop(0, 'rgba(239, 68, 68, 0.2)');
        glow.addColorStop(0.5, 'rgba(185, 28, 28, 0.08)');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, width, height);

        // Rising embers
        for (const e of embers) {
          e.y += e.vy;
          e.x += e.vx + Math.sin(time * 2 + e.sway) * 0.5;

          if (e.y < -20) {
            e.y = height + 20;
            e.x = Math.random() * width;
          }

          ctx.beginPath();
          ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(251, 146, 60, ${e.alpha})`;
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#f97316';
          ctx.fill();
        }
        ctx.shadowBlur = 0;
      } else if (preset === 'quantum-circuit') {
        ctx.fillStyle = '#03060c';
        ctx.fillRect(0, 0, width, height);

        const gridSize = 60;
        ctx.strokeStyle = 'rgba(14, 165, 233, 0.12)';
        ctx.lineWidth = 1;

        for (let x = 0; x < width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // Pulse nodes
        const nodeX = (Math.floor(time * 3) * gridSize) % width;
        const nodeY = (Math.floor(time * 2) * gridSize) % height;
        ctx.beginPath();
        ctx.arc(nodeX, nodeY, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#38bdf8';
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#0284c7';
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        // 'neon-nebula' default
        ctx.fillStyle = '#040209';
        ctx.fillRect(0, 0, width, height);

        for (const p of nebulaParticles) {
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < -p.radius) p.x = width + p.radius;
          if (p.x > width + p.radius) p.x = -p.radius;
          if (p.y < -p.radius) p.y = height + p.radius;
          if (p.y > height + p.radius) p.y = -p.radius;

          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
          const currentAlpha = p.alpha * (0.8 + Math.sin(time * 0.7 + p.x) * 0.2);
          g.addColorStop(0, `hsla(${p.hue}, 85%, 60%, ${currentAlpha})`);
          g.addColorStop(0.6, `hsla(${p.hue + 30}, 80%, 40%, ${currentAlpha * 0.3})`);
          g.addColorStop(1, 'transparent');

          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isRunning = false;
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      } else {
        isRunning = true;
        animFrameRef.current = requestAnimationFrame(render);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [preset, isUIActive]);

  return (
    <div
      className="fixed inset-0 w-screen h-screen min-h-[100dvh] pointer-events-none overflow-hidden z-0 select-none bg-[#030206]"
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" />
      {/* Dark overlay for optimal text contrast */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none transition-opacity duration-500 bg-black"
        style={{ opacity: overlayOpacity }}
      />
    </div>
  );
};
