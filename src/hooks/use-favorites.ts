"use client";

import { useCallback } from "react";
import { useLocalStorage } from "./use-local-storage";

const STORAGE_KEY = "asrarul-tools:favorites";

/**
 * Favorite tool ids persisted to localStorage. `hydrated` lets the UI avoid
 * flashing the wrong state before the stored value is read.
 */
export function useFavorites() {
  const [favorites, setFavorites, hydrated] = useLocalStorage<string[]>(
    STORAGE_KEY,
    [],
  );

  const isFavorite = useCallback(
    (id: string) => favorites.includes(id),
    [favorites],
  );

  const toggleFavorite = useCallback(
    (id: string) => {
      setFavorites((prev) =>
        prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id],
      );
    },
    [setFavorites],
  );

  return { favorites, isFavorite, toggleFavorite, hydrated } as const;
}
