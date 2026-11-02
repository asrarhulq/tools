"use client";

import { Pause, Play, RotateCcw } from "lucide-react";

const FACTS: readonly string[] = [
  "The blaugrana stripes run vertically, blue and garnet, with a soft gradient through the chest on the current kit.",
  "A small star sits above the crest — one for every trophy generation the club has banked.",
  'The real shirt prints "FC Barcelona" on the inside of the collar, a detail only the wearer ever sees.',
  "Gold trim at the collar and hem nods to the senyera, Catalonia's own striped flag.",
];

export function ControlPanel({
  name,
  onNameChange,
  number,
  onNumberChange,
  autoRotate,
  onToggleAutoRotate,
  onReset,
}: {
  name: string;
  onNameChange: (value: string) => void;
  number: string;
  onNumberChange: (value: string) => void;
  autoRotate: boolean;
  onToggleAutoRotate: () => void;
  onReset: () => void;
}) {
  return (
    <div className="flex w-full flex-col gap-5 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 lg:w-80">
      <div>
        <h2 className="text-sm font-semibold text-[var(--color-foreground)]">
          Personalize the back
        </h2>
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
          Drag to spin the jersey, scroll to zoom.
        </p>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-[var(--color-foreground)]">
          Name on back
        </span>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value.slice(0, 20))}
          placeholder="AYA HAMOUCHE"
          maxLength={20}
          className="rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] outline-none focus:border-[var(--color-primary)]"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-[var(--color-foreground)]">
          Number
        </span>
        <input
          type="text"
          inputMode="numeric"
          value={number}
          onChange={(e) =>
            onNumberChange(e.target.value.replace(/\D/g, "").slice(0, 2))
          }
          placeholder="10"
          maxLength={2}
          className="w-20 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] outline-none focus:border-[var(--color-primary)]"
        />
      </label>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onToggleAutoRotate}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-[var(--color-border)] px-3 py-2 text-xs font-medium text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
        >
          {autoRotate ? (
            <Pause className="size-3.5" />
          ) : (
            <Play className="size-3.5" />
          )}
          {autoRotate ? "Pause spin" : "Auto-spin"}
        </button>
        <button
          type="button"
          onClick={onReset}
          className="flex items-center justify-center gap-1.5 rounded-md border border-[var(--color-border)] px-3 py-2 text-xs font-medium text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
        >
          <RotateCcw className="size-3.5" />
          Reset
        </button>
      </div>

      <div className="border-t border-[var(--color-border)] pt-4">
        <h3 className="text-xs font-semibold text-[var(--color-foreground)]">
          About this kit
        </h3>
        <ul className="mt-2 space-y-2">
          {FACTS.map((fact) => (
            <li
              key={fact}
              className="text-xs leading-relaxed text-[var(--color-muted-foreground)]"
            >
              {fact}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
