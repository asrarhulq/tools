"use client";

import { motion } from "framer-motion";
import type { ToolWithHref } from "@/types/tool";
import { staggerContainer } from "@/lib/motion";
import { ToolCard, type ToolRowVariant } from "./tool-card";

/**
 * A **catalog index** of tools: a single ruled column of entries (not a card
 * grid), framed like a drawing index / parts list. The `variant` controls how
 * each row reads — a numbered index (default), a ranked leaderboard, or a dated
 * changelog — so sections that share this component still look distinct. The
 * name is kept as `ToolGrid` for call-site compatibility.
 */
export function ToolGrid({
  tools,
  variant = "index",
}: {
  tools: readonly ToolWithHref[];
  variant?: ToolRowVariant;
}) {
  // For the changelog, the newest entry (first, since input is date-sorted)
  // gets a NEW tag.
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      className="divide-y divide-[var(--color-hair)] overflow-hidden rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)]"
    >
      {tools.map((tool, i) => (
        <ToolCard
          key={tool.id}
          tool={tool}
          index={i}
          variant={variant}
          isNewest={variant === "changelog" && i === 0}
        />
      ))}
    </motion.div>
  );
}
