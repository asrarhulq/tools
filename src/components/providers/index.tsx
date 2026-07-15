"use client";

import { useEffect } from "react";
import { ThemeProvider } from "./theme-provider";
import { CommandPaletteProvider } from "@/components/command/command-palette-provider";
import { Toaster } from "@/components/chrome/toaster";

/**
 * Client provider stack composed once at the root: theme, command palette,
 * and the toast region. Keeping this boundary thin lets pages stay Server
 * Components.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  // The app rendered successfully, so clear the one-shot chunk-reload guard
  // (see app/error.tsx) — a genuinely new stale-chunk error later is then free
  // to trigger a fresh self-healing reload.
  useEffect(() => {
    try {
      sessionStorage.removeItem("chunk-reload-once");
    } catch {
      /* sessionStorage unavailable — non-fatal */
    }
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <CommandPaletteProvider>{children}</CommandPaletteProvider>
      <Toaster />
    </ThemeProvider>
  );
}
