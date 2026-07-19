"use client";

import type { ToolWithHref } from "@/types/tool";
import { JsonLd } from "@/components/seo/json-ld";
import { softwareApplicationSchema } from "@/lib/json-ld";
import { Workspace } from "./ui/workspace";

/**
 * Entry point for the Argument Mapper. Fully client-side and self-contained —
 * the graph store, logic engine, and React Flow canvas all run in the browser,
 * so this is loaded via a client-only dynamic import (React Flow + ELK never
 * touch SSR or any other tool's bundle).
 */
export function ArgumentMapperTool({ tool }: { tool: ToolWithHref }) {
  return (
    <>
      <JsonLd data={softwareApplicationSchema(tool)} />
      <Workspace />
    </>
  );
}
