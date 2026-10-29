// Static course content. Everything here traces back to the ME 36400 "Phase 2: Conceptual Design" slides
// (page numbers refer to the PDF) or to the Lab 3 handout.
import type { Fn, Flow, FlowType, Crit, ObjNode } from "./types";

export const STEPS = [
  {
    n: 1,
    key: "s1",
    name: "Abstract",
    tool: "Abstraction Elevator",
    pts: 10,
    app: "A",
    slides: "PDF p.2–13",
    color: "#5CE1E6",
    blurb:
      "Boil the requirements list down to the crux. End with one sentence that names no solution.",
  },
  {
    n: 2,
    key: "s2",
    name: "Function structure",
    tool: "Function Forge",
    pts: 20,
    app: "B",
    slides: "PDF p.14–30",
    color: "#7BD88F",
    blurb:
      "Draw what the device does: verb + noun boxes, joined by energy, material and signal flows.",
  },
  {
    n: 3,
    key: "s3",
    name: "Working principles",
    tool: "Idea Forge",
    pts: 20,
    app: "C",
    slides: "PDF p.33–64",
    color: "#FFC145",
    blurb:
      "Find at least five different, sketched ways to do every function. Build the morphological chart.",
  },
  {
    n: 4,
    key: "s4",
    name: "Working structures",
    tool: "The Weave",
    pts: 20,
    app: "D",
    slides: "PDF p.65–67, 99–113",
    color: "#FF8A4C",
    blurb:
      "Thread one compatible principle per function into complete working structures. At least four.",
  },
  {
    n: 5,
    key: "s5",
    name: "Select",
    tool: "Decision Arena",
    pts: 20,
    app: "E",
    slides: "PDF p.70–96, 114–115",
    color: "#FF6B9A",
    blurb:
      "Filter, duel against a datum, weigh, normalize, stress-test. Defend the winner.",
  },
  {
    n: 6,
    key: "s6",
    name: "Principal solution",
    tool: "Concept Studio",
    pts: 10,
    app: "F",
    slides: "PDF p.97–113",
    color: "#B38CFF",
    blurb:
      "Firm the winner up: detailed sketch, short description, rough numbers, known weak spots.",
  },
] as const;

/* ------------------------------------------------------------------ language linting */
export const VERBS = new Set(
  `absorb dissipate release create emit supply receive store accumulate record combine mix couple link constrain separate compare
transform amplify attenuate convert filter modify shape prepare change convey channel conduct direct divert guide transmit transport control actuate detect
sense display maintain resist support stabilize switch divide detach disconnect disassemble subtract cut polish sand drill purify strain percolate clear
diverge scatter disperse diffuse empty dampen dispel import input allow capture export discharge eject dispose remove transfer lift move straighten steer
turn spin unlock join assemble attach blend add pack coalesce start initiate regulate prevent enable disable limit interrupt valve increase decrease reduce
magnify normalize multiply scale rectify adjust compact crush compress pierce liquefy solidify evaporate condense integrate differentiate process contain
collect reserve fill provide replenish expose extract perceive recognize discern check locate indicate mark measure calculate stop insulate protect shield
inhibit steady secure mount lock fasten hold position orient align grip rotate heat cool stamp count despatch dispatch apply load tighten loosen open close
pour dry wash clean dispense signal boil warm freeze lubricate cushion absorb reflect emit pump mill grind slice peel crack fold wrap seal vent filter
sort feed stack lower raise tilt twist push pull squeeze press roll slide swing balance level sharpen ventilate sterilize charge discharge power drive
brake clamp release latch lift carry hand handle gather sweep collect store retrieve identify select trigger time schedule track log report notify warn alert send`.split(
    /\s+/,
  ),
);

export const SOLUTION_WORDS = [
  "motor",
  "button",
  "lever",
  "gear",
  "spring",
  "battery",
  "sensor",
  "screw",
  "bolt",
  "magnet",
  "wheel",
  "handle",
  "strap",
  "blade",
  "valve",
  "pump",
  "cam",
  "ratchet",
  "hinge",
  "clamp",
  "conveyor",
  "robot",
  "app",
  "arduino",
  "plastic",
  "steel",
  "aluminum",
  "aluminium",
  "wood",
  "bluetooth",
  "wifi",
  "led",
  "cord",
  "pulley",
  "belt",
  "piston",
  "cylinder",
  "bearing",
  "bracket",
  "frame",
  "housing",
];

export const VAGUE_WORDS = [
  "large",
  "small",
  "good",
  "easy",
  "cheap",
  "high",
  "low",
  "fast",
  "slow",
  "strong",
  "weak",
  "light",
  "heavy",
  "simple",
  "nice",
  "better",
  "best",
  "quiet",
  "comfortable",
  "user-friendly",
  "durable",
  "safe",
  "reliable",
  "efficient",
  "quick",
  "compact",
  "long",
  "short",
];

/* ------------------------------------------------------------------ Step 1 */
export const ABS_OPS = [
  {
    n: 1,
    t: "Eliminate personal preferences",
    d: "Remove opinions and tastes. Keep needs.",
    ask: "Would the user still be satisfied if this were different?",
    before: "Must look sporty and be red",
    after: "(deleted)",
    slide: "p.9",
  },
  {
    n: 2,
    t: "Keep only what affects function or essential constraints",
    d: "Packaging, schedule and branding do not change how it works.",
    ask: "Does this change what the device must DO, or only how it is sold?",
    before: "Ships in a cardboard box",
    after: "(deleted)",
    slide: "p.9, 11",
  },
  {
    n: 3,
    t: "Quantitative → qualitative",
    d: "Replace numbers with the idea behind them.",
    ask: "What does this number really say?",
    before: "Volumes: 20 to 160 litres",
    after: "Wide range of volumes",
    slide: "p.9, 11",
  },
  {
    n: 4,
    t: "Generalize (broaden)",
    d: "Climb the ladder: bag filling → feed transfer → transport.",
    ask: "What bigger problem is this a special case of?",
    before: "Fuel in a car tank",
    after: "Liquid in containers of unspecified size and shape",
    slide: "p.6–8, 9",
  },
  {
    n: 5,
    t: "Formulate the problem solution-neutral",
    d: "One sentence. No product, no mechanism.",
    ask: "Could a totally different machine satisfy this sentence?",
    before: "Design a fuel gauge",
    after:
      "Measure continuously changing quantities of liquid and indicate them at a distance",
    slide: "p.9, 15",
  },
];

