"use client";

import { GraduationCap } from "lucide-react";
import { useTruss } from "../state/store";
import { useAnalysis } from "../state/use-analysis";
import { Panel } from "./primitives";
import * as U from "../lib/units";

/**
 * Learning Mode: explains what the analysis is doing on the *current* model —
 * the governing equations, why members are in tension vs compression, and a
 * worked step-through referencing the actual selected/critical member.
 */
export function LearningPanel() {
  const { truss, units, selectedMember } = useTruss();
  const { result } = useAnalysis();

  // Pick the member to narrate: the selected one, else the most-loaded.
  const focus =
    (selectedMember &&
      result.members.find((m) => m.memberId === selectedMember)) ||
    [...result.members].sort(
      (a, b) => Math.abs(b.axialForce) - Math.abs(a.axialForce),
    )[0];
  const member = focus
    ? truss.members.find((m) => m.id === focus.memberId)
    : undefined;

  return (
    <Panel
      title="Learning mode"
      className="mt-3"
      action={<GraduationCap className="size-4 text-[var(--color-primary)]" />}
    >
      <div className="space-y-3 text-xs leading-relaxed text-[var(--color-muted-foreground)]">
        <Block title="How this is solved — the stiffness method">
          Every joint has two degrees of freedom (movement in x and y). Each
          member is a spring with axial stiffness <Eq>k = EA / L</Eq>. We
          assemble all members into a global stiffness matrix <Eq>[K]</Eq>, then
          solve <Eq>[K]&#123;u&#125; = &#123;F&#125;</Eq> for the joint
          displacements <Eq>&#123;u&#125;</Eq> under the applied loads{" "}
          <Eq>&#123;F&#125;</Eq>. Reactions and member forces follow directly.
        </Block>

        <Block title="Determinacy">
          Counting rule <Eq>m + r − 2j</Eq> (members + reaction components −
          2×joints):{" "}
          {result.determinacy === 0
            ? "= 0, so this truss is statically determinate — equilibrium alone fixes every force."
            : result.determinacy > 0
              ? `= +${result.determinacy}, so it is statically indeterminate; the stiffness method still solves it using member stiffnesses.`
              : "< 0, meaning too few members/supports — it is a mechanism and cannot stand."}
        </Block>

        <Block title="Tension vs compression">
          A positive axial force stretches a member (tension, shown blue); a
          negative one shortens it (compression, shown red). Compression members
          can also fail by{" "}
          <Term title="Sudden sideways bending of a slender compression member below its yield stress.">
            buckling
          </Term>
          , so we also check the Euler load <Eq>P_cr = π²EI / L²</Eq>.
        </Block>

        {member && focus ? (
          <Block title={`Worked example — member ${focus.memberId}`}>
            Length <Eq>L = {U.fmtLength(focus.length, units)}</Eq>. Under the
            current loads it carries{" "}
            <Eq>N = {U.fmtForce(Math.abs(focus.axialForce), units)}</Eq>{" "}
            {focus.state === "tension"
              ? "in tension"
              : focus.state === "compression"
                ? "in compression"
                : "(no force)"}
            .
            {focus.state !== "zero" ? (
              <>
                {" "}
                The stress is{" "}
                <Eq>σ = N/A = {U.fmtStress(Math.abs(focus.stress), units)}</Eq>,
                giving a factor of safety{" "}
                <Eq>
                  FoS = σ_yield / |σ| ={" "}
                  {Number.isFinite(focus.factorOfSafety)
                    ? focus.factorOfSafety.toFixed(2)
                    : "∞"}
                </Eq>
                {Number.isFinite(focus.factorOfSafety) &&
                focus.factorOfSafety < 1
                  ? " — below 1, so this member would yield. Increase its area or use a stronger material."
                  : "."}
              </>
            ) : null}
          </Block>
        ) : null}
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

function Term({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <span
      title={title}
      className="cursor-help underline decoration-dotted underline-offset-2"
    >
      {children}
    </span>
  );
}
