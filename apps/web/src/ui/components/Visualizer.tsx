import React, { useEffect, useRef } from 'react';

export interface VisualizerProps {
  leftHz: number;
  rightHz: number;
  running: boolean;
}

// Realistic binaural beat visualizer with waveform interference, blended into the UI
export function Visualizer({ leftHz, rightHz, running }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const currentLeftRef = useRef<number>(leftHz);
  const currentRightRef = useRef<number>(rightHz);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const parent = canvas.parentElement!;
      const w = parent.clientWidth;
      const h = 200;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      // Reset transform to avoid cumulative scaling across resizes
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    const start = performance.now();
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Visualizer segments: left oscilloscope, center interference, right oscilloscope
    const render = (tNow: number) => {
      const t = (tNow - start) / 1000;
      const W = canvas.width / dpr;
      const H = canvas.height / dpr;

      // Clear with full transparency so it blends with page background
      ctx.clearRect(0, 0, W, H);

      const midY = H / 2;
      const waveAmp = H * 0.15;
      
      // Smooth frequencies to avoid visual snapping
      const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
      currentLeftRef.current = lerp(currentLeftRef.current, leftHz, 0.08);
      currentRightRef.current = lerp(currentRightRef.current, rightHz, 0.08);
      const sLeft = currentLeftRef.current;
      const sRight = currentRightRef.current;
      const beat = Math.abs(sLeft - sRight);
      
      // Modulation envelope for binaural beat (amplitude modulation)
      const beatPhase = 2 * Math.PI * beat * t;
      const envelope = 0.5 + 0.5 * Math.cos(beatPhase);

      // Subtle center background to integrate with UI
      ctx.save();
      const bgGrad = ctx.createLinearGradient(W * 0.33, 0, W * 0.67, 0);
      bgGrad.addColorStop(0, 'rgba(20,28,40,0)');
      bgGrad.addColorStop(0.5, 'rgba(20,28,40,0.35)');
      bgGrad.addColorStop(1, 'rgba(20,28,40,0)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(W * 0.25, H * 0.1, W * 0.5, H * 0.8);
      ctx.restore();

      // Use compositing for nicer glow integration
      const prevComp = ctx.globalCompositeOperation;
      // We'll draw background additions with soft-light, waves with screen
      // (we switch as needed below)

      // Left waveform oscilloscope (0 to W/3)
      ctx.globalCompositeOperation = 'screen';
      ctx.save();
      const leftStroke = ctx.createLinearGradient(0, 0, W / 3, 0);
      leftStroke.addColorStop(0, 'rgba(74,163,255,0.9)');
      leftStroke.addColorStop(1, 'rgba(74,163,255,0.2)');
      ctx.beginPath();
      ctx.strokeStyle = leftStroke as unknown as string;
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#4aa3ff';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      const leftSegment = W / 3;
      const samplesLeft = 120;
      for (let i = 0; i <= samplesLeft; i++) {
        const x = (i / samplesLeft) * leftSegment;
        const phase = 2 * Math.PI * sLeft * (t + (i / samplesLeft) * 0.02);
        const y = midY + waveAmp * Math.sin(phase);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();

      // Right waveform oscilloscope (2W/3 to W)
      ctx.globalCompositeOperation = 'screen';
      ctx.save();
      const rightStroke = ctx.createLinearGradient(2 * W / 3, 0, W, 0);
      rightStroke.addColorStop(0, 'rgba(255,163,74,0.2)');
      rightStroke.addColorStop(1, 'rgba(255,163,74,0.9)');
      ctx.beginPath();
      ctx.strokeStyle = rightStroke as unknown as string;
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#ffa34a';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      const samplesRight = 120;
      for (let i = 0; i <= samplesRight; i++) {
        const x = (2 * W / 3) + (i / samplesRight) * leftSegment;
        const phase = 2 * Math.PI * sRight * (t + (i / samplesRight) * 0.02);
        const y = midY + waveAmp * Math.sin(phase);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();

      // Center: Interference pattern showing binaural beat
      ctx.globalCompositeOperation = 'screen';
      const centerStart = W / 3;
      const centerWidth = W / 3;
      const centerSamples = 150;

      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = `rgba(232,238,247,${0.55 + envelope * 0.25})`;
      ctx.shadowBlur = 16;
      ctx.shadowColor = '#e8eef7';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      
      for (let i = 0; i <= centerSamples; i++) {
        const x = centerStart + (i / centerSamples) * centerWidth;
        const localT = t + (i / centerSamples) * 0.015;
        
        // Superposition: sum of both frequencies
        const leftWave = Math.sin(2 * Math.PI * sLeft * localT);
        const rightWave = Math.sin(2 * Math.PI * sRight * localT);
        const interference = (leftWave + rightWave) / 2;
        
        const y = midY + waveAmp * interference * (0.7 + envelope * 0.3);
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();

      // Pulsing center glow representing beat frequency
      ctx.globalCompositeOperation = 'soft-light';
      ctx.save();
      const centerX = W / 2;
      const glowRadius = 36 + envelope * 24;
      const gradient = ctx.createRadialGradient(centerX, midY, 0, centerX, midY, glowRadius);
      gradient.addColorStop(0, `rgba(232,238,247,${envelope * 0.25})`);
      gradient.addColorStop(0.3, `rgba(164,217,255,${envelope * 0.18})`);
      gradient.addColorStop(0.6, `rgba(255,203,138,${envelope * 0.12})`);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(centerX - glowRadius, midY - glowRadius, glowRadius * 2, glowRadius * 2);
      ctx.restore();

      // Frequency bars at bottom (spectrum-like display)
      ctx.globalCompositeOperation = 'soft-light';
      const barCount = 32;
      const barWidth = W / barCount;
      const barMaxHeight = H * 0.1;
      
      for (let i = 0; i < barCount; i++) {
        const x = i * barWidth;
        const normalizedPos = i / barCount;
        
        // Create frequency response: peaks at left, center (beat), and right
        let intensity = 0;
        if (normalizedPos < 0.33) {
          // Left channel emphasis
          intensity = (0.33 - normalizedPos) / 0.33;
        } else if (normalizedPos > 0.67) {
          // Right channel emphasis
          intensity = (normalizedPos - 0.67) / 0.33;
        } else {
          // Center (beat frequency)
          const centerDist = Math.abs(normalizedPos - 0.5) / 0.17;
          intensity = Math.max(0, 1 - centerDist);
        }
        
        // Modulate by beat envelope
        const barHeight = barMaxHeight * intensity * (0.2 + envelope * 0.4);
        
        // Gradient for bars
        const barGrad = ctx.createLinearGradient(0, H, 0, H - barHeight);
        if (normalizedPos < 0.4) {
          barGrad.addColorStop(0, 'rgba(74,163,255,0.45)');
          barGrad.addColorStop(1, 'rgba(74,163,255,0.15)');
        } else if (normalizedPos > 0.6) {
          barGrad.addColorStop(0, 'rgba(255,163,74,0.45)');
          barGrad.addColorStop(1, 'rgba(255,163,74,0.15)');
        } else {
          barGrad.addColorStop(0, 'rgba(232,238,247,0.55)');
          barGrad.addColorStop(1, 'rgba(164,217,255,0.25)');
        }
        
        ctx.fillStyle = barGrad;
        ctx.fillRect(x + 1, H - barHeight, barWidth - 2, barHeight);
      }

      // Edge vignette to fade into page background
      ctx.globalCompositeOperation = 'soft-light';
      const fadeW = W * 0.08;
      const leftFade = ctx.createLinearGradient(0, 0, fadeW, 0);
      leftFade.addColorStop(0, 'rgba(10,14,20,0.6)');
      leftFade.addColorStop(1, 'rgba(10,14,20,0)');
      ctx.fillStyle = leftFade;
      ctx.fillRect(0, 0, fadeW, H);

      const rightFade = ctx.createLinearGradient(W - fadeW, 0, W, 0);
      rightFade.addColorStop(0, 'rgba(10,14,20,0)');
      rightFade.addColorStop(1, 'rgba(10,14,20,0.6)');
      ctx.fillStyle = rightFade;
      ctx.fillRect(W - fadeW, 0, fadeW, H);

      // Top/bottom vignette for further blending
      const fadeH = H * 0.25;
      const topFade = ctx.createLinearGradient(0, 0, 0, fadeH);
      topFade.addColorStop(0, 'rgba(10,14,20,0.55)');
      topFade.addColorStop(1, 'rgba(10,14,20,0.0)');
      ctx.fillStyle = topFade;
      ctx.fillRect(0, 0, W, fadeH);

      const bottomFade = ctx.createLinearGradient(0, H - fadeH, 0, H);
      bottomFade.addColorStop(0, 'rgba(10,14,20,0.0)');
      bottomFade.addColorStop(1, 'rgba(10,14,20,0.55)');
      ctx.fillStyle = bottomFade;
      ctx.fillRect(0, H - fadeH, W, fadeH);

      // Restore composite mode
      ctx.globalCompositeOperation = prevComp;

      rafRef.current = prefersReduced ? null : requestAnimationFrame(render);
    };

    if (running && !prefersReduced) {
      rafRef.current = requestAnimationFrame(render);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [leftHz, rightHz, running]);

  return (
    <div className="visualizer-fixed">
      <canvas ref={canvasRef} />
    </div>
  );
}
