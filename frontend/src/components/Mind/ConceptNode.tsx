import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { PALETTE } from '@/lib/palette';
import type { ConceptNode as ConceptNodeType } from '@/types';

interface ConceptNodeProps {
  node: ConceptNodeType;
  /**
   * Read fresh every frame instead of passed as a prop — the parent (Mind/World
   * layers) does not re-render on every tick, so a plain number prop would go
   * stale. These closures read directly from the parent's animation ref maps.
   */
  getAppear: () => number;
  getEmphasis: () => number;
}

/**
 * A single floating concept — a soft glow sphere with a label, appearing
 * gradually rather than popping in, so the user watches the idea arrive.
 */
export function ConceptNode({ node, getAppear, getEmphasis }: ConceptNodeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const seed = useRef(Math.random() * Math.PI * 2).current;

  const isSeed = node.origin === 'question';
  const baseColor = isSeed ? PALETTE.orangeHot : PALETTE.cyan;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const appear = getAppear();
    const emphasis = getEmphasis();
    if (groupRef.current) {
      const scale = Math.max(0.0001, appear) * (0.9 + Math.sin(t * 1.4 + seed) * 0.05) * (0.7 + emphasis * 0.3);
      groupRef.current.scale.setScalar(scale);
      groupRef.current.position.y = node.position[1] + Math.sin(t * 0.6 + seed) * 0.08;
      groupRef.current.visible = appear > 0.02;
    }
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = (0.35 + Math.sin(t * 2 + seed) * 0.08) * (0.5 + emphasis * 0.5);
    }
    if (labelRef.current) {
      labelRef.current.style.opacity = String(Math.max(0, Math.min(1, appear)) * (0.55 + emphasis * 0.45));
    }
  });

  return (
    <group ref={groupRef} position={node.position}>
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.16 * node.weight, 16, 16]} />
        <meshBasicMaterial color={baseColor} transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.045 * node.weight, 12, 12]} />
        <meshBasicMaterial color={isSeed ? PALETTE.orangeHot : PALETTE.ink} />
      </mesh>
      {/*
        Labels use an HTML/CSS overlay (drei's <Html>) rather than in-WebGL
        SDF text. drei's <Text> (troika-three-text) fetches its default font
        from a CDN and suspends until it loads — on a slow or blocked network
        that suspends forever, and because it shares the Scene's Suspense
        boundary, it blanks the ENTIRE 3D scene, not just the label. <Html>
        reuses the page's own already-loaded web font and never suspends.
      */}
      <Html center distanceFactor={7} occlude={false} style={{ pointerEvents: 'none' }}>
        <div
          ref={labelRef}
          className="mono"
          style={{
            opacity: 0,
            whiteSpace: 'nowrap',
            fontSize: isSeed ? 15 : 11,
            letterSpacing: '0.08em',
            color: isSeed ? '#ffd8a8' : '#cfe9f2',
            textShadow: '0 0 10px rgba(0,0,0,0.8)',
            transform: `translateY(${-18 - node.weight * 6}px)`,
          }}
        >
          {node.label}
        </div>
      </Html>
    </group>
  );
}
