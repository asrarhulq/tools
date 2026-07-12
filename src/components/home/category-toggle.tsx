"use client";

import { motion, useReducedMotion } from "framer-motion";
import { categories } from "@/data/categories";
import type { CategoryId } from "@/types/tool";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";

interface CategoryToggleProps {
  active: CategoryId;
  onChange: (category: CategoryId) => void;
  counts: Record<CategoryId, number>;
}

/**
 * Premium segmented control. The active "pill" animates between options via a
 * shared `layoutId`, giving the instant, fluid category switch. Implemented as
 * a proper ARIA tablist for keyboard + screen-reader support.
 */
export function CategoryToggle({
  active,
  onChange,
  counts,
}: CategoryToggleProps) {
  const reduce = useReducedMotion();

  return (
    <div
      role="tablist"
      aria-label="Tool categories"
      className="glass mx-auto flex w-full max-w-2xl flex-wrap items-center justify-center gap-1 rounded-full p-1.5"
    >
      {categories.map((category) => {
        const isActive = category.id === active;
        return (
          <button
            key={category.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onChange(category.id)}
            className={cn(
              "relative flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              isActive
                ? "text-[var(--color-primary-foreground)]"
                : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]",
            )}
          >
            {isActive ? (
              <motion.span
                layoutId={reduce ? undefined : "category-pill"}
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                className="absolute inset-0 rounded-full bg-[var(--color-primary)]"
              />
            ) : null}
            <span className="relative flex items-center gap-2">
              <Icon
                name={category.icon}
                className="size-4"
                aria-hidden="true"
              />
              {category.label}
              <span className="hidden text-xs opacity-70 sm:inline">
                {counts[category.id]}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
