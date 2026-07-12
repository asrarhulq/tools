import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CATEGORY_IDS, type CategoryId } from "@/types/tool";
import { allTools, getTool } from "@/lib/tools";
import { buildMetadata } from "@/lib/metadata";
import { Container } from "@/components/ui/container";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbSchema, softwareApplicationSchema } from "@/lib/json-ld";
import { getCategory } from "@/data/categories";
import { ToolBreadcrumb } from "@/components/tools/tool-breadcrumb";
import { ToolContent } from "@/components/tools/tool-content";

interface ToolPageParams {
  category: string;
  slug: string;
}

/**
 * Statically prerender every tool route from the registry. Adding a tool to
 * `data/tools.ts` automatically produces its `/⟨category⟩/⟨slug⟩` page — no new
 * files required. This is what lets the project scale to 100+ tools cleanly.
 */
export function generateStaticParams(): ToolPageParams[] {
  return allTools.map((tool) => ({
    category: tool.category,
    slug: tool.slug,
  }));
}

function isCategory(value: string): value is CategoryId {
  return (CATEGORY_IDS as readonly string[]).includes(value);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<ToolPageParams>;
}): Promise<Metadata> {
  const { category, slug } = await params;
  if (!isCategory(category)) return {};
  const tool = getTool(category, slug);
  if (!tool) return {};

  return buildMetadata({
    title: tool.title,
    description: tool.longDescription ?? tool.description,
    path: tool.href,
  });
}

export default async function ToolPage({
  params,
}: {
  params: Promise<ToolPageParams>;
}) {
  const { category, slug } = await params;
  if (!isCategory(category)) notFound();
  const tool = getTool(category, slug);
  if (!tool) notFound();

  const categoryMeta = getCategory(tool.category);

  return (
    <>
      <JsonLd
        data={[
          softwareApplicationSchema(tool),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: categoryMeta.label, path: `/?category=${categoryMeta.id}` },
            { name: tool.title, path: tool.href },
          ]),
        ]}
      />
      <Container className="py-12 sm:py-16">
        <ToolBreadcrumb tool={tool} />
        <ToolContent tool={tool} />
      </Container>
    </>
  );
}
