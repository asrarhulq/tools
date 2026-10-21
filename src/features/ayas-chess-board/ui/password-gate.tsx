"use client";

import { Lock } from "lucide-react";
import { useState } from "react";
import { checkPassword } from "../lib/gate";

interface PasswordGateProps {
  onUnlock: () => void;
}

export function PasswordGate({ onUnlock }: PasswordGateProps) {
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
    <div
      className="flex flex-col items-center gap-4 rounded-[var(--radius)] border p-8 text-center sm:p-12"
      style={{ backgroundColor: "#fff7f8", borderColor: "#f3d3dc" }}
    >
      <Lock className="size-6 text-[#d9748f]" />
      <div>
        <h2 className="text-lg font-semibold text-[#4a2c3a]">
          Aya&apos;s Chess Board
        </h2>
        <p className="mt-1 text-sm text-[#9c7684]">
          This one&apos;s just for us. What&apos;s our thing? 🌸
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
          className="rounded-md border border-[#f3d3dc] bg-white px-3 py-2 text-center text-sm text-[#4a2c3a] outline-none focus:border-[#d9748f]"
        />
        <button
          type="submit"
          className="rounded-md bg-[#d9748f] px-3 py-2 text-sm font-medium text-white hover:bg-[#c9607d]"
        >
          Unlock
        </button>
        {wrong && (
          <p className="text-xs text-[#e8616f]">Not quite — try again. 🌸</p>
        )}
      </form>
    </div>
  );
}
