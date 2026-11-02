"use client";

import { useState } from "react";
import { ControlPanel } from "./control-panel";
import { Viewer } from "../viewer/viewer";

export const DEFAULT_NAME = "AYA HAMOUCHE";
export const DEFAULT_NUMBER = "10";

/**
 * Top-level layout: the 3D viewport beside a personalization panel. State
 * lives here and flows straight into the viewer as props — the jersey is
 * cheap enough to repaint on every keystroke, so there's no debouncing.
 * Only rendered once `barca-jersey-tool.tsx` has already confirmed the
 * password gate is unlocked, so nothing here needs its own lock.
 */
export function JerseyStudio() {
  const [name, setName] = useState(DEFAULT_NAME);
  const [number, setNumber] = useState(DEFAULT_NUMBER);
  const [autoRotate, setAutoRotate] = useState(true);

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
