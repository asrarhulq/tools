import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/utils";
import { allTools } from "@/lib/tools";
import { categories } from "@/data/categories";

/**
 * XML sitemap generated from the tool registry, so every tool route is indexed
 * automatically as the catalog grows. Category views are included as
 * homepage `?category=` entries.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const home: MetadataRoute.Sitemap[number] = {
    url: absoluteUrl("/"),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 1,
  };

  const categoryEntries: MetadataRoute.Sitemap = categories.map((category) => ({
    url: absoluteUrl(`/?category=${category.id}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const toolEntries: MetadataRoute.Sitemap = allTools.map((tool) => ({
    url: absoluteUrl(tool.href),
    lastModified: new Date(tool.addedAt),
    changeFrequency: "monthly",
    priority: tool.featured ? 0.9 : 0.7,
  }));

  return [home, ...categoryEntries, ...toolEntries];
}
