"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Heart } from "lucide-react";
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

export type ToolRowVariant = "index" | "ranked" | "changelog";

/** Short "YYYY-MM-DD" → "14 Jul" style date for the changelog variant. */
function shortDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const mi = Number(m) - 1;
  if (!y || !d || mi < 0 || mi > 11) return iso;
  return `${d} ${months[mi]} ${y.slice(2)}`;
}

/**
 * A tool rendered as a **catalog entry** row. Three variants keep the shared
 * catalog language but read distinctly per section:
 *  - `index`     — a numbered drawing-index row (default).
 *  - `ranked`    — a leaderboard row with a large rank number (Popular).
 *  - `changelog` — a dated entry with a NEW tag on the newest (Recent).
 * The whole row is the link target.
 */
export function ToolCard({
  tool,
  index = 0,
  variant = "index",
  isNewest = false,
}: {
  tool: ToolWithHref;
  index?: number;
  variant?: ToolRowVariant;
  isNewest?: boolean;
}) {
  const category = getCategory(tool.category);
  const { isFavorite, toggleFavorite, hydrated } = useFavorites();
  const favorite = hydrated && isFavorite(tool.id);
  const level =
    tool.difficulty === "advanced"
      ? 3
      : tool.difficulty === "intermediate"
        ? 2
        : 1;
  const rank = index + 1;

  function onFavorite(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    toggleFavorite(tool.id);
    toast(favorite ? "Removed from favorites" : "Added to favorites", {
      description: tool.title,
    });
  }

  return (
    <motion.div variants={fadeUp} className="group relative">
      <Link
        href={tool.href}
        className="relative flex items-center gap-4 py-3.5 pr-3 pl-3 transition-colors hover:bg-[var(--color-muted)]"
      >
        {/* Category tab — a solid drafting colour bar, left edge */}
        <span
          aria-hidden="true"
          className="absolute inset-y-2 left-0 w-[3px] rounded-full opacity-0 transition-opacity group-hover:opacity-100"
          style={{ backgroundColor: category.accent }}
        />

        {/* Leading marker — varies per section */}
        {variant === "ranked" ? (
          <span
            className={cn(
              "font-display w-10 shrink-0 text-right text-2xl leading-none font-semibold tabular-nums",
              rank <= 3
                ? "text-[var(--color-primary)]"
                : "text-[var(--color-hair)]",
            )}
          >
            {rank}
          </span>
        ) : variant === "changelog" ? (
          <span className="readout w-16 shrink-0 text-right text-[11px] text-[var(--color-muted-foreground)]">
            {shortDate(tool.addedAt)}
          </span>
        ) : (
          <span className="readout w-10 shrink-0 text-right text-xs text-[var(--color-muted-foreground)]">
            {String(rank).padStart(2, "0")}
          </span>
        )}

        {/* Icon — a plain drafting glyph, no tinted square */}
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] transition-colors group-hover:border-[color:var(--cat)]"
          style={
            {
              color: category.accent,
              "--cat": category.accent,
            } as React.CSSProperties
          }
        >
          <Icon name={tool.icon} className="size-[18px]" aria-hidden="true" />
        </span>

        {/* Title + description */}
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate font-medium tracking-tight">
              {tool.title}
            </span>
            {variant === "changelog" && isNewest ? (
              <span className="rounded bg-[var(--color-ok)]/15 px-1 py-0.5 font-mono text-[9px] font-semibold text-[var(--color-ok)] uppercase">
                New
              </span>
            ) : null}
            {tool.status === "beta" ? (
              <span className="rounded bg-[var(--color-primary)]/12 px-1 py-0.5 font-mono text-[9px] font-semibold text-[var(--color-primary)] uppercase">
                Beta
              </span>
            ) : null}
          </span>
          <span className="mt-0.5 line-clamp-1 text-sm text-[var(--color-muted-foreground)]">
            {tool.description}
          </span>
        </span>

        {/* Category label */}
        <span className="microlabel hidden w-24 shrink-0 text-right sm:block">
          {category.label}
        </span>

        {/* Difficulty gauge */}
        <span
          className="hidden shrink-0 items-center gap-0.5 sm:flex"
          title={`Difficulty: ${tool.difficulty}`}
        >
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className="h-3 w-1 rounded-full"
              style={{
                backgroundColor:
                  n <= level
                    ? DIFFICULTY_TONE[tool.difficulty]
                    : "var(--color-hair)",
              }}
            />
          ))}
        </span>

        {/* Favorite */}
        <button
          type="button"
          onClick={onFavorite}
          aria-pressed={favorite}
          aria-label={
            favorite
              ? `Remove ${tool.title} from favorites`
              : `Add ${tool.title} to favorites`
          }
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-foreground)]"
        >
          <Heart
            className={cn(
              "size-4 transition-transform active:scale-125",
              favorite && "fill-rose-500 text-rose-500",
            )}
            aria-hidden="true"
          />
        </button>

        {/* Open affordance */}
        <ArrowRight
          className="size-4 shrink-0 -translate-x-1 text-[var(--color-primary)] opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
          aria-hidden="true"
        />
      </Link>
    </motion.div>
  );
}
