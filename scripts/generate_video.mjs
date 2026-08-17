import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const WIDTH = 720;
const HEIGHT = 1280;
const TOTAL_FRAMES = 120; // 4 seconds loop at 30 fps
const FPS = 30;

const tempDir = path.join(process.cwd(), '.temp_frames');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Generate stars/fireflies with fixed base positions and floating orbits
const fireflies = [
  { x: 180, y: 340, size: 28, speed: 1.0, phase: 0.2, driftX: 35, driftY: 40 },
  { x: 540, y: 390, size: 24, speed: 0.8, phase: 1.4, driftX: 40, driftY: 30 },
  { x: 140, y: 780, size: 30, speed: 1.2, phase: 2.1, driftX: 30, driftY: 45 },
  { x: 580, y: 690, size: 32, speed: 0.9, phase: 3.5, driftX: 45, driftY: 35 },
  { x: 260, y: 990, size: 26, speed: 1.1, phase: 4.2, driftX: 35, driftY: 30 },
  { x: 490, y: 1040, size: 25, speed: 1.3, phase: 5.1, driftX: 30, driftY: 40 },
  { x: 410, y: 1240, size: 28, speed: 0.7, phase: 0.8, driftX: 40, driftY: 25 },
  { x: 100, y: 520, size: 20, speed: 1.0, phase: 3.0, driftX: 25, driftY: 35 },
  { x: 620, y: 880, size: 22, speed: 1.4, phase: 1.8, driftX: 35, driftY: 30 },
  { x: 360, y: 220, size: 24, speed: 0.9, phase: 4.8, driftX: 30, driftY: 25 },
  { x: 220, y: 620, size: 18, speed: 1.5, phase: 2.7, driftX: 25, driftY: 20 },
  { x: 500, y: 550, size: 20, speed: 1.1, phase: 0.5, driftX: 20, driftY: 30 },
];

// Spider lilies (Higanbana) positions
const lilies = [
  { x: 220, y: 860, scale: 0.9, rot: 15 },
  { x: 490, y: 830, scale: 0.85, rot: -20 },
  { x: 260, y: 730, scale: 0.8, rot: 30 },
  { x: 470, y: 710, scale: 0.9, rot: -10 },
  { x: 210, y: 640, scale: 0.75, rot: -25 },
  { x: 520, y: 630, scale: 0.85, rot: 40 },
  { x: 270, y: 920, scale: 0.95, rot: -15 },
  { x: 450, y: 940, scale: 0.9, rot: 25 },
  { x: 380, y: 980, scale: 0.7, rot: 5 },
  { x: 160, y: 950, scale: 0.8, rot: -35 },
  { x: 570, y: 920, scale: 0.85, rot: 15 },
  { x: 280, y: 440, scale: 0.6, rot: 20 },
  { x: 440, y: 430, scale: 0.65, rot: -15 },
];

console.log(`Rendering ${TOTAL_FRAMES} SVG frames for 9:16 samurai video background...`);

