"use client";

import { ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react";
import { useBeam } from "../state/store";
import { useBeamAnalysis } from "../state/use-analysis";
import { Readout } from "./primitives";
import { fosTone, deflectionTone } from "./result-status";
import * as U from "../lib/units";

/**
 * The results HUD — the summary that reads before any detail. A verdict chip
 * (pass / marginal / fail, colored by factor of safety) leads, followed by the
 * four numbers an engineer checks first: FoS, peak moment, peak shear, and
 * peak deflection. Everything else lives in the inspector below.
 */
export function ResultHud() {
  const { beam, units } = useBeam();
  const { result } = useBeamAnalysis();

  if (!result.solved) {
    return (
      <div className="flex items-center gap-2.5 rounded-[var(--radius)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-muted-foreground)]">
        <ShieldQuestion className="size-4 shrink-0" />
        {result.stable
          ? "Add supports and a load to run the analysis."
          : "The beam is a mechanism (under-constrained) — add or fix a support."}
      </div>
    );
  }

  const fos = result.factorOfSafety;
  const tone = fosTone(fos);
  const verdict =
    tone === "ok" ? "Pass" : tone === "warn" ? "Marginal" : "Fails";
  const VerdictIcon = tone === "ok" ? ShieldCheck : ShieldAlert;
  const dTone = deflectionTone(result, beam.length);

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      {/* Verdict cell */}
      <div
        className="relative flex flex-col justify-between overflow-hidden rounded-xl border px-3 py-2.5"
        style={{
          borderColor: `color-mix(in oklch, var(--color-${tone === "default" ? "border" : tone}) 55%, var(--color-border))`,
          backgroundColor: `color-mix(in oklch, var(--color-${tone === "default" ? "surface" : tone}) 10%, var(--color-surface-2))`,
        }}
      >
        <span className="microlabel">Verdict</span>
        <div className="mt-1 flex items-center gap-1.5">
          <VerdictIcon
            className="size-5"
            style={{
              color: `var(--color-${tone === "default" ? "foreground" : tone})`,
            }}
          />
          <span
            className="text-lg font-semibold"
            style={{
              color: `var(--color-${tone === "default" ? "foreground" : tone})`,
            }}
          >
            {verdict}
          </span>
        </div>
      </div>

      <Readout
        label="Factor of safety"
        value={Number.isFinite(fos) ? fos.toFixed(2) : "∞"}
        tone={tone}
      />
      <Readout
        label="Peak moment"
        value={U.fmtMoment(result.maxMoment, units).split(" ")[0]}
        unit={U.UNIT_LABELS[units].moment}
      />
      <Readout
        label="Peak shear"
        value={U.fmtForce(result.maxShear, units).split(" ")[0]}
        unit={U.UNIT_LABELS[units].force}
      />
      <Readout
        label="Peak deflection"
        value={
          U.fmtSmallLength(Math.abs(result.maxDeflection), units, 1).split(
            " ",
          )[0]
        }
        unit={U.UNIT_LABELS[units].smallLen}
        tone={dTone}
      />
    </div>
  );
}
