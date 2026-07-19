"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Download,
  Flame,
  LayoutGrid,
  Library,
  Plus,
  Redo2,
  Trash2,
  Undo2,
  Wand2,
} from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { NODE_KINDS, NODE_META } from "../config";
import type { HeatmapMode, LayoutKind, NodeKind } from "../types";
import { useAmStore } from "../store";

const LAYOUTS: { id: LayoutKind; label: string }[] = [
  { id: "tree", label: "Tree" },
  { id: "debate", label: "Debate tree" },
  { id: "layered", label: "Layered" },
  { id: "radial", label: "Radial" },
  { id: "mindmap", label: "Mind map" },
  { id: "flow", label: "Flowchart" },
];

const HEATMAPS: { id: HeatmapMode; label: string }[] = [
  { id: "none", label: "Off" },
  { id: "confidence", label: "Confidence" },
  { id: "strength", label: "Logical strength" },
  { id: "evidence", label: "Evidence quality" },
  { id: "assumption", label: "Assumption density" },
  { id: "vulnerability", label: "Vulnerability" },
];

export function Toolbar({
  onRunLayout,
  onOpenLibrary,
  onExport,
}: {
  onRunLayout: (l: LayoutKind) => void;
  onOpenLibrary: () => void;
  onExport: (fmt: "png" | "json" | "markdown") => void;
}) {
  const {
    addNode,
    undo,
    redo,
    canUndo,
    canRedo,
    heatmap,
    setHeatmap,
    layout,
    clear,
    nodeCount,
  } = useAmStore(
    useShallow((s) => ({
      addNode: s.addNode,
      undo: s.undo,
      redo: s.redo,
      canUndo: s.canUndo(),
      canRedo: s.canRedo(),
      heatmap: s.heatmap,
      setHeatmap: s.setHeatmap,
      layout: s.layout,
      clear: s.clear,
      nodeCount: s.nodes.length,
    })),
  );

  const spawn = (kind: NodeKind) => {
    // Fan new nodes out in a deterministic cascade so they never overlap
    // (deterministic — no Math.random, which keeps SSR + the compiler happy).
    const i = nodeCount;
    addNode(kind, { x: 200 + (i % 6) * 34, y: 160 + (i % 6) * 30 });
  };

  return (
    <div className="glass pointer-events-auto absolute top-3 left-1/2 z-20 flex max-w-[calc(100%-1.5rem)] -translate-x-1/2 items-center gap-1 overflow-x-auto rounded-full px-1.5 py-1.5">
      <Menu
        label="Add"
        icon={<Plus />}
        items={NODE_KINDS.map((k) => ({
          id: k,
          label: NODE_META[k].label,
          icon: NODE_META[k].icon,
          accent: NODE_META[k].accent,
          onClick: () => spawn(k),
        }))}
        primary
      />

      <Menu
        label="Layout"
        icon={<LayoutGrid />}
        items={LAYOUTS.map((l) => ({
          id: l.id,
          label: l.label,
          active: layout === l.id,
          onClick: () => onRunLayout(l.id),
        }))}
      />

      <Menu
        label="Heatmap"
        icon={<Flame />}
        items={HEATMAPS.map((h) => ({
          id: h.id,
          label: h.label,
          active: heatmap === h.id,
          onClick: () => setHeatmap(h.id),
        }))}
      />

      <span className="mx-0.5 h-5 w-px bg-[var(--color-border)]" />

      <IconBtn label="Undo" disabled={!canUndo} onClick={undo}>
        <Undo2 />
      </IconBtn>
      <IconBtn label="Redo" disabled={!canRedo} onClick={redo}>
        <Redo2 />
      </IconBtn>

      <span className="mx-0.5 h-5 w-px bg-[var(--color-border)]" />

      <TextBtn onClick={onOpenLibrary} icon={<Library />}>
        Library
      </TextBtn>

      <Menu
        label="Export"
        icon={<Download />}
        items={[
          { id: "png", label: "PNG image", onClick: () => onExport("png") },
          { id: "json", label: "JSON", onClick: () => onExport("json") },
          {
            id: "markdown",
            label: "Markdown",
            onClick: () => onExport("markdown"),
          },
        ]}
      />

      <IconBtn label="Clear canvas" onClick={clear} danger>
        <Trash2 />
      </IconBtn>

      <span className="ml-1 hidden items-center gap-1 rounded-full border border-[var(--color-border)] px-2 py-1 text-[10px] text-[var(--color-muted-foreground)] sm:flex">
        <Wand2 className="size-3" /> ⌘K
      </span>
    </div>
  );
}

interface MenuItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  accent?: string;
  active?: boolean;
  onClick: () => void;
}

function Menu({
  label,
  icon,
  items,
  primary,
}: {
  label: string;
  icon: React.ReactNode;
  items: MenuItem[];
  primary?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors [&_svg]:size-3.5"
        style={
          primary
            ? {
                background: "var(--color-primary)",
                color: "var(--color-primary-foreground)",
              }
            : undefined
        }
        aria-expanded={open}
      >
        {icon}
        <span className="hidden sm:inline">{label}</span>
        <ChevronDown className="!size-3 opacity-70" />
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className="glass absolute top-full left-0 z-30 mt-1.5 max-h-[60vh] w-52 overflow-y-auto rounded-xl p-1"
          >
            {items.map((it) => {
              const ItIcon = it.icon;
              return (
                <button
                  key={it.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    it.onClick();
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-[var(--color-muted)] [&_svg]:size-4"
                  style={{
                    color: it.active ? "var(--color-primary)" : undefined,
                    background: it.active ? "var(--color-muted)" : undefined,
                  }}
                >
                  {ItIcon ? <ItIcon className="shrink-0" /> : null}
                  <span
                    style={
                      ItIcon && it.accent ? { color: it.accent } : undefined
                    }
                  >
                    {it.label}
                  </span>
                </button>
              );
            })}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function IconBtn({
  children,
  label,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex size-8 items-center justify-center rounded-full transition-colors hover:bg-[var(--color-muted)] disabled:opacity-30 [&_svg]:size-4"
      style={danger ? { color: "var(--color-crit)" } : undefined}
    >
      {children}
    </button>
  );
}

function TextBtn({
  children,
  icon,
  onClick,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-[var(--color-muted)] [&_svg]:size-3.5"
    >
      {icon}
      <span className="hidden sm:inline">{children}</span>
    </button>
  );
}
