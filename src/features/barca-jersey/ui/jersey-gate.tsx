"use client";

import { Lock } from "lucide-react";
import { useState } from "react";
import { checkPassword } from "../lib/gate";

/**
 * The whole tool, not just the editor, sits behind this now — same pattern
 * as `ayas-chess-board` and `bloomie`: nobody browsing General should be
 * able to tell what this actually is without the password. Styled in the
 * jersey's own blaugrana palette rather than reusing another tool's colors.
 */
export function JerseyGate({ onUnlock }: { onUnlock: () => void }) {
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
    <div className="flex flex-col items-center gap-4 rounded-[var(--radius)] border border-[#223457] bg-[#0b1830] p-8 text-center sm:p-12">
      <Lock className="size-6 text-[#f0b429]" />
      <div>
        <h2 className="text-lg font-semibold text-white">
          Barça Jersey Studio
        </h2>
        <p className="mt-1 text-sm text-[#9fb0d6]">
          This one&apos;s made for one person. What&apos;s our thing?
        </p>
      </div>
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-xs flex-col gap-2"
      >
        <input
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setWrong(false);
          }}
          placeholder="…"
          autoFocus
          className="rounded-md border border-[#2c4270] bg-[#102445] px-3 py-2 text-center text-sm text-white outline-none focus:border-[#f0b429]"
        />
        <button
          type="submit"
          className="rounded-md bg-[#9c1b4c] px-3 py-2 text-sm font-medium text-white hover:bg-[#86173f]"
        >
          Unlock
        </button>
        {wrong && (
          <p className="text-xs text-[#ff9fb3]">Not quite — try again.</p>
        )}
      </form>
    </div>
  );
}
