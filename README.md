# asrarul.tools

A premium, single-page **tools hub** for [asrarul.com](https://asrarul.com) — a
handcrafted, ever-growing collection of interactive tools across **Philosophy,
Engineering, Economics, and General** use. Built to feel like a polished SaaS
product and to scale cleanly to 100+ tools.

Intended to be deployed at `https://tools.asrarul.com`.

---

## Tech stack

Every dependency is pinned to the latest stable release compatible with the
whole toolchain.

| Area            | Choice                                                             |
| --------------- | ------------------------------------------------------------------ |
| Framework       | **Next.js 16** (App Router, Turbopack, **Cache Components / PPR**) |
| UI runtime      | **React 19**                                                       |
| Language        | **TypeScript 5.9** (strict)                                        |
| Styling         | **Tailwind CSS v4** (CSS-first, no JS config)                      |
| Animation       | **Framer Motion** (`framer-motion`)                                |
| 3D              | **Three.js + React Three Fiber + Drei**                            |
| Search          | **Fuse.js** (fuzzy)                                                |
| Command palette | **cmdk**                                                           |
| Toasts          | **sonner**                                                         |
| Theming         | **next-themes** (system + light/dark)                              |
| Icons           | **lucide-react** (via a serializable icon registry)                |
| Validation      | **Zod 4** (env + input)                                            |
| Tooling         | ESLint 9 (flat), Prettier, Husky, lint-staged, Commitlint          |

> **Version notes.** TypeScript is held at 5.9 and ESLint at 9 because
> `eslint-config-next@16` / `typescript-eslint` don't yet support TS 7 / ESLint 10
> (the current `latest` tags). Pinning to the newest _compatible_ versions keeps
> `lint`, `typecheck`, and `build` all green. Revisit when the plugins catch up.

---

## Getting started

```bash
pnpm install
cp .env.example .env.local   # then edit values
pnpm dev                     # http://localhost:3000
```

### Scripts

| Command                             | Description                                     |
| ----------------------------------- | ----------------------------------------------- |
| `pnpm dev`                          | Dev server (Turbopack)                          |
| `pnpm build`                        | Production build                                |
| `pnpm start`                        | Serve the production build                      |
| `pnpm lint` / `pnpm lint:fix`       | ESLint                                          |
| `pnpm format` / `pnpm format:check` | Prettier                                        |
| `pnpm typecheck`                    | `tsc --noEmit`                                  |
| `pnpm analyze`                      | Build with the bundle analyzer (`ANALYZE=true`) |

---

## Adding or renaming a tool

**Edit one file:** [`src/data/tools.ts`](src/data/tools.ts).

```ts
{
  id: "eng-tool-5",
  slug: "eng-tool-5",
  title: "Gear Designer",
  description: "Design spur gears and export a profile.",
  category: "engineering",
  icon: "calculator",        // a key from src/components/ui/icon.tsx
  difficulty: "intermediate",
  status: "coming-soon",     // "live" | "beta" | "coming-soon"
  addedAt: "2026-07-15",
  keywords: ["gears", "mechanical"],
}
```

That's it. From this single entry the app derives:

- the route `/(category)/(slug)` — **statically prerendered** via
  `generateStaticParams`, so no new page file is needed;
- the card on the homepage grid + Featured / Popular / Recently Added sections;
- fuzzy search + command-palette entries;
- the sitemap entry and per-tool JSON-LD (`SoftwareApplication`) + canonical URL.

New icons: add them to the registry in
[`src/components/ui/icon.tsx`](src/components/ui/icon.tsx) and reference the key.

### Shipping a real tool (replacing "Coming Soon")

1. Build the tool UI, ideally as a feature module under `src/features/<tool>/`.
2. Register its renderer in
   [`src/components/tools/tool-content.tsx`](src/components/tools/tool-content.tsx)
   keyed by tool `id`, and set the tool's `status` to `"beta"` or `"live"`.

Heavy tools are lazy-loaded with `next/dynamic`, so they never affect the bundle
of any other route. The **3D Model Viewer** (`eng-tool-1`) is a working example.

---

## Architecture

```
src/
├── app/                      # Routes (App Router)
│   ├── [category]/[slug]/    # One dynamic route → every tool page (static)
│   ├── api/og/               # Dynamic Open Graph image
│   ├── layout.tsx            # Shell: providers, header, footer, chrome, SEO
│   ├── page.tsx              # Homepage (hero + sections)
│   ├── sitemap.ts robots.ts manifest.ts   # Generated from the registry
│   ├── error.tsx global-error.tsx not-found.tsx
│   └── globals.css           # Tailwind v4 theme tokens + design system
├── components/
│   ├── command/              # ⌘K command palette (+ provider)
│   ├── chrome/               # Scroll progress, back-to-top, toaster
│   ├── home/                 # Hero, category toggle, browse section
│   ├── layout/               # Header, footer
│   ├── providers/            # Theme + palette + toaster composition
│   ├── seo/                  # JSON-LD renderer
│   ├── tools/                # ToolCard, grid, Coming Soon, dispatcher
│   └── ui/                   # Button, Badge, Skeleton, EmptyState, Icon, …
├── config/site.ts            # Brand / identity (single source)
├── data/                     # tools.ts + categories.ts  ← EDIT HERE
├── features/
│   └── model-viewer/         # Three.js / R3F 3D viewer (lazy)
├── hooks/                    # useFavorites, useCategory, useLocalStorage, …
├── lib/                      # tools query layer, search, metadata, json-ld, motion
└── types/                    # Domain types
```

### Rendering strategy

- **Homepage & tool pages**: static shell + **Partial Prerendering** (Cache
  Components). Client interactivity (category toggle, favorites, palette) hydrates
  inside thin client boundaries.
- **`/api/og`, `/sitemap.xml`**: dynamic (request-time).
- Server Components by default; `"use client"` only where interaction requires it.

### Category state (URL + localStorage)

The active category lives in the URL (`?category=`) so links are shareable, with
`localStorage` as the fallback when no param is present. Switching updates both.

### 3D pipeline (STL / OBJ / GLTF / GLB / STEP)

`src/features/model-viewer` renders native formats today (STL, OBJ, GLTF/GLB) via
R3F loaders behind React Suspense. **STEP** is modeled as a conversion format:
the architecture converts STEP → GLTF upstream, then reuses the same renderer —
no viewer changes required. Drag-and-drop a file, or explore the built-in demo
model..

---

## Features

Search (fuzzy) · Command palette (⌘/Ctrl + K) · Favorites (localStorage) ·
Featured / Popular / Recently Added · Random tool · Light/Dark + system with
smooth transitions · Scroll progress · Back-to-top · Toasts · Loading skeletons ·
Empty states · Full keyboard navigation & WCAG 2.2 AA a11y · Animated hero &
micro-interactions.

## SEO / AEO / GEO

Per-route metadata + canonicals · Open Graph + Twitter cards · dynamic OG images ·
XML sitemap & robots (AI crawlers explicitly welcomed) · JSON-LD for
Organization, WebSite, BreadcrumbList, and per-tool SoftwareApplication · semantic
HTML and consistent entity data for AI answer engines.

## Security

Strict CSP and hardened response headers (HSTS, X-Frame-Options, nosniff,
Referrer-Policy, Permissions-Policy) in `next.config.ts` · Zod-validated env and
inputs · `poweredByHeader` disabled.

---

## Deployment

Deploy to any Node host (Vercel recommended). Set the environment variables from
`.env.example` — in production, `NEXT_PUBLIC_SITE_URL=https://tools.asrarul.com`.
.
