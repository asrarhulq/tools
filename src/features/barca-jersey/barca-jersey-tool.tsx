"use client";

import { JsonLd } from "@/components/seo/json-ld";
import { softwareApplicationSchema } from "@/lib/json-ld";
import type { ToolWithHref } from "@/types/tool";
import { JerseyStudio } from "./ui/jersey-studio";

/**
 * A little gift for a specific Barça fan (see `ayas-chess-board` and
 * `bloomie` for the other two) — a procedurally modeled jersey, no external
 * 3D asset or image, with her name on the back by default. The torso is one
 * `LatheGeometry` revolve (`lib/geometry.ts`) painted by a canvas texture
 * (`lib/texture.ts`): blaugrana stripes, collar/hem trim, a crest badge up
 * front, her name and number on the back.
 */
export function BarcaJerseyTool({ tool }: { tool: ToolWithHref }) {
  return (
    <>
      <JsonLd data={softwareApplicationSchema(tool)} />
      <JerseyStudio />
    </>
  );
}
