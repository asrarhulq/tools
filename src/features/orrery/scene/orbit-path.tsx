"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { sampleOrbitPath } from "../lib/kepler";
import { auToSceneUnits, moonDistanceToSceneUnits } from "../lib/scale";
import type { OrbitalElements, ScaleMode } from "../types";

interface OrbitPathProps {
  elements: OrbitalElements;
  scaleMode: ScaleMode;
  isMoon?: boolean;
  color?: string;
  opacity?: number;
}

/**
 * A closed ellipse traced through the same nonlinear radial scale as the
 * body itself (see `lib/scale.ts`), so the drawn path always passes exactly
 * through wherever the body actually renders. Built as a raw `THREE.Line`
 * via `<primitive>` rather than R3F's `<line>` JSX intrinsic, which is
 * ambiguous with the DOM `<line>` SVG element in a `.tsx` file.
 */
export function OrbitPath({
  elements,
  scaleMode,
  isMoon = false,
  color = "#5a6b8f",
  opacity = 0.35,
}: OrbitPathProps) {
  const lineObject = useMemo(() => {
    const raw = sampleOrbitPath(elements, 180);
    const points = raw.map((p) => {
      const radiusAu = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
      const sceneRadius = isMoon
        ? moonDistanceToSceneUnits(radiusAu)
        : auToSceneUnits(radiusAu, scaleMode);
      const factor = radiusAu > 0 ? sceneRadius / radiusAu : 0;
      // Ecliptic (x, y, z-out-of-plane) -> three.js Y-up (x, z-out-of-plane, y).
      return new THREE.Vector3(p.x * factor, p.z * factor, p.y * factor);
    });
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
    });
    return new THREE.LineLoop(geometry, material);
  }, [elements, scaleMode, isMoon, color, opacity]);

  return <primitive object={lineObject} />;
}
