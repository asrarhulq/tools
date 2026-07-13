"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { Vec3 } from "../types";

/**
 * A realistic virtual build plate on the z = 0 plane. Renders a rounded plate
 * slab sized to the part, a faint bed grid, and a highlighted contact region
 * (the support polygon) so the printable footprint reads at a glance.
 */
export function BuildPlate({
  size,
  diag,
  contactArea,
}: {
  size: Vec3;
  diag: number;
  contactArea?: readonly (readonly [number, number])[];
}) {
  // Plate spans generously beyond the part footprint.
  const plate = Math.max(diag * 1.6, Math.max(size[0], size[1]) * 1.8);
  const thickness = Math.max(1, diag * 0.015);

  const contactShape = useMemo(() => {
    if (!contactArea || contactArea.length < 3) return null;
    const shape = new THREE.Shape();
    shape.moveTo(contactArea[0]![0], contactArea[0]![1]);
    for (let i = 1; i < contactArea.length; i++) {
      shape.lineTo(contactArea[i]![0], contactArea[i]![1]);
    }
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
  }, [contactArea]);

  return (
    <group>
      {/* Plate slab (top face flush with z = 0). */}
      <mesh position={[0, 0, -thickness / 2]} receiveShadow>
        <boxGeometry args={[plate, plate, thickness]} />
        <meshStandardMaterial
          color="#1c1e27"
          metalness={0.6}
          roughness={0.4}
          envMapIntensity={0.6}
        />
      </mesh>

      {/* Thin brushed top surface for a bed-like sheen. */}
      <mesh
        position={[0, 0, 0.001]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[plate, plate]} />
        <meshStandardMaterial
          color="#23262f"
          metalness={0.35}
          roughness={0.65}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Highlighted contact footprint. */}
      {contactShape ? (
        <mesh geometry={contactShape} position={[0, 0, 0.05]}>
          <meshBasicMaterial
            color="#4ade80"
            transparent
            opacity={0.28}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ) : null}
    </group>
  );
}
