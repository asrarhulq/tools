// All the words and facts for the Electronic clock guide live here.
// Edit freely: the components only read from this file.

export const PINS = [
  {
    n: 1,
    name: "RST",
    kind: "reset",
    job: "Reset. While this pin is HIGH the chip is held asleep. C3 and R1 hold it high for a moment at power-up, then let it fall low so the chip can start.",
  },
  {
    n: 2,
    name: "P3.0",
    kind: "io",
    job: "A general pin. In this kind of kit it is one of the lines used for digit select, the buttons or the buzzer (the exact job varies between batches).",
  },
  {
    n: 3,
    name: "P3.1",
    kind: "io",
    job: "A general pin, same family as pin 2.",
  },
  {
    n: 4,
    name: "XTAL2",
    kind: "xtal",
    job: "One side of the crystal. The chip has a small amplifier between pins 4 and 5 that keeps the crystal ringing.",
  },
  {
    n: 5,
    name: "XTAL1",
    kind: "xtal",
    job: "The other side of the crystal. The clock signal comes in here.",
  },
  {
    n: 6,
    name: "P3.2",
    kind: "io",
    job: "A general pin, usually digit select or a button.",
  },
  {
    n: 7,
    name: "P3.3",
    kind: "io",
    job: "A general pin, usually digit select or a button.",
  },
  {
    n: 8,
    name: "P3.4",
    kind: "io",
    job: "A general pin, usually digit select or the buzzer.",
  },
  {
    n: 9,
    name: "P3.5",
    kind: "io",
    job: "A general pin, usually digit select or the buzzer.",
  },
  {
    n: 10,
    name: "GND",
    kind: "gnd",
    job: "Ground, 0 V. Every current in the clock returns here. Pin 10 is the corner opposite pin 20.",
  },
  {
    n: 11,
    name: "P3.7",
    kind: "io",
    job: "A general pin (there is no P3.6 on this chip).",
  },
  {
    n: 12,
    name: "P1.0",
    kind: "seg",
    job: "Port 1 is a bank of 8 outputs. Here they drive the display segments a to g and the decimal point.",
  },
  { n: 13, name: "P1.1", kind: "seg", job: "Port 1, a display segment line." },
  { n: 14, name: "P1.2", kind: "seg", job: "Port 1, a display segment line." },
  { n: 15, name: "P1.3", kind: "seg", job: "Port 1, a display segment line." },
  { n: 16, name: "P1.4", kind: "seg", job: "Port 1, a display segment line." },
  { n: 17, name: "P1.5", kind: "seg", job: "Port 1, a display segment line." },
  { n: 18, name: "P1.6", kind: "seg", job: "Port 1, a display segment line." },
  { n: 19, name: "P1.7", kind: "seg", job: "Port 1, a display segment line." },
  {
    n: 20,
    name: "VCC",
    kind: "vcc",
    job: "Power in. This is where the 5 V arrives. Never more than about 6 V.",
  },
];

