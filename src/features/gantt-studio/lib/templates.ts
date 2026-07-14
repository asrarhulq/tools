import type { DependencyType, ISODate, Project, Task } from "../types";
import { addDaysISO, endForDuration, todayISO } from "./dates";
import { colorForCategory, createProject, nextId } from "./factory";

/**
 * Project templates. Each template is a compact spec: a list of phases, each
 * with child tasks described by relative day offsets and simple predecessor
 * links (by local key). `buildFromTemplate` materializes a spec into a real
 * Project anchored at a chosen start date, wiring dependencies and nesting.
 */

interface TaskSpec {
  key: string;
  name: string;
  /** Offset in days from the project start (ignored if `after` is set). */
  offset?: number;
  duration: number;
  milestone?: boolean;
  progress?: number;
  /** Predecessor keys; first is used for the FS link start. */
  after?: string[];
  depType?: DependencyType;
  assignee?: string;
  department?: string;
}

interface PhaseSpec {
  key: string;
  name: string;
  tasks: TaskSpec[];
}

export interface TemplateSpec {
  id: string;
  name: string;
  description: string;
  category: string;
  phases: PhaseSpec[];
}

export function buildFromTemplate(
  spec: TemplateSpec,
  start: ISODate = todayISO(),
): Project {
  const project = createProject({
    name: spec.name,
    description: spec.description,
    startDate: start,
  });
  const tasks: Task[] = [];
  const keyToId = new Map<string, string>();
  const keyToEnd = new Map<string, ISODate>();
  let order = 0;

  for (const phase of spec.phases) {
    const phaseId = nextId();
    keyToId.set(phase.key, phaseId);
    tasks.push(
      baseTask(phaseId, phase.name, null, order++, start, 1, spec.category),
    );

    let childOrder = 0;
    for (const t of phase.tasks) {
      const id = nextId();
      keyToId.set(t.key, id);
      // Resolve start: after a predecessor's end, else offset from project start.
      let s = addDaysISO(start, t.offset ?? 0);
      const deps = [];
      if (t.after && t.after.length) {
        const predEnd = keyToEnd.get(t.after[0]!);
        if (predEnd) s = addDaysISO(predEnd, 1);
        for (const pk of t.after) {
          const from = keyToId.get(pk);
          if (from)
            deps.push({ from, to: id, type: t.depType ?? "FS", lag: 0 });
        }
      }
      const task = baseTask(
        id,
        t.name,
        phaseId,
        childOrder++,
        s,
        t.duration,
        spec.category,
      );
      task.isMilestone = t.milestone ?? false;
      task.progress = t.progress ?? 0;
      task.dependencies = deps;
      task.assignee = t.assignee ?? "";
      task.department = t.department ?? "";
      if (task.isMilestone) task.endDate = task.startDate;
      keyToEnd.set(t.key, task.endDate);
      tasks.push(task);
    }
  }

  // Set the project end to just past the last task.
  const lastEnd = tasks.reduce(
    (acc, t) => (t.endDate > acc ? t.endDate : acc),
    start,
  );
  project.meta.endDate = addDaysISO(lastEnd, 7);
  project.tasks = tasks;
  return project;
}

function baseTask(
  id: string,
  name: string,
  parentId: string | null,
  order: number,
  start: ISODate,
  duration: number,
  category: string,
): Task {
  return {
    id,
    name,
    parentId,
    order,
    startDate: start,
    endDate: endForDuration(start, duration),
    duration,
    isMilestone: false,
    progress: 0,
    status: "not-started",
    priority: "medium",
    dependencies: [],
    assignee: "",
    department: "",
    category,
    notes: "",
    color: parentId ? colorForCategory(category) : "",
    collapsed: false,
  };
}

// ── The template library ─────────────────────────────────────────────────────

