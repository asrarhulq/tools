"use client";

import type { ToolWithHref } from "@/types/tool";
import { JsonLd } from "@/components/seo/json-ld";
import { softwareApplicationSchema } from "@/lib/json-ld";
import { GanttStoreProvider } from "./state/store";
import { Workspace } from "./ui/workspace";

/**
 * Entry point for Project Timeline & Gantt Studio, lazy-loaded by the tool
 * router so its date-fns/jsPDF (and lazy xlsx) payload never touches any other
 * route. The whole tool is client-side and persists to localStorage.
 */
export function GanttStudioTool({ tool }: { tool: ToolWithHref }) {
  return (
    <GanttStoreProvider>
      <JsonLd data={softwareApplicationSchema(tool)} />
      <Workspace />
    </GanttStoreProvider>
  );
}
