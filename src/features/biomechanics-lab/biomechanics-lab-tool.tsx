"use client";

import type { ToolWithHref } from "@/types/tool";
import { JsonLd } from "@/components/seo/json-ld";
import { softwareApplicationSchema } from "@/lib/json-ld";
import { BiomechStoreProvider } from "./state/store";
import { Workspace } from "./ui/workspace";

/**
 * Entry point for the Human Biomechanics Lab, lazy-loaded by the tool router so
 * its Three.js / jsPDF payload never touches any other route. Fully client-side.
 */
export function BiomechanicsLabTool({ tool }: { tool: ToolWithHref }) {
  return (
    <BiomechStoreProvider>
      <JsonLd data={softwareApplicationSchema(tool)} />
      <Workspace />
    </BiomechStoreProvider>
  );
}
