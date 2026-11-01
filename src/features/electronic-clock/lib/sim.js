// A small behavioural model of this clock kit.
// It is a teaching model: it captures what each fault does, not every pin.

export const FAULT_GROUPS = [
  "Power",
  "Chip and clock",
  "Display",
  "Sound and buttons",
];

export const FAULTS = [
  {
    id: "no_power",
    group: "Power",
    part: "J1",
    label: "Power wire not connected",
    how: "A lead is not soldered, or the strands slipped out of the pad.",
    sees: "Nothing happens. The display is dark and the buzzer is silent.",
    fix: "Re-solder both wires to the + and − pads and measure 5 V across them.",
  },
  {
    id: "reversed_power",
    group: "Power",
    part: "J1",
    label: "Power wires swapped",
    how: "Red and black leads are on the wrong pads.",
    sees: "Dark display. The chip may get warm or be destroyed.",
    fix: "Unplug at once and swap the leads. There is no protection on this board.",
  },
  {
    id: "power_short",
    group: "Power",
    part: "J1",
    label: "Solder bridge across the power pads",
    how: "A drop of solder or a trimmed leg joins + to −.",
    sees: "Dark display. The supply sags or its current-limit light comes on.",
    fix: "Unplug. Look at the + and − pads and under the display, then clear the bridge with solder wick.",
  },
  {
    id: "chip_backwards",
    group: "Chip and clock",
    part: "U1",
    label: "Chip inserted backwards",
    how: "The chip notch is at the wrong end.",
    sees: "Dark display, the supply works hard, and the chip gets hot.",
    fix: "Unplug. Turn the chip round. It may no longer work.",
  },
  {
    id: "bent_pin",
    group: "Chip and clock",
    part: "U1",
    label: "Chip leg folded under",
    how: "One leg (here pin 20, power) bent underneath as the chip was pressed in.",
    sees: "Dark display. The 5 V rail is fine but pin 20 reads 0 V.",
    fix: "Lift the chip, straighten the leg with flat pliers, press it back evenly.",
  },
  {
    id: "crystal_cold",
    group: "Chip and clock",
    part: "Y1",
    label: "Cold joint on the crystal",
    how: "One leg did not get hot enough, so the solder sits on top.",
    sees: "Dark display. The chip has power but never starts.",
    fix: "Reheat both crystal pads for 2 seconds and add a touch of solder.",
  },
  {
    id: "cap30_missing",
    group: "Chip and clock",
    part: "C12",
    label: "A 30 pF capacitor left out",
    how: "C1 or C2 was skipped or its joint does not connect.",
    sees: "Dark display. The crystal does not start reliably.",
    fix: "Fit or re-solder C1 and C2.",
  },
  {
    id: "reset_r_missing",
    group: "Chip and clock",
    part: "R1",
    label: "R1 not connected",
    how: "The resistor was skipped or a joint is open.",
    sees: "Dark display. The chip is stuck in reset.",
    fix: "Fit R1, 10 kΩ (brown, black, orange).",
  },
  {
    id: "c3_reversed",
    group: "Chip and clock",
    part: "C3",
    label: "C3 electrolytic backwards",
    how: "The stripe is on the wrong side.",
    sees: "The display flashes: it wakes for a couple of seconds, then restarts at 12:00.",
    fix: "Replace C3 with the stripe on the negative side.",
  },
  {
    id: "bridge_ef",
    group: "Display",
    part: "DS1",
    label: "Solder bridge between two display pins",
    how: "A blob of solder joins the pins of segments e and f.",
    sees: "Ghost segments: when one of the two lights, the other lights with it.",
    fix: "Press solder wick across the bridge and heat it.",
  },
  {
    id: "digit3_open",
    group: "Display",
    part: "DS1",
    label: "Digit 3 pin not soldered",
    how: "One of the display pins has no joint.",
    sees: "The third digit stays dark while the others work.",
    fix: "Reheat that pin and add a little solder.",
  },
  {
    id: "seg_open_g",
    group: "Display",
    part: "DS1",
    label: "Segment g pin not soldered",
    how: "The pin for the middle bar has no joint.",
    sees: "The middle bar is missing on all four digits.",
    fix: "Reheat that pin. All digits share it.",
  },
  {
    id: "q1_backwards",
    group: "Sound and buttons",
    part: "Q1",
    label: "Q1 transistor reversed",
    how: "The flat face does not match the silkscreen.",
    sees: "The clock works, but the buzzer never beeps.",
    fix: "Re-solder Q1 the right way round.",
  },
  {
    id: "buzzer_reversed",
    group: "Sound and buttons",
    part: "BZ1",
    label: "Buzzer backwards",
    how: "The + mark does not match the board.",
    sees: "The clock works, but the buzzer is silent.",
    fix: "Turn the buzzer around.",
  },
  {
    id: "button_open",
    group: "Sound and buttons",
    part: "S2",
    label: "Button S2 joint open",
    how: "A leg of S2 was not soldered.",
    sees: "The clock runs, but S2 does nothing when you press it.",
    fix: "Reheat all four legs of S2.",
  },
];

