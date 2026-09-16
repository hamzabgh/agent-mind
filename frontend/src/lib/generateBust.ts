/**
 * A smooth head + neck + shoulders silhouette, revolved around the vertical
 * axis and sampled as horizontal contour rings — matching the reference
 * look explicitly requested: a featureless bust made of fine wireframe
 * bands (like a topographic map of a head), not a scanned/sculpted face
 * with eyes, brow, nose or mouth.
 *
 * All math below happens in a RAW, unscaled profile space; `BUST_SCALE` is
 * applied once, at the very end, wherever a consumer needs world units.
 * Raw landmark heights:
 *   y ≈ -1.05  bottom of the shoulders
 *   y ≈ -0.85  base of the neck / collar — where the Intelligence Core sits
 *   y ≈  0.15  widest point of the head (temples)
 *   y ≈  1.35  crown
 */

interface ProfilePoint {
  y: number;
  r: number;
}

// Key (height, radius) control points for the silhouette, in raw space.
// Interpolated with smooth cosine easing between consecutive points.
const PROFILE: ProfilePoint[] = [
  { y: -1.05, r: 0.98 }, // shoulders (wide, flat shelf)
  { y: -0.97, r: 0.96 }, // shoulders hold their width briefly before dropping
  { y: -0.8, r: 0.42 }, // steep drop from shoulder to neck
  { y: -0.72, r: 0.28 }, // base of neck (narrowest)
  { y: -0.5, r: 0.28 }, // neck holds its width — the clearly-read "cylinder"
  { y: -0.36, r: 0.4 }, // jaw flare
  { y: -0.15, r: 0.5 }, // cheeks
  { y: 0.15, r: 0.56 }, // temples (widest point of the head)
  { y: 0.5, r: 0.53 },
  { y: 0.85, r: 0.44 },
  { y: 1.15, r: 0.3 },
  { y: 1.35, r: 0.08 }, // crown, near-closed
];

const RAW_BOTTOM = PROFILE[0].y;
const RAW_TOP = PROFILE[PROFILE.length - 1].y;

function smooth(t: number) {
  return t * t * (3 - 2 * t);
}

/** Radius of the silhouette at a given RAW (unscaled) height. */
export function bustRadiusAt(y: number): number {
  if (y <= PROFILE[0].y) return PROFILE[0].r;
  if (y >= PROFILE[PROFILE.length - 1].y) return PROFILE[PROFILE.length - 1].r;

  for (let i = 0; i < PROFILE.length - 1; i++) {
    const a = PROFILE[i];
    const b = PROFILE[i + 1];
    if (y >= a.y && y <= b.y) {
      const t = smooth((y - a.y) / (b.y - a.y));
      return a.r + (b.r - a.r) * t;
    }
  }
  return PROFILE[PROFILE.length - 1].r;
}

/** Shared world-space scale — every consumer (NeuralFace, EnergyCore,
 * NeuralLines) must use this same constant to stay visually aligned. */
export const BUST_SCALE = 1.35;

export const BUST_BOUNDS = {
  bottom: RAW_BOTTOM * BUST_SCALE,
  top: RAW_TOP * BUST_SCALE,
  collarY: -0.87 * BUST_SCALE,
  widestY: 0.15 * BUST_SCALE,
};

/** Where the Intelligence Core rests, in world units — shared by
 * EnergyCore.tsx and NeuralLines.tsx so the glow and the spine of neural
 * filaments always anchor to the exact same point. */
export const CORE_ANCHOR: [number, number, number] = [0, BUST_BOUNDS.collarY + 0.06, 0.05];

export interface BustLineGeometryData {
  positions: Float32Array; // pairs of points per line segment (LineSegments)
  seeds: Float32Array;
  heightT: Float32Array; // 0 at shoulders, 1 at crown — one per vertex
  vertexCount: number;
}

/**
 * Builds a LineSegments-ready buffer: `ringCount` horizontal rings, each a
 * closed loop of `pointsPerRing` points. A tiny per-ring random radius
 * jitter keeps it from reading as a perfectly lathed CAD model — closer to
 * the slightly organic, hand-assembled look in the reference.
 */
export function generateBustRings(ringCount: number, pointsPerRing: number, scale = BUST_SCALE): BustLineGeometryData {
  const totalSegments = ringCount * pointsPerRing;
  const positions = new Float32Array(totalSegments * 2 * 3);
  const seeds = new Float32Array(totalSegments * 2);
  const heightT = new Float32Array(totalSegments * 2);

  let cursor = 0;
  let vCursor = 0;

  for (let ring = 0; ring < ringCount; ring++) {
    const t = ring / (ringCount - 1);
    const yRaw = RAW_BOTTOM + (RAW_TOP - RAW_BOTTOM) * t;
    const jitter = 1 + Math.sin(ring * 12.9898) * 0.015;
    const radius = bustRadiusAt(yRaw) * scale * jitter;
    const y = yRaw * scale;
    const seed = Math.random();

    for (let p = 0; p < pointsPerRing; p++) {
      const a0 = (p / pointsPerRing) * Math.PI * 2;
      const a1 = ((p + 1) / pointsPerRing) * Math.PI * 2;

      const x0 = Math.cos(a0) * radius;
      const z0 = Math.sin(a0) * radius;
      const x1 = Math.cos(a1) * radius;
      const z1 = Math.sin(a1) * radius;

      positions[cursor++] = x0;
      positions[cursor++] = y;
      positions[cursor++] = z0;
      positions[cursor++] = x1;
      positions[cursor++] = y;
      positions[cursor++] = z1;

      seeds[vCursor] = seed;
      seeds[vCursor + 1] = seed;
      heightT[vCursor] = t;
      heightT[vCursor + 1] = t;
      vCursor += 2;
    }
  }

  return { positions, seeds, heightT, vertexCount: vCursor };
}

/** World-space (scaled) point on the silhouette surface at a given RAW
 * height and angle — used by NeuralLines to place anchors that line up
 * with the rendered rings. */
export function bustSurfacePoint(yRaw: number, angle: number, radiusScale = 1): [number, number, number] {
  const radius = bustRadiusAt(yRaw) * BUST_SCALE * radiusScale;
  return [Math.cos(angle) * radius, yRaw * BUST_SCALE, Math.sin(angle) * radius];
}
