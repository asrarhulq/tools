"use client";

import { useMemo } from "react";
import { Html, Line } from "@react-three/drei";
import * as THREE from "three";
import type {
  FeaResult,
  Force,
  GeometryResult,
  StabilityResult,
  Vec3,
} from "../types";
import { length } from "../lib/vec";

const v = (p: Vec3) => new THREE.Vector3(p[0], p[1], p[2]);

/** Center-of-mass sphere with a gravity vector and a label. */
export function CoMMarker({ point, diag }: { point: Vec3; diag: number }) {
  const r = diag * 0.012;
  const gLen = diag * 0.2;
  return (
    <group position={v(point)}>
      <mesh>
        <sphereGeometry args={[r, 24, 24]} />
        <meshStandardMaterial
          color="#f59e0b"
          emissive="#f59e0b"
          emissiveIntensity={0.4}
        />
      </mesh>
      {/* Gravity direction (−Z). */}
      <Line
        points={[new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -gLen)]}
        color="#f59e0b"
        lineWidth={1.5}
        dashed
        dashScale={4}
      />
      <Html center distanceFactor={diag * 1.4}>
        <span className="pointer-events-none rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-medium text-black">
          CoM
        </span>
      </Html>
    </group>
  );
}

/** Three principal-axis lines through the center of mass. */
export function PrincipalAxes({ geometry }: { geometry: GeometryResult }) {
  const scale = Math.max(...geometry.boundingBox.size) * 0.55;
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
          />
        );
      })}
    </>
  );
}

/** Force arrows (shaft + cone) at each application point, scaled by magnitude. */
export function ForceArrows({
  forces,
  bboxDiagonal,
}: {
  forces: readonly Force[];
  bboxDiagonal: number;
}) {
  const maxMag = useMemo(
    () => Math.max(1, ...forces.map((f) => f.magnitude)),
    [forces],
  );
  return (
    <>
      {forces.map((f) => (
        <ForceArrow
          key={f.id}
          force={f}
          bboxDiagonal={bboxDiagonal}
          maxMag={maxMag}
        />
      ))}
    </>
  );
}

function ForceArrow({
  force,
  bboxDiagonal,
  maxMag,
}: {
  force: Force;
  bboxDiagonal: number;
  maxMag: number;
}) {
  const dir = useMemo(() => {
    const d = new THREE.Vector3(...force.direction);
    return d.lengthSq() > 0 ? d.normalize() : new THREE.Vector3(0, 0, -1);
  }, [force.direction]);

  // Length scales meaningfully with magnitude (relative to the largest force),
  // between 20% and 55% of the model diagonal.
  const frac = 0.2 + 0.35 * Math.sqrt(force.magnitude / maxMag);
  const len = bboxDiagonal * frac;
  const origin = v(force.point);
  // Draw the arrow pointing INTO the application point (load pushing the part).
  const tail = origin.clone().sub(dir.clone().multiplyScalar(len));
  const quaternion = useMemo(() => {
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    return q;
  }, [dir]);

  const headLen = len * 0.24;
  const shaftEnd = origin.clone().sub(dir.clone().multiplyScalar(headLen));

  return (
    <group>
      <Line points={[tail, shaftEnd]} color="#f43f5e" lineWidth={3} />
      <mesh
        position={origin.clone().sub(dir.clone().multiplyScalar(headLen / 2))}
        quaternion={quaternion}
      >
        <coneGeometry args={[bboxDiagonal * 0.02, headLen, 20]} />
        <meshStandardMaterial
          color="#f43f5e"
          emissive="#f43f5e"
          emissiveIntensity={0.3}
        />
      </mesh>
      <Html position={tail} center distanceFactor={bboxDiagonal * 1.4}>
        <span className="pointer-events-none rounded bg-rose-500 px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap text-white">
          {force.name}: {force.magnitude} N
        </span>
      </Html>
    </group>
  );
}

/** Stress-concentration highlight spheres from the FEA field. */
export function StressMarkers({ fea, diag }: { fea: FeaResult; diag: number }) {
  const r = diag * 0.016;
  return (
    <>
      {fea.stressConcentrations.map((p, i) => (
        <mesh key={i} position={v(p)}>
          <sphereGeometry args={[r, 16, 16]} />
          <meshBasicMaterial color="#ff2d55" transparent opacity={0.9} />
        </mesh>
      ))}
    </>
  );
}

/** Bounding-box dimension labels along each axis. */
export function DimensionLabels({ geometry }: { geometry: GeometryResult }) {
  const { min, max, size } = geometry.boundingBox;
  const diag = length(size) || 1;
  const items: Array<{ pos: Vec3; label: string }> = [
    {
      pos: [(min[0] + max[0]) / 2, min[1], min[2]],
      label: `X ${size[0].toFixed(1)}`,
    },
    {
      pos: [min[0], (min[1] + max[1]) / 2, min[2]],
      label: `Y ${size[1].toFixed(1)}`,
    },
    {
      pos: [min[0], min[1], (min[2] + max[2]) / 2],
      label: `Z ${size[2].toFixed(1)}`,
    },
  ];
  return (
    <>
      {items.map((it, i) => (
        <Html key={i} position={v(it.pos)} center distanceFactor={diag * 1.6}>
          <span className="pointer-events-none rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap text-white">
            {it.label}
          </span>
        </Html>
      ))}
    </>
  );
}

/** Pivot edge + marker for the stability tip-over indicator. */
export function PivotMarker({ stability }: { stability: StabilityResult }) {
  if (!stability.pivotEdge) return null;
  const color = stability.willTip ? "#ef4444" : "#22c55e";
  const [a, b] = stability.pivotEdge;
  return (
    <group>
      <Line points={[v(a), v(b)]} color={color} lineWidth={4} />
      {stability.pivot ? (
        <mesh position={v(stability.pivot)}>
          <sphereGeometry
            args={[length(stability.centerOfGravity) * 0.02 + 0.5, 16, 16]}
          />
          <meshBasicMaterial color={color} />
        </mesh>
      ) : null}
    </group>
  );
}
