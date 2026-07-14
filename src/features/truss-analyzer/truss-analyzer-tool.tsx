"use client";

import type { ToolWithHref } from "@/types/tool";
import { JsonLd } from "@/components/seo/json-ld";
import { softwareApplicationSchema } from "@/lib/json-ld";
import { TrussStoreProvider } from "./state/store";
import { Workspace } from "./ui/workspace";

/**
 * Entry point for Truss Analysis Studio, lazy-loaded by the tool router so its
 * jsPDF payload never touches any other route. Fully client-side; the truss
 * model persists to localStorage.
 */
export function TrussAnalyzerTool({ tool }: { tool: ToolWithHref }) {
  return (
    <TrussStoreProvider>
      <JsonLd data={softwareApplicationSchema(tool)} />
      <Workspace />
    </TrussStoreProvider>
  );
}
