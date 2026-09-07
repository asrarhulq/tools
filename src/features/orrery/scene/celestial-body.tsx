"use client";

import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";
import { computeScenePosition } from "../lib/orbital-mechanics";
import { radiusToSceneUnits } from "../lib/scale";
import { getBandedTexture, getRockyTexture } from "../lib/textures";
import { useOrrery } from "../state/orrery-context";
import type { CelestialBody as CelestialBodyData } from "../types";
import { OrbitPath } from "./orbit-path";
import { Rings } from "./rings";

const GAS_GIANT_BANDS: Record<string, readonly string[]> = {
  jupiter: [
    "#c9975f",
    "#e8d4ae",
    "#b9835a",
    "#f0e0c0",
    "#a86c42",
    "#e8d4ae",
    "#c9975f",
  ],
  saturn: ["#e8d4a0", "#f3e6c0", "#d9c088", "#f3e6c0", "#e8d4a0"],
  uranus: ["#a7ddde", "#bfeaea", "#93cfd0"],
  neptune: ["#3f5efb", "#5878ff", "#2c3fc7", "#5878ff"],
};

interface CelestialBodyProps {
  body: CelestialBodyData;
  bodyById: ReadonlyMap<string, CelestialBodyData>;
}

/**
 * Renders any Sun-orbiting or planet-orbiting body (planet, dwarf planet, or
 * moon) — one component covers all of them, since `computeScenePosition`
 * already folds a moon's parent offset in. Position updates happen entirely
 * inside `useFrame`, mutating the mesh's transform directly rather than
 * through React state, so 60fps motion never triggers a re-render.
 */
export function CelestialBody({ body, bodyById }: CelestialBodyProps) {
  const groupRef = useRef<THREE.Group>(null);
  const {
    jdRef,
    scaleMode,
    selectedBodyId,
    selectBody,
    showLabels,
    showOrbits,
  } = useOrrery();

  const isMoon = body.kind === "moon";
  const radius = useMemo(
    () => radiusToSceneUnits(body.physical.radiusKm, scaleMode),
    [body.physical.radiusKm, scaleMode],
  );

  const texture = useMemo(() => {
    const bands = GAS_GIANT_BANDS[body.id];
    if (bands) return getBandedTexture(body.id, bands);
    return getRockyTexture(body.id, body.physical.color);
  }, [body.id, body.physical.color]);

  useFrame(() => {
    const g = groupRef.current;
    if (!g) return;
    const pos = computeScenePosition(body, jdRef.current, scaleMode, bodyById);
    // Ecliptic (x, y, z-out-of-plane) -> three.js Y-up (x, z-out-of-plane, y).
    g.position.set(pos.x, pos.z, pos.y);
  });

  const isSelected = selectedBodyId === body.id;
  const labelOffset = isMoon ? radius + 0.2 : radius + 0.32;

  return (
    <>
      {showOrbits && (
        <OrbitPath
          elements={body.elements}
          scaleMode={scaleMode}
          isMoon={isMoon}
          color={isMoon ? "#4a5a78" : "#5a6b8f"}
          opacity={isMoon ? 0.22 : 0.35}
        />
      )}
      <group ref={groupRef}>
        <mesh
          castShadow
          receiveShadow
          onClick={(e) => {
            e.stopPropagation();
            selectBody(body.id);
          }}
        >
          <sphereGeometry args={[radius, isMoon ? 20 : 40, isMoon ? 20 : 40]} />
          <meshStandardMaterial
            map={texture}
            roughness={0.85}
            metalness={0.05}
            emissive={isSelected ? "#3a6b82" : "#000000"}
            emissiveIntensity={isSelected ? 0.5 : 0}
          />
        </mesh>
        {body.hasRings && (
          <Rings planetRadius={radius} tiltDeg={body.physical.axialTiltDeg} />
        )}
        {showLabels && (
          // A real DOM overlay, not drei's <Text> (troika-three-text) — that
          // tries to fetch a fallback font from an external CDN by default,
          // which this site's CSP correctly blocks and which crashed the
          // whole scene. <Html> just renders normal text in the page's own
          // already-loaded fonts, no network request at all.
          <Html
            position={[0, labelOffset, 0]}
            center
            distanceFactor={isMoon ? 9 : 16}
            style={{ pointerEvents: "none" }}
          >
            <span
              className="font-sans font-semibold whitespace-nowrap"
              style={{
                fontSize: isMoon ? 11 : 13,
                color: isSelected ? "#f5c26b" : "#c7d2f0",
                textShadow:
                  "0 1px 3px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.6)",
              }}
            >
              {body.name}
            </span>
          </Html>
        )}
      </group>
    </>
  );
}
