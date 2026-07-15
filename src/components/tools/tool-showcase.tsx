"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import type { ToolWithHref } from "@/types/tool";
import { getCategory } from "@/data/categories";
import { fadeUp } from "@/lib/motion";
import { Reveal } from "@/components/ui/reveal";
import { Icon } from "@/components/ui/icon";

/**
 * The 3D running figure is code-split so R3F/three never load on the initial
 * page. It is purely decorative, so if its chunk fails to load (e.g. a stale
 * cached tab hitting a new deploy) we degrade to no figure rather than letting
 * a ChunkLoadError bubble to the route error boundary. `ssr: false` keeps three
 * off the server bundle entirely.
 */
const RunningFigure = dynamic(
  () =>
    import("./running-figure")
      .then((m) => ({ default: m.RunningFigure }))
      .catch(() => ({ default: () => null })),
  { ssr: false },
);

/** Tools that get a live 3D preview in the lead showcase tile, keyed by id. */
const PREVIEW_IDS = new Set(["general-tool-6"]);

const DIFFICULTY_TONE: Record<string, string> = {
  beginner: "var(--color-ok)",
  intermediate: "var(--color-warn)",
  advanced: "var(--color-crit)",
};

/**
 * Featured tools as large "drawing-sheet" tiles — a distinctly heavier
 * treatment than the ruled catalog index used elsewhere, so the Featured
 * section reads differently from Popular / Recent. The first tile spans wide
 * (the lead sheet); the rest form a supporting grid.
 */
export function ToolShowcase({ tools }: { tools: readonly ToolWithHref[] }) {
  return (
    <Reveal className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {tools.map((tool, i) => (
        <ShowcaseTile key={tool.id} tool={tool} lead={i === 0} />
      ))}
    </Reveal>
  );
}

function ShowcaseTile({ tool, lead }: { tool: ToolWithHref; lead?: boolean }) {
  const category = getCategory(tool.category);
  const level =
    tool.difficulty === "advanced"
      ? 3
      : tool.difficulty === "intermediate"
        ? 2
        : 1;
  const showPreview = !!lead && PREVIEW_IDS.has(tool.id);

  return (
    <motion.article
      variants={fadeUp}
      className={lead ? "sm:col-span-2 lg:row-span-2" : ""}
    >
      <Link
        href={tool.href}
        className="group corner-ticks relative flex h-full min-h-[240px] flex-col justify-between overflow-hidden rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-colors hover:border-[color:var(--cat)]"
        style={{ "--cat": category.accent } as React.CSSProperties}
      >
        {/* Live 3D running figure (Biomechanics lead tile) */}
        {showPreview ? (
          <>
            <div
              aria-hidden="true"
              className="blueprint-field pointer-events-none absolute inset-0 opacity-60"
            />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-full sm:w-3/5">
              <RunningFigure color={category.accent} />
            </div>
            {/* Scrim so the caption stays legible over the figure */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[var(--color-surface)] via-[var(--color-surface)]/80 to-transparent"
            />
          </>
        ) : null}

        {/* Drafting corner registration marks */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-2 left-2 z-10 size-2 border-t border-l opacity-40"
          style={{ borderColor: category.accent }}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-2 bottom-2 z-10 size-2 border-r border-b opacity-40"
          style={{ borderColor: category.accent }}
        />

        <div className="relative z-10 flex items-start justify-between gap-3">
          <span
            className="flex size-11 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)]"
            style={{ color: category.accent }}
          >
            <Icon
              name={tool.icon}
              className={lead ? "size-6" : "size-5"}
              aria-hidden="true"
            />
          </span>
          <span className="microlabel">{category.label}</span>
        </div>

        <div className={lead ? "relative z-10 mt-8" : "relative z-10 mt-6"}>
          <h3
            className={
              lead
                ? "font-display text-2xl font-semibold tracking-tight"
                : "font-display text-lg font-semibold tracking-tight"
            }
          >
            {tool.title}
          </h3>
          <p
            className={
              lead
                ? "mt-2 max-w-md text-pretty text-[var(--color-muted-foreground)]"
                : "mt-1.5 line-clamp-2 text-sm text-[var(--color-muted-foreground)]"
            }
          >
            {showPreview
              ? tool.description
              : lead
                ? (tool.longDescription ?? tool.description)
                : tool.description}
          </p>

          <div className="mt-4 flex items-center gap-3">
            <span
              className="flex items-center gap-0.5"
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
            <span className="microlabel">{tool.difficulty}</span>
            <span className="ml-auto flex items-center gap-1 text-sm font-medium text-[var(--color-primary)] opacity-0 transition-opacity group-hover:opacity-100">
              Open
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
