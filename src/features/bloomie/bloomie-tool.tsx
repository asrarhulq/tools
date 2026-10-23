"use client";

import { useState } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { JsonLd } from "@/components/seo/json-ld";
import { softwareApplicationSchema } from "@/lib/json-ld";
import type { ToolWithHref } from "@/types/tool";
import { STORAGE_KEYS } from "./lib/storage-keys";
import { OnboardingFlow } from "./onboarding/onboarding-flow";
import type { Profile } from "./types";
import { Dashboard } from "./ui/dashboard";
import { PasswordGate } from "./ui/password-gate";

const NO_PROFILE: Profile | null = null;

/**
 * Bloomie — a mental wellness, study-organization, and confidence
 * companion. Fully client-side: no Supabase, no accounts, no server at
 * all, matching every other tool in this registry and matching the
 * brief's own stated fallback ("the app must still work in guest mode
 * using local storage") — here, local storage *is* the implementation,
 * not a fallback. See `lib/gate.ts` for the password-gate caveat.
 */
export function BloomieTool({ tool }: { tool: ToolWithHref }) {
  const [unlocked, setUnlocked] = useLocalStorage(STORAGE_KEYS.gate, false);
  const [profile, setProfile] = useLocalStorage<Profile | null>(
    STORAGE_KEYS.profile,
    NO_PROFILE,
  );
  const [editing, setEditing] = useState(false);

  if (!unlocked) {
    return (
      <>
        <JsonLd data={softwareApplicationSchema(tool)} />
        <PasswordGate onUnlock={() => setUnlocked(true)} />
      </>
    );
  }

  if (!profile || editing) {
    return (
      <>
        <JsonLd data={softwareApplicationSchema(tool)} />
        <OnboardingFlow
          initialProfile={profile ?? undefined}
          onComplete={(nextProfile) => {
            setProfile(nextProfile);
            setEditing(false);
          }}
        />
      </>
    );
  }

  return (
    <>
      <JsonLd data={softwareApplicationSchema(tool)} />
      <Dashboard profile={profile} onEditPreferences={() => setEditing(true)} />
    </>
  );
}
