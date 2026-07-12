import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { siteConfig } from "@/config/site";

const SIZE = { width: 1200, height: 630 };

/**
 * Dynamic Open Graph image generator. `/api/og?title=...` renders a branded
 * social card at request time so every page can have a tailored preview
 * without shipping a static asset per page.
 */
export function GET(request: NextRequest) {
  const title =
    request.nextUrl.searchParams.get("title")?.slice(0, 120) ?? siteConfig.name;

  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)",
        color: "#ffffff",
        padding: "80px",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", fontSize: 32, opacity: 0.7 }}>
        {siteConfig.name}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 72,
          fontWeight: 700,
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
        }}
      >
        {title}
      </div>
      <div style={{ display: "flex", fontSize: 28, opacity: 0.7 }}>
        {siteConfig.url.replace(/^https?:\/\//, "")}
      </div>
    </div>,
    SIZE,
  );
}
