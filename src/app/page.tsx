import { Suspense } from "react";
import { Clock, Flame, Sparkles } from "lucide-react";
import { buildMetadata } from "@/lib/metadata";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbSchema } from "@/lib/json-ld";
import { Hero } from "@/components/home/hero";
import { BrowseByCategory } from "@/components/home/browse-by-category";
import { Section } from "@/components/ui/section";
import { ToolGrid } from "@/components/tools/tool-grid";
import {
  allTools,
  featuredTools,
  getToolCountByCategory,
  popularTools,
  recentTools,
} from "@/lib/tools";

export const metadata = buildMetadata({ path: "/" });

export default function HomePage() {
  const counts = getToolCountByCategory();

  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }])} />

      <Hero toolCount={allTools.length} />

      {/* useCategory reads useSearchParams → must sit under Suspense. */}
      <Suspense fallback={<div className="min-h-[60vh]" />}>
        <BrowseByCategory counts={counts} />
      </Suspense>

      <Section
        id="featured"
        eyebrow="Selected"
        title="Featured"
        description="Hand-picked tools worth your attention."
        icon={<Sparkles />}
      >
        <ToolGrid tools={featuredTools} />
      </Section>

      <Section
        id="popular"
        eyebrow="Most used"
        title="Popular"
        description="What people are reaching for most right now."
        icon={<Flame />}
      >
        <ToolGrid tools={popularTools} />
      </Section>

      <Section
        id="recent"
        eyebrow="Latest"
        title="Recently added"
        description="The newest additions to the collection."
        icon={<Clock />}
      >
        <ToolGrid tools={recentTools.slice(0, 8)} />
      </Section>
    </>
  );
}
