import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useEffect, useRef } from 'react';
import { DigitalTerrain } from './DigitalTerrain';
import { ParticleLandscape } from './ParticleLandscape';
import { PALETTE } from '@/lib/palette';
import { store } from '@/state/store';
import { damp, getStateTargets } from '@/lib/stateMotion';
import type { QualityBudget } from '@/lib/perf';

interface NeuralEnvironmentProps {
  quality: QualityBudget;
}

/**
 * WORLD, ambient layer — the procedural environment the entity exists
 * inside of. Deliberately "digital nature" rather than a neon cyberpunk
 * skyline: noise-shaped terrain + a sparse drifting particle field, both
 * tied into the same state-driven energy as the Face and Core.
 */
export function NeuralEnvironment({ quality }: NeuralEnvironmentProps) {
  const { scene } = useThree();
  const fogRef = useRef<THREE.FogExp2 | null>(null);

  useEffect(() => {
    const fog = new THREE.FogExp2(PALETTE.bg.getHex(), 0.055);
    scene.fog = fog;
    fogRef.current = fog;
    return () => {
      scene.fog = null;
    };
  }, [scene]);

  useFrame((_, delta) => {
    const dt = Math.min(0.1, delta);
    const s = store.getState();
    const targets = getStateTargets(s.aiState);
    if (fogRef.current) {
      const target = 0.05 + targets.environmentEnergy * 0.015;
      fogRef.current.density = damp(fogRef.current.density, target, 1, dt);
    }
  });

  return (
    <group>
      <DigitalTerrain segments={quality.terrainSegments} />
      <ParticleLandscape count={quality.landscapeParticles} />
    </group>
  );
}
