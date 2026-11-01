"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Lightformer,
  OrbitControls,
} from "@react-three/drei";
import * as THREE from "three";
import { JerseyModel } from "./jersey-model";

/**
 * The 3D viewport: studio-lit, soft-shadowed, auto-rotating by default. The
 * environment is built from `Lightformer`s rather than an HDR preset — our
 * CSP has no external `connect-src` for a CDN fetch, so every reflection
 * here is generated locally (same trick as the STL analyzer and
 * biomechanics lab viewers).
 */
export function Viewer({
  name,
  number,
  autoRotate,
}: {
  name: string;
  number: string;
  autoRotate: boolean;
}) {
  return (
    <div className="relative h-[480px] w-full overflow-hidden rounded-[var(--radius)] border border-[var(--color-border)] bg-black shadow-lg sm:h-[640px]">
      <Canvas
        shadows="variance"
        dpr={[1, 2]}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.08,
        }}
        camera={{ position: [0, 0.15, 6.8], fov: 32, near: 0.1, far: 80 }}
      >
        <color attach="background" args={["#0c0d12"]} />
        <ambientLight intensity={0.45} />
        <hemisphereLight args={["#dfe6ff", "#1a1830", 0.55]} />
        <directionalLight
          position={[3.8, 4.8, 3.2]}
          intensity={2.3}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-radius={5}
          shadow-bias={-0.0003}
          shadow-camera-near={0.1}
          shadow-camera-far={16}
          shadow-camera-left={-2.4}
          shadow-camera-right={2.4}
          shadow-camera-top={2.4}
          shadow-camera-bottom={-2.4}
        />
        <directionalLight position={[-3.8, 2.2, -2.6]} intensity={0.5} />

        <Suspense fallback={null}>
          <JerseyModel name={name} number={number} animate={!autoRotate} />

          <ContactShadows
            position={[0, -1.36, 0]}
            opacity={0.55}
            scale={6}
            blur={2.2}
            far={3}
            resolution={1024}
            color="#000000"
          />

          <Environment resolution={256}>
            <Lightformer
              intensity={2}
              position={[0, -3, 3]}
              scale={[6, 6, 1]}
              color="#ffffff"
            />
            <Lightformer
              intensity={1.1}
              position={[-3, 1.5, 1.5]}
              scale={[4, 4, 1]}
              color="#b9c7ff"
            />
            <Lightformer
              intensity={1}
              position={[3, 2, 1.5]}
              scale={[4, 4, 1]}
              color="#ffdfa8"
            />
          </Environment>
        </Suspense>

        <OrbitControls
          makeDefault
          enablePan={false}
          enableZoom
          enableRotate
          enableDamping
          dampingFactor={0.08}
          autoRotate={autoRotate}
          autoRotateSpeed={1.1}
          minDistance={4.8}
          maxDistance={11}
          minPolarAngle={Math.PI * 0.22}
          maxPolarAngle={Math.PI * 0.68}
          target={[0, -0.05, 0]}
        />
      </Canvas>
    </div>
  );
}
