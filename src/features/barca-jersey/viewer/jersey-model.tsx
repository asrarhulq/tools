"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  buildCuffGeometry,
  buildSleeveGeometry,
  buildTorsoGeometry,
  sleevePlacement,
} from "../lib/geometry";
import { BLAUGRANA, createJerseyTexture } from "../lib/texture";

/**
 * Assembles the jersey from the torso lathe + two mirrored sleeves + cuff
 * trim rings, all sharing one procedurally-painted texture for the torso and
 * flat colors for the sleeves. A slow bob (not a spin — `OrbitControls`
 * already owns rotation) keeps it feeling alive at rest.
 */
export function JerseyModel({
  name,
  number,
  animate,
}: {
  name: string;
  number: string;
  animate: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);

  const torsoGeometry = useMemo(() => buildTorsoGeometry(), []);
  const sleeveGeometry = useMemo(() => buildSleeveGeometry(), []);
  const cuffGeometry = useMemo(() => buildCuffGeometry(), []);

  const texture = useMemo(
    () => createJerseyTexture({ name, number }),
    [name, number],
  );

  const torsoMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.82,
        metalness: 0.05,
      }),
    [texture],
  );

  const sleeveMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: BLAUGRANA.stripeA,
        roughness: 0.85,
        metalness: 0.04,
      }),
    [],
  );

  const cuffMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: BLAUGRANA.trim,
        roughness: 0.6,
        metalness: 0.1,
        side: THREE.DoubleSide,
      }),
    [],
  );

  const right = useMemo(() => sleevePlacement("right"), []);
  const left = useMemo(() => sleevePlacement("left"), []);

  useFrame((state) => {
    if (!animate || !groupRef.current) return;
    groupRef.current.position.y =
      Math.sin(state.clock.elapsedTime * 0.9) * 0.025;
  });

  return (
    <group ref={groupRef}>
      <mesh
        geometry={torsoGeometry}
        material={torsoMaterial}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={sleeveGeometry}
        material={sleeveMaterial}
        position={right.position}
        quaternion={right.quaternion}
        castShadow
      />
      <mesh
        geometry={sleeveGeometry}
        material={sleeveMaterial}
        position={left.position}
        quaternion={left.quaternion}
        castShadow
      />
      <mesh
        geometry={cuffGeometry}
        material={cuffMaterial}
        position={right.cuffPosition}
        quaternion={right.quaternion}
      />
      <mesh
        geometry={cuffGeometry}
        material={cuffMaterial}
        position={left.cuffPosition}
        quaternion={left.quaternion}
      />
    </group>
  );
}
