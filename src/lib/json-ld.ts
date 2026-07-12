import type {
  Organization,
  WebSite,
  BreadcrumbList,
  FAQPage,
  Person,
  SoftwareApplication,
  WithContext,
} from "schema-dts";
import { siteConfig } from "@/config/site";
import { absoluteUrl } from "@/lib/utils";
import type { ToolWithHref } from "@/types/tool";

/**
 * Structured-data (JSON-LD) builders. These power rich results, featured
 * snippets, and — crucially for AEO/GEO — let AI answer engines resolve the
 * site's entities and their relationships (knowledge-graph legibility).
 *
 * Types come from `schema-dts` for compile-time correctness against schema.org.
 */

export function organizationSchema(): WithContext<Organization> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": absoluteUrl("/#organization"),
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    logo: absoluteUrl("/icon.svg"),
    sameAs: [siteConfig.links.twitter, siteConfig.links.github],
  };
}

export function websiteSchema(): WithContext<WebSite> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": absoluteUrl("/#website"),
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    publisher: { "@id": absoluteUrl("/#organization") },
    inLanguage: "en-US",
  };
}

export function personSchema(): WithContext<Person> {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: siteConfig.author.name,
    url: siteConfig.author.url,
    worksFor: { "@id": absoluteUrl("/#organization") },
  };
}

export function breadcrumbSchema(
  items: ReadonlyArray<{ name: string; path: string }>,
): WithContext<BreadcrumbList> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function faqSchema(
  faqs: ReadonlyArray<{ question: string; answer: string }>,
): WithContext<FAQPage> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/** Per-tool schema — helps search + AI engines understand each tool as an app. */
export function softwareApplicationSchema(
  tool: ToolWithHref,
): WithContext<SoftwareApplication> {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.title,
    description: tool.longDescription ?? tool.description,
    url: absoluteUrl(tool.href),
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    isPartOf: { "@id": absoluteUrl("/#website") },
  };
}
