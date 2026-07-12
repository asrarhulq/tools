import type { Category, CategoryId } from "@/types/tool";

/**
 * Category definitions. Accents are OKLCH values wired into per-category
 * theming. Order here is the order of the segmented toggle on the homepage.
 */
export const categories: readonly Category[] = [
  {
    id: "philosophy",
    label: "Philosophy",
    description:
      "Thought experiments, logic, and frameworks for clearer thinking.",
    icon: "brain-circuit",
    accent: "oklch(0.62 0.19 300)",
  },
  {
    id: "engineering",
    label: "Engineering",
    description:
      "Calculators, converters, and 3D tools for makers and builders.",
    icon: "atom",
    accent: "oklch(0.62 0.17 240)",
  },
  {
    id: "economics",
    label: "Economics",
    description: "Models and simulators for markets, money, and incentives.",
    icon: "line-chart",
    accent: "oklch(0.66 0.17 150)",
  },
  {
    id: "general",
    label: "General",
    description: "Everyday utilities that are a delight to use.",
    icon: "sparkles",
    accent: "oklch(0.68 0.16 60)",
  },
] as const;

const categoryById = new Map<CategoryId, Category>(
  categories.map((c) => [c.id, c]),
);

export function getCategory(id: CategoryId): Category {
  const category = categoryById.get(id);
  if (!category) throw new Error(`Unknown category: ${id}`);
  return category;
}