export const FAULT_BY_ID = Object.fromEntries(FAULTS.map((f) => [f.id, f]));
export const INDEPENDENT = [
  "digit3_open",
  "seg_open_g",
  "bridge_ef",
  "q1_backwards",
  "buzzer_reversed",
  "button_open",
];

export const NODES = [
  { id: "VIN", label: "VIN", where: "J1 +", expect: "5 V" },
  { id: "VCC", label: "VCC", where: "Chip pin 20", expect: "5 V" },
  {
    id: "RST",
    label: "RST",
    where: "Chip pin 1",
    expect: "5 V at power-up, then about 0 V",
  },
  {
    id: "XTAL",
    label: "XTAL1",
    where: "Chip pin 5",
    expect: "about 2.5 V average (it is vibrating)",
  },
  {
    id: "BASE",
    label: "BASE",
    where: "Q1 base",
    expect: "5 V idle, about 4.3 V while beeping",
  },
  {
    id: "BUZ",
    label: "BUZZER",
    where: "Q1 collector",
    expect: "0 V idle, about 4.7 V while beeping",
  },
];

const fmt = (v) => `${v.toFixed(2)} V`;

export function analyse({ vin = 5, faults = [] } = {}) {
  const f = new Set(faults);
  let rail = vin;
  let current = null;
  if (f.has("no_power")) rail = 0;
  else if (f.has("reversed_power")) rail = -vin;
  else if (f.has("power_short")) {
    rail = 0.12;
    current = 480;
  } else if (f.has("chip_backwards")) {
    rail = Math.min(vin, 2.4);
    current = 160;
  }

  const reversed = rail < -0.5;
  const over = rail > 6.5;
  const chipVcc = f.has("bent_pin") && rail > 0 ? 0 : rail;
  const damaged = over || reversed;
  const powered = !damaged && chipVcc >= 2.7 && !f.has("chip_backwards");
  const oscOk = powered && !f.has("crystal_cold") && !f.has("cap30_missing");
  const resetMode = f.has("reset_r_missing")
    ? "stuck"
    : f.has("c3_reversed")
      ? "flaky"
      : "ok";
  const canRun = powered && oscOk && resetMode !== "stuck";
  const bright = Math.max(0.25, Math.min(1, (chipVcc - 2.7) / 2.3));
  if (current === null) current = powered ? (canRun ? 32 : 6) : 0;

  const a = {
    f,
    vin,
    rail,
    reversed,
    over,
    chipVcc,
    damaged,
    powered,
    oscOk,
    resetMode,
    canRun,
    bright,
    current,
    buzzerOk: canRun && !f.has("q1_backwards") && !f.has("buzzer_reversed"),
    s2Ok: !f.has("button_open"),
    displayFaulty:
      f.has("seg_open_g") || f.has("bridge_ef") || f.has("digit3_open"),
  };
  a.stages = buildStages(a);
  return a;
}

