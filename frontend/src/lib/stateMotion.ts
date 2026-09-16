import type { AIState } from '@/types';

/**
 * Central mapping from AI state -> target visual parameters. Every entity
 * component reads the SAME targets and eases toward them independently, so
 * states stay visually consistent across Face / Core / Environment without
 * duplicating the mapping in five places.
 */
export interface StateMotionTargets {
  /** Core size / brightness, 0..1 */
  coreIntensity: number;
  /** Core surface turbulence, 0..1 (THINKING/DEEP_THOUGHT) */
  coreUnstable: number;
  /** How tightly the face particles hold their shape, 0..1 */
  faceCohesion: number;
  /** Ambient particles pulled toward the core, 0..1 (LISTENING) */
  particlesInward: number;
  /** Ambient particles orbiting faster / more chaotically, 0..1 (THINKING) */
  particlesCirculate: number;
  /** Neural line visibility / vibration, 0..1 */
  neuralActivity: number;
  /** Environment wave energy, 0..1 */
  environmentEnergy: number;
  /** Overall breathing speed multiplier */
  breatheSpeed: number;
}

const TARGETS: Record<AIState, StateMotionTargets> = {
  IDLE: {
    coreIntensity: 0.32,
    coreUnstable: 0.08,
    faceCohesion: 0.92,
    particlesInward: 0,
    particlesCirculate: 0.1,
    neuralActivity: 0.22,
    environmentEnergy: 0.15,
    breatheSpeed: 0.6,
  },
  LISTENING: {
    coreIntensity: 0.6,
    coreUnstable: 0.15,
    faceCohesion: 0.85,
    particlesInward: 0.85,
    particlesCirculate: 0.2,
    neuralActivity: 0.7,
    environmentEnergy: 0.35,
    breatheSpeed: 1.1,
  },
  THINKING: {
    coreIntensity: 0.55,
    coreUnstable: 0.85,
    faceCohesion: 0.55,
    particlesInward: 0.25,
    particlesCirculate: 1,
    neuralActivity: 0.85,
    environmentEnergy: 0.55,
    breatheSpeed: 0.75,
  },
  DEEP_THOUGHT: {
    coreIntensity: 0.5,
    coreUnstable: 1,
    faceCohesion: 0.4,
    particlesInward: 0.1,
    particlesCirculate: 1.3,
    neuralActivity: 0.9,
    environmentEnergy: 0.4,
    breatheSpeed: 0.5,
  },
  SPEAKING: {
    coreIntensity: 0.85,
    coreUnstable: 0.35,
    faceCohesion: 0.78,
    particlesInward: 0.3,
    particlesCirculate: 0.5,
    neuralActivity: 1,
    environmentEnergy: 0.9,
    breatheSpeed: 1.3,
  },
  EXCITED: {
    coreIntensity: 1,
    coreUnstable: 0.5,
    faceCohesion: 0.7,
    particlesInward: 0.2,
    particlesCirculate: 0.8,
    neuralActivity: 1,
    environmentEnergy: 1,
    breatheSpeed: 1.8,
  },
  CONNECTED: {
    coreIntensity: 0.7,
    coreUnstable: 0.2,
    faceCohesion: 0.95,
    particlesInward: 0.4,
    particlesCirculate: 0.3,
    neuralActivity: 0.6,
    environmentEnergy: 0.5,
    breatheSpeed: 0.9,
  },
  ERROR: {
    coreIntensity: 0.4,
    coreUnstable: 0.6,
    faceCohesion: 0.6,
    particlesInward: 0,
    particlesCirculate: 0.4,
    neuralActivity: 0.3,
    environmentEnergy: 0.2,
    breatheSpeed: 0.4,
  },
};

export function getStateTargets(state: AIState): StateMotionTargets {
  return TARGETS[state];
}

/** Exponential ease toward target — frame-rate independent. */
export function damp(current: number, target: number, lambda: number, dt: number) {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}
