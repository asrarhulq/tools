"use client";

import { useBiomech } from "../state/store";
import { useAnalysis } from "../state/use-analysis";
import { Card, Metric, Slider } from "./primitives";
import { assessPosture } from "../lib/analysis";
import * as U from "../lib/units";

/** Custom-body simulator: height, mass, build, load, speed — updates live. */
export function SimulatorPanel() {
  const { body, setBody, units, setUnits } = useBiomech();

  return (
    <div className="space-y-4">
      <Card
        title="Body & scenario"
        action={
          <div className="flex overflow-hidden rounded-lg border border-[var(--color-border)] text-[11px]">
            {(["si", "imperial"] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnits(u)}
                className={
                  "px-2 py-1 font-medium transition-colors " +
                  (units === u
                    ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                    : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]")
                }
              >
                {u === "si" ? "SI" : "Imperial"}
              </button>
            ))}
          </div>
        }
      >
        <div className="space-y-3.5">
          <Slider
            label="Height"
            value={body.height}
            min={1.4}
            max={2.1}
            step={0.01}
            onChange={(v) => setBody({ height: v })}
            format={(v) => U.length(v, units)}
          />
          <Slider
            label="Body mass"
            value={body.mass}
            min={40}
            max={150}
            step={1}
            onChange={(v) => setBody({ mass: v })}
            format={(v) => U.mass(v, units)}
          />
          <Slider
            label="Build"
            value={body.build}
            min={0.8}
            max={1.3}
            step={0.01}
            onChange={(v) => setBody({ build: v })}
            format={(v) => `${v.toFixed(2)}×`}
          />
          <Slider
            label="External load"
            value={body.loadKg}
            min={0}
            max={200}
            step={1}
            onChange={(v) => setBody({ loadKg: v })}
            format={(v) => U.mass(v, units)}
          />
          <Slider
            label="Movement speed"
            value={body.speed}
            min={0.5}
            max={2}
            step={0.05}
            onChange={(v) => setBody({ speed: v })}
            format={(v) => `${v.toFixed(2)}×`}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              setBody({ sex: body.sex === "male" ? "female" : "male" })
            }
            className="rounded-full border border-[var(--color-border)] px-2.5 py-1 text-xs capitalize hover:bg-[var(--color-muted)]"
          >
            Anthropometry: {body.sex}
          </button>
        </div>
      </Card>
    </div>
  );
}

/** Posture assessment for the current pose. */
export function PosturePanel() {
  const { body, units } = useBiomech();
  const { pose } = useAnalysis();
  const posture = assessPosture(pose, body);

  return (
    <div className="space-y-4">
      <Card
        title="Posture assessment"
        action={
          <span
            className="text-sm font-semibold tabular-nums"
            style={{
              color:
                posture.score >= 75
                  ? "#22c55e"
                  : posture.score >= 50
                    ? "#f59e0b"
                    : "#ef4444",
            }}
          >
            {posture.score}/100
          </span>
        }
      >
        <Metric
          label="Spinal alignment"
          value={`${posture.spinalAlignmentDeg.toFixed(0)}°`}
        />
        <Metric
          label="Neck angle"
          value={`${posture.neckAngleDeg.toFixed(0)}°`}
        />
        <Metric
          label="Shoulder symmetry"
          value={`${posture.shoulderSymmetryDeg.toFixed(1)}°`}
        />
        <Metric
          label="Hip alignment"
          value={`${posture.hipAlignmentDeg.toFixed(1)}°`}
        />
        <p className="mt-2 text-[11px] text-[var(--color-muted-foreground)]">
          Assessed in {units === "si" ? "SI" : "Imperial"} context for the
          current frame.
        </p>
      </Card>

      {posture.findings.length ? (
        <Card title="Findings">
          <ul className="space-y-1.5">
            {posture.findings.map((f, i) => (
              <li
                key={i}
                className="flex gap-2 text-xs text-[var(--color-muted-foreground)]"
              >
                <span className="text-amber-500">•</span>
                {f}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {posture.recommendations.length ? (
        <Card title="Recommendations">
          <ul className="space-y-1.5">
            {posture.recommendations.map((r, i) => (
              <li
                key={i}
                className="flex gap-2 text-xs text-[var(--color-muted-foreground)]"
              >
                <span className="text-emerald-500">✓</span>
                {r}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
