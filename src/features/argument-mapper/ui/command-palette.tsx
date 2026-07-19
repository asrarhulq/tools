"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search } from "lucide-react";
import { NODE_KINDS, NODE_META } from "../config";
import type { LayoutKind } from "../types";
import { useAmStore } from "../store";

interface Command {
  id: string;
  label: string;
  group: string;
  run: () => void;
  keywords?: string;
}

/**
 * ⌘K / Ctrl-K command palette. Aggregates every action — add any node kind,
 * switch layout/heatmap, undo/redo, open library, export, toggle zen — into one
 * fuzzy-filtered list with keyboard navigation. Mirrors the site's global
 * palette feel but scoped to the mapper.
 */
export function CommandPalette({
  onRunLayout,
  onOpenLibrary,
  onExport,
}: {
  onRunLayout: (l: LayoutKind) => void;
  onOpenLibrary: () => void;
  onExport: (fmt: "png" | "json" | "markdown") => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const store = useAmStore;

  // Global ⌘K / Ctrl-K toggle.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key?.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && k === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (k === "escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      // Reset the palette to a clean state each time it opens.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset on open
      setQ("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const commands = useMemo<Command[]>(() => {
    const s = store.getState();
    const nodeCmds: Command[] = NODE_KINDS.map((k) => ({
      id: `add-${k}`,
      group: "Add node",
      label: `Add ${NODE_META[k].label}`,
      keywords: NODE_META[k].hint,
      run: () => {
        // Deterministic fan-out offset from the current node count.
        const i = store.getState().nodes.length;
        s.addNode(k, { x: 240 + (i % 6) * 32, y: 180 + (i % 6) * 28 });
      },
    }));
    const layoutCmds: { id: LayoutKind; label: string }[] = [
      { id: "tree", label: "Tree" },
      { id: "debate", label: "Debate tree" },
      { id: "layered", label: "Layered" },
      { id: "radial", label: "Radial" },
      { id: "mindmap", label: "Mind map" },
      { id: "flow", label: "Flowchart" },
    ];
    const heatCmds = [
      { id: "none", label: "Off" },
      { id: "confidence", label: "Confidence" },
      { id: "strength", label: "Logical strength" },
      { id: "evidence", label: "Evidence quality" },
      { id: "assumption", label: "Assumption density" },
      { id: "vulnerability", label: "Vulnerability" },
    ] as const;

    return [
      ...nodeCmds,
      ...layoutCmds.map((l) => ({
        id: `layout-${l.id}`,
        group: "Layout",
        label: `Layout: ${l.label}`,
        run: () => onRunLayout(l.id),
      })),
      ...heatCmds.map((h) => ({
        id: `heat-${h.id}`,
        group: "Heatmap",
        label: `Heatmap: ${h.label}`,
        run: () => s.setHeatmap(h.id),
      })),
      { id: "undo", group: "Edit", label: "Undo", run: () => s.undo() },
      { id: "redo", group: "Edit", label: "Redo", run: () => s.redo() },
      {
        id: "zen",
        group: "View",
        label: "Toggle Zen mode",
        run: () => s.toggleZen(),
      },
      {
        id: "library",
        group: "Insert",
        label: "Open library",
        run: onOpenLibrary,
      },
      {
        id: "export-png",
        group: "Export",
        label: "Export as PNG",
        run: () => onExport("png"),
      },
      {
        id: "export-json",
        group: "Export",
        label: "Export as JSON",
        run: () => onExport("json"),
      },
      {
        id: "export-md",
        group: "Export",
        label: "Export as Markdown",
        run: () => onExport("markdown"),
      },
      {
        id: "clear",
        group: "Edit",
        label: "Clear canvas",
        run: () => s.clear(),
      },
    ];
  }, [store, onRunLayout, onOpenLibrary, onExport]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return commands;
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(query) ||
        c.group.toLowerCase().includes(query) ||
        c.keywords?.toLowerCase().includes(query),
    );
  }, [q, commands]);

  useEffect(() => {
    // Reset the active row whenever the query changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset highlight
    setActive(0);
  }, [q]);

  const runAt = (i: number) => {
    const cmd = filtered[i];
    if (cmd) {
      cmd.run();
      setOpen(false);
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            aria-hidden="true"
          />
          <motion.div
            role="dialog"
            aria-label="Command palette"
            initial={{ opacity: 0, scale: 0.98, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -8 }}
            transition={{ duration: 0.16 }}
            className="glass fixed top-[18%] left-1/2 z-50 w-[min(92vw,560px)] -translate-x-1/2 overflow-hidden rounded-[var(--radius)]"
          >
            <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-4">
              <Search className="size-4 text-[var(--color-muted-foreground)]" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setActive((a) => Math.min(a + 1, filtered.length - 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setActive((a) => Math.max(a - 1, 0));
                  } else if (e.key === "Enter") {
                    e.preventDefault();
                    runAt(active);
                  }
                }}
                placeholder="Type a command…"
                className="w-full bg-transparent py-3.5 text-sm outline-none placeholder:text-[var(--color-muted-foreground)]"
              />
            </div>
            <ul className="max-h-[50vh] overflow-y-auto p-1.5">
              {filtered.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-[var(--color-muted-foreground)]">
                  No matching commands
                </li>
              ) : (
                filtered.map((c, i) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onMouseEnter={() => setActive(i)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        runAt(i);
                      }}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors"
                      style={{
                        background:
                          i === active ? "var(--color-muted)" : undefined,
                      }}
                    >
                      <span>{c.label}</span>
                      <span className="text-[10px] tracking-wide text-[var(--color-muted-foreground)] uppercase">
                        {c.group}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
