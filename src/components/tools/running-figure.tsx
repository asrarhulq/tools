"use client";

import { Component, useMemo, useRef, type ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
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
 * The phase advances in a **ref** each frame and the bone endpoints are mutated
 * in place (no per-frame React setState — that thrashed on every frame and could
 * throw across the client-side navigation into/out of the tool, blanking the
 * tile). The whole Canvas is wrapped in an error boundary + WebGL context-loss
 * guard so, if anything goes wrong (e.g. the browser's live-context limit is hit
 * after opening the full lab), it silently degrades to nothing instead of
 * showing a white error screen.
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
 * Error boundary that renders nothing on failure. A decorative WebGL preview
 * must never take down the homepage; if the Canvas throws (context limit, lost
 * context, chunk mismatch), we degrade to the blueprint background alone.
 */
class CanvasBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function RunningFigure({ color = "#dfe3ee" }: { color?: string }) {
  return (
    <CanvasBoundary>
      <Canvas
        camera={{ position: [1.6, 0.6, 2.4], fov: 42 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
        className="!absolute inset-0"
        // If the GPU drops this context (common after opening the full lab,
        // which spins up its own heavier context), swallow the event so it
        // doesn't surface as an uncaught error.
        onCreated={({ gl }) => {
          gl.domElement.addEventListener(
            "webglcontextlost",
            (e) => e.preventDefault(),
            false,
          );
        }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[3, 5, 2]} intensity={0.6} />
        <Runner color={color} />
      </Canvas>
    </CanvasBoundary>
  );
}