export const LADDER = [
  "Filling, weighing, closing, and stacking bags of feed.",
  "Transferring feed from the mixing silo to stacked bags in the warehouse.",
  "Transferring feed from the mixing silo to bags on the delivery truck.",
  "Transferring feed from the mixing silo to the delivery truck.",
  "Transferring feed from the mixing silo to a delivery system.",
  "Transferring feed from the mixing silo to the consumer’s storage bins.",
  "Transferring feed from ingredient containers to consumer’s storage bins.",
  "Transferring feed ingredients from their source to the consumer. [Broadest]",
];

export const MATCH = [
  {
    a: "Design a garage door",
    b: "A means of securing a garage so a car is protected from thieves and the weather",
    slide: "p.13",
  },
  {
    a: "Design a keyed shaft",
    b: "A way to connect a gear wheel and a shaft",
    slide: "p.13",
  },
  {
    a: "Design a packing machine",
    b: "A way of dispatching a product safely or, if constraints exist, packing it safely, compactly and automatically",
    slide: "p.13",
  },
  {
    a: "Design a clamping device",
    b: "Means of keeping a workpiece firmly fixed",
    slide: "p.13",
  },
  {
    a: "Design a better can opener",
    b: "A way to gain access to the contents of a sealed container",
    slide: "extra",
  },
  {
    a: "Design a bicycle lock",
    b: "A means of preventing unauthorized removal of a vehicle",
    slide: "extra",
  },
];

export const NEUTRAL_QUIZ = [
  {
    s: "Design a lever-operated garlic press.",
    neutral: false,
    why: "“Lever-operated” and “garlic press” already choose the mechanism and the product.",
  },
  {
    s: "Break down a small soft solid with its skin on and separate the pulp using low human force.",
    neutral: true,
    why: "Names what happens to what. Any mechanism could answer it.",
  },
  {
    s: "Build a motorized conveyor to move boxes at 2 m/s.",
    neutral: false,
    why: "Motor, conveyor and a number: three solution commitments.",
  },
  {
    s: "Transfer packaged goods between two locations.",
    neutral: true,
    why: "Broad, qualitative, mechanism-free.",
  },
  {
    s: "Use an Arduino to read temperature and turn on a fan.",
    neutral: false,
    why: "Arduino, read, fan: a specific design, not a problem.",
  },
  {
    s: "Keep a liquid at a safe drinking temperature for several hours.",
    neutral: true,
    why: "States the need. Insulation, heating, evaporative cooling all remain open.",
  },
];

/* ------------------------------------------------------------------ Step 2 */
export const FLOW_QUIZ: { t: string; a: FlowType; why: string }[] = [
  { t: "torque", a: "E", why: "Torque carries energy." },
  { t: "screw", a: "M", why: "A physical object being worked on." },
  { t: "on / off command", a: "S", why: "Information, not power." },
  { t: "heat", a: "E", why: "Thermal energy." },
  { t: "garlic clove", a: "M", why: "Material that is changed." },
  { t: "human force", a: "E", why: "Muscle force supplies energy." },
  { t: "display light showing “done”", a: "S", why: "It communicates status." },
  { t: "water", a: "M", why: "Matter (liquid)." },
  { t: "electricity", a: "E", why: "Electrical energy." },
  { t: "temperature reading", a: "S", why: "Information about a quantity." },
];

export const FN_QUIZ = [
  {
    s: "Motor",
    ok: false,
    fix: "Convert electricity to torque",
    why: "A part, not a function.",
  },
  {
    s: "Heating water",
    ok: false,
    fix: "Heat water",
    why: "“-ing” phrase. Use verb + noun.",
  },
  {
    s: "Amplify torque",
    ok: true,
    fix: "",
    why: "Verb + noun. Appears in the slides’ verb list.",
  },
  { s: "Handle", ok: false, fix: "Transmit hand force", why: "A part name." },
  {
    s: "Store electricity",
    ok: true,
    fix: "",
    why: "Verb + noun, from the screwdriver example (p.20).",
  },
  {
    s: "Make it easy",
    ok: false,
    fix: "Reduce user effort",
    why: "Too vague and not an input/output relationship.",
  },
];

export const GENERAL_FUNCS = [
  {
    k: "Change",
    trait: "Type",
    ex: "electrical → mechanical energy",
    sym: "diag",
    note: "Type and outward form of input and output differ.",
  },
  {
    k: "Vary",
    trait: "Magnitude",
    ex: "amplify torque",
    sym: "tri",
    note: "Output is larger or smaller than input.",
  },
  {
    k: "Connect",
    trait: "Number",
    ex: "switch electrical energy on; mix materials",
    sym: "trix",
    note: "Number of inputs differs from outputs.",
  },
  {
    k: "Channel",
    trait: "Place",
    ex: "transmit power; convey material",
    sym: "split",
    note: "Place of input differs from place of output.",
  },
  {
    k: "Store",
    trait: "Time",
    ex: "store kinetic energy; keep grain in a silo",
    sym: "circ",
    note: "Time of output differs from time of input.",
  },
];

