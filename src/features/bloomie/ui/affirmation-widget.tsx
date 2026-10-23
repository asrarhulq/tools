"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, HelpCircle, RefreshCw, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import {
  dailyAffirmationId,
  getAffirmation,
  interpolate,
  randomAffirmationId,
} from "../lib/affirmations";
import { dateKey } from "../lib/mood";
import { STORAGE_KEYS } from "../lib/storage-keys";
import type { AffirmationState } from "../types";

interface AffirmationWidgetProps {
  nickname: string;
}

function defaultState(): AffirmationState {
  return {
    currentId: dailyAffirmationId(dateKey()),
    favoriteIds: [],
    reflections: {},
  };
}

export function AffirmationWidget({ nickname }: AffirmationWidgetProps) {
  // Stable across re-renders (computed once per mount) — a fresh object
  // every render would make useLocalStorage's memoized setter unstable too.
  const initialState = useMemo(() => defaultState(), []);
  const [state, setState] = useLocalStorage<AffirmationState>(
    STORAGE_KEYS.affirmationState,
    initialState,
  );
  const [showWhy, setShowWhy] = useState(false);
  const [copied, setCopied] = useState(false);

  const affirmation = getAffirmation(state.currentId);
  const text = interpolate(affirmation.text, nickname);
  const isFavorite = state.favoriteIds.includes(affirmation.id);
  const reflection = state.reflections[affirmation.id] ?? "";

  function nextAffirmation() {
    setState((prev) => ({
      ...prev,
      currentId: randomAffirmationId(prev.currentId),
    }));
    setShowWhy(false);
  }

  function toggleFavorite() {
    setState((prev) => ({
      ...prev,
      favoriteIds: prev.favoriteIds.includes(affirmation.id)
        ? prev.favoriteIds.filter((id) => id !== affirmation.id)
        : [...prev.favoriteIds, affirmation.id],
    }));
  }

  function setReflection(value: string) {
    setState((prev) => ({
      ...prev,
      reflections: { ...prev.reflections, [affirmation.id]: value },
    }));
  }

  async function copyText() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be unavailable (permissions, insecure context) — not worth surfacing an error for.
    }
  }

  return (
    <div
      className="rounded-[24px] border p-4"
      style={{
        borderColor: "var(--bloomie-border)",
        backgroundColor: "var(--bloomie-panel)",
      }}
    >
      <h3
        className="mb-3 text-sm font-semibold"
        style={{ color: "var(--bloomie-text)" }}
      >
        Today&apos;s affirmation
      </h3>

      <AnimatePresence mode="wait">
        <motion.div
          key={affirmation.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
        >
          <p
            className="rounded-xl border px-3 py-3 text-sm leading-relaxed"
            style={{
              borderColor: "var(--bloomie-accent-soft)",
              backgroundColor: "var(--bloomie-panel-alt)",
              color: "var(--bloomie-text)",
            }}
          >
            {text}
          </p>

          {showWhy && (
            <p
              className="mt-2 text-xs leading-relaxed"
              style={{ color: "var(--bloomie-muted)" }}
            >
              {affirmation.why}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={nextAffirmation}
              className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"
              style={{
                borderColor: "var(--bloomie-border)",
                color: "var(--bloomie-text)",
              }}
            >
              <RefreshCw className="size-3.5" /> New affirmation
            </button>
            <button
              type="button"
              onClick={toggleFavorite}
              className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"
              style={{
                borderColor: "var(--bloomie-border)",
                color: "var(--bloomie-text)",
              }}
            >
              <Star
                className="size-3.5"
                fill={isFavorite ? "var(--bloomie-gold)" : "none"}
                style={{ color: "var(--bloomie-gold)" }}
              />
              {isFavorite ? "Favorited" : "Favorite"}
            </button>
            <button
              type="button"
              onClick={copyText}
              className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"
              style={{
                borderColor: "var(--bloomie-border)",
                color: "var(--bloomie-text)",
              }}
            >
              {copied ? (
                <Check className="size-3.5" />
              ) : (
                <Copy className="size-3.5" />
              )}
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              type="button"
              onClick={() => setShowWhy((v) => !v)}
              className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"
              style={{
                borderColor: "var(--bloomie-border)",
                color: "var(--bloomie-text)",
              }}
            >
              <HelpCircle className="size-3.5" /> Why this matters
            </button>
          </div>

          <div className="mt-3">
            <label
              className="mb-1 block text-xs"
              style={{ color: "var(--bloomie-muted)" }}
            >
              {affirmation.reflection}
            </label>
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              rows={2}
              placeholder="Totally optional — just for you."
              className="w-full resize-none rounded-lg border bg-transparent px-2.5 py-1.5 text-sm outline-none"
              style={{
                borderColor: "var(--bloomie-border)",
                color: "var(--bloomie-text)",
              }}
            />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
