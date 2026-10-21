import { GLOSSARY } from "./arabic-glossary";
import type { FlavorMessage, MoveKind } from "../types";

/**
 * The actual point of this tool: a little companion commentary after every
 * move, built from things that are actually true about us as friends rather
 * than generic chess-app flavor text — Algerian food, the Arabic she's
 * teaching me, her nail art, Messi/Barça, and the skydiving trip I owe her.
 * Picked in the move handler (an event, not render), so `Math.random()`
 * here never trips `react-hooks/purity`.
 */

const NORMAL: string[] = [
  "Nice and steady — saha! 🌸",
  "Look at you thinking three moves ahead already. 💅",
  "That's a calm, confident move. Mashallah.",
  "Beginner, they said. I don't believe it anymore.",
  "Solid. You're picking this up faster than I learn Arabic verbs.",
  "Quiet, controlled, dangerous — that's a proper Messi through-ball of a move. ⚽",
  "Patient build-up play. Very tiki-taka of you.",
  "Composed. Visca el Barça energy on that one. 🔵🔴",
];

const CAPTURE: string[] = [
  "Gone! Gobbled up like the last piece of bourek at a family lunch. 🥟",
  "Captured — snack time for your army. 🍯",
  "Devoured. You're hungrier for this board than you are for chakhchoukha, and that's saying something.",
  "That piece just got cleared off the board faster than a plate of makroudh at your house. 🍮",
  "Yoink! Clean capture — chef's kiss, like your actual cooking.",
  "Tackled clean — Busquets would be proud. ⚽",
  "Dispossessed! That's a proper high press, right there.",
];

const CHECK: string[] = [
  'Kesh! 👀 That\'s "check" — their king is sweating.',
  "Check! Their king needs to find an exit, dork (your move, by the way).",
  "Check — the king's having a worse day than my Arabic homework.",
  "Check! Their king's got nowhere to run — like a Messi dribble with no outlet ball.",
];

const CASTLE: string[] = [
  "Safe and cozy now — like you, wrapped in a blanket with mint tea and a plate of msemen. 🏰🍵",
  "Castled! King's tucked in safe. Protect that peace the way you protect a fresh manicure.",
];

const PROMOTION: string[] = [
  "A queen is born! 👑✨ Glow-up of the century — better than any nail upgrade.",
  "Promoted! New piece, same energy as unveiling a fresh set of nails.",
  "Promoted! Like subbing on a game-changer in the 80th minute. ⚽",
];

const CHECKMATE: string[] = [
  'KESH MALEK! 👑 Checkmate — that\'s genuinely where the word "checkmate" comes from: "the king is helpless." Mashallah, what a game. We\'re still going skydiving either way. 🪂',
  "CHECKMATE! That's a Camp Nou-worthy finish. 🐐⚽ We're still going skydiving either way. 🪂",
  "Checkmate! Board's closed, but the kitchen isn't — rematch over couscous? 🍲",
  "That's checkmate. However this one landed, I'm proud of you — and I still owe you a skydive. 🪂",
];

const STALEMATE: string[] = [
  "Stalemate — yezzi, no winner, no loser, just two stubborn players. 🤝",
  "Nobody can move legally — a draw by stalemate. Very diplomatic of both of you.",
];

const DRAW: string[] = [
  "A draw. Honestly very fitting for two people who split every dessert down the middle. 🍮",
];

const POOLS: Record<MoveKind, string[]> = {
  normal: NORMAL,
  capture: CAPTURE,
  check: CHECK,
  castle: CASTLE,
  promotion: PROMOTION,
  checkmate: CHECKMATE,
  stalemate: STALEMATE,
  draw: DRAW,
};

const GLOSSARY_FOR_KIND: Partial<Record<MoveKind, keyof typeof GLOSSARY>> = {
  check: "check",
  checkmate: "checkmate",
  castle: "rook",
  capture: "wellPlayed",
};

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

export function generateMoveMessage(kind: MoveKind): FlavorMessage {
  const pool = POOLS[kind];
  const key = GLOSSARY_FOR_KIND[kind];
  return {
    text: pick(pool),
    glossary: key ? GLOSSARY[key] : undefined,
  };
}

export const WELCOME_MESSAGE =
  "New board, new game — let's see what you've got. Beginner-friendly, zero pressure, unlimited snack breaks. 🌸";
