/**
 * A small, honest glossary — not a claim to be a complete Arabic course
 * (that's her job, not this tool's). Chess vocabulary happens to have a
 * genuine, documented Arabic/Persian history worth surfacing on its own:
 * "checkmate" comes almost unchanged from "shah mat" ("the king is
 * helpless"), which passed through Arabic on its way into English, and the
 * rook's name comes from Persian "rukh" by the same route. Standard Arabic
 * (fusha) is used here rather than Algerian Darja, since Darja varies by
 * region and speaker and isn't something to guess at — that part's hers to
 * add.
 */

export interface GlossaryTerm {
  english: string;
  arabic: string;
  transliteration: string;
  note?: string;
}

export const GLOSSARY: Record<string, GlossaryTerm> = {
  chess: {
    english: "Chess",
    arabic: "الشطرنج",
    transliteration: "ash-shatranj",
  },
  king: { english: "King", arabic: "الملك", transliteration: "al-malik" },
  queen: {
    english: "Queen",
    arabic: "الملكة",
    transliteration: "al-malikah",
  },
  rook: {
    english: "Rook",
    arabic: "الرخ",
    transliteration: "ar-rukh",
    note: 'literally where the English word "rook" comes from',
  },
  bishop: {
    english: "Bishop",
    arabic: "الفيل",
    transliteration: "al-fil",
    note: '"the elephant" — its original shape in the game\'s ancestor, shatranj',
  },
  knight: { english: "Knight", arabic: "الحصان", transliteration: "al-hisan" },
  pawn: { english: "Pawn", arabic: "البيدق", transliteration: "al-baidaq" },
  check: {
    english: "Check",
    arabic: "كش",
    transliteration: "kesh",
  },
  checkmate: {
    english: "Checkmate",
    arabic: "كش ملك",
    transliteration: "kesh malik",
    note: '"check to the king" — literally where the English word "checkmate" comes from',
  },
  move: { english: "Your move", arabic: "دورك", transliteration: "dork" },
  wellPlayed: {
    english: "Well played",
    arabic: "أحسنت",
    transliteration: "ahsant",
  },
};
