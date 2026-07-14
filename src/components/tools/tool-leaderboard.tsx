"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { ToolWithHref } from "@/types/tool";
import { getCategory } from "@/data/categories";
import { fadeUp, staggerContainer } from "@/lib/motion";
import { Icon } from "@/components/ui/icon";

/**
 * Popular tools as a **bar-chart leaderboard** — each entry carries an
 * oversized rank and a horizontal usage bar whose length descends down the
 * ranking, so the section reads as a chart rather than another ruled list.
 * (The bar length is a deterministic decay from the rank, not real telemetry.)
 */
export function ToolLeaderboard({ tools }: { tools: readonly ToolWithHref[] }) {
  const n = tools.length || 1;
  return (
    <motion.ol
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      className="space-y-1.5"
    >
      {tools.map((tool, i) => {
        const category = getCategory(tool.category);
        const rank = i + 1;
        // Decaying magnitude: #1 = 100%, tapering toward the tail.
        const pct = Math.round(100 - (i / n) * 68);
        const podium = rank <= 3;
        return (
          <motion.li key={tool.id} variants={fadeUp}>
            <Link
              href={tool.href}
              className="group grid grid-cols-[2.5rem_1fr] items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-[var(--color-muted)] sm:grid-cols-[3rem_minmax(0,15rem)_1fr]"
            >
              {/* Rank */}
              <span
                className="font-display text-center text-3xl leading-none font-bold tabular-nums sm:text-4xl"
                style={{
                  color: podium ? "var(--color-primary)" : "var(--color-hair)",
                }}
              >
                {rank}
              </span>

              {/* Identity */}
              <span className="flex min-w-0 items-center gap-2.5">
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface)]"
                  style={{ color: category.accent }}
                >
                  <Icon
                    name={tool.icon}
                    className="size-4"
                    aria-hidden="true"
                  />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-medium tracking-tight">
                    {tool.title}
                  </span>
                  <span className="microlabel">{category.label}</span>
                </span>
              </span>

              {/* Usage bar */}
              <span className="hidden items-center gap-3 sm:flex">
                <span className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-[var(--color-muted)]">
                  <motion.span
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      backgroundColor: podium
                        ? "var(--color-primary)"
                        : category.accent,
                      opacity: podium ? 1 : 0.55,
                    }}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${pct}%` }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.7,
                      delay: 0.05 * i,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  />
                </span>
                <span className="readout w-9 shrink-0 text-right text-xs text-[var(--color-muted-foreground)]">
                  {pct}
                </span>
              </span>
            </Link>
          </motion.li>
        );
      })}
    </motion.ol>
  );
}
