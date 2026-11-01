"use client";

import { JsonLd } from "@/components/seo/json-ld";
import { softwareApplicationSchema } from "@/lib/json-ld";
import type { ToolWithHref } from "@/types/tool";
import ElectronicClock from "./ElectronicClock";

/**
 * An interactive guide to a four-digit, AT89C2051-based electronic clock
 * kit: a tappable board, a six-stage power-up journey, a soldering guide,
 * and a Lab with a real-time circuit simulator, a guided debugger, and a
 * mystery-board challenge. Entirely self-contained — its own CSS module
 * (`clock.module.css`, scoped via `.root`), its own localStorage
 * persistence (`eclock:*` keys), no backend. `--stick` is set to the
 * site's own 64px sticky header height so the guide's internal sticky
 * header and sidebars sit below it instead of under it.
 */
export function ElectronicClockTool({ tool }: { tool: ToolWithHref }) {
  return (
    <>
      <JsonLd data={softwareApplicationSchema(tool)} />
      <ElectronicClock />
    </>
  );
}
