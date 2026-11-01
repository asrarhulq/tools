"use client";

import { useState } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { ControlPanel } from "./control-panel";
import { Viewer } from "../viewer/viewer";
import { GATE_STORAGE_KEY } from "../lib/gate";

export const DEFAULT_NAME = "AYA HAMOUCHE";
export const DEFAULT_NUMBER = "10";

/**
 * Top-level layout: the 3D viewport beside a personalization panel. State
 * lives here and flows straight into the viewer as props — the jersey is
 * cheap enough to repaint on every keystroke, so there's no debouncing.
 * The name/number editor is password-gated (`lib/gate.ts`) so this stays a
 * gift for one person instead of a generic jersey customizer — the viewer
 * itself, defaulted to her name, stays visible to anyone.
 */
export function JerseyStudio() {
  const [name, setName] = useState(DEFAULT_NAME);
  const [number, setNumber] = useState(DEFAULT_NUMBER);
  const [autoRotate, setAutoRotate] = useState(true);
  const [unlocked, setUnlocked] = useLocalStorage(GATE_STORAGE_KEY, false);

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="flex-1">
        <Viewer
          name={name || DEFAULT_NAME}
          number={number || DEFAULT_NUMBER}
          autoRotate={autoRotate}
        />
      </div>
      <ControlPanel
        name={name}
        onNameChange={setName}
        number={number}
        onNumberChange={setNumber}
        unlocked={unlocked}
        onUnlock={() => setUnlocked(true)}
        autoRotate={autoRotate}
        onToggleAutoRotate={() => setAutoRotate((v) => !v)}
        onReset={() => {
          setName(DEFAULT_NAME);
          setNumber(DEFAULT_NUMBER);
          setAutoRotate(true);
        }}
      />
    </div>
  );
}
