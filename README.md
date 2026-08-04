# FindMyKite

FindMyKite is a kite buying advisor at **[findmykite.com](https://findmykite.com)**. It helps kitesurfers find the right kite through a style-matching quiz, filtered browsing, side-by-side comparison, and structured review data — without sponsored rankings or affiliate-first recommendations.

---

## What it does

Kitesurfers tell FindMyKite how they ride and what they want in a kite. The app scores every kite in the catalog against those preferences and returns a ranked, filterable set of matches.

Core features:
- **Style quiz** — set riding style and kite character with sliders; top matches update in real time
- **Kite catalog** — browse all active kites with filters for brand, skill level, bar type, construction, year, and budget
- **Comparison flow** — compare up to 3 kites side by side across specs and review summaries
- **Kite detail pages** — full specs, style placement, structured reviews from YouTube transcripts, and buy links
- **User reviews** — optional crowd-sourced reviews via Supabase

---

## Matching model

Each kite has spectrum scores from 0–100:
- `style_spectrum`: Foil → Surf → Freestyle → Freeride → Big Air
- `shape_spectrum`: Low aspect / C-kite → High aspect / Bow kite
- `wave_spectrum`: secondary wave-oriented score

The live advisor combines style, kite character, wave priority, handling, wind,
budget, construction, and rider level. Rider level changes the weighting:

- **Beginner:** control, relaunch, depower, and usable wind range receive more weight
- **Intermediate:** progression and versatility supplement the selected preferences
- **Advanced:** the rider's performance sliders drive the result directly

Exact scores determine rank, while the UI rounds the displayed fit to the nearest
five points to avoid implying laboratory precision. Review ratings and their source
counts are displayed separately and never affect the fit score. The initial results
shortlist is brand-diverse; “show all” restores the complete score-ordered ranking.

The legacy two-slider score remains available for browse and comparison tools:
`100 - (0.6 × style_diff + 0.4 × shape_diff)`.

---

## Data model

- **Source of truth:** one JSON file per kite in `data/kites/`
- **Validation:** `lib/schema.ts` uses Zod; `npm run validate-kites` runs before build
- **Catalog size:** 79 kites across 13 brands
- **Review enrichment:** selected kites include structured reviews synthesized from YouTube transcripts

This project no longer uses Payload CMS or Neon as the primary catalog store. The app builds directly from the repo’s per-kite JSON files.

---

## Tech stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Data:** local per-kite JSON files
- **Review synthesis:** Anthropic SDK
- **User reviews:** Supabase
- **Deploy:** Vercel

---

## Project structure

```text
app/
  (frontend)/
    page.tsx          # homepage + hero matcher
    kites/            # catalog browse flow
    kite/[slug]/      # kite detail pages
    results/          # quiz results
    compare/          # side-by-side comparison
    about/
    api/kites/        # lightweight JSON endpoint for client components
components/           # shared UI
lib/
  schema.ts          # Zod schema for kite files
  types.ts           # TS types
  matcher.ts         # scoring logic
  getKites.ts        # disk-backed catalog loading
  useFilters.ts      # URL-driven filter state
data/
  kites/             # one JSON file per kite
scripts/
  validate-kites.ts  # schema validation
  process-reviews.ts # transcript → structured review synthesis
public/kites/        # kite images
```

---

## Local development

### Prerequisites
- Node.js 18+

### Setup

```bash
git clone https://github.com/teddyretz/kite-matcher.git
cd kite-matcher
npm install
```

Optional `.env.local`:

```env
# Optional canonical URL override (production default is https://findmykite.com)
NEXT_PUBLIC_SITE_URL=

# Optional — enables user review submission
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Required only for review-synthesis scripts
ANTHROPIC_API_KEY=
```

Run locally:

```bash
npm run dev
npm run validate-kites
npm run build
```

---

## Deployment

```bash
vercel --prod --yes
```

Optional env vars in Vercel:
- `NEXT_PUBLIC_SITE_URL` — override canonical base URL for staging environments
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

If you run review-processing scripts in deployment or CI, also set:
- `ANTHROPIC_API_KEY`

---

## Philosophy

FindMyKite exists because kite buying advice is usually biased, generic, or brand-driven. The goal is to give riders honest, style-aware recommendations grounded in specs and real review material.
