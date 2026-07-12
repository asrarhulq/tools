import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge conditional class names and de-duplicate conflicting Tailwind
 * utilities (e.g. `px-2` + `px-4` → `px-4`). Use for every className that
 * combines a base style with variant/prop-driven overrides.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Absolute URL builder anchored to the configured site origin. */
export function absoluteUrl(path = ""): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return new URL(path, base).toString();
}
