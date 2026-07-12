"use client";

import { useAnalyzer } from "../state/analyzer-context";
import { useDerivedAnalysis } from "../state/use-derived";
import { MATERIALS, makeCustomMaterial } from "../lib/materials";
import { PanelCard, StatTile } from "./primitives";
import { formatMass } from "../lib/units";
import type { Material } from "../types";

const FIELDS: Array<{
  key: keyof Material;
  label: string;
  unit: string;
  step: number;
}> = [
  { key: "density", label: "Density", unit: "g/cm³", step: 0.01 },
  { key: "youngsModulus", label: "Young's modulus", unit: "MPa", step: 10 },
  { key: "yieldStrength", label: "Yield strength", unit: "MPa", step: 1 },
  { key: "ultimateStrength", label: "Ultimate strength", unit: "MPa", step: 1 },
  { key: "poissonRatio", label: "Poisson ratio", unit: "", step: 0.01 },
  { key: "thermalExpansion", label: "Thermal expansion", unit: "µm/m·°C", step: 1 },
  { key: "costPerKg", label: "Cost", unit: "/kg", step: 1 },
];

/** Material selection + editable mechanical properties. */
export function MaterialPanel() {
  const { material, setMaterial } = useAnalyzer();
  const { stability } = useDerivedAnalysis();

  function selectMaterial(id: string) {
    const found = MATERIALS.find((m) => m.id === id);
    if (found) setMaterial(found);
  }

  function editField(key: keyof Material, value: number) {
    // Editing any property forks the selection into a custom material.
    const base = material.custom ? material : makeCustomMaterial(material);
    setMaterial({ ...base, [key]: value });
  }

  return (
    <div className="space-y-4">
      <PanelCard title="Material" description="Select an FDM filament or customize">
        <div className="mb-4 flex flex-wrap gap-2">
          {MATERIALS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => selectMaterial(m.id)}
              className={
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors " +
                (material.id === m.id && !material.custom
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)]/12 text-[var(--color-primary)]"
                  : "border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]")
              }
            >
              {m.name}
            </button>
          ))}
          {material.custom ? (
            <span className="rounded-full border border-[var(--color-primary)] bg-[var(--color-primary)]/12 px-3 py-1 text-xs font-medium text-[var(--color-primary)]">
              Custom
            </span>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {FIELDS.map((f) => (
            <label key={f.key} className="block">
              <span className="mb-1 block text-xs text-[var(--color-muted-foreground)]">
                {f.label} {f.unit ? `(${f.unit})` : ""}
              </span>
              <input
                type="number"
                step={f.step}
                value={material[f.key] as number}
                onChange={(e) => editField(f.key, Number(e.target.value))}
                className="w-full rounded-lg border border-[var(--color-border)] bg-transparent px-3 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
              />
            </label>
          ))}
        </div>
      </PanelCard>

      {stability ? (
        <div className="grid grid-cols-2 gap-3">
          <StatTile label="Estimated mass" value={formatMass(stability.massGrams)} />
          <StatTile
            label="Yield strength"
            value={material.yieldStrength}
            unit="MPa"
          />
        </div>
      ) : null}
    </div>
  );
}
