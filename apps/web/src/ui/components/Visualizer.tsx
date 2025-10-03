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
  const lastSizeRef = useRef<{w:number;h:number}>({w:0,h:0});

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
      lastSizeRef.current = { w, h };
    };

    resize();
    window.addEventListener('resize', resize);

    const start = performance.now();
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Helpers: Catmull–Rom spline to cubic Bezier for smooth curves
    const strokeSpline = (points: Array<{x:number;y:number}>) => {
      if (points.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[Math.max(0, i - 1)];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[Math.min(points.length - 1, i + 2)];
        // Catmull-Rom to Bezier
        const c1x = p1.x + (p2.x - p0.x) / 6;
        const c1y = p1.y + (p2.y - p0.y) / 6;
        const c2x = p2.x - (p3.x - p1.x) / 6;
        const c2y = p2.y - (p3.y - p1.y) / 6;
        ctx.bezierCurveTo(c1x, c1y, c2x, c2y, p2.x, p2.y);
      }
      ctx.stroke();
    };

    // Visualizer segments: left oscilloscope, center interference, right oscilloscope
    const render = (tNow: number) => {
      const t = (tNow - start) / 1000;
      const W = canvas.width / dpr;
      const H = canvas.height / dpr;

      // Temporal accumulation for subtle motion blur
      // If size changed, hard clear; otherwise, fade previous frame
      const { w: lw, h: lh } = lastSizeRef.current;
      const sizeChanged = lw !== W || lh !== H;
      if (sizeChanged) {
        ctx.clearRect(0, 0, W, H);
        lastSizeRef.current = { w: W, h: H };
      } else {
        // Transparent fade (no black frame): gradually erase previous frame
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.fillRect(0, 0, W, H);
        // Ensure edges never accumulate residuals
        ctx.globalCompositeOperation = 'source-over';
        ctx.clearRect(0, 0, 3, H);
        ctx.clearRect(W - 3, 0, 3, H);
        ctx.restore();
      }

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

      // Removed center background band to avoid any perceived rounded corners

      // Use compositing for nicer glow integration
      const prevComp = ctx.globalCompositeOperation;
      // We'll draw background additions with soft-light, waves with screen
      // (we switch as needed below)

      // Left waveform oscilloscope (0 to W/3) with spline and edge-aware glow cutoff
      ctx.globalCompositeOperation = 'screen';
      ctx.save();
      const leftStroke = ctx.createLinearGradient(0, 0, W / 3, 0);
      leftStroke.addColorStop(0, 'rgba(74,163,255,0.9)');
      leftStroke.addColorStop(1, 'rgba(74,163,255,0.2)');
      ctx.strokeStyle = leftStroke as unknown as string;
      // Two-pass: draw base line without shadow, then inner segment with shadow
      const leftPoints: Array<{x:number;y:number}> = [];
      const leftSegment = W / 3;
      const samplesLeft = 140;
      for (let i = 0; i <= samplesLeft; i++) {
        const x = (i / samplesLeft) * leftSegment;
        const phase = 2 * Math.PI * sLeft * (t + (i / samplesLeft) * 0.02);
        const y = midY + waveAmp * Math.sin(phase);
        leftPoints.push({ x, y });
      }
      ctx.shadowBlur = 0;
      ctx.shadowColor = '#4aa3ff';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      strokeSpline(leftPoints);
      // Inner glow pass (clip to avoid edge glow)
      ctx.save();
      ctx.beginPath();
      ctx.rect(leftSegment * 0.06, 0, leftSegment * 0.88, H);
      ctx.clip();
      ctx.shadowBlur = 10;
      ctx.lineWidth = 2.2;
      strokeSpline(leftPoints);
      ctx.restore();
      ctx.restore();

      // Right waveform oscilloscope (2W/3 to W) with spline and edge-aware glow cutoff
      ctx.globalCompositeOperation = 'screen';
      ctx.save();
      const rightStroke = ctx.createLinearGradient(2 * W / 3, 0, W, 0);
      rightStroke.addColorStop(0, 'rgba(255,163,74,0.2)');
      rightStroke.addColorStop(1, 'rgba(255,163,74,0.9)');
      ctx.strokeStyle = rightStroke as unknown as string;
      const rightPoints: Array<{x:number;y:number}> = [];
      const samplesRight = 140;
      for (let i = 0; i <= samplesRight; i++) {
        const x = (2 * W / 3) + (i / samplesRight) * leftSegment;
        const phase = 2 * Math.PI * sRight * (t + (i / samplesRight) * 0.02);
        const y = midY + waveAmp * Math.sin(phase);
        rightPoints.push({ x, y });
      }
      ctx.shadowBlur = 0;
      ctx.shadowColor = '#ffa34a';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      strokeSpline(rightPoints);
      // Inner glow pass (clip to avoid edge glow)
      ctx.save();
      ctx.beginPath();
      ctx.rect(2 * W / 3 + leftSegment * 0.06, 0, leftSegment * 0.88, H);
      ctx.clip();
      ctx.shadowBlur = 10;
      ctx.lineWidth = 2.2;
      strokeSpline(rightPoints);
      ctx.restore();
      ctx.restore();

      // Center: Interference pattern showing binaural beat (spline)
      ctx.globalCompositeOperation = 'screen';
      const centerStart = W / 3;
      const centerWidth = W / 3;
      const centerSamples = 150;

      ctx.save();
      ctx.strokeStyle = `rgba(232,238,247,${0.55 + envelope * 0.25})`;
      ctx.shadowBlur = 16;
      ctx.shadowColor = '#e8eef7';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      const centerPoints: Array<{x:number;y:number}> = [];
      for (let i = 0; i <= centerSamples; i++) {
        const x = centerStart + (i / centerSamples) * centerWidth;
        const localT = t + (i / centerSamples) * 0.015;
        const leftWave = Math.sin(2 * Math.PI * sLeft * localT);
        const rightWave = Math.sin(2 * Math.PI * sRight * localT);
        const interference = (leftWave + rightWave) / 2;
        const y = midY + waveAmp * interference * (0.7 + envelope * 0.3);
        centerPoints.push({ x, y });
      }
      strokeSpline(centerPoints);
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

      // Spectrum bars removed for a cleaner, more ambient background

      // Edge vignettes removed to eliminate any residual dark frame at sides

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
