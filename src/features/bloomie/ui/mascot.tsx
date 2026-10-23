"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { MASCOT_MESSAGES } from "../config";
import { dateKey } from "../lib/mood";
import { mascotMessageForDate } from "../lib/greeting";

/** Bibi — a small original bunny, built from simple shapes so it stays
 * legible at a tiny size and needs no external image asset. */
function Bibi() {
  return (
    <svg
      width="56"
      height="56"
      viewBox="0 0 100 100"
      aria-hidden="true"
      className="drop-shadow-sm"
    >
      <ellipse
        cx="38"
        cy="22"
        rx="7"
        ry="20"
        fill="#fff"
        stroke="#e88ead"
        strokeWidth="2.5"
      />
      <ellipse
        cx="62"
        cy="22"
        rx="7"
        ry="20"
        fill="#fff"
        stroke="#e88ead"
        strokeWidth="2.5"
      />
      <ellipse cx="38" cy="24" rx="3" ry="12" fill="#f8c8dc" />
      <ellipse cx="62" cy="24" rx="3" ry="12" fill="#f8c8dc" />
      <circle
        cx="50"
        cy="60"
        r="32"
        fill="#fff"
        stroke="#e88ead"
        strokeWidth="2.5"
      />
      <circle cx="39" cy="58" r="3.4" fill="#554653" />
      <circle cx="61" cy="58" r="3.4" fill="#554653" />
      <ellipse cx="50" cy="68" rx="4" ry="3" fill="#e88ead" />
      <path
        d="M50 70 Q44 76 38 72"
        stroke="#554653"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M50 70 Q56 76 62 72"
        stroke="#554653"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="28" cy="64" r="5" fill="#f8c8dc" opacity="0.8" />
      <circle cx="72" cy="64" r="5" fill="#f8c8dc" opacity="0.8" />
    </svg>
  );
}

export function Mascot() {
  const [message, setMessage] = useState(() => mascotMessageForDate(dateKey()));

  return (
    <div className="flex items-center gap-3">
      <motion.button
        type="button"
        whileHover={{ rotate: -4, scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() =>
          setMessage(
            MASCOT_MESSAGES[
              Math.floor(Math.random() * MASCOT_MESSAGES.length)
            ]!,
          )
        }
        aria-label="Bibi — tap for another little message"
        className="shrink-0"
      >
        <Bibi />
      </motion.button>
      <p className="text-sm text-[color:var(--bloomie-muted)] italic">
        {message}
      </p>
    </div>
  );
}
