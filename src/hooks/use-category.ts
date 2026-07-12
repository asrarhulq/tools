"use client";

import { useCallback, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CATEGORY_IDS, type CategoryId } from "@/types/tool";

const STORAGE_KEY = "asrarul-tools:category";
const DEFAULT_CATEGORY: CategoryId = "philosophy";

function isCategory(value: string | null): value is CategoryId {
  return value !== null && (CATEGORY_IDS as readonly string[]).includes(value);
}

/**
 * Active category state with the agreed precedence: URL `?category=` wins (so
 * links are shareable); otherwise fall back to the last localStorage value;
 * otherwise the default. Switching updates BOTH the URL and localStorage.
 *
 * The URL is the source of truth for render, so this stays SSR-consistent —
 * localStorage only seeds the URL once, on mount, when no param is present.
 */
export function useCategory() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const param = searchParams.get("category");
  const active: CategoryId = isCategory(param) ? param : DEFAULT_CATEGORY;

  // On mount with no URL param, restore the last-used category from storage.
  useEffect(() => {
    if (param !== null) return;
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      stored = null;
    }
    if (isCategory(stored) && stored !== DEFAULT_CATEGORY) {
      const next = new URLSearchParams(searchParams);
      next.set("category", stored);
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    }
    // Run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setCategory = useCallback(
    (category: CategoryId) => {
      try {
        // Stored as a raw string (not JSON) to match the mount-time read above.
        window.localStorage.setItem(STORAGE_KEY, category);
      } catch {
        // Ignore storage failures.
      }
      const next = new URLSearchParams(searchParams);
      next.set("category", category);
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return { active, setCategory } as const;
}
