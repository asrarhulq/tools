import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import type { ToolWithHref } from "@/types/tool";
import { getCategory } from "@/data/categories";

/** Accessible breadcrumb trail: Home › Category › Tool. */
export function ToolBreadcrumb({ tool }: { tool: ToolWithHref }) {
  const category = getCategory(tool.category);

  return (
    <nav aria-label="Breadcrumb" className="mb-8">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-[var(--color-muted-foreground)]">
        <li>
          <Link
            href="/"
            className="flex items-center gap-1 transition-colors hover:text-[var(--color-foreground)]"
          >
            <Home className="size-3.5" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">Home</span>
          </Link>
        </li>
        <ChevronRight className="size-3.5" aria-hidden="true" />
        <li>
          <Link
            href={`/?category=${category.id}`}
            className="transition-colors hover:text-[var(--color-foreground)]"
          >
            {category.label}
          </Link>
        </li>
        <ChevronRight className="size-3.5" aria-hidden="true" />
        <li aria-current="page" className="text-[var(--color-foreground)]">
          {tool.title}
        </li>
      </ol>
    </nav>
  );
}
