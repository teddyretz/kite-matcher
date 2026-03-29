# FindMyKite — Claude Code Handoff

## What This Is
A kite buying advisor at **findmykite.com**. Helps kitesurfers find the right kite through a style quiz, filtered browsing, and AI-powered review data. Built with Next.js 15 (App Router), Tailwind CSS v3, TypeScript, Payload CMS 3.x, Neon Postgres.

**Repo:** `teddyretz/kite-matcher`
**Deploy:** `vercel --prod --yes` from repo root (auto-aliases to findmykite.com)

---

## Stack (as of 2026-03-29)

| Layer | Tech |
|---|---|
| Framework | Next.js 15.4.11 |
| React | 19 |
| Styling | Tailwind CSS 3.4.x |
| CMS | Payload CMS 3.x (`/admin`) |
| Database | Neon serverless Postgres |
| User reviews | Supabase (separate, existing `reviews` table) |
| Deploy | Vercel |

---

## Architecture

### Route Groups
The app is split into two Next.js route groups so Payload admin can have its own server layout:

```
app/
  layout.tsx              ← minimal server root (html/body/font only)
  (frontend)/             ← all public pages + 'use client' nav layout
    layout.tsx            ← nav, CompareProvider, CompareDrawer
    page.tsx              ← homepage
    kites/page.tsx        ← browse catalog (server wrapper → BrowseContent client)
    kite/[slug]/page.tsx  ← detail (server wrapper → KiteDetailClient)
    results/page.tsx      ← quiz results (server wrapper → ResultsContent client)
    compare/page.tsx      ← comparison (server wrapper → CompareContent client)
    about/page.tsx
    api/kites/route.ts    ← REST endpoint (used by CompareDrawer via fetch)
  (payload)/
    admin/[[...segments]] ← Payload CMS admin panel
    layout.tsx            ← Payload server layout
```

### Data Flow
- **Server pages** fetch from Payload Local API (`lib/getKites.ts`) and pass kites as props to client children
- **Client components** (CompareDrawer, CompareContext) fetch from `/api/kites` via `useEffect`
- `lib/matcher.ts` — pure functions on `Kite[]`, unchanged, no Payload dependency

### Key Files
- `payload.config.ts` — Payload config, uses `DATABASE_URI` env var (falls back to `POSTGRES_URL` then individual `POSTGRES_*` vars)
- `collections/Kites.ts` — full Kites collection matching `lib/types.ts` Kite interface
- `lib/getKites.ts` — `getAllKites()`, `getKiteBySlug()`, `getActiveKites()`
- `lib/types.ts` — canonical `Kite` interface — keep in sync with Kites collection
- `scripts/seed-kites.ts` — seeds all 79 kites from `data/kites.json` into Neon
- `scripts/patch-payload-loadenv.js` — postinstall patch for Payload/Next.js 15 `@next/env` ESM interop issue (auto-runs on `npm install`)

---

## Data (`data/kites.json`)
- **79 kites** across 13 brands: Duotone (13), Core (12), Slingshot (8), North (7), Ozone (6), Flysurfer (6), Cabrinha (5), Reedin (5), F-One (4), Eleveight (4), Airush (4), Harlem (3), Naish (2)
- All 79 are seeded into Neon — **Payload is the source of truth going forward**
- `data/kites.json` is kept as a backup/seed source only

### Key Data Rules (do not break these)
- `style_spectrum`: Foil(0–20), Surf(21–40), Freestyle(41–60), Freeride(61–80), Big Air(81–100)
- `wave_spectrum`: 0–100 secondary score for wave riding
- `reviews`: always an array. Two entry types:
  - `{ source: "youtube", reviewer, channel, video_id, excerpt, verdict, full_transcript }`
  - `{ source: "aggregate_placeholder", data: { aggregate_score, review_count, sources[] } }`
- `structured_review`: optional — `{ rating, summary, pros[], cons[], best_for, not_for, rec_blurb, sources[] }`
- All Duotone kites: `bar_type: "high-y"`
- Aluula kites: `aluula: true` (Duotone D/LAB, Core Pace Pro/Air Pro, Eleveight XS Pro, Slingshot Code NXT)
- Brainchild kites: Harlem (all 3), Reedin HyperModel 2025+2026, F-One Bandit Brainchild 2026
- `full_transcript` is NEVER rendered in UI — only `excerpt` and `verdict`
- `turning_speed` valid values: `slow | medium | medium-fast | fast | very-fast`

---

## Environment Variables

