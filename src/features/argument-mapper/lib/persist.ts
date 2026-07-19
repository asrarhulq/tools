import type { ArgGraph } from "../types";

/**
 * Tiny localStorage persistence for the working document. SSR-safe (guards
 * `window`), tolerant of corrupt data, and versioned so future schema changes
 * can migrate rather than crash.
 */

const KEY = "asrarul-tools:argument-mapper:v1";

interface Stored {
  v: 1;
  graph: ArgGraph;
}

export function loadGraph(): ArgGraph | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Stored;
    if (parsed?.v !== 1 || !Array.isArray(parsed.graph?.nodes)) return null;
    return parsed.graph;
  } catch {
    return null;
  }
}

export function saveGraph(graph: ArgGraph): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify({ v: 1, graph } satisfies Stored));
  } catch {
    /* quota / private mode — non-fatal */
  }
}
