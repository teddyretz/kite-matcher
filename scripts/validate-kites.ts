/**
 * Validates every per-kite JSON file in data/kites/ against KiteSchema.
 * Exits non-zero on any failure. Wired into `npm run validate-kites` and
 * the prebuild hook so a malformed kite breaks the deploy instead of
 * shipping bad data.
 */
import fs from 'fs'
import path from 'path'
import { KiteSchema } from '../lib/schema'

const ROOT = path.resolve(__dirname, '..')
const DIR = path.join(ROOT, 'data', 'kites')

function main() {
  if (!fs.existsSync(DIR)) {
    console.error(`Missing directory: ${DIR}`)
    process.exit(1)
  }
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.json')).sort()
  if (files.length === 0) {
    console.error(`No kite files found in ${DIR}`)
    process.exit(1)
  }

  let invalid = 0
  const summaryOwner = new Map<string, string>()
  for (const f of files) {
    const raw = fs.readFileSync(path.join(DIR, f), 'utf-8')
    let data: unknown
    try {
      data = JSON.parse(raw)
    } catch (err) {
      invalid++
      console.error(`✗ ${f}: invalid JSON — ${err instanceof Error ? err.message : err}`)
      continue
    }
    const parsed = KiteSchema.safeParse(data)
    if (!parsed.success) {
      invalid++
      console.error(`✗ ${f}: ${parsed.error.issues.length} validation issue(s)`)
      for (const issue of parsed.error.issues) {
        console.error(`    ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      }
      continue
    }
    const expectedSlug = f.replace(/\.json$/, '')
    if (parsed.data.slug !== expectedSlug) {
      invalid++
      console.error(`✗ ${f}: slug mismatch — file says "${expectedSlug}", JSON says "${parsed.data.slug}"`)
    }

    // Data-integrity checks the schema can't express.
    const kite = parsed.data
    const problems: string[] = []
    if (kite.wind_range_low >= kite.wind_range_high) problems.push('wind_range_low must be below wind_range_high')
    if (kite.sizes.some((s, i) => i > 0 && s <= kite.sizes[i - 1])) problems.push('sizes must be strictly ascending')
    if (!fs.existsSync(path.join(ROOT, 'public', kite.image))) problems.push(`image ${kite.image} does not exist`)
    // Ratings must be grounded in a transcript we hold, never invented.
    const hasTranscript = kite.reviews.some((r) => r.source === 'youtube' && (r.full_transcript?.length ?? 0) > 200)
    if (kite.structured_review && !hasTranscript) problems.push('structured_review has no YouTube transcript to back it')
    // Copy-pasted summaries are how duplicate kite files slip in.
    const dupOf = summaryOwner.get(kite.summary)
    if (dupOf) problems.push(`summary is identical to ${dupOf}`)
    else summaryOwner.set(kite.summary, f)
    if (problems.length) {
      invalid++
      for (const p of problems) console.error(`✗ ${f}: ${p}`)
    }
  }

  if (invalid === 0) {
    console.log(`✓ ${files.length} kite file(s) validated`)
    process.exit(0)
  }
  console.error(`\n${invalid} of ${files.length} kite file(s) failed validation.`)
  process.exit(1)
}

main()
