import fs from 'fs'
import path from 'path'

import Anthropic from '@anthropic-ai/sdk'
import { KiteSchema, type ValidatedKite } from '../lib/schema'

type YouTubeReview = Extract<ValidatedKite['reviews'][number], { source: 'youtube' }>
type StructuredReview = NonNullable<ValidatedKite['structured_review']>

const MODEL = 'claude-sonnet-4-6'
const MAX_TOKENS = 3072
const ROOT = path.resolve(__dirname, '..')
const DATA_DIR = path.join(ROOT, 'data', 'kites')

const SYSTEM_PROMPT = `You are a kitesurfing expert writing structured reviews for findmykite.com. Given one or more YouTube review transcripts for a single kite, you produce TWO outputs in one JSON response:

1. \`review\` — the consolidated expert take across all transcripts.
2. \`videos\` — a per-source written summary of what each individual reviewer said.

Principles:
- Be HONEST. Surface real weaknesses. Do not sanitize. Reviewers often hedge; you should not.
- Ground every claim in the transcripts. Do not invent specs or fabricate pros/cons.
- Consolidate across transcripts for \`review\`. If reviewers disagree, prefer the more specific observation.
- Each \`videos\` entry summarizes that ONE reviewer's view. Different reviewers may emphasize different things — that's fine, write what THEY said.
- Output written summaries, not transcribed speech. No "hello and welcome to..." style intros. No filler like "they said that".

Field guide for \`review\`:
- rating: number 0-5, one decimal. 5 = iconic/best-in-class. 4.5 = excellent. 4 = very good. 3.5 = solid. 3 = mixed. Below 3 only if reviewers were notably critical.
- summary: 2-3 sentences capturing the kite's character, main strength, and main caveat.
- pros: 3-6 concrete strengths, drawn from the transcripts.
- cons: 2-5 honest weaknesses. If reviewers raised a concern, include it — do not omit to be polite.
- best_for: one sentence describing the rider this kite suits.
- not_for: one sentence describing who should skip this kite.
- rec_blurb: one punchy sentence (max ~18 words) for card display. Memorable, specific, not generic.
- sources: list of reviewer NAMES that contributed (e.g. "Jason Montreal", "Kitemana"). Just the name, not "(channel name)".

Field guide for each \`videos\` entry:
- video_id: the EXACT video_id string from the source header (look for "[video_id: ...]"). Critical — this lets us match the summary back to the right video.
- summary: 2-3 sentences (max ~60 words) on what THIS reviewer specifically said about the kite. Their main take, what they liked, what they criticized. Written prose, not a transcript snippet.`

const SCHEMA = {
  type: 'object' as const,
  additionalProperties: false,
  required: ['review', 'videos'],
  properties: {
    review: {
      type: 'object' as const,
      additionalProperties: false,
      required: ['rating', 'summary', 'pros', 'cons', 'best_for', 'not_for', 'rec_blurb', 'sources'],
      properties: {
        rating: { type: 'number' as const },
        summary: { type: 'string' as const },
        pros: { type: 'array' as const, items: { type: 'string' as const } },
        cons: { type: 'array' as const, items: { type: 'string' as const } },
        best_for: { type: 'string' as const },
        not_for: { type: 'string' as const },
        rec_blurb: { type: 'string' as const },
        sources: { type: 'array' as const, items: { type: 'string' as const } },
      },
    },
    videos: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        additionalProperties: false,
        required: ['video_id', 'summary'],
        properties: {
          video_id: { type: 'string' as const },
          summary: { type: 'string' as const },
        },
      },
    },
  },
}

interface LlmOutput {
  review: StructuredReview
  videos: Array<{ video_id: string; summary: string }>
}

function loadAllKites(): ValidatedKite[] {
  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.json')).sort()
  return files.map((f) => {
    const raw = fs.readFileSync(path.join(DATA_DIR, f), 'utf-8')
    const parsed = KiteSchema.parse(JSON.parse(raw))
    return parsed
  })
}

function writeKite(kite: ValidatedKite) {
  const file = path.join(DATA_DIR, `${kite.slug}.json`)
  fs.writeFileSync(file, JSON.stringify(kite, null, 2) + '\n')
}

