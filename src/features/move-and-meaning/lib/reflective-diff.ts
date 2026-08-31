import type { UciInfo } from "../types";

/**
 * Deterministic, template-based reflective diff — no network call, no LLM,
 * no backend. This matches the site's fully client-side architecture (the
 * engine itself was an explicit "no API key needed" requirement, and nothing
 * else in this codebase talks to a server). It compares cheap signals in the
 * student's free-text guess against the engine's `UciInfo` and composes a
 * short paragraph from fixed sentence fragments, rather than generating
 * open-ended prose from scratch.
 */

export interface ReflectiveDiffInput {
  studentGuess: string;
  info: UciInfo | null;
  materialSwingCp: number;
  isCapture: boolean;
  isCheck: boolean;
}

const HEDGE_WORDS = [
  "maybe",
  "i think",
  "probably",
  "not sure",
  "guess",
  "might",
];

function mentionsAny(text: string, terms: string[]): boolean {
  const lower = text.toLowerCase();
  return terms.some((term) => lower.includes(term));
}

export function summarizeEngineTake(info: UciInfo | null): string {
  if (!info) return "the engine hasn't finished analyzing this position yet";
  if (info.scoreMate !== null) {
    return info.scoreMate > 0
      ? `a forced mate in ${Math.abs(info.scoreMate)} for the side to move`
      : `a forced mate against the side to move in ${Math.abs(info.scoreMate)}`;
  }
  const cp = info.scoreCp ?? 0;
  if (Math.abs(cp) < 30) return "a roughly balanced position";
  const pawns = (Math.abs(cp) / 100).toFixed(1);
  return cp > 0
    ? `an edge of about ${pawns} pawns for White`
    : `an edge of about ${pawns} pawns for Black`;
}

export function generateReflectiveDiff(input: ReflectiveDiffInput): string {
  const { studentGuess, info, materialSwingCp, isCheck } = input;
  const engineTake = summarizeEngineTake(info);
  const guess = studentGuess.trim();

  if (!guess) {
    return `You didn't record a guess before checking, so there's nothing to compare — the engine sees ${engineTake}.`;
  }

  const hedged = mentionsAny(guess, HEDGE_WORDS);
  const mentionedMaterial = mentionsAny(guess, [
    "material",
    "piece",
    "pawn",
    "up",
    "down",
    "win a",
    "lose a",
  ]);
  const mentionedKing = mentionsAny(guess, ["king", "safety", "mate", "check"]);
  const wordCount = guess.split(/\s+/).filter(Boolean).length;

  const parts: string[] = [
    `You said: "${guess}" The engine sees ${engineTake}.`,
  ];

  if (isCheck && !mentionedKing) {
    parts.push(
      "This move gives check, but your read didn't mention king safety — did you calculate the king's escape squares, or read the position more generally?",
    );
  }
  if (Math.abs(materialSwingCp) >= 200 && !mentionedMaterial) {
    parts.push(
      "There's a real material swing here your guess didn't touch on — did you see the capture, or evaluate the position on feel alone?",
    );
  }
  if (hedged) {
    parts.push(
      "Your own language hedged ('maybe', 'I think') — that hesitation is worth reflecting on: was the position unclear, or was it your confidence reading it?",
    );
  }
  if (wordCount <= 4) {
    parts.push(
      "Your guess was brief. A single phrase can still be a real intuition — try unpacking what cued it.",
    );
  }
  if (parts.length === 1) {
    parts.push(
      "Your read and the engine's roughly line up in spirit — the interesting question now is whether you got there by calculation or by feel.",
    );
  }

  return parts.join(" ");
}
