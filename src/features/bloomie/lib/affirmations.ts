export interface Affirmation {
  id: string;
  /** May contain `{name}`, interpolated with her nickname at render time. */
  text: string;
  why: string;
  reflection: string;
}

export const AFFIRMATIONS: Affirmation[] = [
  {
    id: "not-everything-today",
    text: "You don't have to understand everything today to become a brilliant doctor.",
    why: "Medicine is learned over years, not in a single session. Feeling behind right now says nothing about where you'll end up.",
    reflection:
      "What's one small thing you *do* understand better than you did last month?",
  },
  {
    id: "allowed-to-rest",
    text: "{name}, you are allowed to rest without earning it first.",
    why: "Rest isn't a reward for finishing — it's part of how you keep going. Burnout helps no one, least of all your future patients.",
    reflection: "What would 20 minutes of real rest look like for you today?",
  },
  {
    id: "pace-is-yours",
    text: "Your pace is the right pace for your life, not anyone else's.",
    why: "Comparing your chapter 3 to someone else's chapter 10 will always feel unfair — because it is.",
    reflection:
      "Who are you comparing yourself to right now, and what don't you know about their chapter 1?",
  },
  {
    id: "mistakes-are-data",
    text: "A wrong answer on a mock test is information, not a verdict on who you are.",
    why: "Every clinician who's ever practiced has been wrong before — repeatedly. That's how judgment is built.",
    reflection:
      "What's one mistake this week that actually taught you something useful?",
  },
  {
    id: "proud-of-ordinary",
    text: "You're allowed to be proud of a quiet, ordinary day.",
    why: "Growth isn't always dramatic. Showing up consistently, even unremarkably, is still showing up.",
    reflection:
      "What's one unremarkable thing you did today that still counts?",
  },
  {
    id: "not-behind",
    text: "Feeling behind and being behind are not the same thing.",
    why: "Anxiety narrates a worse story than reality usually is. Your actual progress is more solid than it feels right now.",
    reflection:
      "If a friend told you her exact study schedule, would you really think she was behind?",
  },
  {
    id: "imposter-is-a-feeling",
    text: "Imposter syndrome is a feeling, not a fact about your competence.",
    why: "Almost every med student feels like a fraud at some point — usually right around the people who are doing just fine.",
    reflection: "What's one piece of real evidence that you belong here?",
  },
  {
    id: "small-steps-count",
    text: "One small step still counts as a real step.",
    why: "You don't need a perfect, dramatic effort today. You need the next small thing.",
    reflection:
      "What's the smallest version of today's task you could start with?",
  },
  {
    id: "future-you-proud",
    text: "Future you is already a little proud of today you for showing up.",
    why: "The version of you on the other side of this exam, this rotation, this year — she remembers that you kept going.",
    reflection: "What would future-you want you to know right now?",
  },
  {
    id: "not-a-machine",
    text: "You are becoming a doctor, not a machine — tiredness doesn't disqualify you.",
    why: "Exhaustion is a sign you're human and working hard, not a sign you're failing.",
    reflection:
      "Where in your day could you build in five honest minutes of nothing?",
  },
  {
    id: "worth-outside-grades",
    text: "Your worth was never actually tied to a percentage.",
    why: "Grades measure a performance on a particular day. They don't measure your character, your care, or your future as a doctor.",
    reflection: "What's something about you a grade could never capture?",
  },
  {
    id: "brave-to-keep-going",
    text: "Choosing to keep going on a hard day is its own kind of brave.",
    why: "It's easy to look strong on an easy day. Showing up tired, anxious, or discouraged — and still trying — is the real thing.",
    reflection: "What did it take out of you to show up today?",
  },
  {
    id: "learning-is-nonlinear",
    text: "Learning medicine is not a straight line, and it was never supposed to be.",
    why: "Some weeks click, some weeks feel like nothing sticks. Both are part of the same process.",
    reflection:
      "Think of a topic that felt impossible once and makes sense now. What changed?",
  },
  {
    id: "no-one-has-it-figured-out",
    text: "No one around you has it as figured out as it looks from the outside.",
    why: "Everyone's highlight reel hides their own 2am doubts. You're comparing your backstage to their stage.",
    reflection:
      "What's a struggle you're hiding that someone else might also be hiding?",
  },
  {
    id: "soft-with-yourself",
    text: "You're allowed to be as soft with yourself as you are with your patients-to-be.",
    why: "You'll extend endless patience to people you've never met. You deserve at least that much from yourself.",
    reflection:
      "What would you say to a junior who was struggling exactly like you are right now?",
  },
  {
    id: "enough-today",
    text: "What you did today was enough, even if it wasn't everything.",
    why: '"Enough" is a kinder, more honest standard than "everything" — and it\'s the one that\'s actually sustainable.',
    reflection: "What's one thing from today that was genuinely enough?",
  },
  {
    id: "fear-and-capable",
    text: "You can feel afraid of failing and still be fully capable.",
    why: "Fear doesn't cancel out competence. The two can sit in the same room together.",
    reflection: "What's something you've done well *despite* feeling afraid?",
  },
  {
    id: "not-a-burden",
    text: "Needing support doesn't make you a burden — it makes you human.",
    why: "Medicine asks a lot of the people studying it. Leaning on someone isn't weakness, it's how anyone gets through hard things.",
    reflection:
      "Who's one person you could be a little more honest with about how you're doing?",
  },
  {
    id: "consistency-over-intensity",
    text: "A little, consistently, beats a lot, rarely.",
    why: "You don't need a heroic 12-hour day to make progress. Small, steady effort compounds.",
    reflection:
      "What's a realistic, repeatable study block you could protect this week?",
  },
  {
    id: "doubt-is-not-truth",
    text: "Your doubts are loud right now, but loud isn't the same as true.",
    why: "Anxious thoughts tend to shout. That volume is not evidence.",
    reflection:
      "What's one doubt you're having today that you could gently fact-check?",
  },
  {
    id: "allowed-to-celebrate-small",
    text: "A small win is still a win worth celebrating.",
    why: "Waiting for a huge milestone to feel proud means missing most of your actual progress.",
    reflection:
      "What's one small thing from this week you haven't given yourself credit for yet?",
  },
  {
    id: "bloom-at-your-own-time",
    text: "Flowers don't bloom on a schedule, and neither do you.",
    why: "Some things take the time they take. That's not falling behind — that's just how growing works.",
    reflection:
      "What's something in you that's quietly growing, even if it doesn't show yet?",
  },
  {
    id: "caring-this-much",
    text: "The fact that you care this much is already a good sign for the doctor you'll become.",
    why: "The exhaustion, the self-doubt, the late nights — they come from caring deeply about doing this well. That care matters.",
    reflection:
      "What does your effort today say about what kind of doctor you want to be?",
  },
  {
    id: "today-is-just-today",
    text: "Today is just today — it doesn't get to decide your whole story.",
    why: "One hard day, one bad test, one rough week: none of it is the final chapter.",
    reflection:
      "If today were just one page in a much longer book, what would you want the next page to say?",
  },
];

export function interpolate(text: string, name: string): string {
  return text.replace(/\{name\}/g, name.trim() || "friend");
}

export function getAffirmation(id: string): Affirmation {
  return AFFIRMATIONS.find((a) => a.id === id) ?? AFFIRMATIONS[0]!;
}

/** Deterministic pick from the date alone — "today's" affirmation needs no
 * randomness (and so no purity concerns) on first render; only the
 * "new affirmation" button needs real randomness, in an event handler. */
export function dailyAffirmationId(dateKey: string): string {
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = (hash * 31 + dateKey.charCodeAt(i)) >>> 0;
  }
  return AFFIRMATIONS[hash % AFFIRMATIONS.length]!.id;
}

export function randomAffirmationId(excludeId?: string): string {
  const pool = excludeId
    ? AFFIRMATIONS.filter((a) => a.id !== excludeId)
    : AFFIRMATIONS;
  return pool[Math.floor(Math.random() * pool.length)]!.id;
}
