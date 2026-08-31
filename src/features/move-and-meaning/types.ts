import type { Color, PieceSymbol, Square } from "chess.js";

/**
 * Domain model for Philosophical Chess. Kept independent of chess.js's own `Move`
 * class so the store, persistence, and UI can stay stable even if the chess
 * engine adapter's internals change.
 */

export type { Color, PieceSymbol, Square };

export type MotifTag = "pin" | "skewer" | "fork" | "discovered-attack";

export interface MoveRecord {
  ply: number;
  san: string;
  uci: string;
  fenBefore: string;
  fenAfter: string;
  color: Color;
  isCapture: boolean;
  isCheck: boolean;
  comment: string;
  flagged: boolean;
  motifs: MotifTag[];
  /** White-relative centipawn eval after this move, once the engine has seen it. */
  evalCpAfter?: number;
}

export type AssistMode = "assisted" | "unassisted";

export type LensId =
  "ryle" | "dewey" | "nguyen" | "suits" | "wittgenstein" | "hurka";

export interface PromptContext {
  ply: number;
  sanMove: string;
  isBookMove: boolean;
  materialSwingCp: number;
  isCheck: boolean;
  isCapture: boolean;
  flaggedReason?: string;
  studentGuess?: string;
}

export interface PhilosopherLens {
  id: LensId;
  name: string;
  years: string;
  frameworkTag: string;
  blurb: string;
  promptFor: (ctx: PromptContext) => string;
  defaultPrompt: string;
}

export interface UciInfo {
  depth: number;
  scoreCp: number | null;
  scoreMate: number | null;
  pvUci: string[];
}

export type EngineStatus = "idle" | "loading" | "ready" | "thinking" | "error";

export interface EngineOpponent {
  humanColor: Color;
  label: string;
  skillLevel: number;
  movetimeMs: number;
}

export interface JournalEntry {
  ply: number;
  san: string;
  comment: string;
  flagged: boolean;
  motifs: MotifTag[];
  unassistedGuess?: string;
  lensResponses: {
    lensId: LensId;
    lensName: string;
    prompt: string;
    response: string;
  }[];
  engineNote?: string;
}

export interface JournalModel {
  title: string;
  players: { white: string; black: string };
  date: string;
  mode: AssistMode;
  entries: JournalEntry[];
}
