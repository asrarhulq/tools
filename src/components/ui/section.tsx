import { Container } from "./container";
import { cn } from "@/lib/utils";

interface SectionProps {
  id?: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/** Consistent section scaffold: heading row + content, wrapped in a Container. */
export function Section({
  id,
  title,
  description,
  icon,
  action,
  children,
  className,
}: SectionProps) {
  const headingId = id ? `${id}-heading` : undefined;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn("py-12 sm:py-16", className)}
    >
      <Container>
        <div className="mb-8 flex items-end justify-between gap-4">
          <div className="space-y-1">
            <h2
              id={headingId}
              className="flex items-center gap-2 font-semibold tracking-tight"
              style={{ fontSize: "var(--text-h2)" }}
            >
              {icon}
              {title}
            </h2>
            {description ? (
              <p className="text-[var(--color-muted-foreground)]">
                {description}
              </p>
            ) : null}
          </div>
          {action}
        </div>
        {children}
      </Container>
    </section>
  );
}
