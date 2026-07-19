"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bookmark, Copy, Trash2, X } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import {
  EDGE_KINDS,
  EDGE_META,
  EVIDENCE_KINDS,
  EVIDENCE_META,
  NODE_KINDS,
  NODE_META,
} from "../config";
import type { EdgeKind, EvidenceQuality, NodeKind } from "../types";
import { useAmStore } from "../store";

/**
 * The context inspector — a glass side sheet for editing whatever is selected.
 * Node: kind, label, detail, confidence, evidence quality, bookmark, tags.
 * Edge: relationship kind, custom label, weight. Empty selection shows a hint.
 * Every control writes through the store (undo-tracked). Mirrors the site's
 * settings-panel idiom (labelled groups, range inputs, segmented choices).
 */
export function Inspector() {
  const reduce = useReducedMotion();
  const {
    node,
    edge,
    updateNodeData,
    updateEdgeData,
    deleteNode,
    deleteEdge,
    duplicateNode,
    select,
  } = useAmStore(
    useShallow((s) => ({
      node: s.selectedNodeId
        ? (s.nodes.find((n) => n.id === s.selectedNodeId) ?? null)
        : null,
      edge: s.selectedEdgeId
        ? (s.edges.find((e) => e.id === s.selectedEdgeId) ?? null)
        : null,
      updateNodeData: s.updateNodeData,
      updateEdgeData: s.updateEdgeData,
      deleteNode: s.deleteNode,
      deleteEdge: s.deleteEdge,
      duplicateNode: s.duplicateNode,
      select: s.select,
    })),
  );

  const open = !!node || !!edge;

  return (
    <AnimatePresence>
      {open ? (
        <motion.aside
          key={node?.id ?? edge?.id}
          initial={reduce ? { opacity: 0 } : { x: 24, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={reduce ? { opacity: 0 } : { x: 24, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          className="glass pointer-events-auto absolute top-3 right-3 bottom-3 z-20 flex w-[300px] flex-col overflow-hidden rounded-[var(--radius)]"
        >
          <header className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
            <span className="microlabel">{node ? "Node" : "Relationship"}</span>
            <button
              type="button"
              onClick={() => select(null, null)}
              aria-label="Close inspector"
              className="flex size-7 items-center justify-center rounded-full text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] [&_svg]:size-4"
            >
              <X />
            </button>
          </header>

          <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
            {node ? (
              <>
                <Field label="Type">
                  <select
                    value={node.data.kind}
                    onChange={(e) =>
                      updateNodeData(node.id, {
                        kind: e.target.value as NodeKind,
                      })
                    }
                    className="am-input"
                  >
                    {NODE_KINDS.map((k) => (
                      <option key={k} value={k}>
                        {NODE_META[k].label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Statement">
                  <textarea
                    value={node.data.label}
                    onChange={(e) =>
                      updateNodeData(node.id, { label: e.target.value })
                    }
                    rows={3}
                    placeholder={`${NODE_META[node.data.kind].label}…`}
                    className="am-input resize-none"
                  />
                </Field>

                <Field label="Note (optional)">
                  <textarea
                    value={node.data.detail ?? ""}
                    onChange={(e) =>
                      updateNodeData(node.id, { detail: e.target.value })
                    }
                    rows={2}
                    placeholder="Elaboration, source, caveat…"
                    className="am-input resize-none"
                  />
                </Field>

                <Field label={`Confidence — ${node.data.confidence}%`}>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={node.data.confidence}
                    onChange={(e) =>
                      updateNodeData(node.id, {
                        confidence: Number(e.target.value),
                      })
                    }
                    className="w-full accent-[var(--color-primary)]"
                  />
                </Field>

                {node.data.kind === "evidence" ? (
                  <Field label="Evidence quality">
                    <select
                      value={node.data.evidenceQuality ?? "empirical"}
                      onChange={(e) =>
                        updateNodeData(node.id, {
                          evidenceQuality: e.target.value as EvidenceQuality,
                        })
                      }
                      className="am-input"
                    >
                      {EVIDENCE_KINDS.map((q) => (
                        <option key={q} value={q}>
                          {EVIDENCE_META[q].label}
                        </option>
                      ))}
                    </select>
                  </Field>
                ) : null}

                <div className="flex flex-wrap gap-2 pt-1">
                  <ActionBtn
                    onClick={() =>
                      updateNodeData(node.id, {
                        bookmarked: !node.data.bookmarked,
                      })
                    }
                    active={node.data.bookmarked}
                  >
                    <Bookmark /> Bookmark
                  </ActionBtn>
                  <ActionBtn onClick={() => duplicateNode(node.id)}>
                    <Copy /> Duplicate
                  </ActionBtn>
                  <ActionBtn
                    onClick={() => {
                      deleteNode(node.id);
                      select(null, null);
                    }}
                    danger
                  >
                    <Trash2 /> Delete
                  </ActionBtn>
                </div>
              </>
            ) : edge ? (
              <>
                <Field label="Relationship">
                  <select
                    value={edge.data.kind}
                    onChange={(e) =>
                      updateEdgeData(edge.id, {
                        kind: e.target.value as EdgeKind,
                      })
                    }
                    className="am-input"
                  >
                    {EDGE_KINDS.map((k) => (
                      <option key={k} value={k}>
                        {EDGE_META[k].label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                    {EDGE_META[edge.data.kind].hint}
                  </p>
                </Field>

                <Field label="Custom label (optional)">
                  <input
                    type="text"
                    value={edge.data.label ?? ""}
                    onChange={(e) =>
                      updateEdgeData(edge.id, { label: e.target.value })
                    }
                    placeholder={EDGE_META[edge.data.kind].label}
                    className="am-input"
                  />
                </Field>

                <Field label={`Strength — ${edge.data.weight}%`}>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={edge.data.weight}
                    onChange={(e) =>
                      updateEdgeData(edge.id, {
                        weight: Number(e.target.value),
                      })
                    }
                    className="w-full accent-[var(--color-primary)]"
                  />
                </Field>

                <div className="pt-1">
                  <ActionBtn
                    onClick={() => {
                      deleteEdge(edge.id);
                      select(null, null);
                    }}
                    danger
                  >
                    <Trash2 /> Delete link
                  </ActionBtn>
                </div>
              </>
            ) : null}
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="microlabel mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

function ActionBtn({
  children,
  onClick,
  active,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors [&_svg]:size-3.5"
      style={{
        borderColor: danger
          ? "color-mix(in oklch, var(--color-crit) 40%, transparent)"
          : active
            ? "color-mix(in oklch, var(--color-warn) 55%, transparent)"
            : "var(--color-border)",
        color: danger
          ? "var(--color-crit)"
          : active
            ? "var(--color-warn)"
            : "var(--color-foreground)",
      }}
    >
      {children}
    </button>
  );
}
