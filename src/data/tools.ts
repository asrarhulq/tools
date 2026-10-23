import type { Tool } from "@/types/tool";

/**
 * ── THE TOOL REGISTRY ───────────────────────────────────────────────────────
 * The single source of truth for every tool. Add, rename, or re-categorize a
 * tool by editing ONLY this array — routes, homepage sections, search, sitemap,
 * and SEO all derive from it. Route pages are generated per `category/slug`.
 *
 * To add a tool:
 *   1. Add an entry below (pick an icon from lucide-react).
 *   2. Create `app/(tools)/<category>/<slug>/page.tsx` (or let it render the
 *      shared Coming Soon page — the placeholder pages already exist).
 * ────────────────────────────────────────────────────────────────────────────
 */
export const tools: readonly Tool[] = [
  // ── Philosophy ────────────────────────────────────────────────────────────
  {
    id: "phil-tool-2",
    slug: "argument-mapper",
    title: "Argument Mapper",
    description:
      "Map premises, evidence, and objections on an infinite canvas — with live validity and fallacy checks.",
    longDescription:
      "A visual reasoning canvas — think Figma for arguments. Lay out premises, " +
      "conclusions, assumptions, evidence, objections, and rebuttals as nodes, " +
      "connect them with typed relationships (supports, attacks, depends on…), " +
      "and watch a live logic engine grade the structure: unsupported claims, " +
      "circular reasoning, contradictions, and a running catalog of logical " +
      "fallacies, each explained. Auto-layout untangles the graph, a confidence " +
      "and evidence-quality system makes uncertainty visible, and a library of " +
      "famous arguments gets you started. All local, all offline.",
    category: "philosophy",
    icon: "scroll-text",
    difficulty: "intermediate",
    status: "live",
    featured: true,
    popular: true,
    addedAt: "2026-07-18",
    keywords: [
      "syllogism",
      "fallacy",
      "debate",
      "logic",
      "reasoning",
      "critical thinking",
      "argument map",
      "premises",
      "philosophy",
    ],
  },
  {
    id: "phil-tool-3",
    slug: "ethics-compass",
    title: "Ethics Compass",
    description:
      "Map your moral instincts across five great ethical theories through classic dilemmas.",
    longDescription:
      "An interactive moral-philosophy instrument. Work through fifteen classic " +
      "dilemmas in two layers: first judge whether an action is right or wrong, " +
      "then drag a reasoning node across a four-way compass — Utility, Duty, " +
      "Divine Command, and Culture/Virtue — to register why. Your choices are " +
      "scored against five theories (Mill's utilitarianism, Kant's deontology, " +
      "theological voluntarism, Aristotelian virtue ethics, and cultural " +
      "relativism) to reveal the ethical core your instincts most resemble.",
    category: "philosophy",
    icon: "scale",
    difficulty: "intermediate",
    status: "live",
    featured: true,
    popular: true,
    addedAt: "2026-07-15",
    keywords: [
      "ethics",
      "morality",
      "moral philosophy",
      "trolley problem",
      "utilitarianism",
      "deontology",
      "kant",
      "mill",
      "virtue ethics",
      "framework",
    ],
  },
  {
    id: "phil-tool-5",
    slug: "philosophical-chess",
    title: "Philosophical Chess",
    description:
      "Play or annotate your chess games with engine analysis and prompts drawn from six philosophers of play.",
    longDescription:
      "A study for PHIL 29300: Introduction to Chess as Philosophical Inquiry. Play " +
      "out a game — against the built-in Stockfish engine or against yourself — " +
      "or import a PGN on a custom board, flag critical positions, and examine " +
      "each one through two lenses at once — Stockfish's tactical read (eval, " +
      "best line, forks, pins, skewers, discovered attacks) and a genuine " +
      "writing prompt from Ryle, Dewey, C. Thi Nguyen, Suits, Wittgenstein, or " +
      "Hurka. A dual-mode toggle hides the engine until you've recorded your own " +
      "read of the position, then generates a short reflective diff between your " +
      "intuition and its evaluation. Every note, flag, and lens response exports " +
      "as a clean Markdown or PDF journal, ready to submit. Stockfish runs fully " +
      "client-side via WebAssembly — no server, no API key.",
    category: "philosophy",
    icon: "castle",
    difficulty: "advanced",
    status: "live",
    featured: true,
    addedAt: "2026-08-30",
    keywords: [
      "chess",
      "philosophy of games",
      "stockfish",
      "annotation",
      "wittgenstein",
      "dewey",
      "ryle",
      "reflective practice",
      "pgn",
      "phil 29300",
    ],
  },
  {
    id: "phil-tool-4",
    slug: "phil-tool-4",
    title: "Infinity Explorer",
    description: "Visualize paradoxes of the infinite, from Zeno to Cantor.",
    category: "philosophy",
    icon: "infinity",
    difficulty: "advanced",
    status: "coming-soon",
    addedAt: "2026-06-28",
    keywords: ["paradox", "zeno", "set theory"],
  },

  // ── Engineering ───────────────────────────────────────────────────────────
  {
    id: "eng-tool-1",
    slug: "eng-tool-1",
    title: "Additive Manufacturing Analyzer",
    description:
      "Analyze 3D-printable polymer parts: orientation, mass, stability, FEA stress, and print cost.",
    longDescription:
      "A CAD/CAE-style workspace for additive manufacturing. Upload an STL of a " +
      "3D-printable plastic part, orient it on a virtual build plate, and get " +
      "mass properties, rigid-body stability, a linear-elastic FEA stress and " +
      "displacement field, and a full 3D-printing cost and feasibility analysis " +
      "— with a downloadable engineering PDF report. Built on Three.js and React " +
      "Three Fiber, architected to add OBJ, GLTF/GLB, and STEP (via conversion) next.",
    category: "engineering",
    icon: "boxes",
    difficulty: "advanced",
    status: "live",
    featured: true,
    popular: true,
    addedAt: "2026-07-12",
    keywords: [
      "3d printing",
      "additive manufacturing",
      "fdm",
      "stl",
      "fea",
      "stress analysis",
      "polymer parts",
      "print orientation",
      "center of mass",
      "stability",
      "cad",
      "three.js",
    ],
    capabilities: {
      viewer3d: true,
      modelFormats: ["stl", "obj", "gltf", "glb", "step"],
    },
  },
  {
    id: "eng-tool-4",
    slug: "eng-tool-4",
    title: "Tolerance Grid",
    description: "Plan fits and tolerances across a bill of materials.",
    category: "engineering",
    icon: "grid",
    difficulty: "intermediate",
    status: "coming-soon",
    addedAt: "2026-06-25",
    keywords: ["gd&t", "manufacturing", "fit"],
  },
  {
    id: "eng-tool-5",
    slug: "truss-analyzer",
    title: "Truss Analysis Studio",
    description:
      "Build 2D trusses visually and solve reactions, member forces, stress, and deflection with the matrix stiffness method.",
    longDescription:
      "A mini structural-analysis application for planar trusses. Draw nodes and " +
      "members on an interactive canvas or start from Warren, Pratt, Howe, and " +
      "King-post presets, then define supports, loads, materials, and sections. " +
      "A direct (matrix) stiffness solver computes support reactions, axial " +
      "member forces with tension/compression identification, stresses, factors " +
      "of safety, and the deformed shape — with color-coded force visualization, " +
      "an animated deflection view, stability and constraint diagnostics, " +
      "efficiency and safety scores, auto member sizing, design comparison, a " +
      "step-by-step Learning Mode, and a professional PDF calculation report. " +
      "SI and Imperial units, all computed in your browser.",
    category: "engineering",
    icon: "triangle",
    difficulty: "advanced",
    status: "live",
    featured: true,
    popular: true,
    addedAt: "2026-07-14",
    keywords: [
      "truss",
      "structural analysis",
      "stiffness method",
      "statics",
      "member forces",
      "fea",
      "civil engineering",
      "method of joints",
      "deflection",
      "factor of safety",
    ],
  },
  {
    id: "eng-tool-6",
    slug: "beam-designer",
    title: "Beam Designer & Structural Analysis",
    description:
      "Design beams on an interactive canvas and get live shear, moment, slope, deflection, and stress from a finite-element solver.",
    longDescription:
      "A premium browser-based structural-analysis studio for beams. Build " +
      "simply-supported, cantilever, fixed, continuous, and overhanging beams on " +
      "an interactive canvas with draggable supports (pin, roller, fixed, spring, " +
      "internal hinge) and loads (point, moment, UDL, triangular, trapezoidal). A " +
      "2-node Euler-Bernoulli finite-element solver computes reactions and live " +
      "shear-force, bending-moment, slope, and deflection diagrams plus bending/" +
      "shear/von Mises stress, factor of safety, buckling, natural frequency, and " +
      "weight & cost. Includes a material and cross-section library with automatic " +
      "section properties, multiple load cases with envelope diagrams, moving-load " +
      "influence lines, design comparison, auto beam sizing, a step-by-step " +
      "Learning Mode, SI/metric/imperial units, and a professional PDF report. " +
      "Built on the direct stiffness method, validated against textbook cases.",
    category: "engineering",
    icon: "square-stack",
    difficulty: "advanced",
    status: "live",
    featured: true,
    popular: true,
    addedAt: "2026-07-14",
    keywords: [
      "beam",
      "structural analysis",
      "bending moment",
      "shear force",
      "deflection",
      "euler-bernoulli",
      "cantilever",
      "continuous beam",
      "stress",
      "finite element",
    ],
  },

  // ── Economics ─────────────────────────────────────────────────────────────
  {
    id: "econ-tool-2",
    slug: "econ-tool-2",
    title: "Supply & Demand Simulator",
    description:
      "Shift curves and watch equilibrium price and quantity respond.",
    category: "economics",
    icon: "scale",
    difficulty: "intermediate",
    status: "coming-soon",
    addedAt: "2026-07-01",
    keywords: ["market", "equilibrium", "microeconomics"],
  },
  {
    id: "econ-tool-3",
    slug: "econ-tool-3",
    title: "Inflation Calculator",
    description: "See how purchasing power changes across decades.",
    category: "economics",
    icon: "coins",
    difficulty: "beginner",
    status: "coming-soon",
    addedAt: "2026-06-22",
    keywords: ["cpi", "purchasing power", "money"],
  },
  {
    id: "econ-tool-4",
    slug: "econ-tool-4",
    title: "Game Theory Playground",
    description: "Explore Nash equilibria in classic strategic games.",
    category: "economics",
    icon: "landmark",
    difficulty: "advanced",
    status: "coming-soon",
    addedAt: "2026-06-18",
    keywords: ["nash", "prisoner's dilemma", "strategy"],
  },

  // ── General ───────────────────────────────────────────────────────────────
  {
    id: "general-tool-2",
    slug: "focus-timer",
    title: "Pomodoro Timer",
    description:
      "A calm, beautiful focus timer with stats, streaks, and a Zen mode.",
    longDescription:
      "A distraction-free Pomodoro timer built around a buttery-smooth animated " +
      "ring. Focus, short-break, and long-break modes with customizable " +
      "durations, automatic 4-session cycling, keyboard shortcuts, and a " +
      "fullscreen Focus Mode. Tracks today's and weekly sessions, total focus " +
      "hours, current and longest streaks, and a dynamic Focus Score — with a " +
      "365-day productivity heatmap, a recent-session timeline, rotating " +
      "philosophical quotes, optional sounds, and browser notifications. All " +
      "settings and statistics persist locally in your browser.",
    category: "general",
    icon: "clock",
    difficulty: "beginner",
    status: "live",
    featured: true,
    popular: true,
    addedAt: "2026-07-17",
    keywords: [
      "focus",
      "productivity",
      "timer",
      "pomodoro",
      "deep work",
      "streak",
      "concentration",
      "study",
      "zen",
    ],
  },
  {
    id: "general-tool-3",
    slug: "general-tool-3",
    title: "Time Zone Planner",
    description: "Find overlapping working hours across the globe.",
    category: "general",
    icon: "hourglass",
    difficulty: "beginner",
    status: "coming-soon",
    addedAt: "2026-06-30",
    keywords: ["timezone", "scheduling", "meeting"],
  },
  {
    id: "general-tool-4",
    slug: "general-tool-4",
    title: "Decision Dice",
    description: "Weighted randomness for when you just can't decide.",
    category: "general",
    icon: "dice",
    difficulty: "beginner",
    status: "coming-soon",
    addedAt: "2026-06-20",
    keywords: ["random", "choice", "picker"],
  },
  {
    id: "general-tool-5",
    slug: "gantt-studio",
    title: "Project Timeline & Gantt Studio",
    description:
      "Build professional project schedules with an interactive Gantt chart, critical path, and presentation-ready exports.",
    longDescription:
      "A premium, browser-based project planning studio. Create projects, add " +
      "unlimited nested tasks with dependencies, and generate a live interactive " +
      "Gantt chart with critical-path analysis, milestones, baselines, and slack. " +
      "A dashboard summarizes progress, delays, and upcoming milestones, while " +
      "smart scheduling flags conflicts and impossible timelines. Start from " +
      "engineering, research, construction, or software templates and export a " +
      "polished PDF report (with a professional cover page), PNG, SVG, Excel, " +
      "CSV, JSON, or Microsoft Project XML — all computed in your browser.",
    category: "general",
    icon: "gantt-chart",
    difficulty: "intermediate",
    status: "live",
    featured: true,
    popular: true,
    addedAt: "2026-07-13",
    keywords: [
      "gantt",
      "project management",
      "timeline",
      "schedule",
      "critical path",
      "milestones",
      "dependencies",
      "planning",
      "roadmap",
      "wbs",
    ],
  },
  {
    id: "general-tool-6",
    slug: "biomechanics-lab",
    title: "Human Biomechanics Lab",
    description:
      "An interactive 3D biomechanics lab: simulate gait, lifting, and sport, and analyze joint forces, spinal load, and injury risk.",
    longDescription:
      "A virtual biomechanics laboratory that pairs an interactive 3D human " +
      "model with a real analysis engine. Simulate walking, running, sprinting, " +
      "squatting, deadlifting, and sports movements, then inspect center of mass, " +
      "inverse-dynamics joint reaction forces and torques, ground reaction forces, " +
      "L5/S1 spinal compression, muscle-activation heat maps, and injury-risk " +
      "indices. Switch between skeleton, muscle, joint, force, injury, and heat-map " +
      "views; customize body height, mass, and load; assess posture; compare " +
      "techniques; and export a professional PDF report. Built on Three.js and " +
      "React Three Fiber with classic biomechanics models (Dempster anthropometry, " +
      "inverse dynamics) — all computed in your browser.",
    category: "general",
    icon: "person-standing",
    difficulty: "advanced",
    status: "live",
    featured: true,
    popular: true,
    addedAt: "2026-07-13",
    keywords: [
      "biomechanics",
      "human motion",
      "gait analysis",
      "joint forces",
      "injury risk",
      "posture",
      "sports science",
      "kinesiology",
      "3d anatomy",
      "inverse dynamics",
    ],
  },
  {
    id: "general-tool-7",
    slug: "orrery",
    title: "Orrery",
    description:
      "A real-physics 3D solar system: true Keplerian orbits, correct relative motion, any date in history or the future.",
    longDescription:
      "An interactive 3D orrery — the historical name for a mechanical model " +
      "of the solar system, rebuilt as a real physics simulation. Every " +
      "planet, dwarf planet, and major moon moves on a genuine Keplerian " +
      "ellipse from its real J2000 orbital elements, solved live via Kepler's " +
      "equation, so relative motion is actually correct: watch Mercury lap " +
      "the Sun every 88 days while Neptune barely creeps. Play, pause, and " +
      "scrub time from any historical date to any future one at speeds from " +
      "real-time to ten years per second; click any body to fly the camera " +
      "to it and read its real physical data (mass, gravity, rotation, " +
      "temperature); toggle between a visually compressed scale that keeps " +
      "the whole system in view and a true-distance scale that shows how " +
      "empty space actually is. Includes Saturn and Uranus's rings (tilted " +
      "to each planet's real, very different axial tilt), an asteroid belt, " +
      "a guided tour, and a search across every body — all computed and " +
      "rendered client-side with Three.js and React Three Fiber.",
    category: "general",
    icon: "orbit",
    difficulty: "intermediate",
    status: "live",
    featured: true,
    popular: true,
    addedAt: "2026-09-06",
    keywords: [
      "astronomy",
      "solar system",
      "orrery",
      "planets",
      "orbital mechanics",
      "kepler",
      "space",
      "3d simulation",
      "moons",
      "night sky",
    ],
  },
  {
    id: "general-tool-8",
    slug: "ayas-chess-board",
    title: "Aya's Chess Board",
    description:
      "A beginner-friendly chess board built for one person, with warm little notes after every move and a few words of Arabic along the way.",
    longDescription:
      "A local, pass-and-play chess board for someone brand new to the game: " +
      "click a piece to see every legal move highlighted, no drag precision " +
      "required, and a little companion message after every move — a nice " +
      "one for a quiet opening, a food-pun for a capture, and an honest " +
      "piece of chess history for check and checkmate (the word " +
      '"checkmate" really does come from Arabic/Persian "shah mat," "the ' +
      'king is helpless"). A standing glossary keeps a handful of chess ' +
      "terms in Arabic on screen throughout, and four board themes are " +
      "named like nail polish shades. Everything runs client-side on " +
      "chess.js — no accounts, no server, just a board.",
    category: "general",
    icon: "heart",
    difficulty: "beginner",
    status: "live",
    addedAt: "2026-10-21",
    keywords: [
      "chess",
      "beginner chess",
      "learn chess",
      "arabic",
      "chess vocabulary",
      "pass and play",
      "two player chess",
    ],
  },
  {
    id: "general-tool-9",
    slug: "bloomie",
    title: "Bloomie",
    description:
      "A gentle daily companion for a med student — a soft task list, a private mood check-in, and an affirmation, built so no button is just for show.",
    longDescription:
      "A mental-wellness and study-organization companion for someone " +
      "working through MBBS: a real, skippable onboarding that learns a " +
      "nickname, year, subjects, and what kind of support actually helps; " +
      'a daily task list with priorities and estimated time, a "minimum ' +
      'viable day" mode for hard days, and a "make today easier" action ' +
      "that pushes anything non-essential to tomorrow; a private, " +
      "non-diagnostic mood check-in with a 28-day pattern view; and a " +
      "rotating library of affirmations written for the specific weight of " +
      "medical school — imposter syndrome, comparison, burnout — each with " +
      'a "why this matters" note and an optional reflection prompt. A ' +
      "day/lavender-night theme toggle, and everything saved locally on " +
      "the device — no accounts, no server.",
    category: "general",
    icon: "flower-2",
    difficulty: "beginner",
    status: "live",
    addedAt: "2026-10-23",
    keywords: [
      "mental wellness",
      "mood tracker",
      "affirmations",
      "study planner",
      "mbbs",
      "medical student",
      "self care",
      "confidence",
      "journal",
    ],
  },
] as const;
