"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, Lightbulb, Loader2, X } from "lucide-react";
import { toast } from "sonner";

/** Web3Forms access key for the "Suggest a tool" endpoint. */
const WEB3FORMS_KEY = "8f666833-dca4-48e5-8733-b968350cde5f";
const ENDPOINT = "https://api.web3forms.com/submit";

type Status = "idle" | "submitting" | "success" | "error";

/**
 * "Suggest a tool" modal form. Submits directly to Web3Forms (no backend of our
 * own) → the maintainer's inbox. Includes a honeypot for spam, inline
 * validation, loading/success/error states, ESC-to-close, focus management,
 * reduced-motion support, and full light/dark theming.
 */
export function SuggestToolDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const reduce = useReducedMotion();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  // Close on ESC; focus the first field on open; lock body scroll.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const t = setTimeout(() => firstFieldRef.current?.focus(), 60);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      clearTimeout(t);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  // Reset transient state a moment after the dialog closes.
  useEffect(() => {
    if (open) return;
    const t = setTimeout(() => {
      setStatus("idle");
      setError(null);
    }, 250);
    return () => clearTimeout(t);
  }, [open]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    // Honeypot: bots fill hidden "botcheck"; humans leave it empty.
    if (data.get("botcheck")) return;

    setStatus("submitting");
    setError(null);
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: data,
      });
      const json = (await res.json()) as {
        success?: boolean;
        message?: string;
      };
      if (res.ok && json.success) {
        setStatus("success");
        toast.success("Suggestion sent — thank you!", {
          description: "Asrar will take a look.",
        });
        form.reset();
      } else {
        throw new Error(json.message || "Submission failed. Please try again.");
      }
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    }
  }

  const submitting = status === "submitting";

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="suggest-title"
            initial={
              reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-lg overflow-hidden rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] p-5">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-[var(--color-primary)]/12 text-[var(--color-primary)]">
                  <Lightbulb className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h2
                    id="suggest-title"
                    className="font-display text-lg font-semibold"
                  >
                    Suggest a tool
                  </h2>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    Got an idea? I read every suggestion.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex size-8 shrink-0 items-center justify-center rounded-lg text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            {status === "success" ? (
              <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
                <span className="flex size-14 items-center justify-center rounded-full bg-[var(--color-ok)]/12 text-[var(--color-ok)]">
                  <CheckCircle2 className="size-7" aria-hidden="true" />
                </span>
                <h3 className="font-display text-xl font-semibold">
                  Suggestion sent!
                </h3>
                <p className="max-w-xs text-sm text-[var(--color-muted-foreground)]">
                  Thanks for helping shape asrarul.tools. You&apos;ll see it
                  here if it makes the cut.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-2 rounded-lg bg-[var(--color-primary)] px-5 py-2.5 text-sm font-medium text-[var(--color-primary-foreground)]"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4 p-5">
                <input type="hidden" name="access_key" value={WEB3FORMS_KEY} />
                <input
                  type="hidden"
                  name="subject"
                  value="New tool suggestion — asrarul.tools"
                />
                <input type="hidden" name="from_name" value="asrarul.tools" />
                {/* Honeypot (visually hidden, off-screen) */}
                <input
                  type="checkbox"
                  name="botcheck"
                  tabIndex={-1}
                  autoComplete="off"
                  className="absolute left-[-9999px] opacity-0"
                  aria-hidden="true"
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Your name" htmlFor="st-name">
                    <input
                      ref={firstFieldRef}
                      id="st-name"
                      name="name"
                      required
                      autoComplete="name"
                      placeholder="Ada Lovelace"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Your email" htmlFor="st-email">
                    <input
                      id="st-email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="you@example.com"
                      className={inputClass}
                    />
                  </Field>
                </div>

                <Field label="Tool name / idea" htmlFor="st-tool">
                  <input
                    id="st-tool"
                    name="tool_name"
                    required
                    placeholder="e.g. Gear ratio calculator"
                    className={inputClass}
                  />
                </Field>

                <Field
                  label="What should it do?"
                  htmlFor="st-desc"
                  hint="A sentence or two on the problem it solves."
                >
                  <textarea
                    id="st-desc"
                    name="message"
                    required
                    rows={4}
                    placeholder="Describe the tool and why it'd be useful…"
                    className={`${inputClass} resize-none`}
                  />
                </Field>

                {error ? (
                  <p className="rounded-lg bg-[var(--color-crit)]/10 px-3 py-2 text-sm text-[var(--color-crit)]">
                    {error}
                  </p>
                ) : null}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--color-muted)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-5 py-2.5 text-sm font-medium text-[var(--color-primary-foreground)] transition-transform active:scale-[0.98] disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <Loader2
                          className="size-4 animate-spin"
                          aria-hidden="true"
                        />
                        Sending…
                      </>
                    ) : (
                      <>
                        <Lightbulb className="size-4" aria-hidden="true" />
                        Send suggestion
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

const inputClass =
  "w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-sm outline-none transition-[border-color,box-shadow] placeholder:text-[var(--color-muted-foreground)]/60 focus-visible:border-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]/30";

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="mb-1.5 block text-xs font-medium text-[var(--color-foreground)]">
        {label}
      </span>
      {children}
      {hint ? (
        <span className="mt-1 block text-[11px] text-[var(--color-muted-foreground)]">
          {hint}
        </span>
      ) : null}
    </label>
  );
}
