let ctx = null;

// Short beep, only ever called from a click or tap.
export function beep(freq = 2700, ms = 120, vol = 0.05) {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = ctx || new AC();
    if (ctx.state === "suspended") ctx.resume();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "square";
    o.frequency.value = freq;
    g.gain.value = vol;
    o.connect(g);
    g.connect(ctx.destination);
    const end = ctx.currentTime + ms / 1000;
    g.gain.setTargetAtTime(0.0001, end - 0.03, 0.01);
    o.start();
    o.stop(end);
  } catch {
    /* audio is optional */
  }
}
