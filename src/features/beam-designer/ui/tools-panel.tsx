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
  Layers,
  Plus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useBeam, type ToolMode } from "../state/store";
import { Panel, Field, NumberInput, Select } from "./primitives";
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
    hint: "Select & drag supports/loads",
  },
  {
    id: "add-support",
    label: "Support",
    icon: Anchor,
    hint: "Click beam to add a support",
  },
  {
    id: "add-load",
    label: "Load",
    icon: ArrowDown,
    hint: "Click beam to add a point load",
  },
  {
    id: "add-hinge",
    label: "Hinge",
    icon: Split,
    hint: "Click beam to add an internal hinge",
  },
];

/** Left panel: presets, tools, beam/material/section setup, load cases, I/O. */
export function ToolsPanel() {
  const {
    beam,
    tool,
    units,
    setTool,
    loadBeam,
    setLength,
    setMaterial,
    setSection,
    canUndo,
    canRedo,
    undo,
    redo,
    activeCase,
    setActiveCase,
    addLoadCase,
    deleteLoadCase,
  } = useBeam();
  const fileRef = useRef<HTMLInputElement>(null);
  const props = sectionProps(beam.section);
  const loadCases = beam.loadCases;

  return (
    <div className="space-y-3">
      <Panel title="Tools">
        <div className="grid grid-cols-4 gap-1.5">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              type="button"
              title={t.hint}
              onClick={() => setTool(t.id)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg px-1 py-2 text-[10px] font-medium transition-colors [&_svg]:size-4",
                tool === t.id
                  ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                  : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]",
              )}
            >
              <t.icon />
              {t.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-[var(--color-muted-foreground)]">
          {TOOLS.find((t) => t.id === tool)?.hint}
        </p>
        <div className="mt-2 flex gap-1.5">
          <IconBtn label="Undo" disabled={!canUndo} onClick={undo}>
            <Undo2 />
          </IconBtn>
          <IconBtn label="Redo" disabled={!canRedo} onClick={redo}>
            <Redo2 />
          </IconBtn>
        </div>
      </Panel>

      <Panel title="Templates">
        <div className="grid grid-cols-2 gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              title={p.hint}
              onClick={() => {
                loadBeam(buildPreset(p.id));
                toast.success(`${p.label} loaded`);
              }}
              className="rounded-lg border border-[var(--color-border)] px-2 py-1.5 text-[11px] font-medium transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
            >
              {p.label}
            </button>
          ))}
        </div>
      </Panel>

      <Panel title="Beam">
        <Field label={`Length (${U.UNIT_LABELS[units].len})`}>
          <NumberInput
            value={U.lengthFromSI(beam.length, units).toFixed(2)}
            step={0.5}
            onChange={(e) =>
              setLength(U.lengthToSI(Number(e.target.value), units))
            }
          />
        </Field>
      </Panel>

      <Panel title="Material">
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
        <div className="mt-2 grid grid-cols-2 gap-x-3 text-[11px] text-[var(--color-muted-foreground)]">
          <span>E = {U.fmtStress(beam.material.E, units, 0)}</span>
          <span>σy = {U.fmtStress(beam.material.yield, units, 0)}</span>
        </div>
      </Panel>

      <Panel title="Cross-section">
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
        <div className="mt-2 grid grid-cols-2 gap-2">
          {Object.entries(SECTION_DIM_LABELS[beam.section.type]).map(
            ([key, label]) => (
              <Field key={key} label={`${label} (${U.UNIT_LABELS[units].dim})`}>
                <NumberInput
                  value={U.dimFromSI(
                    beam.section.dims[key] ?? 0,
                    units,
                  ).toFixed(1)}
                  step={1}
                  min={0.1}
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
        <div className="mt-2 space-y-0.5 rounded-lg bg-[var(--color-muted)] p-2 text-[11px] text-[var(--color-muted-foreground)]">
          <div>
            A = {(props.area * 1e6).toFixed(0)} mm² · I ={" "}
            {(props.I * 1e12).toExponential(2)} mm⁴
          </div>
          <div>
            S = {(props.S * 1e9).toFixed(0)} mm³ · r ={" "}
            {(props.r * 1000).toFixed(1)} mm
          </div>
        </div>
      </Panel>

      <Panel
        title="Load cases"
        action={
          <Layers className="size-4 text-[var(--color-muted-foreground)]" />
        }
      >
        <div className="space-y-1.5">
          {loadCases.map((c) => (
            <div
              key={c.id}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-2 py-1.5 text-xs",
                activeCase === c.id
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10"
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
                  className="text-[var(--color-muted-foreground)] hover:text-rose-500 [&_svg]:size-3.5"
                >
                  <X />
                </button>
              ) : null}
            </div>
          ))}
          <button
            type="button"
            onClick={addLoadCase}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[var(--color-border)] py-1.5 text-[11px] font-medium text-[var(--color-primary)] [&_svg]:size-3.5"
          >
            <Plus /> Add load case
          </button>
        </div>
      </Panel>

      <Panel title="Project">
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
              } else throw new Error("Invalid file");
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
      </Panel>
    </div>
  );
}

function IconBtn({
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
      className="flex size-8 items-center justify-center rounded-lg text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] disabled:opacity-40 [&_svg]:size-4"
    >
      {children}
    </button>
  );
}
