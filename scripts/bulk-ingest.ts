/**
 * Bulk-ingest YouTube reviews from a flat text file.
 *
 * Usage:
 *   npm run bulk-ingest -- --file reviews.txt
 *   npm run bulk-ingest -- --file reviews.txt --skip-existing
 *
 * File format: one `<slug> <url>` pair per line. Whitespace-separated,
 * blank lines and # comments ignored. Multiple URLs per kite are fine
 * — just add another line.
 *
 *   # 2026 D/Lab reviews
 *   duotone-rebel-dlab-2026 https://youtu.be/abc
 *   duotone-evo-dlab-2026   https://youtu.be/def
 *
 *   # Multiple sources for one kite
 *   core-xr8-2026 https://youtu.be/ghi  # Jason Montreal
 *   core-xr8-2026 https://youtu.be/jkl  # MACkite
 *
 * After bulk-ingest finishes, run `npm run process-reviews` to generate
 * structured_review + per-video summaries for the newly-ingested kites.
 */
import fs from 'fs'
import path from 'path'
import { execFileSync } from 'child_process'
import { KiteSchema } from '../lib/schema'

const ROOT = path.resolve(__dirname, '..')
const DATA_DIR = path.join(ROOT, 'data', 'kites')

interface Args {
  file: string
  skipExisting: boolean
}

function parseArgs(argv: string[]): Args {
  const args: Args = { file: '', skipExisting: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--file' && argv[i + 1]) args.file = argv[++i]
    else if (a === '--skip-existing') args.skipExisting = true
  }
  if (!args.file) {
    console.error('Usage: bulk-ingest --file <path> [--skip-existing]')
    process.exit(1)
  }
  return args
}

interface Entry {
  slug: string
  url: string
  line: number
}

function parseFile(filePath: string): Entry[] {
  const raw = fs.readFileSync(filePath, 'utf-8')
  const entries: Entry[] = []
  raw.split('\n').forEach((rawLine, idx) => {
    const line = rawLine.replace(/#.*$/, '').trim()
    if (!line) return
    const parts = line.split(/\s+/, 2)
    if (parts.length < 2) {
      console.error(`  ✗ line ${idx + 1}: expected "<slug> <url>", got "${rawLine.trim()}"`)
      return
    }
    entries.push({ slug: parts[0], url: parts[1], line: idx + 1 })
  })
  return entries
}

function loadKiteVideoIds(): Map<string, Set<string>> {
  // slug → set of already-ingested video_ids, used by --skip-existing.
  const map = new Map<string, Set<string>>()
  if (!fs.existsSync(DATA_DIR)) return map
  for (const f of fs.readdirSync(DATA_DIR)) {
    if (!f.endsWith('.json')) continue
    const slug = f.replace(/\.json$/, '')
    try {
      const k = KiteSchema.parse(JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf-8')))
      const ids = new Set<string>()
      for (const r of k.reviews) {
        if (r.source === 'youtube') ids.add(r.video_id)
      }
      map.set(slug, ids)
    } catch {
      // skip malformed kite — validate-kites covers it elsewhere
    }
  }
  return map
}

function videoIdFromUrl(url: string): string | null {
  // Cheap shape detection — handles youtu.be/X, youtube.com/watch?v=X, /shorts/X.
  const youtuBe = url.match(/youtu\.be\/([\w-]{8,})/)
  if (youtuBe) return youtuBe[1]
  const watch = url.match(/[?&]v=([\w-]{8,})/)
  if (watch) return watch[1]
  const shorts = url.match(/youtube\.com\/shorts\/([\w-]{8,})/)
  if (shorts) return shorts[1]
  return null
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  if (!fs.existsSync(args.file)) {
    console.error(`File not found: ${args.file}`)
    process.exit(1)
  }

  const entries = parseFile(args.file)
  console.log(`Parsed ${entries.length} ingest target(s) from ${args.file}\n`)

  let ok = 0
  let skipped = 0
  let failed = 0

  const ingestedIds = args.skipExisting ? loadKiteVideoIds() : null

  for (const [i, entry] of entries.entries()) {
    const prefix = `[${i + 1}/${entries.length}] ${entry.slug}`
    if (args.skipExisting && ingestedIds) {
      const vid = videoIdFromUrl(entry.url)
      if (vid && ingestedIds.get(entry.slug)?.has(vid)) {
        console.log(`${prefix}: ↩  already ingested (${vid}); skipping`)
        skipped++
        continue
      }
    }

    console.log(`${prefix}: ingesting ${entry.url}`)
    try {
      execFileSync(
        'npx',
        ['tsx', 'scripts/ingest-review.ts', '--slug', entry.slug, '--url', entry.url],
        { stdio: 'inherit' },
      )
      ok++
    } catch {
      failed++
      console.error(`${prefix}: ✗ failed`)
    }
  }

  console.log(`\nDone. Succeeded: ${ok}, Skipped: ${skipped}, Failed: ${failed}`)
  if (ok > 0) {
    console.log(`Next: npm run process-reviews   (will generate summaries for newly-ingested kites)`)
  }
  process.exit(failed > 0 ? 1 : 0)
}

main()
