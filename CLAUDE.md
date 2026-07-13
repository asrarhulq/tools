# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`asrarul.tools` — a single-page **tools hub** (Next.js 16 App Router, React 19, TS 5.9 strict, Tailwind v4) that scales to 100+ interactive tools across four categories: philosophy, engineering, economics, general. Deployed at `https://tools.asrarul.com`.

## Commands

Package manager is **pnpm** (v10, enforced via `packageManager`). Node >= 20.9.

| Command                             | Purpose                                                                                 |
| ----------------------------------- | --------------------------------------------------------------------------------------- |
| `pnpm dev`                          | Dev server (Turbopack) on `http://localhost:3000`                                       |
| `pnpm build`                        | Production build                                                                        |
| `pnpm lint` / `pnpm lint:fix`       | ESLint 9 (flat config). Next 16 does **not** lint during `build` — run this separately. |
| `pnpm typecheck`                    | `tsc --noEmit`. `build` **does** fail on type errors (`ignoreBuildErrors: false`).      |
| `pnpm format` / `pnpm format:check` | Prettier                                                                                |
| `pnpm analyze`                      | Build with `@next/bundle-analyzer` (`ANALYZE=true`)                                     |

There is no test runner configured — do not assume `pnpm test` exists. Verify changes with `pnpm typecheck`, `pnpm lint`, and `pnpm build`.

**Git hooks (Husky + lint-staged + Commitlint):** commits run `lint-staged` (ESLint --fix + Prettier on staged files) via `pre-commit`, and commit messages must follow **Conventional Commits** (`commit-msg` hook). A commit will fail the hook if lint/format fails or the message is malformed.

**Env:** copy `.env.example` → `.env.local`. Both `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_SITE_NAME` are **required and Zod-validated at startup** in `src/lib/env.ts` — a missing/invalid value throws immediately. Import `env` from `@/lib/env`, never read `process.env` directly. Path alias `@/*` → `src/*`.

## Architecture

### Registry-driven: everything derives from one file

A tool is a data entry in **`src/data/tools.ts`** (shape in `src/types/tool.ts`, categories in `src/data/categories.ts`). Adding/editing that one entry automatically produces: the `/[category]/[slug]` route (statically prerendered via `generateStaticParams` — **no new page file**), homepage cards + Featured/Popular/Recently-Added sections, fuzzy search + command-palette entries, sitemap + per-tool JSON-LD + canonical URL.

**All tool access goes through the query layer in `src/lib/tools.ts`** (`allTools`, `getTool`, `getToolsByCategory`, `toolHref`, section selectors). Derived data is computed once there — don't re-derive hrefs or filter `tools` directly elsewhere. Note `pickRandomTool(seed)` is deliberately seed-based (no `Math.random()` at import) to stay deterministic across server/client.

Icons are a **serializable registry** in `src/components/ui/icon.tsx` — a tool's `icon` field is a string key into it, not a component (so tool data stays plain data). Add new icons there before referencing them.

### Shipping a real tool vs. "Coming Soon"

`src/components/tools/tool-content.tsx` is the dispatcher: it maps tool `id` → a `next/dynamic` lazy renderer. A tool with no entry (or `status: "coming-soon"`) renders the shared `ComingSoon` state. To ship a tool: build it under `src/features/<tool>/`, register its renderer here keyed by id, and set the tool's `status` to `"beta"`/`"live"`. Heavy renderers are lazy-loaded so they never touch any other route's bundle.

> The one live example is **`eng-tool-1` → `src/features/stl-analyzer/`** (an STL/3D model analyzer). The README calls this `features/model-viewer/` — that path is stale; the real feature module is `stl-analyzer`.

### `src/features/stl-analyzer/` (the reference feature)

Self-contained module pulling in three/r3f/drei/jsPDF (all code-split behind the dynamic import). Structure worth knowing:

- **`lib/`** — pure analysis: `stl-parser`, `geometry`, `fea` (finite-element), `stability`, `printing`, `materials`, `units`, `vec`.
- **`lib/analysis.worker.ts` + `lib/worker-protocol.ts`** — heavy geometry analysis runs off the main thread in a **Web Worker**. The protocol module has no worker import so both sides type against it; mesh `Float32Array` positions are **transferred** (not copied) for zero-cost hand-off. (This is why `next.config.ts` CSP allows `worker-src 'self' blob:`.)
- **`state/analyzer-context.tsx`** — `"use client"` React context holding all interactive state (model, material, forces, supports, print settings, viewer options).
- **`viewer/`** — R3F canvas/scene/overlays; **`ui/`** — the analysis panels; **`report/`** — jsPDF export.

### Rendering & config

- **Cache Components / Partial Prerendering is on** (`cacheComponents: true` in `next.config.ts`, Next 16). A static shell prerenders and streams; dynamic holes fill via Suspense. Server Components by default — add `"use client"` only at the smallest boundary that needs interaction.
- `/api/og` (dynamic OG image) and `sitemap.ts`/`robots.ts`/`manifest.ts` are generated from the registry.
- `next.config.ts` also pins the Turbopack `root` (unrelated lockfiles live in the parent dir and would otherwise confuse root inference), sets a **strict CSP + hardened headers**, and `optimizePackageImports` for `lucide-react`/`framer-motion`. `typedRoutes` is intentionally off (routes are dynamic strings from the registry).
- **Category state** lives in the URL (`?category=`) for shareable links, with `localStorage` fallback; switching updates both. Favorites are keyed by tool `id` in `localStorage`.

### Brand/identity

`src/config/site.ts` (`siteConfig`) is the single source for brand name, URLs, and social entities — consumed by metadata, JSON-LD, sitemap, robots, and the UI shell to keep entity data consistent for SEO/AEO/GEO. Change identity there, not inline.

## Conventions

- **Version pinning is deliberate.** Deps are pinned exact (no `^`). TS is held at 5.9 and ESLint at 9 because `eslint-config-next@16`/`typescript-eslint` don't yet support TS 7 / ESLint 10. Don't bump these to `latest` casually — it breaks `lint`/`typecheck`/`build`.
- Match the existing file idiom: heavy per-module JSDoc block comments explaining _why_, `readonly`/`as const` domain data, functional selectors over ad-hoc filtering.
