import { Skeleton } from "@/components/ui/skeleton";

/** Loading placeholder matching the ToolCard catalog-row layout. */
export function ToolCardSkeleton() {
  return (
    <div className="flex items-center gap-4 px-3 py-3.5">
      <Skeleton className="h-3 w-6" />
      <Skeleton className="size-9 rounded-md" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-2/3" />
      </div>
      <Skeleton className="hidden h-3 w-16 sm:block" />
      <Skeleton className="size-8 rounded-full" />
    </div>
  );
}