export const PARTS = [
  {
    id: "U1",
    refs: "U1",
    name: "AT89C2051 microcontroller",
    tag: "The brain",
    widget: "pins",
    simple:
      "The brain of the clock. It counts seconds, decides which digit to light, and listens for button presses.",
    analogy:
      "A tiny conductor following a score that was burned into it at the factory.",
    look: "The black 20-legged chip. A notch (or a dot) marks the end where pin 1 lives.",
    detail: [
      "It is an 8051-family microcontroller: a complete little computer on one chip, with a processor, 2 KB of program memory, and 15 pins that can be switched on and off.",
      "The clock program lives inside it. Every second it adds one to a counter, turns the counter into hours and minutes, then lights the display one digit at a time.",
      '"-24PI" means it can run up to 24 MHz in a plastic package. This kit runs it at 12 MHz, set by the crystal. The "9843" is a date code (week 43 of 1998), so it may be old stock.',
      "It works from about 2.7 V to 6 V. Nothing in this kit regulates the voltage, so the supply itself has to be 5 V.",
    ],
    watch:
      "Backwards in its socket means no clock, a hot chip, and possibly a dead chip. The notch must match the notch printed on the board.",
    solder:
      "If your kit has a socket, solder the socket first and press the chip in last. Touch something metal before handling the chip to discharge static.",
  },
  {
    id: "Y1",
    refs: "Y1",
    name: "Crystal, 12 MHz",
    tag: "The heartbeat",
    widget: "crystal",
    simple:
      "A sliver of quartz that vibrates 12 million times every second. All of the clock's timekeeping comes from it.",
    analogy:
      "A tuning fork the chip listens to, so it always knows how much time has gone by.",
    look: "A shiny silver metal can with two legs and a number like 12.000 printed on top.",
    detail: [
      "Quartz is piezoelectric: squeeze it and it makes a voltage, apply a voltage and it flexes. Connect it to an amplifier inside the chip and it rings at one very precise frequency.",
      "The chip divides that frequency by 12, giving 1,000,000 steps per second. The program counts a million steps to make one second.",
      "Typical crystals drift 20 to 50 parts per million. That is a few seconds a day, which is why a kit clock needs a nudge now and then.",
      "It has no polarity. Either leg can go in either hole.",
    ],
    watch:
      "The metal can can touch nearby pads and short them. Lay it flat with a little gap, and do not hold the iron on a leg for more than about 3 seconds.",
    solder:
      "Quick and clean: 2 seconds per leg. Too much heat can damage the crystal inside.",
  },
  {
    id: "C12",
    refs: "C1 · C2",
    name: "Two 30 pF capacitors",
    tag: "Crystal tuners",
    widget: "loadcaps",
    simple:
      "Two tiny capacitors that help the crystal start vibrating at the right pitch. Each one connects a crystal leg to ground.",
    analogy:
      "Like the soundboard of a guitar: it does not make the note, but it helps the string ring clearly.",
    look: "Small, flat, orange or tan discs with two thin legs, printed 30 or 30P.",
    detail: [
      'A crystal oscillator only works properly if the crystal "sees" the right amount of capacitance, called the load capacitance. Two small capacitors from each leg to ground provide it.',
      "The 8051 data sheet suggests 30 pF (plus or minus 10). Along with the board's own stray capacitance this puts the crystal near its ideal load.",
      "They are ceramic and not polarised, so direction does not matter. The units are picofarads: 1 pF is a millionth of a microfarad.",
    ],
    watch:
      "Leaving one out, or a cold joint on one leg, can stop the crystal starting. The clock then looks completely dead.",
    solder: "Tiny and easy to heat. 1 to 2 seconds per leg is plenty.",
  },
  {
    id: "C3",
    refs: "C3",
    name: "10 µF electrolytic capacitor",
    tag: "The pause button",
    widget: "reset",
    simple:
      "A tiny bucket of charge that makes the chip wait a moment at power-up so it starts cleanly.",
    analogy:
      "Like counting to three before you start running so everyone else is ready.",
    look: "A small black or blue can marked 10 µF (often 10U) with a stripe down one side.",
    detail: [
      "When power arrives, C3 is empty and passes the sudden jump straight to the RST pin, so RST goes HIGH. The chip is held in reset.",
      "C3 then fills with charge through nothing but time, and the voltage on the RST pin falls as R1 drains it: V(t) = 5 V × e^(−t ÷ RC). With R1 = 10 kΩ and C3 = 10 µF, RC = 100 ms.",
      "When RST has fallen below about 1 V (after roughly 160 ms) the chip wakes up and starts the program. By then the power and the crystal are steady.",
      "It is polarised. The stripe on the can marks the negative leg; the longer leg of a new part is positive.",
    ],
    watch:
      "Backwards, it leaks. The clock may restart every few seconds, or the part can get hot and pop.",
    solder:
      "Press it flat to the board, double-check the stripe against the silkscreen, then solder. Hard to fix after trimming.",
  },
  {
    id: "R1",
    refs: "R1",
    name: "10 kΩ resistor (reset)",
    tag: "The drain",
    widget: "resistor",
    simple:
      "Lets the charge in C3 drain slowly, which ends the reset. A resistor limits how much current can flow.",
    analogy: "A narrow pipe: water still flows, just slowly.",
    look: "A small blue (or beige) body with coloured bands. Brown, black, orange means 10 kΩ.",
    detail: [
      "Ohm's law: current = voltage ÷ resistance. Ten thousand ohms at 5 V lets only 0.5 mA through.",
      "Together with C3 it sets the time delay of the reset. A bigger R or C gives a longer wait.",
      "Without R1 the RST pin never drains, so the chip would stay in reset forever and the display would stay dark.",
      "Resistors have no polarity. A 5-band part reading brown, black, black, red, brown is also 10 kΩ.",
    ],
    watch:
      "A wrong value changes the reset delay. 1 kΩ (brown, black, red) makes the wait ten times shorter.",
    solder:
      "Bend the legs at 90°, press the body flat to the board, solder, trim.",
  },
  {
    id: "R2",
    refs: "R2",
    name: "10 kΩ resistor (buzzer)",
    tag: "The gatekeeper",
    widget: "resistor",
    simple:
      "Limits the small current the chip uses to switch the buzzer's transistor on and off.",
    analogy:
      "A pressure regulator between the chip and the transistor, so the pin is never overworked.",
    look: "Same as R1: a blue body with brown, black and orange bands.",
    detail: [
      "The chip's pins can only supply a few milliamps, but a buzzer needs tens of milliamps. The chip tells Q1 to switch with a tiny current through R2, and Q1 supplies the large one.",
      "About 0.4 mA flows through R2 when it turns Q1 on: (5 V − 0.7 V) ÷ 10 kΩ.",
    ],
    watch:
      "A missing R2 can let too much current flow out of the chip's pin. A very large R2 may not turn Q1 on fully.",
    solder: "Same as R1.",
  },
  {
    id: "C4",
    refs: "C4",
    name: "Supply smoothing capacitor",
    tag: "The shock absorber",
    widget: "bucket",
    simple:
      "Soaks up tiny bumps on the power line so the chip and display get steady 5 V.",
    analogy:
      "A small water tank on a pipe: if the pump pulses, the tank keeps the flow even.",
    look: "A small component next to the resistor near the power terminal. Read its printed value; markings vary between batches.",
    detail: [
      "When the display switches digits and the buzzer fires, they pull current in sudden pulses. Wires are not perfect, so the voltage dips and spikes.",
      "A capacitor stores charge and releases it as the voltage dips, flattening the bumps. It sits close to the power input to do its job.",
      "If it is polarised (look for a stripe or a + mark) follow the silkscreen.",
    ],
    watch:
      "Check for a polarity mark before soldering. If it has one, it must match the board.",
    solder: "Press it to the board, 2 seconds per leg.",
  },
  {
    id: "C5",
    refs: "C5",
    name: "Bypass capacitor, marked 102J",
    tag: "The close guard",
    widget: "bucket",
    simple:
      "A second, much smaller capacitor standing right next to the chip. It mops up the fast little noise spikes at the chip's own pins, which C4, further away, is too slow to catch.",
    analogy:
      "If C4 is the water tank for the whole house, this one is the glass of water kept right on the desk, for the sip you need the instant you need it.",
    look: "A small ceramic capacitor, often blue or brown, standing upright directly above or beside the chip, printed 102J.",
    detail: [
      '"102" is the same three-digit code printed on the two 30 pF capacitors by the crystal, just a different value: two significant digits (1, 0) then a multiplier of 10 to the 2nd power, so 10 × 100 = 1000 pF, or 1 nF. "J" means plus-or-minus 5 percent. A leading letter like this A is usually a batch or series mark, not part of the value.',
      "Every time the chip switches a display segment or flips a pin, it draws a brief, very fast pulse of current. The copper trace between the chip and C4 has a little inductance, which resists fast changes in current, so a spike that quick barely reaches C4 before it is over.",
      "Putting a small capacitor as close as possible to the chip's own VCC and GND pins gives that pulse somewhere to come from locally, almost instantly, instead of travelling all the way back to C4. This is the standard trick called local decoupling: a big capacitor handles slow bulk changes, a small one right at the chip handles the fast ones.",
      "It is ceramic and not polarised, so direction does not matter.",
    ],
    watch:
      "It sits very close to the chip's own legs, so a bridge of solder here can short two neighbouring pins of the chip itself. Leaving it out will usually not stop the clock running, but makes it a little more prone to a stray glitch or reset on a noisy supply.",
    solder:
      "Tiny and quick, like the 30 pF caps: 1 to 2 seconds per leg. Keep its body clear of the chip's pins so it cannot lean over and bridge them.",
  },
  {
    id: "Q1",
    refs: "Q1",
    name: "8550 PNP transistor",
    tag: "The buzzer switch",
    widget: "transistor",
    simple:
      "A tiny electronic switch. A very small current from the chip turns a much bigger current to the buzzer on and off.",
    analogy:
      "A light switch operated by a feather: a tiny touch controls a big flow.",
    look: 'A black half-moon shaped part with three legs and "8550" on the flat face.',
    detail: [
      "It is a PNP transistor. Its emitter connects to +5 V. When the base is pulled about 0.7 V below the emitter, the transistor conducts and current flows from emitter to collector, and into the buzzer.",
      "The chip pulls the base low through R2 to beep, and lets go to stop. Idle, the base sits at 5 V and the transistor is off.",
      "Looking at the flat face with the legs pointing down, the S8550 pins are emitter, base, collector from left to right. Always match the D-shape printed on the board.",
    ],
    watch:
      "Flip it and it conducts the wrong way, so the buzzer stays silent. Do not rely on memory: follow the outline on the board.",
    solder:
      "Keep the body about 3 mm off the board. Do not tug the legs while hot.",
  },
  {
    id: "BZ1",
    refs: "BZ1",
    name: "Active buzzer",
    tag: "The voice",
    widget: "beeper",
    simple:
      "Makes a beep whenever it gets power. The clock uses it for a short chirp when you press a button.",
    analogy: "A tiny doorbell: push power in and it rings by itself.",
    look: "The round black cylinder with a + mark near one leg and often a label sticker on top.",
    detail: [
      "This is an active buzzer, which means it has a small oscillator built in. Give it DC power and it makes a tone of about 2 to 3 kHz. No clever signal is needed from the chip, only on and off.",
      "A passive buzzer would have no oscillator: it clicks once and needs the chip to wiggle the pin at the tone frequency.",
      "It is polarised. The leg next to the + mark goes to the + pad.",
    ],
    watch:
      "Backwards, it stays silent. Also leave the sticker on while cleaning flux so liquid does not get in the hole.",
    solder: "Short and sweet. Peel the sticker only after washing.",
  },
  {
    id: "S1",
    refs: "S1",
    name: "Button S1",
    tag: "Mode",
    widget: "button",
    simple:
      "On many kits like this, S1 chooses what you are editing: run, set hours, or set minutes. Try it on your board.",
    analogy: "A doorbell for the chip: press it and the pin goes quiet.",
    look: "A square black button with a red cap and four legs.",
    detail: [
      "A tactile button is a switch that joins its legs when pressed. One side goes to a chip pin, the other to ground.",
      "The chip pin is normally pulled HIGH by a weak internal resistor. Pressing the button connects it to ground, so the pin reads LOW. The program watches for that change.",
      "The four legs are two pairs. The legs on each side are already connected inside; pressing joins the two sides.",
    ],
    watch:
      "It only fits one way round (the legs are square), but a cold joint on one leg gives a button that works only sometimes.",
    solder:
      "Press it flush until it clicks into the board, then solder all four legs.",
  },
  {
    id: "S2",
    refs: "S2",
    name: "Button S2",
    tag: "Adjust",
    widget: "button",
    simple:
      "On many kits like this, S2 increases the hours or minutes you are editing. Try it on your board.",
    analogy: "The up arrow on a remote control.",
    look: "The twin of S1, right next to it.",
    detail: [
      "Same mechanism as S1. A second pin of the chip watches it.",
      "The program debounces the press: it waits a few milliseconds so that the tiny contact bounces do not count as extra presses.",
    ],
    watch:
      "A cold joint on any of its four legs gives a button that sometimes ignores you.",
    solder: "Same as S1. Make sure it is seated flat first.",
  },
  {
    id: "DS1",
    refs: "DS1",
    name: "4-digit 7-segment display",
    tag: "The face",
    widget: "display",
    simple:
      "Four digits made of seven little LED bars each, plus the colon. The chip lights them in turn so fast that you see them all at once.",
    analogy:
      "A flip-book: each page is drawn for a moment, but your eyes keep it so the picture seems steady.",
    look: "The long black window across the top with the grey 8.8:8.8 pattern when unlit.",
    detail: [
      "Each digit has 7 bars (segments a to g) and a decimal point. The same 8 wires reach every digit. A second set of 4 wires chooses which digit is allowed to light.",
      "That is multiplexing: light digit 1 with its pattern, switch it off, light digit 2, and so on. Each digit is on one quarter of the time, but the cycle repeats hundreds of times a second, so your eyes blend them (persistence of vision).",
      "The method saves pins: 4 digits × 8 segments would need 32 wires. Multiplexing needs 8 + 4 = 12.",
      "The bits that make each number are in a table inside the chip. For example, the digit 1 lights only segments b and c.",
    ],
    watch:
      "It has the most pins of any part. A missed pin gives a dark digit or a missing bar; a solder bridge gives ghost segments.",
    solder:
      "Solder one pin at each end first to hold it flush, then do the rest. Look for bridges between neighbouring pins.",
  },
  {
    id: "J1",
    refs: "J1 · + −",
    name: "Power input",
    tag: "The door",
    widget: "power",
    simple: "Where the 5 V comes in. Red goes to +, black goes to −.",
    analogy: "The front door of the circuit: everything else is inside.",
    look: "A blue 2-way screw terminal, marked + and −. A red/black cable may be soldered straight to the pads on the back.",
    detail: [
      "The chip works from about 2.7 V to 6 V. This kit has no regulator and no reverse-polarity protection, so the supply must be 5 V and the wires must go the right way.",
      "A USB phone charger cable cut open gives a good 5 V: red is +5 V and black is ground (check with a meter).",
      "Measure with the meter across + and − before you ever insert the chip. It should read about 5 V.",
    ],
    watch:
      "Nine volts, or reversed wires, can destroy the chip in an instant. There is no second chance.",
    solder: "Tin the wire ends first. Check the polarity twice.",
  },
];

