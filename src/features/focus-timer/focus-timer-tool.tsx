"use client";

import type { ToolWithHref } from "@/types/tool";
import { JsonLd } from "@/components/seo/json-ld";
import { softwareApplicationSchema } from "@/lib/json-ld";
import { FocusStoreProvider } from "./state/store";
import { Workspace } from "./ui/workspace";

/**
 * Entry point for the Pomodoro / focus timer. All interactive state lives in
 * `FocusStoreProvider` (rAF engine + localStorage persistence); the workspace
 * composes the ring, controls, stats, settings, and focus mode. Loaded via a
 * client-only dynamic import so its timer/audio/localStorage never touch SSR.
 */
export function FocusTimerTool({ tool }: { tool: ToolWithHref }) {
  return (
    <>
      <JsonLd data={softwareApplicationSchema(tool)} />
      <FocusStoreProvider>
        <Workspace />
      </FocusStoreProvider>
    </>
  );
}
