import type { Quote } from "../types";

/**
 * Rotating philosophical + scientific quotes shown during focus. Kept short so
 * they read cleanly under the ring and in Focus Mode.
 */
export const QUOTES: readonly Quote[] = [
  {
    text: "You have power over your mind — not outside events. Realize this, and you will find strength.",
    author: "Marcus Aurelius",
  },
  {
    text: "Concentrate every minute like a Roman on doing what's in front of you, with precise and genuine seriousness.",
    author: "Marcus Aurelius",
  },
  {
    text: "It is not that we have a short time to live, but that we waste a lot of it.",
    author: "Seneca",
  },
  { text: "While we are postponing, life speeds by.", author: "Seneca" },
  {
    text: "He who has a why to live can bear almost any how.",
    author: "Friedrich Nietzsche",
  },
  {
    text: "The higher we soar, the smaller we appear to those who cannot fly.",
    author: "Friedrich Nietzsche",
  },
  {
    text: "Who looks outside, dreams; who looks inside, awakes.",
    author: "Carl Jung",
  },
  {
    text: "Until you make the unconscious conscious, it will direct your life and you will call it fate.",
    author: "Carl Jung",
  },
  {
    text: "This is the real secret of life — to be completely engaged with what you are doing in the here and now.",
    author: "Alan Watts",
  },
  {
    text: "The only way to make sense out of change is to plunge into it, move with it, and join the dance.",
    author: "Alan Watts",
  },
  {
    text: "Simplicity is the ultimate sophistication.",
    author: "Leonardo da Vinci",
  },
  {
    text: "It had long since come to my attention that people of accomplishment rarely sat back and let things happen to them.",
    author: "Leonardo da Vinci",
  },
  {
    text: "I would rather have questions that can't be answered than answers that can't be questioned.",
    author: "Richard Feynman",
  },
  {
    text: "The first principle is that you must not fool yourself — and you are the easiest person to fool.",
    author: "Richard Feynman",
  },
];

/** Deterministic pick so server/client match; caller rotates by index. */
export function quoteAt(index: number): Quote {
  return QUOTES[Math.abs(index) % QUOTES.length]!;
}
