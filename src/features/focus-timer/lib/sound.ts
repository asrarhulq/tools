/**
 * Tiny WebAudio chime generator — no audio assets to ship, works offline, and
 * respects volume/mute. Lazily creates a single AudioContext on first use
 * (after a user gesture, per browser autoplay rules).
 */

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(freq: number, start: number, dur: number, gainPeak: number) {
  const ac = audio();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, ac.currentTime + start);
  gain.gain.setValueAtTime(0, ac.currentTime + start);
  gain.gain.linearRampToValueAtTime(gainPeak, ac.currentTime + start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + start + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(ac.currentTime + start);
  osc.stop(ac.currentTime + start + dur + 0.02);
}

/** Warm two-note chime when a session completes. */
export function playComplete(volume: number) {
  const v = Math.max(0, Math.min(1, volume)) * 0.5;
  tone(660, 0, 0.5, v);
  tone(880, 0.14, 0.6, v);
}

/** Soft single tick for start/skip actions. */
export function playTick(volume: number) {
  const v = Math.max(0, Math.min(1, volume)) * 0.3;
  tone(520, 0, 0.16, v);
}

/** Celebratory triad on a milestone (long break earned). */
export function playMilestone(volume: number) {
  const v = Math.max(0, Math.min(1, volume)) * 0.45;
  tone(523.25, 0, 0.4, v);
  tone(659.25, 0.12, 0.45, v);
  tone(783.99, 0.24, 0.6, v);
}