export const PARTS_BY_ID = Object.fromEntries(PARTS.map((p) => [p.id, p]));

export const JOURNEY = [
  {
    id: "power",
    title: "Power arrives",
    parts: ["J1", "C4", "C5"],
    time: "0 ms",
    stats: ["5 V in", "Ground at 0 V"],
    simple:
      "Five volts comes in at the blue terminal. C4 soaks up the slow bumps; C5, standing right at the chip, catches the fast ones.",
    detail:
      "The whole circuit is a loop: current leaves the + terminal, goes through the chip and display, and returns to the − terminal. C4 sits across that loop right at the entrance; C5 sits at the far end, right at the chip itself.",
  },
  {
    id: "wait",
    title: "The chip is told to wait",
    parts: ["C3", "R1", "U1"],
    time: "0 to 160 ms",
    stats: ["RST = 5 V → 0 V", "RC = 100 ms"],
    simple:
      "For a moment after power-up, the reset pin is held HIGH. The chip waits until the power and the crystal are steady, then starts.",
    detail:
      "C3 is empty so it passes the voltage jump through: RST = 5 V. R1 drains C3, and RST falls like V = 5 × e^(−t ÷ 100 ms). Below about 1 V the chip wakes up, after ≈ 0.16 s.",
  },
  {
    id: "beat",
    title: "The heartbeat starts",
    parts: ["Y1", "C12", "U1"],
    time: "under 10 ms",
    stats: ["12 MHz", "÷ 12 = 1 million steps/s"],
    simple:
      "The crystal vibrates 12 million times a second. The two tiny capacitors help it settle on the right pitch.",
    detail:
      "The chip's internal amplifier between XTAL1 and XTAL2 keeps the crystal ringing. The chip divides the 12 MHz by 12, so each machine step lasts 1 microsecond.",
  },
  {
    id: "count",
    title: "The brain counts",
    parts: ["U1"],
    time: "every second",
    stats: ["1,000,000 steps = 1 s", "2 KB program"],
    simple:
      "The chip counts the crystal's heartbeat. One million steps makes one second, 60 seconds make a minute, and so on.",
    detail:
      "The program uses a hardware timer that overflows at a known rate. Each overflow adds to a counter; when the counter reaches 1 second the program updates the seconds, minutes and hours.",
  },
  {
    id: "paint",
    title: "The display is painted",
    parts: ["U1", "DS1"],
    time: "hundreds of times a second",
    stats: ["8 segment lines", "4 digit selects"],
    simple:
      "The chip lights one digit at a time, so quickly your eyes see all four at once.",
    detail:
      "Port 1 puts the pattern for digit 1 on the segment wires, and one select line turns digit 1 on. A moment later it switches to digit 2, and so on. Each digit is lit for about 1/4 of the time.",
  },
  {
    id: "listen",
    title: "You press, it answers",
    parts: ["S1", "S2", "Q1", "BZ1"],
    time: "whenever you press",
    stats: ["Pin HIGH → LOW", "Q1 switches the buzzer"],
    simple:
      "Pressing a button pulls a pin to ground. The chip notices and changes the time. To beep, it switches Q1 on.",
    detail:
      "Button pins idle HIGH through weak internal pull-ups. Pressing shorts the pin to ground. For the buzzer, the chip pulls the base of Q1 low through R2, Q1 conducts, and the buzzer gets about 5 V.",
  },
];

