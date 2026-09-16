/**
 * DEPRECATED — no longer used.
 *
 * The FACE was redesigned from a particle point-cloud with facial features
 * (eyes/brow/nose/mouth) into a featureless wireframe bust made of
 * horizontal contour rings, matching the reference look explicitly
 * requested ("face human with no features, spot light that moves").
 *
 * The new geometry lives in `generateBust.ts` and is consumed by
 * `NeuralFace.tsx`. This file is kept only so nothing breaks if something
 * external still points at the old path; it is safe to delete.
 */
export {};
