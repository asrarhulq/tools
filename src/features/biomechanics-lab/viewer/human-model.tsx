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
import { buildBody, type RegionColor, type RegionKey } from "./body-geometry";

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
  // Heat-map & muscle modes paint the body per region so load/activation is
  // legible across the whole figure (a real heat map), not a single flat tint.
  const perRegion = mode === "heatmap" || mode === "muscle";

  // A per-region colour driven by the local muscle activation + joint load, so
  // e.g. the quads light up in a squat while the calves stay cool.
  const regionColor = useMemo<RegionColor | undefined>(() => {
    if (!perRegion || tint) return undefined;
    const load = regionLoadMap(frame);
    return (region: RegionKey) => rampColor(load[region] ?? 0.05);
  }, [perRegion, tint, frame]);

  // Rebuild the continuous surface when the pose (or heat colouring) changes.
  const geometry = useMemo(
    () => (skeleton ? null : buildBody(pose, girth, regionColor)),
    [pose, girth, skeleton, regionColor],
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

  // Whole-body tint for the modes that don't paint per-region vertex colours.
  // (muscle/heatmap use `regionColor` + vertexColors instead, so here they just
  // fall through to plain white which lets the vertex colours show at full
  // strength.)
  const bodyColor = useMemo(() => {
    if (tint) return new THREE.Color(tint);
    if (perRegion) return new THREE.Color("#ffffff"); // vertex colours drive it
    if (mode === "joint" || mode === "injury") {
      const peak = Math.max(0, ...frame.jointLoads.map((j) => j.loadFraction));
      return SKIN.clone().lerp(rgb(peak), 0.4);
    }
    if (mode === "force")
      return SKIN.clone().lerp(new THREE.Color("#8b8ff5"), 0.25);
    return SKIN;
  }, [tint, perRegion, mode, frame.jointLoads]);

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
            vertexColors={perRegion && !tint}
            transparent={opacity < 1}
            opacity={opacity}
            metalness={0.0}
            roughness={0.5}
            envMapIntensity={0.7}
            emissive={
              perRegion && !tint ? new THREE.Color("#000000") : bodyColor
            }
            emissiveIntensity={perRegion ? 0.12 : 0.04}
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

/**
 * Collapse the frame's muscle activations + joint loads into a single 0..1 heat
 * value per drawable body region, so the whole figure reads as a heat map. Each
 * region takes the max of any muscle spanning it and the reaction load of its
 * bounding joints — whichever is hotter wins, which matches intuition (a working
 * quad OR a heavily loaded knee both make the thigh "hot").
 */
function regionLoadMap(frame: FrameAnalysis): Record<string, number> {
  const m: Record<string, number> = {};
  const bump = (k: string, v: number) => {
    if (v > (m[k] ?? 0)) m[k] = v;
  };
  // Muscle groups carry a `segment` id (thighL, shankR, trunk, upperArmL…).
  for (const mu of frame.muscles) bump(mu.segment, mu.activation);
  // Joint loads spill onto the adjacent segments.
  for (const j of frame.jointLoads) {
    const f = j.loadFraction;
    switch (j.joint) {
      case "kneeL":
        bump("thighL", f);
        bump("shankL", f);
        break;
      case "kneeR":
        bump("thighR", f);
        bump("shankR", f);
        break;
      case "hipL":
        bump("thighL", f);
        bump("pelvis", f);
        break;
      case "hipR":
        bump("thighR", f);
        bump("pelvis", f);
        break;
      case "ankleL":
        bump("shankL", f);
        bump("footL", f);
        break;
      case "ankleR":
        bump("shankR", f);
        bump("footR", f);
        break;
      case "shoulderL":
        bump("upperArmL", f);
        bump("trunk", f * 0.6);
        break;
      case "shoulderR":
        bump("upperArmR", f);
        bump("trunk", f * 0.6);
        break;
      case "elbowL":
        bump("upperArmL", f);
        bump("forearmL", f);
        break;
      case "elbowR":
        bump("upperArmR", f);
        bump("forearmR", f);
        break;
      case "lumbar":
        bump("trunk", f);
        bump("pelvis", f);
        break;
      case "neck":
        bump("head", f);
        break;
    }
  }
  return m;
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
