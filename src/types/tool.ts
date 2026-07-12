import type { IconName } from "@/components/ui/icon";

/**
 * Domain model for the tools hub. Everything the UI, routing, search, and SEO
 * need about a tool is described here so the registry stays the single source
 * of truth and the app scales to 100+ tools without structural changes.
 */

export const CATEGORY_IDS = [
  "philosophy",
  "engineering",
  "economics",
  "general",
] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

export type Difficulty = "beginner" | "intermediate" | "advanced";

export type ToolStatus = "live" | "coming-soon" | "beta";

/**
 * Optional capability flags. `viewer3d` lets a tool opt into the lazy-loaded
 * Three.js/R3F model viewer without any other tool paying its bundle cost.
 */
export interface ToolCapabilities {
  viewer3d?: boolean;
  /** Formats a 3D tool can ingest — drives future STL/OBJ/GLTF/STEP support. */
  modelFormats?: ReadonlyArray<"stl" | "obj" | "gltf" | "glb" | "step">;
}

export interface Tool {
  /** Stable unique id, also used as the localStorage favorite key. */
  id: string;
  /** URL slug within its category, e.g. `phil-tool-1`. */
  slug: string;
  title: string;
  description: string;
  /** Longer copy shown on the tool's own page. */
  longDescription?: string;
  category: CategoryId;
  icon: IconName;
  difficulty: Difficulty;
  status: ToolStatus;
  featured?: boolean;
  popular?: boolean;
  /** ISO date (YYYY-MM-DD) used for the "Recently Added" section + sitemap. */
  addedAt: string;
  /** Free-text tags that also feed fuzzy search. */
  keywords?: readonly string[];
  capabilities?: ToolCapabilities;
}

export interface Category {
  id: CategoryId;
  label: string;
  description: string;
  icon: IconName;
  /** Accent color token used for category theming (CSS custom property value). */
  accent: string;
}

/** A tool with its fully-resolved route — the shape most UI consumes. */
export interface ToolWithHref extends Tool {
  href: string;
}
