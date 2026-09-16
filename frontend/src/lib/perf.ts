/**
 * Coarse device-tier detection. This is intentionally simple for the
 * prototype: a static budget decided once at boot rather than a live FPS
 * governor. Good enough to keep 60fps as a target on desktop and stay
 * smooth on mobile; a proper adaptive-quality pass is a documented next
 * step (see README "Performance" section).
 */
export interface QualityBudget {
  isMobile: boolean;
  dpr: [number, number];
  bustRings: number;
  bustPointsPerRing: number;
  ambientParticles: number;
  terrainSegments: number;
  landscapeParticles: number;
  bloom: boolean;
}

export function getQualityBudget(): QualityBudget {
  const isMobile =
    typeof window !== 'undefined' &&
    (window.innerWidth < 768 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent));

  if (isMobile) {
    return {
      isMobile: true,
      dpr: [1, 1.5],
      bustRings: 26,
      bustPointsPerRing: 28,
      ambientParticles: 500,
      terrainSegments: 48,
      landscapeParticles: 700,
      bloom: false,
    };
  }

  return {
    isMobile: false,
    dpr: [1, 2],
    bustRings: 44,
    bustPointsPerRing: 48,
    ambientParticles: 1400,
    terrainSegments: 96,
    landscapeParticles: 2200,
    bloom: true,
  };
}
