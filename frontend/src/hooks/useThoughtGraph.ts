import { useCallback } from 'react';
import { store } from '@/state/store';
import { think } from '@/lib/mockAI';
import type { AIThought } from '@/types';

/**
 * Runs the (mock) reasoning pipeline and lays the resulting concepts out in
 * 3D space around the entity, then merges them into the persistent WORLD
 * graph. Layout is a simple radial + jitter placement — good enough for a
 * handful of nodes per turn, deterministic, and cheap to recompute.
 */
function layoutConcepts(thought: AIThought, ring: number) {
  const n = thought.concepts.length;
  thought.concepts.forEach((c, i) => {
    if (c.origin === 'question') {
      c.position = [0, 1.4, 0.2];
      return;
    }
    const angle = (i / Math.max(1, n - 1)) * Math.PI * 2 + ring * 0.7;
    const radius = 2.6 + (c.depth - 1) * 0.6;
    const height = 0.4 + Math.sin(i * 1.7) * 0.9;
    c.position = [Math.cos(angle) * radius, height, Math.sin(angle) * radius];
  });
}

export function useThoughtGraph() {
  const runThought = useCallback(async (query: string): Promise<AIThought> => {
    const s = store.getState();
    const turnIndex = s.turnCount + 1;
    const thought = await think(query, turnIndex);
    layoutConcepts(thought, s.world.nodes.length);

    // Merge into the persistent WORLD graph: dedupe by label so revisited
    // concepts light up an existing node instead of spawning a duplicate.
    const existingByLabel = new Map(s.world.nodes.map((n) => [n.label, n]));
    const mergedNodes = [...s.world.nodes];
    const idRemap = new Map<string, string>();

    thought.concepts.forEach((c) => {
      const existing = existingByLabel.get(c.label);
      if (existing) {
        idRemap.set(c.id, existing.id);
        existing.weight += 0.3;
        existing.createdAt = turnIndex;
      } else {
        mergedNodes.push(c);
      }
    });

    const mergedEdges = [...s.world.edges];
    thought.edges.forEach((e) => {
      const source = idRemap.get(e.source) ?? e.source;
      const target = idRemap.get(e.target) ?? e.target;
      const dupe = mergedEdges.find(
        (existing) =>
          (existing.source === source && existing.target === target) ||
          (existing.source === target && existing.target === source),
      );
      if (!dupe) mergedEdges.push({ ...e, source, target, progress: 0 });
    });

    store.setState({
      currentThought: thought,
      world: { nodes: mergedNodes, edges: mergedEdges },
      turnCount: turnIndex,
    });

    return thought;
  }, []);

  return { runThought };
}
