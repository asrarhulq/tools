"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { FlavorMessage } from "../types";

interface MessageBannerProps {
  message: FlavorMessage | null;
}

export function MessageBanner({ message }: MessageBannerProps) {
  return (
    <div className="min-h-[4.5rem] rounded-[var(--radius)] border border-[#f3d3dc] bg-[#fff0f3] px-4 py-3">
      <AnimatePresence mode="wait">
        {message && (
          <motion.div
            key={message.text}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
          >
            <p className="text-sm leading-relaxed text-[#4a2c3a]">
              {message.text}
            </p>
            {message.glossary && (
              <p className="mt-1.5 text-xs text-[#9c7684]">
                <span dir="rtl" className="mr-1.5 font-semibold">
                  {message.glossary.arabic}
                </span>
                ({message.glossary.transliteration}) —{" "}
                {message.glossary.english}
                {message.glossary.note ? `, ${message.glossary.note}` : ""}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
