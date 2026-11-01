"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  buildSleeveGeometry,
  buildTorsoGeometry,
  sleevePlacement,
} from "../lib/geometry";
import {
  createJerseyTexture,
  createKnitBumpTexture,
  createSleeveTexture,
} from "../lib/texture";

/**
 * Assembles the jersey from the torso surface + two mirrored sleeves, each
 * carrying its own procedurally-painted texture (the torso's stripes/crest/
 * back print, the sleeve's trim band). A slow bob (not a spin —
 * `OrbitControls` already owns rotation) keeps it feeling alive at rest.
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

  const texture = useMemo(
    () => createJerseyTexture({ name, number }),
    [name, number],
  );
  const bumpTexture = useMemo(() => createKnitBumpTexture(), []);
  const sleeveTexture = useMemo(() => createSleeveTexture(), []);

  const torsoMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: texture,
        bumpMap: bumpTexture,
        bumpScale: 0.5,
        roughness: 0.68,
        metalness: 0.08,
        envMapIntensity: 1.1,
        side: THREE.DoubleSide,
      }),
    [texture, bumpTexture],
  );

  const sleeveMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: sleeveTexture,
        roughness: 0.7,
        metalness: 0.07,
        envMapIntensity: 1.1,
        side: THREE.DoubleSide,
      }),
    [sleeveTexture],
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
    </group>
  );
}
