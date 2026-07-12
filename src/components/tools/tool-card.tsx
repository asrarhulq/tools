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
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";

/**
 * The primary tool tile: icon, title, description, category + difficulty
 * badges, favorite toggle, and an "Open Tool" affordance. Wrapped in a motion
 * item so grids can stagger their children in.
 */
export function ToolCard({ tool }: { tool: ToolWithHref }) {
  const category = getCategory(tool.category);
  const { isFavorite, toggleFavorite, hydrated } = useFavorites();
  const reduce = useReducedMotion();
  const favorite = hydrated && isFavorite(tool.id);

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
      whileHover={reduce ? undefined : { y: -4 }}
      className="group relative h-full"
    >
      <Link
        href={tool.href}
        className="flex h-full flex-col gap-4 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-shadow duration-300 hover:shadow-[var(--shadow-glow)]"
      >
        <div className="flex items-start justify-between">
          <span
            className="flex size-11 items-center justify-center rounded-xl"
            style={{
              backgroundColor: `color-mix(in oklab, ${category.accent} 15%, transparent)`,
              color: category.accent,
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
          <h3 className="flex items-center gap-1 leading-snug font-semibold">
            {tool.title}
            {tool.status === "beta" ? (
              <Badge variant="primary" className="ml-1">
                Beta
              </Badge>
            ) : null}
          </h3>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {tool.description}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline">{category.label}</Badge>
            <Badge variant={tool.difficulty}>{tool.difficulty}</Badge>
          </div>
          <span className="flex items-center gap-1 text-sm font-medium text-[var(--color-primary)] opacity-0 transition-opacity group-hover:opacity-100">
            Open
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </span>
        </div>
      </Link>
    </motion.article>
  );
}
