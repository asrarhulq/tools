import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--color-muted)] text-[var(--color-muted-foreground)]",
        outline: "border-[var(--color-border)] text-[var(--color-foreground)]",
        primary:
          "border-transparent bg-[var(--color-primary)]/12 text-[var(--color-primary)]",
        beginner:
          "border-transparent bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
        intermediate:
          "border-transparent bg-amber-500/12 text-amber-600 dark:text-amber-400",
        advanced:
          "border-transparent bg-rose-500/12 text-rose-600 dark:text-rose-400",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
