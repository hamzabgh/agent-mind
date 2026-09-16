import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { ConceptNode } from './ConceptNode';
import { ConnectionLines } from './ConnectionLines';
import { store, useStore } from '@/state/store';

/**
 * WORLD layer — the persistent knowledge graph. Every concept ever
 * introduced stays here, explorable and revisitable; older concepts dim
 * rather than disappear. Only meaningfully visible once the user switches
 * to the WORLD view (EXPLORE / WORK nav) so it doesn't clutter the default
 * FACE-centric experience.
 */
export function KnowledgeGraph() {
  const nodes = useStore((s) => s.world.nodes);
  const edges = useStore((s) => s.world.edges);
  const appearRef = useRef<Map<string, number>>(new Map());
  const groupVisibilityRef = useRef(0);

  useFrame((_, delta) => {
    const dt = Math.min(0.1, delta);
    const s = store.getState();
    const target = s.view === 'WORLD' ? 1 : 0;
    groupVisibilityRef.current += (target - groupVisibilityRef.current) * Math.min(1, dt * 1.2);

    nodes.forEach((n) => {
      const current = appearRef.current.get(n.id) ?? 0;
      appearRef.current.set(n.id, Math.min(1, current + dt * 0.9));
    });
  });

  if (nodes.length === 0) return null;

  return (
    <group>
      {nodes.map((node) => {
        const s = store.getState();
        const age = Math.max(0, s.turnCount - node.createdAt);
        const recencyEmphasis = Math.max(0.35, 1 - age * 0.16);
        return (
          <ConceptNode
            key={node.id}
            node={node}
            getAppear={() => (appearRef.current.get(node.id) ?? 0) * groupVisibilityRef.current}
            getEmphasis={() => recencyEmphasis}
          />
        );
      })}
      <ConnectionLines nodes={nodes} edges={edges} revealSpeed={1.2} />
    </group>
  );
}