for (let i = 0; i < TOTAL_FRAMES; i++) {
  const progress = i / TOTAL_FRAMES;
  const time = progress * Math.PI * 2;

  // Render glowing stars
  const starsSvg = fireflies.map((f, idx) => {
    const curTime = time * f.speed + f.phase;
    const curX = f.x + Math.sin(curTime) * f.driftX;
    const curY = f.y + Math.cos(curTime * 0.8) * f.driftY;
    const pulse = 0.8 + 0.3 * Math.sin(curTime * 2);
    const size = f.size * pulse;
    const rot = (progress * 360 * (idx % 2 === 0 ? 1 : -1) + idx * 30) % 360;

    return `
      <!-- Firefly #${idx} -->
      <g transform="translate(${curX.toFixed(1)}, ${curY.toFixed(1)})">
        <!-- Diffuse Outer Glow -->
        <circle r="${(size * 1.6).toFixed(1)}" fill="url(#fireflyGlow)" opacity="0.6" />
        <!-- Mid Warm Core -->
        <circle r="${(size * 0.7).toFixed(1)}" fill="#ffb830" opacity="0.8" />
        <!-- Crisp 4-Point Star Core -->
        <g transform="rotate(${rot.toFixed(1)})">
          <path d="M 0,-${(size * 0.85).toFixed(1)} Q 0,0 ${(size * 0.85).toFixed(1)},0 Q 0,0 0,${(size * 0.85).toFixed(1)} Q 0,0 -${(size * 0.85).toFixed(1)},0 Q 0,0 0,-${(size * 0.85).toFixed(1)}" fill="#fff5d0" />
          <path d="M 0,-${(size * 0.45).toFixed(1)} Q 0,0 ${(size * 0.45).toFixed(1)},0 Q 0,0 0,${(size * 0.45).toFixed(1)} Q 0,0 -${(size * 0.45).toFixed(1)},0 Q 0,0 0,-${(size * 0.45).toFixed(1)}" fill="#ffffff" />
        </g>
      </g>
    `;
  }).join('\n');

  // Ambient breathing light on the samurai kasa hat and grass
  const hatGlow = 0.75 + 0.15 * Math.sin(time);
  const grassSway = Math.sin(time) * 3;

  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Gradient -->
    <radialGradient id="nightBg" cx="50%" cy="52%" r="70%">
      <stop offset="0%" stop-color="#0c2415" />
      <stop offset="45%" stop-color="#07170e" />
      <stop offset="85%" stop-color="#030805" />
      <stop offset="100%" stop-color="#010402" />
    </radialGradient>

    <!-- Warm Golden Hat Lighting -->
    <radialGradient id="hatGradient" cx="42%" cy="40%" r="58%">
      <stop offset="0%" stop-color="#eed8a1" />
      <stop offset="40%" stop-color="#c49a45" />
      <stop offset="80%" stop-color="#694e1d" />
      <stop offset="100%" stop-color="#2a1e0a" />
    </radialGradient>

    <!-- Straw Texture Conical Rings -->
    <radialGradient id="hatRings" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="transparent" />
      <stop offset="90%" stop-color="rgba(0,0,0,0.4)" />
      <stop offset="100%" stop-color="rgba(255,220,130,0.3)" />
    </radialGradient>

    <!-- Samurai Robe Gradient -->
    <linearGradient id="robeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#465c69" />
      <stop offset="50%" stop-color="#2d3d47" />
      <stop offset="100%" stop-color="#18232a" />
    </linearGradient>

    <!-- Pants Gradient -->
    <linearGradient id="pantsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#2c3a42" />
      <stop offset="70%" stop-color="#1a252b" />
      <stop offset="100%" stop-color="#0e1418" />
    </linearGradient>

    <!-- Katana Scabbard -->
    <linearGradient id="scabbardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3d2c1d" />
      <stop offset="40%" stop-color="#1f150c" />
      <stop offset="100%" stop-color="#0d0905" />
    </linearGradient>

    <!-- Gold Katana Tsuba -->
    <linearGradient id="goldTsuba" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#fce28a" />
      <stop offset="50%" stop-color="#d4af37" />
      <stop offset="100%" stop-color="#8a6f18" />
    </linearGradient>

    <!-- Firefly Glow -->
    <radialGradient id="fireflyGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffd54f" stop-opacity="0.9" />
      <stop offset="40%" stop-color="#ff9800" stop-opacity="0.5" />
      <stop offset="80%" stop-color="#ff6d00" stop-opacity="0.15" />
      <stop offset="100%" stop-color="#ff6d00" stop-opacity="0" />
    </radialGradient>

    <!-- Higanbana Red Petals -->
    <linearGradient id="petalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ff3344" />
      <stop offset="60%" stop-color="#c4001d" />
      <stop offset="100%" stop-color="#60000a" />
    </linearGradient>

    <!-- Vignette Shade -->
    <radialGradient id="vignette" cx="50%" cy="50%" r="50%">
      <stop offset="60%" stop-color="transparent" />
      <stop offset="100%" stop-color="rgba(0,0,0,0.85)" />
    </radialGradient>
  </defs>

  <!-- Deep Forest Meadow Background -->
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#nightBg)" />

  <!-- Dense Textured Grass Layer 1 (Darker Base Blades) -->
  <g opacity="0.85">
    ${Array.from({ length: 45 }).map((_, gi) => {
      const gx = (gi * 17) % WIDTH;
      const gy = (gi * 29) % HEIGHT;
      const sway = Math.sin(time + gi) * 4;
      return `<path d="M ${gx} ${gy} Q ${gx + 10 + sway} ${gy - 35} ${gx + 18 + sway * 1.5} ${gy - 65}" stroke="#0a2e18" stroke-width="3" fill="none" stroke-linecap="round" />
              <path d="M ${gx + 8} ${gy + 10} Q ${gx - 5 + sway} ${gy - 25} ${gx - 12 + sway * 1.2} ${gy - 55}" stroke="#061c0e" stroke-width="2.5" fill="none" stroke-linecap="round" />`;
    }).join('\n')}
  </g>

  <!-- Dense Textured Grass Layer 2 (Mid Green Blades) -->
  <g opacity="0.9">
    ${Array.from({ length: 60 }).map((_, gi) => {
      const gx = (gi * 13 + 5) % WIDTH;
      const gy = (gi * 23 + 15) % HEIGHT;
      const sway = Math.cos(time + gi * 0.7) * 5;
      return `<path d="M ${gx} ${gy} Q ${gx + 12 + sway} ${gy - 40} ${gx + 15 + sway * 1.4} ${gy - 75}" stroke="#134726" stroke-width="3" fill="none" stroke-linecap="round" />
              <path d="M ${gx + 14} ${gy + 5} Q ${gx + 25 + sway} ${gy - 30} ${gx + 30 + sway * 1.2} ${gy - 60}" stroke="#0d361c" stroke-width="2.5" fill="none" stroke-linecap="round" />`;
    }).join('\n')}
  </g>

  <!-- SAMURAI BODY (Overhead Perspective Centered) -->
  <g transform="translate(360, 620)">
    <!-- Ambient Body Shadow on Grass -->
    <ellipse cx="0" cy="40" rx="140" ry="240" fill="#020804" opacity="0.85" />

    <!-- Legs & Black Shin Guards (Kyahan) / Tabi Boots -->
    <!-- Left Leg -->
    <path d="M -55 70 L -65 240 L -45 285 L -20 280 L -30 230 L -25 70 Z" fill="url(#pantsGradient)" />
    <!-- Left Boot -->
    <path d="M -65 240 L -45 295 L -20 290 L -30 230 Z" fill="#0d1114" />
    <path d="M -60 250 L -25 242 M -57 265 L -23 258" stroke="#3a4852" stroke-width="1.5" />

    <!-- Right Leg -->
    <path d="M 25 70 L 30 230 L 20 280 L 45 285 L 65 240 L 55 70 Z" fill="url(#pantsGradient)" />
    <!-- Right Boot -->
    <path d="M 30 230 L 20 290 L 45 295 L 65 240 Z" fill="#0d1114" />
    <path d="M 25 242 L 60 250 M 23 258 L 57 265" stroke="#3a4852" stroke-width="1.5" />

    <!-- Samurai Torso & Robes (Kimono / Haori) -->
    <path d="M -75 -60 C -95 10, -85 70, -60 120 L 60 120 C 85 70, 95 10, 75 -60 C 50 -110, -50 -110, -75 -60 Z" fill="url(#robeGradient)" />
    <!-- Robe Folds & Shading -->
    <path d="M -70 -40 Q -10 20 50 110" stroke="#18232a" stroke-width="4" fill="none" />
    <path d="M 70 -40 Q 10 20 -50 110" stroke="#10181d" stroke-width="4" fill="none" />
    <path d="M -60 0 Q 0 40 45 100" stroke="#5b7482" stroke-width="2" fill="none" opacity="0.6" />

    <!-- Dark Obi Sash / Belt -->
    <rect x="-65" y="45" width="130" height="26" rx="4" fill="#11161a" stroke="#253038" stroke-width="1.5" />
    <path d="M -15 45 L -20 110 L 0 115 L 5 45 Z" fill="#1a2228" />

    <!-- Sleeves & Arms Resting at Sides -->
    <!-- Left Arm -->
    <path d="M -75 -40 C -115 10, -110 80, -90 130 C -80 140, -65 130, -70 110 C -85 70, -85 20, -65 -30 Z" fill="url(#robeGradient)" />
    <!-- Left Hand / Cuff -->
    <ellipse cx="-78" cy="120" rx="14" ry="12" fill="#d9b693" />

    <!-- Right Arm -->
    <path d="M 75 -40 C 115 10, 110 80, 90 130 C 80 140, 65 130, 70 110 C 85 70, 85 20, 65 -30 Z" fill="url(#robeGradient)" />
    <!-- Right Hand / Cuff -->
    <ellipse cx="78" cy="120" rx="14" ry="12" fill="#d9b693" />

    <!-- Katana Sword Tucked in Belt -->
    <g transform="translate(-10, 50) rotate(42)">
      <!-- Scabbard (Saya) -->
      <path d="M -6 0 L -4 210 L 4 210 L 6 0 Z" fill="url(#scabbardGradient)" stroke="#0a0704" stroke-width="1.5" />
      <!-- Gold Sageo Cord Wrap -->
      <path d="M -6 25 L 6 32 M -6 45 L 6 52 M -6 65 L 6 72" stroke="#d4af37" stroke-width="2" />
      <!-- Gold Tsuba (Handguard) -->
      <ellipse cx="0" cy="0" rx="18" ry="8" fill="url(#goldTsuba)" stroke="#ffe599" stroke-width="1" />
      <!-- Tsuka (Handle) with Golden Diamond Wrap -->
      <rect x="-5" y="-65" width="10" height="65" rx="2" fill="#1a1a1a" />
      <path d="M -5 -55 L 5 -50 M -5 -40 L 5 -35 M -5 -25 L 5 -20 M -5 -10 L 5 -5" stroke="#fce28a" stroke-width="1.5" />
      <!-- Kashira (Pommel) -->
      <ellipse cx="0" cy="-65" rx="6" ry="3" fill="url(#goldTsuba)" />
    </g>

    <!-- SAMURAI KASA (Conical Straw Hat) - Central Iconic Focal Point -->
    <g transform="translate(0, -90)">
      <!-- Hat Cast Shadow -->
      <circle cx="5" cy="12" r="105" fill="#010603" opacity="0.8" />
      <!-- Main Conical Straw Hat Disc -->
      <circle cx="0" cy="0" r="102" fill="url(#hatGradient)" />
      
      <!-- Radial Straw Ribs & Weave Lines -->
      ${Array.from({ length: 24 }).map((_, ri) => {
        const ang = (ri * 15) * Math.PI / 180;
        const x2 = Math.cos(ang) * 102;
        const y2 = Math.sin(ang) * 102;
        return `<line x1="0" y1="0" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="rgba(70,45,15,0.4)" stroke-width="1.5" />`;
      }).join('\n')}

      <!-- Concentric Woven Bamboo Rings -->
      <circle cx="0" cy="0" r="25" fill="none" stroke="rgba(255,230,150,0.5)" stroke-width="2" />
      <circle cx="0" cy="0" r="50" fill="none" stroke="rgba(90,55,20,0.45)" stroke-width="2" />
      <circle cx="0" cy="0" r="75" fill="none" stroke="rgba(255,230,150,0.35)" stroke-width="2" />
      <circle cx="0" cy="0" r="95" fill="none" stroke="rgba(60,35,10,0.5)" stroke-width="2.5" />

      <!-- Center Cone Peak Crown -->
      <circle cx="0" cy="0" r="12" fill="#7a581e" stroke="#ffe082" stroke-width="2" />

      <!-- Glowing Hat Rim Highlight -->
      <circle cx="-6" cy="-6" r="98" fill="none" stroke="rgba(255,245,200,${hatGlow.toFixed(2)})" stroke-width="2.5" opacity="0.75" />
    </g>
  </g>

  <!-- RED SPIDER LILIES (Higanbana / Lycoris radiata) -->
  <g>
    ${lilies.map((l, lidx) => {
      return `
        <!-- Lily Cluster #${lidx} -->
        <g transform="translate(${l.x}, ${l.y}) scale(${l.scale}) rotate(${l.rot})">
          <!-- Ambient Red Flower Glow -->
          <circle r="36" fill="#ff1744" opacity="0.22" />
          
          <!-- Long Curving Filaments / Stamens -->
          ${Array.from({ length: 8 }).map((_, fi) => {
            const fAngle = (fi * 45) * Math.PI / 180;
            const fx = Math.cos(fAngle) * 48;
            const fy = Math.sin(fAngle) * 48;
            const cpx = Math.cos(fAngle + 0.5) * 30;
            const cpy = Math.sin(fAngle + 0.5) * 30;
            return `<path d="M 0 0 Q ${cpx.toFixed(1)} ${cpy.toFixed(1)} ${fx.toFixed(1)} ${fy.toFixed(1)}" stroke="#ff2233" stroke-width="1.8" fill="none" />
                    <circle cx="${fx.toFixed(1)}" cy="${fy.toFixed(1)}" r="2.2" fill="#ffd700" />`;
          }).join('\n')}

          <!-- Curled Crimson Petals -->
          ${Array.from({ length: 6 }).map((_, pi) => {
            const pAngle = (pi * 60) * Math.PI / 180;
            return `<path d="M 0 0 Q 15 -10 28 -5 Q 20 10 0 0" fill="url(#petalGrad)" transform="rotate(${pi * 60})" />`;
          }).join('\n')}

          <!-- Center Golden Core -->
          <circle r="4" fill="#ffe082" />
        </g>
      `;
    }).join('\n')}
  </g>

  <!-- FOREGROUND GRASS BLADES (Overlaying edges of character & lilies for authentic depth) -->
  <g opacity="0.95">
    ${Array.from({ length: 50 }).map((_, gi) => {
      const gx = (gi * 15 + 10) % WIDTH;
      const gy = (gi * 27 + 40) % HEIGHT;
      const sway = Math.sin(time + gi * 0.8) * 6;
      return `<path d="M ${gx} ${gy} Q ${gx + 18 + sway} ${gy - 45} ${gx + 22 + sway * 1.5} ${gy - 85}" stroke="#1b5e20" stroke-width="3.5" fill="none" stroke-linecap="round" />
              <path d="M ${gx + 6} ${gy + 12} Q ${gx + 2 + sway} ${gy - 30} ${gx - 4 + sway * 1.2} ${gy - 65}" stroke="#2e7d32" stroke-width="2" fill="none" stroke-linecap="round" />`;
    }).join('\n')}
  </g>

  <!-- FLOATING GOLDEN STARS & FIREFLIES (Active Animated Elements) -->
  ${starsSvg}

  <!-- Cinematic Fullscreen Vignette -->
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#vignette)" opacity="0.75" />
</svg>`;

  fs.writeFileSync(path.join(tempDir, `frame_${String(i).padStart(4, '0')}.svg`), svgContent);
}

console.log('All SVG frames written. Compiling 60fps MP4 video with ffmpeg...');

const outputFile1 = path.join(process.cwd(), 'public', 'samurai-background.mp4');
const outputFile2 = path.join(process.cwd(), 'public', 'background.mp4');

// Compile SVG frame sequence directly with ffmpeg into crystal clear H.264 MP4
execSync(
  `ffmpeg -y -framerate ${FPS} -i "${tempDir}/frame_%04d.svg" -c:v libx264 -pix_fmt yuv420p -profile:v high -level 4.0 -preset fast -crf 20 -movflags +faststart "${outputFile1}"`,
  { stdio: 'inherit' }
);

// Also copy to background.mp4
fs.copyFileSync(outputFile1, outputFile2);

// Clean up temporary SVG frames
fs.rmSync(tempDir, { recursive: true, force: true });

console.log('✅ Generated high-quality seamless background MP4 at:');
console.log(` - ${outputFile1}`);
console.log(` - ${outputFile2}`);
