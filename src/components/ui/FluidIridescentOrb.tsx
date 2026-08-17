import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface FluidIridescentOrbProps {
  isSpeaking?: boolean;
  isListening?: boolean;
  isPaused?: boolean;
  volumeLevel?: number;
  className?: string;
  size?: number;
}

export const FluidIridescentOrb: React.FC<FluidIridescentOrbProps> = ({
  isSpeaking = false,
  isListening = false,
  isPaused = false,
  volumeLevel = 0,
  className,
  size = 280,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);
  const smoothVolRef = useRef<number>(0.1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Target high-res DPR
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;

    // Attempt to initialize WebGL
    const gl = (canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false, antialias: true }) ||
      canvas.getContext('experimental-webgl', { alpha: true, premultipliedAlpha: false, antialias: true })) as WebGLRenderingContext | null;

    if (gl) {
      // -------------------------------------------------------------
      // WebGL Shader Implementation for 3D Iridescent Glass Sphere
      // -------------------------------------------------------------
      const vsSource = `
        attribute vec2 a_position;
        varying vec2 v_uv;
        void main() {
          v_uv = a_position * 0.5 + 0.5;
          gl_Position = vec4(a_position, 0.0, 1.0);
        }
      `;

      const fsSource = `
        precision highp float;
        varying vec2 v_uv;
        uniform vec2 u_resolution;
        uniform float u_time;
        uniform float u_volume;
        uniform float u_speaking;
        uniform float u_listening;

        // Spectral Color Palette Generator
        vec3 spectralPalette(float t) {
          // Iridescent Rainbow Dispersion: Red -> Yellow -> Green -> Cyan -> Blue -> Magenta
          vec3 a = vec3(0.5, 0.5, 0.5);
          vec3 b = vec3(0.5, 0.5, 0.5);
          vec3 c = vec3(1.0, 1.0, 1.0);
          vec3 d = vec3(0.0, 0.33, 0.67);
          return a + b * cos(6.28318 * (c * t + d));
        }

        // 2D Rotation Matrix
        mat2 rot2d(float angle) {
          float s = sin(angle);
          float c = cos(angle);
          return mat2(c, -s, s, c);
        }

        // Caustic fluid wave function
        float causticWave(vec3 p, float t, float freq) {
          vec3 q = p;
          q.xy = rot2d(t * 0.35) * q.xy;
          q.yz = rot2d(t * 0.22) * q.yz;
          
          float wave1 = sin(q.x * freq + t * 1.6 + sin(q.y * 2.5 + t));
          float wave2 = cos(q.y * (freq * 0.9) - t * 1.3 + cos(q.z * 2.2 - t * 0.8));
          float wave3 = sin(q.z * (freq * 1.2) + t * 1.8 + sin(q.x * 2.8 + t * 1.1));
          
          return (wave1 + wave2 + wave3) / 3.0;
        }

        void main() {
          // Normalize coordinates centered at (0.0, 0.0)
          vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / (min(u_resolution.x, u_resolution.y) * 0.5);
          
          float dist = length(uv);
          float sphereRadius = 0.86;
          
          // Anti-aliased outer boundary
          float edgeSmoothing = 0.008;
          float sphereMask = 1.0 - smoothstep(sphereRadius - edgeSmoothing, sphereRadius + edgeSmoothing, dist);
          
          if (sphereMask <= 0.001) {
            gl_FragColor = vec4(0.0);
            return;
          }

          // 3D Sphere Normal Calculation (Z pointing outward towards camera)
          float z = sqrt(max(0.0, sphereRadius * sphereRadius - dist * dist));
          vec3 N = normalize(vec3(uv, z));
          vec3 V = vec3(0.0, 0.0, 1.0); // View direction

          // Fresnel reflectance (edges glow more intensely)
          float NdotV = max(0.0, dot(N, V));
          float fresnel = pow(1.0 - NdotV, 2.5);
          float fresnelRim = pow(1.0 - NdotV, 4.2);

          // Animated time with speaking/listening speed modulation
          float t = u_time * (0.55 + u_speaking * 0.45 + u_listening * 0.25);
          float volBoost = u_volume * 1.4;

          // -------------------------------------------------------------
          // 1. Deep Obsidian / Indigo Core Volume
          // -------------------------------------------------------------
          vec3 deepCore = mix(
            vec3(0.008, 0.015, 0.08), // Midnight dark blue
            vec3(0.03, 0.02, 0.22),   // Deep indigo
            pow(1.0 - NdotV, 1.2)
          );

          // -------------------------------------------------------------
          // 2. Lower-Right Vibrant Violet / Magenta Internal Glow
          // -------------------------------------------------------------
          vec2 magentaCenter = vec2(0.35, -0.42);
          float magentaDist = length(uv - magentaCenter);
          float magentaGlow = smoothstep(0.95, 0.05, magentaDist) * (0.85 + volBoost * 0.35);
          vec3 magentaCol = mix(vec3(0.55, 0.0, 0.95), vec3(0.95, 0.05, 0.85), magentaDist);
          deepCore += magentaCol * magentaGlow * 1.2;

          // -------------------------------------------------------------
          // 3. Top-Left / Upper Arc Cyan & Ice-Blue Luminescence
          // -------------------------------------------------------------
          vec2 cyanCenter = vec2(-0.25, 0.45);
          float cyanDist = length(uv - cyanCenter);
          float cyanGlow = smoothstep(0.9, 0.1, cyanDist) * (0.75 + volBoost * 0.3);
          vec3 cyanCol = vec3(0.12, 0.85, 0.98);
          deepCore += cyanCol * cyanGlow * 0.9;

          // -------------------------------------------------------------
          // 4. Refractive 3D Swirling Caustic Wave with Chromatic Dispersion
          // -------------------------------------------------------------
          // Sphere internal refracted coordinates
          vec3 refrP = N;
          refrP.xy = rot2d(t * 0.25) * refrP.xy;
          
          // Sample caustic wave with spectral color shifts (chromatic aberration)
          float dispersion = 0.065 + volBoost * 0.035;
          float cR = causticWave(refrP, t - dispersion, 3.2 + volBoost * 0.5);
          float cG = causticWave(refrP, t, 3.2 + volBoost * 0.5);
          float cB = causticWave(refrP, t + dispersion, 3.2 + volBoost * 0.5);
          
          // Sharp caustic crest folds
          float foldR = pow(max(0.0, 1.0 - abs(cR)), 4.0);
          float foldG = pow(max(0.0, 1.0 - abs(cG)), 4.0);
          float foldB = pow(max(0.0, 1.0 - abs(cB)), 4.0);

          vec3 causticColor = vec3(foldR, foldG, foldB);

          // Map caustic ribbon through rainbow spectral dispersion
          float spectralPos = (cR + cG + cB) * 0.33 + t * 0.15 + (uv.x + uv.y) * 0.4;
          vec3 iridescentRainbow = spectralPalette(spectralPos);
          
          // Multi-layer iridescent ribbon
          vec3 ribbonLight = causticColor * iridescentRainbow * (1.8 + volBoost * 0.8);
          
          // -------------------------------------------------------------
          // 5. Crescent Caustic Rainbow Fringe (Bottom curved spectral arc)
          // -------------------------------------------------------------
          float bottomArc = smoothstep(0.4, 0.85, -uv.y + uv.x * 0.3);
          float arcCaustic = pow(max(0.0, 1.0 - abs(sin(dist * 5.2 - t * 1.5 + N.z * 2.0))), 5.0);
          vec3 arcSpectral = spectralPalette(-uv.y * 1.8 + t * 0.3) * arcCaustic * bottomArc * 2.2;

          // -------------------------------------------------------------
          // 6. Top Refractive Glare & High-Gloss Specular Arc
          // -------------------------------------------------------------
          vec2 glareCenter = vec2(0.0, 0.52);
          float glareDist = length(uv - glareCenter);
          float topGlint = pow(max(0.0, 1.0 - glareDist * 1.5), 3.5);
          vec3 topGlintCol = mix(vec3(0.4, 0.95, 1.0), vec3(1.0, 0.98, 1.0), topGlint);

          // -------------------------------------------------------------
          // 7. Glass Rim Fresnel & Edge Refraction
          // -------------------------------------------------------------
          vec3 rimSpectral = spectralPalette(atan(uv.y, uv.x) * 0.5 + t * 0.2);
          vec3 rimLight = rimSpectral * fresnelRim * 2.4;
          rimLight += vec3(0.2, 0.8, 1.0) * fresnel * 0.8;

          // -------------------------------------------------------------
          // Composite Final Orb Shading
          // -------------------------------------------------------------
          vec3 finalColor = deepCore + ribbonLight + arcSpectral + (topGlintCol * topGlint * 1.4) + rimLight;
          
          // Soft ambient glass occlusion
          finalColor *= (0.75 + 0.35 * NdotV);

          // Final Alpha with smooth anti-aliased edge
          gl_FragColor = vec4(finalColor * sphereMask, sphereMask);
        }
      `;

      // Helper function to compile shaders
      const createShader = (type: number, source: string) => {
        const shader = gl.createShader(type);
        if (!shader) return null;
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          console.error(gl.getShaderInfoLog(shader));
          gl.deleteShader(shader);
          return null;
        }
        return shader;
      };

      const vertexShader = createShader(gl.VERTEX_SHADER, vsSource);
      const fragmentShader = createShader(gl.FRAGMENT_SHADER, fsSource);

      if (vertexShader && fragmentShader) {
        const program = gl.createProgram();
        if (program) {
          gl.attachShader(program, vertexShader);
          gl.attachShader(program, fragmentShader);
          gl.linkProgram(program);

          if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
            gl.useProgram(program);

            // Setup fullscreen quad geometry
            const positionBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            const positions = new Float32Array([
              -1.0, -1.0,
               1.0, -1.0,
              -1.0,  1.0,
              -1.0,  1.0,
               1.0, -1.0,
               1.0,  1.0,
            ]);
            gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

            const aPositionLoc = gl.getAttribLocation(program, 'a_position');
            gl.enableVertexAttribArray(aPositionLoc);
            gl.vertexAttribPointer(aPositionLoc, 2, gl.FLOAT, false, 0, 0);

            // Get uniform locations
            const uResLoc = gl.getUniformLocation(program, 'u_resolution');
            const uTimeLoc = gl.getUniformLocation(program, 'u_time');
            const uVolLoc = gl.getUniformLocation(program, 'u_volume');
            const uSpeakingLoc = gl.getUniformLocation(program, 'u_speaking');
            const uListeningLoc = gl.getUniformLocation(program, 'u_listening');

            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.clearColor(0, 0, 0, 0);

            const renderGL = () => {
              // Smooth volume interpolation
              const targetVol = isSpeaking ? Math.max(0.35, volumeLevel) : isListening ? Math.max(0.18, volumeLevel * 0.7) : 0.06;
              smoothVolRef.current += (targetVol - smoothVolRef.current) * 0.12;

              // Speed rate based on state
              const deltaSpeed = isSpeaking ? 0.024 : isListening ? 0.015 : isPaused ? 0.006 : 0.012;
              timeRef.current += deltaSpeed;

              gl.useProgram(program);
              gl.uniform2f(uResLoc, canvas.width, canvas.height);
              gl.uniform1f(uTimeLoc, timeRef.current);
              gl.uniform1f(uVolLoc, smoothVolRef.current);
              gl.uniform1f(uSpeakingLoc, isSpeaking ? 1.0 : 0.0);
              gl.uniform1f(uListeningLoc, isListening ? 1.0 : 0.0);

              gl.drawArrays(gl.TRIANGLES, 0, 6);
              animFrameRef.current = requestAnimationFrame(renderGL);
            };

            renderGL();

            return () => {
              if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
              if (program) gl.deleteProgram(program);
              if (vertexShader) gl.deleteShader(vertexShader);
              if (fragmentShader) gl.deleteShader(fragmentShader);
            };
          }
        }
      }
    }

    // -------------------------------------------------------------
    // Fallback Canvas 2D Renderer (if WebGL is unavailable)
    // -------------------------------------------------------------
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const baseRadius = (size / 2) * 0.86;
    const centerX = size / 2;
    const centerY = size / 2;

    const render2D = () => {
      timeRef.current += isSpeaking ? 0.03 : 0.015;
      const t = timeRef.current;
      ctx.clearRect(0, 0, size, size);

      // Base Obsidian Sphere
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
      ctx.clip();

      const bgGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, baseRadius);
      bgGrad.addColorStop(0, '#060618');
      bgGrad.addColorStop(0.7, '#0b0c2e');
      bgGrad.addColorStop(1, '#020208');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, size, size);

      // Violet-Magenta Glow at bottom-right
      const magGrad = ctx.createRadialGradient(centerX + baseRadius * 0.4, centerY + baseRadius * 0.4, 0, centerX + baseRadius * 0.4, centerY + baseRadius * 0.4, baseRadius * 0.85);
      magGrad.addColorStop(0, 'rgba(168, 85, 247, 0.9)');
      magGrad.addColorStop(0.5, 'rgba(192, 38, 211, 0.6)');
      magGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = magGrad;
      ctx.fillRect(0, 0, size, size);

      // Cyan-Teal Glow at top-left
      const cyanGrad = ctx.createRadialGradient(centerX - baseRadius * 0.3, centerY - baseRadius * 0.3, 0, centerX - baseRadius * 0.3, centerY - baseRadius * 0.3, baseRadius * 0.7);
      cyanGrad.addColorStop(0, 'rgba(34, 211, 238, 0.85)');
      cyanGrad.addColorStop(0.5, 'rgba(14, 165, 233, 0.4)');
      cyanGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = cyanGrad;
      ctx.fillRect(0, 0, size, size);

      // Dynamic Iridescent Ribbon
      const ribbonY = centerY + Math.sin(t) * (baseRadius * 0.2);
      const ribGrad = ctx.createLinearGradient(centerX - baseRadius, ribbonY - 20, centerX + baseRadius, ribbonY + 20);
      ribGrad.addColorStop(0, 'rgba(239, 68, 68, 0.8)');
      ribGrad.addColorStop(0.25, 'rgba(234, 179, 8, 0.85)');
      ribGrad.addColorStop(0.5, 'rgba(34, 197, 94, 0.85)');
      ribGrad.addColorStop(0.75, 'rgba(6, 182, 212, 0.9)');
      ribGrad.addColorStop(1, 'rgba(168, 85, 247, 0.85)');

      ctx.strokeStyle = ribGrad;
      ctx.lineWidth = 14;
      ctx.filter = 'blur(6px)';
      ctx.beginPath();
      ctx.arc(centerX, centerY + baseRadius * 0.2, baseRadius * 0.7, Math.PI * 0.8, Math.PI * 1.8);
      ctx.stroke();

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(render2D);
    };

    render2D();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [size, isSpeaking, isListening, isPaused, volumeLevel]);

  return (
    <div
      className={cn("relative flex items-center justify-center select-none", className)}
      style={{ width: size, height: size }}
    >
      {/* Subtle Ethereal Ambient Aura behind the glass orb */}
      <div
        className={cn(
          "absolute inset-0 rounded-full pointer-events-none blur-3xl transition-opacity duration-700",
          isSpeaking
            ? "opacity-60 bg-gradient-to-tr from-purple-700/40 via-blue-600/30 to-cyan-400/40 scale-110"
            : isListening
            ? "opacity-45 bg-gradient-to-tr from-cyan-600/30 via-indigo-600/30 to-purple-600/30 scale-105"
            : "opacity-30 bg-gradient-to-tr from-purple-900/30 via-blue-900/20 to-cyan-900/20 scale-100"
        )}
      />

      {/* 3D Iridescent WebGL / Canvas Glass Sphere */}
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="relative z-10 block pointer-events-none drop-shadow-[0_20px_50px_rgba(0,0,0,0.95)]"
      />
    </div>
  );
};
