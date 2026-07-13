"use client";

import { useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type {
  FeaResult,
  GeometryResult,
  RawMesh,
  StabilityResult,
  Force,
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
} from "./overlays";
import { length } from "../lib/vec";

/**
 * The model group. Renders the *oriented* mesh in place (its lowest point at
 * z = 0, matching the build plate), hosts all overlays, animates the predicted
 * tip-over about the real pivot edge when the part is unstable, and routes
 * surface clicks back up (for placing forces). Coordinates are Z-up world space,
 * identical to the analysis — so no offset translation is needed.
 */
export function ModelScene({
  mesh,
  geometry,
  fea,
  stability,
  forces,
  options,
  onSurfaceClick,
}: {
  mesh: RawMesh;
  geometry: GeometryResult;
  fea: FeaResult | null;
  stability: StabilityResult | null;
  forces: readonly Force[];
  options: ViewerOptions;
  onSurfaceClick?: (point: Vec3) => void;
}) {
  const pivotRef = useRef<THREE.Group>(null);
  const bboxDiagonal = length(geometry.boundingBox.size) || 1;

  // Tip-over animation: rotate the part about its actual pivot edge when the
  // stability model predicts overturning. The pivot group is placed on the edge
  // midpoint; we rotate it about the axis perpendicular to the tip direction.
  useFrame((state) => {
    const g = pivotRef.current;
    if (!g) return;
    const tipping =
      stability?.willTip &&
      stability.pivotEdge != null &&
      (options.showForces ?? true);

    if (tipping && stability?.pivotEdge && stability.tipDirection) {
      // Rotation axis = edge direction (in XY), rotate toward the tip direction.
      const [a, b] = stability.pivotEdge;
      const ex = b[0] - a[0],
        ey = b[1] - a[1];
      const elen = Math.hypot(ex, ey) || 1;
      const axis = new THREE.Vector3(ex / elen, ey / elen, 0);
      // Oscillate a small "teetering" motion to illustrate the tip direction.
      const angle =
        (Math.sin(state.clock.elapsedTime * 1.6) * 0.5 + 0.5) * 0.28;
      g.setRotationFromAxisAngle(axis, angle);
    } else {
      g.quaternion.slerp(new THREE.Quaternion(), 0.1);
    }
  });

  function handleClick(event: ThreeEvent<MouseEvent>) {
    if (!onSurfaceClick) return;
    event.stopPropagation();
    const p = event.point;
    onSurfaceClick([p.x, p.y, p.z]);
  }

  // Pivot pose: put the group origin on the pivot-edge midpoint so rotation
  // teeters about that edge; children are drawn relative to it.
  const pivot = stability?.pivot ?? [0, 0, 0];

  return (
    <group>
      <group ref={pivotRef} position={[pivot[0], pivot[1], pivot[2]]}>
        <group
          position={[-pivot[0], -pivot[1], -pivot[2]]}
          onClick={handleClick}
        >
          <StlMesh
            mesh={mesh}
            geometry={geometry}
            fea={fea}
            options={options}
          />

          {options.showCoM ? (
            <CoMMarker point={geometry.centerOfMass} diag={bboxDiagonal} />
          ) : null}
          {options.showPrincipalAxes ? (
            <PrincipalAxes geometry={geometry} />
          ) : null}
          {options.showForces ? (
            <ForceArrows forces={forces} bboxDiagonal={bboxDiagonal} />
          ) : null}
          {options.showStress && fea ? (
            <StressMarkers fea={fea} diag={bboxDiagonal} />
          ) : null}
          <DimensionLabels geometry={geometry} />
        </group>
      </group>

      {options.showForces && stability ? (
        <PivotMarker stability={stability} />
      ) : null}
    </group>
  );
}
