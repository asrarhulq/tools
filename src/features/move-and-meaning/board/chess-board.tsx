"use client";

import { Chess, type Square } from "chess.js";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BOARD_COLORS } from "../config";
import {
  isPromotionMove,
  legalDestinations,
} from "../lib/chess-engine-adapter";
import type { Orientation } from "../lib/board-geometry";
import { xyToSquare } from "../lib/board-geometry";
import { BoardSquare } from "./board-square";
import { MoveIndicators } from "./move-indicators";
import { PieceLayer } from "./piece-layer";
import { PieceIcon } from "./piece-svg";
import { PromotionPicker } from "./promotion-picker";

const FILES = "abcdefgh";

interface ChessBoardProps {
  fen: string;
  orientation?: Orientation;
  lastMove?: { from: Square; to: Square } | null;
  onMove: (from: Square, to: Square, promotion?: "q" | "r" | "b" | "n") => void;
  /** Restrict drag/click to one side's pieces — used by Play vs. Engine so
   * the human can't move for the engine while it's "thinking". `null`/
   * omitted means both sides are interactive (free/study play). */
  interactiveColor?: "w" | "b" | null;
}

/**
 * Memoized: this board's `layout`-animated pieces (see `PieceLayer`) would
 * otherwise re-render — and visibly jitter — every time a sibling in the
 * tool re-renders for an unrelated reason (e.g. an engine "thinking" tick),
 * even though none of this component's actual props changed.
 */
export const ChessBoard = memo(function ChessBoard({
  fen,
  orientation = "white",
  lastMove,
  onMove,
  interactiveColor = null,
}: ChessBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [draggingSquare, setDraggingSquare] = useState<Square | null>(null);
  const [dragPoint, setDragPoint] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [dragCellSize, setDragCellSize] = useState(320 / 8);
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

  const squareFromPoint = useCallback(
    (clientX: number, clientY: number): Square | null => {
      const rect = boardRef.current?.getBoundingClientRect();
      if (!rect) return null;
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return null;
      return xyToSquare(x, y, orientation, rect.width);
    },
    [orientation],
  );

  const endDrag = useCallback(
    (clientX: number, clientY: number) => {
      const from = draggingSquare;
      setDraggingSquare(null);
      setDragPoint(null);
      if (!from) return;
      const dropSquare = squareFromPoint(clientX, clientY);
      if (!dropSquare || dropSquare === from) {
        setSelectedSquare(from);
        return;
      }
      if (legalDestinations(fen, from).includes(dropSquare)) {
        attemptMove(from, dropSquare);
        setSelectedSquare(null);
      } else {
        setSelectedSquare(null);
      }
    },
    [draggingSquare, squareFromPoint, fen, attemptMove],
  );

  useEffect(() => {
    if (!draggingSquare) return;
    const onMove = (event: PointerEvent) => {
      setDragPoint({ x: event.clientX, y: event.clientY });
    };
    const onUp = (event: PointerEvent) => {
      endDrag(event.clientX, event.clientY);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [draggingSquare, endDrag]);

  const onPointerDownPiece = useCallback(
    (square: Square, event: React.PointerEvent<HTMLDivElement>) => {
      if (interactiveColor && turnColor !== interactiveColor) return;
      const piece = chess.get(square);
      if (selectedSquare && selectedSquare !== square) {
        // A piece was already selected — treat this as a capture attempt.
        if (legalTargets.includes(square)) {
          attemptMove(selectedSquare, square);
          setSelectedSquare(null);
          return;
        }
      }
      if (!piece || piece.color !== turnColor) return;
      if (selectedSquare === square) {
        setSelectedSquare(null);
        return;
      }
      setSelectedSquare(square);
      setDraggingSquare(square);
      setDragPoint({ x: event.clientX, y: event.clientY });
      const rectWidth = boardRef.current?.getBoundingClientRect().width ?? 320;
      setDragCellSize(rectWidth / 8);
    },
    [
      chess,
      turnColor,
      selectedSquare,
      legalTargets,
      attemptMove,
      interactiveColor,
    ],
  );

  const onBoardBackgroundClick = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (draggingSquare) return;
      const square = squareFromPoint(event.clientX, event.clientY);
      if (selectedSquare && square && legalTargets.includes(square)) {
        attemptMove(selectedSquare, square);
        setSelectedSquare(null);
      } else {
        setSelectedSquare(null);
      }
    },
    [
      draggingSquare,
      squareFromPoint,
      selectedSquare,
      legalTargets,
      attemptMove,
    ],
  );

  const draggingPiece = draggingSquare ? chess.get(draggingSquare) : undefined;

  return (
    <div className="relative w-full">
      <div
        ref={boardRef}
        className="relative aspect-square w-full overflow-hidden rounded-lg border-4 shadow-2xl select-none"
        style={{ borderColor: BOARD_COLORS.border }}
        onPointerDown={onBoardBackgroundClick}
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
          draggingSquare={draggingSquare}
          onPointerDownPiece={onPointerDownPiece}
        />

        {pendingPromotion && (
          <PromotionPicker
            square={pendingPromotion.to}
            color={turnColor}
            orientation={orientation}
            onPick={(piece) => {
              onMove(pendingPromotion.from, pendingPromotion.to, piece);
              setPendingPromotion(null);
            }}
            onCancel={() => setPendingPromotion(null)}
          />
        )}
      </div>

      {draggingSquare && dragPoint && draggingPiece && (
        <div
          className="pointer-events-none fixed z-40"
          style={{
            left: dragPoint.x,
            top: dragPoint.y,
            width: dragCellSize,
            height: dragCellSize,
            transform: "translate(-50%, -50%)",
          }}
        >
          <PieceIcon
            type={draggingPiece.type}
            color={draggingPiece.color}
            size="100%"
          />
        </div>
      )}
    </div>
  );
});
