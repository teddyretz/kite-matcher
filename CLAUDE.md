# FindMyKite — Claude Code Handoff

## What This Is
A kite buying advisor at **findmykite.com**. Helps kitesurfers find the right kite through a style quiz, filtered browsing, and AI-powered review data. Built with Next.js 14 (App Router), Tailwind CSS, TypeScript, static JSON data.

**Repo:** `teddyretz/kite-matcher`
**Deploy:** `vercel --prod --yes` from repo root (auto-aliases to findmykite.com)

---

## Current State

### Data (`data/kites.json`)
- **79 kites** across 13 brands: Duotone (13), Core (12), Slingshot (8), North (7), Ozone (6), Flysurfer (6), Cabrinha (5), Reedin (5), F-One (4), Eleveight (4), Airush (4), Harlem (3), Naish (2)
- Every kite has: style_spectrum, wave_spectrum, skill_level, specs, summary, best_for, buy_links
- **30 kites** have real YouTube transcript reviews (Jason Montreal, Kitemana, Our Kite Life)
- **4 kites** currently have `structured_review` objects — need to expand to all 30 with transcripts

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

### Pages
- `/` — homepage with StyleMatcher quiz
- `/kites` — catalog with KiteFilters
- `/kite/[slug]` — detail page
- `/compare` — side-by-side comparison
- `/results` — quiz results
- `/about`

### Components
- `KiteCard.tsx` — card with image, badges, rec_blurb, compare button
- `StyleMatcher.tsx` — multi-step style quiz
- `KiteFilters.tsx` — brand/skill/style filters
- `CompareContext.tsx` + `CompareDrawer.tsx` — global compare state
- `SpectrumBar.tsx` — visual spectrum indicator
- `ReviewSources.tsx` — renders review data
- `UserReviews.tsx` — renders YouTube review cards

### TypeScript Notes (`lib/types.ts`)
- Cast pattern: `kiteData as unknown as Kite[]` — used in 4 places, intentional, keep it
- `reviews` is `ReviewEntry[]` union type — check `r.source === 'youtube'` before accessing youtube fields
- `structured_review` is optional (`StructuredReview | undefined`)

### Images (`public/kites/`)
- 79 JPGs compressed to ~50–650KB, named `[kite-id].jpg`
- KiteCard uses Next.js `<Image fill sizes="...">` with `position: relative` on parent div

---

## What Needs Building

### Priority 1 — Expand structured_review to all 30 kites with transcripts
Only 4 have it. Generate for remaining 26 using the `full_transcript` in each kite's youtube review entry.

Schema:
```json
{
  "rating": 4.2,
  "summary": "2-3 sentences about the kite's character",
  "pros": ["specific strength", "..."],
  "cons": ["honest weakness — do not sanitize", "..."],
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
- `ingest-review.ts` — ingest raw content (YouTube VTT via yt-dlp, articles) into Supabase `reviews_raw`
- `process-reviews.ts` — call Claude API (claude-sonnet-4-6) to generate structured reviews
- `sync-reviews.ts` — pull from Supabase `structured_reviews`, merge into `kites.json`
- `migrate-existing.ts` — one-time: seed existing transcripts + structured_reviews into Supabase

Supabase tables needed:
```sql
reviews_raw (id, kite_slug, source_type, source_name, source_url, video_id, raw_content, created_at, processed_at)
structured_reviews (id, kite_slug, rating, summary, pros, cons, best_for, not_for, rec_blurb, source_ids, source_names, generated_at, model_used)
```

### Priority 4 — Mobile polish
Images fixed. Still check: quiz flow at 375px, KiteCard layout, compare drawer.

### Priority 5 — `/ask` RAG endpoint (future)
Not started. Vector store of transcripts via Supabase pgvector + text query UI.

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
