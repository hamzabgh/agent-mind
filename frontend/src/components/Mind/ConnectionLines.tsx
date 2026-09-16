import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PALETTE } from '@/lib/palette';
import type { ConceptEdge, ConceptNode } from '@/types';

interface ConnectionLinesProps {
  nodes: ConceptNode[];
  edges: ConceptEdge[];
  /** how fast new connections draw themselves in, higher = faster */
  revealSpeed?: number;
}

interface EdgeAnim {
  progress: number;
  delay: number;
}

/**
 * Renders the "connections gradually form" step of the Mind visualization:
 * each edge grows from its source node toward its target rather than
 * appearing instantly, then carries a faint traveling pulse once formed.
 */
export function ConnectionLines({ nodes, edges, revealSpeed = 0.9 }: ConnectionLinesProps) {
  const nodeById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const animsRef = useRef<Map<string, EdgeAnim>>(new Map());
  const lineRef = useRef<THREE.LineSegments>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(edges.length * 6), 3));
    return geo;
  }, [edges.length]);

  useFrame((state, delta) => {
    const dt = Math.min(0.1, delta);
    const positions = geometry.attributes.position as THREE.BufferAttribute;
    let newestIndex = -1;

    edges.forEach((edge, i) => {
      let anim = animsRef.current.get(edge.id);
      if (!anim) {
        newestIndex++;
        anim = { progress: 0, delay: newestIndex * 0.18 };
        animsRef.current.set(edge.id, anim);
      }
      if (anim.delay > 0) {
        anim.delay -= dt;
      } else {
        anim.progress = Math.min(1, anim.progress + dt * revealSpeed);
      }

      const source = nodeById.get(edge.source);
      const target = nodeById.get(edge.target);
      if (!source || !target) return;

      const sx = source.position[0],
        sy = source.position[1],
        sz = source.position[2];
      const tx = THREE.MathUtils.lerp(sx, target.position[0], anim.progress);
      const ty = THREE.MathUtils.lerp(sy, target.position[1], anim.progress);
      const tz = THREE.MathUtils.lerp(sz, target.position[2], anim.progress);

      positions.setXYZ(i * 2, sx, sy, sz);
      positions.setXYZ(i * 2 + 1, tx, ty, tz);
    });

    positions.needsUpdate = true;
    geometry.computeBoundingSphere();

    if (lineRef.current) {
      const mat = lineRef.current.material as THREE.LineBasicMaterial;
      const t = state.clock.elapsedTime;
      mat.opacity = 0.35 + Math.sin(t * 1.5) * 0.08;
    }
  });

  if (edges.length === 0) return null;

  return (
    <lineSegments ref={lineRef} geometry={geometry}>
      <lineBasicMaterial
        color={PALETTE.cyan}
        transparent
        opacity={0.4}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  );
}
