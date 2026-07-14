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
    id: "phil-tool-1",
    slug: "phil-tool-1",
    title: "Thought Experiment Lab",
    description: "Run classic thought experiments and branch your reasoning.",
    category: "philosophy",
    icon: "git-branch",
    difficulty: "beginner",
    status: "coming-soon",
    featured: true,
    popular: true,
    addedAt: "2026-07-10",
    keywords: ["trolley problem", "reasoning", "logic"],
  },
  {
    id: "phil-tool-2",
    slug: "phil-tool-2",
    title: "Argument Mapper",
    description:
      "Diagram premises and conclusions to test an argument's validity.",
    category: "philosophy",
    icon: "scroll-text",
    difficulty: "intermediate",
    status: "coming-soon",
    addedAt: "2026-07-08",
    keywords: ["syllogism", "fallacy", "debate"],
  },
  {
    id: "phil-tool-3",
    slug: "phil-tool-3",
    title: "Ethics Compass",
    description:
      "Compare decisions across utilitarian, deontological, and virtue lenses.",
    category: "philosophy",
    icon: "compass",
    difficulty: "intermediate",
    status: "coming-soon",
    addedAt: "2026-07-05",
    keywords: ["ethics", "morality", "framework"],
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
    id: "eng-tool-2",
    slug: "eng-tool-2",
    title: "Unit Converter",
    description: "Convert length, mass, pressure, and more with precision.",
    category: "engineering",
    icon: "ruler",
    difficulty: "beginner",
    status: "coming-soon",
    popular: true,
    addedAt: "2026-07-09",
    keywords: ["units", "metric", "imperial", "conversion"],
  },
  {
    id: "eng-tool-3",
    slug: "eng-tool-3",
    title: "Beam Calculator",
    description: "Compute deflection and stress for simple structural beams.",
    category: "engineering",
    icon: "calculator",
    difficulty: "advanced",
    status: "coming-soon",
    addedAt: "2026-07-02",
    keywords: ["structural", "stress", "deflection", "statics"],
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
    id: "econ-tool-1",
    slug: "econ-tool-1",
    title: "Compound Interest Lab",
    description: "Model growth, contributions, and inflation over time.",
    category: "economics",
    icon: "trending-up",
    difficulty: "beginner",
    status: "coming-soon",
    featured: true,
    popular: true,
    addedAt: "2026-07-07",
    keywords: ["investing", "savings", "growth", "finance"],
  },
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
    id: "general-tool-1",
    slug: "general-tool-1",
    title: "Color Studio",
    description: "Generate accessible palettes with contrast checking.",
    category: "general",
    icon: "palette",
    difficulty: "beginner",
    status: "coming-soon",
    featured: true,
    popular: true,
    addedAt: "2026-07-12",
    keywords: ["color", "palette", "contrast", "wcag", "design"],
  },
  {
    id: "general-tool-2",
    slug: "general-tool-2",
    title: "Pomodoro Timer",
    description: "A focused, beautiful timer for deep work sessions.",
    category: "general",
    icon: "clock",
    difficulty: "beginner",
    status: "coming-soon",
    addedAt: "2026-07-04",
    keywords: ["focus", "productivity", "timer"],
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
] as const;
