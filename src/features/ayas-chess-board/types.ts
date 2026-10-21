import type { GlossaryTerm } from "./lib/arabic-glossary";

export type MoveKind =
  | "normal"
  | "capture"
  | "check"
  | "castle"
  | "promotion"
  | "checkmate"
  | "stalemate"
  | "draw";

export interface FlavorMessage {
  text: string;
  glossary?: GlossaryTerm;
}

export interface MoveLogEntry {
  ply: number;
  san: string;
  color: "w" | "b";
}

export type OpponentMode = "pass-and-play" | "computer";
