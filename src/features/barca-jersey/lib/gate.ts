export const GATE_STORAGE_KEY = "asrarul-tools:barca-jersey:unlocked:v1";

const PASSWORD = "we eat a lot";

/**
 * A fun speed-bump, not real security — same caveat as `ayas-chess-board`'s
 * gate: this site is fully static and client-side with no backend, so the
 * password necessarily ships in the JS bundle either way. This only gates
 * the name/number editor, not the viewer itself — anyone can still look at
 * and spin the jersey, they just can't rename it off her.
 */
export function checkPassword(input: string): boolean {
  return input.trim().toLowerCase() === PASSWORD;
}
