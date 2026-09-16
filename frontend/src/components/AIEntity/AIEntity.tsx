import { NeuralFace } from './NeuralFace';
import { EnergyCore } from './EnergyCore';
import { ParticleField } from './ParticleField';
import { NeuralLines } from './NeuralLines';
import type { QualityBudget } from '@/lib/perf';

interface AIEntityProps {
  quality: QualityBudget;
}

/**
 * FACE — the physical presence of the entity. Composes the wireframe
 * bust silhouette, the Intelligence Core (sitting at the base of the neck,
 * visibly alive), the ambient particle swarm, and the neural filaments
 * connecting them into one nervous system.
 */
export function AIEntity({ quality }: AIEntityProps) {
  return (
    <group>
      <NeuralLines />
      <EnergyCore />
      <NeuralFace ringCount={quality.bustRings} pointsPerRing={quality.bustPointsPerRing} />
      <ParticleField count={quality.ambientParticles} />
    </group>
  );
}
