"use client";

import { useTheme } from "next-themes";
import { Toaster as SonnerToaster } from "sonner";

/**
 * Theme-aware toast region. sonner reads our CSS variables so toasts match the
 * active theme automatically.
 */
export function Toaster() {
  const { resolvedTheme } = useTheme();

  return (
    <SonnerToaster
      theme={(resolvedTheme as "light" | "dark" | undefined) ?? "system"}
      position="bottom-center"
      richColors
      closeButton
      toastOptions={{
        style: {
          background: "var(--glass-bg)",
          backdropFilter: "blur(16px)",
          border: "1px solid var(--color-border)",
          color: "var(--color-foreground)",
        },
      }}
    />
  );
}
