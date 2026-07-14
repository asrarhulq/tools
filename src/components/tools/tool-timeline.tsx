"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import type { ToolWithHref } from "@/types/tool";
import { getCategory } from "@/data/categories";
import { fadeUp, staggerContainer } from "@/lib/motion";
import { Icon } from "@/components/ui/icon";

const MONTHS = [
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

function fmtDate(iso: string): { day: string; month: string; year: string } {
  const [y, m, d] = iso.split("-");
  const mi = Number(m) - 1;
  return {
    day: d ?? "",
    month: mi >= 0 && mi <= 11 ? MONTHS[mi]! : (m ?? ""),
    year: y ? y.slice(2) : "",
  };
}

/**
 * Recently-added tools as a **vertical timeline** — a spine runs down the left
 * with a dated node per entry, so the section reads as a build log / changelog
 * rather than another ruled table. Input is expected newest-first.
 */
export function ToolTimeline({ tools }: { tools: readonly ToolWithHref[] }) {
  return (
    <motion.ol
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      className="relative ml-2 border-l border-[var(--color-border)] pl-0"
    >
      {tools.map((tool, i) => {
        const category = getCategory(tool.category);
        const { day, month, year } = fmtDate(tool.addedAt);
        const newest = i === 0;
        return (
          <motion.li key={tool.id} variants={fadeUp} className="relative">
            {/* Node on the spine */}
            <span
              aria-hidden="true"
              className="absolute top-5 -left-[5px] size-2.5 rounded-full ring-4 ring-[var(--color-background)]"
              style={{
                backgroundColor: newest
                  ? "var(--color-primary)"
                  : category.accent,
              }}
            />
            <Link
              href={tool.href}
              className="group ml-6 flex items-start gap-4 rounded-lg px-3 py-4 transition-colors hover:bg-[var(--color-muted)]"
            >
              {/* Date stamp */}
              <span className="readout flex w-12 shrink-0 flex-col items-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] py-1.5 leading-none">
                <span className="text-base font-semibold text-[var(--color-foreground)]">
                  {day}
                </span>
                <span className="mt-0.5 text-[10px] tracking-wide text-[var(--color-muted-foreground)] uppercase">
                  {month}&nbsp;{year}
                </span>
              </span>

              {/* Icon */}
              <span
                className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface)]"
                style={{ color: category.accent }}
              >
                <Icon
                  name={tool.icon}
                  className="size-[18px]"
                  aria-hidden="true"
                />
              </span>

              {/* Body */}
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="font-medium tracking-tight">
                    {tool.title}
                  </span>
                  {newest ? (
                    <span className="rounded bg-[var(--color-ok)]/15 px-1 py-0.5 font-mono text-[9px] font-semibold text-[var(--color-ok)] uppercase">
                      New
                    </span>
                  ) : null}
                  <span className="microlabel ml-auto hidden shrink-0 sm:block">
                    {category.label}
                  </span>
                </span>
                <span className="mt-1 line-clamp-1 text-sm text-[var(--color-muted-foreground)]">
                  {tool.description}
                </span>
              </span>

              <ArrowUpRight
                className="mt-1 size-4 shrink-0 -translate-x-1 text-[var(--color-primary)] opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
                aria-hidden="true"
              />
            </Link>
          </motion.li>
        );
      })}
    </motion.ol>
  );
}
