"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Download,
  Wand2,
  FileText,
  Image as ImageIcon,
  Table,
} from "lucide-react";
import { toast } from "sonner";
import { useTruss } from "../state/store";
import { useAnalysis } from "../state/use-analysis";
import type { Truss } from "../types";
import {
  Panel,
  Row,
  Field,
  NumberInput,
  Select,
  ScoreGauge,
  Pill,
} from "./primitives";
import { MATERIALS, SECTIONS } from "../lib/materials";
import { autoSize } from "../lib/optimize";
import { solveTruss } from "../lib/solver";
import { generateTrussReport } from "../lib/report";
import {
  toCSV,
  downloadText,
  downloadDataUrl,
  svgElementToString,
  svgToPng,
  sanitize,
} from "../lib/export-data";
import * as U from "../lib/units";
import { cn } from "@/lib/utils";

/** Right panel: selection editor, results, scores, diagnostics, sizing, export. */
export function ResultsPanel() {
  const store = useTruss();
  const { truss, units, selectedNode, selectedMember, loadTruss } = store;
  const { result, diagnostics } = useAnalysis();
  const [targetFoS, setTargetFoS] = useState(2);

  const errors = diagnostics.filter((d) => d.severity === "error");
  const warnings = diagnostics.filter((d) => d.severity === "warning");

  const doExport = async (kind: "pdf" | "csv" | "json" | "png" | "svg") => {
    try {
      const svg = document.querySelector<SVGSVGElement>(".truss-canvas svg");
      const svgStr = svg ? svgElementToString(svg) : null;
      if (kind === "csv")
        downloadText(
          toCSV(truss, result, units),
          "text/csv",
          `${sanitize(truss.name)}.csv`,
        );
      else if (kind === "json")
        downloadText(
          JSON.stringify(truss, null, 2),
          "application/json",
          `${sanitize(truss.name)}.json`,
        );
      else if (kind === "svg" && svgStr)
        downloadText(svgStr, "image/svg+xml", `${sanitize(truss.name)}.svg`);
      else if (kind === "png" && svg && svgStr) {
        const r = svg.getBoundingClientRect();
        const png = await svgToPng(svgStr, r.width, r.height, 3);
        downloadDataUrl(png, `${sanitize(truss.name)}.png`);
      } else if (kind === "pdf") {
        let diagram: string | null = null;
        if (svg && svgStr) {
          const r = svg.getBoundingClientRect();
          diagram = await svgToPng(svgStr, r.width, r.height, 2).catch(
            () => null,
          );
        }
        generateTrussReport(truss, result, { units, diagramImage: diagram });
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
      {/* Selection editor */}
      {selectedNode ? <NodeEditor id={selectedNode} /> : null}
      {selectedMember ? <MemberEditor id={selectedMember} /> : null}
      {!selectedNode && !selectedMember ? (
        <Panel title="Selection">
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Select a joint or member on the canvas to edit its properties.
          </p>
        </Panel>
      ) : null}

      {/* Scores */}
      <Panel title="Analysis">
        {result.stable && result.solved ? (
          <>
            <div className="mb-3 grid grid-cols-3 gap-2">
              <ScoreGauge
                label="Safety"
                value={result.safetyScore}
                color={
                  result.safetyScore >= 70
                    ? "#22c55e"
                    : result.safetyScore >= 40
                      ? "#f59e0b"
                      : "#ef4444"
                }
              />
              <ScoreGauge
                label="Efficiency"
                value={result.efficiencyScore}
                color="#6366f1"
              />
              <ScoreGauge
                label="FoS"
                value={Math.min(
                  100,
                  (Number.isFinite(result.minFoS) ? result.minFoS : 10) * 20,
                )}
                color="#0ea5e9"
              />
            </div>
            <Row
              label="Governing FoS"
              value={
                Number.isFinite(result.minFoS) ? result.minFoS.toFixed(2) : "∞"
              }
            />
            <Row
              label="Determinacy"
              value={
                result.determinacy === 0
                  ? "Determinate"
                  : result.determinacy > 0
                    ? `Indeterminate +${result.determinacy}`
                    : "Unstable"
              }
            />
            <Row
              label="Max deflection"
              value={U.fmtLength(result.maxDisplacement, units, 2)}
            />
            <Row
              label="Total mass"
              value={U.fmtMass(result.totalMass, units)}
            />
          </>
        ) : (
          <div className="flex items-start gap-2 rounded-lg bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>
              {result.stable
                ? "Add supports and loads to analyze."
                : "Structure is unstable — see diagnostics below."}
            </span>
          </div>
        )}
      </Panel>

      {/* Auto sizing */}
      <Panel title="Auto member sizing">
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
              loadTruss(autoSize(truss, targetFoS));
              toast.success(`Members sized for FoS ${targetFoS}`);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-sm font-medium text-[var(--color-primary-foreground)] [&_svg]:size-4"
          >
            <Wand2 /> Size
          </button>
        </div>
        <p className="mt-2 text-[11px] text-[var(--color-muted-foreground)]">
          Recommends the smallest cross-section per member meeting yield +
          buckling at the target factor of safety.
        </p>
      </Panel>

      {/* Diagnostics */}
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
        <ul className="max-h-52 space-y-2 overflow-y-auto">
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

      {/* Member forces table */}
      {result.solved ? (
        <Panel title="Member forces">
          <div className="max-h-64 overflow-auto">
            <table className="w-full text-[11px]">
              <thead className="sticky top-0 bg-[var(--color-surface)] text-[var(--color-muted-foreground)]">
                <tr className="text-left">
                  <th className="py-1 pr-2 font-semibold">Member</th>
                  <th className="py-1 pr-2 text-right font-semibold">Force</th>
                  <th className="py-1 text-right font-semibold">FoS</th>
                </tr>
              </thead>
              <tbody>
                {[...result.members]
                  .sort(
                    (a, b) => Math.abs(b.axialForce) - Math.abs(a.axialForce),
                  )
                  .map((m) => (
                    <tr
                      key={m.memberId}
                      className="border-t border-[var(--color-border)]"
                      onMouseEnter={() => store.selectMember(m.memberId)}
                    >
                      <td className="py-1 pr-2 font-medium">{m.memberId}</td>
                      <td
                        className="py-1 pr-2 text-right tabular-nums"
                        style={{
                          color:
                            m.state === "tension"
                              ? "#2563eb"
                              : m.state === "compression"
                                ? "#dc2626"
                                : undefined,
                        }}
                      >
                        {U.fmtForce(Math.abs(m.axialForce), units)}{" "}
                        {m.state === "tension"
                          ? "T"
                          : m.state === "compression"
                            ? "C"
                            : ""}
                      </td>
                      <td
                        className={cn(
                          "py-1 text-right tabular-nums",
                          Number.isFinite(m.factorOfSafety) &&
                            m.factorOfSafety < 1 &&
                            "font-semibold text-rose-500",
                        )}
                      >
                        {Number.isFinite(m.factorOfSafety)
                          ? m.factorOfSafety.toFixed(1)
                          : "∞"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Panel>
      ) : null}

      {/* Exports */}
      <Panel title="Export">
        <div className="grid grid-cols-2 gap-1.5">
          <ExportBtn onClick={() => doExport("pdf")} icon={<FileText />}>
            PDF report
          </ExportBtn>
          <ExportBtn onClick={() => doExport("csv")} icon={<Table />}>
            CSV data
          </ExportBtn>
          <ExportBtn onClick={() => doExport("png")} icon={<ImageIcon />}>
            PNG image
          </ExportBtn>
          <ExportBtn onClick={() => doExport("svg")} icon={<ImageIcon />}>
            SVG vector
          </ExportBtn>
          <ExportBtn onClick={() => doExport("json")} icon={<Download />}>
            JSON project
          </ExportBtn>
        </div>
      </Panel>

      {/* Compare designs */}
      <ComparePanel />

      {/* Materials reference for defaults */}
      <DefaultsEditor />
    </div>
  );
}

function ComparePanel() {
  const { units, compareSnapshot, captureCompare, clearCompare } = useTruss();
  const { result } = useAnalysis();
  const snapResult = compareSnapshot ? solveSnapshot(compareSnapshot) : null;

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
          Capture the current design as “A”, make changes, then compare against
          the live design “B”.
        </p>
      ) : (
        <table className="w-full text-[11px]">
          <thead className="text-[var(--color-muted-foreground)]">
            <tr className="text-left">
              <th className="py-1 font-semibold">Metric</th>
              <th className="py-1 text-right font-semibold">A</th>
              <th className="py-1 text-right font-semibold">B (live)</th>
            </tr>
          </thead>
          <tbody>
            <CmpRow
              label="Mass"
              a={U.fmtMass(snapResult!.totalMass, units)}
              b={U.fmtMass(result.totalMass, units)}
              better={result.totalMass <= snapResult!.totalMass}
            />
            <CmpRow
              label="Min FoS"
              a={fos(snapResult!.minFoS)}
              b={fos(result.minFoS)}
              better={result.minFoS >= snapResult!.minFoS}
            />
            <CmpRow
              label="Max defl."
              a={U.fmtLength(snapResult!.maxDisplacement, units, 2)}
              b={U.fmtLength(result.maxDisplacement, units, 2)}
              better={result.maxDisplacement <= snapResult!.maxDisplacement}
            />
            <CmpRow
              label="Efficiency"
              a={snapResult!.efficiencyScore.toFixed(0)}
              b={result.efficiencyScore.toFixed(0)}
              better={result.efficiencyScore >= snapResult!.efficiencyScore}
            />
          </tbody>
        </table>
      )}
    </Panel>
  );
}

function CmpRow({
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

function fos(v: number): string {
  return Number.isFinite(v) ? v.toFixed(2) : "∞";
}

function solveSnapshot(t: Truss) {
  return solveTruss(t);
}

function ExportBtn({
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

function NodeEditor({ id }: { id: string }) {
  const {
    truss,
    units,
    updateNode,
    setSupport,
    deleteNode,
    addLoad,
    updateLoad,
    deleteLoad,
  } = useTruss();
  const node = truss.nodes.find((n) => n.id === id);
  if (!node) return null;
  const load = truss.loads.find((l) => l.nodeId === id);
  return (
    <Panel
      title={`Joint ${id}`}
      action={
        <button
          type="button"
          onClick={() => deleteNode(id)}
          className="text-[var(--color-muted-foreground)] hover:text-rose-500"
        >
          <span className="text-xs">Delete</span>
        </button>
      }
    >
      <div className="grid grid-cols-2 gap-2">
        <Field label={`X (${U.UNIT_LABELS[units].length})`}>
          <NumberInput
            value={U.lengthFromSI(node.x, units).toFixed(1)}
            step={100}
            onChange={(e) =>
              updateNode(id, { x: U.lengthToSI(Number(e.target.value), units) })
            }
          />
        </Field>
        <Field label={`Y (${U.UNIT_LABELS[units].length})`}>
          <NumberInput
            value={U.lengthFromSI(node.y, units).toFixed(1)}
            step={100}
            onChange={(e) =>
              updateNode(id, { y: U.lengthToSI(Number(e.target.value), units) })
            }
          />
        </Field>
      </div>
      <Field label="Support" className="mt-2">
        <Select
          value={node.support}
          onChange={(e) =>
            setSupport(id, e.target.value as typeof node.support)
          }
        >
          <option value="none">Free</option>
          <option value="pin">Pin (x + y)</option>
          <option value="roller-x">Roller — horizontal (restrains y)</option>
          <option value="roller-y">Roller — vertical (restrains x)</option>
          <option value="fixed">Fixed</option>
        </Select>
      </Field>
      <div className="mt-3 border-t border-[var(--color-border)] pt-2">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-medium text-[var(--color-muted-foreground)]">
            Load at this joint
          </span>
          {load ? (
            <button
              type="button"
              onClick={() => deleteLoad(load.id)}
              className="text-[11px] text-[var(--color-muted-foreground)] hover:text-rose-500"
            >
              Remove
            </button>
          ) : (
            <button
              type="button"
              onClick={() => addLoad(id, 0, -10000)}
              className="text-[11px] font-medium text-[var(--color-primary)]"
            >
              + Add
            </button>
          )}
        </div>
        {load ? (
          <div className="grid grid-cols-2 gap-2">
            <Field label={`Fx (${U.UNIT_LABELS[units].force})`}>
              <NumberInput
                value={U.forceFromSI(load.fx, units).toFixed(0)}
                onChange={(e) =>
                  updateLoad(load.id, {
                    fx: U.forceToSI(Number(e.target.value), units),
                  })
                }
              />
            </Field>
            <Field label={`Fy (${U.UNIT_LABELS[units].force})`}>
              <NumberInput
                value={U.forceFromSI(load.fy, units).toFixed(0)}
                onChange={(e) =>
                  updateLoad(load.id, {
                    fy: U.forceToSI(Number(e.target.value), units),
                  })
                }
              />
            </Field>
          </div>
        ) : null}
      </div>
    </Panel>
  );
}

function MemberEditor({ id }: { id: string }) {
  const { truss, units, updateMember, deleteMember } = useTruss();
  const { result } = useAnalysis();
  const m = truss.members.find((x) => x.id === id);
  if (!m) return null;
  const r = result.members.find((x) => x.memberId === id);
  return (
    <Panel
      title={`Member ${id}`}
      action={
        <button
          type="button"
          onClick={() => deleteMember(id)}
          className="text-xs text-[var(--color-muted-foreground)] hover:text-rose-500"
        >
          Delete
        </button>
      }
    >
      <Row label="Connects" value={`${m.from} – ${m.to}`} />
      {r ? (
        <>
          <Row
            label="Axial force"
            value={
              <span
                style={{
                  color:
                    r.state === "tension"
                      ? "#2563eb"
                      : r.state === "compression"
                        ? "#dc2626"
                        : undefined,
                }}
              >
                {U.fmtForce(Math.abs(r.axialForce), units)}{" "}
                {r.state === "tension"
                  ? "(T)"
                  : r.state === "compression"
                    ? "(C)"
                    : ""}
              </span>
            }
          />
          <Row label="Stress" value={U.fmtStress(Math.abs(r.stress), units)} />
          <Row
            label="Factor of safety"
            value={
              Number.isFinite(r.factorOfSafety)
                ? r.factorOfSafety.toFixed(2)
                : "∞"
            }
          />
          {r.state === "compression" ? (
            <Row
              label="Buckling FoS"
              value={
                Number.isFinite(r.bucklingFoS) ? r.bucklingFoS.toFixed(2) : "∞"
              }
            />
          ) : null}
        </>
      ) : null}
      <Field label="Material" className="mt-2">
        <Select
          value={m.materialId}
          onChange={(e) => updateMember(id, { materialId: e.target.value })}
        >
          {MATERIALS.map((mat) => (
            <option key={mat.id} value={mat.id}>
              {mat.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Section" className="mt-2">
        <Select
          value={
            SECTIONS.find((s) => Math.abs(s.area - m.area) < 1e-9)?.id ?? ""
          }
          onChange={(e) => {
            const s = SECTIONS.find((x) => x.id === e.target.value);
            if (s) updateMember(id, { area: s.area });
          }}
        >
          <option value="">Custom ({U.fmtArea(m.area, units)})</option>
          {SECTIONS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </Field>
    </Panel>
  );
}

function DefaultsEditor() {
  const { truss, setDefaults } = useTruss();
  return (
    <Panel title="New-member defaults">
      <Field label="Default material">
        <Select
          value={truss.defaultMaterialId}
          onChange={(e) => setDefaults({ materialId: e.target.value })}
        >
          {MATERIALS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Default section" className="mt-2">
        <Select
          value={
            SECTIONS.find((s) => Math.abs(s.area - truss.defaultArea) < 1e-9)
              ?.id ?? SECTIONS[3]!.id
          }
          onChange={(e) => {
            const s = SECTIONS.find((x) => x.id === e.target.value);
            if (s) setDefaults({ area: s.area });
          }}
        >
          {SECTIONS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </Field>
    </Panel>
  );
}
