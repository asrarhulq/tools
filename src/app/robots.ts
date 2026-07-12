import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

/**
 * robots.txt generated at build time. Explicitly welcomes major AI answer-engine
 * crawlers (GEO) alongside standard search bots, and points them to the sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
      // Named AI crawlers — kept explicit so the intent is documented.
      {
        userAgent: [
          "GPTBot",
          "OAI-SearchBot",
          "ChatGPT-User",
          "Google-Extended",
          "GoogleOther",
          "PerplexityBot",
          "ClaudeBot",
          "Claude-Web",
          "Applebot-Extended",
          "CCBot",
        ],
        allow: "/",
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
