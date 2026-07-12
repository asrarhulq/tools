"use client";

import { useMemo } from "react";
import { Html, Line } from "@react-three/drei";
import * as THREE from "three";
import type {
  FeaResult,
  Force,
  GeometryResult,
  StabilityResult,
  Support,
  Vec3,
} from "../types";

const v = (p: Vec3) => new THREE.Vector3(p[0], p[1], p[2]);

/** Center-of-mass sphere with a label. */
export function CoMMarker({ point }: { point: Vec3 }) {
  return (
    <group position={v(point)}>
      <mesh>
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial color="#f59e0b" />
      </mesh>
      <Html center distanceFactor={80}>
        <span className="pointer-events-none rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-medium text-black">
          CoM
        </span>
      </Html>
    </group>
  );
}

/** Three principal-axis lines through the center of mass. */
export function PrincipalAxes({
  geometry,
}: {
  geometry: GeometryResult;
}) {
  const scale = Math.max(...geometry.boundingBox.size) * 0.6;
  const c = geometry.centerOfMass;
  const colors = ["#ef4444", "#22c55e", "#3b82f6"];
  return (
    <>
      {geometry.principalAxes.map((axis, i) => {
        const end: Vec3 = [
          c[0] + axis[0] * scale,
          c[1] + axis[1] * scale,
          c[2] + axis[2] * scale,
        ];
        const start: Vec3 = [
          c[0] - axis[0] * scale,
          c[1] - axis[1] * scale,
          c[2] - axis[2] * scale,
        ];
        return (
          <Line
            key={i}
            points={[v(start), v(end)]}
            color={colors[i]}
            lineWidth={2}
            dashed={false}
          />
        );
      })}
    </>
  );
}

/** Force arrows (cone + shaft) at each application point. */
export function ForceArrows({
  forces,
  bboxDiagonal,
}: {
  forces: readonly Force[];
  bboxDiagonal: number;
}) {
  return (
    <>
      {forces.map((f) => (
        <ForceArrow key={f.id} force={f} bboxDiagonal={bboxDiagonal} />
      ))}
    </>
  );
}

function ForceArrow({
  force,
  bboxDiagonal,
}: {
  force: Force;
  bboxDiagonal: number;
}) {
  const dir = useMemo(() => {
    const d = new THREE.Vector3(...force.direction);
    return d.lengthSq() > 0 ? d.normalize() : new THREE.Vector3(0, 0, -1);
  }, [force.direction]);

  // Arrow length scales with magnitude, capped to a fraction of the model.
  const len = Math.min(
    bboxDiagonal * 0.5,
    bboxDiagonal * 0.15 + force.magnitude * 0.02,
  );
  const origin = v(force.point);
  const tip = origin.clone().add(dir.clone().multiplyScalar(len));
  const quaternion = useMemo(() => {
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    return q;
  }, [dir]);

  const headLen = len * 0.25;

  return (
    <group>
      <Line points={[origin, tip]} color="#ef4444" lineWidth={3} />
      <mesh
        position={tip.clone().sub(dir.clone().multiplyScalar(headLen / 2))}
        quaternion={quaternion}
      >
        <coneGeometry args={[len * 0.06, headLen, 16]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
      <Html position={tip} center distanceFactor={80}>
        <span className="pointer-events-none rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
          {force.magnitude} N
        </span>
      </Html>
    </group>
  );
}

/** Support anchors as small green pyramids. */
export function SupportMarkers({ supports }: { supports: readonly Support[] }) {
  return (
    <>
      {supports.map((s) => (
        <mesh key={s.id} position={v(s.point)}>
          <coneGeometry args={[1.5, 3, 4]} />
          <meshBasicMaterial color="#22c55e" />
        </mesh>
      ))}
    </>
  );
}

/** Stress-concentration highlight spheres from the FEA approximation. */
export function StressMarkers({ fea }: { fea: FeaResult }) {
  return (
    <>
      {fea.stressConcentrations.map((p, i) => (
        <mesh key={i} position={v(p)}>
          <sphereGeometry args={[1.4, 16, 16]} />
          <meshBasicMaterial color="#ff2d55" />
        </mesh>
      ))}
    </>
  );
}

/** Bounding-box dimension labels along each axis. */
export function DimensionLabels({
  geometry,
}: {
  geometry: GeometryResult;
}) {
  const { min, max, size } = geometry.boundingBox;
  const items: Array<{ pos: Vec3; label: string }> = [
    { pos: [(min[0] + max[0]) / 2, min[1], min[2]], label: `X ${size[0].toFixed(1)}` },
    { pos: [min[0], (min[1] + max[1]) / 2, min[2]], label: `Y ${size[1].toFixed(1)}` },
    { pos: [min[0], min[1], (min[2] + max[2]) / 2], label: `Z ${size[2].toFixed(1)}` },
  ];
  return (
    <>
      {items.map((it, i) => (
        <Html key={i} position={v(it.pos)} center distanceFactor={90}>
          <span className="pointer-events-none whitespace-nowrap rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
            {it.label}
          </span>
        </Html>
      ))}
    </>
  );
}

/** Overturning-pivot indicator for the stability animation. */
export function PivotMarker({ stability }: { stability: StabilityResult }) {
  if (!stability.pivot) return null;
  return (
    <mesh position={v(stability.pivot)}>
      <sphereGeometry args={[1.6, 16, 16]} />
      <meshBasicMaterial color={stability.willTip ? "#ef4444" : "#22c55e"} />
    </mesh>
  );
}
