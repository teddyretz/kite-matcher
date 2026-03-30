# Kite Review Pipeline — Context Store + LLM Processing

## Context
We've been manually curating kite reviews — pasting Portrait Kite articles, scraping YouTube channels, and hand-writing structured_reviews. This works but doesn't scale. The insight: we're already using an LLM (Claude) to extract pros/cons/ratings from raw review text. Let's formalize this into a pipeline.

The goal is a system where raw review content (articles, YouTube transcripts, forum posts) gets stored in Supabase, then a CLI script calls the Claude API to generate structured_reviews from that content. The output feeds the existing UI.

## Architecture

```
Raw Sources → Supabase (reviews_raw) → CLI Script (Claude API) → Supabase (structured_reviews) → kites.json / UI
```

## What to Build

### 1. Supabase Tables

**`reviews_raw`** — stores raw review content
- `id` (uuid, primary key)
- `kite_slug` (text, references kite)
- `source_type` (text: 'article', 'youtube_transcript', 'reddit_thread', 'forum_post')
- `source_name` (text: 'Portrait Kite', 'Jason Montreal', 'Kitemana', etc.)
- `source_url` (text)
- `raw_content` (text — the full article/transcript text)
- `created_at` (timestamptz)
- `processed_at` (timestamptz, nullable — when last processed by LLM)

**`structured_reviews`** — LLM-generated review summaries
- `id` (uuid, primary key)
- `kite_slug` (text, unique)
- `rating` (numeric)
- `summary` (text)
- `pros` (jsonb — string array)
- `cons` (jsonb — string array)
- `best_for` (text)
- `not_for` (text)
- `rec_blurb` (text)
- `source_ids` (jsonb — array of reviews_raw IDs used)
- `source_names` (jsonb — array of source names)
- `generated_at` (timestamptz)
- `model_used` (text — e.g. 'claude-sonnet-4-6')

### 2. CLI Script: `scripts/process-reviews.ts`

Run with: `npx tsx scripts/process-reviews.ts [--kite slug] [--all]`

What it does:
1. Connects to Supabase
2. Finds kites with unprocessed raw reviews (or a specific kite via --kite flag)
3. For each kite, gathers all raw review content from `reviews_raw`
4. Calls Claude API with a prompt like:
   ```
   You are a kite review expert. Given these raw reviews for the {brand} {model} {year},
   generate a structured review with: rating (1-5), summary (2-3 sentences),
   pros (array), cons (array), best_for, not_for, rec_blurb (one sentence for card display).
   Be honest and specific. Do not sanitize opinions.
   ```
5. Writes the structured_review to Supabase
6. Optionally updates kites.json with `--sync` flag

### 3. CLI Script: `scripts/ingest-review.ts`

Run with: `npx tsx scripts/ingest-review.ts --kite duotone-evo-2025 --source "Portrait Kite" --type article --url https://... --file review.txt`

Or: `npx tsx scripts/ingest-review.ts --kite duotone-evo-2025 --source "Jason Montreal" --type youtube_transcript --video-id abc123`

What it does:
1. For articles: reads text from file or stdin
2. For YouTube: uses yt-dlp to pull transcript automatically
3. Stores the raw content in `reviews_raw` table
4. Marks `processed_at` as null (pending processing)

### 4. Sync Script: `scripts/sync-reviews.ts`

Run with: `npx tsx scripts/sync-reviews.ts`

What it does:
1. Reads all structured_reviews from Supabase
2. Merges them into kites.json (updates the `structured_review` field)
3. Writes updated kites.json

This keeps the static JSON in sync with the database for the Next.js frontend.

## Dependencies to Add

- `@anthropic-ai/sdk` — Claude API client
- `dotenv` — for loading API keys from .env.local
- `tsx` (devDep) — for running TypeScript scripts directly
- `commander` (optional) — for CLI argument parsing

## Files to Create/Modify

| File | Action |
|------|--------|
| `scripts/process-reviews.ts` | Create — LLM processing pipeline |
| `scripts/ingest-review.ts` | Create — raw content ingestion |
| `scripts/sync-reviews.ts` | Create — Supabase → kites.json sync |
| `scripts/setup-tables.sql` | Create — Supabase table creation SQL |
| `lib/supabase.ts` | Modify — add reviews_raw and structured_reviews types |
| `.env.local` | Modify — add ANTHROPIC_API_KEY |
| `package.json` | Modify — add dependencies and script commands |

## Environment Variables Needed

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=... (for server-side writes)
ANTHROPIC_API_KEY=...
```

## Usage Flow

1. Find a good review (Portrait Kite article, YouTube video, Reddit thread)
2. Run `npx tsx scripts/ingest-review.ts --kite north-orbit-2025 --source "Portrait Kite" --type article --url https://...` and paste the content
3. Run `npx tsx scripts/process-reviews.ts --kite north-orbit-2025` to generate structured review via Claude
4. Run `npx tsx scripts/sync-reviews.ts` to update kites.json
5. Commit and push

Or for batch: `npx tsx scripts/process-reviews.ts --all` processes every kite with new raw content.

## Future Expansions (not in v1)

- Scraper that auto-pulls new YouTube transcripts for tracked channels (Jason Montreal, Kitemana, Portrait Kite)
- Reddit scraper for r/kiteboarding threads mentioning specific kites
- Admin web UI (API route) for pasting reviews directly in browser
- Auto-regeneration when new sources are added (webhook from Supabase)
- Comparison reviews: "Kite A vs Kite B" parsed from multi-kite review videos

## Verification

1. Set up Supabase tables using the SQL script
2. Ingest the 4 Portrait Kite articles we already have as test data
3. Run process-reviews on one kite, verify the structured_review output matches quality of our hand-written ones
4. Run sync to update kites.json
5. Verify the UI displays the review correctly on the kite detail page
