"use client";

import { motion } from "framer-motion";
import type { ToolWithHref } from "@/types/tool";
import { staggerContainer } from "@/lib/motion";
import { ToolCard } from "./tool-card";

/** Responsive, staggered grid of tool cards. */
export function ToolGrid({ tools }: { tools: readonly ToolWithHref[] }) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {tools.map((tool) => (
        <ToolCard key={tool.id} tool={tool} />
      ))}
    </motion.div>
  );
}
