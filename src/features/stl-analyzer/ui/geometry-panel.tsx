"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useAnalyzer } from "../state/analyzer-context";
import {
  DataRow,
  PanelCard,
  ScoreMeter,
  StatTile,
  StatusPill,
} from "./primitives";
import {
  formatArea,
  formatLength,
  formatVolume,
} from "../lib/units";

/** Geometry analysis panel: dimensions, mass properties, mesh + diagnostics. */
export function GeometryPanel() {
  const { geometry, unit } = useAnalyzer();
  if (!geometry) return null;

  const { boundingBox, diagnostics, quality } = geometry;
  const com = geometry.centerOfMass;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile
          label="Volume"
          value={formatVolume(geometry.volume, unit).split(" ")[0]}
          unit={`${unit}³`}
        />
        <StatTile
          label="Surface area"
          value={formatArea(geometry.surfaceArea, unit).split(" ")[0]}
          unit={`${unit}²`}
        />
        <StatTile
          label="Triangles"
          value={quality.triangleCount.toLocaleString()}
        />
      </div>

      <PanelCard title="Bounding box" description="Overall dimensions">
        <DataRow label="Width (X)" value={formatLength(boundingBox.size[0], unit)} />
        <DataRow label="Depth (Y)" value={formatLength(boundingBox.size[1], unit)} />
        <DataRow label="Height (Z)" value={formatLength(boundingBox.size[2], unit)} />
      </PanelCard>

      <PanelCard title="Mass properties">
        <DataRow
          label="Center of mass"
          value={`${com.map((c) => c.toFixed(1)).join(", ")} mm`}
        />
        <DataRow
          label="Center of gravity"
          value="= center of mass (uniform density)"
        />
        <DataRow label="Unique vertices" value={quality.uniqueVertexCount.toLocaleString()} />
        <DataRow label="Degenerate triangles" value={quality.degenerateTriangles} />
      </PanelCard>

      <PanelCard title="Diagnostics" description="Mesh integrity & printability">
        <DataRow
          label="Watertight"
          value={
            diagnostics.watertight ? (
              <StatusPill status="ok">
                <CheckCircle2 className="size-3" /> Yes
              </StatusPill>
            ) : (
              <StatusPill status="bad">
                <AlertTriangle className="size-3" /> No
              </StatusPill>
            )
          }
        />
        <DataRow
          label="Non-manifold edges"
          value={
            diagnostics.nonManifoldEdges === 0 ? (
              <StatusPill status="ok">0</StatusPill>
            ) : (
              <StatusPill status="warn">{diagnostics.nonManifoldEdges}</StatusPill>
            )
          }
        />
        <DataRow label="Holes / boundary edges" value={`${diagnostics.holes} / ${diagnostics.boundaryEdges}`} />
        <DataRow label="Min wall thickness" value={formatLength(diagnostics.minWallThickness, unit)} />
        <DataRow label="Thin features" value={diagnostics.thinFeatureCount} />
        <DataRow label="Sharp edges" value={diagnostics.sharpEdgeCount} />
        <DataRow
          label="Overhang area"
          value={`${(diagnostics.overhangArea * 100).toFixed(0)}%`}
        />
      </PanelCard>

      <PanelCard title="Scores">
        <div className="space-y-4">
          <ScoreMeter label="Printability" score={geometry.printabilityScore} />
          <ScoreMeter label="Mesh quality" score={quality.score} />
          <ScoreMeter
            label="Complexity"
            score={geometry.complexityScore}
            invert
          />
        </div>
      </PanelCard>
    </div>
  );
}
