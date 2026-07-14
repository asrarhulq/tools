import { Suspense } from "react";
import { Flame, Sparkles } from "lucide-react";
import { buildMetadata } from "@/lib/metadata";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbSchema } from "@/lib/json-ld";
import { Hero } from "@/components/home/hero";
import { BrowseByCategory } from "@/components/home/browse-by-category";
import { Section } from "@/components/ui/section";
import { ToolShowcase } from "@/components/tools/tool-showcase";
import { ToolLeaderboard } from "@/components/tools/tool-leaderboard";
import {
  allTools,
  featuredTools,
  getToolCountByCategory,
  popularTools,
} from "@/lib/tools";

export const metadata = buildMetadata({ path: "/" });

// The Featured showcase shows exactly three, led by the Human Biomechanics Lab
// (which carries the live 3D running-figure preview in the lead tile).
const BIOMECHANICS_ID = "general-tool-6";
const featuredThree = [
  ...featuredTools.filter((t) => t.id === BIOMECHANICS_ID),
  ...featuredTools.filter((t) => t.id !== BIOMECHANICS_ID),
].slice(0, 3);

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
        <ToolShowcase tools={featuredThree} />
      </Section>

      <Section
        id="popular"
        eyebrow="Leaderboard"
        title="Popular"
        description="Ranked by what people are reaching for most right now."
        icon={<Flame />}
      >
        <ToolLeaderboard tools={popularTools} />
      </Section>
    </>
  );
}