export const TEMPLATES: readonly TemplateSpec[] = [
  {
    id: "engineering",
    name: "Engineering Project",
    description: "Design → analysis → prototype → validation → release.",
    category: "Engineering",
    phases: [
      {
        key: "concept",
        name: "Concept & Requirements",
        tasks: [
          {
            key: "reqs",
            name: "Requirements definition",
            offset: 0,
            duration: 7,
            department: "Systems",
          },
          {
            key: "concept-review",
            name: "Concept review",
            after: ["reqs"],
            duration: 1,
            milestone: true,
          },
        ],
      },
      {
        key: "design",
        name: "Design",
        tasks: [
          {
            key: "prelim",
            name: "Preliminary design",
            after: ["concept-review"],
            duration: 12,
            department: "Design",
          },
          {
            key: "pdr",
            name: "Preliminary Design Review",
            after: ["prelim"],
            duration: 1,
            milestone: true,
          },
          {
            key: "detailed",
            name: "Detailed design",
            after: ["pdr"],
            duration: 18,
            department: "Design",
          },
          {
            key: "cdr",
            name: "Critical Design Review",
            after: ["detailed"],
            duration: 1,
            milestone: true,
          },
        ],
      },
      {
        key: "build",
        name: "Prototype & Test",
        tasks: [
          {
            key: "proto",
            name: "Prototype fabrication",
            after: ["cdr"],
            duration: 20,
            department: "Manufacturing",
          },
          {
            key: "test",
            name: "Verification testing",
            after: ["proto"],
            duration: 14,
            department: "Test",
          },
          {
            key: "trr",
            name: "Test Readiness Review",
            after: ["proto"],
            duration: 1,
            milestone: true,
          },
        ],
      },
      {
        key: "release",
        name: "Validation & Release",
        tasks: [
          {
            key: "validate",
            name: "Design validation",
            after: ["test"],
            duration: 10,
            department: "Quality",
          },
          {
            key: "release-ms",
            name: "Release to production",
            after: ["validate"],
            duration: 1,
            milestone: true,
          },
        ],
      },
    ],
  },
  {
    id: "research",
    name: "Research Project",
    description:
      "Literature review → methodology → data → analysis → publication.",
    category: "Research",
    phases: [
      {
        key: "planning",
        name: "Planning",
        tasks: [
          { key: "lit", name: "Literature review", offset: 0, duration: 21 },
          {
            key: "hypothesis",
            name: "Hypothesis & questions",
            after: ["lit"],
            duration: 7,
          },
          {
            key: "proposal",
            name: "Proposal approved",
            after: ["hypothesis"],
            duration: 1,
            milestone: true,
          },
        ],
      },
      {
        key: "method",
        name: "Methodology & Data",
        tasks: [
          {
            key: "design-study",
            name: "Study design",
            after: ["proposal"],
            duration: 10,
          },
          {
            key: "collect",
            name: "Data collection",
            after: ["design-study"],
            duration: 30,
          },
          {
            key: "clean",
            name: "Data cleaning",
            after: ["collect"],
            duration: 7,
          },
        ],
      },
      {
        key: "analysis",
        name: "Analysis & Publication",
        tasks: [
          {
            key: "analyze",
            name: "Statistical analysis",
            after: ["clean"],
            duration: 14,
          },
          {
            key: "write",
            name: "Manuscript drafting",
            after: ["analyze"],
            duration: 21,
          },
          {
            key: "submit",
            name: "Submit for publication",
            after: ["write"],
            duration: 1,
            milestone: true,
          },
        ],
      },
    ],
  },
  {
    id: "construction",
    name: "Construction",
    description:
      "Permitting → site → foundation → structure → finishes → handover.",
    category: "Construction",
    phases: [
      {
        key: "pre",
        name: "Pre-construction",
        tasks: [
          {
            key: "permit",
            name: "Permitting & approvals",
            offset: 0,
            duration: 20,
          },
          {
            key: "mobilize",
            name: "Site mobilization",
            after: ["permit"],
            duration: 5,
          },
        ],
      },
      {
        key: "structure",
        name: "Structure",
        tasks: [
          {
            key: "excavate",
            name: "Excavation",
            after: ["mobilize"],
            duration: 10,
          },
          {
            key: "foundation",
            name: "Foundation",
            after: ["excavate"],
            duration: 15,
          },
          {
            key: "frame",
            name: "Framing / superstructure",
            after: ["foundation"],
            duration: 30,
          },
          {
            key: "topout",
            name: "Structural top-out",
            after: ["frame"],
            duration: 1,
            milestone: true,
          },
        ],
      },
      {
        key: "finish",
        name: "Finishes & Handover",
        tasks: [
          { key: "mep", name: "MEP rough-in", after: ["frame"], duration: 20 },
          {
            key: "finishes",
            name: "Interior finishes",
            after: ["mep"],
            duration: 25,
          },
          {
            key: "inspect",
            name: "Final inspection",
            after: ["finishes"],
            duration: 5,
          },
          {
            key: "handover",
            name: "Handover",
            after: ["inspect"],
            duration: 1,
            milestone: true,
          },
        ],
      },
    ],
  },
  {
    id: "software",
    name: "Software Development",
    description: "Discovery → design → sprints → QA → launch.",
    category: "Software",
    phases: [
      {
        key: "discovery",
        name: "Discovery",
        tasks: [
          { key: "reqs", name: "Requirements & scope", offset: 0, duration: 5 },
          { key: "ux", name: "UX & wireframes", after: ["reqs"], duration: 8 },
          { key: "arch", name: "Architecture", after: ["reqs"], duration: 6 },
        ],
      },
      {
        key: "build",
        name: "Build",
        tasks: [
          {
            key: "sprint1",
            name: "Sprint 1 — core",
            after: ["ux", "arch"],
            duration: 10,
          },
          {
            key: "sprint2",
            name: "Sprint 2 — features",
            after: ["sprint1"],
            duration: 10,
          },
          {
            key: "sprint3",
            name: "Sprint 3 — polish",
            after: ["sprint2"],
            duration: 10,
          },
          {
            key: "codefreeze",
            name: "Code freeze",
            after: ["sprint3"],
            duration: 1,
            milestone: true,
          },
        ],
      },
      {
        key: "release",
        name: "QA & Launch",
        tasks: [
          {
            key: "qa",
            name: "QA & bug fixing",
            after: ["codefreeze"],
            duration: 8,
          },
          {
            key: "uat",
            name: "User acceptance testing",
            after: ["qa"],
            duration: 5,
          },
          {
            key: "launch",
            name: "Production launch",
            after: ["uat"],
            duration: 1,
            milestone: true,
          },
        ],
      },
    ],
  },
  {
    id: "product",
    name: "Product Development",
    description: "Ideation → prototype → validation → GTM → launch.",
    category: "Product",
    phases: [
      {
        key: "ideate",
        name: "Ideation",
        tasks: [
          { key: "research", name: "Market research", offset: 0, duration: 10 },
          {
            key: "concepts",
            name: "Concept development",
            after: ["research"],
            duration: 8,
          },
        ],
      },
      {
        key: "develop",
        name: "Develop",
        tasks: [
          {
            key: "proto",
            name: "Prototype",
            after: ["concepts"],
            duration: 20,
          },
          {
            key: "test-users",
            name: "User testing",
            after: ["proto"],
            duration: 10,
          },
          {
            key: "iterate",
            name: "Iterate",
            after: ["test-users"],
            duration: 12,
          },
        ],
      },
      {
        key: "gtm",
        name: "Go-to-market",
        tasks: [
          {
            key: "marketing",
            name: "Marketing plan",
            after: ["iterate"],
            duration: 10,
          },
          {
            key: "launch",
            name: "Product launch",
            after: ["marketing"],
            duration: 1,
            milestone: true,
          },
        ],
      },
    ],
  },
  {
    id: "manufacturing",
    name: "Manufacturing",
    description: "Tooling → pilot → ramp → quality → production.",
    category: "Manufacturing",
    phases: [
      {
        key: "setup",
        name: "Setup",
        tasks: [
          {
            key: "tooling",
            name: "Tooling & fixtures",
            offset: 0,
            duration: 25,
          },
          { key: "line", name: "Line setup", after: ["tooling"], duration: 12 },
        ],
      },
      {
        key: "pilot",
        name: "Pilot & Ramp",
        tasks: [
          {
            key: "pilot-run",
            name: "Pilot production run",
            after: ["line"],
            duration: 8,
          },
          {
            key: "qc",
            name: "Quality control",
            after: ["pilot-run"],
            duration: 6,
          },
          {
            key: "ramp",
            name: "Production ramp-up",
            after: ["qc"],
            duration: 15,
          },
          {
            key: "sop",
            name: "Start of production",
            after: ["ramp"],
            duration: 1,
            milestone: true,
          },
        ],
      },
    ],
  },
  {
    id: "academic",
    name: "Academic Research",
    description: "Proposal → coursework → experiments → analysis → defense.",
    category: "Academic",
    phases: [
      {
        key: "proposal",
        name: "Proposal",
        tasks: [
          { key: "topic", name: "Topic selection", offset: 0, duration: 14 },
          {
            key: "proposal",
            name: "Research proposal",
            after: ["topic"],
            duration: 21,
          },
          {
            key: "approve",
            name: "Committee approval",
            after: ["proposal"],
            duration: 1,
            milestone: true,
          },
        ],
      },
      {
        key: "work",
        name: "Research",
        tasks: [
          {
            key: "experiments",
            name: "Experiments / fieldwork",
            after: ["approve"],
            duration: 60,
          },
          {
            key: "analysis",
            name: "Analysis",
            after: ["experiments"],
            duration: 30,
          },
        ],
      },
      {
        key: "defense",
        name: "Dissemination",
        tasks: [
          {
            key: "papers",
            name: "Publish papers",
            after: ["analysis"],
            duration: 30,
          },
          {
            key: "defense",
            name: "Defense",
            after: ["papers"],
            duration: 1,
            milestone: true,
          },
        ],
      },
    ],
  },
  {
    id: "thesis",
    name: "Thesis",
    description: "Proposal → chapters → review → defense → submission.",
    category: "Academic",
    phases: [
      {
        key: "start",
        name: "Foundation",
        tasks: [
          { key: "proposal", name: "Thesis proposal", offset: 0, duration: 21 },
          {
            key: "lit",
            name: "Literature review",
            after: ["proposal"],
            duration: 30,
          },
        ],
      },
      {
        key: "writing",
        name: "Writing",
        tasks: [
          {
            key: "ch1",
            name: "Methodology chapter",
            after: ["lit"],
            duration: 21,
          },
          { key: "ch2", name: "Results chapter", after: ["ch1"], duration: 28 },
          {
            key: "ch3",
            name: "Discussion chapter",
            after: ["ch2"],
            duration: 21,
          },
        ],
      },
      {
        key: "final",
        name: "Finalization",
        tasks: [
          {
            key: "review",
            name: "Advisor review",
            after: ["ch3"],
            duration: 14,
          },
          { key: "revise", name: "Revisions", after: ["review"], duration: 14 },
          {
            key: "defend",
            name: "Defense",
            after: ["revise"],
            duration: 1,
            milestone: true,
          },
          {
            key: "submit",
            name: "Final submission",
            after: ["defend"],
            duration: 5,
          },
        ],
      },
    ],
  },
  {
    id: "startup",
    name: "Startup Roadmap",
    description: "Validate → build MVP → launch → grow → raise.",
    category: "Business",
    phases: [
      {
        key: "validate",
        name: "Validation",
        tasks: [
          {
            key: "interviews",
            name: "Customer interviews",
            offset: 0,
            duration: 14,
          },
          {
            key: "mvp-def",
            name: "MVP definition",
            after: ["interviews"],
            duration: 7,
          },
        ],
      },
      {
        key: "build",
        name: "Build & Launch",
        tasks: [
          { key: "mvp", name: "Build MVP", after: ["mvp-def"], duration: 40 },
          {
            key: "beta",
            name: "Beta launch",
            after: ["mvp"],
            duration: 1,
            milestone: true,
          },
          {
            key: "iterate",
            name: "Iterate on feedback",
            after: ["beta"],
            duration: 30,
          },
        ],
      },
      {
        key: "grow",
        name: "Grow & Raise",
        tasks: [
          {
            key: "growth",
            name: "Growth experiments",
            after: ["iterate"],
            duration: 45,
          },
          {
            key: "raise",
            name: "Seed round",
            after: ["growth"],
            duration: 1,
            milestone: true,
          },
        ],
      },
    ],
  },
  {
    id: "personal",
    name: "Personal Planning",
    description: "A simple, friendly plan for personal goals and events.",
    category: "Personal",
    phases: [
      {
        key: "plan",
        name: "Planning",
        tasks: [
          { key: "goals", name: "Set goals", offset: 0, duration: 3 },
          {
            key: "budget",
            name: "Budget & resources",
            after: ["goals"],
            duration: 4,
          },
        ],
      },
      {
        key: "do",
        name: "Execution",
        tasks: [
          { key: "prep", name: "Preparation", after: ["budget"], duration: 10 },
          {
            key: "milestone1",
            name: "Key milestone",
            after: ["prep"],
            duration: 1,
            milestone: true,
          },
          {
            key: "execute",
            name: "Main activity",
            after: ["milestone1"],
            duration: 14,
          },
          {
            key: "review",
            name: "Review & reflect",
            after: ["execute"],
            duration: 3,
          },
        ],
      },
    ],
  },
];

export function getTemplate(id: string): TemplateSpec | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
