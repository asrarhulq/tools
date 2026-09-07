"use client";

import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { computeScenePosition } from "../lib/orbital-mechanics";
import { cometRadiusToSceneUnits, radiusToSceneUnits } from "../lib/scale";
import {
  getBandedTexture,
  getCometTailTexture,
  getRockyTexture,
} from "../lib/textures";
import { useOrrery } from "../state/orrery-context";
import type { CelestialBody as CelestialBodyData } from "../types";
import { OrbitPath } from "./orbit-path";
import { Rings } from "./rings";

const TAIL_UP = new THREE.Vector3(0, 1, 0);

/** How far a comet's tail stretches, in scene units, as a function of its
 * true distance from the Sun (AU) — short and faint far out, long and bright
 * near perihelion, the way real comet tails (driven by solar heating) work. */
function tailLength(radiusAu: number): number {
  return THREE.MathUtils.clamp(3.2 / Math.sqrt(radiusAu + 0.15), 0.5, 4.5);
}

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
  const tailRef = useRef<THREE.Mesh>(null);
  const {
    jdRef,
    scaleMode,
    selectedBodyId,
    selectBody,
    showLabels,
    showOrbits,
  } = useOrrery();

  const isMoon = body.kind === "moon";
  const isComet = body.kind === "comet";
  const radius = useMemo(
    () =>
      isComet
        ? cometRadiusToSceneUnits(body.physical.radiusKm, scaleMode)
        : radiusToSceneUnits(body.physical.radiusKm, scaleMode),
    [body.physical.radiusKm, scaleMode, isComet],
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

    const tail = tailRef.current;
    if (tail && pos.radiusAu > 0) {
      // Points radially outward from the Sun (the origin), through the
      // comet — a straight line the same shape every comet tail actually
      // takes, since it's driven by the solar wind, not orbital motion.
      const away = g.position.clone().normalize();
      const length = tailLength(pos.radiusAu);
      tail.position.copy(away.clone().multiplyScalar(length / 2));
      tail.quaternion.setFromUnitVectors(TAIL_UP, away.clone().negate());
      tail.scale.set(1, length, 1);
    }
  });

  const isSelected = selectedBodyId === body.id;
  const isSmallBody = isMoon || isComet;
  const labelOffset = isSmallBody ? radius + 0.2 : radius + 0.32;
  // drei's <Html> scales its element to 1x CSS size at `distanceFactor`
  // units from the camera, growing/shrinking from there — a single fixed
  // constant meant a tiny comet (camera parked ~1.4 units away in Follow
  // mode) blew its label up to dominate the whole viewport, while the same
  // constant looked fine on a planet the camera sits much farther from.
  // Deriving it from each body's own Follow-mode distance keeps every
  // body's label a similar, legible size regardless of how close following
  // it actually parks the camera.
  const followDistance = Math.max(radius * 6, 1.4);
  const labelDistanceFactor = followDistance * 3;

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
        {isComet && (
          <mesh ref={tailRef}>
            <coneGeometry args={[0.16, 1, 16, 1, true]} />
            <meshBasicMaterial
              color="#cfe3ff"
              map={getCometTailTexture()}
              alphaMap={getCometTailTexture()}
              transparent
              opacity={0.85}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
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
            distanceFactor={labelDistanceFactor}
            style={{ pointerEvents: "none" }}
          >
            <span
              className="font-sans font-semibold whitespace-nowrap"
              style={{
                fontSize: isSmallBody ? 11 : 13,
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
