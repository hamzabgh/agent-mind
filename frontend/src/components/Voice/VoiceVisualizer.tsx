import { useEffect, useRef } from 'react';
import { store } from '@/state/store';

interface VoiceVisualizerProps {
  active: boolean;
}

/**
 * A minimal ring of audio-reactive bars around the TALK button — NOT a
 * conventional waveform/recording UI. Deliberately quiet: the entity itself
 * is where the real "I am listening" signal lives.
 */
export function VoiceVisualizer({ active }: VoiceVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf: number;
    const barCount = 28;

    const render = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      const s = store.getState();
      const level = active ? s.audio.amplitude : 0;

      const cx = width / 2;
      const cy = height / 2;
      const baseRadius = Math.min(width, height) / 2 - 6;

      for (let i = 0; i < barCount; i++) {
        const angle = (i / barCount) * Math.PI * 2;
        const jitter = Math.sin(performance.now() * 0.004 + i * 1.7) * 0.5 + 0.5;
        const len = active ? 3 + level * 14 * (0.4 + jitter * 0.6) : 2 + jitter * 1.5;
        const x1 = cx + Math.cos(angle) * baseRadius;
        const y1 = cy + Math.sin(angle) * baseRadius;
        const x2 = cx + Math.cos(angle) * (baseRadius + len);
        const y2 = cy + Math.sin(angle) * (baseRadius + len);

        ctx.strokeStyle = active ? 'rgba(95, 216, 255, 0.8)' : 'rgba(95, 216, 255, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  return <canvas ref={canvasRef} width={120} height={120} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />;
}
