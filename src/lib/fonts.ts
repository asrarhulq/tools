import { Geist, Geist_Mono, Bricolage_Grotesque } from "next/font/google";

/**
 * Fonts are self-hosted by next/font at build time (no runtime request to
 * Google), preloaded, and given `display: swap` + CSS variables so there is
 * zero layout shift and no render-blocking font fetch.
 *
 * Roles: Geist Sans = body/UI, Geist Mono = numeric/technical readouts, and
 * Bricolage Grotesque = the display face for headlines. Bricolage is an
 * expressive variable grotesque (OFL) chosen so headings read as *designed*
 * rather than the default neo-grotesque.
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

export const fontDisplay = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  preload: true,
  weight: ["500", "600", "700", "800"],
});
