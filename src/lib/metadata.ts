import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { absoluteUrl } from "@/lib/utils";

interface BuildMetadataOptions {
  title?: string;
  description?: string;
  /** Path relative to the site root, e.g. `/about`. Used for canonical + OG. */
  path?: string;
  /** Absolute or root-relative OG image path. Defaults to the dynamic OG route. */
  image?: string;
  /** Set true on pages that must not be indexed (e.g. thank-you pages). */
  noIndex?: boolean;
}

/**
 * Central metadata factory. Every route calls this so titles, canonicals,
 * Open Graph, and Twitter cards stay consistent — the backbone of SEO + GEO
 * (consistent metadata makes the site legible to AI answer engines).
 */
export function buildMetadata({
  title,
  description = siteConfig.description,
  path = "/",
  image,
  noIndex = false,
}: BuildMetadataOptions = {}): Metadata {
  const url = absoluteUrl(path);
  const ogImage = image
    ? absoluteUrl(image)
    : absoluteUrl(
        `/api/og?title=${encodeURIComponent(title ?? siteConfig.name)}`,
      );

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: siteConfig.locale,
      url,
      siteName: siteConfig.name,
      title: title ?? siteConfig.name,
      description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title ?? siteConfig.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: siteConfig.twitterHandle,
      creator: siteConfig.twitterHandle,
      title: title ?? siteConfig.name,
      description,
      images: [ogImage],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
  };
}
