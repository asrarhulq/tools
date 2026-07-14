"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Wand2,
  FileText,
  Table,
  Image as ImageIcon,
  Download,
  Lightbulb,
} from "lucide-react";
import { toast } from "sonner";
import { useBeam } from "../state/store";
import { useBeamAnalysis } from "../state/use-analysis";
import {
  Panel,
  Row,
  Field,
  NumberInput,
  Select,
  Stat,
  Pill,
} from "./primitives";
import { autoSizeBeam, buildSuggestions } from "../lib/optimize";
import { solveBeam } from "../lib/solver";
import { generateBeamReport } from "../lib/report";
import * as U from "../lib/units";
import type { BeamResult, Load, UnitSystem } from "../types";
import { cn } from "@/lib/utils";

/** Right panel: selection editor, results/scores, suggestions, sizing, compare, export, diagnostics. */
export function ResultsPanel() {
  const { beam, units, selectedSupport, selectedLoad, loadBeam } = useBeam();
  const { result, diagnostics } = useBeamAnalysis();
  const [targetFoS, setTargetFoS] = useState(2);
  const suggestions = buildSuggestions(beam, result);
  const errors = diagnostics.filter((d) => d.severity === "error");
  const warnings = diagnostics.filter((d) => d.severity === "warning");

  const fosColor =
    result.factorOfSafety >= 2
      ? "#22c55e"
      : result.factorOfSafety >= 1
        ? "#f59e0b"
        : "#ef4444";

  const doExport = async (kind: "pdf" | "csv" | "json" | "png") => {
    try {
      if (kind === "json") {
        dl(
          JSON.stringify(beam, null, 2),
          "application/json",
          `${sane(beam.name)}.json`,
        );
      } else if (kind === "csv") {
        dl(toCSV(result), "text/csv", `${sane(beam.name)}.csv`);
      } else if (kind === "png" || kind === "pdf") {
        const svg = document.querySelector<SVGSVGElement>(".beam-canvas svg");
        const img = svg ? await svgToPng(svg) : null;
        if (kind === "png" && img) {
          const a = document.createElement("a");
          a.href = img;
          a.download = `${sane(beam.name)}.png`;
          a.click();
        } else if (kind === "pdf") {
          generateBeamReport(beam, result, {
            units,
            beamDiagram: img,
            shearDiagram: null,
            momentDiagram: null,
            deflectionDiagram: null,
            projectName: beam.name,
          });
        }
      }
      toast.success("Export ready");
    } catch (e) {
      toast.error("Export failed", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  };

  return (
    <div className="space-y-3">
      {selectedSupport ? <SupportEditor id={selectedSupport} /> : null}
      {selectedLoad ? <LoadEditor id={selectedLoad} /> : null}
      {!selectedSupport && !selectedLoad ? (
        <Panel title="Selection">
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Select a support or load on the canvas to edit it.
          </p>
        </Panel>
      ) : null}

      <Panel title="Results">
        {result.solved ? (
          <>
            <div className="mb-3 grid grid-cols-2 gap-2">
              <Stat
                label="Max moment"
                value={U.fmtMoment(result.maxMoment, units).split(" ")[0]}
                unit={U.UNIT_LABELS[units].moment}
                accent="#8b5cf6"
              />
              <Stat
                label="Max shear"
                value={U.fmtForce(result.maxShear, units).split(" ")[0]}
                unit={U.UNIT_LABELS[units].force}
                accent="#0ea5e9"
              />
              <Stat
                label="Max deflection"
                value={
                  U.fmtSmallLength(
                    Math.abs(result.maxDeflection),
                    units,
                    1,
                  ).split(" ")[0]
                }
                unit={U.UNIT_LABELS[units].smallLen}
                accent="#f59e0b"
              />
              <Stat
                label="Factor of safety"
                value={
                  Number.isFinite(result.factorOfSafety)
                    ? result.factorOfSafety.toFixed(2)
                    : "∞"
                }
                accent={fosColor}
              />
            </div>
            <Row
              label="Max bending stress"
              value={U.fmtStress(result.maxBendingStress, units)}
            />
            <Row
              label="Max von Mises"
              value={U.fmtStress(result.maxVonMises, units)}
            />
            <Row
              label="Buckling load"
              value={U.fmtForce(result.bucklingLoad, units)}
            />
            <Row
              label="Natural frequency"
              value={U.fmtFreq(result.naturalFrequency)}
            />
            <Row label="Beam mass" value={U.fmtMass(result.mass, units)} />
            <Row label="Est. cost" value={`$${result.cost.toFixed(2)}`} />
          </>
        ) : (
          <div className="flex items-start gap-2 rounded-lg bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>
              {result.stable
                ? "Add supports and a load to analyze."
                : "Beam is unstable — see diagnostics."}
            </span>
          </div>
        )}
      </Panel>

      <Panel title="Reactions">
        {result.solved && result.reactions.length ? (
          result.reactions.map((r) => (
            <Row
              key={r.supportId}
              label={`@ ${U.fmtLength(r.x, units)}`}
              value={`${U.fmtForce(r.Fy, units)}${Math.abs(r.M) > 1 ? ` · ${U.fmtMoment(r.M, units)}` : ""}`}
            />
          ))
        ) : (
          <p className="text-xs text-[var(--color-muted-foreground)]">
            No reactions yet.
          </p>
        )}
      </Panel>

      <Panel
        title="Engineering assistant"
        action={<Lightbulb className="size-4 text-[var(--color-primary)]" />}
      >
        <ul className="space-y-2">
          {suggestions.map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-xs">
              {s.kind === "warning" ? (
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
              ) : s.kind === "success" ? (
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
              ) : (
                <Info className="mt-0.5 size-3.5 shrink-0 text-sky-500" />
              )}
              <span className="text-[var(--color-muted-foreground)]">
                {s.text}
              </span>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Auto beam sizing">
        <div className="flex items-end gap-2">
          <Field label="Target FoS" className="flex-1">
            <NumberInput
              value={targetFoS}
              min={1}
              step={0.5}
              onChange={(e) =>
                setTargetFoS(Math.max(1, Number(e.target.value)))
              }
            />
          </Field>
          <button
            type="button"
            onClick={() => {
              loadBeam(autoSizeBeam(beam, targetFoS));
              toast.success(`Section sized for FoS ${targetFoS}`);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-sm font-medium text-[var(--color-primary-foreground)] [&_svg]:size-4"
          >
            <Wand2 /> Size
          </button>
        </div>
        <p className="mt-2 text-[11px] text-[var(--color-muted-foreground)]">
          Scales the cross-section to the lightest size meeting the target
          factor of safety.
        </p>
      </Panel>

      <ComparePanel />

      <Panel
        title="Diagnostics"
        action={
          <Pill
            color={
              errors.length
                ? "#ef4444"
                : warnings.length
                  ? "#f59e0b"
                  : "#22c55e"
            }
          >
            {errors.length
              ? `${errors.length} error${errors.length === 1 ? "" : "s"}`
              : warnings.length
                ? `${warnings.length} warning${warnings.length === 1 ? "" : "s"}`
                : "OK"}
          </Pill>
        }
      >
        <ul className="max-h-44 space-y-2 overflow-y-auto">
          {diagnostics.length === 0 ? (
            <li className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
              <CheckCircle2 className="size-4 text-emerald-500" /> No issues.
            </li>
          ) : (
            diagnostics.map((d, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-xs text-[var(--color-muted-foreground)]"
              >
                {d.severity === "error" ? (
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-rose-500" />
                ) : d.severity === "warning" ? (
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
                ) : (
                  <Info className="mt-0.5 size-3.5 shrink-0 text-sky-500" />
                )}
                <span>{d.message}</span>
              </li>
            ))
          )}
        </ul>
      </Panel>

      <Panel title="Export">
        <div className="grid grid-cols-2 gap-1.5">
          <ExpBtn onClick={() => doExport("pdf")} icon={<FileText />}>
            PDF report
          </ExpBtn>
          <ExpBtn onClick={() => doExport("csv")} icon={<Table />}>
            CSV data
          </ExpBtn>
          <ExpBtn onClick={() => doExport("png")} icon={<ImageIcon />}>
            PNG image
          </ExpBtn>
          <ExpBtn onClick={() => doExport("json")} icon={<Download />}>
            JSON project
          </ExpBtn>
        </div>
      </Panel>
    </div>
  );
}

function ExpBtn({
  onClick,
  icon,
  children,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center gap-1.5 rounded-lg border border-[var(--color-border)] px-2 py-1.5 text-xs font-medium hover:bg-[var(--color-muted)] [&_svg]:size-3.5"
    >
      {icon}
      {children}
    </button>
  );
}

function SupportEditor({ id }: { id: string }) {
  const { beam, units, updateSupport, deleteSupport } = useBeam();
  const s = beam.supports.find((x) => x.id === id);
  if (!s) return null;
  return (
    <Panel
      title="Support"
      action={
        <button
          type="button"
          onClick={() => deleteSupport(id)}
          className="text-xs text-[var(--color-muted-foreground)] hover:text-rose-500"
        >
          Delete
        </button>
      }
    >
      <Field label="Type">
        <Select
          value={s.type}
          onChange={(e) =>
            updateSupport(id, { type: e.target.value as typeof s.type })
          }
        >
          <option value="pin">Pin</option>
          <option value="roller">Roller</option>
          <option value="fixed">Fixed</option>
          <option value="spring">Spring</option>
        </Select>
      </Field>
      <Field label={`Position (${U.UNIT_LABELS[units].len})`} className="mt-2">
        <NumberInput
          value={U.lengthFromSI(s.x, units).toFixed(2)}
          step={0.25}
          onChange={(e) =>
            updateSupport(id, {
              x: U.lengthToSI(Number(e.target.value), units),
            })
          }
        />
      </Field>
      {s.type === "spring" ? (
        <Field label="Stiffness (kN/m)" className="mt-2">
          <NumberInput
            value={((s.springK ?? 1e6) / 1000).toFixed(0)}
            onChange={(e) =>
              updateSupport(id, { springK: Number(e.target.value) * 1000 })
            }
          />
        </Field>
      ) : null}
    </Panel>
  );
}

function LoadEditor({ id }: { id: string }) {
  const { beam, units, updateLoad, deleteLoad } = useBeam();
  const l = beam.loads.find((x) => x.id === id);
  if (!l) return null;
  const isDist =
    l.type === "udl" || l.type === "triangular" || l.type === "trapezoidal";
  return (
    <Panel
      title="Load"
      action={
        <button
          type="button"
          onClick={() => deleteLoad(id)}
          className="text-xs text-[var(--color-muted-foreground)] hover:text-rose-500"
        >
          Delete
        </button>
      }
    >
      <Field label="Type">
        <Select
          value={l.type}
          onChange={(e) =>
            updateLoad(id, { type: e.target.value as Load["type"] })
          }
        >
          <option value="point">Point load</option>
          <option value="moment">Moment</option>
          <option value="udl">UDL</option>
          <option value="triangular">Triangular</option>
          <option value="trapezoidal">Trapezoidal</option>
        </Select>
      </Field>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Field label={`Position (${U.UNIT_LABELS[units].len})`}>
          <NumberInput
            value={U.lengthFromSI(l.x, units).toFixed(2)}
            step={0.25}
            onChange={(e) =>
              updateLoad(id, { x: U.lengthToSI(Number(e.target.value), units) })
            }
          />
        </Field>
        {isDist ? (
          <Field label={`Length (${U.UNIT_LABELS[units].len})`}>
            <NumberInput
              value={U.lengthFromSI(l.length, units).toFixed(2)}
              step={0.25}
              onChange={(e) =>
                updateLoad(id, {
                  length: U.lengthToSI(Number(e.target.value), units),
                })
              }
            />
          </Field>
        ) : null}
      </div>
      <Field
        label={
          l.type === "moment"
            ? `Moment (${U.UNIT_LABELS[units].moment})`
            : isDist
              ? `Intensity (${U.UNIT_LABELS[units].dist})`
              : `Magnitude (${U.UNIT_LABELS[units].force})`
        }
        className="mt-2"
      >
        <NumberInput
          value={displayMag(l, units)}
          onChange={(e) =>
            updateLoad(id, {
              magnitude: parseMag(Number(e.target.value), l, units),
            })
          }
        />
      </Field>
      {l.type === "trapezoidal" ? (
        <Field
          label={`End intensity (${U.UNIT_LABELS[units].dist})`}
          className="mt-2"
        >
          <NumberInput
            value={((l.magnitude2 ?? l.magnitude) / 1000).toFixed(2)}
            onChange={(e) =>
              updateLoad(id, { magnitude2: Number(e.target.value) * 1000 })
            }
          />
        </Field>
      ) : null}
      <p className="mt-2 text-[11px] text-[var(--color-muted-foreground)]">
        Negative = downward. Positive moment = counter-clockwise.
      </p>
    </Panel>
  );
}

function ComparePanel() {
  const { units, compareSnapshot, captureCompare, clearCompare } = useBeam();
  const { result } = useBeamAnalysis();
  const snap = compareSnapshot ? solveBeam(compareSnapshot) : null;
  return (
    <Panel
      title="Compare designs"
      action={
        compareSnapshot ? (
          <button
            type="button"
            onClick={clearCompare}
            className="text-[11px] text-[var(--color-muted-foreground)] hover:text-rose-500"
          >
            Clear
          </button>
        ) : (
          <button
            type="button"
            onClick={captureCompare}
            className="text-[11px] font-medium text-[var(--color-primary)]"
          >
            Snapshot A
          </button>
        )
      }
    >
      {!compareSnapshot ? (
        <p className="text-[11px] text-[var(--color-muted-foreground)]">
          Snapshot the current design as “A”, change it, then compare against
          live “B”.
        </p>
      ) : (
        <table className="w-full text-[11px]">
          <thead className="text-[var(--color-muted-foreground)]">
            <tr className="text-left">
              <th className="py-1 font-semibold">Metric</th>
              <th className="py-1 text-right font-semibold">A</th>
              <th className="py-1 text-right font-semibold">B</th>
            </tr>
          </thead>
          <tbody>
            <Cmp
              label="Mass"
              a={U.fmtMass(snap!.mass, units)}
              b={U.fmtMass(result.mass, units)}
              better={result.mass <= snap!.mass}
            />
            <Cmp
              label="Max stress"
              a={U.fmtStress(snap!.maxVonMises, units)}
              b={U.fmtStress(result.maxVonMises, units)}
              better={result.maxVonMises <= snap!.maxVonMises}
            />
            <Cmp
              label="Max defl."
              a={U.fmtSmallLength(Math.abs(snap!.maxDeflection), units, 1)}
              b={U.fmtSmallLength(Math.abs(result.maxDeflection), units, 1)}
              better={
                Math.abs(result.maxDeflection) <= Math.abs(snap!.maxDeflection)
              }
            />
            <Cmp
              label="FoS"
              a={fmtFoS(snap!.factorOfSafety)}
              b={fmtFoS(result.factorOfSafety)}
              better={result.factorOfSafety >= snap!.factorOfSafety}
            />
          </tbody>
        </table>
      )}
    </Panel>
  );
}
function Cmp({
  label,
  a,
  b,
  better,
}: {
  label: string;
  a: string;
  b: string;
  better: boolean;
}) {
  return (
    <tr className="border-t border-[var(--color-border)]">
      <td className="py-1">{label}</td>
      <td className="py-1 text-right text-[var(--color-muted-foreground)] tabular-nums">
        {a}
      </td>
      <td
        className={cn(
          "py-1 text-right font-medium tabular-nums",
          better ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500",
        )}
      >
        {b}
      </td>
    </tr>
  );
}

// ── helpers ────────────────────────────────────────────────────────────────
function fmtFoS(v: number): string {
  return Number.isFinite(v) ? v.toFixed(2) : "∞";
}
function displayMag(l: Load, u: UnitSystem): string {
  if (l.type === "moment") return U.forceFromSI(l.magnitude, u).toFixed(1); // treat as N·m→kN·m-ish via force scale
  if (l.type === "point") return U.forceFromSI(l.magnitude, u).toFixed(2);
  return (l.magnitude / 1000).toFixed(2); // distributed kN/m
}
function parseMag(v: number, l: Load, u: UnitSystem): number {
  if (l.type === "point" || l.type === "moment") return U.forceToSI(v, u);
  return v * 1000;
}
function sane(name: string): string {
  return name.replace(/[^a-z0-9]+/gi, "-") || "beam";
}
function dl(content: string, mime: string, filename: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function toCSV(result: BeamResult): string {
  const rows: string[] = [
    "x (m),shear (N),moment (N·m),deflection (m),bendingStress (Pa)",
  ];
  const d = result.shear;
  for (let i = 0; i < d.x.length; i++) {
    rows.push(
      [
        d.x[i]!.toFixed(3),
        (result.shear.y[i] ?? 0).toFixed(1),
        (result.moment.y[i] ?? 0).toFixed(1),
        (result.deflection.y[i] ?? 0).toExponential(4),
        (result.bendingStress.y[i] ?? 0).toFixed(0),
      ].join(","),
    );
  }
  return rows.join("\n");
}
async function svgToPng(svg: SVGSVGElement): Promise<string> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const str = new XMLSerializer().serializeToString(clone);
  const rect = svg.getBoundingClientRect();
  return new Promise((resolve, reject) => {
    const blob = new Blob([str], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = rect.width * 2;
      c.height = rect.height * 2;
      const ctx = c.getContext("2d");
      if (!ctx) {
        reject(new Error("no ctx"));
        return;
      }
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/png"));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("render failed"));
    };
    img.src = url;
  });
}
