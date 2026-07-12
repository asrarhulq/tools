import { tools } from "@/data/tools";
import { categories } from "@/data/categories";
import type { CategoryId, Tool, ToolWithHref } from "@/types/tool";

/**
 * Query layer over the tool registry. All access to tools flows through here so
 * derived data (hrefs, sections, sorting) is computed once and stays consistent.
 */

/** Canonical route for a tool: /<category>/<slug>. */
export function toolHref(tool: Pick<Tool, "category" | "slug">): string {
  return `/${tool.category}/${tool.slug}`;
}

function withHref(tool: Tool): ToolWithHref {
  return { ...tool, href: toolHref(tool) };
}

export const allTools: readonly ToolWithHref[] = tools.map(withHref);

const bySlug = new Map<string, ToolWithHref>(
  allTools.map((t) => [`${t.category}/${t.slug}`, t]),
);

export function getTool(
  category: CategoryId,
  slug: string,
): ToolWithHref | undefined {
  return bySlug.get(`${category}/${slug}`);
}

export function getToolsByCategory(
  category: CategoryId,
): readonly ToolWithHref[] {
  return allTools.filter((t) => t.category === category);
}

export const featuredTools: readonly ToolWithHref[] = allTools.filter(
  (t) => t.featured,
);

export const popularTools: readonly ToolWithHref[] = allTools.filter(
  (t) => t.popular,
);

/** Newest first — drives the "Recently Added" section. */
export const recentTools: readonly ToolWithHref[] = [...allTools].sort((a, b) =>
  b.addedAt.localeCompare(a.addedAt),
);

export function getToolCountByCategory(): Record<CategoryId, number> {
  const counts = Object.fromEntries(categories.map((c) => [c.id, 0])) as Record<
    CategoryId,
    number
  >;
  for (const tool of allTools) counts[tool.category] += 1;
  return counts;
}

/** Deterministic across server/client for a given seed (no Math.random at import). */
export function pickRandomTool(seed: number): ToolWithHref {
  const index = Math.abs(Math.floor(seed)) % allTools.length;
  return allTools[index]!;
}
