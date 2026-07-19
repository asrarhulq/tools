"use client";

import {
  Component,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import { generatePose } from "@/features/biomechanics-lab/lib/kinematics";
import { DEFAULT_BODY } from "@/features/biomechanics-lab/lib/anthropometry";
import type { Vec3 } from "@/features/biomechanics-lab/types";

/**
 * A lightweight, self-contained **running stick-figure** used as the Featured
 * preview for the Human Biomechanics Lab. It reuses the lab's real running
 * kinematics (`generatePose("run", …)`) but renders only the bone chain — no
 * analysis engine, no surface mesh — so it stays cheap enough for the homepage.
 *
 * ── Why the WebGL bookkeeping below matters ──────────────────────────────────
 * Browsers cap the number of simultaneous live WebGL contexts (~8–16). Opening
 * the full Biomechanics Lab spins up its own heavier context; if this decorative
 * canvas is ALSO alive at that moment, returning to the homepage can leave the
 * browser over the limit and the tile's canvas silently fails to acquire a
 * context — rendering as a blank white box with a broken-image glyph (no JS
 * error, so an error boundary alone can't catch it).
 *
 * The fix is threefold:
 *   1. Mount the <Canvas> ONLY while the tile is actually on screen (an
 *      IntersectionObserver gate). Navigating to the lab unmounts it, so the two
 *      contexts are essentially never alive together.
 *   2. On unmount, explicitly `forceContextLoss()` so the browser frees the GL
 *      context immediately instead of lazily.
 *   3. If WebGL is unavailable/fails entirely, fall back to a static SVG figure
 *      so the tile is never blank.
 */

const BONES: Array<[string, string]> = [
  ["pelvis", "trunkTop"],
  ["trunkTop", "headTop"],
  ["pelvis", "hipL"],
  ["hipL", "kneeL"],
  ["kneeL", "ankleL"],
  ["ankleL", "toeL"],
  ["pelvis", "hipR"],
  ["hipR", "kneeR"],
  ["kneeR", "ankleR"],
  ["ankleR", "toeR"],
  ["trunkTop", "shoulderL"],
  ["shoulderL", "elbowL"],
  ["elbowL", "handL"],
  ["trunkTop", "shoulderR"],
  ["shoulderR", "elbowR"],
  ["elbowR", "handR"],
];

const V = (p: Vec3) => new THREE.Vector3(p[0], p[1], p[2]);

/** Force the GL context to be released the moment this canvas unmounts. */
function ContextReleaser() {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    return () => {
      try {
        gl.forceContextLoss();
        gl.dispose();
      } catch {
        /* best-effort */
      }
    };
  }, [gl]);
  return null;
}

function Runner({ color }: { color: string }) {
  const group = useRef<THREE.Group>(null);
  const phase = useRef(0);
  // One THREE.Line2 per bone; we rewrite its two endpoints each frame.
  const lineRefs = useRef<Array<React.ComponentRef<typeof Line> | null>>([]);
  const head = useRef<THREE.Mesh>(null);

  // A stable starting pose so the lines mount with valid geometry.
  const initial = useMemo(() => generatePose("run", 0, DEFAULT_BODY), []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 20); // clamp long frames (tab refocus)
    phase.current = (phase.current + dt * 1.4) % 1; // ~1.4 gait cycles/sec
    if (group.current) group.current.rotation.y += dt * 0.15;

    const pose = generatePose("run", phase.current, DEFAULT_BODY);
    for (let i = 0; i < BONES.length; i++) {
      const bone = BONES[i]!;
      const line = lineRefs.current[i];
      const pa = pose.points[bone[0]];
      const pb = pose.points[bone[1]];
      if (line && pa && pb) {
        // Update the two endpoints in place (Line2 exposes setPositions).
        const geom = (
          line as unknown as {
            geometry?: { setPositions?: (a: number[]) => void };
          }
        ).geometry;
        geom?.setPositions?.([pa[0], pa[1], pa[2], pb[0], pb[1], pb[2]]);
      }
    }
    const h = pose.points.headTop;
    if (head.current && h) head.current.position.set(h[0], h[1], h[2]);
  });

  return (
    <group ref={group} position={[0, -0.55, 0]} scale={0.92}>
      {BONES.map(([a, b], i) => {
        const pa = initial.points[a] ?? ([0, 0, 0] as Vec3);
        const pb = initial.points[b] ?? ([0, 0, 0] as Vec3);
        return (
          <Line
            key={i}
            ref={(el) => {
              lineRefs.current[i] = el;
            }}
            points={[V(pa), V(pb)]}
            color={color}
            lineWidth={3.5}
          />
        );
      })}
      <mesh ref={head} position={V(initial.points.headTop ?? [0, 1.6, 0])}>
        <sphereGeometry args={[0.085, 24, 24]} />
        <meshStandardMaterial color={color} metalness={0.1} roughness={0.5} />
      </mesh>
    </group>
  );
}

