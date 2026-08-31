import { Lora } from "next/font/google";

/**
 * A serif face for philosophical text (lens prompts, reflections, journal
 * preview) — self-hosted by next/font at build time like the site's global
 * fonts (`src/lib/fonts.ts`), but deliberately kept OUT of that shared module
 * and out of `app/layout.tsx`. This tool wants its own "study room" identity
 * that doesn't bleed into the rest of the site; the sans-serif UI chrome
 * still uses the site's existing `--font-sans`.
 */
export const fontSerif = Lora({
  subsets: ["latin"],
  variable: "--font-mm-serif",
  display: "swap",
  preload: true,
  style: ["normal", "italic"],
});
