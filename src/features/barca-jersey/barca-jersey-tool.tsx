"use client";

import { JsonLd } from "@/components/seo/json-ld";
import { softwareApplicationSchema } from "@/lib/json-ld";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { ToolWithHref } from "@/types/tool";
import { GATE_STORAGE_KEY } from "./lib/gate";
import { JerseyGate } from "./ui/jersey-gate";
import { JerseyStudio } from "./ui/jersey-studio";

/**
 * A little gift for a specific Barça fan (see `ayas-chess-board` and
 * `bloomie` for the other two) — a procedurally modeled jersey, no external
 * 3D asset or image, with her name on the back by default. The torso is a
 * hand-built parametric surface (`lib/geometry.ts`) painted by a canvas
 * texture (`lib/texture.ts`): blaugrana stripes, collar/hem trim, a crest
 * badge up front, her name and number on the back.
 *
 * Gated the same way as the other two: the whole tool sits behind the
 * password, not just the editor, so nobody browsing General can tell what
 * it actually is without it.
 */
export function BarcaJerseyTool({ tool }: { tool: ToolWithHref }) {
  const [unlocked, setUnlocked] = useLocalStorage(GATE_STORAGE_KEY, false);

  if (!unlocked) {
    return (
      <>
        <JsonLd data={softwareApplicationSchema(tool)} />
        <JerseyGate onUnlock={() => setUnlocked(true)} />
      </>
    );
  }

  return (
    <>
      <JsonLd data={softwareApplicationSchema(tool)} />
      <JerseyStudio />
    </>
  );
}
