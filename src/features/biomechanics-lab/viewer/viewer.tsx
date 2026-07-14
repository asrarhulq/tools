"use client";

import { useCallback, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Environment,
  Grid,
  Lightformer,
  OrbitControls,
} from "@react-three/drei";
import * as THREE from "three";
import { toast } from "sonner";
import { Maximize2, Camera as CameraIcon } from "lucide-react";
import { useBiomech } from "../state/store";
import { useAnalysis } from "../state/use-analysis";
import { generatePose } from "../lib/kinematics";
import { analyzeFrame } from "../lib/analysis";
import { bodyWeightN } from "../lib/anthropometry";
import { CoMOverlay, ForceOverlay, HumanModel } from "./human-model";
import { ACTIVITY_MAP } from "../lib/anthropometry";

/**
 * The 3D biomechanics viewport: a premium studio-lit scene with a ground plane,
 * the articulated human, live overlays (CoM, force vectors), and a playback
 * loop that advances the movement phase in real time. Camera orbit/pan/zoom via
 * OrbitControls; a screenshot bridge feeds the PDF report.
 */
export type CamView = "front" | "side" | "back" | "top" | "iso";

export function Viewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { mode, screenshotRef } = useBiomech();
  const camTargetRef = useRef<CamView | "reset" | null>("iso");
  const setCamera = useCallback((v: CamView | "reset") => {
    camTargetRef.current = v;
  }, []);

  const registerScreenshot = useCallback(
    (fn: (() => string | null) | null) => {
      screenshotRef.current = fn;
    },
    [screenshotRef],
  );

  const takeScreenshot = useCallback(() => {
    const url = screenshotRef.current?.();
    if (!url) return toast.error("Screenshot failed");
    const a = document.createElement("a");
    a.href = url;
    a.download = "biomechanics-view.png";
    a.click();
    toast.success("Screenshot saved");
  }, [screenshotRef]);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative h-[420px] w-full overflow-hidden rounded-[var(--radius)] border border-[var(--color-border)] bg-black shadow-lg sm:h-[560px]"
    >
      <Canvas
        shadows="variance"
        dpr={[1, 2]}
        gl={{
          preserveDrawingBuffer: true,
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
        }}
        camera={{ position: [2.6, 1.4, 3.2], fov: 42, near: 0.1, far: 100 }}
        onCreated={({ camera }) => camera.lookAt(0, 0.9, 0)}
      >
        <color attach="background" args={["#0b0c12"]} />
        <ambientLight intensity={0.4} />
        <hemisphereLight args={["#dfe6ff", "#20242e", 0.5]} />
        <directionalLight
          position={[3, 6, 4]}
          intensity={2}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-radius={6}
          shadow-bias={-0.0002}
        />
        <directionalLight position={[-4, 3, -2]} intensity={0.5} />

        <Scene registerScreenshot={registerScreenshot} />
        <CameraRig targetRef={camTargetRef} />

        <Environment resolution={256}>
          <Lightformer
            intensity={1.8}
            position={[0, 4, -4]}
            scale={[10, 10, 1]}
            color="#ffffff"
          />
          <Lightformer
            intensity={1}
            position={[-4, 2, 2]}
            scale={[6, 6, 1]}
            color="#b3c0ff"
          />
        </Environment>

        <Grid
          args={[20, 20]}
          cellSize={0.25}
          cellThickness={0.5}
          cellColor="#2a2a3a"
          sectionSize={1}
          sectionColor="#4b4b6a"
          fadeDistance={16}
          position={[0, 0, 0]}
          infiniteGrid
        />

        <OrbitControls
          makeDefault
          enablePan
          enableDamping
          dampingFactor={0.08}
          target={[0, 0.9, 0]}
          minDistance={1.2}
          maxDistance={9}
        />
      </Canvas>

      {/* Mode badge */}
      <div className="glass pointer-events-none absolute top-3 left-3 z-10 rounded-lg px-2.5 py-1 text-[11px] font-medium text-[var(--color-foreground)] capitalize">
        {mode} mode
      </div>

      {/* Camera presets */}
      <div className="glass pointer-events-auto absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-0.5 rounded-full p-1 text-[11px]">
        {(["front", "side", "back", "top", "iso"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setCamera(v)}
            className="rounded-full px-2 py-0.5 font-medium text-[var(--color-muted-foreground)] capitalize transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
          >
            {v}
          </button>
        ))}
        <div className="mx-0.5 h-3.5 w-px bg-[var(--color-border)]" />
        <button
          type="button"
          onClick={() => setCamera("reset")}
          className="rounded-full px-2 py-0.5 font-medium text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
        >
          Reset
        </button>
      </div>

      {/* Actions */}
      <div className="glass absolute top-3 right-3 z-10 flex gap-1 rounded-xl p-1">
        <button
          type="button"
          onClick={takeScreenshot}
          aria-label="Screenshot"
          title="Screenshot"
          className="flex size-8 items-center justify-center rounded-lg text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] [&_svg]:size-4"
        >
          <CameraIcon />
        </button>
        <button
          type="button"
          onClick={toggleFullscreen}
          aria-label="Fullscreen"
          title="Fullscreen"
          className="flex size-8 items-center justify-center rounded-lg text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] [&_svg]:size-4"
        >
          <Maximize2 />
        </button>
      </div>

      <p className="glass pointer-events-none absolute right-3 bottom-3 z-10 rounded-lg px-2.5 py-1 text-[10px] text-[var(--color-muted-foreground)]">
        Developed by Asrar ul Haq
      </p>
    </div>
  );
}

