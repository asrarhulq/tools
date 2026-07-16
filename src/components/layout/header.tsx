"use client";

import { useState } from "react";
import Link from "next/link";
import { Lightbulb, Search } from "lucide-react";
import { Container } from "@/components/ui/container";
import { ThemeToggle } from "@/components/theme-toggle";
import { useCommandPalette } from "@/components/command/command-palette-provider";
import { SuggestToolDialog } from "./suggest-tool-dialog";
import { siteConfig } from "@/config/site";

/**
 * Sticky glass header. The brand lockup pairs the "AH" monogram (theme-swapped
 * via CSS so there's no hydration flash: the light-gray PNG shows on dark, the
 * dark SVG shows on light) with a fancy "Tools by Asrar ul Haq" wordmark whose
 * name links out to asrarul.com. The search affordance opens the command
 * palette; the ⌘K hint shows on pointer devices where the shortcut applies.
 */
export function Header() {
  const { open } = useCommandPalette();
  const [suggestOpen, setSuggestOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)]">
      <div className="glass">
        <Container>
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Brand lockup: monogram → wordmark */}
            <div className="flex shrink-0 items-center gap-3">
              <Link
                href="/"
                aria-label={`${siteConfig.name} — home`}
                className="group flex items-center"
              >
                {/* Monogram: dark-theme PNG + light-theme SVG, CSS-swapped.
                    Plain <img> (not next/image) so it needs no build-time file
                    presence and serves the SVG without extra config. */}
                <span className="relative flex h-9 items-center transition-transform group-hover:scale-105">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/logo-dark.png"
                    alt=""
                    className="hidden h-9 w-auto object-contain dark:block"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/logo-light.svg"
                    alt=""
                    className="block h-9 w-auto object-contain dark:hidden"
                  />
                </span>
              </Link>

              <span className="hidden items-baseline gap-1.5 sm:flex">
                <span className="font-mono text-xs tracking-widest text-[var(--color-muted-foreground)] uppercase">
                  Tools by
                </span>
                <a
                  href={siteConfig.parentSite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-display bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] bg-clip-text text-base font-semibold tracking-tight text-transparent transition-opacity hover:opacity-80"
                >
                  Asrar ul Haq
                </a>
              </span>
            </div>

            <div className="flex flex-1 items-center justify-end gap-2">
              <button
                type="button"
                onClick={open}
                className="group flex h-10 w-full max-w-sm items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)]/70 px-3.5 text-sm text-[var(--color-muted-foreground)] transition-colors hover:border-[var(--color-primary)]/40"
              >
                <Search className="size-4" aria-hidden="true" />
                <span className="flex-1 text-left">Search tools…</span>
                <kbd className="hidden items-center gap-0.5 rounded border border-[var(--color-border)] bg-[var(--color-muted)] px-1.5 py-0.5 font-mono text-[10px] sm:flex">
                  ⌘K
                </kbd>
              </button>

              {/* Suggest a tool → opens the submission form (Web3Forms). */}
              <button
                type="button"
                onClick={() => setSuggestOpen(true)}
                className="flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 px-3 text-sm font-medium text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/16"
              >
                <Lightbulb className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">Suggest a tool</span>
              </button>
            </div>

            <ThemeToggle />
          </div>
        </Container>
      </div>

      <SuggestToolDialog
        open={suggestOpen}
        onClose={() => setSuggestOpen(false)}
      />
    </header>
  );
}
