"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Line } from "@react-three/drei";
import type {
  FrameAnalysis,
  JointId,
  Pose,
  VisualizationMode,
  Vec3,
} from "../types";
import { rampColor } from "../lib/colormap";
import { buildBody } from "./body-geometry";

/**
 * The human figure. Rather than ball-and-stick primitives, the body is ONE
 * continuous merged surface rebuilt from the pose each frame (see
 * `body-geometry.ts`) — muscled, seamless, with no visible joint spheres. It is
 * shaded as fleshy PBR skin and recolored by visualization mode (a whole-body
 * activation/load tint in muscle/joint/injury/heat-map modes). Skeleton mode
 * shows a thin internal bone line-figure instead. All overlays (CoM, force,
 * joint markers used only where diagnostic) sit on top.
 */

const V = (p: Vec3) => new THREE.Vector3(p[0], p[1], p[2]);
const rgb = (t: number) => {
  const [r, g, b] = rampColor(t);
  return new THREE.Color(r, g, b);
};

const SKIN = new THREE.Color("#c8a48c");

/** Bone chain for skeleton mode (thin lines, no spheres). */
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

export function HumanModel({
  pose,
  frame,
  mode,
  girth = 1,
  opacity = 1,
  tint,
}: {
  pose: Pose;
  frame: FrameAnalysis;
  mode: VisualizationMode;
  girth?: number;
  opacity?: number;
  tint?: string;
}) {
  const skeleton = mode === "skeleton";

  // Rebuild the continuous surface when the pose changes (frame-fresh geometry).
  const geometry = useMemo(
    () => (skeleton ? null : buildBody(pose, girth)),
    [pose, girth, skeleton],
  );

  // Dispose old geometry to avoid GPU leaks as frames advance.
  const prev = useRef<THREE.BufferGeometry | null>(null);
  useEffect(() => {
    if (prev.current && prev.current !== geometry) prev.current.dispose();
    prev.current = geometry;
    return () => {
      if (geometry) geometry.dispose();
    };
  }, [geometry]);

  // Whole-body tint from the current load/activation in analytical modes.
  const bodyColor = useMemo(() => {
    if (tint) return new THREE.Color(tint);
    if (mode === "muscle" || mode === "heatmap") {
      const peak = Math.max(0, ...frame.muscles.map((m) => m.activation));
      return SKIN.clone().lerp(rgb(peak), 0.55);
    }
    if (mode === "joint" || mode === "injury") {
      const peak = Math.max(0, ...frame.jointLoads.map((j) => j.loadFraction));
      return SKIN.clone().lerp(rgb(peak), 0.4);
    }
    if (mode === "force")
      return SKIN.clone().lerp(new THREE.Color("#8b8ff5"), 0.25);
    return SKIN;
  }, [tint, mode, frame.muscles, frame.jointLoads]);

  if (skeleton) {
    return (
      <group>
        {BONES.map(([a, b], i) => {
          const pa = pose.points[a];
          const pb = pose.points[b];
          if (!pa || !pb) return null;
          return (
            <Line
              key={i}
              points={[V(pa), V(pb)]}
              color={tint ?? "#dfe3ee"}
              lineWidth={3}
            />
          );
        })}
        {pose.points.headTop ? (
          <mesh position={V(pose.points.headTop)}>
            <sphereGeometry args={[0.075, 24, 24]} />
            <meshStandardMaterial
              color={tint ?? "#dfe3ee"}
              metalness={0.1}
              roughness={0.5}
            />
          </mesh>
        ) : null}
      </group>
    );
  }

  return (
    <group>
      {geometry ? (
        <mesh geometry={geometry} castShadow receiveShadow>
          <meshStandardMaterial
            color={bodyColor}
            transparent={opacity < 1}
            opacity={opacity}
            metalness={0.0}
            roughness={0.55}
            envMapIntensity={0.7}
            emissive={bodyColor}
            emissiveIntensity={0.04}
            flatShading={false}
          />
        </mesh>
      ) : null}

      {/* Diagnostic joint markers only in the analytical "joint" mode — small
          discs at loaded joints, not decorative balls. */}
      {mode === "joint"
        ? frame.jointLoads
            .filter((j) => j.loadFraction > 0.35)
            .map((j) => {
              const key = jointPointKey(j.joint);
              const p = key ? pose.points[key] : undefined;
              if (!p) return null;
              return (
                <mesh key={j.joint} position={V(p)}>
                  <sphereGeometry args={[0.03, 12, 12]} />
                  <meshBasicMaterial
                    color={rgb(j.loadFraction)}
                    transparent
                    opacity={0.85}
                  />
                </mesh>
              );
            })
        : null}
    </group>
  );
}

function jointPointKey(joint: JointId): string | null {
  const map: Partial<Record<JointId, string>> = {
    kneeL: "kneeL",
    kneeR: "kneeR",
    hipL: "hipL",
    hipR: "hipR",
    ankleL: "ankleL",
    ankleR: "ankleR",
    shoulderL: "shoulderL",
    shoulderR: "shoulderR",
    elbowL: "elbowL",
    elbowR: "elbowR",
    lumbar: "pelvis",
    neck: "trunkTop",
  };
  return map[joint] ?? null;
}

/** GRF vector overlay (force mode). */
export function ForceOverlay({
  pose,
  frame,
  bodyWeightN,
}: {
  pose: Pose;
  frame: FrameAnalysis;
  bodyWeightN: number;
}) {
  const grfLen = Math.min(1.2, frame.grfN * 0.0006);
  const footY = Math.min(
    pose.points.toeL?.[1] ?? 0,
    pose.points.toeR?.[1] ?? 0,
  );
  const footX =
    (pose.points.toeL?.[0] ?? 0) * 0.5 + (pose.points.toeR?.[0] ?? 0) * 0.5;
  if (frame.grfN <= 1) return null;
  const start = new THREE.Vector3(footX, footY, 0);
  const end = new THREE.Vector3(footX, footY + grfLen, 0);
  void bodyWeightN;
  return (
    <group>
      <Line points={[start, end]} color="#f43f5e" lineWidth={3} />
      <mesh position={end}>
        <coneGeometry args={[0.03, 0.08, 12]} />
        <meshBasicMaterial color="#f43f5e" />
      </mesh>
    </group>
  );
}

/** Center-of-mass marker + trajectory. */
export function CoMOverlay({
  com,
  trajectory,
}: {
  com: Vec3;
  trajectory: Vec3[];
}) {
  return (
    <group>
      <mesh position={V(com)}>
        <sphereGeometry args={[0.03, 16, 16]} />
        <meshStandardMaterial
          color="#f59e0b"
          emissive="#f59e0b"
          emissiveIntensity={0.5}
        />
      </mesh>
      {trajectory.length > 1 ? (
        <Line
          points={trajectory.map((p) => V(p))}
          color="#f59e0b"
          lineWidth={1.5}
          dashed
          dashScale={20}
          transparent
          opacity={0.5}
        />
      ) : null}
    </group>
  );
}
