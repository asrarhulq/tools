"use client";

import { Flower2 } from "lucide-react";
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
      className="flex flex-col items-center gap-4 rounded-[28px] border p-8 text-center sm:p-12"
      style={{ backgroundColor: "#fff9f2", borderColor: "#f6d9e6" }}
    >
      <Flower2 className="size-7 text-[#e88ead]" />
      <div>
        <h2 className="text-lg font-semibold text-[#554653]">
          Bloomie — your little corner of growth
        </h2>
        <p className="mt-1 text-sm text-[#8a7488]">
          This space is just for you. What&apos;s the word? 🌷
        </p>
      </div>
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-xs flex-col gap-2"
      >
        <input
          type="password"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setWrong(false);
          }}
          placeholder="…"
          autoFocus
          className="rounded-full border border-[#f6d9e6] bg-white px-4 py-2 text-center text-sm text-[#554653] outline-none focus:border-[#e88ead]"
        />
        <button
          type="submit"
          className="rounded-full bg-[#e88ead] px-4 py-2 text-sm font-medium text-white hover:bg-[#d9748f]"
        >
          Open my space
        </button>
        {wrong && (
          <p className="text-xs text-[#d9748f]">
            Not quite — take a breath and try again. 🌷
          </p>
        )}
      </form>
    </div>
  );
}
