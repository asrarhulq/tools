"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Heart } from "lucide-react";
import { toast } from "sonner";
import type { ToolWithHref } from "@/types/tool";
import { getCategory } from "@/data/categories";
import { useFavorites } from "@/hooks/use-favorites";
import { fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";

const DIFFICULTY_TONE: Record<string, string> = {
  beginner: "var(--color-ok)",
  intermediate: "var(--color-warn)",
  advanced: "var(--color-crit)",
};

/**
 * The primary tool tile in the precision-instrument language: a category-accent
 * hairline caps the card, the icon plate carries the category color, and the
 * metadata reads as a technical footer — difficulty shown as a filled gauge
 * (1–3 bars) rather than a generic badge. Layered surfaces give real depth on
 * hover instead of a flat glow.
 */
export function ToolCard({ tool }: { tool: ToolWithHref }) {
  const category = getCategory(tool.category);
  const { isFavorite, toggleFavorite, hydrated } = useFavorites();
  const reduce = useReducedMotion();
  const favorite = hydrated && isFavorite(tool.id);
  const level =
    tool.difficulty === "advanced"
      ? 3
      : tool.difficulty === "intermediate"
        ? 2
        : 1;

  function onFavorite(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    toggleFavorite(tool.id);
    toast(favorite ? "Removed from favorites" : "Added to favorites", {
      description: tool.title,
    });
  }

  return (
    <motion.article
      variants={fadeUp}
      whileHover={reduce ? undefined : { y: -3 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="group relative h-full"
    >
      <Link
        href={tool.href}
        className="relative flex h-full flex-col gap-4 overflow-hidden rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-colors duration-300 hover:border-[var(--color-muted-foreground)]/30 hover:bg-[var(--color-surface-2)]"
      >
        {/* Category accent hairline along the top edge */}
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[2px] scale-x-0 opacity-0 transition-all duration-300 group-hover:scale-x-100 group-hover:opacity-100"
          style={{ backgroundColor: category.accent, transformOrigin: "left" }}
        />

        <div className="flex items-start justify-between">
          <span
            className="flex size-11 items-center justify-center rounded-xl ring-1 ring-inset"
            style={{
              backgroundColor: `color-mix(in oklab, ${category.accent} 14%, transparent)`,
              color: category.accent,
              // @ts-expect-error — CSS custom prop for the ring color
              "--tw-ring-color": `color-mix(in oklab, ${category.accent} 25%, transparent)`,
            }}
          >
            <Icon name={tool.icon} className="size-5" aria-hidden="true" />
          </span>

          <button
            type="button"
            onClick={onFavorite}
            aria-pressed={favorite}
            aria-label={
              favorite
                ? `Remove ${tool.title} from favorites`
                : `Add ${tool.title} to favorites`
            }
            className="flex size-8 items-center justify-center rounded-full text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
          >
            <Heart
              className={cn(
                "size-4 transition-transform active:scale-125",
                favorite && "fill-rose-500 text-rose-500",
              )}
              aria-hidden="true"
            />
          </button>
        </div>

        <div className="flex-1 space-y-1.5">
          <h3 className="flex items-center gap-1.5 leading-snug font-semibold tracking-tight">
            {tool.title}
            {tool.status === "beta" ? (
              <span className="rounded bg-[var(--color-primary)]/12 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-primary)] uppercase">
                Beta
              </span>
            ) : null}
          </h3>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {tool.description}
          </p>
        </div>

        {/* Technical footer: category label · difficulty gauge · open affordance */}
        <div className="flex items-center justify-between border-t border-[var(--color-hair)] pt-3">
          <div className="flex items-center gap-2.5">
            <span className="microlabel">{category.label}</span>
            <span
              className="flex items-center gap-0.5"
              title={`Difficulty: ${tool.difficulty}`}
            >
              {[1, 2, 3].map((n) => (
                <span
                  key={n}
                  className="h-2.5 w-1 rounded-full transition-colors"
                  style={{
                    backgroundColor:
                      n <= level
                        ? DIFFICULTY_TONE[tool.difficulty]
                        : "var(--color-hair)",
                  }}
                />
              ))}
            </span>
          </div>
          <span className="flex items-center gap-0.5 text-xs font-medium text-[var(--color-primary)] opacity-0 transition-opacity group-hover:opacity-100">
            Open
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </span>
        </div>
      </Link>
    </motion.article>
  );
}