export const SW_CLASSES: { c: string; items: { b: string; syn: string }[] }[] =
  [
    {
      c: "Branch",
      items: [
        {
          b: "Separate",
          syn: "Switch, Divide, Release, Detach, Disconnect, Disassemble, Subtract, Cut, Polish, Sand, Drill",
        },
        { b: "Refine", syn: "Purify, Strain, Filter, Percolate, Clear" },
        {
          b: "Distribute",
          syn: "Diverge, Scatter, Disperse, Diffuse, Empty, Absorb, Dampen, Dispel, Resist, Dissipate",
        },
      ],
    },
    {
      c: "Channel",
      items: [
        { b: "Import", syn: "Input, Receive, Allow, Form Entrance, Capture" },
        { b: "Export", syn: "Discharge, Eject, Dispose, Remove" },
        { b: "Transfer", syn: "Lift, Move, Conduct, Convey" },
        {
          b: "Guide",
          syn: "Direct, Straighten, Steer, Turn, Spin, Constrain, Unlock",
        },
      ],
    },
    {
      c: "Connect",
      items: [
        { b: "Couple", syn: "Join, Assemble, Attach" },
        { b: "Mix", syn: "Combine, Blend, Add, Pack, Coalesce" },
      ],
    },
    {
      c: "Control magnitude",
      items: [
        { b: "Actuate", syn: "Start, Initiate" },
        {
          b: "Regulate",
          syn: "Control, Allow, Prevent, Enable/Disable, Limit, Interrupt, Valve",
        },
        {
          b: "Change",
          syn: "Increase, Decrease, Amplify, Reduce, Magnify, Normalize, Multiply, Scale, Rectify, Adjust, Compact, Crush, Shape, Compress, Pierce",
        },
      ],
    },
    {
      c: "Convert",
      items: [
        {
          b: "Convert",
          syn: "Transform, Liquefy, Solidify, Evaporate, Condense, Integrate, Differentiate, Process",
        },
      ],
    },
    {
      c: "Provision",
      items: [
        { b: "Store", syn: "Contain, Collect, Reserve, Capture" },
        { b: "Supply", syn: "Fill, Provide, Replenish, Expose, Extract" },
      ],
    },
    {
      c: "Signal",
      items: [
        { b: "Sense", syn: "Perceive, Recognize, Discern, Check, Locate" },
        { b: "Indicate", syn: "Mark" },
        { b: "Display", syn: "" },
        { b: "Measure", syn: "Calculate" },
      ],
    },
    {
      c: "Support",
      items: [
        { b: "Stop", syn: "Insulate, Protect, Prevent, Shield, Inhibit" },
        { b: "Stabilize", syn: "Steady" },
        { b: "Secure", syn: "Attach, Mount, Lock, Fasten, Hold" },
        { b: "Position", syn: "Orient, Align, Locate" },
      ],
    },
  ];

