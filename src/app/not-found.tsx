import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { buildMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Page not found",
  noIndex: true,
});

export default function NotFound() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <p className="font-mono text-6xl font-bold text-[var(--color-primary)]">
        404
      </p>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Page not found</h1>
        <p className="text-[var(--color-muted-foreground)]">
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
      </div>
      <Link
        href="/"
        className="text-[var(--color-primary)] underline underline-offset-4"
      >
        Back to home
      </Link>
    </Container>
  );
}
