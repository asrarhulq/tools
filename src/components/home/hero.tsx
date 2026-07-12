"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Command, Shuffle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { useCommandPalette } from "@/components/command/command-palette-provider";
import { allTools } from "@/lib/tools";
import { fadeUp, staggerContainer } from "@/lib/motion";

/** Animated hero with the primary calls to action (search + random tool). */
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
      <div className="hero-aurora" aria-hidden="true" />
      <Container className="relative py-24 sm:py-32">
        <motion.div
          variants={reduce ? undefined : staggerContainer}
          initial="hidden"
          animate="visible"
          className="mx-auto max-w-3xl text-center"
        >
          <motion.p
            variants={fadeUp}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-xs text-[var(--color-muted-foreground)]"
          >
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--color-primary)] opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-[var(--color-primary)]" />
            </span>
            {toolCount} tools and growing
          </motion.p>

          <motion.h1
            variants={fadeUp}
            className="font-semibold tracking-tight text-balance"
            style={{ fontSize: "var(--text-display)", lineHeight: 1.05 }}
          >
            A handcrafted collection of{" "}
            <span className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] bg-clip-text text-transparent">
              interactive tools
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mx-auto mt-6 max-w-xl text-lg text-pretty text-[var(--color-muted-foreground)]"
          >
            Philosophy, engineering, economics, and general-purpose tools —
            fast, beautiful, and a joy to use.
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <Button size="lg" onClick={open}>
              <Command className="size-4" aria-hidden="true" />
              Search tools
            </Button>
            <Button size="lg" variant="outline" onClick={randomTool}>
              <Shuffle className="size-4" aria-hidden="true" />
              Random tool
            </Button>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}
