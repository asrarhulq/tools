"use client";

import { JsonLd } from "@/components/seo/json-ld";
import { softwareApplicationSchema } from "@/lib/json-ld";
import type { ToolWithHref } from "@/types/tool";
import { OrreryProvider } from "./state/orrery-context";
import { Workspace } from "./ui/workspace";

/**
 * Entry point mounted by the tool-content dispatcher. Everything below is
 * self-contained: real J2000 orbital elements (`data/`), a two-body Kepler
 * solver (`lib/kepler.ts`), and an R3F scene driven by a hot simulation-clock
 * ref so 60fps motion never round-trips through React state (see
 * `state/orrery-context.tsx`).
 */
export function OrreryTool({ tool }: { tool: ToolWithHref }) {
  return (
    <>
      <JsonLd data={softwareApplicationSchema(tool)} />
      <OrreryProvider>
        <Workspace />
      </OrreryProvider>
    </>
  );
}