export const TOOLS = [
  {
    name: "Soldering iron",
    why: "25 to 60 W with a fine conical or small chisel tip. A temperature-controlled one is best.",
  },
  {
    name: "Solder, 0.6 to 0.8 mm",
    why: "Rosin-core. 60/40 or 63/37 flows easiest. Lead-free also works, with a hotter iron.",
  },
  {
    name: "Brass wool or damp sponge",
    why: "Keeps the tip clean and shiny, which means faster heat.",
  },
  {
    name: "Flush cutters",
    why: "To trim legs just above the joint. Always cut with safety glasses on.",
  },
  {
    name: "Solder wick",
    why: "The eraser. It pulls away too much solder or a bridge.",
  },
  {
    name: "Board holder or putty",
    why: "Something to hold parts flat while you flip the board over.",
  },
  {
    name: "Multimeter",
    why: "To check 5 V on the pads before the chip goes in.",
  },
  {
    name: "Safety glasses and a fan",
    why: "Trimmed legs fly, and flux smoke is not for breathing.",
  },
];

export const TEMPS = [
  {
    name: "Leaded solder (60/40, 63/37)",
    c: "320 to 350 °C",
    f: "610 to 660 °F",
  },
  { name: "Lead-free solder", c: "350 to 380 °C", f: "660 to 720 °F" },
];

