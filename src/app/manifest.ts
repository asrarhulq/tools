import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

/** PWA-ready web app manifest (installability + Best Practices score). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: siteConfig.name,
    description: siteConfig.description,
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    icons: [
      // Served by app/icon.svg — scalable, covers all sizes.
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