/* ------------------------------------------------------------------ Step 3 */
export interface Effect {
  n: string;
  d: string;
  ex: string;
  cat: string;
}
export const EFFECT_CATS = [
  "Mechanical",
  "Electrical & magnetic",
  "Optical",
  "Fluid & thermal",
] as const;
export const EFFECTS: Effect[] = [
  {
    n: "Lever effect",
    d: "Force × distance balances across a pivot.",
    ex: "amplify force",
    cat: "Mechanical",
  },
  {
    n: "Wedge effect",
    d: "A push along a slope becomes a large sideways force.",
    ex: "split, lift, clamp",
    cat: "Mechanical",
  },
  {
    n: "Friction",
    d: "Surfaces resist sliding against each other.",
    ex: "hold, brake, grip",
    cat: "Mechanical",
  },
  {
    n: "Adhesion",
    d: "Unlike surfaces stick together.",
    ex: "attach, hold",
    cat: "Mechanical",
  },
  {
    n: "Cohesion",
    d: "Like molecules hold a material together.",
    ex: "bond, seal",
    cat: "Mechanical",
  },
  {
    n: "Elastic deformation",
    d: "A deformed body springs back and stores energy.",
    ex: "store energy, cushion",
    cat: "Mechanical",
  },
  {
    n: "Plastic deformation",
    d: "A body is permanently reshaped.",
    ex: "shape, crush",
    cat: "Mechanical",
  },
  {
    n: "Gravitation",
    d: "Mass is pulled down; liquids drain.",
    ex: "drain, drop, store energy",
    cat: "Mechanical",
  },
  {
    n: "Inertia",
    d: "A body resists changes of motion.",
    ex: "store kinetic energy, smooth motion",
    cat: "Mechanical",
  },
  {
    n: "Momentum",
    d: "Mass × velocity is conserved in impacts.",
    ex: "transfer motion, impact",
    cat: "Mechanical",
  },
  {
    n: "Centrifugal effect",
    d: "Spinning throws material outward.",
    ex: "separate, dry, sort",
    cat: "Mechanical",
  },
  {
    n: "Coriolis effect",
    d: "Moving mass in a rotating frame feels a sideways force.",
    ex: "sense rotation",
    cat: "Mechanical",
  },
  {
    n: "Gyroscopic effect",
    d: "A spinning body resists tilting.",
    ex: "stabilize, orient",
    cat: "Mechanical",
  },
  {
    n: "Conservation of angular momentum",
    d: "Spin rate changes as mass moves in or out.",
    ex: "change speed",
    cat: "Mechanical",
  },
  {
    n: "Conservation of energy",
    d: "Energy changes form but is not lost.",
    ex: "convert, store",
    cat: "Mechanical",
  },
  {
    n: "Thermal expansion",
    d: "Materials grow when warmed.",
    ex: "sense temperature, release",
    cat: "Mechanical",
  },
  {
    n: "Vibrations",
    d: "Oscillation at a natural frequency.",
    ex: "shake, sort, clean",
    cat: "Mechanical",
  },
  {
    n: "Stick-slip effect",
    d: "Friction alternates between sticking and sliding.",
    ex: "ratchet, indicate",
    cat: "Mechanical",
  },
  {
    n: "Circular motion",
    d: "Rotation turns force into torque.",
    ex: "rotate, transmit",
    cat: "Mechanical",
  },
  {
    n: "Translation",
    d: "Straight-line motion.",
    ex: "move, push",
    cat: "Mechanical",
  },
  {
    n: "Lateral contraction",
    d: "A stretched body gets thinner.",
    ex: "grip, seal",
    cat: "Mechanical",
  },
  {
    n: "Geometric-physical effect",
    d: "Shape alone creates the function (taper, notch, hook).",
    ex: "locate, lock",
    cat: "Mechanical",
  },
  {
    n: "Joule heating",
    d: "Current through resistance makes heat.",
    ex: "heat",
    cat: "Electrical & magnetic",
  },
  {
    n: "Piezoelectric effect",
    d: "Crystals turn pressure into voltage and back.",
    ex: "sense force, actuate",
    cat: "Electrical & magnetic",
  },
  {
    n: "Electrostatic induction",
    d: "Charge separation in a field.",
    ex: "attract, sense",
    cat: "Electrical & magnetic",
  },
  {
    n: "Hall effect",
    d: "A magnetic field creates a voltage across a conductor.",
    ex: "sense position",
    cat: "Electrical & magnetic",
  },
  {
    n: "Lorentz force",
    d: "A current in a magnetic field feels a force.",
    ex: "actuate, rotate",
    cat: "Electrical & magnetic",
  },
  {
    n: "Peltier effect",
    d: "Current moves heat from one side to the other.",
    ex: "heat, cool",
    cat: "Electrical & magnetic",
  },
  {
    n: "Thermoelectric (Seebeck) effect",
    d: "A temperature difference makes a voltage.",
    ex: "sense temperature, generate power",
    cat: "Electrical & magnetic",
  },
  {
    n: "Photoelectric effect",
    d: "Light frees electrons.",
    ex: "sense light, generate power",
    cat: "Electrical & magnetic",
  },
  {
    n: "Capacitance",
    d: "Charge is stored between two plates.",
    ex: "store energy, sense touch",
    cat: "Electrical & magnetic",
  },
  {
    n: "Transformer (induction)",
    d: "A changing field in one coil drives another.",
    ex: "vary voltage",
    cat: "Electrical & magnetic",
  },
  {
    n: "Electric arc",
    d: "Current jumps through gas.",
    ex: "cut, weld, ignite",
    cat: "Electrical & magnetic",
  },
  {
    n: "Semiconductor",
    d: "Conduction depends on doping and bias.",
    ex: "switch, amplify",
    cat: "Electrical & magnetic",
  },
  {
    n: "Permanent magnet attraction",
    d: "Magnets pull on ferrous metal and on each other.",
    ex: "hold, latch, position",
    cat: "Electrical & magnetic",
  },
  {
    n: "Reflection",
    d: "Light bounces off a surface.",
    ex: "indicate, direct light",
    cat: "Optical",
  },
  {
    n: "Refraction",
    d: "Light bends entering a new medium.",
    ex: "focus, magnify",
    cat: "Optical",
  },
  {
    n: "Absorption",
    d: "Material takes up radiation as heat.",
    ex: "heat, sense",
    cat: "Optical",
  },
  {
    n: "Interference",
    d: "Waves add or cancel.",
    ex: "measure, sense",
    cat: "Optical",
  },
  {
    n: "Doppler effect",
    d: "Frequency shifts with relative motion.",
    ex: "sense speed",
    cat: "Optical",
  },
  {
    n: "Total internal reflection",
    d: "Light trapped in a dense medium.",
    ex: "guide light, sense liquid",
    cat: "Optical",
  },
  {
    n: "Luminescence",
    d: "Material emits light without being hot.",
    ex: "indicate, display",
    cat: "Optical",
  },
  {
    n: "Polarization",
    d: "Light is filtered by orientation.",
    ex: "sense, display",
    cat: "Optical",
  },
  {
    n: "Capillary action",
    d: "Liquid climbs through tiny gaps.",
    ex: "absorb, transport liquid",
    cat: "Fluid & thermal",
  },
  {
    n: "Pressure difference",
    d: "Fluids flow from high to low pressure.",
    ex: "suck, push, seal",
    cat: "Fluid & thermal",
  },
  {
    n: "Bernoulli effect",
    d: "Faster flow means lower pressure.",
    ex: "lift, atomize, mix",
    cat: "Fluid & thermal",
  },
  {
    n: "Buoyancy",
    d: "Fluid pushes up with the weight it displaces.",
    ex: "sense level, float",
    cat: "Fluid & thermal",
  },
  {
    n: "Hydrostatic pressure",
    d: "Pressure grows with depth.",
    ex: "transmit force (hydraulics)",
    cat: "Fluid & thermal",
  },
  {
    n: "Evaporation",
    d: "Liquid leaves a surface as vapor, taking heat.",
    ex: "dry, cool",
    cat: "Fluid & thermal",
  },
  {
    n: "Condensation",
    d: "Vapor turns to liquid and releases heat.",
    ex: "collect water, heat",
    cat: "Fluid & thermal",
  },
  {
    n: "Convection",
    d: "Moving fluid carries heat or moisture.",
    ex: "heat, cool, dry",
    cat: "Fluid & thermal",
  },
  {
    n: "Conduction",
    d: "Heat flows through solids.",
    ex: "heat, cool",
    cat: "Fluid & thermal",
  },
  {
    n: "Thermal radiation",
    d: "Hot bodies emit infrared.",
    ex: "heat without contact",
    cat: "Fluid & thermal",
  },
  {
    n: "Adsorption",
    d: "A surface holds moisture or gas.",
    ex: "dry, filter",
    cat: "Fluid & thermal",
  },
  {
    n: "Phase change (melting)",
    d: "Solid becomes liquid at a fixed temperature.",
    ex: "store heat, indicate",
    cat: "Fluid & thermal",
  },
];

export const SCAMPER = [
  {
    k: "Substitute",
    q: (f: string) =>
      `What could replace the usual way of “${f}”? (a material, a power source, a person → a machine)`,
    slide: "Car: AI instead of human",
  },
  {
    k: "Combine",
    q: (f: string) =>
      `What could “${f}” be merged with, so one part does two jobs?`,
    slide: "Car + scooter",
  },
  {
    k: "Adapt",
    q: (f: string) =>
      `Where else is “${f}” already done, in another industry or in nature?`,
    slide: "Car + bird wings",
  },
  {
    k: "Modify",
    q: (f: string) =>
      `What if “${f}” were bigger, smaller, slower, or a different shape?`,
    slide: "Car with a rear ramp",
  },
  {
    k: "Put to other uses",
    q: (f: string) =>
      `What else could the thing doing “${f}” also be used for?`,
    slide: "Car exterior as solar panel",
  },
  {
    k: "Eliminate",
    q: (f: string) => `What if you removed a part or step of “${f}” entirely?`,
    slide: "Remove reverse gear",
  },
  {
    k: "Rearrange",
    q: (f: string) =>
      `What if the order or layout of “${f}” were flipped, folded or reversed?`,
    slide: "Folding vehicle",
  },
];

