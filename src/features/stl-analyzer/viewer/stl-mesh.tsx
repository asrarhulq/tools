"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { FeaResult, GeometryResult, RawMesh } from "../types";
import type { ViewerOptions } from "../state/viewer-options";
import { stressToColor } from "../lib/colormap";

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

  // Apply the FEA result as per-vertex colors. The solver returns one stress and
  // one displacement value per render-vertex position (mapped spatially, not by
  // index), so we color each vertex directly — no modulo hack.
  useMemo(() => {
    const field =
      options.showStress && fea
        ? options.feaField === "displacement"
          ? { values: fea.vertexDisplacement, max: fea.maxDisplacement }
          : { values: fea.vertexStress, max: fea.maxStress }
        : null;

    if (field) {
      const count = mesh.positions.length / 3;
      const colors = new Float32Array(count * 3);
      const max = field.max || 1;
      for (let i = 0; i < count; i++) {
        const v = field.values[i] ?? 0;
        const [r, g, b] = stressToColor(v, max);
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
  }, [options.showStress, options.feaField, fea, mesh, bufferGeometry]);

  const clippingPlanes = useMemo(() => {
    if (!options.clippingEnabled) return [];
    const { min, max } = geometry.boundingBox;
    const range = (max[0] - min[0]) / 2;
    const center = (max[0] + min[0]) / 2;
    const x = center + options.clipX * range;
    // Keep the half of the model with X < x.
    return [new THREE.Plane(new THREE.Vector3(-1, 0, 0), x)];
  }, [options.clippingEnabled, options.clipX, geometry.boundingBox]);

  const showField = options.showStress && !!fea;

  return (
    <mesh ref={meshRef} geometry={bufferGeometry} castShadow receiveShadow>
      <meshStandardMaterial
        vertexColors={showField}
        color={showField ? "#ffffff" : "#9aa2ff"}
        wireframe={options.wireframe}
        transparent={options.transparent}
        opacity={options.transparent ? 0.35 : 1}
        // Field view reads truer as a matte surface; default is a soft metal.
        metalness={showField ? 0.0 : 0.25}
        roughness={showField ? 0.9 : 0.42}
        envMapIntensity={showField ? 0.2 : 0.9}
        side={THREE.DoubleSide}
        clippingPlanes={clippingPlanes}
        clipShadows
        flatShading={false}
      />
    </mesh>
  );
}
