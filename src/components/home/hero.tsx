"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Command, Shuffle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { Container } from "@/components/ui/container";
import { useCommandPalette } from "@/components/command/command-palette-provider";
import { allTools, getToolCountByCategory } from "@/lib/tools";
import { categories } from "@/data/categories";
import { Icon } from "@/components/ui/icon";
import { CategoryLink } from "./category-link";
import { fadeUp, staggerContainer } from "@/lib/motion";

/**
 * The animated canvas backdrop is client-only and code-split so its JS stays
 * off other routes; if its chunk ever fails it simply doesn't render (the hero
 * keeps its static blueprint grid + glow).
 */
const MechanicalGrid = dynamic(
  () =>
    import("./mechanical-grid")
      .then((m) => ({ default: m.MechanicalGrid }))
      .catch(() => ({ default: () => null })),
  { ssr: false },
);

/**
 * Homepage hero. A calm, editorial layout in the site's drafting-blue language:
 * a status pill, a large display headline with one restrained accent, primary
 * actions, and a "catalog" panel that doubles as category navigation with live
 * per-section tool counts. A faint blueprint grid and corner glow ground it.
 */
export function Hero({ toolCount }: { toolCount: number }) {
  const { open } = useCommandPalette();
  const router = useRouter();
  const reduce = useReducedMotion();
  const counts = getToolCountByCategory();

  function randomTool() {
    const tool = allTools[Math.floor(Math.random() * allTools.length)]!;
    toast("Surprise!", { description: `Opening ${tool.title}` });
    router.push(tool.href);
  }

  return (
    <section className="relative overflow-hidden border-b border-[var(--color-border)] bg-[var(--color-background)]">
      {/* Animated node-network backdrop (decorative, hero-scoped). The canvas
          provides the grid/network, so no static blueprint layer here. A gentle
          bottom fade blends it into the page below. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black_60%,transparent)]"
      >
        <MechanicalGrid />
      </div>

      <Container className="relative z-10 py-20 sm:py-28">
        <motion.div
          variants={reduce ? undefined : staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid gap-12 lg:grid-cols-[1fr_auto] lg:items-center"
        >
          {/* Headline column */}
          <div className="max-w-3xl">
            <motion.span
              variants={fadeUp}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] py-1.5 pr-3.5 pl-2 text-xs font-medium text-[var(--color-muted-foreground)]"
            >
              <span className="flex items-center gap-1.5 rounded-full bg-[var(--color-primary)]/10 px-2 py-0.5 text-[var(--color-primary)]">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--color-primary)] opacity-70" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-[var(--color-primary)]" />
                </span>
                Live
              </span>
              {toolCount} interactive tools, and counting
            </motion.span>

            <motion.h1
              variants={fadeUp}
              className="font-display mt-6 font-semibold text-balance"
              style={{
                fontSize: "clamp(2.25rem, 5vw + 0.75rem, 4.5rem)",
                lineHeight: 0.98,
              }}
            >
              For every problem
              <br />
              <span className="text-[var(--color-primary)]">
                worth solving.
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-6 max-w-md text-xl font-medium text-pretty text-[var(--color-foreground)]/80 sm:text-2xl"
            >
              The right tool beats the hard way.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="mt-8 flex flex-wrap items-center gap-2.5"
            >
              <button
                type="button"
                onClick={open}
                className="group flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-[var(--color-primary-foreground)] shadow-sm transition-transform active:scale-[0.98]"
              >
                <Command className="size-4" aria-hidden="true" />
                Search the catalog
                <kbd className="ml-1 hidden rounded bg-black/15 px-1.5 py-0.5 font-mono text-[10px] sm:inline">
                  ⌘K
                </kbd>
              </button>
              <button
                type="button"
                onClick={randomTool}
                className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-medium transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              >
                <Shuffle className="size-4" aria-hidden="true" />
                Surprise me
              </button>
            </motion.div>
          </div>

          {/* Catalog panel — headline totals + category navigation.
              Outline glow matched to the mechanical-grid accent (the engineering
              sky-blue used by the node network), so the panel reads as part of
              the same lit field. Subtle and theme-aware. */}
          <motion.dl
            variants={fadeUp}
            className="hidden w-[320px] self-center overflow-hidden rounded-xl border bg-[var(--color-surface)]/90 backdrop-blur-sm lg:block"
            style={{
              borderColor: "rgba(56,189,248,0.35)",
              boxShadow:
                "0 0 0 1px rgba(56,189,248,0.25), 0 0 24px -2px rgba(56,189,248,0.35), 0 8px 44px -12px rgba(56,189,248,0.45)",
            }}
          >
            {/* Prominent totals */}
            <div className="flex items-stretch border-b border-[var(--color-border)]">
              <div className="flex-1 border-r border-[var(--color-border)] px-4 py-3.5">
                <dt className="microlabel">Tools</dt>
                <dd className="readout mt-1.5 text-3xl font-semibold text-[var(--color-foreground)]">
                  {String(toolCount).padStart(2, "0")}
                </dd>
              </div>
              <div className="flex-1 px-4 py-3.5">
                <dt className="microlabel">Sections</dt>
                <dd className="readout mt-1.5 text-3xl font-semibold text-[var(--color-foreground)]">
                  {String(categories.length).padStart(2, "0")}
                </dd>
              </div>
            </div>

            {/* Category navigation (client-side switch + scroll to Browse) */}
            {categories.map((c) => (
              <CategoryLink
                key={c.id}
                category={c.id}
                className="group flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-2.5 transition-colors last:border-b-0 hover:bg-[var(--color-muted)]"
              >
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] transition-colors group-hover:border-[color:var(--cat)]"
                  style={
                    {
                      color: c.accent,
                      "--cat": c.accent,
                    } as React.CSSProperties
                  }
                >
                  <Icon name={c.icon} className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium tracking-tight">
                    {c.label}
                  </span>
                  <span className="readout text-[11px] text-[var(--color-muted-foreground)]">
                    {counts[c.id]} {counts[c.id] === 1 ? "tool" : "tools"}
                  </span>
                </span>
                <ArrowRight
                  className="size-4 shrink-0 -translate-x-1 text-[var(--color-primary)] opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
                  aria-hidden="true"
                />
              </CategoryLink>
            ))}
          </motion.dl>
        </motion.div>
      </Container>
    </section>
  );
}