export const SAFETY = [
  "Work with good airflow. Keep your face out of the smoke plume.",
  "The tip is about 350 °C. Always rest the iron in its stand.",
  "Wear glasses when trimming. Cut legs fly like tiny darts.",
  "If your solder is leaded, wash your hands before eating.",
  "Keep the flux and cleaning liquid away from the buzzer hole.",
];

export const TECHNIQUE = [
  {
    n: 1,
    title: "Clean the tip",
    sec: "before each joint",
    simple:
      "Wipe the tip, then melt a little fresh solder on it. A shiny tip passes heat quickly.",
    detail:
      'A dull, oxidised tip acts like a coat of paint. Most "it will not melt" problems are a dirty tip, not a cold iron. Re-tin after every few joints.',
  },
  {
    n: 2,
    title: "Heat the pad and the leg together",
    sec: "1 to 2 s",
    simple:
      "Lay the side of the tip so it touches the copper ring (the pad) and the component leg at the same time.",
    detail:
      "Both surfaces must reach solder temperature. If only the leg is hot, the solder balls up on it and never bonds to the copper. Contact area matters more than a higher temperature.",
  },
  {
    n: 3,
    title: "Feed solder to the joint",
    sec: "1 to 2 s",
    simple:
      "Touch the solder wire to the pad and leg on the side away from the iron. It should melt and flow by itself.",
    detail:
      "If you melt the solder on the tip and dab it across, the flux burns off before it can clean the metal. Let the heated metal melt the wire so that the flux inside the wire cleans the joint first.",
  },
  {
    n: 4,
    title: "Wire away, then iron away",
    sec: "1 s",
    simple:
      "Take the solder wire away first, count one, then lift the iron straight up along the leg.",
    detail:
      "Enough solder makes a small cone with concave sides that just covers the pad. More solder is not stronger; it hides the problems.",
  },
  {
    n: 5,
    title: "Hold still, then trim",
    sec: "3 s",
    simple:
      "Do not move the part while the joint cools. Moving it gives a dull, cracked cold joint. Then snip the leg just above the cone.",
    detail:
      "Solder passes through a mushy phase as it freezes. Disturbing it there leaves a fractured, grainy structure that conducts poorly.",
  },
];

