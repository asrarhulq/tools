"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { OrreryScene } from "../scene/scene";

/**
 * The 3D viewport. No shadows and no studio lighting rig (unlike the other
 * R3F tools in this codebase) — this is space: the Sun is the only light
 * source, and there's no ground plane to catch a contact shadow. A small
 * ambient light keeps night sides from reading as pure black cutouts.
 */
export function Viewer() {
  return (
    <div className="relative h-[480px] w-full overflow-hidden rounded-[var(--radius)] border border-[var(--color-border)] bg-black shadow-lg sm:h-[640px]">
      <Canvas
        dpr={[1, 2]}
        gl={{
          preserveDrawingBuffer: true,
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
        }}
        camera={{ position: [0, 22, 34], fov: 50, near: 0.05, far: 2000 }}
      >
        <color attach="background" args={["#03040a"]} />
        <ambientLight intensity={0.12} />
        <OrreryScene />
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          minDistance={1}
          maxDistance={500}
        />
      </Canvas>
    </div>
  );
}
