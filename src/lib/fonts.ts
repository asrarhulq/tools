import { Geist, Geist_Mono } from "next/font/google";

/**
 * Fonts are self-hosted by next/font at build time (no runtime request to
 * Google), preloaded, and given `display: swap` + CSS variables so there is
 * zero layout shift and no render-blocking font fetch.
 */
export const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
  preload: true,
});

export const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
  preload: true,
});
