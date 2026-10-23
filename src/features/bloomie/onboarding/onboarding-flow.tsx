"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Flower2 } from "lucide-react";
import { useState } from "react";
import {
  DAY_PALETTE,
  GOAL_OPTIONS,
  STRUGGLE_OPTIONS,
  TONE_OPTIONS,
  paletteToCssVars,
} from "../config";
import type { Goal, Profile, Struggle, Tone } from "../types";

interface OnboardingFlowProps {
  initialProfile?: Profile;
  onComplete: (profile: Profile) => void;
}

const DEFAULT_DRAFT: Profile = {
  nickname: "",
  year: "",
  subjects: "",
  struggle: null,
  goal: null,
  tone: "gentle",
  wakeTime: "07:00",
  sleepTime: "23:00",
  studyHoursGoal: 4,
  onboardedAt: "",
};

const YEAR_OPTIONS = [
  "1st year",
  "2nd year",
  "3rd year",
  "Final year",
  "Internship",
  "Other",
];

const TOTAL_STEPS = 8;

function OptionGrid<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[];
  value: T | null;
  onChange: (id: T) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className="rounded-xl border px-3 py-2.5 text-left text-sm transition-colors"
          style={{
            borderColor:
              value === opt.id
                ? "var(--bloomie-accent)"
                : "var(--bloomie-border)",
            backgroundColor:
              value === opt.id ? "var(--bloomie-accent-soft)" : "transparent",
            color: "var(--bloomie-text)",
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Eight questions, every one skippable — Next is never blocked on an
 * answer. The welcome screen counts as step 0, so progress reads 1-8 for
 * the actual questions.
 */
export function OnboardingFlow({
  initialProfile,
  onComplete,
}: OnboardingFlowProps) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Profile>(initialProfile ?? DEFAULT_DRAFT);

  const isLastStep = step === TOTAL_STEPS;
  const isWelcome = step === 0;

  function next() {
    if (isLastStep) {
      onComplete({ ...draft, onboardedAt: new Date().toISOString() });
      return;
    }
    setStep((s) => s + 1);
  }

  function back() {
    setStep((s) => Math.max(0, s - 1));
  }

  return (
    <div
      className="rounded-[28px] border p-6 sm:p-10"
      style={{
        ...paletteToCssVars(DAY_PALETTE),
        backgroundColor: "var(--bloomie-bg)",
        borderColor: "var(--bloomie-border)",
      }}
    >
      {!isWelcome && (
        <div className="mb-6 flex items-center gap-1.5">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className="h-1.5 flex-1 rounded-full"
              style={{
                backgroundColor:
                  i < step ? "var(--bloomie-accent)" : "var(--bloomie-border)",
              }}
            />
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.2 }}
          className="min-h-[220px]"
        >
          {step === 0 && (
            <div className="flex flex-col items-center gap-4 text-center">
              <Flower2
                className="size-8"
                style={{ color: "var(--bloomie-accent)" }}
              />
              <h2
                className="text-xl font-semibold"
                style={{ color: "var(--bloomie-text)" }}
              >
                Hi, sweetheart. ♡
              </h2>
              <p
                className="max-w-sm text-sm leading-relaxed"
                style={{ color: "var(--bloomie-muted)" }}
              >
                You don&apos;t have to have everything figured out. Let&apos;s
                make today a little softer — I just want to get to know you a
                bit first.
              </p>
            </div>
          )}

          {step === 1 && (
            <Question label="What should we call you?">
              <input
                value={draft.nickname}
                onChange={(e) =>
                  setDraft({ ...draft, nickname: e.target.value })
                }
                placeholder="A nickname is perfect"
                autoFocus
                className="w-full rounded-xl border bg-transparent px-3 py-2 text-sm outline-none"
                style={{
                  borderColor: "var(--bloomie-border)",
                  color: "var(--bloomie-text)",
                }}
              />
            </Question>
          )}

          {step === 2 && (
            <Question label="Which MBBS year are you in?">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {YEAR_OPTIONS.map((year) => (
                  <button
                    key={year}
                    type="button"
                    onClick={() => setDraft({ ...draft, year })}
                    className="rounded-xl border px-3 py-2 text-sm"
                    style={{
                      borderColor:
                        draft.year === year
                          ? "var(--bloomie-accent)"
                          : "var(--bloomie-border)",
                      backgroundColor:
                        draft.year === year
                          ? "var(--bloomie-accent-soft)"
                          : "transparent",
                      color: "var(--bloomie-text)",
                    }}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </Question>
          )}

          {step === 3 && (
            <Question label="Which subjects are you studying currently?">
              <input
                value={draft.subjects}
                onChange={(e) =>
                  setDraft({ ...draft, subjects: e.target.value })
                }
                placeholder="e.g. Anatomy, Physiology, Biochemistry"
                className="w-full rounded-xl border bg-transparent px-3 py-2 text-sm outline-none"
                style={{
                  borderColor: "var(--bloomie-border)",
                  color: "var(--bloomie-text)",
                }}
              />
            </Question>
          )}

          {step === 4 && (
            <Question label="What is your biggest struggle right now?">
              <OptionGrid<Struggle>
                options={STRUGGLE_OPTIONS}
                value={draft.struggle}
                onChange={(struggle) => setDraft({ ...draft, struggle })}
              />
            </Question>
          )}

          {step === 5 && (
            <Question label="What would you like Bloomie to help you with?">
              <OptionGrid<Goal>
                options={GOAL_OPTIONS}
                value={draft.goal}
                onChange={(goal) => setDraft({ ...draft, goal })}
              />
            </Question>
          )}

          {step === 6 && (
            <Question label="What tone feels most comforting?">
              <OptionGrid<Tone>
                options={TONE_OPTIONS}
                value={draft.tone}
                onChange={(tone) => setDraft({ ...draft, tone })}
              />
            </Question>
          )}

          {step === 7 && (
            <Question label="What time do you usually wake up and sleep?">
              <div className="flex flex-wrap gap-4">
                <label
                  className="text-sm"
                  style={{ color: "var(--bloomie-muted)" }}
                >
                  Wake
                  <input
                    type="time"
                    value={draft.wakeTime}
                    onChange={(e) =>
                      setDraft({ ...draft, wakeTime: e.target.value })
                    }
                    className="mt-1 block rounded-xl border bg-transparent px-3 py-2 text-sm outline-none"
                    style={{
                      borderColor: "var(--bloomie-border)",
                      color: "var(--bloomie-text)",
                    }}
                  />
                </label>
                <label
                  className="text-sm"
                  style={{ color: "var(--bloomie-muted)" }}
                >
                  Sleep
                  <input
                    type="time"
                    value={draft.sleepTime}
                    onChange={(e) =>
                      setDraft({ ...draft, sleepTime: e.target.value })
                    }
                    className="mt-1 block rounded-xl border bg-transparent px-3 py-2 text-sm outline-none"
                    style={{
                      borderColor: "var(--bloomie-border)",
                      color: "var(--bloomie-text)",
                    }}
                  />
                </label>
              </div>
            </Question>
          )}

          {step === 8 && (
            <Question label="How many realistic focused study hours would you like to aim for?">
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={draft.studyHoursGoal}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      studyHoursGoal: Number(e.target.value),
                    })
                  }
                  className="flex-1"
                />
                <span
                  className="w-20 shrink-0 text-sm font-medium"
                  style={{ color: "var(--bloomie-text)" }}
                >
                  {draft.studyHoursGoal} hrs/day
                </span>
              </div>
              <p
                className="mt-2 text-xs"
                style={{ color: "var(--bloomie-muted)" }}
              >
                Whatever number feels honest and kind — there&apos;s no wrong
                answer here.
              </p>
            </Question>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={back}
          disabled={step === 0}
          className="flex items-center gap-1 text-sm font-medium disabled:opacity-0"
          style={{ color: "var(--bloomie-muted)" }}
        >
          <ChevronLeft className="size-4" /> Back
        </button>
        <button
          type="button"
          onClick={next}
          className="flex items-center gap-1 rounded-full px-5 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: "var(--bloomie-accent)" }}
        >
          {isWelcome ? "Let's begin" : isLastStep ? "Bloom 🌷" : "Next"}
          {!isLastStep && <ChevronRight className="size-4" />}
        </button>
      </div>
    </div>
  );
}

function Question({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3
        className="mb-4 text-base font-medium"
        style={{ color: "var(--bloomie-text)" }}
      >
        {label}
      </h3>
      {children}
    </div>
  );
}
