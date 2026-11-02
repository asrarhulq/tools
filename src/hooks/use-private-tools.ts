"use client";

import { useLocalStorage } from "./use-local-storage";
import { PRIVATE_TOOLS } from "@/lib/private-tools";
import type { CategoryId, ToolWithHref } from "@/types/tool";

/**
 * The private tool ids currently hidden in this browser (locked). Exactly
 * one `useLocalStorage` call per entry in `PRIVATE_TOOLS` — fixed at build
 * time, written out explicitly rather than via `.map()` so the hook count
 * stays static and obvious, per the rules of hooks.
 */
export function useHiddenToolIds(): ReadonlySet<string> {
  const [chessUnlocked] = useLocalStorage(
    PRIVATE_TOOLS["general-tool-8"]!.gateStorageKey,
    false,
  );
  const [jerseyUnlocked] = useLocalStorage(
    PRIVATE_TOOLS["general-tool-11"]!.gateStorageKey,
    false,
  );
  const hidden = new Set<string>();
  if (!chessUnlocked) hidden.add("general-tool-8");
  if (!jerseyUnlocked) hidden.add("general-tool-11");
  return hidden;
}

/** Filters a tool list down to what this browser is currently allowed to see. */
export function useVisibleTools<T extends ToolWithHref>(
  tools: readonly T[],
): readonly T[] {
  const hidden = useHiddenToolIds();
  return hidden.size ? tools.filter((t) => !hidden.has(t.id)) : tools;
}

/** Per-category tool counts adjusted for whatever's hidden in this browser,
 * so a category badge never promises more tools than the grid shows. */
export function useVisibleCounts(
  baseCounts: Record<CategoryId, number>,
): Record<CategoryId, number> {
  const hidden = useHiddenToolIds();
  if (!hidden.size) return baseCounts;
  const adjusted = { ...baseCounts };
  for (const id of hidden) {
    const category = PRIVATE_TOOLS[id]?.category;
    if (category) adjusted[category] -= 1;
  }
  return adjusted;
}