export const JOINT_INFO = {
  good: {
    label: "Good joint",
    why: "A smooth cone with concave sides that wets both the pad and the leg. Lead-free solder is duller, but the shape is what matters.",
    fix: "Nothing to do.",
  },
  cold: {
    label: "Cold joint",
    why: "The solder did not flow onto the pad. It sits on the leg like a ball with a gap underneath. It may work, then fail later.",
    fix: "Reheat both pad and leg for 2 seconds and add a touch of fresh solder.",
  },
  starved: {
    label: "Too little solder",
    why: "Only a thin dab. The pad is mostly bare and the joint is weak.",
    fix: "Reheat and feed a little more solder until it forms a cone.",
  },
  blob: {
    label: "Too much solder",
    why: "A big round ball hides the joint. You cannot tell if it is bonded, and it may touch the neighbouring pad.",
    fix: "Reheat and remove the extra with solder wick.",
  },
  burnt: {
    label: "Overheated",
    why: "Held for too long: the pad lifts off the board, the flux burns brown, and the copper track can break.",
    fix: "Let it cool. Use a shorter heat time, and wire in a jumper if the pad has peeled away.",
  },
  bridge: {
    label: "Solder bridge",
    why: "Solder has joined two pins that should be separate. It shorts them together.",
    fix: "Press solder wick between the pins and heat until the bridge is drawn off.",
  },
};

export function classifyJoint(heat, amount) {
  if (heat < 1.0) return "cold";
  if (heat > 4.2) return "burnt";
  if (amount < 28) return "starved";
  if (amount > 72) return "blob";
  return "good";
}

