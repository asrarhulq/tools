"use client";

import { useOrrery } from "../state/orrery-context";
import { Card } from "./primitives";
import { Toggle } from "./primitives";

export function ViewSettingsPanel() {
  const {
    showOrbits,
    toggleOrbits,
    showLabels,
    toggleLabels,
    showBelt,
    toggleBelt,
    showMoons,
    toggleMoons,
    showHabitableZone,
    toggleHabitableZone,
  } = useOrrery();

  return (
    <Card title="Display">
      <div className="space-y-0.5">
        <Toggle
          label="Orbit paths"
          checked={showOrbits}
          onChange={toggleOrbits}
        />
        <Toggle label="Labels" checked={showLabels} onChange={toggleLabels} />
        <Toggle
          label="Asteroid belt"
          checked={showBelt}
          onChange={toggleBelt}
        />
        <Toggle label="Moons" checked={showMoons} onChange={toggleMoons} />
        <Toggle
          label="Habitable zone"
          checked={showHabitableZone}
          onChange={toggleHabitableZone}
        />
      </div>
      <p className="mt-3 border-t border-[var(--color-border)] pt-3 text-xs leading-relaxed text-[var(--color-muted-foreground)]">
        &quot;True scale&quot; distances are real relative AU — the outer
        planets sit far outside the default view, which is the point: scroll out
        (or follow a planet) to feel how empty the solar system really is. Body
        sizes are compressed in both modes so nothing rounds to an invisible
        dot. The habitable zone is the Sun&apos;s conservative band where a
        rocky planet could hold liquid surface water — Earth sits well inside
        it; Venus and Mars sit just outside either edge.
      </p>
    </Card>
  );
}
