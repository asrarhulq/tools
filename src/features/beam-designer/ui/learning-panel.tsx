"use client";

import { GraduationCap } from "lucide-react";
import { useBeam } from "../state/store";
import { useBeamAnalysis } from "../state/use-analysis";
import { Panel } from "./primitives";
import * as U from "../lib/units";

/**
 * Learning Mode: explains the analysis on the *current* beam — how reactions
 * arise, how shear and moment develop, where and why peak stress occurs, and
 * the Euler-Bernoulli deflection theory — with the governing equations shown
 * beside the live numbers.
 */
export function LearningPanel() {
  const { units } = useBeam();
  const { result } = useBeamAnalysis();

  return (
    <Panel
      title="Learning mode"
      className="mt-3"
      action={<GraduationCap className="size-4 text-[var(--color-primary)]" />}
    >
      <div className="space-y-3 text-xs leading-relaxed text-[var(--color-muted-foreground)]">
        <Block title="How reactions are found">
          The solver assembles a global stiffness matrix from Euler-Bernoulli
          beam elements (2 DOF per node: deflection and slope) and solves{" "}
          <Eq>[K]&#123;u&#125; = &#123;F&#125;</Eq>. Reactions are recovered at
          the restrained supports as{" "}
          <Eq>R = [K]&#123;u&#125; − &#123;F&#125;</Eq>. For a statically
          determinate beam this reduces to the equilibrium equations{" "}
          <Eq>ΣF = 0</Eq>, <Eq>ΣM = 0</Eq>; indeterminate beams (fixed,
          continuous, propped) additionally use member stiffness.
        </Block>
        <Block title="Shear and moment">
          Shear is the running sum of transverse forces: <Eq>V(x) = dM/dx</Eq>.
          It steps at point loads and slopes under distributed loads. The
          bending moment is the integral of shear:{" "}
          <Eq>M(x) = ∫V dx = EI·d²v/dx²</Eq>. The moment peaks where shear
          crosses zero —{" "}
          {result.solved
            ? `here the maximum moment is ${U.fmtMoment(result.maxMoment, units)}.`
            : "add a load to see it."}
        </Block>
        <Block title="Where maximum stress occurs">
          Bending stress is <Eq>σ = M·c / I = M / S</Eq>, largest at the section
          with the biggest moment and at the fibre furthest from the neutral
          axis (distance c).
          {result.solved
            ? ` Peak bending stress is ${U.fmtStress(result.maxBendingStress, units)}; combined with shear the peak von Mises is ${U.fmtStress(result.maxVonMises, units)}, giving a factor of safety of ${Number.isFinite(result.factorOfSafety) ? result.factorOfSafety.toFixed(2) : "∞"}.`
            : ""}
        </Block>
        <Block title="Deflection — Euler-Bernoulli theory">
          The elastic curve satisfies <Eq>EI·d⁴v/dx⁴ = w(x)</Eq>. Slope is{" "}
          <Eq>θ = dv/dx</Eq> and deflection is <Eq>v(x)</Eq>. Assumptions: plane
          sections remain plane, small deflections, linear-elastic material, and
          shear deformation is neglected (valid for slender beams).
          {result.solved
            ? ` The peak deflection here is ${U.fmtSmallLength(Math.abs(result.maxDeflection), units, 2)}.`
            : ""}
        </Block>
      </div>
    </Panel>
  );
}

function Block({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-0.5 text-[11px] font-semibold tracking-wide text-[var(--color-primary)] uppercase">
        {title}
      </p>
      <p>{children}</p>
    </div>
  );
}
function Eq({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded bg-[var(--color-muted)] px-1 py-0.5 font-mono text-[11px] text-[var(--color-foreground)]">
      {children}
    </span>
  );
}
