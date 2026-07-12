"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * Returns `false` on the server and first client render, then `true` — the
 * standard "am I hydrated?" signal, implemented with `useSyncExternalStore` so
 * there is no setState-in-effect. Use to gate rendering that depends on
 * client-only state (theme, localStorage) and would otherwise mismatch.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
