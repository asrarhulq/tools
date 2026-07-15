"use client";

import type { ToolWithHref } from "@/types/tool";
import { JsonLd } from "@/components/seo/json-ld";
import { softwareApplicationSchema } from "@/lib/json-ld";
import { Workspace } from "./ui/workspace";

/**
 * Entry point for the Ethics Compass. Fully client-side and self-contained —
 * the dilemma set and scoring are pure data/functions, so this stays light and
 * needs no persistence.
 */
export function EthicsCompassTool({ tool }: { tool: ToolWithHref }) {
  return (
    <>
      <JsonLd data={softwareApplicationSchema(tool)} />
      <Workspace />
    </>
  );
}