export const METAPHORS = [
  {
    n: "Gecko foot",
    d: "Millions of tiny hairs stick without glue.",
    effect: "Adhesion",
  },
  {
    n: "Octopus arm",
    d: "Suction cups plus a soft body that wraps around anything.",
    effect: "Pressure difference",
  },
  {
    n: "Woodpecker skull",
    d: "Absorbs repeated shocks without damage.",
    effect: "Elastic deformation",
  },
  {
    n: "Kangaroo tendon",
    d: "Stores energy in a spring on each landing.",
    effect: "Elastic deformation",
  },
  {
    n: "Burdock burr (Velcro)",
    d: "Tiny hooks catch loops.",
    effect: "Geometric-physical effect",
  },
  {
    n: "Honeycomb",
    d: "Hexagons give strength for little material.",
    effect: "Geometric-physical effect",
  },
  {
    n: "Elephant trunk",
    d: "One flexible tube grips, sucks and moves.",
    effect: "Pressure difference",
  },
  {
    n: "Cactus",
    d: "Stores water and sheds heat with spines.",
    effect: "Evaporation",
  },
  {
    n: "Sponge",
    d: "Soaks up and releases liquid on demand.",
    effect: "Capillary action",
  },
  {
    n: "Origami fold",
    d: "One flat sheet becomes a rigid 3D shape.",
    effect: "Geometric-physical effect",
  },
  {
    n: "Zipper",
    d: "Two rows interlock progressively.",
    effect: "Geometric-physical effect",
  },
  {
    n: "Spider thread",
    d: "A light line strong in tension.",
    effect: "Elastic deformation",
  },
];

export const BRAINSTORM_RULES = [
  "Express all ideas, no matter how silly.",
  "Freewheeling and wild ideas are encouraged.",
  "Judgment is deferred. No criticism.",
  "Modify, combine and improve on others’ ideas.",
  "Quantity over quality.",
];

/* ------------------------------------------------------------------ Step 5 */
export const PRELIM_TIPS = [
  "Always state the viewpoint for each comparison (compared with the datum, is it better, same or worse?).",
  "The first datum can be the concept you think will win, the most controversial, or the one most like an existing design.",
  "You must run more than one datum.",
  "Pick the next datum freely; most people choose the winner of the previous run.",
  "Stop when a group of concepts rises to the top (the slides suggest 5–7 datums for 10–15 concepts).",
  "You only find the MOST LIKELY TO SUCCEED concepts, not necessarily the best.",
];

export const SENS_TIPS = [
  "Don’t just accept results. Question them.",
  "Make every rating 5% better, then 5% worse. Do the winner’s error bars overlap the runner-up’s?",
  "Is the winner carried by a single attribute?",
  "Change the subjective weights. How dependent is the winner on them?",
];

/* ------------------------------------------------------------------ Examples loaded from the slides */
const F = (id: string, name: string, aux = false): Fn => ({ id, name, aux });
const L = (
  id: string,
  from: string,
  to: string,
  type: FlowType,
  label: string,
): Flow => ({ id, from, to, type, label });

export const EXAMPLE_FS = {
  carpet: {
    title: "Carpet tiles (slides p.24–25)",
    overall:
      "Stamp out carpet tiles from a length of carpet and pack them in lots",
    fns: [
      F("c1", "Stamp tile from length"),
      F("c2", "Separate offcuts"),
      F("c3", "Check quality"),
      F("c4", "Count tiles"),
      F("c5", "Combine in lots"),
      F("c6", "Pack lot"),
      F("c7", "Despatch lots"),
      F("a1", "Remove offcuts", true),
      F("a2", "Remove rejects", true),
      F("a3", "Send signal to combine", true),
      F("a4", "Supply packing material", true),
    ],
    flows: [
      L("f0", "IN", "c1", "M", "carpet length"),
      L("f1", "c1", "c2", "M", "tiles"),
      L("f2", "c2", "c3", "M", "tiles"),
      L("f3", "c3", "c4", "M", "tiles"),
      L("f4", "c4", "c5", "M", "tiles"),
      L("f5", "c5", "c6", "M", "lots"),
      L("f6", "c6", "c7", "M", "packed lots"),
      L("f7", "c7", "OUT", "M", "despatched lots"),
      L("f8", "c2", "a1", "M", "offcuts"),
      L("f9", "a1", "OUT", "M", "offcuts"),
      L("f10", "c3", "a2", "M", "rejects"),
      L("f11", "a2", "OUT", "M", "rejects"),
      L("f12", "IN", "a3", "S", "lot size n"),
      L("f13", "a3", "c5", "S", "combine n tiles"),
      L("f14", "IN", "a4", "M", "packing material"),
      L("f15", "a4", "c6", "M", "packing material"),
    ],
  },
  jar: {
    title: "Jar opener (guide example)",
    overall: "Release a sealed closure using small human effort",
    fns: [
      F("j1", "Locate jar"),
      F("j2", "Grip lid"),
      F("j3", "Rotate lid"),
      F("j4", "Release vacuum seal"),
      F("j5", "Amplify torque", true),
      F("j6", "Indicate release", true),
    ],
    flows: [
      L("g0", "IN", "j1", "M", "sealed jar"),
      L("g1", "j1", "j2", "M", "located jar"),
      L("g2", "j2", "j3", "M", "gripped lid"),
      L("g3", "j3", "j4", "M", "turning lid"),
      L("g4", "j4", "OUT", "M", "opened jar"),
      L("g5", "IN", "j5", "E", "human force"),
      L("g6", "j5", "j3", "E", "torque"),
      L("g7", "j4", "j6", "S", "seal state"),
      L("g8", "j6", "OUT", "S", "click / pop"),
    ],
  },
  driver: {
    title: "Power screwdriver (slide p.20, condensed)",
    overall: "Loosen/tighten screws",
    fns: [
      F("d1", "Store electricity"),
      F("d2", "Supply electricity"),
      F("d3", "Transmit electricity"),
      F("d4", "Actuate electricity"),
      F("d5", "Regulate electricity"),
      F("d6", "Convert electricity to torque"),
      F("d7", "Change torque"),
      F("d8", "Transmit torque"),
      F("d9", "Rotate solid"),
      F("d10", "Dissipate torque"),
    ],
    flows: [
      L("s0", "IN", "d1", "E", "electricity"),
      L("s1", "d1", "d2", "E", "elect."),
      L("s2", "d2", "d3", "E", "elect."),
      L("s3", "d3", "d4", "E", "elect."),
      L("s4", "d4", "d5", "E", "elect."),
      L("s5", "d5", "d6", "E", "elect."),
      L("s6", "d6", "d7", "E", "torque"),
      L("s7", "d7", "d8", "E", "torque"),
      L("s8", "d8", "d9", "E", "torque"),
      L("s9", "d9", "d10", "E", "torque"),
      L("s10", "d10", "OUT", "E", "heat, torque"),
      L("s11", "IN", "d4", "E", "human force"),
      L("s12", "d4", "OUT", "E", "human force"),
      L("s13", "IN", "d4", "S", "on/off"),
      L("s14", "IN", "d5", "S", "direction"),
      L("s15", "IN", "d9", "M", "screw, bit"),
      L("s16", "d9", "OUT", "M", "screw, bit"),
      L("s17", "d6", "OUT", "E", "heat, noise"),
    ],
  },
};

