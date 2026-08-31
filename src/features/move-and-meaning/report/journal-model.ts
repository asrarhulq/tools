import { LENSES } from "../data/lenses";
import type { MmState } from "../store";
import type { JournalEntry, JournalModel } from "../types";

type JournalSourceState = Pick<
  MmState,
  "pgnHeaders" | "history" | "mode" | "unassistedGuesses" | "lensResponses"
>;

/** Only positions with a note, a flag, or a written lens response make the cut. */
export function buildJournalModel(state: JournalSourceState): JournalModel {
  const { pgnHeaders, history, mode, unassistedGuesses, lensResponses } = state;

  const entries: JournalEntry[] = history
    .filter(
      (m) =>
        m.flagged ||
        m.comment.trim().length > 0 ||
        LENSES.some((lens) => lensResponses[`${m.ply}:${lens.id}`]?.trim()),
    )
    .map((m) => ({
      ply: m.ply,
      san: m.san,
      comment: m.comment,
      flagged: m.flagged,
      motifs: m.motifs,
      unassistedGuess: unassistedGuesses[m.ply],
      lensResponses: LENSES.filter((lens) =>
        lensResponses[`${m.ply}:${lens.id}`]?.trim(),
      ).map((lens) => ({
        lensId: lens.id,
        lensName: lens.name,
        prompt: lens.defaultPrompt,
        response: lensResponses[`${m.ply}:${lens.id}`]!,
      })),
    }));

  return {
    title: "Move & Meaning — Reflective Journal",
    players: {
      white: pgnHeaders.White ?? "White",
      black: pgnHeaders.Black ?? "Black",
    },
    date: pgnHeaders.Date ?? new Date().toISOString().slice(0, 10),
    mode,
    entries,
  };
}
