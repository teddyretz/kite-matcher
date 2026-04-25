import { config as dotenv } from 'dotenv'
import { resolve } from 'path'
dotenv({ path: resolve(process.cwd(), '.env.local') })

import { getPayload } from 'payload'
import config from '@payload-config'
import Anthropic from '@anthropic-ai/sdk'

type YouTubeReview = {
  source: 'youtube'
  reviewer: string
  channel: string
  video_title?: string
  video_url?: string
  excerpt?: string
  verdict?: string
  full_transcript?: string
}

type StructuredReview = {
  rating: number
  summary: string
  pros: string[]
  cons: string[]
  best_for: string
  not_for: string
  rec_blurb: string
  sources: string[]
}

const MODEL = 'claude-sonnet-4-6'
const MAX_TOKENS = 2048

const SYSTEM_PROMPT = `You are a kitesurfing expert writing structured reviews for findmykite.com. Given one or more YouTube review transcripts for a single kite, you synthesize them into a consolidated JSON review.

Principles:
- Be HONEST. Surface real weaknesses. Do not sanitize. Reviewers often hedge; you should not. If a kite has durability issues, says so plainly.
- Ground every claim in the transcripts. Do not invent specs or fabricate pros/cons.
- Consolidate across transcripts when there are multiple. If reviewers disagree, prefer the more specific observation.
- Keep items concise. Pros/cons are short phrases (5-15 words), not paragraphs.

Field guide:
- rating: number 0-5, one decimal. 5 = iconic/best-in-class. 4.5 = excellent. 4 = very good. 3.5 = solid. 3 = mixed. Below 3 only if reviewers were notably critical.
- summary: 2-3 sentences capturing the kite's character, main strength, and main caveat.
- pros: 3-6 concrete strengths, drawn from the transcripts.
- cons: 2-5 honest weaknesses. If reviewers raised a concern, include it — do not omit to be polite.
- best_for: one sentence describing the rider this kite suits.
- not_for: one sentence describing who should skip this kite.
- rec_blurb: one punchy sentence (max ~18 words) for card display. Memorable, specific, not generic.
- sources: list of reviewer channel names that contributed (e.g. "Jason Montreal", "Kitemana", "Our Kite Life").`

const SCHEMA = {
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
}

function buildUserPrompt(kite: Record<string, unknown>, transcripts: YouTubeReview[]): string {
  const header = `Kite: ${kite.brand} ${kite.model} ${kite.year}
Category: ${kite.summary}
Style placement: style_spectrum=${kite.style_spectrum} (Foil 0-20, Surf 21-40, Freestyle 41-60, Freeride 61-80, Big Air 81-100), wave_spectrum=${kite.wave_spectrum}
Tags: ${Array.isArray(kite.style_tags) ? (kite.style_tags as string[]).join(', ') : ''}

Review transcripts follow. Synthesize a single structured review.
`
  const bodies = transcripts
    .map((r, i) => `\n=== Source ${i + 1}: ${r.reviewer} (${r.channel})${r.video_title ? ` — "${r.video_title}"` : ''} ===\n${r.full_transcript ?? ''}`)
    .join('\n')
  return header + bodies
}

async function generateStructuredReview(
  client: Anthropic,
  kite: Record<string, unknown>,
  transcripts: YouTubeReview[],
): Promise<StructuredReview> {
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
  return JSON.parse(textBlock.text) as StructuredReview
}

function parseArgs(argv: string[]): { slug?: string; overwrite: boolean; dryRun: boolean; limit?: number } {
  const args = { overwrite: false, dryRun: false } as { slug?: string; overwrite: boolean; dryRun: boolean; limit?: number }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--slug' && argv[i + 1]) { args.slug = argv[++i] }
    else if (a === '--overwrite') { args.overwrite = true }
    else if (a === '--dry-run') { args.dryRun = true }
    else if (a === '--limit' && argv[i + 1]) { args.limit = parseInt(argv[++i], 10) }
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
  const payload = await getPayload({ config })

  const findParams: Parameters<typeof payload.find>[0] = {
    collection: 'kites',
    limit: 0,
    pagination: false,
  }
  if (args.slug) findParams.where = { slug: { equals: args.slug } }
  const { docs } = await payload.find(findParams)

  const targets = docs.filter((doc) => {
    const reviews = (doc.reviews as YouTubeReview[] | undefined) ?? []
    const hasTranscript = reviews.some((r) => r.source === 'youtube' && r.full_transcript && r.full_transcript.length > 200)
    const hasStructured = doc.structured_review && typeof (doc.structured_review as { rating?: number }).rating === 'number'
    return hasTranscript && (args.overwrite || !hasStructured)
  })

  const batch = args.limit ? targets.slice(0, args.limit) : targets
  console.log(`Found ${targets.length} kite(s) to process${args.limit ? ` (processing ${batch.length})` : ''}${args.dryRun ? ' — DRY RUN' : ''}`)

  let ok = 0
  let failed = 0
  for (const doc of batch) {
    const slug = doc.slug as string
    const transcripts = ((doc.reviews as YouTubeReview[]) ?? []).filter(
      (r) => r.source === 'youtube' && !!r.full_transcript,
    )
    console.log(`\n[${ok + failed + 1}/${batch.length}] ${slug} — ${transcripts.length} transcript(s)`)
    try {
      const review = await generateStructuredReview(client, doc as Record<string, unknown>, transcripts)
      console.log(`  rating: ${review.rating} | pros: ${review.pros.length} | cons: ${review.cons.length} | sources: ${review.sources.join(', ')}`)
      console.log(`  blurb: ${review.rec_blurb}`)
      if (!args.dryRun) {
        await payload.update({
          collection: 'kites',
          id: doc.id,
          data: { structured_review: review } as Record<string, unknown>,
        })
        console.log(`  ✓ written to Payload`)
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
