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
  Group,
  Row,
  Field,
  NumberInput,
  Select,
  Pill,
} from "./primitives";
import { fosTone } from "./result-status";
import { autoSizeBeam, buildSuggestions } from "../lib/optimize";
import { solveBeam } from "../lib/solver";
import { generateBeamReport } from "../lib/report";
import * as U from "../lib/units";
import type { BeamResult, Load, UnitSystem } from "../types";

/** Inspector column: selection editor, full spec sheet, assistant, sizing, compare, diagnostics, export. */
export function ResultsPanel() {
  const { beam, units, selectedSupport, selectedLoad, loadBeam } = useBeam();
  const { result, diagnostics } = useBeamAnalysis();
  const [targetFoS, setTargetFoS] = useState(2);
  const suggestions = buildSuggestions(beam, result);
  const errors = diagnostics.filter((d) => d.severity === "error");
  const warnings = diagnostics.filter((d) => d.severity === "warning");
  const stressTone = fosTone(result.factorOfSafety);

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
    <div className="space-y-2.5">
      {selectedSupport ? <SupportEditor id={selectedSupport} /> : null}
      {selectedLoad ? <LoadEditor id={selectedLoad} /> : null}
      {!selectedSupport && !selectedLoad ? (
        <Panel title="Inspector" className="border-dashed">
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Select a support or load on the beam to edit its properties here.
          </p>
        </Panel>
      ) : null}

      {result.solved ? (
        <Panel title="Full results" flush>
          <div className="px-3.5 pb-3">
            <Row
              label="Max bending stress"
              value={U.fmtStress(result.maxBendingStress, units)}
              tone={stressTone}
            />
            <Row
              label="Max von Mises"
              value={U.fmtStress(result.maxVonMises, units)}
              tone={stressTone}
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
            <Row
              label="Est. material cost"
              value={`$${result.cost.toFixed(2)}`}
            />
          </div>
          <div className="border-t border-[var(--color-hair)] px-3.5 pt-2.5 pb-3">
            <p className="microlabel mb-1.5">Reactions</p>
            {result.reactions.length ? (
              result.reactions.map((r) => (
                <Row
                  key={r.supportId}
                  label={`at ${U.fmtLength(r.x, units)}`}
                  value={`${U.fmtForce(r.Fy, units)}${Math.abs(r.M) > 1 ? ` · ${U.fmtMoment(r.M, units)}` : ""}`}
                />
              ))
            ) : (
              <p className="text-xs text-[var(--color-muted-foreground)]">
                No reactions computed yet.
              </p>
            )}
          </div>
        </Panel>
      ) : null}

      <Group
        title="Engineering assistant"
        action={<Lightbulb className="size-3.5 text-[var(--color-primary)]" />}
      >
        <ul className="space-y-2">
          {suggestions.map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-xs">
              {s.kind === "warning" ? (
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-[var(--color-warn)]" />
              ) : s.kind === "success" ? (
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-[var(--color-ok)]" />
              ) : (
                <Info className="mt-0.5 size-3.5 shrink-0 text-[var(--color-primary)]" />
              )}
              <span className="text-[var(--color-muted-foreground)]">
                {s.text}
              </span>
            </li>
          ))}
        </ul>
      </Group>

      <Group title="Auto beam sizing" defaultOpen={false}>
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
            className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3 py-2 text-sm font-medium text-[var(--color-primary-foreground)] [&_svg]:size-4"
          >
            <Wand2 /> Size
          </button>
        </div>
        <p className="mt-2 text-[11px] text-[var(--color-muted-foreground)]">
          Scales the cross-section to the lightest size that meets the target
          factor of safety.
        </p>
      </Group>

      <ComparePanel />

      <Group
        title="Diagnostics"
        defaultOpen={errors.length > 0 || warnings.length > 0}
        action={
          <Pill tone={errors.length ? "crit" : warnings.length ? "warn" : "ok"}>
            {errors.length
              ? `${errors.length} error${errors.length === 1 ? "" : "s"}`
              : warnings.length
                ? `${warnings.length} warning${warnings.length === 1 ? "" : "s"}`
                : "All clear"}
          </Pill>
        }
      >
        <ul className="max-h-44 space-y-2 overflow-y-auto">
          {diagnostics.length === 0 ? (
            <li className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
              <CheckCircle2 className="size-4 text-[var(--color-ok)]" /> No
              issues detected.
            </li>
          ) : (
            diagnostics.map((d, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-xs text-[var(--color-muted-foreground)]"
              >
                {d.severity === "error" ? (
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-[var(--color-crit)]" />
                ) : d.severity === "warning" ? (
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-[var(--color-warn)]" />
                ) : (
                  <Info className="mt-0.5 size-3.5 shrink-0 text-[var(--color-primary)]" />
                )}
                <span>{d.message}</span>
              </li>
            ))
          )}
        </ul>
      </Group>

      <Panel title="Export" flush>
        <div className="grid grid-cols-2 gap-1.5 px-3.5 pb-3.5">
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
    <Group
      title="Compare designs"
      defaultOpen={!!compareSnapshot}
      action={
        compareSnapshot ? (
          <button
            type="button"
            onClick={clearCompare}
            className="text-[11px] text-[var(--color-muted-foreground)] hover:text-[var(--color-crit)]"
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
    </Group>
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
    <tr className="border-t border-[var(--color-hair)]">
      <td className="py-1">{label}</td>
      <td className="readout py-1 text-right text-[var(--color-muted-foreground)]">
        {a}
      </td>
      <td
        className="readout py-1 text-right font-medium"
        style={{
          color: better ? "var(--color-ok)" : "var(--color-crit)",
        }}
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
