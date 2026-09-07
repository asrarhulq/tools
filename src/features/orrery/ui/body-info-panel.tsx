"use client";

import { Download } from "lucide-react";
import { AU_KM } from "../config";
import { BODY_BY_ID } from "../data";
import {
  formatDistanceKm,
  formatMassKg,
  formatPeriod,
  formatRotation,
  lightTravelTime,
} from "../lib/format";
import { heliocentricPosition } from "../lib/kepler";
import { generateObservationReport } from "../report/observation-report";
import { useOrrery } from "../state/orrery-context";
import { Card, Metric } from "./primitives";

export function BodyInfoPanel() {
  const { selectedBodyId, displayJd, screenshotRef } = useOrrery();
  const body = selectedBodyId ? BODY_BY_ID.get(selectedBodyId) : undefined;

  if (!body) {
    return (
      <Card title="Select a body">
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Click any planet, moon, or the Sun in the viewport to see its data
          here.
        </p>
      </Card>
    );
  }

  const isStar = body.kind === "star";
  const pos = !isStar ? heliocentricPosition(body.elements, displayJd) : null;
  const distanceKm = pos ? pos.radiusAu * AU_KM : 0;
  const parent = body.parentId ? BODY_BY_ID.get(body.parentId) : undefined;

  return (
    <Card
      title={body.name}
      action={
        <span className="text-[11px] tracking-wide text-[var(--color-muted-foreground)] uppercase">
          {body.kind.replace("-", " ")}
        </span>
      }
    >
      <div className="space-y-0.5">
        {pos && (
          <>
            <Metric
              label={
                parent ? `Distance from ${parent.name}` : "Distance from Sun"
              }
              value={formatDistanceKm(distanceKm)}
            />
            {!parent && (
              <Metric
                label="Light travel time"
                value={lightTravelTime(distanceKm)}
              />
            )}
            <Metric
              label="Orbital period"
              value={formatPeriod(body.elements.periodDays)}
            />
          </>
        )}
        <Metric
          label="Radius"
          value={`${body.physical.radiusKm.toLocaleString()} km`}
          sub={
            body.id !== "earth"
              ? `${(body.physical.radiusKm / 6371).toFixed(2)}× Earth`
              : undefined
          }
        />
        <Metric label="Mass" value={formatMassKg(body.physical.massKg)} />
        <Metric
          label="Rotation period"
          value={formatRotation(body.physical.rotationHours)}
        />
        <Metric
          label="Axial tilt"
          value={`${body.physical.axialTiltDeg.toFixed(1)}°`}
        />
        <Metric
          label="Surface gravity"
          value={`${body.physical.gravityMs2.toFixed(2)} m/s²`}
          sub={`${(body.physical.gravityMs2 / 9.807).toFixed(2)}× Earth`}
        />
        <Metric
          label="Mean temperature"
          value={`${body.physical.meanTempC}°C`}
        />
        {body.physical.moonCount > 0 && (
          <Metric label="Known moons" value={body.physical.moonCount} />
        )}
      </div>
      <div className="mt-3 space-y-1.5 border-t border-[var(--color-border)] pt-3">
        {body.physical.facts.map((fact) => (
          <p
            key={fact}
            className="text-xs leading-relaxed text-[var(--color-muted-foreground)]"
          >
            {fact}
          </p>
        ))}
      </div>
      <button
        type="button"
        onClick={() =>
          generateObservationReport({
            body,
            parent,
            jd: displayJd,
            screenshotDataUrl: screenshotRef.current?.() ?? null,
          })
        }
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--color-muted)]"
      >
        <Download className="size-3.5" /> Export observation report (PDF)
      </button>
    </Card>
  );
}
