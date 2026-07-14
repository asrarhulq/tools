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
 * Segmented category control in the instrument language: a squared track with
 * a sliding surface indicator (shared `layoutId`), each option carrying its
 * category accent dot and a mono count. A proper ARIA tablist for keyboard and
 * screen-reader support.
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
      className="mx-auto flex w-full max-w-2xl flex-wrap items-center justify-center gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-1"
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
              "relative flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              isActive
                ? "text-[var(--color-foreground)]"
                : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]",
            )}
          >
            {isActive ? (
              <motion.span
                layoutId={reduce ? undefined : "category-pill"}
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                className="absolute inset-0 rounded-lg bg-[var(--color-surface)] shadow-sm ring-1 ring-[var(--color-border)]"
              />
            ) : null}
            <span className="relative flex items-center gap-2">
              <span
                className="size-1.5 rounded-full transition-opacity"
                style={{
                  backgroundColor: category.accent,
                  opacity: isActive ? 1 : 0.5,
                }}
              />
              <Icon
                name={category.icon}
                className="size-4"
                aria-hidden="true"
              />
              {category.label}
              <span className="readout hidden text-xs opacity-60 sm:inline">
                {counts[category.id]}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
