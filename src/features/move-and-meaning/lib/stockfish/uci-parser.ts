import type { UciInfo } from "../../types";

/**
 * Minimal UCI text-protocol parsing — just enough of `info`/`bestmove` to
 * drive the eval bar and best-line panel. Raw UCI carries no request id, so
 * `hooks/use-stockfish.ts` is responsible for discarding stale lines from a
 * superseded search.
 */
export function parseInfoLine(line: string): UciInfo | null {
  if (!line.startsWith("info ")) return null;
  const tokens = line.split(" ");
  let depth = 0;
  let scoreCp: number | null = null;
  let scoreMate: number | null = null;
  const pvUci: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token === "depth") {
      depth = Number(tokens[++i]);
    } else if (token === "score") {
      const kind = tokens[++i];
      const value = Number(tokens[++i]);
      if (kind === "cp") scoreCp = value;
      else if (kind === "mate") scoreMate = value;
    } else if (token === "pv") {
      pvUci.push(...tokens.slice(i + 1));
      break;
    }
  }

  if (depth === 0 && scoreCp === null && scoreMate === null) return null;
  return { depth, scoreCp, scoreMate, pvUci };
}

export function parseBestMoveLine(
  line: string,
): { bestMoveUci: string; ponderUci?: string } | null {
  if (!line.startsWith("bestmove")) return null;
  const tokens = line.split(" ");
  const bestMoveUci = tokens[1];
  if (!bestMoveUci || bestMoveUci === "(none)") return null;
  const ponderIdx = tokens.indexOf("ponder");
  const ponderUci = ponderIdx >= 0 ? tokens[ponderIdx + 1] : undefined;
  return { bestMoveUci, ponderUci };
}
