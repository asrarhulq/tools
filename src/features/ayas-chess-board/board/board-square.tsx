import type { BoardPalette } from "../config";

interface BoardSquareProps {
  col: number;
  row: number;
  isLight: boolean;
  isLastMove: boolean;
  isCheck: boolean;
  isSelected: boolean;
  palette: BoardPalette;
  fileLabel?: string;
  rankLabel?: string;
}

export function BoardSquare({
  col,
  row,
  isLight,
  isLastMove,
  isCheck,
  isSelected,
  palette,
  fileLabel,
  rankLabel,
}: BoardSquareProps) {
  const background = isLastMove
    ? isLight
      ? palette.lastMoveLight
      : palette.lastMoveDark
    : isLight
      ? palette.light
      : palette.dark;

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
          ? `inset 0 0 0 4px ${palette.checkGlow}`
          : isSelected
            ? `inset 0 0 0 3px ${palette.border}`
            : undefined,
      }}
    >
      {rankLabel && (
        <span
          className="absolute top-0.5 left-1 text-[0.55rem] font-medium opacity-60"
          style={{ color: isLight ? palette.dark : palette.light }}
        >
          {rankLabel}
        </span>
      )}
      {fileLabel && (
        <span
          className="absolute right-1 bottom-0.5 text-[0.55rem] font-medium opacity-60"
          style={{ color: isLight ? palette.dark : palette.light }}
        >
          {fileLabel}
        </span>
      )}
    </div>
  );
}
