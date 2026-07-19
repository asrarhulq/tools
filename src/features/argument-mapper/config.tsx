import {
  Anchor,
  ArrowRight,
  BookOpen,
  Eye,
  FileText,
  FlaskConical,
  Gavel,
  GitBranch,
  HelpCircle,
  Lightbulb,
  Link2,
  type LucideIcon,
  Microscope,
  Puzzle,
  Quote,
  Scale,
  ScrollText,
  Shield,
  Sparkles,
  Swords,
  Target,
  TestTube,
} from "lucide-react";
import type { EdgeKind, EvidenceQuality, NodeKind } from "./types";

/**
 * The visual + semantic taxonomy. Each node kind and edge kind has a stable
 * identity — icon, accent (OKLCH, theme-agnostic so it reads in light + dark),
 * a display label, and a one-line hint. The engine and analytics also read the
 * `polarity`/`role` metadata here, so this file is the single source of truth
 * for what every kind *means*, not just how it looks.
 */

export interface NodeMeta {
  kind: NodeKind;
  label: string;
  short: string; // compact label for palette chips
  hint: string;
  icon: LucideIcon;
  /** OKLCH accent used for border, icon, and heatmap-independent tint. */
  accent: string;
  /** Structural role used by the logic engine. */
  role: "claim" | "support" | "challenge" | "context";
}

export const NODE_META: Record<NodeKind, NodeMeta> = {
  claim: {
    kind: "claim",
    label: "Claim",
    short: "Claim",
    hint: "An assertion put forward as true.",
    icon: Sparkles,
    accent: "oklch(0.62 0.15 250)",
    role: "claim",
  },
  premise: {
    kind: "premise",
    label: "Premise",
    short: "Premise",
    hint: "A reason offered in support of a conclusion.",
    icon: ScrollText,
    accent: "oklch(0.64 0.13 230)",
    role: "support",
  },
  intermediate: {
    kind: "intermediate",
    label: "Intermediate conclusion",
    short: "Interim",
    hint: "A conclusion that becomes a premise for another.",
    icon: GitBranch,
    accent: "oklch(0.66 0.12 210)",
    role: "claim",
  },
  conclusion: {
    kind: "conclusion",
    label: "Final conclusion",
    short: "Conclusion",
    hint: "What the argument ultimately aims to establish.",
    icon: Target,
    accent: "oklch(0.6 0.17 265)",
    role: "claim",
  },
  assumption: {
    kind: "assumption",
    label: "Assumption",
    short: "Assumption",
    hint: "Something taken for granted, often unstated.",
    icon: Anchor,
    accent: "oklch(0.7 0.1 90)",
    role: "context",
  },
  definition: {
    kind: "definition",
    label: "Definition",
    short: "Definition",
    hint: "Fixes the meaning of a key term.",
    icon: BookOpen,
    accent: "oklch(0.68 0.08 200)",
    role: "context",
  },
  evidence: {
    kind: "evidence",
    label: "Evidence",
    short: "Evidence",
    hint: "Data or observation grounding a claim.",
    icon: Microscope,
    accent: "oklch(0.66 0.15 160)",
    role: "support",
  },
  objection: {
    kind: "objection",
    label: "Objection",
    short: "Objection",
    hint: "A reason to doubt a claim.",
    icon: Swords,
    accent: "oklch(0.63 0.19 25)",
    role: "challenge",
  },
  rebuttal: {
    kind: "rebuttal",
    label: "Rebuttal",
    short: "Rebuttal",
    hint: "A reply that answers an objection.",
    icon: Shield,
    accent: "oklch(0.66 0.14 145)",
    role: "support",
  },
  counterexample: {
    kind: "counterexample",
    label: "Counterexample",
    short: "Counter",
    hint: "A case that breaks a general claim.",
    icon: Puzzle,
    accent: "oklch(0.64 0.18 40)",
    role: "challenge",
  },
  analogy: {
    kind: "analogy",
    label: "Analogy",
    short: "Analogy",
    hint: "Reasoning from a parallel case.",
    icon: Link2,
    accent: "oklch(0.68 0.11 300)",
    role: "support",
  },
  thoughtExperiment: {
    kind: "thoughtExperiment",
    label: "Thought experiment",
    short: "Thought exp.",
    hint: "An imagined scenario that tests intuitions.",
    icon: FlaskConical,
    accent: "oklch(0.66 0.13 320)",
    role: "context",
  },
  question: {
    kind: "question",
    label: "Question",
    short: "Question",
    hint: "An open question the argument must address.",
    icon: HelpCircle,
    accent: "oklch(0.7 0.1 110)",
    role: "context",
  },
  principle: {
    kind: "principle",
    label: "Principle",
    short: "Principle",
    hint: "A general rule the argument relies on.",
    icon: Gavel,
    accent: "oklch(0.64 0.12 280)",
    role: "support",
  },
  example: {
    kind: "example",
    label: "Example",
    short: "Example",
    hint: "An instance that illustrates a point.",
    icon: Quote,
    accent: "oklch(0.7 0.09 180)",
    role: "support",
  },
  hypothesis: {
    kind: "hypothesis",
    label: "Hypothesis",
    short: "Hypothesis",
    hint: "A proposed explanation to be tested.",
    icon: TestTube,
    accent: "oklch(0.66 0.14 190)",
    role: "claim",
  },
  observation: {
    kind: "observation",
    label: "Observation",
    short: "Observation",
    hint: "Something noted directly from the world.",
    icon: Eye,
    accent: "oklch(0.68 0.1 170)",
    role: "support",
  },
};

