export const GATE_STORAGE_KEY = "asrarul-tools:ayas-chess-board:unlocked:v1";

const PASSWORD = "we eat a lot";

/**
 * A fun speed-bump, not real security — this whole site is static and
 * client-side with no backend, so the check (and the password itself)
 * necessarily lives in the shipped JS either way. Case/whitespace-
 * insensitive so she doesn't have to match capitalization exactly.
 */
export function checkPassword(input: string): boolean {
  return input.trim().toLowerCase() === PASSWORD;
}
