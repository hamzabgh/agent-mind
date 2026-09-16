import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import vertexShader from '@/shaders/particles.vert.glsl?raw';
import fragmentShader from '@/shaders/particles.frag.glsl?raw';
import { PALETTE } from '@/lib/palette';
import { store } from '@/state/store';
import { damp, getStateTargets } from '@/lib/stateMotion';

interface ParticleFieldProps {
  count: number;
}

/**
 * Ambient particle swarm orbiting the entity — data/energy that hasn't
 * (yet) been pulled into a concept or the face. Reacts to state: drifts at
 * IDLE, migrates inward on LISTENING, circulates faster on THINKING, and
 * gets blown outward by SPEAKING audio.
 */
export function ParticleField({ count }: ParticleFieldProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { gl } = useThree();

  const inwardRef = useRef(0);
  const circulateRef = useRef(0.1);

  const geometry = useMemo(() => {
    const seeds = new Float32Array(count);
    const radii = new Float32Array(count);
    const speeds = new Float32Array(count);
    const heights = new Float32Array(count);
    const dummyPositions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      seeds[i] = Math.random();
      // Kept outside the face's own radius (~1.5-2 units) so the ambient swarm
      // reads as a halo AROUND the head rather than washing out its silhouette.
      radii[i] = 2.5 + Math.random() * 4.4;
      speeds[i] = (Math.random() - 0.5) * 0.4;
      heights[i] = (Math.random() - 0.5) * 2.2;
      // rough placeholder so BufferGeometry has a valid bounding sphere
      const a = Math.random() * Math.PI * 2;
      dummyPositions[i * 3] = Math.cos(a) * radii[i];
      dummyPositions[i * 3 + 1] = heights[i];
      dummyPositions[i * 3 + 2] = Math.sin(a) * radii[i];
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(dummyPositions, 3));
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
      uCirculate: { value: 0.1 },
      uAudio: { value: 0 },
      uPixelRatio: { value: gl.getPixelRatio() },
      uColorCyan: { value: PALETTE.cyan.clone() },
      uColorOrange: { value: PALETTE.orange.clone() },
    }),
    [gl],
  );

  useFrame((frameState, delta) => {
    const dt = Math.min(0.1, delta);
    const s = store.getState();
    const targets = getStateTargets(s.aiState);

    inwardRef.current = damp(inwardRef.current, targets.particlesInward, 2, dt);
    circulateRef.current = damp(circulateRef.current, targets.particlesCirculate, 2, dt);

    const mat = materialRef.current;
    if (mat) {
      mat.uniforms.uTime.value = frameState.clock.elapsedTime;
      mat.uniforms.uInward.value = inwardRef.current;
      mat.uniforms.uCirculate.value = circulateRef.current;
      mat.uniforms.uAudio.value = s.audio.amplitude;
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
