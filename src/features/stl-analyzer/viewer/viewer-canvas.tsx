"use client";

import { Suspense, useEffect, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  GizmoHelper,
  GizmoViewport,
  Grid,
  Lightformer,
  OrbitControls,
} from "@react-three/drei";
import * as THREE from "three";
import type {
  FeaResult,
  GeometryResult,
  RawMesh,
  StabilityResult,
  Force,
  Vec3,
} from "../types";
import type { ViewerOptions } from "../state/viewer-options";
import { ModelScene } from "./model-scene";
import { BuildPlate } from "./build-plate";
import { length } from "../lib/vec";

export type CameraView = "iso" | "front" | "top" | "right";

/**
 * The CAD viewport. The scene is **Z-up** to match the engineering convention
 * (build plate on the z = 0 plane), with physically-based studio lighting, soft
 * contact shadows, anti-aliasing, an engineering grid, a realistic build plate,
 * an orientation gizmo, and camera presets. Heavy per-frame work lives in
 * ModelScene; this owns the scene chrome, lighting, and camera.
 */
export function ViewerCanvas({
  mesh,
  geometry,
  fea,
  stability,
  forces,
  options,
  onSurfaceClick,
  registerScreenshot,
  registerCamera,
}: {
  mesh: RawMesh;
  geometry: GeometryResult;
  fea: FeaResult | null;
  stability: StabilityResult | null;
  forces: readonly Force[];
  options: ViewerOptions;
  onSurfaceClick?: (point: Vec3) => void;
  registerScreenshot: (fn: (() => string | null) | null) => void;
  registerCamera?: (fn: ((view: CameraView) => void) | null) => void;
}) {
  const size = geometry.boundingBox.size;
  const diag = length(size) || 100;
  // Fit the camera to the part: distance from bbox + a margin.
  const camDist = diag * 1.4;
  // The part rests on z = 0; aim at its vertical mid-height.
  const target: [number, number, number] = [0, 0, size[2] / 2];

  return (
    <Canvas
      // "variance" → VSMShadowMap (soft, non-deprecated). "soft" maps to
      // PCFSoftShadowMap which Three 0.185 deprecated with a console warning.
      shadows="variance"
      dpr={[1, 2]}
      gl={{
        preserveDrawingBuffer: true,
        antialias: true,
        localClippingEnabled: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
      }}
      orthographic={options.camera === "orthographic"}
      onCreated={({ camera }) => {
        camera.up.set(0, 0, 1); // Z-up world
        camera.lookAt(target[0], target[1], target[2]);
      }}
      camera={{
        position: [camDist, -camDist, camDist * 0.9],
        fov: 42,
        near: diag * 0.01,
        far: diag * 60,
        zoom: options.camera === "orthographic" ? 3 : 1,
      }}
    >
      <SceneBackground />

      {/* Physically-based studio lighting. */}
      <ambientLight intensity={0.35} />
      <hemisphereLight args={["#dfe6ff", "#2a2438", 0.5]} />
      <directionalLight
        position={[diag, -diag * 0.8, diag * 1.4]}
        intensity={2.1}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-radius={6}
        shadow-bias={-0.0002}
        shadow-camera-near={0.1}
        shadow-camera-far={diag * 6}
        shadow-camera-left={-diag}
        shadow-camera-right={diag}
        shadow-camera-top={diag}
        shadow-camera-bottom={-diag}
      />
      <directionalLight position={[-diag, diag, diag * 0.6]} intensity={0.5} />

      <Suspense fallback={null}>
        <ModelScene
          mesh={mesh}
          geometry={geometry}
          fea={fea}
          stability={stability}
          forces={forces}
          options={options}
          onSurfaceClick={onSurfaceClick}
        />

        {/* Soft contact shadow on the plate for a grounded, premium look.
            Single-pass (not temporal) so the render loop can go idle when the
            scene is static — better battery and interaction responsiveness. */}
        {options.shadows ? (
          <ContactShadows
            position={[0, 0, 0.02]}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={diag * 3}
            far={diag}
            blur={2.5}
            opacity={0.5}
            resolution={1024}
            color="#000000"
          />
        ) : null}

        {/*
          Self-contained studio environment from Lightformers — realistic
          reflections with NO external HDR fetch (our CSP blocks CDN presets).
        */}
        <Environment resolution={256}>
          <Lightformer
            intensity={2}
            position={[0, -5, 5]}
            scale={[10, 10, 1]}
            color="#ffffff"
          />
          <Lightformer
            intensity={1.2}
            position={[-5, 2, 3]}
            scale={[6, 6, 1]}
            color="#b3c0ff"
          />
          <Lightformer
            intensity={1}
            position={[5, 3, 2]}
            scale={[6, 6, 1]}
            color="#ffe6c2"
          />
        </Environment>
      </Suspense>

      {options.showBuildPlate ? (
        <BuildPlate
          size={size}
          diag={diag}
          contactArea={stability?.supportPolygon}
        />
      ) : null}

      {options.showGrid ? (
        <Grid
          args={[diag * 5, diag * 5]}
          cellSize={diag / 10}
          cellThickness={0.6}
          cellColor="#3a3550"
          sectionSize={diag / 2}
          sectionThickness={1.1}
          sectionColor="#5b5480"
          fadeDistance={diag * 7}
          fadeStrength={1.2}
          position={[0, 0, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          infiniteGrid
        />
      ) : null}

      {options.showAxes ? (
        <GizmoHelper alignment="bottom-right" margin={[72, 72]}>
          <GizmoViewport
            axisColors={["#ef4444", "#22c55e", "#3b82f6"]}
            labelColor="white"
          />
        </GizmoHelper>
      ) : null}

      <OrbitControls
        makeDefault
        enablePan
        enableZoom
        enableRotate
        enableDamping
        dampingFactor={0.08}
        target={target}
        minDistance={diag * 0.15}
        maxDistance={diag * 10}
      />

      <ScreenshotBridge register={registerScreenshot} />
      <CameraController register={registerCamera} diag={diag} target={target} />
    </Canvas>
  );
}

/** Theme-aware viewport background (subtle vertical gradient feel via fog). */
function SceneBackground() {
  return <color attach="background" args={["#0c0c14"]} />;
}

/**
 * Registers a screenshot function that renders the current frame and returns a
 * PNG data URL. Lives inside the Canvas so it can access the WebGL context.
 */
function ScreenshotBridge({
  register,
}: {
  register: (fn: (() => string | null) | null) => void;
}) {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    const capture = () => {
      try {
        gl.render(scene, camera);
        return gl.domElement.toDataURL("image/png");
      } catch {
        return null;
      }
    };
    register(capture);
    return () => register(null);
  }, [gl, scene, camera, register]);
  return null;
}

