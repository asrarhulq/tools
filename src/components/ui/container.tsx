import { cn } from "@/lib/utils";

/**
 * Responsive max-width wrapper with fluid horizontal padding.
 * Mobile-first: full-bleed on small screens, capped and centered above.
 */
export function Container({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8", className)}
      {...props}
    />
  );
}
