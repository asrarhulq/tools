"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { Dialog } from "./dialog";
import { Field, TextInput, TextArea } from "./primitives";
import { Button } from "@/components/ui/button";
import { useGantt } from "../state/store";
import type { ProjectMeta } from "../types";

/** Project setup: identity, schedule window, document control, and logos. */
export function ProjectDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { project, updateMeta } = useGantt();
  const [draft, setDraft] = useState<ProjectMeta>(project.meta);
  const set = <K extends keyof ProjectMeta>(key: K, value: ProjectMeta[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const save = () => {
    updateMeta(draft);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Project settings"
      description="Identity and document control used on exports and the cover page."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>Save</Button>
        </>
      }
    >
      <div className="space-y-5">
        <Field label="Project name">
          <TextInput
            value={draft.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Client">
            <TextInput
              value={draft.client}
              onChange={(e) => set("client", e.target.value)}
            />
          </Field>
          <Field label="Organization">
            <TextInput
              value={draft.organization}
              onChange={(e) => set("organization", e.target.value)}
            />
          </Field>
          <Field label="Project manager">
            <TextInput
              value={draft.projectManager}
              onChange={(e) => set("projectManager", e.target.value)}
            />
          </Field>
          <Field label="Team">
            <TextInput
              value={draft.team}
              onChange={(e) => set("team", e.target.value)}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Start date">
            <TextInput
              type="date"
              value={draft.startDate}
              onChange={(e) => set("startDate", e.target.value)}
            />
          </Field>
          <Field label="End date">
            <TextInput
              type="date"
              value={draft.endDate}
              onChange={(e) => set("endDate", e.target.value)}
            />
          </Field>
          <Field label="Version">
            <TextInput
              value={draft.version}
              onChange={(e) => set("version", e.target.value)}
            />
          </Field>
          <Field label="Revision">
            <TextInput
              value={draft.revision}
              onChange={(e) => set("revision", e.target.value)}
            />
          </Field>
        </div>

        <Field label="Document number">
          <TextInput
            value={draft.documentNumber}
            onChange={(e) => set("documentNumber", e.target.value)}
            placeholder="e.g. DOC-2026-0413"
          />
        </Field>

        <Field label="Description">
          <TextArea
            rows={3}
            value={draft.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <LogoField
            label="Project logo"
            value={draft.projectLogo}
            onChange={(v) => set("projectLogo", v)}
          />
          <LogoField
            label="Organization logo"
            value={draft.organizationLogo}
            onChange={(v) => set("organizationLogo", v)}
          />
        </div>
      </div>
    </Dialog>
  );
}

function LogoField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <Field label={label}>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => onChange(reader.result as string);
          reader.readAsDataURL(file);
        }}
      />
      {value ? (
        <div className="relative flex h-24 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt={label}
            className="max-h-full max-w-full object-contain"
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white"
            aria-label="Remove logo"
          >
            <X className="size-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="flex h-24 w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-[var(--color-border)] text-xs text-[var(--color-muted-foreground)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
        >
          <ImagePlus className="size-5" />
          Upload
        </button>
      )}
    </Field>
  );
}
