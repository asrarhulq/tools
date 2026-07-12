"use client";

import { AnimatePresence, motion } from "framer-motion";
import { PackageOpen } from "lucide-react";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { ToolGrid } from "@/components/tools/tool-grid";
import { CategoryToggle } from "./category-toggle";
import { useCategory } from "@/hooks/use-category";
import { getToolsByCategory } from "@/lib/tools";
import { getCategory } from "@/data/categories";
import type { CategoryId } from "@/types/tool";

/**
 * Interactive "Browse by category" block. Category is driven by the URL
 * (`?category=`) with a localStorage fallback; switching is instant and
 * animated, and the grid cross-fades between categories.
 */
export function BrowseByCategory({
  counts,
}: {
  counts: Record<CategoryId, number>;
}) {
  const { active, setCategory } = useCategory();
  const tools = getToolsByCategory(active);
  const category = getCategory(active);

  return (
    <section
      id="browse"
      aria-labelledby="browse-heading"
      className="py-12 sm:py-16"
    >
      <Container>
        <div className="mb-8 space-y-2 text-center">
          <h2
            id="browse-heading"
            className="font-semibold tracking-tight"
            style={{ fontSize: "var(--text-h2)" }}
          >
            Browse by category
          </h2>
          <p className="text-[var(--color-muted-foreground)]">
            {category.description}
          </p>
        </div>

        <div className="mb-10">
          <CategoryToggle
            active={active}
            onChange={setCategory}
            counts={counts}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {tools.length ? (
              <ToolGrid tools={tools} />
            ) : (
              <EmptyState
                icon={PackageOpen}
                title="No tools here yet"
                description="This category is brewing. Check back soon — or explore another category above."
              />
            )}
          </motion.div>
        </AnimatePresence>
      </Container>
    </section>
  );
}
