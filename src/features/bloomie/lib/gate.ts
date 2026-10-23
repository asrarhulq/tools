const PASSWORD = "ilhamsjournal";

/**
 * A speed bump, not real security — same caveat as `ayas-chess-board`'s
 * gate: this site is fully static and client-side with no backend, so the
 * password necessarily ships in the JS bundle either way. Worth being
 * extra upfront about that here, since this tool's content (mood check-ins,
 * private reflections) is more sensitive than a chess game.
 */
export function checkPassword(input: string): boolean {
  return input.trim().toLowerCase() === PASSWORD;
}
