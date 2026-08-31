"use client";

import { useRef, useState } from "react";
import { STUDY_PALETTE } from "../config";
import { toPgnWithComments } from "../lib/chess-engine-adapter";
import { useMmStore } from "../store";

export function PgnIoBar() {
  const loadPgnGame = useMmStore((s) => s.loadPgnGame);
  const history = useMmStore((s) => s.history);
  const pgnHeaders = useMmStore((s) => s.pgnHeaders);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");

  const handleFile = async (file: File) => {
    const text = await file.text();
    loadPgnGame(text);
  };

  const handleExport = () => {
    try {
      const pgn = toPgnWithComments(
        history.map((m) => ({ uci: m.uci, comment: m.comment })),
        pgnHeaders,
      );
      const blob = new Blob([pgn], { type: "application/x-chess-pgn" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "move-and-meaning-game.pgn";
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      /* export best-effort */
    }
  };

  const buttonStyle = {
    borderColor: STUDY_PALETTE.border,
    color: STUDY_PALETTE.text,
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pgn,text/plain"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="rounded-md border px-2.5 py-1.5 text-xs font-medium"
        style={buttonStyle}
      >
        Import PGN file
      </button>
      <button
        type="button"
        onClick={() => setPasteOpen((v) => !v)}
        className="rounded-md border px-2.5 py-1.5 text-xs font-medium"
        style={buttonStyle}
      >
        Paste PGN
      </button>
      <button
        type="button"
        onClick={handleExport}
        disabled={history.length === 0}
        className="rounded-md border px-2.5 py-1.5 text-xs font-medium disabled:opacity-40"
        style={{
          borderColor: STUDY_PALETTE.brassDim,
          color: STUDY_PALETTE.brass,
        }}
      >
        Export PGN
      </button>

      {pasteOpen && (
        <div className="flex w-full basis-full flex-col gap-2">
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            rows={4}
            placeholder="Paste PGN text…"
            className="w-full rounded-md border bg-transparent p-2 text-sm outline-none"
            style={{
              borderColor: STUDY_PALETTE.border,
              color: STUDY_PALETTE.text,
            }}
          />
          <button
            type="button"
            onClick={() => {
              loadPgnGame(pasteText);
              setPasteOpen(false);
              setPasteText("");
            }}
            className="self-start rounded-md border px-2.5 py-1.5 text-xs font-medium"
            style={{
              borderColor: STUDY_PALETTE.brassDim,
              color: STUDY_PALETTE.brass,
            }}
          >
            Load game
          </button>
        </div>
      )}
    </div>
  );
}
