import type { Diagnostic, Truss } from "../types";

/**
 * Pre-solve model validation with plain-English engineering explanations rather
 * than generic errors. Catches the mistakes beginners actually make: too few
 * reactions, no supports, floating/disconnected nodes, duplicate members,
 * coincident nodes, and static (in)determinacy. Stability of the assembled
 * structure is confirmed by the solver (singular stiffness ⇒ mechanism); this
 * layer explains *why* before the numbers even run.
 */
export function validateTruss(truss: Truss): Diagnostic[] {
  const d: Diagnostic[] = [];
  const { nodes, members, loads } = truss;

  if (nodes.length === 0) {
    d.push({
      severity: "info",
      code: "empty",
      message: "Add joints to begin building your truss.",
    });
    return d;
  }

  // Reaction count vs. equilibrium equations (2 per joint).
  let reactions = 0;
  let hasPin = false;
  for (const n of nodes) {
    if (n.support === "pin" || n.support === "fixed") {
      reactions += 2;
      hasPin = true;
    } else if (n.support === "roller-x" || n.support === "roller-y") {
      reactions += 1;
    }
  }

  if (reactions === 0 && members.length > 0) {
    d.push({
      severity: "error",
      code: "no-supports",
      message:
        "No supports defined. A truss must be restrained against translation — " +
        "add at least a pin plus a roller (3 reaction components total) or the " +
        "whole structure will fly off under any load.",
    });
  } else if (reactions > 0 && reactions < 3 && members.length > 0) {
    d.push({
      severity: "error",
      code: "under-constrained",
      message:
        `Only ${reactions} reaction component${reactions === 1 ? "" : "s"} provided. ` +
        "A planar structure needs at least 3 to be stable against x-translation, " +
        "y-translation, and rotation. Add another support.",
    });
  }
  if (reactions >= 2 && !hasPin && members.length > 0) {
    d.push({
      severity: "warning",
      code: "no-pin",
      message:
        "Only rollers are defined. Without a pin the truss can slide — add a pin " +
        "to anchor it horizontally.",
    });
  }

  // Static determinacy: m + r − 2j.
  const det = members.length + reactions - 2 * nodes.length;
  if (members.length > 0) {
    if (det < 0) {
      d.push({
        severity: "error",
        code: "unstable-count",
        message:
          `The structure is statically unstable (m + r − 2j = ${det} < 0): there are ` +
          "too few members/supports to prevent it from moving as a mechanism. " +
          "Add members (often a diagonal) or supports.",
      });
    } else if (det === 0) {
      d.push({
        severity: "info",
        code: "determinate",
        message:
          "Statically determinate (m + r − 2j = 0). Member forces follow from " +
          "equilibrium alone — the ideal, efficient case.",
      });
    } else {
      d.push({
        severity: "info",
        code: "indeterminate",
        message:
          `Statically indeterminate to degree ${det}. There are redundant members; ` +
          "the stiffness method still solves it exactly by using compatibility.",
      });
    }
  }

  // Disconnected / floating nodes.
  const used = new Set<string>();
  for (const m of members) {
    used.add(m.from);
    used.add(m.to);
  }
  const floating = nodes.filter((n) => !used.has(n.id) && n.support === "none");
  if (floating.length > 0) {
    d.push({
      severity: "warning",
      code: "floating-nodes",
      message:
        `${floating.length} joint${floating.length === 1 ? " is" : "s are"} not connected to ` +
        "any member and unsupported — they contribute nothing and make the model unstable.",
      refs: floating.map((n) => n.id),
    });
  }

  // Loads on floating nodes.
  for (const l of loads) {
    const node = nodes.find((n) => n.id === l.nodeId);
    if (node && !used.has(node.id)) {
      d.push({
        severity: "error",
        code: "load-on-floating",
        message: `A load is applied at joint ${node.id}, which no member connects to — the load has nowhere to go.`,
        refs: [node.id],
      });
    }
  }

  // Duplicate / coincident.
  const seen = new Set<string>();
  for (const m of members) {
    const key = [m.from, m.to].sort().join("~");
    if (seen.has(key)) {
      d.push({
        severity: "warning",
        code: "duplicate-member",
        message: `Duplicate member between the same two joints (${m.from}–${m.to}).`,
        refs: [m.id],
      });
    }
    seen.add(key);
    if (m.from === m.to) {
      d.push({
        severity: "error",
        code: "self-member",
        message: `Member ${m.id} connects a joint to itself.`,
        refs: [m.id],
      });
    }
  }
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (
        Math.hypot(nodes[i]!.x - nodes[j]!.x, nodes[i]!.y - nodes[j]!.y) < 1e-6
      ) {
        d.push({
          severity: "warning",
          code: "coincident-nodes",
          message: `Joints ${nodes[i]!.id} and ${nodes[j]!.id} are at the same location.`,
          refs: [nodes[i]!.id, nodes[j]!.id],
        });
      }
    }
  }

  if (loads.length === 0 && members.length > 0 && reactions >= 3) {
    d.push({
      severity: "info",
      code: "no-loads",
      message:
        "No loads applied yet — add a force to see member forces and deflection.",
    });
  }

  return d;
}
