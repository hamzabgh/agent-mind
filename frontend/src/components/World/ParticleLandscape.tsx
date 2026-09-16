import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import vertexShader from '@/shaders/particles.vert.glsl?raw';
import fragmentShader from '@/shaders/particles.frag.glsl?raw';
import { PALETTE } from '@/lib/palette';
import { store } from '@/state/store';
import { damp, getStateTargets } from '@/lib/stateMotion';

interface ParticleLandscapeProps {
  count: number;
}

/**
 * A far, sparse field of drifting light — depth behind the entity so the
 * scene reads as an environment rather than an object on a black void.
 * Reuses the ambient-particle shader at a much larger, slower scale.
 */
export function ParticleLandscape({ count }: ParticleLandscapeProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { gl } = useThree();
  const circulateRef = useRef(0.05);

  const geometry = useMemo(() => {
    const seeds = new Float32Array(count);
    const radii = new Float32Array(count);
    const speeds = new Float32Array(count);
    const heights = new Float32Array(count);
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      seeds[i] = Math.random();
      radii[i] = 6 + Math.random() * 11;
      speeds[i] = (Math.random() - 0.5) * 0.08;
      heights[i] = (Math.random() - 0.5) * 4 - 0.5;
      const a = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.cos(a) * radii[i];
      positions[i * 3 + 1] = heights[i];
      positions[i * 3 + 2] = Math.sin(a) * radii[i];
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    geo.setAttribute('aRadius', new THREE.BufferAttribute(radii, 1));
    geo.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
    geo.setAttribute('aHeight', new THREE.BufferAttribute(heights, 1));
    geo.computeBoundingSphere();
    return geo;
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uInward: { value: 0 },
      uCirculate: { value: 0.05 },
      uAudio: { value: 0 },
      uPixelRatio: { value: gl.getPixelRatio() },
      uColorCyan: { value: PALETTE.cyanDim.clone() },
      uColorOrange: { value: PALETTE.orange.clone() },
    }),
    [gl],
  );

  useFrame((frameState, delta) => {
    const dt = Math.min(0.1, delta);
    const s = store.getState();
    const targets = getStateTargets(s.aiState);
    circulateRef.current = damp(circulateRef.current, targets.particlesCirculate * 0.3, 1.5, dt);

    const mat = materialRef.current;
    if (mat) {
      mat.uniforms.uTime.value = frameState.clock.elapsedTime;
      mat.uniforms.uCirculate.value = circulateRef.current;
      mat.uniforms.uAudio.value = s.audio.amplitude * 0.4;
    }
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
