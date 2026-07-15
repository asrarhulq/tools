"use client";

import Link from "next/link";
import type { CategoryId } from "@/types/tool";

/**
 * A category link that switches the "Browse by category" section **client-side**
 * (no full page reload) and smooth-scrolls to it. The href keeps the URL
 * shareable (`/?category=<id>`); `useCategory` in the browse block reads that
 * query param and re-renders in place. On the homepage we intercept the click
 * to scroll to `#browse` after the query updates; on other routes the link just
 * navigates home with the category preselected.
 */
export function CategoryLink({
  category,
  className,
  children,
}: {
  category: CategoryId;
  className?: string;
  children: React.ReactNode;
}) {
  function onClick() {
    // After the client transition applies the query, bring Browse into view.
    // Deferred so the section is present/updated before scrolling.
    requestAnimationFrame(() => {
      document
        .getElementById("browse")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <Link
      href={`/?category=${category}`}
      scroll={false}
      onClick={onClick}
      className={className}
    >
      {children}
    </Link>
  );
}