// Impulse-loading test rig chart (slides p.104–113). Row index = sub-function, column order = principle number.
export const RIG = {
  title: "Impulse-loading test rig (slides p.99–115)",
  problem:
    "Apply dynamically changing torque while at the same time measuring load levels, stresses and strains.",
  rows: [
    {
      n: "Change energy: electric → mechanical",
      p: [
        "Electric motors of various types",
        "Linear motor",
        "Electrostriction",
        "Magnetostriction",
        "Piezo quartz",
        "Capacitor",
        "Electromagnet",
      ],
      e: [
        "Lorentz force",
        "Lorentz force",
        "Piezoelectric effect",
        "Piezoelectric effect",
        "Piezoelectric effect",
        "Capacitance",
        "Permanent magnet attraction",
      ],
    },
    {
      n: "Change energy: electric → hydraulic",
      p: [
        "Hydrostatic displacement units (pump or motor)",
        "Hydrodynamic principle (pump or turbine)",
        "MHD effect",
        "Electro-osmosis / electrophoresis",
      ],
      e: [
        "Hydrostatic pressure",
        "Bernoulli effect",
        "Lorentz force",
        "Electrostatic induction",
      ],
    },
    {
      n: "Change energy: mechanical → mechanical",
      p: [
        "Screw drive",
        "Rack & pinion",
        "Cam drive",
        "Linkage",
        "Combined drive",
        "Impulsive drive",
        "Lever",
        "Pulley",
      ],
      e: [
        "Wedge effect",
        "Circular motion",
        "Geometric-physical effect",
        "Lever effect",
        "Circular motion",
        "Momentum",
        "Lever effect",
        "Friction",
      ],
    },
    {
      n: "Change energy: mechanical → hydraulic",
      p: [
        "Piston",
        "Screw pump or motor",
        "Gear pump or motor",
        "Valve pump or motor",
        "Axial piston pump or motor",
        "Radial piston pump or motor",
        "Hydrodynamic principle",
        "Upthrust",
      ],
      e: [
        "Hydrostatic pressure",
        "Wedge effect",
        "Hydrostatic pressure",
        "Hydrostatic pressure",
        "Hydrostatic pressure",
        "Hydrostatic pressure",
        "Bernoulli effect",
        "Buoyancy",
      ],
    },
    {
      n: "Store energy",
      p: [
        "Flywheel",
        "Moving mass (translation)",
        "Potential energy",
        "Strain",
        "Battery",
        "Capacitor (electric field)",
        "Hydraulic (bladder / piston / membrane)",
        "Liquid storage (potential energy)",
      ],
      e: [
        "Inertia",
        "Momentum",
        "Gravitation",
        "Elastic deformation",
        "Semiconductor",
        "Capacitance",
        "Hydrostatic pressure",
        "Gravitation",
      ],
    },
    {
      n: "Control energy (magnitude and time)",
      p: [
        "Cam (linear)",
        "Cam (3D)",
        "Rolling contact",
        "Epicyclic gear drive",
        "Controlled braking",
        "Ohmic or inductive resistance",
        "Thyristor",
        "Controllable valves",
        "Controllable motors and pumps",
      ],
      e: [
        "Geometric-physical effect",
        "Geometric-physical effect",
        "Friction",
        "Circular motion",
        "Friction",
        "Joule heating",
        "Semiconductor",
        "Pressure difference",
        "Lorentz force",
      ],
    },
    {
      n: "Vary energy component",
      p: ["Wedge", "Linkage", "Gears (a)", "Gears (b)", "Hydraulic"],
      e: [
        "Wedge effect",
        "Lever effect",
        "Circular motion",
        "Circular motion",
        "Hydrostatic pressure",
      ],
    },
  ],
  // variants as written on slides: "row.col"
  variants: [
    { name: "V1", codes: ["1.1", "5.3", "6.5", "3.4", "3.7"] },
    {
      name: "V2",
      codes: ["1.1", "7.4", "5.1", "6.2", "3.7"],
      note: "The slide chain uses 7.4 twice (1.1 – 7.4 – 5.1 – 7.4 – 6.2 – 3.7). A structure here lists each principle once.",
    },
    { name: "V3", codes: ["1.1", "5.1", "3.1", "6.1", "3.7"] },
    { name: "V4", codes: ["2.1", "6.8", "4.1", "3.2"] },
  ],
};

