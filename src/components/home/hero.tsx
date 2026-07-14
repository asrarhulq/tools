"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Command, Shuffle, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Container } from "@/components/ui/container";
import { useCommandPalette } from "@/components/command/command-palette-provider";
import { allTools } from "@/lib/tools";
import { categories } from "@/data/categories";
import { fadeUp, staggerContainer } from "@/lib/motion";

/**
 * Editorial hero in the "precision instrument" language: a technical eyebrow,
 * a large left-aligned display headline (no gradient text), and a mono
 * category ledger on the right that reads like an index. A faint blueprint
 * grid grounds it; one restrained accent underline carries the emphasis.
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
    <section className="relative overflow-hidden border-b border-[var(--color-border)]">
      {/* Blueprint grid backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_80%_60%_at_30%_0%,black,transparent)] opacity-[0.4]"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-hair) 1px, transparent 1px), linear-gradient(90deg, var(--color-hair) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="hero-aurora opacity-60" aria-hidden="true" />

      <Container className="relative py-20 sm:py-28">
        <div className="grid items-end gap-12 lg:grid-cols-[1fr_auto]">
          {/* Headline column */}
          <motion.div
            variants={reduce ? undefined : staggerContainer}
            initial="hidden"
            animate="visible"
            className="max-w-2xl"
          >
            <motion.p
              variants={fadeUp}
              className="microlabel mb-6 flex items-center gap-2 text-[var(--color-primary)]"
            >
              <span className="inline-block h-px w-8 bg-[var(--color-primary)]" />
              asrarul.tools · index
            </motion.p>

            <motion.h1
              variants={fadeUp}
              className="font-semibold tracking-tight text-balance"
              style={{ fontSize: "var(--text-display)", lineHeight: 1.02 }}
            >
              A handcrafted
              <br />
              collection of{" "}
              <span className="relative whitespace-nowrap text-[var(--color-primary)]">
                interactive
                <svg
                  aria-hidden="true"
                  viewBox="0 0 300 12"
                  preserveAspectRatio="none"
                  className="absolute -bottom-1 left-0 h-2 w-full text-[var(--color-primary)]"
                >
                  <path
                    d="M2 8 Q 150 2 298 8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>{" "}
              tools
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-7 max-w-lg text-lg text-pretty text-[var(--color-muted-foreground)]"
            >
              Philosophy, engineering, economics, and general-purpose tools —
              engineered for speed, built with real analysis, and a joy to use.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <button
                type="button"
                onClick={open}
                className="group flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-[var(--color-primary-foreground)] shadow-sm transition-transform active:scale-[0.98]"
              >
                <Command className="size-4" aria-hidden="true" />
                Search tools
                <kbd className="ml-1 hidden rounded bg-black/15 px-1.5 py-0.5 font-mono text-[10px] sm:inline">
                  ⌘K
                </kbd>
              </button>
              <button
                type="button"
                onClick={randomTool}
                className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-medium transition-colors hover:border-[var(--color-primary)]/50 hover:text-[var(--color-primary)]"
              >
                <Shuffle className="size-4" aria-hidden="true" />
                Random tool
              </button>
            </motion.div>
          </motion.div>

          {/* Category ledger — a mono index that reinforces the instrument feel */}
          <motion.dl
            initial={reduce ? undefined : { opacity: 0, x: 12 }}
            animate={reduce ? undefined : { opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="hidden min-w-[220px] rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)]/70 p-4 backdrop-blur-sm lg:block"
          >
            <div className="mb-3 flex items-baseline justify-between border-b border-[var(--color-hair)] pb-3">
              <span className="microlabel">Catalog</span>
              <span className="readout text-2xl font-semibold text-[var(--color-foreground)]">
                {String(toolCount).padStart(2, "0")}
              </span>
            </div>
            <div className="space-y-2">
              {categories.map((c) => (
                <a
                  key={c.id}
                  href={`/?category=${c.id}`}
                  className="group flex items-center justify-between text-sm text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)]"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="size-1.5 rounded-full"
                      style={{ backgroundColor: c.accent }}
                    />
                    {c.label}
                  </span>
                  <ArrowRight className="size-3.5 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                </a>
              ))}
            </div>
          </motion.dl>
        </div>
      </Container>
    </section>
  );
}