export const NODE_KINDS = Object.keys(NODE_META) as NodeKind[];

export interface EdgeMeta {
  kind: EdgeKind;
  label: string; // default relationship word shown on the edge
  hint: string;
  /** OKLCH stroke color. */
  color: string;
  /** +1 strengthens the target, -1 challenges it, 0 neutral/structural. */
  polarity: 1 | -1 | 0;
  /** Dashed stroke for softer/structural relations. */
  dashed?: boolean;
}

export const EDGE_META: Record<EdgeKind, EdgeMeta> = {
  supports: {
    kind: "supports",
    label: "supports",
    hint: "Gives a reason to accept the target.",
    color: "oklch(0.65 0.15 150)",
    polarity: 1,
  },
  attacks: {
    kind: "attacks",
    label: "attacks",
    hint: "Gives a reason to reject the target.",
    color: "oklch(0.62 0.2 25)",
    polarity: -1,
  },
  dependsOn: {
    kind: "dependsOn",
    label: "depends on",
    hint: "The source needs the target to hold.",
    color: "oklch(0.6 0.02 250)",
    polarity: 0,
    dashed: true,
  },
  contradicts: {
    kind: "contradicts",
    label: "contradicts",
    hint: "The two cannot both be true.",
    color: "oklch(0.6 0.22 15)",
    polarity: -1,
    dashed: true,
  },
  defines: {
    kind: "defines",
    label: "defines",
    hint: "Fixes the meaning used by the target.",
    color: "oklch(0.66 0.08 200)",
    polarity: 0,
    dashed: true,
  },
  qualifies: {
    kind: "qualifies",
    label: "qualifies",
    hint: "Limits or conditions the target.",
    color: "oklch(0.7 0.1 90)",
    polarity: 0,
    dashed: true,
  },
  illustrates: {
    kind: "illustrates",
    label: "illustrates",
    hint: "Gives a concrete instance of the target.",
    color: "oklch(0.7 0.09 180)",
    polarity: 1,
  },
  causes: {
    kind: "causes",
    label: "causes",
    hint: "The source brings about the target.",
    color: "oklch(0.64 0.14 40)",
    polarity: 0,
  },
  explains: {
    kind: "explains",
    label: "explains",
    hint: "The source accounts for the target.",
    color: "oklch(0.66 0.12 210)",
    polarity: 1,
  },
  analogousTo: {
    kind: "analogousTo",
    label: "analogous to",
    hint: "Parallel structure to the target.",
    color: "oklch(0.68 0.11 300)",
    polarity: 0,
    dashed: true,
  },
};

export const EDGE_KINDS = Object.keys(EDGE_META) as EdgeKind[];

export const EVIDENCE_META: Record<
  EvidenceQuality,
  { label: string; weight: number }
> = {
  empirical: { label: "Empirical", weight: 0.95 },
  experimental: { label: "Experimental", weight: 0.95 },
  statistical: { label: "Statistical", weight: 0.85 },
  mathematical: { label: "Mathematical", weight: 1.0 },
  historical: { label: "Historical", weight: 0.7 },
  expert: { label: "Expert opinion", weight: 0.65 },
  observational: { label: "Observational", weight: 0.7 },
  simulation: { label: "Simulation", weight: 0.6 },
  testimonial: { label: "Testimonial", weight: 0.45 },
  intuition: { label: "Intuition", weight: 0.35 },
  anecdotal: { label: "Anecdotal", weight: 0.25 },
};

export const EVIDENCE_KINDS = Object.keys(EVIDENCE_META) as EvidenceQuality[];

export { ArrowRight, FileText, Lightbulb, Scale };