/** Exposes camera-preset jumps (iso / front / top / right) to the toolbar. */
function CameraController({
  register,
  diag,
  target,
}: {
  register?: (fn: ((view: CameraView) => void) | null) => void;
  diag: number;
  target: [number, number, number];
}) {
  const { camera, controls } = useThree();
  const targetVec = useRef(new THREE.Vector3(...target));

  useEffect(() => {
    targetVec.current.set(target[0], target[1], target[2]);
  }, [target]);

  useEffect(() => {
    if (!register) return;
    const d = diag * 1.4;
    const positions: Record<CameraView, [number, number, number]> = {
      iso: [d, -d, d * 0.9],
      front: [0, -d * 1.6, target[2]],
      top: [0, 0, d * 1.8],
      right: [d * 1.6, 0, target[2]],
    };
    const go = (view: CameraView) => {
      const p = positions[view];
      camera.position.set(p[0], p[1], p[2]);
      camera.up.set(0, 0, 1);
      camera.lookAt(targetVec.current);
      const ctrl = controls as unknown as {
        target?: THREE.Vector3;
        update?: () => void;
      } | null;
      if (ctrl?.target) {
        ctrl.target.copy(targetVec.current);
        ctrl.update?.();
      }
    };
    register(go);
    return () => register(null);
  }, [register, camera, controls, diag, target]);

  return null;
}
