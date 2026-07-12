import { Container } from "@/components/ui/container";
import { categories } from "@/data/categories";
import { siteConfig } from "@/config/site";

export function Footer() {
  const year = 2026; // Static: avoids a dynamic Date() during prerender.

  return (
    <footer className="mt-24 border-t border-[var(--color-border)] py-12">
      <Container>
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xs space-y-2">
            <p className="font-mono font-semibold">{siteConfig.name}</p>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              {siteConfig.description}
            </p>
          </div>

          <nav aria-label="Categories">
            <ul className="grid grid-cols-2 gap-x-10 gap-y-2 sm:grid-cols-4">
              {categories.map((category) => (
                <li key={category.id}>
                  <a
                    href={`/?category=${category.id}`}
                    className="text-sm text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)]"
                  >
                    {category.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-2 border-t border-[var(--color-border)] pt-6 text-sm text-[var(--color-muted-foreground)] sm:flex-row sm:items-center">
          <p>
            &copy; {year} {siteConfig.name}. A part of{" "}
            <a
              href={siteConfig.parentSite}
              className="underline underline-offset-4 hover:text-[var(--color-foreground)]"
            >
              asrarul.com
            </a>
            .
          </p>
          <p>Built with Next.js, React, and Three.js.</p>
        </div>
      </Container>
    </footer>
  );
}