export function rstVoltage(a, t) {
  if (a.rail <= 0.5) return 0;
  if (a.resetMode === "stuck") return a.rail * Math.exp(-t / 40);
  if (a.resetMode === "flaky") return a.rail * Math.exp(-(t % 3) / 0.6);
  return a.rail * Math.exp(-t / 0.1);
}

export function runningAt(a, t) {
  return a.canRun && rstVoltage(a, t) < 1.0;
}

export function shapeMasks(a, masks) {
  return masks.map((m, i) => {
    let x = m;
    if (a.f.has("seg_open_g")) x &= ~64;
    if (a.f.has("bridge_ef") && x & 48) x |= 48;
    if (a.f.has("digit3_open") && i === 2) x = 0;
    return x;
  });
}

export function nodeVoltage(a, node, t, beeping, running) {
  switch (node) {
    case "VIN":
      return a.rail;
    case "VCC":
      return a.chipVcc;
    case "RST":
      return rstVoltage(a, t);
    case "XTAL":
      return a.oscOk ? 2.4 : 0;
    case "BASE":
      return a.rail > 0
        ? running && beeping && a.buzzerOk
          ? a.chipVcc - 0.7
          : a.rail
        : 0;
    case "BUZ":
      return running && beeping && a.buzzerOk ? a.chipVcc - 0.3 : 0;
    default:
      return 0;
  }
}

