"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Command, Shuffle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Container } from "@/components/ui/container";
import { useCommandPalette } from "@/components/command/command-palette-provider";
import { allTools } from "@/lib/tools";
import { categories } from "@/data/categories";
import { fadeUp, staggerContainer } from "@/lib/motion";

/**
 * Hero as an engineering-drawing **titleblock**. The layout borrows the corner
 * block of a technical drawing: a ruled specification strip (catalog no.,
 * revision, categories, date) frames a large display headline. Drafting-blue
 * accent only; a blueprint grid grounds the section. No gradient text, no glass
 * card, no badge-over-headline — deliberately outside the generic hub template.
 */
export function Hero({ toolCount }: { toolCount: number }) {
  const { open } = useCommandPalette();
  const router = useRouter();
  const reduce = useReducedMotion();

  function randomTool() {
    const tool = allTools[Math.floor(Math.random() * allTools.length)]!;
    toast("Surprise!", { description: `Opening ${tool.title}` });
    router.push(tool.href);
  }

  return (
    <section className="blueprint-field relative overflow-hidden border-b border-[var(--color-border)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_90%_70%_at_20%_0%,black,transparent)]"
        style={{
          background:
            "radial-gradient(circle at 20% 0%, var(--glow), transparent 55%)",
        }}
      />

      <Container className="relative py-16 sm:py-24">
        {/* Titleblock top rule: drawing identity strip */}
        <motion.div
          variants={reduce ? undefined : staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            variants={fadeUp}
            className="mb-8 flex items-center gap-3 border-b border-[var(--color-border)] pb-3 font-mono text-[11px] tracking-wide text-[var(--color-muted-foreground)]"
          >
            <span className="text-[var(--color-primary)]">◈</span>
            <span className="uppercase">asrarul.tools</span>
            <span className="text-[var(--color-border)]">/</span>
            <span className="uppercase">catalog index</span>
            <span className="ml-auto hidden sm:inline">
              REV 2026.07 · {String(toolCount).padStart(3, "0")} SHEETS
            </span>
          </motion.div>

          <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            {/* Drawing title */}
            <div className="max-w-3xl">
              <motion.h1
                variants={fadeUp}
                className="font-display font-semibold text-balance"
                style={{ fontSize: "var(--text-display)", lineHeight: 0.98 }}
              >
                A workshop of
                <br />
                <span className="text-[var(--color-primary)]">
                  interactive tools
                </span>
                , drawn to spec.
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="mt-6 max-w-xl text-lg text-pretty text-[var(--color-muted-foreground)]"
              >
                Philosophy, engineering, economics, and general-purpose
                instruments — each built on real analysis, measured to the
                millimetre, and fast enough to think with.
              </motion.p>

              <motion.div
                variants={fadeUp}
                className="mt-8 flex flex-wrap items-center gap-2.5"
              >
                <button
                  type="button"
                  onClick={open}
                  className="group flex items-center gap-2 rounded-md bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-[var(--color-primary-foreground)] transition-transform active:scale-[0.98]"
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
                  className="flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-medium transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                >
                  <Shuffle className="size-4" aria-hidden="true" />
                  Open one at random
                </button>
              </motion.div>
            </div>

            {/* Specification block — ruled cells, like a drawing's titleblock */}
            <motion.dl
              variants={fadeUp}
              className="hidden w-[260px] overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] font-mono text-xs lg:block"
            >
              <div className="flex items-stretch border-b border-[var(--color-border)]">
                <div className="flex-1 border-r border-[var(--color-border)] px-3 py-2">
                  <dt className="microlabel">Sheets</dt>
                  <dd className="readout mt-1 text-2xl font-semibold text-[var(--color-foreground)]">
                    {String(toolCount).padStart(2, "0")}
                  </dd>
                </div>
                <div className="flex-1 px-3 py-2">
                  <dt className="microlabel">Sections</dt>
                  <dd className="readout mt-1 text-2xl font-semibold text-[var(--color-foreground)]">
                    {String(categories.length).padStart(2, "0")}
                  </dd>
                </div>
              </div>
              {categories.map((c, i) => (
                <a
                  key={c.id}
                  href={`/?category=${c.id}`}
                  className="group flex items-center justify-between border-b border-[var(--color-border)] px-3 py-2 text-[var(--color-muted-foreground)] transition-colors last:border-b-0 hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-[var(--color-primary)]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className="size-1.5"
                      style={{ backgroundColor: c.accent }}
                    />
                    {c.label}
                  </span>
                  <span className="opacity-40 transition-opacity group-hover:opacity-100">
                    →
                  </span>
                </a>
              ))}
            </motion.dl>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