/**
 * A static SVG side-profile of the running figure — the graceful fallback when
 * WebGL can't run (no context available, disabled, or the boundary tripped).
 * Uses the same running pose so the tile still reads as "biomechanics".
 */
function StaticFigure({ color }: { color: string }) {
  const pose = useMemo(() => generatePose("run", 0.15, DEFAULT_BODY), []);
  // Project the sagittal (x,y) plane to SVG, y-up → y-down, centred.
  const SC = 150;
  const OX = 130;
  const OY = 150;
  const px = (p: Vec3) => OX + p[0] * SC;
  const py = (p: Vec3) => OY - p[1] * SC + 84;
  const head = pose.points.headTop;
  return (
    <svg
      viewBox="0 0 260 240"
      className="absolute inset-0 h-full w-full opacity-80"
      aria-hidden="true"
    >
      {BONES.map(([a, b], i) => {
        const pa = pose.points[a];
        const pb = pose.points[b];
        if (!pa || !pb) return null;
        return (
          <line
            key={i}
            x1={px(pa)}
            y1={py(pa)}
            x2={px(pb)}
            y2={py(pb)}
            stroke={color}
            strokeWidth={3}
            strokeLinecap="round"
          />
        );
      })}
      {head ? <circle cx={px(head)} cy={py(head)} r={9} fill={color} /> : null}
    </svg>
  );
}

/**
 * Error boundary that swaps to the static figure on failure. A decorative WebGL
 * preview must never blank the tile; if the Canvas throws we degrade gracefully.
 */
class CanvasBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function RunningFigure({ color = "#dfe3ee" }: { color?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  // Gate the Canvas on visibility so it only holds a GL context while on screen.
  const [visible, setVisible] = useState(false);
  const [webglOk, setWebglOk] = useState(true);

  useEffect(() => {
    // Probe WebGL availability once (a one-time capability check → SVG fallback).
    let ok = true;
    try {
      const c = document.createElement("canvas");
      const gl =
        c.getContext("webgl2") ||
        c.getContext("webgl") ||
        c.getContext("experimental-webgl");
      if (!gl) ok = false;
    } catch {
      ok = false;
    }
    if (!ok) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time capability probe
      setWebglOk(false);
    }
  }, []);

  useEffect(() => {
    const el = hostRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) setVisible(e.isIntersecting);
      },
      { rootMargin: "120px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const fallback = <StaticFigure color={color} />;

  return (
    <div ref={hostRef} className="absolute inset-0">
      {webglOk && visible ? (
        <CanvasBoundary fallback={fallback}>
          <Canvas
            camera={{ position: [1.6, 0.6, 2.4], fov: 42 }}
            dpr={[1, 2]}
            gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
            className="!absolute inset-0"
            onCreated={({ gl }) => {
              // Swallow context-loss so it never surfaces as an uncaught error.
              gl.domElement.addEventListener(
                "webglcontextlost",
                (e) => e.preventDefault(),
                false,
              );
            }}
          >
            <ContextReleaser />
            <ambientLight intensity={0.8} />
            <directionalLight position={[3, 5, 2]} intensity={0.6} />
            <Runner color={color} />
          </Canvas>
        </CanvasBoundary>
      ) : (
        fallback
      )}
    </div>
  );
}
