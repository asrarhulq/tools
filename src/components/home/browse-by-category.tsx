"use client";

import { AnimatePresence, motion } from "framer-motion";
import { PackageOpen } from "lucide-react";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { ToolGrid } from "@/components/tools/tool-grid";
import { CategoryToggle } from "./category-toggle";
import { useCategory } from "@/hooks/use-category";
import { useVisibleCounts, useVisibleTools } from "@/hooks/use-private-tools";
import { getToolsByCategory } from "@/lib/tools";
import { getCategory } from "@/data/categories";
import type { CategoryId } from "@/types/tool";

/**
 * Interactive "Browse by category" block. Category is driven by the URL
 * (`?category=`) with a localStorage fallback; switching is instant and
 * animated, and the grid cross-fades between categories. A couple of tools
 * are private (`use-private-tools.ts`) and filtered out of both the grid
 * and the category counts unless this browser has unlocked them.
 */
export function BrowseByCategory({
  counts,
}: {
  counts: Record<CategoryId, number>;
}) {
  const { active, setCategory } = useCategory();
  const tools = useVisibleTools(getToolsByCategory(active));
  const visibleCounts = useVisibleCounts(counts);
  const category = getCategory(active);

  return (
    <section
      id="browse"
      aria-labelledby="browse-heading"
      className="py-12 sm:py-16"
    >
      <Container>
        <div className="mb-8 flex flex-col items-center space-y-2.5 text-center">
          <p className="microlabel flex items-center gap-2 text-[var(--color-primary)]">
            <span className="inline-block h-px w-6 bg-[var(--color-primary)]" />
            Catalog
            <span className="inline-block h-px w-6 bg-[var(--color-primary)]" />
          </p>
          <h2
            id="browse-heading"
            className="font-display font-semibold"
            style={{ fontSize: "var(--text-h2)" }}
          >
            Browse by category
          </h2>
          <p className="max-w-xl text-[var(--color-muted-foreground)]">
            {category.description}
          </p>
        </div>

        <div className="mb-10">
          <CategoryToggle
            active={active}
            onChange={setCategory}
            counts={visibleCounts}
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
