import { Skeleton } from "@/components/ui/skeleton";

/** Loading placeholder matching the ToolCard layout to prevent layout shift. */
export function ToolCardSkeleton() {
  return (
    <div className="flex h-full flex-col gap-4 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <div className="flex items-start justify-between">
        <Skeleton className="size-11 rounded-xl" />
        <Skeleton className="size-8 rounded-full" />
      </div>
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
      <div className="flex gap-1.5">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
    </div>
  );
}
