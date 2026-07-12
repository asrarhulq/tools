import { cn } from "@/lib/utils";

/** Shimmering placeholder block used while content loads. */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "[animation:var(--animate-shimmer)] rounded-[var(--radius)] bg-[linear-gradient(90deg,var(--color-muted)_25%,var(--color-surface-2)_37%,var(--color-muted)_63%)] bg-[length:200%_100%]",
        className,
      )}
      {...props}
    />
  );
}
