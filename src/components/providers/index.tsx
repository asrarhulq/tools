"use client";

import { ThemeProvider } from "./theme-provider";
import { CommandPaletteProvider } from "@/components/command/command-palette-provider";
import { Toaster } from "@/components/chrome/toaster";

/**
 * Client provider stack composed once at the root: theme, command palette,
 * and the toast region. Keeping this boundary thin lets pages stay Server
 * Components.
 */
export function Providers({ children }: { children: React.ReactNode }) {
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
