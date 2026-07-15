import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  // Pin the workspace root — this repo lives beside unrelated lockfiles in the
  // parent directory, which would otherwise make Turbopack infer the wrong root.
  turbopack: {
    root: import.meta.dirname,
  },

  // Fail-fast in CI: surface type issues rather than shipping them.
  // (Next 16 no longer runs ESLint during `next build`; lint via `pnpm lint`.)
  typescript: {
    ignoreBuildErrors: false,
  },

  // typedRoutes is intentionally off: every route here is generated from the
  // tool registry (dynamic strings), so literal-route typing adds casts without
  // real safety. Route correctness is guaranteed by generateStaticParams.
  experimental: {
    typedEnv: true,
    // Tree-shake large icon/util libraries so only used symbols ship.
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },

  // Cache Components = Partial Prerendering + `use cache` model (Next.js 16).
  // A static shell is prerendered and streamed; dynamic holes fill in via Suspense.
  cacheComponents: true,

  images: {
    // Serve modern formats first; browsers fall back automatically.
    formats: ["image/avif", "image/webp"],
    // Long-lived cache for optimized images at the CDN/browser layer.
    minimumCacheTTL: 31536000,
  },

  // Trim the `x-powered-by: Next.js` fingerprint.
  poweredByHeader: false,
  // Emit gzip/br-friendly output and consistent trailing-slash behaviour.
  compress: true,
  reactStrictMode: true,

  async headers() {
    const isDev = process.env.NODE_ENV !== "production";

    // Content-Security-Policy. `unsafe-eval` is only needed by the dev bundler.
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline' blob:${isDev ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      // api.web3forms.com receives the "Suggest a tool" form submissions.
      "connect-src 'self' blob: data: https://api.web3forms.com",
      // Web Worker for off-main-thread STL analysis (bundled as a blob).
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
