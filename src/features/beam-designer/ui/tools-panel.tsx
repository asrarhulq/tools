"use client";

import { useRef } from "react";
import {
  MousePointer2,
  Anchor,
  ArrowDown,
  Split,
  Undo2,
  Redo2,
  FolderOpen,
  Save,
  Plus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useBeam, type ToolMode } from "../state/store";
import { Group, Field, NumberInput, Select } from "./primitives";
import { PRESETS, buildPreset } from "../lib/presets";
import {
  MATERIALS,
  SECTION_LABELS,
  SECTION_DIM_LABELS,
  sectionProps,
  defaultDims,
} from "../lib/sections";
import * as U from "../lib/units";
import type { SectionType } from "../types";
import { cn } from "@/lib/utils";

const TOOLS: Array<{
  id: ToolMode;
  label: string;
  icon: typeof MousePointer2;
  hint: string;
}> = [
  {
    id: "select",
    label: "Select",
    icon: MousePointer2,
    hint: "Select and drag supports or loads",
  },
  {
    id: "add-support",
    label: "Support",
    icon: Anchor,
    hint: "Click the beam to place a support",
  },
  {
    id: "add-load",
    label: "Load",
    icon: ArrowDown,
    hint: "Click the beam to place a point load",
  },
  {
    id: "add-hinge",
    label: "Hinge",
    icon: Split,
    hint: "Click the beam to place an internal hinge",
  },
];

/**
 * The tool dock — a slim vertical rail of the four canvas modes plus undo/redo.
 * Quiet by default; the active mode gets the accent. This is the only place the
 * accent appears in the left column, so the active tool always reads clearly.
 */
export function ToolDock() {
  const { tool, setTool, canUndo, canRedo, undo, redo } = useBeam();
  return (
    <div className="flex gap-2 lg:flex-col">
      <div className="flex gap-1 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1 lg:flex-col">
        {TOOLS.map((t) => {
          const active = tool === t.id;
          return (
            <button
              key={t.id}
              type="button"
              title={`${t.label} — ${t.hint}`}
              aria-label={t.label}
              aria-pressed={active}
              onClick={() => setTool(t.id)}
              className={cn(
                "flex size-10 items-center justify-center rounded-lg transition-colors [&_svg]:size-[18px]",
                active
                  ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-sm"
                  : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]",
              )}
            >
              <t.icon />
            </button>
          );
        })}
      </div>
      <div className="flex gap-1 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1 lg:flex-col">
        <DockBtn label="Undo" disabled={!canUndo} onClick={undo}>
          <Undo2 />
        </DockBtn>
        <DockBtn label="Redo" disabled={!canRedo} onClick={redo}>
          <Redo2 />
        </DockBtn>
      </div>
    </div>
  );
}

function DockBtn({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex size-10 items-center justify-center rounded-lg text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] disabled:opacity-30 [&_svg]:size-[18px]"
    >
      {children}
    </button>
  );
}

/**
 * The setup column — beam geometry, material, section, load cases, templates,
 * and project I/O, grouped into collapsible sections so the common controls
 * stay visible and the rest folds away (progressive disclosure).
 */
