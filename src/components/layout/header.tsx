"use client";

import Link from "next/link";
import { Command, Search } from "lucide-react";
import { Container } from "@/components/ui/container";
import { ThemeToggle } from "@/components/theme-toggle";
import { useCommandPalette } from "@/components/command/command-palette-provider";
import { siteConfig } from "@/config/site";

/**
 * Sticky glass header. The search affordance opens the command palette; the
 * ⌘K hint is shown on pointer devices where the shortcut applies.
 */
export function Header() {
  const { open } = useCommandPalette();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)]">
      <div className="glass">
        <Container>
          <div className="flex h-16 items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <span className="flex size-8 items-center justify-center rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-foreground)]">
                <Command className="size-4" aria-hidden="true" />
              </span>
              <span className="font-mono tracking-tight">
                {siteConfig.name}
              </span>
            </Link>

            <button
              type="button"
              onClick={open}
              className="group flex h-10 w-full max-w-sm items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/60 px-4 text-sm text-[var(--color-muted-foreground)] transition-colors hover:border-[var(--color-ring)]"
            >
              <Search className="size-4" aria-hidden="true" />
              <span className="flex-1 text-left">Search tools…</span>
              <kbd className="hidden items-center gap-0.5 rounded border border-[var(--color-border)] bg-[var(--color-muted)] px-1.5 font-mono text-[10px] sm:flex">
                ⌘K
              </kbd>
            </button>

            <ThemeToggle />
          </div>
        </Container>
      </div>
    </header>
  );
}
