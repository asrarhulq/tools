"use client";

import { useMemo } from "react";
import { Activity, Brain, HeartPulse, Sparkles } from "lucide-react";
import { useBiomech } from "../state/store";
import { useAnalysis } from "../state/use-analysis";
import { Card, LoadBar, Metric, RiskPill } from "./primitives";
import * as U from "../lib/units";
import { bodyWeightN } from "../lib/anthropometry";

/** Live engineering + physiology read-outs for the current frame and cycle. */
export function AnalysisPanels() {
  const { units, body, activity } = useBiomech();
  const { frame, summary } = useAnalysis();
  const bw = bodyWeightN(body);

  // Freeze the assistant notes to the current movement *phase* so they don't
  // rewrite (and re-animate) on every numeric tick — they refresh when the
  // phase label changes, which reads as calm, deliberate commentary.
  const notes = useMemo(() => frame.notes, [frame.phaseLabel]); // eslint-disable-line react-hooks/exhaustive-deps

  // Round live values to a coarse step so read-outs don't jitter digit-by-digit.
  const round = (v: number, step: number) => Math.round(v / step) * step;

  return (
    <div className="space-y-4">
      {/* AI assistant notes */}
      <Card
        title="Analysis assistant"
        action={<Sparkles className="size-4 text-[var(--color-primary)]" />}
      >
        <ul className="space-y-2">
          {notes.map((n, i) => (
            <li
              key={i}
              className="flex gap-2 text-xs text-[var(--color-muted-foreground)]"
            >
              <Brain className="mt-0.5 size-3.5 shrink-0 text-[var(--color-primary)]" />
              <span>{n}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Engineering metrics */}
      <Card
        title="Engineering parameters"
        action={
          <Activity className="size-4 text-[var(--color-muted-foreground)]" />
        }
      >
        <Metric
          label="Ground reaction force"
          value={U.force(round(frame.grfN, 5), units)}
          sub={`${(frame.grfN / bw).toFixed(1)}×BW`}
        />
        <Metric
          label="Peak GRF (cycle)"
          value={U.force(summary.peakGrfN, units)}
          sub={`${summary.peakGrfBodyweights.toFixed(2)}×BW`}
        />
        <Metric
          label="L5/S1 compression"
          value={U.force(round(frame.spinalCompressionN, 10), units)}
        />
        <Metric
          label="Metabolic power"
          value={U.power(round(frame.metabolicW, 5), units)}
        />
        <Metric
          label="Energy / cycle"
          value={U.energy(summary.energyPerCycleJ, units)}
        />
        <Metric label="Cadence" value={`${summary.cadence.toFixed(0)} /min`} />
        <Metric label="CoM height" value={U.length(frame.comHeight, units)} />
      </Card>

      {/* Joint loads */}
      <Card title="Joint reaction loads">
        <div className="space-y-2.5">
          {frame.jointLoads
            .slice()
            .sort((a, b) => b.forceN - a.forceN)
            .slice(0, 6)
            .map((jl) => (
              <LoadBar
                key={jl.joint}
                label={jl.label}
                fraction={jl.loadFraction}
                value={`${U.force(jl.forceN, units)} · ${jl.bodyweights.toFixed(1)}×BW`}
              />
            ))}
        </div>
      </Card>

      {/* Muscle activation */}
      <Card title="Muscle activation">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {frame.muscles
            .slice()
            .sort((a, b) => b.activation - a.activation)
            .slice(0, 8)
            .map((m) => (
              <LoadBar
                key={m.id}
                label={m.label}
                fraction={m.activation}
                value={`${Math.round(m.activation * 100)}%`}
              />
            ))}
        </div>
      </Card>

      {/* Injury risk */}
      <Card
        title="Injury risk"
        action={
          <HeartPulse className="size-4 text-[var(--color-muted-foreground)]" />
        }
      >
        <div className="space-y-2.5">
          {frame.injuries.map((r) => (
            <div key={r.region}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium">{r.region}</span>
                <RiskPill level={r.level} />
              </div>
              <LoadBar label="" fraction={r.risk} />
              <p className="mt-1 text-[11px] text-[var(--color-muted-foreground)]">
                {r.note}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-3 rounded-lg bg-[var(--color-muted)] px-2.5 py-1.5 text-[11px] text-[var(--color-muted-foreground)]">
          Overall cycle risk:{" "}
          <strong className="capitalize">{summary.overallRisk}</strong> ·
          Movement symmetry: {summary.symmetryPct.toFixed(0)}% · Activity:{" "}
          {activity}
        </p>
      </Card>
    </div>
  );
}
