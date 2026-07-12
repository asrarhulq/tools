"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { Command } from "cmdk";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, Search, Shuffle, SunMoon } from "lucide-react";
import { useTheme } from "next-themes";
import { allTools, popularTools } from "@/lib/tools";
import { getCategory } from "@/data/categories";
import { searchTools } from "@/lib/search";
import { Icon } from "@/components/ui/icon";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * ⌘K command palette. Fuzzy-searches every tool and exposes quick actions
 * (random tool, theme toggle). Rendered via cmdk's Dialog with a motion
 * overlay + panel. cmdk handles keyboard navigation and a11y roles.
 */
export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [query, setQuery] = useState("");

  const results = query ? searchTools(query) : allTools;

  const go = useCallback(
    (href: string) => {
      onOpenChange(false);
      setQuery("");
      router.push(href);
    },
    [onOpenChange, router],
  );

  const randomTool = useCallback(() => {
    const tool = allTools[Math.floor(Math.random() * allTools.length)]!;
    go(tool.href);
  }, [go]);

  return (
    <AnimatePresence>
      {open ? (
        <Command.Dialog
          open={open}
          onOpenChange={onOpenChange}
          label="Command palette"
          shouldFilter={false}
          className="fixed inset-0 z-[70]"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -8 }}
            transition={{ duration: 0.18 }}
            className="glass fixed top-[15vh] left-1/2 z-[71] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 overflow-hidden rounded-2xl shadow-2xl"
          >
            <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-4">
              <Search
                className="size-4 text-[var(--color-muted-foreground)]"
                aria-hidden="true"
              />
              <Command.Input
                value={query}
                onValueChange={setQuery}
                autoFocus
                placeholder="Search tools or run a command…"
                className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-[var(--color-muted-foreground)]"
              />
            </div>

            <Command.List className="max-h-[50vh] overflow-y-auto p-2">
              <Command.Empty className="px-3 py-8 text-center text-sm text-[var(--color-muted-foreground)]">
                No tools match “{query}”.
              </Command.Empty>

              {!query ? (
                <Command.Group
                  heading="Actions"
                  className="mb-2 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-[var(--color-muted-foreground)]"
                >
                  <PaletteItem
                    icon={<Shuffle className="size-4" />}
                    label="Open a random tool"
                    onSelect={randomTool}
                  />
                  <PaletteItem
                    icon={<SunMoon className="size-4" />}
                    label="Toggle theme"
                    onSelect={() =>
                      setTheme(resolvedTheme === "dark" ? "light" : "dark")
                    }
                  />
                </Command.Group>
              ) : null}

              {!query && popularTools.length ? (
                <Command.Group
                  heading="Popular"
                  className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-[var(--color-muted-foreground)]"
                >
                  {popularTools.map((tool) => (
                    <ToolItem
                      key={tool.id}
                      icon={<Icon name={tool.icon} className="size-4" />}
                      title={tool.title}
                      subtitle={getCategory(tool.category).label}
                      onSelect={() => go(tool.href)}
                    />
                  ))}
                </Command.Group>
              ) : null}

              {query
                ? results.map((tool) => (
                    <ToolItem
                      key={tool.id}
                      icon={<Icon name={tool.icon} className="size-4" />}
                      title={tool.title}
                      subtitle={getCategory(tool.category).label}
                      onSelect={() => go(tool.href)}
                    />
                  ))
                : null}
            </Command.List>

            <div className="flex items-center justify-between border-t border-[var(--color-border)] px-4 py-2 text-[11px] text-[var(--color-muted-foreground)]">
              <span className="flex items-center gap-1">
                <Heart className="size-3" aria-hidden="true" /> Favorites live
                on each card
              </span>
              <span>↑↓ to navigate · ↵ to open · esc to close</span>
            </div>
          </motion.div>
        </Command.Dialog>
      ) : null}
    </AnimatePresence>
  );
}

function PaletteItem({
  icon,
  label,
  onSelect,
}: {
  icon: React.ReactNode;
  label: string;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm data-[selected=true]:bg-[var(--color-muted)]"
    >
      <span className="text-[var(--color-muted-foreground)]">{icon}</span>
      {label}
    </Command.Item>
  );
}

function ToolItem({
  icon,
  title,
  subtitle,
  onSelect,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      value={title}
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm data-[selected=true]:bg-[var(--color-muted)]"
    >
      <span className="text-[var(--color-primary)]">{icon}</span>
      <span className="flex-1">{title}</span>
      <span className="text-xs text-[var(--color-muted-foreground)]">
        {subtitle}
      </span>
    </Command.Item>
  );
}
