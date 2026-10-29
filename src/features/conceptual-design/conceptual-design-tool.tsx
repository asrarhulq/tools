"use client";

import { JsonLd } from "@/components/seo/json-ld";
import { softwareApplicationSchema } from "@/lib/json-ld";
import type { ToolWithHref } from "@/types/tool";
import { Lab3Guide } from "./lab3";

/**
 * A complete, interactive guide to Pahl & Beitz conceptual design (ME
 * 36400's Lab 3): six step tools, a mission map, a slide atlas, "where am
 * I?"/"I'm stuck" help, a Ctrl/Cmd-K jump palette, and a Vault that prints
 * Appendices A-F. Entirely self-contained — its own scoped CSS (under
 * `.l3-root`, so it can't leak into or be leaked into by the site's own
 * styles), its own localStorage persistence, no backend. The `pollUrl`
 * prop (an optional live class-poll endpoint) is deliberately omitted:
 * this site has no backend, and the component already degrades cleanly
 * without it.
 */
export function ConceptualDesignTool({ tool }: { tool: ToolWithHref }) {
  return (
    <>
      <JsonLd data={softwareApplicationSchema(tool)} />
      <Lab3Guide
        title="Conceptual Design"
        storageKey="asrarul-tools:conceptual-design:v1"
      />
    </>
  );
}