// Objectives hierarchy and decision matrix (slides p.114–115). Weights are the combined weights printed on the slide.
const O = (
  id: string,
  name: string,
  w: number,
  children: ObjNode[] = [],
): ObjNode => ({ id, name, w, children });
export const RIG_TREE: ObjNode = O(
  "root",
  "Reliable and simple testing device",
  1,
  [
    O("o1", "Reliable operation", 0.4, [
      O("o11", "Good reproducibility of torque-time curve", 0.7, [
        O("o111", "Low wear of moving parts", 0.2),
        O("o112", "Low susceptibility to vibrations", 0.5),
        O("o113", "Few disturbing factors", 0.3),
      ]),
      O("o12", "Tolerance of overloading", 0.3),
    ]),
    O("o2", "High safety", 0.3, [
      O("o21", "High mechanical safety", 0.7),
      O("o22", "Few possible operator errors", 0.3),
    ]),
    O("o3", "Simple production", 0.1, [
      O("o31", "Simple component production", 0.6, [
        O("o311", "Small number of components", 0.5),
        O("o312", "Low complexity of components", 0.2),
        O("o313", "Many standard and bought-out parts", 0.3),
      ]),
      O("o32", "Simple assembly", 0.4),
    ]),
    O("o4", "Good operating characteristics", 0.2, [
      O("o41", "Easy maintenance", 0.3),
      O("o42", "Easy handling", 0.7, [
        O("o421", "Quick exchange of test connections", 0.6),
        O("o422", "Good accessibility of measuring system", 0.4),
      ]),
    ]),
  ],
);

export const RIG_CRIT_ORDER = [
  "o111",
  "o112",
  "o113",
  "o12",
  "o21",
  "o22",
  "o311",
  "o312",
  "o313",
  "o32",
  "o41",
  "o421",
  "o422",
];
export const RIG_VALUES: Record<string, number[]> = {
  V1: [3, 3, 2, 5, 4, 3, 5, 6, 2, 3, 4, 4, 7],
  V2: [6, 7, 7, 7, 7, 7, 4, 7, 6, 5, 8, 7, 7],
  V3: [4, 7, 6, 7, 7, 6, 4, 5, 6, 5, 7, 7, 7],
  V4: [6, 2, 4, 8, 8, 4, 6, 3, 8, 7, 3, 4, 5],
};

export function exampleCrit(id: string, name: string, weight: number): Crit {
  return { id, name, rank: 1, weight, pref: "H", lo: 0, hi: 10, unit: "score" };
}

/* ------------------------------------------------------------------ Navigation helpers */
export const LOCATOR = [
  {
    q: "Do you have your Lab 2 requirements list in front of you?",
    no: {
      step: 1,
      tab: "learn",
      msg: "Start by getting your Lab 2 requirements list. Then open the Abstraction Elevator.",
    },
  },
  {
    q: "Do you have ONE sentence that states the problem with no product name and no numbers?",
    no: {
      step: 1,
      tab: "bench",
      msg: "You are in Step 1. Work through the five abstraction operations.",
    },
  },
  {
    q: "Do you have a function structure: verb + noun boxes, typed flows, a system boundary?",
    no: {
      step: 2,
      tab: "forge",
      msg: "You are in Step 2. Build the function structure in the Function Forge.",
    },
  },
  {
    q: "Does EVERY function have at least five different working principles, each one sketched?",
    no: {
      step: 3,
      tab: "chart",
      msg: "You are in Step 3. Fill and sketch the morphological chart.",
    },
  },
  {
    q: "Do you have at least four working structures (one compatible principle per function)?",
    no: {
      step: 4,
      tab: "weave",
      msg: "You are in Step 4. Thread paths through the chart.",
    },
  },
  {
    q: "Have you filtered the structures, scored the survivors with a weighted matrix, and stress-tested the winner?",
    no: {
      step: 5,
      tab: "filter",
      msg: "You are in Step 5. Enter the Decision Arena.",
    },
  },
  {
    q: "Do you have ONE principal solution with a detailed sketch and a written description?",
    no: {
      step: 6,
      tab: "studio",
      msg: "You are in Step 6. Firm the winner up in the Concept Studio.",
    },
  },
];

