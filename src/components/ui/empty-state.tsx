import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/** Polished empty/zero-results state used by search and filtered lists. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-[var(--radius)] border border-dashed border-[var(--color-border)] px-6 py-16 text-center",
        className,
      )}
    >
      <div className="flex size-14 items-center justify-center rounded-full bg-[var(--color-muted)]">
        <Icon
          className="size-6 text-[var(--color-muted-foreground)]"
          aria-hidden="true"
        />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">{title}</h3>
        {description ? (
          <p className="mx-auto max-w-sm text-sm text-[var(--color-muted-foreground)]">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
