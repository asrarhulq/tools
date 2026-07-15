"use client";

import { useEffect } from "react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

/**
 * Route-level error boundary. Must be a Client Component. In production, wire
 * `error.digest` to your monitoring provider (Sentry, etc.) here.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // A ChunkLoadError means the browser asked for a JS chunk that no longer
    // exists — typically a stale tab after a new deploy (or dev HMR rebuild).
    // The fresh HTML references new chunk hashes, so a single hard reload
    // self-heals it. Guard with sessionStorage so we never reload-loop if the
    // chunk is genuinely, permanently missing.
    const isChunkError =
      error.name === "ChunkLoadError" ||
      /Loading chunk|Failed to load chunk|error loading dynamically imported module/i.test(
        error.message,
      );
    if (isChunkError && typeof window !== "undefined") {
      const KEY = "chunk-reload-once";
      if (!sessionStorage.getItem(KEY)) {
        sessionStorage.setItem(KEY, "1");
        window.location.reload();
        return;
      }
    }
    // Replace with a real logger/monitoring call in production.
    console.error(error);
  }, [error]);

  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-[var(--color-muted-foreground)]">
          An unexpected error occurred. You can try again.
        </p>
      </div>
      <Button onClick={reset}>Try again</Button>
    </Container>
  );
}
