"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ALL_BODIES, BODY_BY_ID } from "../data";
import { useOrrery } from "../state/orrery-context";

export function BodyListSearch() {
  const [query, setQuery] = useState("");
  const { selectedBodyId, selectBody } = useOrrery();
  const filtered = ALL_BODIES.filter((b) =>
    b.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="space-y-2">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search planets, moons…"
        className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-1.5 text-sm outline-none"
      />
      <div className="max-h-96 space-y-0.5 overflow-y-auto">
        {filtered.map((b) => {
          const parent = b.parentId ? BODY_BY_ID.get(b.parentId) : undefined;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => selectBody(b.id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                selectedBodyId === b.id
                  ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                  : "hover:bg-[var(--color-muted)]",
              )}
            >
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: b.physical.color }}
              />
              <span className="truncate">{b.name}</span>
              {parent && (
                <span className="ml-auto shrink-0 text-[10px] opacity-70">
                  moon of {parent.name}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