export const BUILD_STEPS = [
  {
    id: "res",
    title: "Resistors R1 and R2",
    parts: ["R1", "R2"],
    time: "5 min",
    simple: [
      "Bend each leg 90° close to the body.",
      "Push them in flat against the board, then flip the board and spread the legs slightly so they stay put.",
      "R1 and R2 are both 10 kΩ: brown, black, orange. Direction does not matter.",
    ],
    detail:
      "Short parts go first so the board lies flat on the table while you work. Colour code: the first two bands are digits (1, 0), the third is the multiplier (orange = ×1000), so 10 × 1000 = 10,000 Ω. If your resistor has five bands, brown, black, black, red, brown is the same value.",
    check: [
      "Bodies sit flat on the board",
      "Two shiny cone joints on each",
      "Legs trimmed just above the joint",
    ],
    mistake:
      "Grabbing a different value. 1 kΩ (brown, black, red) in the R1 spot shortens the reset delay a lot.",
  },
  {
    id: "cer",
    title: "Small capacitors C1, C2 and C4",
    parts: ["C12", "C4"],
    time: "5 min",
    simple: [
      "C1 and C2 are the two 30 pF ceramic discs beside the crystal.",
      "C4 sits near the power terminal; read its marking and match it to the silkscreen.",
      "Ceramic discs do not care which way round they go.",
    ],
    detail:
      "The crystal needs about 30 pF on each leg for a clean start. Look for the printed 30 or 30P on the discs. If C4 has a stripe or + mark, treat it as polarised and match the silkscreen.",
    check: [
      "Both discs are marked 30",
      "Discs sit close to the board",
      "No leg touches a neighbour",
    ],
    mistake:
      "Skipping a 30 pF cap. The crystal may fail to start and the whole clock looks dead.",
  },
  {
    id: "xtal",
    title: "Crystal Y1",
    parts: ["Y1"],
    time: "3 min",
    simple: [
      "Lay the crystal flat with a thin gap, or stand it upright. Either is fine.",
      "No polarity: any leg in any hole.",
      "2 seconds per leg. Do not linger.",
    ],
    detail:
      "Do not overheat. Quartz is sensitive to heat and shock, so a fast, clean joint is best. The metal can can touch neighbouring pads if it is laid flat, so put a scrap of tape or paper under it to isolate it.",
    check: [
      "Can does not touch any pad",
      "Both joints are shiny cones",
      "Printed 12.000 faces up",
    ],
    mistake:
      "Overheating until the can burns the board. Use quick, short touches.",
  },
  {
    id: "ic",
    title: "Chip socket U1, and bypass cap C5",
    parts: ["U1", "C5"],
    time: "9 min",
    simple: [
      "Match the notch of the socket to the notch drawn on the board.",
      "Solder two opposite corner pins first, check it is flat, then do the rest.",
      "C5 (marked 102J) stands right above or beside the socket. Fit it now, while the legs are easy to reach, and keep its body clear of the socket pins.",
      "Do NOT put the chip in yet.",
    ],
    detail:
      "Soldering the chip itself would expose it to heat and static, and make replacement impossible. A socket protects it. If your kit has no socket and the chip is already supplied, solder it last of all with the notch matching the board. C5 is a small bypass capacitor that belongs as close to the chip's own power pins as the board allows, so it is easiest to fit right after the socket, before anything else crowds that corner.",
    check: [
      "Notch is at the correct end",
      "Socket sits flat on the board",
      "All 20 joints shiny, no bridges between pins",
      "C5 does not lean against the socket",
    ],
    mistake:
      "A bridge between two neighbouring pins. Pins are only 2.54 mm apart, so use a small amount of solder.",
  },
  {
    id: "q1",
    title: "Transistor Q1",
    parts: ["Q1"],
    time: "3 min",
    simple: [
      "Match the flat face of the part to the flat side of the outline printed on the board.",
      "Sit it about 3 mm off the board so the legs are not stressed.",
    ],
    detail:
      "The 8550 has three legs in the order emitter, base, collector looking at the flat face with the legs down. A backwards transistor does not pass current properly, so the buzzer stays silent.",
    check: [
      "Flat face matches silkscreen",
      "Legs do not touch each other",
      "Three shiny joints",
    ],
    mistake: "Flipping it round, which makes the buzzer silent.",
  },
  {
    id: "c3",
    title: "Electrolytic C3",
    parts: ["C3"],
    time: "3 min",
    simple: [
      "The stripe on the can marks the negative leg. The board marks the + hole.",
      "Push it in flat, solder, trim.",
    ],
    detail:
      "The longer leg of a new capacitor is the positive one. The reset circuit depends on this capacitor charging in the correct direction. If it goes in backwards, the reset pin misbehaves.",
    check: ["Stripe matches the board", "Sits flat", "Two shiny joints"],
    mistake: "Reversed polarity. The clock may restart every few seconds.",
  },
  {
    id: "btn",
    title: "Buttons S1 and S2",
    parts: ["S1", "S2"],
    time: "4 min",
    simple: [
      "Press each button into its holes until it clicks flush.",
      "Solder all four legs of each button.",
    ],
    detail:
      "Four-leg tactile buttons have two pairs of connected legs. They only fit one way, but a cold joint on one leg gives a button that only works if you push it from a certain side.",
    check: ["Flush with the board", "All 8 joints are shiny", "Buttons click"],
    mistake: 'Skipping a leg because "it already holds".',
  },
  {
    id: "buz",
    title: "Buzzer BZ1",
    parts: ["BZ1"],
    time: "3 min",
    simple: [
      "Match the + mark on the buzzer to the + mark on the board.",
      "Leave the label sticker on until you have cleaned off any flux.",
    ],
    detail:
      "The buzzer is active (it has an oscillator inside) and is polarised. The longer leg is +. If you wash the board, liquid could get into the hole on top; the sticker keeps it out.",
    check: ["+ mark matches the board", "Two shiny joints"],
    mistake: "Reversed. No sound.",
  },
  {
    id: "disp",
    title: "Display DS1",
    parts: ["DS1"],
    time: "10 min",
    simple: [
      "Match the display orientation to the board: decimal points at the bottom.",
      "Solder one pin at each end first, check it is flush, then finish the rest.",
      "Look under the pins for bridges.",
    ],
    detail:
      "It has the most joints. Work through them in a pattern so you do not miss any. A missing pin means one digit or one bar never lights; a bridge means ghost segments. A strong light and a magnifier help.",
    check: [
      "Flush with the board",
      "Every pin has a cone",
      "No bridges between neighbours",
    ],
    mistake: "Soldering it upside down. The numbers will be upside down too.",
  },
  {
    id: "pwr",
    title: "Power leads and first test",
    parts: ["J1"],
    time: "10 min",
    simple: [
      "Solder the red lead to + and the black lead to −.",
      "Clean the flux, trim all legs, then inspect every joint.",
      "Set a meter to DC volts and measure across + and −. You want 5 V.",
      "Unplug. Press the chip into the socket with the notch matching. Plug in.",
    ],
    detail:
      "Order matters: measure the supply before the chip goes in, so a wrong voltage cannot hurt it. Use a 5 V source. A USB charger cable works well. After inserting the chip, the display should wake up within a second.",
    check: [
      "Red = +, black = −",
      "Supply reads about 5 V",
      "Chip notch matches board",
      "Display lights",
    ],
    mistake:
      "Connecting a 9 V or 12 V adapter, or swapping the wires. Either can destroy the chip.",
  },
];

