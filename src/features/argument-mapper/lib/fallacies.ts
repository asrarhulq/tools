import type { NodeKind } from "../types";

/**
 * Heuristic fallacy patterns. This is **not** an LLM — it's a curated set of
 * lexical/structural signals that flag *possible* fallacies for the author to
 * consider, each with an explanation, why it weakens reasoning, and a fix. False
 * positives are expected and framed as prompts ("this phrasing can signal…"),
 * never as verdicts. Matching is deliberately conservative (multi-word cues) to
 * keep noise down.
 */

export interface FallacyPattern {
  code: string; // e.g. "fallacy:strawman"
  name: string;
  /** Lowercased phrase cues; any hit flags the node. */
  cues: string[];
  /** Node kinds this pattern is relevant to (empty = any). */
  kinds?: NodeKind[];
  why: string;
  fix: string;
  example: string;
}

export const FALLACY_PATTERNS: FallacyPattern[] = [
  {
    code: "fallacy:ad-hominem",
    name: "Ad hominem",
    cues: [
      "stupid",
      "idiot",
      "moron",
      "you're just",
      "typical of",
      "what would they know",
      "coming from someone",
    ],
    why: "Attacks the person rather than their argument, so it never engages the actual reasoning.",
    fix: "Address the claim itself; the arguer's character is irrelevant to whether it's true.",
    example: "“You can't trust her economics — she failed math.”",
  },
  {
    code: "fallacy:strawman",
    name: "Strawman",
    cues: [
      "so you're saying",
      "basically you want",
      "so you think we should just",
    ],
    why: "Rebuts a distorted, weaker version of the opponent's position instead of the real one.",
    fix: "Restate the opposing view in its strongest form before responding to it.",
    example:
      "“You want some regulation? So you want the government to control everything.”",
  },
  {
    code: "fallacy:slippery-slope",
    name: "Slippery slope",
    cues: [
      "will inevitably lead to",
      "next thing you know",
      "before you know it",
      "opens the door to",
      "where does it end",
      "slippery slope",
    ],
    why: "Assumes one step forces a chain of extreme consequences without showing each link is likely.",
    fix: "Justify each step of the chain, or drop the ones that aren't actually forced.",
    example: "“If we allow this, soon nothing will be off-limits.”",
  },
  {
    code: "fallacy:appeal-emotion",
    name: "Appeal to emotion",
    cues: [
      "think of the children",
      "how would you feel",
      "it's heartbreaking",
      "imagine if it were you",
    ],
    why: "Substitutes an emotional reaction for evidence that the conclusion is true.",
    fix: "Keep the emotional context, but add reasons or evidence that stand on their own.",
    example: "“We must pass this — think of the children.”",
  },
  {
    code: "fallacy:appeal-authority",
    name: "Appeal to authority",
    cues: [
      "experts say",
      "everyone knows",
      "studies show",
      "scientists agree",
      "as the famous",
    ],
    kinds: ["premise", "evidence", "claim"],
    why: "Citing authority isn't proof — the authority can be wrong, biased, or outside their field.",
    fix: "Cite the specific finding and its method, not just that an authority holds the view.",
    example: "“It must be true — a Nobel laureate said so.”",
  },
  {
    code: "fallacy:false-dilemma",
    name: "False dilemma",
    cues: [
      "either we",
      "the only option",
      "there are only two",
      "if not this then",
      "you're either with",
    ],
    why: "Presents two options as exhaustive when other possibilities exist.",
    fix: "List the full range of options; the choice is rarely binary.",
    example: "“Either we do this or the economy collapses.”",
  },
  {
    code: "fallacy:hasty-generalization",
    name: "Hasty generalization",
    cues: [
      "all of them",
      "everyone i know",
      "they always",
      "never once",
      "in my experience everyone",
    ],
    why: "Draws a sweeping rule from too few or unrepresentative cases.",
    fix: "Widen the sample or soften the claim to match the evidence you actually have.",
    example: "“I met two rude tourists, so that whole country is rude.”",
  },
  {
    code: "fallacy:circular",
    name: "Begging the question",
    cues: [
      "because it just is",
      "by definition it's true",
      "it's true because it's true",
    ],
    why: "Assumes the conclusion inside a premise, so the argument proves nothing new.",
    fix: "Support the claim with a reason that doesn't already presuppose it.",
    example: "“It's the best because nothing is better.”",
  },
  {
    code: "fallacy:false-cause",
    name: "False cause",
    cues: [
      "after that",
      "ever since",
      "correlates with",
      "must have caused",
      "right after we",
    ],
    why: "Treats sequence or correlation as proof of causation.",
    fix: "Show a mechanism or rule out confounders before claiming cause.",
    example: "“Sales rose after the ad, so the ad caused it.”",
  },
  {
    code: "fallacy:red-herring",
    name: "Red herring",
    cues: ["but what about", "the real issue is", "let's not forget that"],
    why: "Diverts attention to an unrelated point instead of addressing the argument.",
    fix: "Return to the original claim; handle the tangent separately if it matters.",
    example: "“Why worry about this when other things are worse?”",
  },
  {
    code: "fallacy:appeal-ignorance",
    name: "Appeal to ignorance",
    cues: [
      "no one has proven",
      "can't prove it's false",
      "there's no evidence against",
      "hasn't been disproven",
    ],
    why: "Treats absence of disproof as proof (or vice versa).",
    fix: "The burden of proof is on the claim; lack of counter-evidence isn't support.",
    example: "“No one has shown it's false, so it's true.”",
  },
  {
    code: "fallacy:no-true-scotsman",
    name: "No true Scotsman",
    cues: ["no true", "a real one would never", "that doesn't count because"],
    why: "Redefines a category on the fly to dodge a counterexample.",
    fix: "Accept the counterexample or fix the original claim — don't move the definition.",
    example: "“No true fan would ever say that.”",
  },
  {
    code: "fallacy:sunk-cost",
    name: "Sunk cost",
    cues: [
      "we've already invested",
      "too far in to stop",
      "can't waste what we've put in",
    ],
    why: "Justifies continuing by past cost rather than future value.",
    fix: "Decide on expected future outcomes; past spending is already gone.",
    example: "“We've spent so much, we can't quit now.”",
  },
  {
    code: "fallacy:tu-quoque",
    name: "Tu quoque",
    cues: ["you do it too", "look who's talking", "you're a hypocrite"],
    why: "Deflects a claim by accusing the arguer of inconsistency instead of engaging it.",
    fix: "The arguer's hypocrisy doesn't make their point false — address the point.",
    example: "“You say I should quit, but you smoke too.”",
  },
];

/** Scan a piece of text and return the fallacy patterns it may trigger. */
export function scanText(text: string, kind: NodeKind): FallacyPattern[] {
  const t = ` ${text.toLowerCase()} `;
  return FALLACY_PATTERNS.filter((p) => {
    if (p.kinds && !p.kinds.includes(kind)) return false;
    return p.cues.some((c) => t.includes(c));
  });
}
