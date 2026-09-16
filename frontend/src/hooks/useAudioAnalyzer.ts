import { useEffect, useRef } from 'react';
import { audioEngine } from '@/lib/audioEngine';
import { store } from '@/state/store';

/**
 * Drives the audio engine's per-frame update loop and writes the result
 * into the global store (bypassing React) so R3F components can read
 * `store.getState().audio` inside useFrame with zero extra cost.
 *
 * Mount this once near the root of the scene.
 */
export function useAudioAnalyzer() {
  const rafRef = useRef<number>();
  const lastRef = useRef<number>(performance.now());

  useEffect(() => {
    const tick = (t: number) => {
      const dt = Math.min(0.1, (t - lastRef.current) / 1000);
      lastRef.current = t;
      const bands = audioEngine.update(dt);
      store.setAudio(bands);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);
}
