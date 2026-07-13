"use client";

import { useMemo } from "react";
import { analyzeStability } from "../lib/stability";
import { analyzeFea } from "../lib/fea";
import { effectiveMaterial } from "../lib/effective-material";
import { estimatePrint, recommendPrint } from "../lib/printing";
import { reorientGeometry } from "../lib/geometry";
import { detectContact, orientPositions } from "../lib/orientation";
import { useAnalyzer } from "./analyzer-context";
import type {
  BuildPlateContact,
  EffectiveMaterial,
  FeaResult,
  GeometryResult,
  PrintEstimate,
  PrintRecommendation,
  StabilityResult,
} from "../types";

/**
 * The analysis pipeline. Everything derives from the *oriented* mesh: rotating
 * the part or dropping it to the plate re-runs mass properties, stability, and
 * FEA, so every result stays consistent with what the user sees in the viewport.
 *
 * Each stage is memoized on its real dependencies, so editing print settings
 * doesn't recompute the FEA field, and re-orienting doesn't re-weld topology.
 * Returns nulls until a model is analyzed.
 */
export function useDerivedAnalysis(): {
  orientedPositions: Float32Array | null;
  geometry: GeometryResult | null;
  contact: BuildPlateContact | null;
  effective: EffectiveMaterial | null;
  stability: StabilityResult | null;
  fea: FeaResult | null;
  print: PrintEstimate | null;
  recommendation: PrintRecommendation | null;
} {
  const {
    geometry: baseGeometry,
    mesh,
    material,
    orientation,
    constraint,
    forces,
    print,
  } = useAnalyzer();

  // Oriented triangle-soup positions (rotation + drop-to-plate).
  const orientedPositions = useMemo(
    () => (mesh ? orientPositions(mesh.positions, orientation, true) : null),
    [mesh, orientation],
  );

  // Orientation-aware geometry (COM, bbox, overhang recomputed; rest reused).
  const geometry = useMemo(
    () =>
      baseGeometry && orientedPositions
        ? reorientGeometry(baseGeometry, orientedPositions)
        : baseGeometry,
    [baseGeometry, orientedPositions],
  );

  // Build-plate contact region → default constraint + stability footprint.
  const contact = useMemo(
    () => (orientedPositions ? detectContact(orientedPositions) : null),
    [orientedPositions],
  );

  // As-printed material properties (infill/pattern/wall/anisotropy homogenized),
  // used by both the FEA solve and the strength read-outs.
  const effective = useMemo(
    () => effectiveMaterial(material, print),
    [material, print],
  );

  const stability = useMemo(
    () =>
      geometry ? analyzeStability(geometry, material, forces, contact) : null,
    [geometry, material, forces, contact],
  );

  // Full linear-elastic FEM re-solves whenever geometry (orientation), material,
  // print settings, forces, or the constraint change.
  const fea = useMemo(
    () =>
      orientedPositions && forces.length > 0
        ? analyzeFea(orientedPositions, effective, forces, constraint)
        : null,
    [orientedPositions, effective, forces, constraint],
  );

  const printEstimate = useMemo(
    () => (geometry ? estimatePrint(geometry, material, print) : null),
    [geometry, material, print],
  );

  const recommendation = useMemo(
    () => (geometry ? recommendPrint(geometry) : null),
    [geometry],
  );

  return {
    orientedPositions,
    geometry,
    contact,
    effective,
    stability,
    fea,
    print: printEstimate,
    recommendation,
  };
}
