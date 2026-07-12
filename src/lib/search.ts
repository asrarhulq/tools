import Fuse, { type IFuseOptions } from "fuse.js";
import { allTools } from "@/lib/tools";
import type { ToolWithHref } from "@/types/tool";

/**
 * Fuzzy-search index over the tool registry. Weighted so title matches rank
 * above description/keyword matches. Built once at module load and reused.
 */
const FUSE_OPTIONS: IFuseOptions<ToolWithHref> = {
  includeScore: true,
  threshold: 0.4,
  ignoreLocation: true,
  keys: [
    { name: "title", weight: 0.5 },
    { name: "description", weight: 0.25 },
    { name: "keywords", weight: 0.15 },
    { name: "category", weight: 0.1 },
  ],
};

const fuse = new Fuse(allTools as ToolWithHref[], FUSE_OPTIONS);

export function searchTools(query: string): readonly ToolWithHref[] {
  const trimmed = query.trim();
  if (!trimmed) return allTools;
  return fuse.search(trimmed).map((result) => result.item);
}
