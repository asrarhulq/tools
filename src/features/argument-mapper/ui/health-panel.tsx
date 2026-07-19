"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, CircleAlert, Info, Sparkles } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { analyze } from "../lib/engine";
import { heatColor } from "../lib/heat";
import { useAmStore } from "../store";
import type { Diagnostic } from "../types";

/**
 * The reasoning report — a Health Score ring, headline metrics, and the live
 * diagnostics list. Diagnostics explain *why* and *how to fix*; clicking one
 * focuses its node on the canvas. Everything is derived from the graph via the
 * pure engine and memoised, so it updates live as the map changes.
 */
export function HealthPanel() {
  const reduce = useReducedMotion();
  const { nodes, edges, setFocus, select } = useAmStore(
    useShallow((s) => ({
      nodes: s.nodes,
      edges: s.edges,
      setFocus: s.setFocus,
      select: s.select,
    })),
  );

  const report = useMemo(() => analyze({ nodes, edges }), [nodes, edges]);
  const { score, diagnostics, metrics } = report;
  const empty = nodes.length === 0;

  const scoreColor = heatColor(score / 100);

  const focusDiag = (d: Diagnostic) => {
    if (d.nodeId) {
      setFocus(d.nodeId);
      select(d.nodeId, null);
    } else if (d.edgeId) {
      select(null, d.edgeId);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Score */}
      <div className="flex items-center gap-4 border-b border-[var(--color-border)] px-4 py-4">
        <ScoreRing
          value={empty ? 0 : score}
          color={scoreColor}
          reduce={!!reduce}
        />
        <div>
          <div className="microlabel">Reasoning health</div>
          <div className="font-display mt-0.5 text-2xl font-semibold tabular-nums">
            {empty ? "—" : score}
            <span className="text-sm text-[var(--color-muted-foreground)]">
              {empty ? "" : "/100"}
            </span>
          </div>
          <div className="text-xs text-[var(--color-muted-foreground)]">
            {empty
              ? "Add nodes to begin"
              : score >= 80
                ? "Strong structure"
                : score >= 55
                  ? "Some gaps to close"
                  : "Needs shoring up"}
          </div>
        </div>
      </div>

      {/* Metrics */}
      {!empty ? (
        <div className="grid grid-cols-2 gap-px border-b border-[var(--color-border)] bg-[var(--color-border)]">
          <Metric label="Nodes" value={`${metrics.nodeCount}`} />
          <Metric label="Links" value={`${metrics.edgeCount}`} />
          <Metric
            label="Avg confidence"
            value={`${Math.round(metrics.avgConfidence)}%`}
          />
          <Metric
            label="Evidence"
            value={
              metrics.evidenceScore
                ? `${Math.round(metrics.evidenceScore)}%`
                : "—"
            }
          />
          <Metric label="Assumptions" value={`${metrics.assumptionCount}`} />
          <Metric label="Max depth" value={`${metrics.maxDepth}`} />
          <Metric
            label="Contradictions"
            value={`${metrics.contradictionCount}`}
          />
          <Metric
            label="Debate balance"
            value={
              metrics.debateBalance > 0.2
                ? "Pro-leaning"
                : metrics.debateBalance < -0.2
                  ? "Con-leaning"
                  : "Balanced"
            }
          />
        </div>
      ) : null}

      {/* Diagnostics */}
      <div className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2">
          <span className="microlabel">Diagnostics</span>
          <span className="text-xs text-[var(--color-muted-foreground)]">
            {diagnostics.length || (empty ? 0 : "none")}
          </span>
        </div>

        {empty ? null : diagnostics.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <Sparkles className="size-5 text-[var(--color-ok)]" />
            <p className="text-sm text-[var(--color-muted-foreground)]">
              No issues found. This argument is structurally sound.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--color-border)]">
            {diagnostics.map((d, i) => (
              <motion.li
                key={d.id}
                initial={reduce ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.2) }}
              >
                <button
                  type="button"
                  onClick={() => focusDiag(d)}
                  className="w-full px-4 py-3 text-left transition-colors hover:bg-[var(--color-muted)]"
                >
                  <div className="flex items-start gap-2">
                    <SeverityIcon severity={d.severity} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{d.title}</div>
                      <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-muted-foreground)]">
                        {d.detail}
                      </p>
                      {d.fix ? (
                        <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-primary)]">
                          → {d.fix}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </button>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function SeverityIcon({ severity }: { severity: Diagnostic["severity"] }) {
  if (severity === "error")
    return (
      <CircleAlert className="mt-0.5 size-4 shrink-0 text-[var(--color-crit)]" />
    );
  if (severity === "warning")
    return (
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[var(--color-warn)]" />
    );
  return (
    <Info className="mt-0.5 size-4 shrink-0 text-[var(--color-muted-foreground)]" />
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--color-surface)] px-4 py-2.5">
      <div className="microlabel">{label}</div>
      <div className="font-display mt-0.5 text-sm font-semibold tabular-nums">
        {value}
      </div>
    </div>
  );
}

function ScoreRing({
  value,
  color,
  reduce,
}: {
  value: number;
  color: string;
  reduce: boolean;
}) {
  const r = 22;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - value / 100);
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
      <circle
        cx="28"
        cy="28"
        r={r}
        fill="none"
        stroke="var(--color-muted)"
        strokeWidth="5"
      />
      <motion.circle
        cx="28"
        cy="28"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={c}
        initial={
          reduce ? { strokeDashoffset: offset } : { strokeDashoffset: c }
        }
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      />
    </svg>
  );
}
