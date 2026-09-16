import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import vertexShader from '@/shaders/neuralBust.vert.glsl?raw';
import fragmentShader from '@/shaders/neuralBust.frag.glsl?raw';
import { generateBustRings } from '@/lib/generateBust';
import { PALETTE } from '@/lib/palette';
import { store } from '@/state/store';
import { damp, getStateTargets } from '@/lib/stateMotion';

interface NeuralFaceProps {
  ringCount: number;
  pointsPerRing: number;
}

/**
 * The Face — a featureless head/neck/shoulders silhouette built from fine
 * horizontal wireframe contour rings, the way concentrated data would
 * outline a presence rather than sculpt a literal face. No eyes, brow, nose
 * or mouth by design — see generateBust.ts.
 */
export function NeuralFace({ ringCount, pointsPerRing }: NeuralFaceProps) {
  const lineRef = useRef<THREE.LineSegments>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const activityRef = useRef(0.2);
  const bootRef = useRef(0);

  const geometry = useMemo(() => {
    const { positions, seeds, heightT } = generateBustRings(ringCount, pointsPerRing);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    geo.setAttribute('aHeightT', new THREE.BufferAttribute(heightT, 1));
    geo.computeBoundingSphere();
    return geo;
  }, [ringCount, pointsPerRing]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAudio: { value: 0 },
      uBoot: { value: 0 },
      uActivity: { value: 0.2 },
      uColorCyan: { value: PALETTE.cyan.clone() },
      uColorWarm: { value: PALETTE.orangeHot.clone() },
    }),
    [],
  );

  useFrame((frameState, delta) => {
    const dt = Math.min(0.1, delta);
    const s = store.getState();
    const targets = getStateTargets(s.aiState);

    activityRef.current = damp(activityRef.current, targets.neuralActivity, 2.5, dt);
    bootRef.current = Math.min(1, bootRef.current + dt * 0.4);

    const mat = materialRef.current;
    if (mat) {
      mat.uniforms.uTime.value = frameState.clock.elapsedTime;
      mat.uniforms.uAudio.value = s.audio.amplitude;
      mat.uniforms.uBoot.value = bootRef.current;
      mat.uniforms.uActivity.value = activityRef.current;
    }

    if (lineRef.current) {
      lineRef.current.rotation.y = Math.sin(frameState.clock.elapsedTime * 0.06) * 0.1;
    }
  });

  return (
    <lineSegments ref={lineRef} geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  );
}