### Required
| Var | Where | Purpose |
|---|---|---|
| `DATABASE_URI` | Vercel + `.env.local` | Neon Postgres connection string |
| `PAYLOAD_SECRET` | Vercel + `.env.local` | Payload auth secret (32+ chars) |

### Optional
| Var | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Enables user review submission |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Enables user review submission |

**Note:** Vercel has `POSTGRES_URL` and individual `POSTGRES_*` vars from a Supabase integration, but those were empty/unusable. `DATABASE_URI` pointing to Neon is the working DB connection.

---

## Local Dev

```bash
npm install          # also runs postinstall patch for Payload/Next.js interop
npm run dev          # starts on port 3000 (or 3001 per .claude/launch.json)
npm run seed         # reseed all 79 kites from kites.json into Neon
```

Admin panel: `http://localhost:3000/admin`

---

## Known Issues / Quirks

- **`@next/env` ESM interop** — Payload's `loadEnv.js` crashes when run outside Next.js (e.g. seed script) due to ESM default vs named export mismatch with Next.js 15's `@next/env`. Fixed via `scripts/patch-payload-loadenv.js` which runs as `postinstall`. If you see `TypeError: Cannot destructure property 'loadEnvConfig'`, run `node scripts/patch-payload-loadenv.js`.
- **Seed script env loading** — uses `dotenv-cli` to pre-inject `.env.local` before Payload initializes: `dotenv -e .env.local -- npx tsx scripts/seed-kites.ts`
- **`kiteData as unknown as Kite[]`** — intentional cast pattern used in 4 places, do not revert
- **`reviews` is `ReviewEntry[]`** — check `r.source === 'youtube'` before accessing YouTube-specific fields

---

## What Needs Building (Priority Order)

### Priority 1 — Expand structured_review to all 30 kites with transcripts
Only a handful have it. Generate for remaining kites using the `full_transcript` in each kite's youtube review entry. Use Claude API (claude-sonnet-4-6).

Schema:
```json
{
  "rating": 4.2,
  "summary": "2-3 sentences about the kite's character",
  "pros": ["specific strength"],
  "cons": ["honest weakness — do not sanitize"],
  "best_for": "one sentence — who should buy this",
  "not_for": "one sentence — who should skip this",
  "rec_blurb": "one punchy sentence for card display",
  "sources": ["Jason Montreal", "Kitemana"]
}
```

### Priority 2 — Display structured_review on detail page (`/kite/[slug]`)
Show prominently: star rating, summary, pros/cons columns, best_for/not_for, sources.
`rec_blurb` should appear on KiteCard below the kite name.

### Priority 3 — Review pipeline scripts (`scripts/`)
- `ingest-review.ts` — ingest raw content (YouTube VTT via yt-dlp, articles)
- `process-reviews.ts` — call Claude API (claude-sonnet-4-6) to generate structured reviews
- `sync-reviews.ts` — merge structured reviews back into Payload via Local API

### Priority 4 — Mobile polish
Still check: quiz flow at 375px, KiteCard layout, compare drawer.

### Priority 5 — `/ask` RAG endpoint (future)
Vector store of transcripts + text query UI.

---

## Review Coverage (kites with YouTube transcripts)
**Jason Montreal** (@jasonofmontreal): duotone-rebel-dlab-2026, duotone-evo-dlab-2026, duotone-rebel-sls-2026, duotone-evo-sls-2026, f-one-bandit-brainchild-2026, f-one-trigger-2026, ozone-edge-vt-2026, harlem-peak-2025, harlem-thrive-2025, reedin-hypermodel-2026, cabrinha-moto-x-2025, north-orbit-2026, core-pace-pro-2026, slingshot-code-nxt-2026, flysurfer-era-2025

**Kitemana** (@Kitemana): core-xr-pro-2-2026, core-pace-2026, naish-pivot-2025, naish-pivot-nvision-2026, reedin-supermodel-2026, reedin-mastermodel-2026, eleveight-rs-v10-2026, north-orbit-2026 (2nd), duotone-rebel-dlab-2026 (2nd), duotone-evo-dlab-2026 (2nd), harlem-peak-2025 (2nd), flysurfer-era-2025 (2nd)

**Our Kite Life** (@OurKiteLife): flysurfer-soul-3-2026, flysurfer-sonic-v4-2025, flysurfer-stoke-3-2025

---

## Do Not
- Render `full_transcript` in UI
- Revert `as unknown as Kite[]` casts
- Change `reviews` from array to object
- Remove `aluula`, `brainchild`, `teds_pick` fields
- Deploy without `npm run build` passing first
- Edit kite data in `data/kites.json` — Payload/Neon is now source of truth