function Scene({
  registerScreenshot,
}: {
  registerScreenshot: (fn: (() => string | null) | null) => void;
}) {
  const {
    activity,
    body,
    mode,
    phase,
    playing,
    playbackSpeed,
    comparison,
    advance,
  } = useBiomech();
  const { pose, frame, comTrajectory } = useAnalysis();
  const { gl, scene, camera } = useThree();

  // Screenshot bridge.
  useEffect(() => {
    const capture = () => {
      try {
        gl.render(scene, camera);
        return gl.domElement.toDataURL("image/png");
      } catch {
        return null;
      }
    };
    registerScreenshot(capture);
    return () => registerScreenshot(null);
  }, [gl, scene, camera, registerScreenshot]);

  // Playback loop. A `DISPLAY_SLOWDOWN` factor lifts the real biomechanical
  // cadence (a sprint cycle is <0.5 s — too fast to observe) to a comfortable
  // analysis pace at 1×.
  //
  // Crucially, the phase is only *committed* to React state at a throttled
  // UI_HZ, not every render frame. Pushing phase 60×/s made every data panel
  // and the analysis notes re-render at frame rate — the "numbers switching too
  // fast / text glitching" the user saw. At ~15 Hz the motion still reads
  // smoothly (the poses are C¹-continuous) but the read-outs update calmly.
  const DISPLAY_SLOWDOWN = 2.6;
  const UI_HZ = 15;
  const cycleSeconds =
    (ACTIVITY_MAP[activity].cycleSeconds * DISPLAY_SLOWDOWN) /
    Math.max(0.05, body.speed * playbackSpeed);
  const accum = useRef(0);
  const pending = useRef(0);
  useFrame((_, delta) => {
    if (!playing) return;
    const dt = Math.min(delta, 1 / 20); // clamp long frames (tab refocus, GC)
    pending.current += dt / cycleSeconds;
    accum.current += dt;
    if (accum.current >= 1 / UI_HZ) {
      advance(pending.current);
      pending.current = 0;
      accum.current = 0;
    }
  });

  // Comparison ghost: an "incorrect technique" variant (exaggerated trunk flex
  // + load) rendered translucent behind the primary figure.
  const ghost = comparison
    ? (() => {
        const badBody = {
          ...body,
          loadKg: body.loadKg + 20,
          build: body.build,
        };
        const gp = generatePose(activity, phase, badBody);
        const gf = analyzeFrame(gp, badBody, activity);
        return { pose: gp, frame: gf };
      })()
    : null;

  const bw = bodyWeightN(body);

  return (
    <group position={[0, 0, 0]}>
      <HumanModel pose={pose} frame={frame} mode={mode} girth={body.build} />
      {ghost ? (
        <group position={[0, 0, -0.9]}>
          <HumanModel
            pose={ghost.pose}
            frame={ghost.frame}
            mode={mode}
            girth={body.build}
            opacity={0.4}
            tint="#f43f5e"
          />
        </group>
      ) : null}

      {mode === "force" && (
        <ForceOverlay pose={pose} frame={frame} bodyWeightN={bw} />
      )}
      {(mode === "force" || mode === "joint") && (
        <CoMOverlay com={frame.centerOfMass} trajectory={comTrajectory} />
      )}

      {/* Soft contact shadow catcher */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.001, 0]}
        receiveShadow
      >
        <planeGeometry args={[6, 6]} />
        <shadowMaterial opacity={0.25} />
      </mesh>
    </group>
  );
}

/** Smoothly tweens the camera to preset views when the toolbar requests one. */
function CameraRig({
  targetRef,
}: {
  targetRef: React.RefObject<CamView | "reset" | null>;
}) {
  const { camera, controls } = useThree();
  const goal = useRef(new THREE.Vector3(2.6, 1.4, 3.2));
  const focus = new THREE.Vector3(0, 0.9, 0);

  const PRESETS: Record<CamView | "reset", [number, number, number]> = {
    front: [0, 1.0, 4.2],
    side: [4.2, 1.0, 0],
    back: [0, 1.0, -4.2],
    top: [0.01, 5, 0.01],
    iso: [2.6, 1.4, 3.2],
    reset: [2.6, 1.4, 3.2],
  };

  useFrame(() => {
    const req = targetRef.current;
    if (req) {
      goal.current.set(...PRESETS[req]);
      targetRef.current = null;
    }
    // Ease the camera toward the goal each frame (smooth, framerate-tolerant).
    if (camera.position.distanceTo(goal.current) > 0.005) {
      camera.position.lerp(goal.current, 0.12);
      camera.lookAt(focus);
      const ctrl = controls as unknown as {
        target?: THREE.Vector3;
        update?: () => void;
      } | null;
      if (ctrl?.target) {
        ctrl.target.lerp(focus, 0.12);
        ctrl.update?.();
      }
    }
  });
  return null;
}
