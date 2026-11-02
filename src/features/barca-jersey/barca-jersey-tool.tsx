"use client";

import { JsonLd } from "@/components/seo/json-ld";
import { softwareApplicationSchema } from "@/lib/json-ld";
import { useLocalStorage, writeLocalStorage } from "@/hooks/use-local-storage";
import type { ToolWithHref } from "@/types/tool";
import { GATE_STORAGE_KEY as CHESS_GATE_STORAGE_KEY } from "@/features/ayas-chess-board/lib/gate";
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
 * Gated the same way as `ayas-chess-board` — same password, and the two
 * share an unlock: entering it on either one unlocks both, since they're
 * listed under the same cover name ("Algeria vs Kashmir") in the catalog.
 */
export function BarcaJerseyTool({ tool }: { tool: ToolWithHref }) {
  const [unlockedHere, setUnlocked] = useLocalStorage(GATE_STORAGE_KEY, false);
  const [unlockedViaChess] = useLocalStorage(CHESS_GATE_STORAGE_KEY, false);
  const unlocked = unlockedHere || unlockedViaChess;

  if (!unlocked) {
    return (
      <>
        <JsonLd data={softwareApplicationSchema(tool)} />
        <JerseyGate
          onUnlock={() => {
            setUnlocked(true);
            writeLocalStorage(CHESS_GATE_STORAGE_KEY, true);
          }}
        />
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
