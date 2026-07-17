"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Download, RotateCcw, Trash2, Upload, X } from "lucide-react";
import { useFocus } from "../state/store";
import { ACCENTS } from "../lib/config";
import type { AccentId } from "../types";

/**
 * Slide-over settings panel. Every control writes straight through to the
 * store's `setSettings`, which persists to IndexedDB (+ a localStorage mirror).
 * Grouped into Durations, Automation, Feedback, Appearance, and Backup.
 */
export function SettingsPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const {
    settings,
    setSettings,
    resetSettings,
    clearStats,
    exportBackup,
    importBackup,
  } = useFocus();
  const reduce = useReducedMotion();
  const [confirmClear, setConfirmClear] = useState(false);
  const [importMsg, setImportMsg] = useState<{
    kind: "ok" | "err";
    text: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onImportFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text) as unknown;
      const count = await importBackup(json);
      setImportMsg({ kind: "ok", text: `Imported ${count} sessions.` });
    } catch (e) {
      setImportMsg({
        kind: "err",
        text: e instanceof Error ? e.message : "Couldn't read that file.",
      });
    }
  };

  const requestNotifications = async () => {
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "granted") {
      setSettings({ notifications: true });
      return;
    }
    const perm = await Notification.requestPermission();
    setSettings({ notifications: perm === "granted" });
  };

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            aria-hidden="true"
          />
          <motion.aside
            role="dialog"
            aria-label="Timer settings"
            initial={reduce ? { opacity: 0 } : { x: "100%" }}
            animate={reduce ? { opacity: 1 } : { x: 0 }}
            exit={reduce ? { opacity: 0 } : { x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 36 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl"
          >
            <header className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
              <h2 className="font-display text-lg font-semibold">Settings</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close settings"
                className="flex size-9 items-center justify-center rounded-full text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] [&_svg]:size-5"
              >
                <X />
              </button>
            </header>

            <div className="flex-1 space-y-8 overflow-y-auto px-6 py-6">
              {/* Durations */}
              <Group title="Durations">
                <NumberField
                  label="Focus (min)"
                  value={settings.focusMin}
                  min={1}
                  max={120}
                  onChange={(v) => setSettings({ focusMin: v })}
                />
                <NumberField
                  label="Short break (min)"
                  value={settings.shortMin}
                  min={1}
                  max={60}
                  onChange={(v) => setSettings({ shortMin: v })}
                />
                <NumberField
                  label="Long break (min)"
                  value={settings.longMin}
                  min={1}
                  max={90}
                  onChange={(v) => setSettings({ longMin: v })}
                />
                <NumberField
                  label="Sessions per long break"
                  value={settings.cycleLength}
                  min={2}
                  max={12}
                  onChange={(v) => setSettings({ cycleLength: v })}
                />
                <NumberField
                  label="Daily goal (sessions)"
                  value={settings.dailyGoal}
                  min={1}
                  max={24}
                  onChange={(v) => setSettings({ dailyGoal: v })}
                />
              </Group>

              {/* Automation */}
              <Group title="Automation">
                <Toggle
                  label="Auto-start breaks"
                  checked={settings.autoStartBreaks}
                  onChange={(v) => setSettings({ autoStartBreaks: v })}
                />
                <Toggle
                  label="Auto-start focus"
                  checked={settings.autoStartFocus}
                  onChange={(v) => setSettings({ autoStartFocus: v })}
                />
              </Group>

              {/* Feedback */}
              <Group title="Feedback">
                <Toggle
                  label="Sounds"
                  checked={settings.sound}
                  onChange={(v) => setSettings({ sound: v })}
                />
                {settings.sound ? (
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm">Volume</span>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={settings.volume}
                      onChange={(e) =>
                        setSettings({ volume: Number(e.target.value) })
                      }
                      className="w-40 accent-[var(--color-primary)]"
                      aria-label="Volume"
                    />
                  </div>
                ) : null}
                <Toggle
                  label="Browser notifications"
                  checked={settings.notifications}
                  onChange={(v) =>
                    v
                      ? requestNotifications()
                      : setSettings({ notifications: false })
                  }
                />
              </Group>

              {/* Appearance */}
              <Group title="Appearance">
                <Toggle
                  label="Animations"
                  checked={settings.animations}
                  onChange={(v) => setSettings({ animations: v })}
                />
                <Toggle
                  label="Hide seconds"
                  checked={settings.hideSeconds}
                  onChange={(v) => setSettings({ hideSeconds: v })}
                />
                <div>
                  <span className="text-sm">Accent</span>
                  <div className="mt-2 flex gap-2">
                    {(Object.keys(ACCENTS) as AccentId[]).map((id) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setSettings({ accent: id })}
                        aria-label={ACCENTS[id].label}
                        aria-pressed={settings.accent === id}
                        className="flex size-8 items-center justify-center rounded-full transition-transform hover:scale-110"
                        style={{
                          backgroundColor: ACCENTS[id].color,
                          outline:
                            settings.accent === id
                              ? "2px solid var(--color-foreground)"
                              : "none",
                          outlineOffset: 2,
                        }}
                      >
                        {settings.accent === id ? (
                          <Check className="size-4 text-white" />
                        ) : null}
                      </button>
                    ))}
                  </div>
                </div>
              </Group>

              {/* Backup */}
              <Group title="Backup">
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  Your history lives in this browser (IndexedDB). Export a file
                  to keep a copy or move it to another device.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={exportBackup}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-1.5 text-sm font-medium transition-colors hover:bg-[var(--color-muted)] [&_svg]:size-4"
                  >
                    <Download /> Export data
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-1.5 text-sm font-medium transition-colors hover:bg-[var(--color-muted)] [&_svg]:size-4"
                  >
                    <Upload /> Import data
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json,.json"
                    className="hidden"
                    onChange={(e) => {
                      void onImportFile(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </div>
                {importMsg ? (
                  <p
                    className="text-xs"
                    style={{
                      color:
                        importMsg.kind === "ok"
                          ? "var(--color-ok)"
                          : "var(--color-crit)",
                    }}
                  >
                    {importMsg.text}
                  </p>
                ) : null}
              </Group>
            </div>

            <footer className="flex items-center justify-between gap-3 border-t border-[var(--color-border)] px-6 py-4">
              <button
                type="button"
                onClick={resetSettings}
                className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)] [&_svg]:size-4"
              >
                <RotateCcw /> Reset defaults
              </button>
              {confirmClear ? (
                <button
                  type="button"
                  onClick={() => {
                    clearStats();
                    setConfirmClear(false);
                  }}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-crit)] [&_svg]:size-4"
                >
                  <Trash2 /> Confirm — erase all stats
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-crit)] [&_svg]:size-4"
                >
                  <Trash2 /> Clear stats
                </button>
              )}
            </footer>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h3 className="microlabel">{title}</h3>
      {children}
    </section>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  return (
    <div className="flex items-center justify-between gap-4">
      <label className="text-sm">{label}</label>
      <div className="flex items-center rounded-full border border-[var(--color-border)]">
        <button
          type="button"
          onClick={() => onChange(clamp(value - 1))}
          aria-label={`Decrease ${label}`}
          className="flex size-8 items-center justify-center rounded-full text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)]"
        >
          −
        </button>
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={(e) => onChange(clamp(Number(e.target.value) || min))}
          className="w-12 [appearance:textfield] bg-transparent text-center text-sm tabular-nums outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button
          type="button"
          onClick={() => onChange(clamp(value + 1))}
          aria-label={`Increase ${label}`}
          className="flex size-8 items-center justify-center rounded-full text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)]"
        >
          +
        </button>
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className="relative h-6 w-11 shrink-0 rounded-full transition-colors"
        style={{
          backgroundColor: checked
            ? "var(--color-primary)"
            : "var(--color-muted)",
        }}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 500, damping: 34 }}
          className="absolute top-0.5 size-5 rounded-full bg-white shadow-sm"
          style={{ left: checked ? "1.375rem" : "0.125rem" }}
        />
      </button>
    </div>
  );
}
