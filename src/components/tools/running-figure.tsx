"use client";

import { useMemo, useRef, useState } from "react";
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
 * The phase advances each frame to loop the running gait.
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
  const [phase, setPhase] = useState(0);
  const group = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    // ~1.4 gait cycles/sec — a natural jog cadence.
    setPhase((p) => (p + delta * 1.4) % 1);
    if (group.current) group.current.rotation.y += delta * 0.15;
  });

  const pose = useMemo(() => generatePose("run", phase, DEFAULT_BODY), [phase]);
  const head = pose.points.headTop;

  return (
    <group ref={group} position={[0, -0.55, 0]} scale={0.92}>
      {BONES.map(([a, b], i) => {
        const pa = pose.points[a];
        const pb = pose.points[b];
        if (!pa || !pb) return null;
        return (
          <Line key={i} points={[V(pa), V(pb)]} color={color} lineWidth={3.5} />
        );
      })}
      {head ? (
        <mesh position={V(head)}>
          <sphereGeometry args={[0.085, 24, 24]} />
          <meshStandardMaterial color={color} metalness={0.1} roughness={0.5} />
        </mesh>
      ) : null}
    </group>
  );
}

export function RunningFigure({ color = "#dfe3ee" }: { color?: string }) {
  return (
    <Canvas
      camera={{ position: [1.6, 0.6, 2.4], fov: 42 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      className="!absolute inset-0"
    >
      <ambientLight intensity={0.8} />
      <directionalLight position={[3, 5, 2]} intensity={0.6} />
      <Runner color={color} />
    </Canvas>
  );
}
