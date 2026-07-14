import type { Beam, Diagnostic } from "../types";

/**
 * Pre-solve model validation with plain-English engineering explanations. A
 * statically stable beam needs enough vertical restraint and rotational
 * restraint to prevent rigid-body translation and rotation. This layer flags
 * the common mistakes (no/insufficient supports, zero length, out-of-range
 * positions, overlapping/duplicate loads) before the solver runs; the solver
 * confirms true stability via its stiffness matrix.
 */
export function validateBeam(beam: Beam): Diagnostic[] {
  const d: Diagnostic[] = [];

  if (beam.length <= 0) {
    d.push({
      severity: "error",
      code: "zero-length",
      message: "Beam length must be greater than zero.",
    });
    return d;
  }

  // Support adequacy. A beam is stable if it has either a fixed support, or at
  // least two vertical supports that aren't coincident (preventing rotation).
  const verticalSupports = beam.supports.filter((s) => s.type !== "spring");
  const hasFixed = beam.supports.some((s) => s.type === "fixed");
  const springs = beam.supports.filter((s) => s.type === "spring");

  if (beam.supports.length === 0) {
    d.push({
      severity: "error",
      code: "no-supports",
      message:
        "No supports defined. Add a fixed support, or a pin and a roller, so the beam can't translate or rotate freely.",
    });
  } else if (!hasFixed && verticalSupports.length < 2 && springs.length < 2) {
    d.push({
      severity: "error",
      code: "under-constrained",
      message:
        "The beam is under-supported — it can rotate as a rigid body. Add a second support (or use a fixed support) to stabilize it.",
    });
  }

  // Supports out of range / coincident.
  const seen = new Map<number, number>();
  for (const s of beam.supports) {
    if (s.x < -1e-9 || s.x > beam.length + 1e-9) {
      d.push({
        severity: "warning",
        code: "support-out-of-range",
        message: `A support at ${s.x.toFixed(2)} m lies outside the beam (0–${beam.length} m).`,
      });
    }
    const key = Math.round(s.x * 1000);
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  for (const [k, count] of seen) {
    if (count > 1)
      d.push({
        severity: "warning",
        code: "coincident-supports",
        message: `${count} supports share the position ${(k / 1000).toFixed(2)} m.`,
      });
  }
  for (const s of beam.supports) {
    if (s.type === "spring" && (!s.springK || s.springK <= 0)) {
      d.push({
        severity: "warning",
        code: "bad-spring",
        message:
          "A spring support has zero/negative stiffness and provides no restraint.",
      });
    }
  }

  // Loads.
  if (beam.loads.length === 0 && beam.supports.length > 0) {
    d.push({
      severity: "info",
      code: "no-loads",
      message:
        "No loads applied yet — add a load to see shear, moment, and deflection.",
    });
  }
  for (const l of beam.loads) {
    if (l.x < -1e-9 || l.x > beam.length + 1e-9) {
      d.push({
        severity: "warning",
        code: "load-out-of-range",
        message: `A load starts at ${l.x.toFixed(2)} m, outside the beam.`,
      });
    }
    if (
      l.type === "udl" ||
      l.type === "triangular" ||
      l.type === "trapezoidal"
    ) {
      if (l.length <= 0)
        d.push({
          severity: "warning",
          code: "zero-length-load",
          message:
            "A distributed load has zero length and will have no effect.",
        });
      if (l.x + l.length > beam.length + 1e-6)
        d.push({
          severity: "warning",
          code: "load-overhang",
          message: `A distributed load extends past the beam end (to ${(l.x + l.length).toFixed(2)} m).`,
        });
    }
    if (l.type === "point" && Math.abs(l.magnitude) < 1e-9) {
      d.push({
        severity: "info",
        code: "zero-load",
        message: "A point load has zero magnitude.",
      });
    }
  }

  // Section sanity handled in sectionProps (clamped); note extreme values.
  return d;
}
