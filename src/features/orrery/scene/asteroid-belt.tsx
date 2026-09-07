"use client";

import { useFrame } from "@react-three/fiber";
import { useCallback, useEffect, useRef } from "react";
import * as THREE from "three";
import { daysSinceJ2000 } from "../lib/julian-date";
import { auToSceneUnits } from "../lib/scale";
import { useOrrery } from "../state/orrery-context";

const COUNT = 1400;
const INNER_AU = 2.1;
const OUTER_AU = 3.3;
/** Not each rock's real individual period — simulating that many two-body
 * orbits per frame buys nothing visually at this zoom. The whole field
 * instead rotates together at roughly the belt's average orbital period,
 * so it visibly keeps pace with the simulation clock without the cost. */
const AVG_PERIOD_DAYS = 4.3 * 365.25;

interface AsteroidSeed {
  au: number;
  angle: number;
  height: number;
  scale: number;
}

/** The main asteroid belt, between Mars and Jupiter, as one instanced mesh. */
export function AsteroidBelt() {
  const { jdRef, scaleMode } = useOrrery();
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const seedsRef = useRef<AsteroidSeed[] | null>(null);

  const applyMatrices = useCallback(() => {
    const mesh = meshRef.current;
    const seeds = seedsRef.current;
    if (!mesh || !seeds) return;
    const dummy = new THREE.Object3D();
    seeds.forEach((s, i) => {
      const sceneRadius = auToSceneUnits(s.au, scaleMode);
      dummy.position.set(
        Math.cos(s.angle) * sceneRadius,
        s.height,
        Math.sin(s.angle) * sceneRadius,
      );
      dummy.scale.setScalar(s.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [scaleMode]);

  // Random field generated once, in an effect — never during render, so
  // StrictMode's double-render can't produce two different belts.
  useEffect(() => {
    const seeds: AsteroidSeed[] = [];
    for (let i = 0; i < COUNT; i++) {
      seeds.push({
        au: INNER_AU + Math.random() * (OUTER_AU - INNER_AU),
        angle: Math.random() * Math.PI * 2,
        height: (Math.random() - 0.5) * 0.4,
        scale: 0.02 + Math.random() * 0.05,
      });
    }
    seedsRef.current = seeds;
    applyMatrices();
    // Runs once on mount only — reapplying on every `applyMatrices` identity
    // change would regenerate nothing (seeds are already cached) but the
    // scaleMode effect below already covers that case explicitly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reapply the (unchanged) random field through the current scale whenever
  // the scale mode changes, without ever regenerating the randomness itself.
  useEffect(() => {
    applyMatrices();
  }, [applyMatrices]);

  useFrame(() => {
    if (!groupRef.current) return;
    const angle =
      (daysSinceJ2000(jdRef.current) / AVG_PERIOD_DAYS) * Math.PI * 2;
    groupRef.current.rotation.y = angle;
  });

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#8a7f6e" roughness={1} />
      </instancedMesh>
    </group>
  );
}
