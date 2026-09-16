import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { ConceptNode } from './ConceptNode';
import { ConnectionLines } from './ConnectionLines';
import { store, useStore } from '@/state/store';

const ACTIVE_STATES = new Set(['THINKING', 'DEEP_THOUGHT', 'SPEAKING', 'EXCITED']);

/**
 * MIND layer, current turn: renders the concepts + connections for whatever
 * question is being processed right now. This is the "don't just show a
 * text answer — visualize the concepts first" step of the experience.
 * Once the turn ends, these nodes hand off to the persistent KnowledgeGraph
 * (WORLD layer) and fade from here.
 */
export function ThoughtNodes() {
  const thought = useStore((s) => s.currentThought);
  const appearRef = useRef<Map<string, number>>(new Map());
  const groupOpacityRef = useRef(0);

  const nodes = useMemo(() => thought?.concepts ?? [], [thought]);
  const edges = useMemo(() => thought?.edges ?? [], [thought]);

  useFrame((_, delta) => {
    const dt = Math.min(0.1, delta);
    const s = store.getState();
    // Once the user has navigated to WORLD, the persistent KnowledgeGraph
    // already renders these same (merged-by-reference) nodes — showing both
    // would double the labels/connections on screen.
    const active = ACTIVE_STATES.has(s.aiState) && !!thought && s.view === 'FACE';
    const target = active ? 1 : 0;
    groupOpacityRef.current += (target - groupOpacityRef.current) * Math.min(1, dt * 1.5);

    nodes.forEach((n, i) => {
      const current = appearRef.current.get(n.id) ?? 0;
      const delay = i * 0.12;
      const next = active
        ? Math.min(1, current + Math.max(0, dt * 1.4 - delay * 0.02))
        : Math.max(0, current - dt * 0.8);
      appearRef.current.set(n.id, next);
    });
  });

  if (!thought || nodes.length === 0) return null;

  return (
    <group>
      {nodes.map((node) => (
        <ConceptNode
          key={node.id}
          node={node}
          getAppear={() => appearRef.current.get(node.id) ?? 0}
          getEmphasis={() => 1}
        />
      ))}
      <ConnectionLines nodes={nodes} edges={edges} revealSpeed={0.8} />
    </group>
  );
}
