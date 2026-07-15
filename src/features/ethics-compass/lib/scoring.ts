import type {
  Judgment,
  MoralScores,
  MoralTheory,
  TheoryProfile,
} from "../types";
import { DILEMMAS } from "../data/dilemmas";
import type { CompassZone } from "../types";

/** A fresh zeroed score sheet. */
export function emptyScores(): MoralScores {
  return { mill: 0, kant: 0, theological: 0, aristotle: 0, relativism: 0 };
}

/** Add the points a chosen justification awards into a score sheet (pure). */
export function applyChoice(
  scores: MoralScores,
  dilemmaIndex: number,
  judgment: Judgment,
  zone: CompassZone,
): MoralScores {
  const dilemma = DILEMMAS[dilemmaIndex];
  if (!dilemma) return scores;
  const next = { ...scores };
  const awarded = dilemma.options[judgment][zone].scores;
  for (const [theory, val] of Object.entries(awarded)) {
    next[theory as MoralTheory] += val ?? 0;
  }
  return next;
}

/** The theory whose score is highest (ties resolved by declaration order). */
export function dominantTheory(scores: MoralScores): MoralTheory {
  let best: MoralTheory = "mill";
  let max = -Infinity;
  for (const theory of Object.keys(scores) as MoralTheory[]) {
    if (scores[theory] > max) {
      max = scores[theory];
      best = theory;
    }
  }
  return best;
}

export const THEORY_PROFILES: Record<MoralTheory, TheoryProfile> = {
  mill: {
    title: "Classical Utilitarianism — John Stuart Mill",
    description:
      "You optimize for collective flourishing. To you, morality is elegant arithmetic: an act is right if it produces the maximum amount of happiness and safety for the greatest number of minds. The ends heavily shape the integrity of your means.",
    quote:
      "Actions are right in proportion as they tend to promote happiness, wrong as they tend to produce the reverse of happiness.",
  },
  kant: {
    title: "Deontological Ethics — Immanuel Kant",
    description:
      "You are guided by unyielding duty. You believe morality rests on absolute, categorical rules that must never be bartered away for convenience or happy outcomes. In your worldview, an act is inherently right or wrong in itself.",
    quote:
      "Act only according to that maxim whereby you can at the same time will that it should become a universal law.",
  },
  theological: {
    title: "Strong Theological Voluntarism — William of Ockham",
    description:
      "Your moral anchor is purely metaphysical. You believe that goodness is not born from human logic, nature, or social convention, but is directly created by divine mandate. An action is right precisely because an infinite, supreme authority decrees it so.",
    quote:
      "God does not will an action because it is right; rather, an action is right precisely because God wills it.",
  },
  relativism: {
    title: "Normative Cultural Relativism — Protagoras & Herodotus",
    description:
      "You recognize morality as an evolution of social agreement. You reject the idea of cosmic, objective rules applying to everyone universally. For you, an action is right or wrong solely relative to the consensus, traditions, and standards of a specific culture.",
    quote:
      "Custom is king over all. To think there is an absolute standard outside a society's own consensus is an illusion.",
  },
  aristotle: {
    title: "Virtue Ethics — Aristotle",
    description:
      "You focus on character over cold calculation or strict flowcharts. You believe ethics is about developing a noble, balanced disposition — cultivating wisdom, temperance, and courage to navigate the golden mean of the human experience.",
    quote:
      "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
  },
};

/** Human-readable labels for the four compass axes. */
export const ZONE_LABELS: Record<CompassZone, string> = {
  zoneA: "Utility",
  zoneB: "Duty",
  zoneC: "Divine Command",
  zoneD: "Culture / Virtue",
};
