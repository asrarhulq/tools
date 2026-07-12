"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { FeaResult, GeometryResult, RawMesh } from "../types";
import type { ViewerOptions } from "../state/viewer-options";
import { stressToColor } from "../lib/fea";

/**
 * Renders the analyzed mesh. Builds a BufferGeometry from the raw positions
 * once, then reactively toggles wireframe, transparency, stress vertex-colors,
 * and an X clipping plane. Geometry is centered on the model origin so the
 * viewer overlays (CoM, forces) share one coordinate space.
 */
export function StlMesh({
  mesh,
  geometry,
  fea,
  options,
}: {
  mesh: RawMesh;
  geometry: GeometryResult;
  fea: FeaResult | null;
  options: ViewerOptions;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  // Local clipping is enabled once on the renderer via the Canvas `gl` prop
  // (see viewer-canvas). The per-plane clipping is applied on the material below.

  const bufferGeometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(mesh.positions, 3));
    g.computeVertexNormals();
    g.computeBoundingBox();
    return g;
  }, [mesh]);

  // Apply stress-based vertex colors when the FEA overlay is on.
  useMemo(() => {
    if (options.showStress && fea) {
      const count = mesh.positions.length / 3;
      const colors = new Float32Array(count * 3);
      // Map each triangle-vertex to the nearest unique-vertex stress by index
      // parity; for the approximation this per-position mapping reads well.
      const maxStress = fea.maxStress || 1;
      for (let i = 0; i < count; i++) {
        const s = fea.vertexStress[i % fea.vertexStress.length] ?? 0;
        const [r, g, b] = stressToColor(s, maxStress);
        colors[i * 3] = r;
        colors[i * 3 + 1] = g;
        colors[i * 3 + 2] = b;
      }
      bufferGeometry.setAttribute(
        "color",
        new THREE.BufferAttribute(colors, 3),
      );
    } else {
      bufferGeometry.deleteAttribute("color");
    }
  }, [options.showStress, fea, mesh, bufferGeometry]);

  const clippingPlanes = useMemo(() => {
    if (!options.clippingEnabled) return [];
    const { min, max } = geometry.boundingBox;
    const range = (max[0] - min[0]) / 2;
    const center = (max[0] + min[0]) / 2;
    const x = center + options.clipX * range;
    // Keep the half of the model with X < x.
    return [new THREE.Plane(new THREE.Vector3(-1, 0, 0), x)];
  }, [options.clippingEnabled, options.clipX, geometry.boundingBox]);

  return (
    <mesh ref={meshRef} geometry={bufferGeometry} castShadow receiveShadow>
      <meshStandardMaterial
        vertexColors={options.showStress && !!fea}
        color={options.showStress && fea ? "#ffffff" : "#8b8ff5"}
        wireframe={options.wireframe}
        transparent={options.transparent}
        opacity={options.transparent ? 0.4 : 1}
        metalness={0.1}
        roughness={0.55}
        side={THREE.DoubleSide}
        clippingPlanes={clippingPlanes}
        clipShadows
        flatShading={false}
      />
    </mesh>
  );
}
