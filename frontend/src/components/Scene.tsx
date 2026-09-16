import { Suspense, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { AIEntity } from '@/components/AIEntity/AIEntity';
import { ThoughtNodes } from '@/components/Mind/ThoughtNodes';
import { KnowledgeGraph } from '@/components/Mind/KnowledgeGraph';
import { NeuralEnvironment } from '@/components/World/NeuralEnvironment';
import { PALETTE } from '@/lib/palette';
import { store } from '@/state/store';
import { damp } from '@/lib/stateMotion';
import type { QualityBudget } from '@/lib/perf';

// Framing tuned for the bust silhouette (shoulders ≈ y -1.4, crown ≈ y 1.8):
// FACE holds head-and-shoulders in frame with a little headroom, matching
// the reference composition; WORLD pulls back enough to see the whole
// knowledge graph without losing the entity as an anchor point.
const FACE_CAMERA = new THREE.Vector3(0, 0.35, 5.7);
const WORLD_CAMERA = new THREE.Vector3(0, 2.6, 10.5);
const FACE_TARGET = new THREE.Vector3(0, 0.25, 0);
const WORLD_TARGET = new THREE.Vector3(0, 0.1, 0);

/** Eases the camera between the entity-centric FACE view and the pulled-back WORLD view. */
function CameraRig({ controlsRef }: { controlsRef: React.RefObject<any> }) {
  const { camera } = useThree();

  useFrame((_, delta) => {
    const dt = Math.min(0.1, delta);
    const s = store.getState();
    const targetPos = s.view === 'WORLD' ? WORLD_CAMERA : FACE_CAMERA;
    const targetLook = s.view === 'WORLD' ? WORLD_TARGET : FACE_TARGET;

    camera.position.x = damp(camera.position.x, targetPos.x, 2, dt);
    camera.position.y = damp(camera.position.y, targetPos.y, 2, dt);
    camera.position.z = damp(camera.position.z, targetPos.z, 2, dt);

    if (controlsRef.current) {
      controlsRef.current.target.x = damp(controlsRef.current.target.x, targetLook.x, 2, dt);
      controlsRef.current.target.y = damp(controlsRef.current.target.y, targetLook.y, 2, dt);
      controlsRef.current.target.z = damp(controlsRef.current.target.z, targetLook.z, 2, dt);

      const idle = s.aiState === 'IDLE' && s.view === 'FACE';
      controlsRef.current.autoRotate = idle;
      controlsRef.current.autoRotateSpeed = 0.35;
      controlsRef.current.update();
    }
  });

  return null;
}

interface SceneProps {
  quality: QualityBudget;
}

export function Scene({ quality }: SceneProps) {
  return (
    <Canvas
      dpr={quality.dpr}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{ position: FACE_CAMERA.toArray(), fov: 45, near: 0.1, far: 60 }}
      onCreated={({ scene, gl }) => {
        scene.background = PALETTE.bg.clone();
        gl.setClearColor(PALETTE.bg, 1);
      }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.12} color={PALETTE.cyanDim} />
        <hemisphereLight args={[PALETTE.cyan.getHex(), 0x000000, 0.15]} />

        <AIEntity quality={quality} />
        <ThoughtNodes />
        <KnowledgeGraph />
        <NeuralEnvironment quality={quality} />

        <SceneControls />

        {quality.bloom && (
          <EffectComposer multisampling={0}>
            <Bloom intensity={0.5} luminanceThreshold={0.22} luminanceSmoothing={0.25} mipmapBlur radius={0.28} />
            <Vignette eskil={false} offset={0.32} darkness={0.62} />
          </EffectComposer>
        )}
      </Suspense>
    </Canvas>
  );
}

function SceneControls() {
  const controlsRef = useRef<any>(null);
  return (
    <>
      <OrbitControls
        ref={controlsRef as any}
        enablePan={false}
        minDistance={3}
        maxDistance={16}
        minPolarAngle={Math.PI * 0.18}
        maxPolarAngle={Math.PI * 0.62}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.5}
      />
      <CameraRig controlsRef={controlsRef} />
    </>
  );
}
