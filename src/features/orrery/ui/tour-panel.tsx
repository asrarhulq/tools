"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useState } from "react";
import { ALL_BODIES } from "../data";
import { useOrrery } from "../state/orrery-context";
import { Card } from "./primitives";

const TOUR_IDS = [
  "sun",
  "mercury",
  "venus",
  "earth",
  "moon",
  "mars",
  "phobos",
  "jupiter",
  "io",
  "europa",
  "ganymede",
  "saturn",
  "titan",
  "uranus",
  "neptune",
  "triton",
  "pluto",
  "charon",
  "halley",
];

export function TourPanel() {
  const [index, setIndex] = useState(0);
  const { selectBody } = useOrrery();
  const id = TOUR_IDS[index % TOUR_IDS.length];
  const body = ALL_BODIES.find((b) => b.id === id);
  if (!body) return null;
  const fact = body.physical.facts[0];

  return (
    <Card title="Guided tour">
      <p className="mb-1 text-sm font-semibold">{body.name}</p>
      <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">
        {fact}
      </p>
      <div className="mt-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() =>
            setIndex((i) => (i - 1 + TOUR_IDS.length) % TOUR_IDS.length)
          }
          className="flex items-center gap-1 rounded-md border border-[var(--color-border)] px-2.5 py-1.5 text-xs font-medium hover:bg-[var(--color-muted)]"
        >
          <ArrowLeft className="size-3.5" /> Prev
        </button>
        <button
          type="button"
          onClick={() => selectBody(body.id)}
          className="rounded-md bg-[var(--color-primary)] px-3 py-1.5 text-xs font-medium text-[var(--color-primary-foreground)]"
        >
          Fly there
        </button>
        <button
          type="button"
          onClick={() => setIndex((i) => (i + 1) % TOUR_IDS.length)}
          className="flex items-center gap-1 rounded-md border border-[var(--color-border)] px-2.5 py-1.5 text-xs font-medium hover:bg-[var(--color-muted)]"
        >
          Next <ArrowRight className="size-3.5" />
        </button>
      </div>
    </Card>
  );
}