function buildUserPrompt(kite: ValidatedKite, transcripts: YouTubeReview[]): string {
  const header = `Kite: ${kite.brand} ${kite.model} ${kite.year}
Category: ${kite.summary}
Style placement: style_spectrum=${kite.style_spectrum} (Foil 0-20, Surf 21-40, Freestyle 41-60, Freeride 61-80, Big Air 81-100), wave_spectrum=${kite.wave_spectrum}
Tags: ${kite.style_tags.join(', ')}

Review transcripts follow. Produce both a consolidated \`review\` and a per-source \`videos\` summary array (one entry per source, keyed by video_id).
`
  const bodies = transcripts
    .map(
      (r, i) =>
        `\n=== Source ${i + 1}: ${r.reviewer}${r.video_title ? ` — "${r.video_title}"` : ''} [video_id: ${r.video_id}] ===\n${r.full_transcript ?? ''}`,
    )
    .join('\n')
  return header + bodies
}

async function generateStructuredReview(
  client: Anthropic,
  kite: ValidatedKite,
  transcripts: YouTubeReview[],
): Promise<LlmOutput> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildUserPrompt(kite, transcripts) }],
    output_config: {
      format: { type: 'json_schema', schema: SCHEMA },
    },
  } as unknown as Anthropic.MessageCreateParamsNonStreaming)

  const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text')
  if (!textBlock) throw new Error('No text block in response')
  return JSON.parse(textBlock.text) as LlmOutput
}

function parseArgs(argv: string[]) {
  const args: { slug?: string; overwrite: boolean; dryRun: boolean; limit?: number } = {
    overwrite: false,
    dryRun: false,
  }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--slug' && argv[i + 1]) args.slug = argv[++i]
    else if (a === '--overwrite') args.overwrite = true
    else if (a === '--dry-run') args.dryRun = true
    else if (a === '--limit' && argv[i + 1]) args.limit = parseInt(argv[++i], 10)
  }
  return args
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY is not set. Add it to .env.local.')
    process.exit(1)
  }

  const client = new Anthropic()
  const allKites = loadAllKites()
  const filtered = args.slug ? allKites.filter((k) => k.slug === args.slug) : allKites

  const targets = filtered.filter((k) => {
    const hasTranscript = k.reviews.some(
      (r) => r.source === 'youtube' && r.full_transcript && r.full_transcript.length > 200,
    )
    const hasStructured = !!k.structured_review && typeof k.structured_review.rating === 'number'
    return hasTranscript && (args.overwrite || !hasStructured)
  })

  const batch = args.limit ? targets.slice(0, args.limit) : targets
  console.log(
    `Found ${targets.length} kite(s) to process${args.limit ? ` (processing ${batch.length})` : ''}${args.dryRun ? ' — DRY RUN' : ''}`,
  )

  let ok = 0
  let failed = 0
  for (const kite of batch) {
    const transcripts = kite.reviews.filter(
      (r): r is YouTubeReview => r.source === 'youtube' && !!r.full_transcript,
    )
    console.log(`\n[${ok + failed + 1}/${batch.length}] ${kite.slug} — ${transcripts.length} transcript(s)`)
    try {
      const { review, videos } = await generateStructuredReview(client, kite, transcripts)
      console.log(
        `  rating: ${review.rating} | pros: ${review.pros.length} | cons: ${review.cons.length} | sources: ${review.sources.join(', ')}`,
      )
      console.log(`  blurb: ${review.rec_blurb}`)
      const summaryById = new Map(videos.map((v) => [v.video_id, v.summary]))
      const matched = transcripts.filter((t) => summaryById.has(t.video_id)).length
      console.log(`  per-video summaries: ${matched}/${transcripts.length} matched by video_id`)
      if (!args.dryRun) {
        const updatedReviews = kite.reviews.map((r) => {
          if (r.source !== 'youtube') return r
          const s = summaryById.get(r.video_id)
          return s ? { ...r, summary: s } : r
        })
        writeKite({ ...kite, structured_review: review, reviews: updatedReviews })
        console.log(`  ✓ written to data/kites/${kite.slug}.json`)
      }
      ok++
    } catch (err) {
      failed++
      console.error(`  ✗ failed:`, err instanceof Error ? err.message : err)
    }
  }

  console.log(`\nDone. Succeeded: ${ok}, Failed: ${failed}`)
  process.exit(failed > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