export interface Scenario {
  id: string;
  step: number;
  q: string;
  a: string;
  go: { label: string; view: string; tab?: string }[];
}
export const SCENARIOS: Scenario[] = [
  {
    id: "a1",
    step: 1,
    q: "My problem statement still says “design a …”",
    a: "That names the product. Ask what the product DOES to what. Replace “design a garlic press” with a verb + what is being acted on + the constraint (“separate pulp from skin using low force”).",
    go: [{ label: "Open the statement linter", view: "s1", tab: "bench" }],
  },
  {
    id: "a2",
    step: 1,
    q: "Every requirement feels essential",
    a: "Still run operations 3 and 4. Numbers become words; nouns become general nouns. If nothing is deleted, write down why each item survived. That counts as documentation.",
    go: [{ label: "Classify requirements", view: "s1", tab: "bench" }],
  },
  {
    id: "a3",
    step: 1,
    q: "My statement is so broad it is useless",
    a: "Slide the broadening ladder back down a rung or two. The slides stop where the crux is still the real task (feed distribution, not bag stacking).",
    go: [{ label: "Try the ladder", view: "s1", tab: "learn" }],
  },
  {
    id: "b1",
    step: 2,
    q: "I only have a straight line of boxes",
    a: "Add auxiliary (dashed) functions for supplies, removals and control signals, then check the three flow types. The carpet-tile example turns a line into a structure with four auxiliaries.",
    go: [{ label: "Load carpet example", view: "s2", tab: "forge" }],
  },
  {
    id: "b2",
    step: 2,
    q: "I cannot tell if something is energy, material or signal",
    a: "Material = the thing being changed. Energy = what makes it happen. Signal = information about it. A force is energy; a command to start is a signal.",
    go: [{ label: "Play the flow game", view: "s2", tab: "play" }],
  },
  {
    id: "b3",
    step: 2,
    q: "My functions contain parts (“Motor”, “Handle”)",
    a: "Rename to verb + noun describing the input→output change: “Convert electricity to torque”, “Transmit hand force”.",
    go: [{ label: "Check names in the Forge", view: "s2", tab: "forge" }],
  },
  {
    id: "c1",
    step: 3,
    q: "I can only think of 2 or 3 ideas for a function",
    a: "Run SCAMPER on the function, ask “how does nature do it?”, or draw physical-effect cards. Use the Idea Sprint timer: defer judgement and go for quantity.",
    go: [
      { label: "Open the idea tools", view: "s3", tab: "spark" },
      { label: "Browse effect cards", view: "s3", tab: "effects" },
    ],
  },
  {
    id: "c2",
    step: 3,
    q: "All my principles are variations of one idea",
    a: "The chart tracks distinct physical effects. Aim for different effects, not different shapes. Swap two of the lever variants for a screw, a wedge, a pressure difference, an elastic element.",
    go: [{ label: "See distinct-effect meter", view: "s3", tab: "chart" }],
  },
  {
    id: "c3",
    step: 3,
    q: "A cell has a product name in it",
    a: "Name the physical effect plus the geometry or material: “strap that tightens as it is pulled (capstan friction)”, not a brand.",
    go: [{ label: "Open the chart", view: "s3", tab: "chart" }],
  },
  {
    id: "d1",
    step: 4,
    q: "None of my combinations work together",
    a: "Go back. Add alternatives in the blocking row (Step 3) or rethink how the functions were split (Step 2). The slides call the method iterative: only compatible principles combine.",
    go: [{ label: "Back to chart", view: "s3", tab: "chart" }],
  },
  {
    id: "d2",
    step: 4,
    q: "My four structures look almost identical",
    a: "The Weave shows how many rows each pair shares. Change at least two rows between every pair, ideally rows that use different physical effects.",
    go: [{ label: "See the difference matrix", view: "s4", tab: "weave" }],
  },
  {
    id: "d3",
    step: 4,
    q: "A function needs two principles in series",
    a: "Turn on series mode (the slide’s variants V1–V3 use 3.4 and 3.7 together). Explain the chain in the structure note.",
    go: [{ label: "Open the Weave", view: "s4", tab: "weave" }],
  },
  {
    id: "e1",
    step: 5,
    q: "My top two are almost tied",
    a: "Run the stress test: ±5% on all ratings, then swing each weight. If the error bars overlap, no one is truly better. Look at risk, unknowns and whether you can combine the strengths.",
    go: [{ label: "Open stress test", view: "s5", tab: "stress" }],
  },
  {
    id: "e2",
    step: 5,
    q: "I do not know how to pick weights",
    a: "Use the ranking method (least important = 1, most important = n, then divide by the sum). Or build an objectives hierarchy so child weights multiply parents.",
    go: [{ label: "Open weights", view: "s5", tab: "weights" }],
  },
  {
    id: "e3",
    step: 5,
    q: "My criterion is “easy to use”",
    a: "The slides flag that as poorly worded: “how large is large?” Make it measurable or give an ordinal scale with written descriptions per rating.",
    go: [{ label: "Open matrix", view: "s5", tab: "matrix" }],
  },
  {
    id: "e4",
    step: 5,
    q: "I have too many concepts to score in detail",
    a: "Do the preliminary selection first: compare against a datum with +1 / 0 / −1, repeat with different datums, then keep the “most likely to succeed”.",
    go: [{ label: "Datum duel", view: "s5", tab: "duel" }],
  },
  {
    id: "f1",
    step: 6,
    q: "My sketch is only an outside view",
    a: "Show how it works: a cross-section or an exploded view with forces, motions and parts labelled, and a couple of rough sizes.",
    go: [{ label: "Open sketch pad", view: "s6", tab: "sketch" }],
  },
  {
    id: "f2",
    step: 6,
    q: "I found a flaw while sketching",
    a: "Write it as a weak point and say how you would fix it. If it breaks a demand, go back to the runner-up from the decision matrix.",
    go: [{ label: "Open the Studio", view: "s6", tab: "studio" }],
  },
  {
    id: "g1",
    step: 0,
    q: "I am out of time",
    a: "Protect Appendices B, C and E first (60 of 100 points). A clear function structure, a full chart of sketched principles, and a documented decision matrix beat a pretty Appendix F.",
    go: [{ label: "Open the Vault", view: "vault" }],
  },
];

export const ATLAS: { p: string; t: string; step: number; tab: string }[] = [
  {
    p: "2–3",
    t: "What conceptual design is; the P&B phase-2 flow (7 steps)",
    step: 0,
    tab: "",
  },
  {
    p: "4–8",
    t: "Why abstract; systematic broadening (feed example)",
    step: 1,
    tab: "learn",
  },
  {
    p: "9–13",
    t: "Five abstraction steps; fuel gauge; practice",
    step: 1,
    tab: "bench",
  },
  {
    p: "14–20",
    t: "Function structures; screwdriver; flow types",
    step: 2,
    tab: "learn",
  },
  {
    p: "21–25",
    t: "Popcorn popper; carpet tiles; main vs auxiliary functions",
    step: 2,
    tab: "forge",
  },
  {
    p: "26–28",
    t: "Verb + noun; Stone & Wood function and flow classes",
    step: 2,
    tab: "learn",
  },
  {
    p: "33–38",
    t: "Working principles = physical effect + geometry/material",
    step: 3,
    tab: "learn",
  },
  {
    p: "39–55",
    t: "Solution finding: catalogs, effects, existing systems, nature",
    step: 3,
    tab: "effects",
  },
  {
    p: "56–64",
    t: "Ideation: brainstorming, 6-3-5, synectics, SCAMPER",
    step: 3,
    tab: "spark",
  },
  {
    p: "65–67",
    t: "Combine into working structures (morphological chart)",
    step: 4,
    tab: "weave",
  },
  {
    p: "73–80",
    t: "Anatomy of a decision; 2×2; dot voting; decision stages",
    step: 5,
    tab: "learn",
  },
  {
    p: "81–86",
    t: "Preliminary selection with datums (aircraft)",
    step: 5,
    tab: "duel",
  },
  {
    p: "87–94",
    t: "Selection DSP: attributes, scales, ranking weights, normalize, merit, sensitivity",
    step: 5,
    tab: "matrix",
  },
  { p: "95", t: "Filter / eliminate with + − ? !", step: 5, tab: "filter" },
  {
    p: "99–113",
    t: "Worked example: impulse-loading test rig, variants V1–V4",
    step: 4,
    tab: "weave",
  },
  {
    p: "114–115",
    t: "Objectives hierarchy and decision matrix",
    step: 5,
    tab: "weights",
  },
];
