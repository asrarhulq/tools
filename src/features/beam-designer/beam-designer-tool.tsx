"use client";

import type { ToolWithHref } from "@/types/tool";
import { JsonLd } from "@/components/seo/json-ld";
import { softwareApplicationSchema } from "@/lib/json-ld";
import { BeamStoreProvider } from "./state/store";
import { Workspace } from "./ui/workspace";

/**
 * Entry point for the Beam Designer, lazy-loaded by the tool router so its
 * jsPDF payload never touches any other route. Fully client-side; the beam
 * model persists to localStorage.
 */
export function BeamDesignerTool({ tool }: { tool: ToolWithHref }) {
  return (
    <BeamStoreProvider>
      <JsonLd data={softwareApplicationSchema(tool)} />
      <Workspace />
    </BeamStoreProvider>
  );
}
