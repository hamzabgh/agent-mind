import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import vertexShader from '@/shaders/energyCore.vert.glsl?raw';
import fragmentShader from '@/shaders/energyCore.frag.glsl?raw';
import { PALETTE } from '@/lib/palette';
import { store } from '@/state/store';
import { damp, getStateTargets } from '@/lib/stateMotion';
import { CORE_ANCHOR } from '@/lib/generateBust';

const CORE_RADIUS = 0.34;
// Sits at the base of the neck, tucked just behind the collar — a glow the
// wireframe silhouette catches rather than a shape floating in open space.
const CORE_BASE_POSITION = new THREE.Vector3(...CORE_ANCHOR);

/**
 * The Intelligence Core — THOUGHT made visible. Not a glowing sphere: an
 * organic, noise-displaced energy structure that expands, contracts, sends
 * waves outward, and visibly drifts in place — a spot of light that moves,
 * not a static lamp. This is the single most visually important element in
 * the scene, so everything here reacts to state + live audio.
 */
export function EnergyCore() {
  const groupRef = useRef<THREE.Group>(null);
  const coreMat = useRef<THREE.ShaderMaterial>(null);
  const innerMat = useRef<THREE.ShaderMaterial>(null);
  const wireRef = useRef<THREE.Mesh>(null);
  const ringsRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  const intensityRef = useRef(0.3);
  const unstableRef = useRef(0.1);
  const scaleRef = useRef(1);
  const lastPulseAt = useRef(0);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: 0.3 },
      uAudio: { value: 0 },
      uUnstable: { value: 0.1 },
      uColorCore: { value: PALETTE.coreBase.clone() },
      uColorHot: { value: PALETTE.coreHot.clone() },
      uColorRim: { value: PALETTE.coreRim.clone() },
    }),
    [],
  );
  const innerUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: 0.5 },
      uAudio: { value: 0 },
      uUnstable: { value: 0.1 },
      uColorCore: { value: PALETTE.orange.clone() },
      uColorHot: { value: PALETTE.orangeHot.clone() },
      uColorRim: { value: PALETTE.coreRim.clone() },
    }),
    [],
  );

  const ringMeshes = useMemo(() => [0, 1, 2], []);

  useFrame((frameState, delta) => {
    const dt = Math.min(0.1, delta);
    const s = store.getState();
    const targets = getStateTargets(s.aiState);
    const audio = s.audio.amplitude;

    intensityRef.current = damp(intensityRef.current, targets.coreIntensity + audio * 0.25, 4, dt);
    unstableRef.current = damp(unstableRef.current, targets.coreUnstable, 3, dt);

    const t = frameState.clock.elapsedTime;

    if (coreMat.current) {
      coreMat.current.uniforms.uTime.value = t;
      coreMat.current.uniforms.uIntensity.value = intensityRef.current;
      coreMat.current.uniforms.uAudio.value = audio;
      coreMat.current.uniforms.uUnstable.value = unstableRef.current;
    }
    if (innerMat.current) {
      innerMat.current.uniforms.uTime.value = t * 1.3;
      innerMat.current.uniforms.uIntensity.value = intensityRef.current;
      innerMat.current.uniforms.uAudio.value = audio;
      innerMat.current.uniforms.uUnstable.value = unstableRef.current * 1.4;
    }

    // breathing scale — always alive, even at rest
    const breathe = 1 + Math.sin(t * 0.9 * targets.breatheSpeed) * 0.035 + audio * 0.12;
    scaleRef.current = damp(scaleRef.current, breathe, 6, dt);
    if (groupRef.current) {
      groupRef.current.scale.setScalar(scaleRef.current * (0.72 + intensityRef.current * 0.34));
      groupRef.current.rotation.y = t * 0.12;

      // visible drift — "that spot of light... is that move": a slow,
      // organic wander around its resting spot, on top of the breathing.
      const driftAmount = 0.05 + intensityRef.current * 0.04;
      groupRef.current.position.set(
        CORE_BASE_POSITION.x + Math.sin(t * 0.37) * driftAmount + Math.sin(t * 0.91) * driftAmount * 0.4,
        CORE_BASE_POSITION.y + Math.sin(t * 0.29 + 1.7) * driftAmount * 0.8,
        CORE_BASE_POSITION.z + Math.cos(t * 0.33) * driftAmount * 0.6,
      );
    }
    if (lightRef.current) {
      lightRef.current.intensity = 3 + intensityRef.current * 4 + audio * 3;
    }

    if (wireRef.current) {
      wireRef.current.rotation.y = -t * 0.18;
      wireRef.current.rotation.x = Math.sin(t * 0.1) * 0.3;
      const mat = wireRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.15 + intensityRef.current * 0.35;
    }

    // periodic energy waves emitted through the neural lines — rate increases with intensity
    const interval = THREE.MathUtils.lerp(2.6, 0.55, intensityRef.current);
    if (t - lastPulseAt.current > interval) {
      lastPulseAt.current = t;
    }
    if (ringsRef.current) {
      ringsRef.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh;
        const phase = ((t - i * (interval / ringMeshes.length)) / interval) % 1;
        const p = phase < 0 ? phase + 1 : phase;
        const scale = 0.6 + p * 3.2;
        mesh.scale.setScalar(scale);
        const mat = mesh.material as THREE.MeshBasicMaterial;
        mat.opacity = (1 - p) * 0.35 * (0.3 + intensityRef.current);
      });
    }
  });

  return (
    <group ref={groupRef}>
      {/* outer organic energy shell */}
      <mesh>
        <icosahedronGeometry args={[CORE_RADIUS, 5]} />
        <shaderMaterial
          ref={coreMat}
          uniforms={uniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* brighter inner core */}
      <mesh scale={0.55}>
        <icosahedronGeometry args={[CORE_RADIUS, 4]} />
        <shaderMaterial
          ref={innerMat}
          uniforms={innerUniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* rotating wireframe lattice — "the structure of thought" */}
      <mesh ref={wireRef} scale={0.78}>
        <icosahedronGeometry args={[CORE_RADIUS, 1]} />
        <meshBasicMaterial color={PALETTE.orangeHot} wireframe transparent opacity={0.25} />
      </mesh>

      {/* expanding energy wave rings */}
      <group ref={ringsRef}>
        {ringMeshes.map((i) => (
          <mesh key={i} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[CORE_RADIUS, CORE_RADIUS + 0.04, 48]} />
            <meshBasicMaterial
              color={PALETTE.orange}
              transparent
              opacity={0}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      <pointLight ref={lightRef} color={PALETTE.orangeHot} intensity={3} distance={2.2} decay={2} />
    </group>
  );
}
