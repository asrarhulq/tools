import { env } from "@/lib/env";

/**
 * Single source of truth for brand, identity, and social entities.
 * Consumed by metadata, JSON-LD, sitemap, robots, and the UI shell so that
 * entity data stays consistent for SEO / AEO / GEO.
 */
export const siteConfig = {
  name: env.NEXT_PUBLIC_SITE_NAME,
  url: env.NEXT_PUBLIC_SITE_URL,
  parentSite: "https://asrarul.com",
  tagline: "A handcrafted collection of interactive tools.",
  description:
    "A premium, ever-growing hub of interactive tools for philosophy, " +
    "engineering, economics, and general use — built for speed and delight.",
  locale: "en_US",
  keywords: [
    "interactive tools",
    "philosophy tools",
    "engineering tools",
    "economics tools",
    "3D model viewer",
    "asrarul",
  ],
  author: {
    name: "Asrarul",
    url: "https://asrarul.com",
  },
  links: {
    site: "https://asrarul.com",
    twitter: "https://twitter.com/asrarul",
    github: "https://github.com/asrarul",
  },
  twitterHandle: "@asrarul",
} as const;

export type SiteConfig = typeof siteConfig;
