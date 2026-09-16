import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import vertexShader from '@/shaders/terrain.vert.glsl?raw';
import fragmentShader from '@/shaders/terrain.frag.glsl?raw';
import { PALETTE } from '@/lib/palette';
import { store } from '@/state/store';
import { damp, getStateTargets } from '@/lib/stateMotion';
import type { AIState } from '@/types';

interface DigitalTerrainProps {
  segments: number;
}

/**
 * "Digital nature", not a cyberpunk city grid: a noise-shaped ground field
 * that breathes at idle, churns during THINKING, and sends a visible ripple
 * outward the moment the AI starts SPEAKING.
 */
export function DigitalTerrain({ segments }: DigitalTerrainProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const energyRef = useRef(0.15);
  const prevStateRef = useRef<AIState>('IDLE');

  const geometry = useMemo(() => new THREE.PlaneGeometry(22, 22, segments, segments), [segments]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uEnergy: { value: 0.15 },
      uWaveEnergy: { value: 0 },
      uWaveOrigin: { value: -100 },
      uColorDeep: { value: new THREE.Color('#040a0c') },
      uColorLine: { value: PALETTE.cyanDim.clone() },
    }),
    [],
  );

  useFrame((frameState, delta) => {
    const dt = Math.min(0.1, delta);
    const s = store.getState();
    const targets = getStateTargets(s.aiState);
    energyRef.current = damp(energyRef.current, targets.environmentEnergy + s.audio.amplitude * 0.3, 2, dt);

    const t = frameState.clock.elapsedTime;
    if (prevStateRef.current !== s.aiState) {
      if (s.aiState === 'SPEAKING' || s.aiState === 'EXCITED') {
        uniforms.uWaveOrigin.value = t;
        uniforms.uWaveEnergy.value = 1;
      }
      prevStateRef.current = s.aiState;
    }

    const mat = materialRef.current;
    if (mat) {
      mat.uniforms.uTime.value = t;
      mat.uniforms.uEnergy.value = energyRef.current;
    }
  });

  return (
    <mesh geometry={geometry} position={[0, -1.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
