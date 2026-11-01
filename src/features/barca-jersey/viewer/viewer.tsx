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
 * The 3D viewport: a proper three-point studio rig (warm key, cool fill, a
 * rim light to separate the jersey from the backdrop) over a soft radial
 * stage-light gradient instead of flat black, with a matching vignette for
 * a bit of cinematic framing. The environment is built from `Lightformer`s
 * rather than an HDR preset — our CSP has no external `connect-src` for a
 * CDN fetch, so every reflection here is generated locally (same trick as
 * the STL analyzer and biomechanics lab viewers).
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
    <div
      className="relative h-[480px] w-full overflow-hidden rounded-[var(--radius)] border border-[var(--color-border)] shadow-lg sm:h-[640px]"
      style={{
        background:
          "radial-gradient(ellipse 75% 65% at 50% 38%, #233257 0%, #141c33 45%, #0a0e1a 100%)",
      }}
    >
      <Canvas
        shadows="variance"
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
        }}
        camera={{ position: [0, 0.15, 6.8], fov: 32, near: 0.1, far: 80 }}
      >
        <ambientLight intensity={0.22} />
        <hemisphereLight args={["#cfe0ff", "#120f22", 0.32] as const} />

        {/* Key — warm, upper-right, casts the shadow. */}
        <directionalLight
          position={[3.6, 5.2, 3.4]}
          intensity={2.6}
          color="#fff3e2"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-radius={7}
          shadow-bias={-0.0003}
          shadow-camera-near={0.1}
          shadow-camera-far={16}
          shadow-camera-left={-2.4}
          shadow-camera-right={2.4}
          shadow-camera-top={2.4}
          shadow-camera-bottom={-2.4}
        />
        {/* Fill — cool, opposite side, keeps the shadow side readable. */}
        <directionalLight
          position={[-4, 2.6, 2.2]}
          intensity={0.8}
          color="#cfe0ff"
        />
        {/* Rim — behind and above, separates the jersey from the backdrop. */}
        <directionalLight
          position={[-1.2, 4.2, -4.5]}
          intensity={1.7}
          color="#bcd0ff"
        />

        <Suspense fallback={null}>
          <JerseyModel name={name} number={number} animate={!autoRotate} />

          <ContactShadows
            position={[0, -1.36, 0]}
            opacity={0.5}
            scale={6}
            blur={2.8}
            far={3}
            resolution={1024}
            color="#000000"
          />

          <Environment resolution={256}>
            <Lightformer
              intensity={2.2}
              position={[0, -3, 3]}
              scale={[6, 6, 1]}
              color="#ffffff"
            />
            <Lightformer
              intensity={1.3}
              position={[-3, 1.5, 1.5]}
              scale={[4, 4, 1]}
              color="#b9c7ff"
            />
            <Lightformer
              intensity={1.1}
              position={[3, 2, 1.5]}
              scale={[4, 4, 1]}
              color="#ffdfa8"
            />
            <Lightformer
              intensity={1.4}
              position={[0, 4, -2]}
              scale={[5, 3, 1]}
              color="#eaf0ff"
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

      {/* A soft vignette for cinematic framing — pure CSS, no render cost. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 75% at 50% 42%, transparent 55%, rgba(0,0,0,0.38) 100%)",
        }}
      />
    </div>
  );
}