export const SYMPTOMS = [
  {
    id: "dark",
    title: "The display is completely dark",
    plain:
      "Nothing is happening at all. The cause is almost always upstream of the display: power, the chip itself, the crystal or the reset.",
    steps: [
      {
        do: "Measure DC volts across the + and − pads.",
        expect: "About 5 V. Not 0, not negative, not 9.",
        ifNot:
          "0 V means a wire is off. Negative means the wires are swapped. A low voltage and a warm supply means a short or a backwards chip.",
        tryFaults: [
          "no_power",
          "reversed_power",
          "power_short",
          "chip_backwards",
        ],
      },
      {
        do: "With power off, check the notch direction and that all 20 legs are inside the socket.",
        expect: "The notch matches the board and every leg is straight.",
        ifNot: "Turn the chip round or straighten the folded leg.",
        tryFaults: ["chip_backwards", "bent_pin"],
      },
      {
        do: "Reheat the crystal and both 30 pF capacitor joints for 2 seconds each.",
        expect: "Shiny cones on all six joints.",
        ifNot:
          "A cold joint or a missing capacitor stops the crystal from starting.",
        tryFaults: ["crystal_cold", "cap30_missing"],
      },
      {
        do: "Check R1 has two good joints, and the stripe on C3 matches the board.",
        expect: "R1 shiny, stripe on the negative side.",
        ifNot: "Without R1 the chip is stuck in reset for ever.",
        tryFaults: ["reset_r_missing", "c3_reversed"],
      },
    ],
  },
  {
    id: "onedigit",
    title: "One digit stays dark",
    plain:
      "The chip and the clock are fine, so the problem is local to that digit's pin on the display.",
    steps: [
      {
        do: "Look at the display pins on the solder side for the dark digit.",
        expect: "Every pin has a shiny cone.",
        ifNot: "Reheat that pin and add a little solder.",
        tryFaults: ["digit3_open"],
      },
      {
        do: "Press the display down firmly while looking at the digit.",
        expect: "It lights and stays lit.",
        ifNot:
          "The display was not seated flush. Reheat the pins while pressing down.",
        tryFaults: ["digit3_open"],
      },
    ],
  },
  {
    id: "nomiddle",
    title: "A bar is missing on every digit",
    plain:
      "All four digits share the same eight segment wires. If the same bar is missing everywhere, one of those shared wires is broken.",
    steps: [
      {
        do: "Work out which bar is missing (top, middle, bottom...).",
        expect: "You can name the segment letter a to g.",
        ifNot:
          "Compare with the segment diagram in the Display widget on the board tour.",
        tryFaults: ["seg_open_g"],
      },
      {
        do: "Find the display pin or chip pin for that segment and reheat it.",
        expect: "Shiny cone, bar returns.",
        ifNot: "Check the chip pin in its socket.",
        tryFaults: ["seg_open_g"],
      },
    ],
  },
  {
    id: "ghost",
    title: "Extra segments glow, or look dim and smeared",
    plain:
      "Two neighbouring pins have been joined by a drop of solder. Whenever one lights, the other lights too.",
    steps: [
      {
        do: "Look along the display pins with a magnifier and a bright light.",
        expect: "Every pin is separate.",
        ifNot: "Press solder wick across the bridge and heat it.",
        tryFaults: ["bridge_ef"],
      },
    ],
  },
  {
    id: "restart",
    title: "It works, then restarts, or flashes on and off",
    plain: "The reset pin is not staying low. Look at the reset network.",
    steps: [
      {
        do: "Check the stripe on C3 against the silkscreen.",
        expect: "Stripe on the negative side.",
        ifNot: "Replace C3 the right way round.",
        tryFaults: ["c3_reversed"],
      },
      {
        do: "Measure the supply while it runs.",
        expect: "A steady 5 V.",
        ifNot: "A weak supply can also make the chip reset.",
        tryFaults: ["c3_reversed"],
      },
    ],
  },
  {
    id: "nosound",
    title: "The clock works but never beeps",
    plain:
      "The clock part is fine. The problem is in the buzzer path: BZ1, Q1 and the connection through R2.",
    steps: [
      {
        do: "Check the + mark of the buzzer against the board.",
        expect: "The + marks match.",
        ifNot: "Turn the buzzer around.",
        tryFaults: ["buzzer_reversed"],
      },
      {
        do: "Check the flat face of Q1 against the silkscreen outline.",
        expect: "Flat side matches.",
        ifNot: "Resolder Q1 the correct way round.",
        tryFaults: ["q1_backwards"],
      },
    ],
  },
  {
    id: "nobutton",
    title: "A button does nothing",
    plain: "The clock is running, so only the button's own path is broken.",
    steps: [
      {
        do: "Reheat all four legs of the button.",
        expect: "Shiny cones on all four.",
        ifNot: "A single cold leg is enough to break it.",
        tryFaults: ["button_open"],
      },
    ],
  },
  {
    id: "hot",
    title: "Something gets hot, or the supply struggles",
    plain:
      "Unplug immediately. Too much current is flowing. This is almost always a short, a backwards chip, or swapped power wires.",
    steps: [
      {
        do: "Unplug. Look at the + and − pads and under the display for stray solder.",
        expect: "No bridges.",
        ifNot: "Clear the bridge with solder wick.",
        tryFaults: ["power_short"],
      },
      {
        do: "Check the chip notch and the power wire colours.",
        expect: "Notch matches. Red on +.",
        ifNot: "Fix and retest. The chip may be damaged.",
        tryFaults: ["chip_backwards", "reversed_power"],
      },
    ],
  },
];
