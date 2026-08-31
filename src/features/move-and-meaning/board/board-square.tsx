import { BOARD_COLORS } from "../config";

interface BoardSquareProps {
  col: number;
  row: number;
  isLight: boolean;
  isLastMove: boolean;
  isCheck: boolean;
  fileLabel?: string;
  rankLabel?: string;
}

export function BoardSquare({
  col,
  row,
  isLight,
  isLastMove,
  isCheck,
  fileLabel,
  rankLabel,
}: BoardSquareProps) {
  const background = isLastMove
    ? isLight
      ? BOARD_COLORS.lastMoveLight
      : BOARD_COLORS.lastMoveDark
    : isLight
      ? BOARD_COLORS.light
      : BOARD_COLORS.dark;

  return (
    <div
      className="absolute"
      style={{
        left: `${col * 12.5}%`,
        top: `${row * 12.5}%`,
        width: "12.5%",
        height: "12.5%",
        backgroundColor: background,
        boxShadow: isCheck
          ? `inset 0 0 0 4px ${BOARD_COLORS.checkGlow}`
          : undefined,
      }}
    >
      {rankLabel && (
        <span
          className="absolute top-0.5 left-1 text-[0.55rem] font-medium opacity-60"
          style={{ color: isLight ? BOARD_COLORS.dark : BOARD_COLORS.light }}
        >
          {rankLabel}
        </span>
      )}
      {fileLabel && (
        <span
          className="absolute right-1 bottom-0.5 text-[0.55rem] font-medium opacity-60"
          style={{ color: isLight ? BOARD_COLORS.dark : BOARD_COLORS.light }}
        >
          {fileLabel}
        </span>
      )}
    </div>
  );
}
