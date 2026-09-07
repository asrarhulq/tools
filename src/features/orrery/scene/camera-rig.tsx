"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { computeScenePosition } from "../lib/orbital-mechanics";
import { radiusToSceneUnits } from "../lib/scale";
import { useOrrery } from "../state/orrery-context";
import type { CelestialBody } from "../types";

interface CameraRigProps {
  bodyById: ReadonlyMap<string, CelestialBody>;
}

/**
 * Eases the camera toward whatever the current camera mode wants — the
 * selected body (with an offset scaled to that body's own rendered size, so
 * "follow Mercury" doesn't leave the camera absurdly far from a small
 * planet) or a top-down view of the whole system. "Free" mode leaves the
 * camera and OrbitControls target alone entirely.
 */
export function CameraRig({ bodyById }: CameraRigProps) {
  const { camera, controls } = useThree();
  const { jdRef, scaleMode, cameraMode, selectedBodyId } = useOrrery();
  const desiredTarget = useRef(new THREE.Vector3());

  useFrame(() => {
    const ctrl = controls as unknown as {
      target?: THREE.Vector3;
      update?: () => void;
    } | null;

    if (cameraMode === "top-down") {
      camera.position.lerp(new THREE.Vector3(0.01, 95, 0.01), 0.05);
      desiredTarget.current.set(0, 0, 0);
    } else if (cameraMode === "follow" && selectedBodyId) {
      const body = bodyById.get(selectedBodyId);
      if (!body) return;
      const isStar = body.kind === "star";
      const scenePosRaw = isStar
        ? { x: 0, y: 0, z: 0 }
        : computeScenePosition(body, jdRef.current, scaleMode, bodyById);
      const scenePos = new THREE.Vector3(
        scenePosRaw.x,
        scenePosRaw.z,
        scenePosRaw.y,
      );
      const radius = radiusToSceneUnits(body.physical.radiusKm, scaleMode);
      const distance = Math.max(radius * 6, 1.4);
      const goalCamPos = scenePos
        .clone()
        .add(new THREE.Vector3(distance * 0.6, distance * 0.5, distance * 0.6));
      camera.position.lerp(goalCamPos, 0.06);
      desiredTarget.current.copy(scenePos);
    } else {
      return;
    }

    if (ctrl?.target) {
      ctrl.target.lerp(desiredTarget.current, 0.08);
      ctrl.update?.();
    } else {
      camera.lookAt(desiredTarget.current);
    }
  });

  return null;
}
