import type { Metadata, Viewport } from "next";
import { fontMono, fontSans } from "@/lib/fonts";
import { buildMetadata } from "@/lib/metadata";
import { siteConfig } from "@/config/site";
import { organizationSchema, websiteSchema } from "@/lib/json-ld";
import { JsonLd } from "@/components/seo/json-ld";
import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ScrollProgress } from "@/components/chrome/scroll-progress";
import { BackToTop } from "@/components/chrome/back-to-top";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  ...buildMetadata(),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s — ${siteConfig.name}`,
  },
  keywords: [...siteConfig.keywords],
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.author.name, url: siteConfig.author.url }],
  creator: siteConfig.author.name,
  publisher: siteConfig.name,
  formatDetection: { email: false, address: false, telephone: false },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0f" },
  ],
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fontSans.variable} ${fontMono.variable}`}
    >
      <body className="flex min-h-dvh flex-col">
        <JsonLd data={[organizationSchema(), websiteSchema()]} />

        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[80] focus:rounded-md focus:bg-[var(--color-primary)] focus:px-4 focus:py-2 focus:text-[var(--color-primary-foreground)]"
        >
          Skip to main content
        </a>

        <Providers>
          <ScrollProgress />
          <Header />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <Footer />
          <BackToTop />
        </Providers>
      </body>
    </html>
  );
}