function buildStages(a) {
  const f = a.f;
  const raw = [];

  // 1. Power
  let p;
  if (f.has("no_power"))
    p = {
      state: "bad",
      value: "0.00 V",
      why: "No voltage is reaching the board.",
      fix: "Re-solder the red and black leads to the + and − pads, then check the supply.",
    };
  else if (a.reversed)
    p = {
      state: "bad",
      value: fmt(a.rail),
      why: "The supply is connected backwards.",
      fix: "Unplug and swap the leads. The chip may already be damaged.",
    };
  else if (f.has("power_short"))
    p = {
      state: "bad",
      value: fmt(a.rail),
      why: "The voltage collapses and the supply is at its current limit: + and − are joined somewhere.",
      fix: "Unplug. Find the solder bridge across the power pads or under the display.",
    };
  else if (f.has("chip_backwards"))
    p = {
      state: "bad",
      value: `${fmt(a.rail)} (sagging)`,
      why: "The rail is pulled down because something is drawing far too much current.",
      fix: "Unplug. A backwards chip or a bridge is the usual cause.",
    };
  else if (a.over)
    p = {
      state: "bad",
      value: fmt(a.rail),
      why: "Far above the 6 V limit of the chip. It will not survive this.",
      fix: "Use a 5 V supply.",
    };
  else if (a.rail > 5.5)
    p = {
      state: "warn",
      value: fmt(a.rail),
      why: "Higher than the 5 V this kit is designed for. It is stressing the chip.",
      fix: "Use a 5 V supply.",
    };
  else if (a.rail < 2.7)
    p = {
      state: "bad",
      value: fmt(a.rail),
      why: "Too low for the chip to start.",
      fix: "Raise the supply to 5 V.",
    };
  else if (a.rail < 4.5)
    p = {
      state: "warn",
      value: fmt(a.rail),
      why: "Enough to run, but dim and less reliable.",
      fix: "Raise the supply to 5 V.",
    };
  else
    p = {
      state: "ok",
      value: fmt(a.rail),
      why: "Between 4.5 V and 5.5 V. Perfect.",
      fix: "",
    };
  raw.push({ id: "power", title: "Power reaches the board", part: "J1", ...p });

  // 2. Chip power
  raw.push(
    f.has("bent_pin")
      ? {
          id: "chip",
          title: "The chip receives power",
          part: "U1",
          state: "bad",
          value: "0.00 V at pin 20",
          why: "The rail is fine but pin 20 of the chip is not touching the socket.",
          fix: "Lift the chip, straighten the leg, press it back in.",
        }
      : {
          id: "chip",
          title: "The chip receives power",
          part: "U1",
          state: "ok",
          value: `${fmt(a.chipVcc)} at pin 20`,
          why: "The chip is getting its supply.",
          fix: "",
        },
  );

  // 3. Reset
  const ms = a.rail > 1 ? Math.round(100 * Math.log(a.rail)) : 0;
  if (a.resetMode === "stuck")
    raw.push({
      id: "reset",
      title: "Reset lets go",
      part: "R1",
      state: "bad",
      value: "RST stays high",
      why: "Nothing drains C3, so the reset pin never falls. The chip sleeps for ever.",
      fix: "Check R1: fitted, correct value, two shiny joints.",
    });
  else if (a.resetMode === "flaky")
    raw.push({
      id: "reset",
      title: "Reset lets go",
      part: "C3",
      state: "warn",
      value: "RST wobbles",
      why: "A backwards C3 leaks, so the reset pin is high again every few seconds and the chip restarts.",
      fix: "Fit C3 with the stripe on the negative side.",
    });
  else
    raw.push({
      id: "reset",
      title: "Reset lets go",
      part: "C3",
      state: "ok",
      value: `Below 1 V after ${ms} ms`,
      why: "C3 and R1 hold the chip asleep for a moment and then release it.",
      fix: "",
    });

  // 4. Crystal
  raw.push(
    a.oscOk
      ? {
          id: "clock",
          title: "The crystal vibrates",
          part: "Y1",
          state: "ok",
          value: "12 MHz",
          why: "The crystal and its two 30 pF capacitors are ringing.",
          fix: "",
        }
      : {
          id: "clock",
          title: "The crystal vibrates",
          part: "Y1",
          state: "bad",
          value: "No oscillation",
          why: "The crystal is not starting, so the chip has no heartbeat.",
          fix: "Reheat the crystal joints and check both 30 pF capacitors.",
        },
  );

  // 5. Program
  raw.push(
    a.canRun
      ? {
          id: "run",
          title: "The program runs",
          part: "U1",
          state: "ok",
          value: "Counting",
          why: "Power, reset and clock are all good, so the chip counts and scans.",
          fix: "",
        }
      : {
          id: "run",
          title: "The program runs",
          part: "U1",
          state: "bad",
          value: "Not running",
          why: "One of the steps above is broken.",
          fix: "Fix the first red step above.",
        },
  );

  // 6. Display
  const dBad = [];
  if (f.has("digit3_open")) dBad.push("digit 3 is dark");
  if (f.has("seg_open_g")) dBad.push("the middle bar (g) is missing");
  if (f.has("bridge_ef")) dBad.push("segments e and f are joined");
  raw.push(
    dBad.length
      ? {
          id: "display",
          title: "The display draws every segment",
          part: "DS1",
          state: "warn",
          value: dBad.join("; "),
          why: "The clock is running, but part of the display path is broken.",
          fix: "Inspect the display joints on the solder side.",
        }
      : {
          id: "display",
          title: "The display draws every segment",
          part: "DS1",
          state: "ok",
          value: "All segments",
          why: "Every digit and bar lights correctly.",
          fix: "",
        },
  );

  // 7. Sound and buttons
  const sBad = [];
  if (f.has("q1_backwards")) sBad.push("Q1 is reversed");
  if (f.has("buzzer_reversed")) sBad.push("buzzer is reversed");
  if (f.has("button_open")) sBad.push("S2 is not connected");
  raw.push(
    sBad.length
      ? {
          id: "sound",
          title: "The buzzer and buttons answer",
          part: "BZ1",
          state: "warn",
          value: sBad.join("; "),
          why: "The clock runs, but one of the extras does not respond.",
          fix: "Check polarity of Q1 and the buzzer, and the legs of each button.",
        }
      : {
          id: "sound",
          title: "The buzzer and buttons answer",
          part: "BZ1",
          state: "ok",
          value: "Respond",
          why: "Both buttons and the buzzer work.",
          fix: "",
        },
  );

  let blocked = false;
  return raw.map((st) => {
    if (blocked)
      return {
        ...st,
        state: "idle",
        value: "Waiting",
        why: "Cannot be checked until the step above works.",
        fix: "",
      };
    if (st.state === "bad") blocked = true;
    return st;
  });
}
