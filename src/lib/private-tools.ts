import { GATE_STORAGE_KEY as AYAS_CHESS_GATE } from "@/features/ayas-chess-board/lib/gate";
import { GATE_STORAGE_KEY as BARCA_JERSEY_GATE } from "@/features/barca-jersey/lib/gate";
import type { CategoryId } from "@/types/tool";

export interface PrivateToolEntry {
  readonly gateStorageKey: string;
  readonly category: CategoryId;
}

/**
 * Tools kept out of every catalog listing, search result, sitemap entry,
 * and the random-tool picker — not just gated once you're on the page, but
 * absent from General entirely until someone unlocks them in this browser
 * (`src/hooks/use-private-tools.ts`). Bloomie is deliberately NOT included
 * here: its own page is password-gated same as these two, but it stays
 * listed normally everywhere else.
 *
 * Plain data, no "use client" — safe to import from server code too (e.g.
 * `sitemap.ts`, which always excludes these regardless of any browser's
 * unlock state, since a static sitemap can't know who's asking).
 */
export const PRIVATE_TOOLS: Readonly<Record<string, PrivateToolEntry>> = {
  "general-tool-8": { gateStorageKey: AYAS_CHESS_GATE, category: "general" },
  "general-tool-11": { gateStorageKey: BARCA_JERSEY_GATE, category: "general" },
};
