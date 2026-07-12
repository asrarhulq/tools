"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

/**
 * SSR-safe localStorage state built on `useSyncExternalStore` — the canonical
 * React primitive for external stores. It returns the server snapshot
 * (`defaultValue`) during SSR and the first client render, then the real stored
 * value, with no setState-in-effect and no tearing. `hydrated` is true once the
 * client snapshot is active.
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
): readonly [T, (value: T | ((prev: T) => T)) => void, boolean] {
  const subscribe = useCallback(
    (onChange: () => void) => {
      function onStorage(event: StorageEvent) {
        if (event.key === key) onChange();
      }
      window.addEventListener("storage", onStorage);
      window.addEventListener(LOCAL_EVENT, onChange);
      return () => {
        window.removeEventListener("storage", onStorage);
        window.removeEventListener(LOCAL_EVENT, onChange);
      };
    },
    [key],
  );

  const getSnapshot = useCallback(() => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }, [key]);

  // Server + first-render snapshot: no window access.
  const getServerSnapshot = useCallback(() => null, []);

  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const value = useMemo<T>(() => {
    if (raw === null) return defaultValue;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
  }, [raw, defaultValue]);

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      let current: T = defaultValue;
      try {
        const existing = window.localStorage.getItem(key);
        if (existing !== null) current = JSON.parse(existing) as T;
      } catch {
        current = defaultValue;
      }
      const resolved =
        typeof next === "function" ? (next as (p: T) => T)(current) : next;
      try {
        window.localStorage.setItem(key, JSON.stringify(resolved));
        // Notify same-tab subscribers (the native `storage` event is cross-tab).
        window.dispatchEvent(new Event(LOCAL_EVENT));
      } catch {
        // Storage may be unavailable (private mode, quota).
      }
    },
    [key, defaultValue],
  );

  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  return [value, set, hydrated] as const;
}

const LOCAL_EVENT = "asrarul-tools:local-storage";
