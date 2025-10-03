import React, { useEffect, useRef } from 'react';

export interface VisualizerProps {
  leftHz: number;
  rightHz: number;
  running: boolean;
}

// Realistic binaural beat visualizer with waveform interference
export function Visualizer({ leftHz, rightHz, running }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

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
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    const start = performance.now();

    // Visualizer segments: left oscilloscope, center interference, right oscilloscope
    const render = (tNow: number) => {
      const t = (tNow - start) / 1000;
      const W = canvas.width / dpr;
      const H = canvas.height / dpr;

      // Clear with dark background
      ctx.fillStyle = '#0a0e14';
      ctx.fillRect(0, 0, W, H);

      const midY = H / 2;
      const waveAmp = H * 0.15;
      const beat = Math.abs(leftHz - rightHz);
      
      // Modulation envelope for binaural beat (amplitude modulation)
      const beatPhase = 2 * Math.PI * beat * t;
      const envelope = 0.5 + 0.5 * Math.cos(beatPhase);

      // Left waveform oscilloscope (0 to W/3)
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = '#4aa3ff';
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#4aa3ff';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      const leftSegment = W / 3;
      const samplesLeft = 120;
      for (let i = 0; i <= samplesLeft; i++) {
        const x = (i / samplesLeft) * leftSegment;
        const phase = 2 * Math.PI * leftHz * (t + i / samplesLeft * 0.02);
        const y = midY + waveAmp * Math.sin(phase);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();

      // Right waveform oscilloscope (2W/3 to W)
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = '#ffa34a';
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#ffa34a';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      const samplesRight = 120;
      for (let i = 0; i <= samplesRight; i++) {
        const x = (2 * W / 3) + (i / samplesRight) * leftSegment;
        const phase = 2 * Math.PI * rightHz * (t + i / samplesRight * 0.02);
        const y = midY + waveAmp * Math.sin(phase);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();

      // Center: Interference pattern showing binaural beat
      const centerStart = W / 3;
      const centerWidth = W / 3;
      const centerSamples = 150;

      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = `rgba(232,238,247,${0.7 + envelope * 0.3})`;
      ctx.shadowBlur = 16;
      ctx.shadowColor = '#e8eef7';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      
      for (let i = 0; i <= centerSamples; i++) {
        const x = centerStart + (i / centerSamples) * centerWidth;
        const localT = t + (i / centerSamples) * 0.015;
        
        // Superposition: sum of both frequencies
        const leftWave = Math.sin(2 * Math.PI * leftHz * localT);
        const rightWave = Math.sin(2 * Math.PI * rightHz * localT);
        const interference = (leftWave + rightWave) / 2;
        
        const y = midY + waveAmp * interference * (0.8 + envelope * 0.4);
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();

      // Pulsing center glow representing beat frequency
      ctx.save();
      const centerX = W / 2;
      const glowRadius = 40 + envelope * 30;
      const gradient = ctx.createRadialGradient(centerX, midY, 0, centerX, midY, glowRadius);
      gradient.addColorStop(0, `rgba(232,238,247,${envelope * 0.4})`);
      gradient.addColorStop(0.3, `rgba(164,217,255,${envelope * 0.25})`);
      gradient.addColorStop(0.6, `rgba(255,203,138,${envelope * 0.15})`);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(centerX - glowRadius, midY - glowRadius, glowRadius * 2, glowRadius * 2);
      ctx.restore();

      // Frequency bars at bottom (spectrum-like display)
      const barCount = 32;
      const barWidth = W / barCount;
      const barMaxHeight = H * 0.12;
      
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
        const barHeight = barMaxHeight * intensity * (0.4 + envelope * 0.6);
        
        // Gradient for bars
        const barGrad = ctx.createLinearGradient(0, H, 0, H - barHeight);
        if (normalizedPos < 0.4) {
          barGrad.addColorStop(0, 'rgba(74,163,255,0.6)');
          barGrad.addColorStop(1, 'rgba(74,163,255,0.2)');
        } else if (normalizedPos > 0.6) {
          barGrad.addColorStop(0, 'rgba(255,163,74,0.6)');
          barGrad.addColorStop(1, 'rgba(255,163,74,0.2)');
        } else {
          barGrad.addColorStop(0, 'rgba(232,238,247,0.7)');
          barGrad.addColorStop(1, 'rgba(164,217,255,0.3)');
        }
        
        ctx.fillStyle = barGrad;
        ctx.fillRect(x + 1, H - barHeight, barWidth - 2, barHeight);
      }

      rafRef.current = requestAnimationFrame(render);
    };

    if (running) {
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
