# FindMyKite

A kite buying advisor at **[findmykite.com](https://findmykite.com)**. Helps kitesurfers find the right kite through a style-matching quiz, filtered browsing, and AI-powered review data — with no sponsored content or affiliate links.

---

## What It Does

Kitesurfers tell FindMyKite how they ride and what they want in a kite, and the app scores every kite in the catalog against those preferences. The result is a ranked, filterable list of kites that actually match your style — not just whatever a brand is paying to promote.

**Core features:**
- **Style quiz** — set your riding style (Foiling → Big Air) and kite character (Low Aspect → High Aspect) with sliders; see top matches update in real time
- **Kite catalog** — browse all 79 kites with filters for brand, skill level, construction (Dacron / Aluula / Brainchild), and budget
- **Side-by-side comparison** — compare up to 3 kites across 17 spec fields
- **Detail pages** — full specs, style placement bars, structured reviews from YouTube transcripts, and buy links (new and used)
- **User reviews** — crowd-sourced ratings and reviews via Supabase

---

## The Matching Algorithm

Each kite has two spectrum scores (0–100):

| Spectrum | Range | What it means |
|---|---|---|
| `style_spectrum` | Foil (0–20) → Surf (21–40) → Freestyle (41–60) → Freeride (61–80) → Big Air (81–100) | Primary riding style |
| `shape_spectrum` | Low Aspect / C-kite (0) → High Aspect / Bow (100) | Kite design character |

Match score = `100 - (0.6 × style_diff + 0.4 × shape_diff)`. If a wave score is included, it weights 40/30/30.

---

## The Data

**79 kites** across 13 brands: Duotone, Core, Slingshot, North, Ozone, Flysurfer, Cabrinha, Reedin, F-One, Eleveight, Airush, Harlem, Naish.

Every kite has specs, style placement, buy links, and a hand-written summary. 30 kites also have structured reviews derived from real YouTube transcripts (Jason Montreal, Kitemana, Our Kite Life).

Kite data is managed through the Payload CMS admin panel at `/admin` and stored in Neon Postgres.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| CMS | Payload CMS 3.x |
| Database | Neon (serverless Postgres) |
| User reviews | Supabase |
| Deploy | Vercel |

---

## Project Structure

```
app/
  (frontend)/       # All public-facing pages
    page.tsx        # Homepage + style quiz
    kites/          # Browse catalog
    kite/[slug]/    # Kite detail
    results/        # Quiz results
    compare/        # Side-by-side comparison
    about/
    api/kites/      # REST endpoint for client components
  (payload)/
    admin/          # Payload CMS admin panel (/admin)
collections/
  Kites.ts          # Payload collection definition
components/         # Shared React components
lib/
  types.ts          # TypeScript interfaces
  matcher.ts        # Scoring algorithm
  getKites.ts       # Server-side Payload data fetching
data/
  kites.json        # Source of truth (seeded into Payload)
scripts/
  seed-kites.ts     # Migrate kites.json → Neon DB
public/kites/       # Kite images (79 JPGs)
```

---

## Local Development

### Prerequisites
- Node.js 18+
- A [Neon](https://neon.tech) Postgres database

### Setup

```bash
git clone https://github.com/teddyretz/kite-matcher.git
cd kite-matcher
npm install
```

Create `.env.local`:

```env
DATABASE_URI=postgresql://...your-neon-connection-string...
PAYLOAD_SECRET=your-random-secret-string

# Optional — enables crowd-sourced user reviews
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Start the dev server:

```bash
npm run dev
```

On first run, Payload will create its tables in the database automatically.

### Seed the database

```bash
npm run seed
```

This reads `data/kites.json` and loads all 79 kites into Payload/Neon. Safe to re-run — it clears and re-seeds.

### Admin panel

Visit `http://localhost:3000/admin` to create your admin account and manage kites.

---

## Deployment

```bash
vercel --prod --yes
```

Required Vercel environment variables:
- `DATABASE_URI` — Neon connection string
- `PAYLOAD_SECRET` — random 32+ character string

---

## Philosophy

FindMyKite exists because kite buying advice is broken. Most review sites are sponsored, and "best kite" lists tell you nothing about whether a kite is right for *your* riding style. This app is built by a kitesurfer, not a brand, and tries to give honest, spec-backed recommendations.
