"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Bell, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { ToolWithHref } from "@/types/tool";
import { getCategory } from "@/data/categories";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { fadeUp, staggerContainer } from "@/lib/motion";

/**
 * Polished "Coming Soon" state shown for placeholder tools. Matches the site's
 * premium look and gives visitors a clear, delightful holding experience until
 * the real tool ships in this same route.
 */
export function ComingSoon({ tool }: { tool: ToolWithHref }) {
  const category = getCategory(tool.category);
  const reduce = useReducedMotion();

  return (
    <motion.div
      variants={reduce ? undefined : staggerContainer}
      initial="hidden"
      animate="visible"
      className="mx-auto max-w-2xl text-center"
    >
      <motion.span
        variants={fadeUp}
        className="mx-auto flex size-20 items-center justify-center rounded-2xl"
        style={{
          backgroundColor: `color-mix(in oklab, ${category.accent} 15%, transparent)`,
          color: category.accent,
        }}
      >
        <Icon name={tool.icon} className="size-9" aria-hidden="true" />
      </motion.span>

      <motion.div
        variants={fadeUp}
        className="mt-6 flex items-center justify-center gap-2"
      >
        <Badge variant="primary">
          <Sparkles className="size-3" aria-hidden="true" />
          Coming soon
        </Badge>
        <Badge variant="outline">{category.label}</Badge>
        <Badge variant={tool.difficulty}>{tool.difficulty}</Badge>
      </motion.div>

      <motion.h1
        variants={fadeUp}
        className="mt-5 font-semibold tracking-tight text-balance"
        style={{ fontSize: "var(--text-h2)" }}
      >
        {tool.title}
      </motion.h1>

      <motion.p
        variants={fadeUp}
        className="mx-auto mt-4 max-w-lg text-pretty text-[var(--color-muted-foreground)]"
      >
        {tool.longDescription ?? tool.description}
      </motion.p>

      <motion.div variants={fadeUp} className="mt-8">
        <Button
          size="lg"
          onClick={() =>
            toast("We'll let you know", {
              description: `You'll be first to try ${tool.title}.`,
            })
          }
        >
          <Bell className="size-4" aria-hidden="true" />
          Notify me when it&apos;s ready
        </Button>
      </motion.div>
    </motion.div>
  );
}
