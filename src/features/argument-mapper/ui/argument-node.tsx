"use client";

import { memo, useEffect, useRef, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Bookmark } from "lucide-react";
import { NODE_META } from "../config";
import type { ArgNodeData, HeatmapMode } from "../types";
import { useAmStore } from "../store";
import { heatColor } from "../lib/heat";

/**
 * A single argument node — a glass card with the kind's icon + accent, an inline
 * editable label, and confidence-driven visuals. Confidence maps to opacity,
 * border strength, and a thin meter along the bottom, so an uncertain claim is
 * visually obvious at a glance. Heatmap mode overrides the accent with a
 * strength/confidence/etc. colour.
 *
 * Editing is inline (double-click or select-then-type) via a textarea that
 * auto-grows; committing writes through the store (which snapshots undo).
 */

interface NodeExtra {
  heatmap: HeatmapMode;
  heat: number; // 0..1 precomputed heat value for this node
  dimmed: boolean; // focus-mode dimming
}

function ArgumentNodeInner({ id, data, selected }: NodeProps) {
  const d = data as ArgNodeData & NodeExtra;
  const meta = NODE_META[d.kind];
  const Icon = meta.icon;
  const updateNodeData = useAmStore((s) => s.updateNodeData);

  const [editing, setEditing] = useState(d.label === "");
  const [draft, setDraft] = useState(d.label);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && taRef.current) {
      taRef.current.focus();
      taRef.current.select();
    }
  }, [editing]);

  // Keep the editing draft in sync when the label changes from elsewhere
  // (inspector edit, undo/redo). One-way external→local sync.
  // eslint-disable-next-line react-hooks/set-state-in-effect -- external sync
  useEffect(() => setDraft(d.label), [d.label]);

  const commit = () => {
    setEditing(false);
    if (draft !== d.label) updateNodeData(id, { label: draft.trim() });
  };

  const confidence = d.confidence ?? 70;
  const accent = d.heatmap !== "none" ? heatColor(d.heat) : meta.accent;
  // Confidence drives opacity (0.55..1) and border alpha.
  const opacity = 0.55 + (confidence / 100) * 0.45;
  const borderAlpha = 0.35 + (confidence / 100) * 0.55;

  return (
    <div
      className="group relative w-[220px] rounded-xl border bg-[var(--glass-bg)] px-3 py-2.5 shadow-sm backdrop-blur-md transition-[box-shadow,transform,opacity] duration-200 select-none"
      style={{
        opacity: d.dimmed ? 0.25 : opacity,
        borderColor: `color-mix(in oklch, ${accent} ${borderAlpha * 100}%, transparent)`,
        boxShadow: selected
          ? `0 0 0 2px color-mix(in oklch, ${accent} 70%, transparent), 0 12px 30px -12px color-mix(in oklch, ${accent} 45%, transparent)`
          : undefined,
      }}
      onDoubleClick={() => setEditing(true)}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!size-2.5 !border-2 !border-[var(--color-surface)]"
        style={{ background: accent }}
      />

      <div className="mb-1 flex items-center gap-1.5">
        <span
          className="flex size-5 shrink-0 items-center justify-center rounded-md [&_svg]:size-3.5"
          style={{ color: accent }}
        >
          <Icon />
        </span>
        <span
          className="text-[10px] font-semibold tracking-wide uppercase"
          style={{ color: accent, letterSpacing: "0.06em" }}
        >
          {meta.label}
        </span>
        {d.bookmarked ? (
          <Bookmark
            className="ml-auto size-3 fill-current text-[var(--color-warn)]"
            aria-hidden="true"
          />
        ) : null}
      </div>

      {editing ? (
        <textarea
          ref={taRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              commit();
            }
            if (e.key === "Escape") {
              setDraft(d.label);
              setEditing(false);
            }
            e.stopPropagation();
          }}
          rows={2}
          placeholder={`${meta.label}…`}
          className="w-full resize-none rounded-md bg-transparent text-sm leading-snug text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-muted-foreground)]"
        />
      ) : (
        <p className="text-sm leading-snug text-[var(--color-foreground)]">
          {d.label || (
            <span className="text-[var(--color-muted-foreground)] italic">
              {meta.label}…
            </span>
          )}
        </p>
      )}

      {/* confidence meter */}
      <div
        className="mt-2 h-1 overflow-hidden rounded-full"
        style={{
          background:
            "color-mix(in oklch, var(--color-border) 60%, transparent)",
        }}
        title={`Confidence ${confidence}%`}
      >
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{ width: `${confidence}%`, background: accent }}
        />
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!size-2.5 !border-2 !border-[var(--color-surface)]"
        style={{ background: accent }}
      />
    </div>
  );
}

export const ArgumentNode = memo(ArgumentNodeInner);
