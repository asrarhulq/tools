"use client";

import { Lock } from "lucide-react";
import { useState } from "react";
import { checkPassword } from "../lib/gate";

/**
 * Stands in for the name/number inputs until unlocked. Keeps the jersey
 * itself fully public (default name and number render for everyone) while
 * stopping a random visitor from casually renaming someone else's gift.
 */
export function PersonalizeGate({ onUnlock }: { onUnlock: () => void }) {
  const [value, setValue] = useState("");
  const [wrong, setWrong] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (checkPassword(value)) {
      onUnlock();
    } else {
      setWrong(true);
      setValue("");
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] p-4 text-center">
      <Lock className="size-4 text-[var(--color-muted-foreground)]" />
      <p className="text-xs text-[var(--color-muted-foreground)]">
        This jersey&apos;s made for one person. What&apos;s our thing?
      </p>
      <form onSubmit={handleSubmit} className="flex w-full flex-col gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setWrong(false);
          }}
          placeholder="…"
          autoFocus
          className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-center text-sm text-[var(--color-foreground)] outline-none focus:border-[var(--color-primary)]"
        />
        <button
          type="submit"
          className="rounded-md bg-[var(--color-primary)] px-3 py-2 text-sm font-medium text-[var(--color-primary-foreground)] hover:opacity-90"
        >
          Unlock
        </button>
        {wrong && (
          <p className="text-xs text-red-500">Not quite — try again.</p>
        )}
      </form>
    </div>
  );
}
