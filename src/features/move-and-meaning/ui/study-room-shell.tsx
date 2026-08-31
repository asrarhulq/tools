import type { ReactNode } from "react";
import { fontSerif } from "../fonts";
import { STUDY_PALETTE } from "../config";

/**
 * The tool's own visual identity — warm wood/brass/amber, deliberately fixed
 * regardless of the site's light/dark toggle (a "study room" doesn't have a
 * light-mode equivalent). Applies the feature-local serif font variable here
 * only, so it never bleeds into the rest of the site.
 */
export function StudyRoomShell({ children }: { children: ReactNode }) {
  return (
    <div
      className={`${fontSerif.variable} rounded-2xl border p-3 sm:p-5 lg:p-7`}
      style={{
        background: `radial-gradient(circle at 15% -10%, ${STUDY_PALETTE.panelAlt} 0%, ${STUDY_PALETTE.background} 55%, #0f0a05 100%)`,
        borderColor: STUDY_PALETTE.border,
        color: STUDY_PALETTE.text,
      }}
    >
      {children}
    </div>
  );
}
