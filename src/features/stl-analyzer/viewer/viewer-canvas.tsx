"use client";

import { Suspense, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import {
  Environment,
  GizmoHelper,
  GizmoViewport,
  Grid,
  Lightformer,
  OrbitControls,
} from "@react-three/drei";
import type {
  FeaResult,
  GeometryResult,
  RawMesh,
  StabilityResult,
  Force,
  Support,
  Vec3,
} from "../types";
import type { ViewerOptions } from "../state/viewer-options";
import { ModelScene } from "./model-scene";
import { length } from "../lib/vec";

/**
 * The CAD viewport. Wires perspective/orthographic cameras, orbit/pan/zoom,
 * an engineering grid + axes gizmo, studio lighting, and a screenshot bridge.
 * The heavy per-frame work lives in ModelScene; this component owns the scene
 * chrome and camera.
 */
export function ViewerCanvas({
  mesh,
  geometry,
  fea,
  stability,
  forces,
  supports,
  options,
  onSurfaceClick,
  registerScreenshot,
}: {
  mesh: RawMesh;
  geometry: GeometryResult;
  fea: FeaResult | null;
  stability: StabilityResult | null;
  forces: readonly Force[];
  supports: readonly Support[];
  options: ViewerOptions;
  onSurfaceClick?: (point: Vec3) => void;
  registerScreenshot: (fn: (() => string | null) | null) => void;
}) {
  const diag = length(geometry.boundingBox.size) || 100;
  const camDist = diag * 1.6;

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      // preserveDrawingBuffer lets us read pixels for screenshots/PDF.
      gl={{ preserveDrawingBuffer: true, antialias: true, localClippingEnabled: true }}
      orthographic={options.camera === "orthographic"}
      camera={{
        position: [camDist, camDist * 0.8, camDist],
        fov: 45,
        near: 0.1,
        far: diag * 50,
        zoom: options.camera === "orthographic" ? 3 : 1,
      }}
    >
      <color attach="background" args={["#0b0b12"]} />
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[diag, diag * 1.5, diag]}
        intensity={1.15}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <directionalLight position={[-diag, diag, -diag]} intensity={0.4} />

      <Suspense fallback={null}>
        <ModelScene
          mesh={mesh}
          geometry={geometry}
          fea={fea}
          stability={stability}
          forces={forces}
          supports={supports}
          options={options}
          onSurfaceClick={onSurfaceClick}
        />
        {/*
          Self-contained studio environment built from Lightformers — gives the
          metallic material realistic reflections with NO external HDR fetch
          (drei's `preset` maps load from a CDN, which our CSP blocks offline).
        */}
        <Environment resolution={256}>
          <Lightformer
            intensity={2}
            position={[0, 5, -5]}
            scale={[10, 10, 1]}
            color="#ffffff"
          />
          <Lightformer
            intensity={1.2}
            position={[-5, 2, 2]}
            scale={[6, 6, 1]}
            color="#b3c0ff"
          />
          <Lightformer
            intensity={1}
            position={[5, 0, 3]}
            scale={[6, 6, 1]}
            color="#ffe6c2"
          />
        </Environment>
      </Suspense>

      {options.showGrid ? (
        <Grid
          args={[diag * 4, diag * 4]}
          cellSize={diag / 10}
          cellThickness={0.5}
          cellColor="#2a2a3a"
          sectionSize={diag / 2}
          sectionThickness={1}
          sectionColor="#4b4b6a"
          fadeDistance={diag * 6}
          fadeStrength={1}
          position={[0, -diag / 2, 0]}
          infiniteGrid
        />
      ) : null}

      {options.showAxes ? (
        <GizmoHelper alignment="bottom-right" margin={[70, 70]}>
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
        minDistance={diag * 0.2}
        maxDistance={diag * 8}
      />

      <ScreenshotBridge register={registerScreenshot} />
    </Canvas>
  );
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
