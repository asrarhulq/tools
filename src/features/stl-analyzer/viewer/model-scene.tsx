"use client";

import { useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type {
  FeaResult,
  GeometryResult,
  RawMesh,
  StabilityResult,
  Force,
  Support,
  Vec3,
} from "../types";
import type { ViewerOptions } from "../state/viewer-options";
import { StlMesh } from "./stl-mesh";
import {
  CoMMarker,
  DimensionLabels,
  ForceArrows,
  PivotMarker,
  PrincipalAxes,
  StressMarkers,
  SupportMarkers,
} from "./overlays";
import { length } from "../lib/vec";

/**
 * The model group. Centers geometry at the origin, hosts all overlays, applies
 * the tipping animation when the stability model predicts overturning, and
 * routes surface clicks back up (for placing forces/supports).
 */
export function ModelScene({
  mesh,
  geometry,
  fea,
  stability,
  forces,
  supports,
  options,
  onSurfaceClick,
}: {
  mesh: RawMesh;
  geometry: GeometryResult;
  fea: FeaResult | null;
  stability: StabilityResult | null;
  forces: readonly Force[];
  supports: readonly Support[];
  options: ViewerOptions;
  onSurfaceClick?: (point: Vec3) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const bboxDiagonal = length(geometry.boundingBox.size) || 1;

  // Recenter the whole group so the model's bbox center sits at the origin.
  const offset = useMemo<Vec3>(() => {
    const c = geometry.boundingBox.center;
    return [-c[0], -c[1], -c[2]];
  }, [geometry.boundingBox.center]);

  // Tipping animation: rotate about the pivot when unstable.
  useFrame((state) => {
    const g = groupRef.current;
    if (!g) return;
    const tipping = stability?.willTip && (options.showForces ?? true);
    const target = tipping ? 0.5 : 0;
    // Ease the current rotation toward the target tip angle.
    g.rotation.z = THREE.MathUtils.lerp(
      g.rotation.z,
      tipping ? Math.sin(state.clock.elapsedTime * 2) * 0.15 + target : 0,
      0.06,
    );
  });

  function handleClick(event: ThreeEvent<MouseEvent>) {
    if (!onSurfaceClick) return;
    event.stopPropagation();
    // Convert the hit point back to model space (undo the centering offset).
    const p = event.point;
    onSurfaceClick([p.x - offset[0], p.y - offset[1], p.z - offset[2]]);
  }

  return (
    <group ref={groupRef}>
      <group position={offset} onClick={handleClick}>
        <StlMesh mesh={mesh} geometry={geometry} fea={fea} options={options} />

        {options.showCoM ? <CoMMarker point={geometry.centerOfMass} /> : null}
        {options.showPrincipalAxes ? (
          <PrincipalAxes geometry={geometry} />
        ) : null}
        {options.showForces ? (
          <ForceArrows forces={forces} bboxDiagonal={bboxDiagonal} />
        ) : null}
        <SupportMarkers supports={supports} />
        {options.showStress && fea ? <StressMarkers fea={fea} /> : null}
        {options.showForces && stability ? (
          <PivotMarker stability={stability} />
        ) : null}
        <DimensionLabels geometry={geometry} />
      </group>
    </group>
  );
}
