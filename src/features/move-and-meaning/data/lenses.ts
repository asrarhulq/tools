import type { PhilosopherLens, PromptContext } from "../types";

/**
 * Six lenses from the PHIL 29300 reading list. `defaultPrompt` is the
 * course's own seed language, kept verbatim. `promptFor` branches on cheap
 * signals already available on any position (book-move vs. novel, a check,
 * a material swing, a flagged reason, whether the student already ventured
 * an unassisted guess) so a lens feels tailored to the moment rather than
 * static — never a lecture, always a question to write from.
 */

export const LENSES: readonly PhilosopherLens[] = [
  {
    id: "ryle",
    name: "Gilbert Ryle",
    years: "1900–1976",
    frameworkTag: "Knowing-how vs. knowing-that",
    blurb:
      "Argued that skilled performance is its own kind of knowledge, not applied theory.",
    defaultPrompt:
      "Did you play this because you know the rule, or because you know how to feel the position? Try explaining your last move without naming any opening theory.",
    promptFor: (ctx: PromptContext) =>
      ctx.isBookMove
        ? "This is a known theoretical move. Did you play it because you know the rule, or because you know how to feel the position — try explaining your last move without naming any opening theory."
        : "You're off known theory here, so this move came from feel rather than a memorized rule. Can you describe what you were feeling for, in plain terms, without borrowing chess vocabulary?",
  },
  {
    id: "dewey",
    name: "John Dewey",
    years: "1859–1952",
    frameworkTag: "Experience and reflection",
    blurb:
      "Held that genuine learning comes from reflecting on lived experience, not from rules absorbed in advance.",
    defaultPrompt:
      "What did this position teach you that you didn't know before you sat down? Frame this as reflection-in-action vs. reflection-on-action.",
    promptFor: (ctx: PromptContext) =>
      ctx.flaggedReason
        ? `You flagged this position as "${ctx.flaggedReason}" — was that recognition happening in the middle of the position (reflection-in-action), or only now, looking back (reflection-on-action)?`
        : "What did this position teach you that you didn't know before you sat down? Frame this as reflection-in-action vs. reflection-on-action.",
  },
  {
    id: "nguyen",
    name: "C. Thi Nguyen",
    years: "contemporary",
    frameworkTag: "Striving play vs. achievement play",
    blurb:
      "Distinguishes playing for the struggle of an activity from playing for the achievement it produces.",
    defaultPrompt:
      "Were you playing to win this game, or playing to experience the struggle of the position itself?",
    promptFor: (ctx: PromptContext) =>
      ctx.materialSwingCp >= 300
        ? "You're up significant material here — does the position start to feel like a chore to convert, or is the struggle itself still what's holding your attention?"
        : "Were you playing to win this game, or playing to experience the struggle of the position itself?",
  },
  {
    id: "suits",
    name: "Bernard Suits",
    years: "1925–2007",
    frameworkTag: "The lusory attitude",
    blurb:
      "Defined games as the voluntary acceptance of unnecessary obstacles, for the sake of the activity they make possible.",
    defaultPrompt:
      "Chess's rules create obstacles you don't need to accept. Why did you accept them here — what made this position worth struggling over?",
    promptFor: (ctx: PromptContext) =>
      ctx.isCheck
        ? "You're in check — the rules just forced a response you didn't choose. Does that feel different from the obstacles you accepted freely a few moves ago?"
        : "Chess's rules create obstacles you don't need to accept. Why did you accept them here — what made this position worth struggling over?",
  },
  {
    id: "wittgenstein",
    name: "Ludwig Wittgenstein",
    years: "1889–1951",
    frameworkTag: "Rule-following and language-games",
    blurb:
      "Treated meaning and correctness as constituted by shared practices, not by facts outside the practice.",
    defaultPrompt:
      "Is there a 'best' move here in the way there's a correct answer to a math problem, or is 'best' only meaningful within the game's own rules?",
    promptFor: (ctx: PromptContext) =>
      ctx.isBookMove
        ? "This move has a name and a known evaluation. Does that make it 'correct' the way 2+2=4 is correct, or only correct relative to a game whose rules you've agreed to play by?"
        : "Is there a 'best' move here in the way there's a correct answer to a math problem, or is 'best' only meaningful within the game's own rules?",
  },
  {
    id: "hurka",
    name: "Thomas Hurka",
    years: "contemporary",
    frameworkTag: "Games, virtue, and achievement",
    blurb:
      "Explores whether the difficulty of an achievement adds intrinsic value to it, beyond helping win.",
    defaultPrompt:
      "Does the difficulty of finding this move matter morally/virtuously, or only instrumentally — only because it helps you win?",
    promptFor: (ctx: PromptContext) =>
      ctx.studentGuess
        ? "You worked this out under uncertainty before checking the engine. Does the fact that it was hard to find add anything to its value, or would the position be just as well-played if you'd found it instantly?"
        : "Does the difficulty of finding this move matter morally/virtuously, or only instrumentally — only because it helps you win?",
  },
];

const lensById = new Map(LENSES.map((lens) => [lens.id, lens]));

export function generateLensPrompt(
  id: PhilosopherLens["id"],
  ctx: PromptContext,
): string {
  const lens = lensById.get(id);
  if (!lens) return "";
  try {
    return lens.promptFor(ctx);
  } catch {
    return lens.defaultPrompt;
  }
}
