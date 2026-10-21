"use client";

import { Chess, type Square } from "chess.js";
import { useCallback, useMemo, useRef, useState } from "react";
import type { BoardPalette } from "../config";
import { isPromotionMove, legalDestinations } from "../lib/chess-adapter";
import type { Orientation } from "../lib/board-geometry";
import { xyToSquare } from "../lib/board-geometry";
import { BoardSquare } from "./board-square";
import { MoveIndicators } from "./move-indicators";
import { PieceLayer } from "./piece-layer";
import { PromotionPicker } from "./promotion-picker";

const FILES = "abcdefgh";

interface AyaChessBoardProps {
  fen: string;
  palette: BoardPalette;
  orientation?: Orientation;
  lastMove?: { from: Square; to: Square } | null;
  onMove: (from: Square, to: Square, promotion?: "q" | "r" | "b" | "n") => void;
  /** Restrict clicks to one side — used while the bot is "thinking" and
   * while it's simply not the human's turn in computer mode. `null`/omitted
   * means both sides are clickable (pass-and-play). */
  interactiveColor?: "w" | "b" | null;
}

/**
 * Click-to-select, click-to-move — no drag. Simpler to get right, and a
 * friendlier interaction for someone brand new to the game than hunting for
 * a precise drop target.
 */
export function AyaChessBoard({
  fen,
  palette,
  orientation = "white",
  lastMove,
  onMove,
  interactiveColor = null,
}: AyaChessBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{
    from: Square;
    to: Square;
  } | null>(null);

  const chess = useMemo(() => new Chess(fen), [fen]);
  const turnColor = chess.turn();
  const inCheck = chess.inCheck();
  const kingSquare = useMemo(() => {
    if (!inCheck) return null;
    for (const row of chess.board()) {
      for (const cell of row) {
        if (cell && cell.type === "k" && cell.color === turnColor)
          return cell.square;
      }
    }
    return null;
  }, [chess, inCheck, turnColor]);

  const legalTargets = useMemo(
    () => (selectedSquare ? legalDestinations(fen, selectedSquare) : []),
    [fen, selectedSquare],
  );
  const occupiedTargets = useMemo(
    () => new Set(legalTargets.filter((sq) => chess.get(sq) !== undefined)),
    [legalTargets, chess],
  );

  const attemptMove = useCallback(
    (from: Square, to: Square) => {
      if (isPromotionMove(fen, from, to)) {
        setPendingPromotion({ from, to });
        return;
      }
      onMove(from, to);
    },
    [fen, onMove],
  );

  const handleSquareClick = useCallback(
    (square: Square) => {
      if (interactiveColor && turnColor !== interactiveColor) return;
      if (selectedSquare && legalTargets.includes(square)) {
        attemptMove(selectedSquare, square);
        setSelectedSquare(null);
        return;
      }
      if (selectedSquare === square) {
        setSelectedSquare(null);
        return;
      }
      const piece = chess.get(square);
      if (piece && piece.color === turnColor) {
        setSelectedSquare(square);
      } else {
        setSelectedSquare(null);
      }
    },
    [
      selectedSquare,
      legalTargets,
      attemptMove,
      chess,
      turnColor,
      interactiveColor,
    ],
  );

  const onBackgroundClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const rect = boardRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const square = xyToSquare(x, y, orientation, rect.width);
      handleSquareClick(square);
    },
    [orientation, handleSquareClick],
  );

  return (
    <div className="relative w-full">
      <div
        ref={boardRef}
        className="relative aspect-square w-full overflow-hidden rounded-lg border-4 shadow-xl select-none"
        style={{ borderColor: palette.border }}
        onClick={onBackgroundClick}
      >
        {Array.from({ length: 8 }).map((_, row) =>
          Array.from({ length: 8 }).map((__, col) => {
            const isLight = (row + col) % 2 === 0;
            const file = orientation === "white" ? col : 7 - col;
            const rankIdx = orientation === "white" ? 7 - row : row;
            const square = `${FILES[file]}${rankIdx + 1}` as Square;
            const isLastMove =
              lastMove?.from === square || lastMove?.to === square;
            return (
              <BoardSquare
                key={square}
                col={col}
                row={row}
                isLight={isLight}
                isLastMove={isLastMove}
                isCheck={square === kingSquare}
                isSelected={square === selectedSquare}
                palette={palette}
                fileLabel={row === 7 ? FILES[file] : undefined}
                rankLabel={col === 0 ? String(rankIdx + 1) : undefined}
              />
            );
          }),
        )}

        <MoveIndicators
          targets={legalTargets}
          occupiedTargets={occupiedTargets}
          orientation={orientation}
        />

        <PieceLayer
          fen={fen}
          orientation={orientation}
          selectedSquare={selectedSquare}
          onSelectSquare={handleSquareClick}
        />

        {pendingPromotion && (
          <PromotionPicker
            square={pendingPromotion.to}
            color={turnColor}
            orientation={orientation}
            onPick={(piece) => {
              onMove(pendingPromotion.from, pendingPromotion.to, piece);
              setPendingPromotion(null);
              setSelectedSquare(null);
            }}
            onCancel={() => setPendingPromotion(null)}
          />
        )}
      </div>
    </div>
  );
}