export function SetupColumn() {
  const {
    beam,
    units,
    loadBeam,
    setLength,
    setMaterial,
    setSection,
    activeCase,
    setActiveCase,
    addLoadCase,
    deleteLoadCase,
  } = useBeam();
  const fileRef = useRef<HTMLInputElement>(null);
  const props = sectionProps(beam.section);
  const loadCases = beam.loadCases;
  const activeTemplate = beam.name;

  return (
    <div className="space-y-2.5">
      <Group title="Beam & section" defaultOpen>
        <div className="space-y-3">
          <Field label={`Span length`}>
            <NumberInput
              value={U.lengthFromSI(beam.length, units).toFixed(2)}
              step={0.5}
              suffix={U.UNIT_LABELS[units].len}
              onChange={(e) =>
                setLength(U.lengthToSI(Number(e.target.value), units))
              }
            />
          </Field>

          <Field label="Material">
            <Select
              value={beam.material.id}
              onChange={(e) => {
                const m = MATERIALS.find((x) => x.id === e.target.value);
                if (m) setMaterial(m);
              }}
            >
              {MATERIALS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
            <div className="mt-1.5 flex justify-between text-[11px] text-[var(--color-muted-foreground)]">
              <span className="readout">
                E {U.fmtStress(beam.material.E, units, 0)}
              </span>
              <span className="readout">
                σy {U.fmtStress(beam.material.yield, units, 0)}
              </span>
            </div>
          </Field>

          <Field label="Cross-section">
            <Select
              value={beam.section.type}
              onChange={(e) =>
                setSection({
                  type: e.target.value as SectionType,
                  dims: defaultDims(e.target.value as SectionType),
                })
              }
            >
              {Object.entries(SECTION_LABELS).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-2">
            {Object.entries(SECTION_DIM_LABELS[beam.section.type]).map(
              ([key, label]) => (
                <Field key={key} label={label}>
                  <NumberInput
                    value={U.dimFromSI(
                      beam.section.dims[key] ?? 0,
                      units,
                    ).toFixed(1)}
                    step={1}
                    min={0.1}
                    suffix={U.UNIT_LABELS[units].dim}
                    onChange={(e) =>
                      setSection({
                        ...beam.section,
                        dims: {
                          ...beam.section.dims,
                          [key]: U.dimToSI(Number(e.target.value), units),
                        },
                      })
                    }
                  />
                </Field>
              ),
            )}
          </div>

          {/* Live section properties, styled as an instrument spec plate. */}
          <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 rounded-lg border border-[var(--color-hair)] bg-[var(--color-surface-2)] p-2.5">
            <SpecCell
              label="Area A"
              value={`${(props.area * 1e6).toFixed(0)} mm²`}
            />
            <SpecCell
              label="Inertia I"
              value={`${(props.I * 1e12).toExponential(2)} mm⁴`}
            />
            <SpecCell
              label="Modulus S"
              value={`${(props.S * 1e9).toFixed(0)} mm³`}
            />
            <SpecCell
              label="Gyration r"
              value={`${(props.r * 1000).toFixed(1)} mm`}
            />
          </dl>
        </div>
      </Group>

      <Group title="Templates" defaultOpen={false}>
        <div className="grid grid-cols-2 gap-1.5">
          {PRESETS.map((p) => {
            const active = activeTemplate === p.label;
            return (
              <button
                key={p.id}
                type="button"
                title={p.hint}
                onClick={() => {
                  loadBeam(buildPreset(p.id));
                  toast.success(`${p.label} loaded`);
                }}
                className={cn(
                  "rounded-lg border px-2 py-2 text-[11px] font-medium transition-colors",
                  active
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)]/8 text-[var(--color-primary)]"
                    : "border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:border-[var(--color-primary)]/50 hover:text-[var(--color-foreground)]",
                )}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </Group>

      <Group title="Load cases" defaultOpen={false}>
        <div className="space-y-1.5">
          {loadCases.map((c) => (
            <div
              key={c.id}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition-colors",
                activeCase === c.id
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)]/8"
                  : "border-[var(--color-border)]",
              )}
            >
              <button
                type="button"
                onClick={() => setActiveCase(c.id)}
                className="flex-1 text-left font-medium"
              >
                {c.name}
              </button>
              {loadCases.length > 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    deleteLoadCase(c.id);
                    if (activeCase === c.id) setActiveCase(loadCases[0]!.id);
                  }}
                  aria-label="Delete case"
                  className="text-[var(--color-muted-foreground)] hover:text-[var(--color-crit)] [&_svg]:size-3.5"
                >
                  <X />
                </button>
              ) : null}
            </div>
          ))}
          <button
            type="button"
            onClick={addLoadCase}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[var(--color-border)] py-1.5 text-[11px] font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary)]/6 [&_svg]:size-3.5"
          >
            <Plus /> Add load case
          </button>
        </div>
      </Group>

      <Group title="Project" defaultOpen={false}>
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            try {
              const b = JSON.parse(await f.text());
              if (b?.supports && b?.loads) {
                loadBeam(b);
                toast.success("Project loaded");
              } else throw new Error("Not a beam project file");
            } catch (err) {
              toast.error("Import failed", {
                description: err instanceof Error ? err.message : undefined,
              });
            }
            e.target.value = "";
          }}
        />
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[var(--color-border)] px-2 py-1.5 text-xs font-medium hover:bg-[var(--color-muted)] [&_svg]:size-3.5"
          >
            <FolderOpen /> Open
          </button>
          <button
            type="button"
            onClick={() => {
              const blob = new Blob([JSON.stringify(beam, null, 2)], {
                type: "application/json",
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${beam.name.replace(/[^a-z0-9]+/gi, "-")}.json`;
              a.click();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
              toast.success("Project saved");
            }}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[var(--color-border)] px-2 py-1.5 text-xs font-medium hover:bg-[var(--color-muted)] [&_svg]:size-3.5"
          >
            <Save /> Save
          </button>
        </div>
      </Group>
    </div>
  );
}

function SpecCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="microlabel truncate">{label}</dt>
      <dd className="readout mt-0.5 text-xs text-[var(--color-foreground)]">
        {value}
      </dd>
    </div>
  );
}
