"use client";

import * as THREE from "three";

interface RingsProps {
  planetRadius: number;
  tiltDeg: number;
  color?: string;
}

/**
 * A flat ring tilted by the planet's own axial tilt — not just decorative:
 * Uranus's ~98° tilt (it rotates almost on its side) makes its rings render
 * nearly edge-on from "above" the solar system, visibly different from
 * Saturn's familiar ~27° tilt. That's a real, correct consequence of the
 * data, not a coincidence of the geometry.
 */
export function Rings({
  planetRadius,
  tiltDeg,
  color = "#c9b48a",
}: RingsProps) {
  const inner = planetRadius * 1.3;
  const outer = planetRadius * 2.3;

  return (
    <group rotation={[0, 0, (tiltDeg * Math.PI) / 180]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[inner, outer, 64, 3]} />
        <meshStandardMaterial
          color={color}
          side={THREE.DoubleSide}
          transparent
          opacity={0.75}
          roughness={0.9}
        />
      </mesh>
    </group>
  );
}
