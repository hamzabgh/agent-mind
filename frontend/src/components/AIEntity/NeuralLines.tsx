import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { bustSurfacePoint, CORE_ANCHOR } from '@/lib/generateBust';
import { PALETTE } from '@/lib/palette';
import { store } from '@/state/store';
import { damp, getStateTargets } from '@/lib/stateMotion';

/**
 * Neural filaments connecting the Core to key points on the Face (and a
 * sparse mesh between those points), so the entity reads as one connected
 * nervous system rather than a head floating next to a separate ball.
 * Energy visibly travels along them (animated dash offset) and they
 * brighten/vibrate with neural activity.
 */
const DASH_SIZE = 0.12;
const GAP_SIZE = 0.08;
const DASH_PERIOD = DASH_SIZE + GAP_SIZE;

export function NeuralLines() {
  const lineRef = useRef<THREE.LineSegments>(null);
  const materialRef = useRef<THREE.LineDashedMaterial>(null);
  const activityRef = useRef(0.2);
  const flowOffsetRef = useRef(0);
  const baseDistanceRef = useRef<Float32Array>(new Float32Array(0));

  const geometry = useMemo(() => {
    // No facial features to anchor to anymore — instead, a vertical "spine"
    // of points climbing from the core up through the neck and head,
    // fanned out at a few angles, sampled directly off the same silhouette
    // math NeuralFace renders (bustSurfacePoint) so everything lines up.
    const heights = [-0.72, -0.5, -0.36, -0.15, 0.15, 0.4, 0.65, 0.9, 1.15];
    const angleSets = [
      [0],
      [0, Math.PI],
      [0, Math.PI],
      [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3],
      [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3],
      [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3],
      [0, Math.PI],
      [0, Math.PI],
      [0],
    ];

    const anchors: THREE.Vector3[] = [];
    heights.forEach((yRaw, i) => {
      angleSets[i].forEach((angle) => {
        anchors.push(new THREE.Vector3(...bustSurfacePoint(yRaw, angle, 0.55)));
      });
    });

    const points: number[] = [];
    const hub = new THREE.Vector3(...CORE_ANCHOR);

    // core -> nearest few anchors (not every anchor, so it reads as a
    // branching nervous system rather than a starburst)
    anchors
      .map((a, j) => ({ j, d: hub.distanceTo(a) }))
      .sort((x, y) => x.d - y.d)
      .slice(0, 4)
      .forEach(({ j }) => {
        const a = anchors[j];
        points.push(hub.x, hub.y, hub.z, a.x, a.y, a.z);
      });

    // sparse anchor -> nearest-neighbor mesh, climbing the spine
    anchors.forEach((a, i) => {
      const distances = anchors
        .map((b, j) => ({ j, d: i === j ? Infinity : a.distanceTo(b) }))
        .sort((x, y) => x.d - y.d)
        .slice(0, 2);
      distances.forEach(({ j }) => {
        const b = anchors[j];
        points.push(a.x, a.y, a.z, b.x, b.y, b.z);
      });
    });

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));

    // LineDashedMaterial needs a per-vertex `lineDistance` attribute (three's
    // BufferGeometry has no built-in computeLineDistances helper — that only
    // exists on the fat-line examples geometry). Each pair is an independent
    // segment (LineSegments), so distance resets to 0 at the start of every pair.
    const segmentCount = points.length / 6;
    const baseDistance = new Float32Array(segmentCount * 2);
    for (let i = 0; i < segmentCount; i++) {
      const ax = points[i * 6],
        ay = points[i * 6 + 1],
        az = points[i * 6 + 2];
      const bx = points[i * 6 + 3],
        by = points[i * 6 + 4],
        bz = points[i * 6 + 5];
      const len = Math.hypot(bx - ax, by - ay, bz - az);
      baseDistance[i * 2] = 0;
      baseDistance[i * 2 + 1] = len;
    }
    baseDistanceRef.current = baseDistance;
    geo.setAttribute('lineDistance', new THREE.Float32BufferAttribute(baseDistance.slice(), 1));
    return geo;
  }, []);

  useFrame((frameState, delta) => {
    const dt = Math.min(0.1, delta);
    const s = store.getState();
    const targets = getStateTargets(s.aiState);
    activityRef.current = damp(activityRef.current, targets.neuralActivity, 3, dt);

    const mat = materialRef.current;
    if (mat) {
      mat.opacity = 0.12 + activityRef.current * 0.45 + s.audio.amplitude * 0.25;
      mat.color.lerpColors(PALETTE.cyanDim, PALETTE.cyan, Math.min(1, activityRef.current + s.audio.amplitude));
    }

    // animate the "energy traveling along the filament" effect by shifting
    // the lineDistance attribute itself, wrapped so the numbers stay small.
    flowOffsetRef.current = (flowOffsetRef.current + dt * (0.6 + activityRef.current * 2.2)) % DASH_PERIOD;
    const distanceAttr = geometry.getAttribute('lineDistance') as THREE.BufferAttribute | undefined;
    if (distanceAttr) {
      const base = baseDistanceRef.current;
      const arr = distanceAttr.array as Float32Array;
      for (let i = 0; i < base.length; i++) arr[i] = base[i] + flowOffsetRef.current;
      distanceAttr.needsUpdate = true;
    }

    if (lineRef.current) {
      // faint vibration
      const jitter = activityRef.current * 0.004;
      lineRef.current.position.x = Math.sin(frameState.clock.elapsedTime * 30) * jitter;
    }
  });

  return (
    <lineSegments ref={lineRef} geometry={geometry}>
      <lineDashedMaterial
        ref={materialRef}
        color={PALETTE.cyan}
        transparent
        opacity={0.2}
        dashSize={DASH_SIZE}
        gapSize={GAP_SIZE}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  );
}
