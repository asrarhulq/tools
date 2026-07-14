import { Container } from "./container";
import { cn } from "@/lib/utils";

interface SectionProps {
  id?: string;
  title: string;
  description?: string;
  eyebrow?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Consistent section scaffold in the instrument language: a small accented
 * eyebrow index sits above the heading, with the icon rendered as a quiet
 * plate rather than an inline glyph. Heading row + content, wrapped in a
 * Container.
 */
export function Section({
  id,
  title,
  description,
  eyebrow,
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
          <div className="space-y-2.5">
            {eyebrow ? (
              <p className="microlabel flex items-center gap-2 text-[var(--color-primary)]">
                <span className="inline-block h-px w-6 bg-[var(--color-primary)]" />
                {eyebrow}
              </p>
            ) : null}
            <h2
              id={headingId}
              className="flex items-center gap-2.5 font-semibold tracking-tight"
              style={{ fontSize: "var(--text-h2)" }}
            >
              {icon ? (
                <span className="flex size-8 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-primary)] [&_svg]:size-4">
                  {icon}
                </span>
              ) : null}
              {title}
            </h2>
            {description ? (
              <p className="max-w-xl text-[var(--color-muted-foreground)]">
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
