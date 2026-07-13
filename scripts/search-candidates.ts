/**
 * Per-kite YouTube search to discover review videos for kites that aren't
 * covered by the channel sweep (find-candidates).
 *
 * For each target kite, runs `yt-dlp ytsearchN:"<brand> <model> <year> review"`,
 * scores the results, and prints a per-kite list of likely matches with
 * ready-to-paste `npm run ingest-review` commands.
 *
 * Usage:
 *   npm run search-candidates                              # all kites without structured_review
 *   npm run search-candidates -- --slug duotone-mono-2026  # single kite
 *   npm run search-candidates -- --all --out search.md     # every kite, write to file
 *   npm run search-candidates -- --results 8               # top N search results per kite (default 5)
 *   npm run search-candidates -- --threshold 50            # min match score (default 60)
 *   npm run search-candidates -- --refresh                 # bypass 24h search cache
 *
 * Workflow:
 *   1. Run to produce candidates.
 *   2. For each match that looks correct, paste the printed
 *      `npm run ingest-review -- --slug X --url Y` command.
 *   3. After ingest, `npm run process-reviews -- --slug X` (or run
 *      across the batch) to generate structured_review + per-video summary.
 *
 * Requires yt-dlp on PATH (brew install yt-dlp / pip install yt-dlp).
 */
import fs from 'fs'
import path from 'path'
import { execFileSync } from 'child_process'
import { KiteSchema, type ValidatedKite } from '../lib/schema'
import { matchScore, type Video } from '../lib/candidate-scoring'

const ROOT = path.resolve(__dirname, '..')
const DATA_DIR = path.join(ROOT, 'data', 'kites')
const CACHE_DIR = path.join(ROOT, 'data', '_search-cache')
const CACHE_TTL_HOURS = 24

interface Args {
  slug?: string
  all: boolean
  results: number
  threshold: number
  top: number
  refresh: boolean
  out: string
  autoIngest: boolean
  autoThreshold: number
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    all: false, results: 5, threshold: 60, top: 3, refresh: false, out: '',
    autoIngest: false, autoThreshold: 85,
  }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--slug' && argv[i + 1]) args.slug = argv[++i]
    else if (a === '--all') args.all = true
    else if (a === '--results' && argv[i + 1]) args.results = parseInt(argv[++i], 10)
    else if (a === '--threshold' && argv[i + 1]) args.threshold = parseInt(argv[++i], 10)
    else if (a === '--top' && argv[i + 1]) args.top = parseInt(argv[++i], 10)
    else if (a === '--refresh') args.refresh = true
    else if (a === '--out' && argv[i + 1]) args.out = argv[++i]
    else if (a === '--auto-ingest') args.autoIngest = true
    else if (a === '--auto-threshold' && argv[i + 1]) args.autoThreshold = parseInt(argv[++i], 10)
  }
  return args
}

function checkYtDlp(): void {
  try {
    execFileSync('yt-dlp', ['--version'], { stdio: 'pipe' })
  } catch {
    console.error('yt-dlp not found on PATH. Install with: brew install yt-dlp  (or: pip install yt-dlp)')
    process.exit(1)
  }
}

function loadKites(): ValidatedKite[] {
  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.json')).sort()
  return files.map((f) => KiteSchema.parse(JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf-8'))))
}

function searchYouTube(query: string, n: number, useCache: boolean): Video[] {
  // Cache key: query + result count, so a higher --results invalidates a smaller cached run.
  const cacheKey = `${query}__n${n}`.toLowerCase().replace(/[^a-z0-9_]+/g, '-').slice(0, 200)
  const cacheFile = path.join(CACHE_DIR, `${cacheKey}.json`)

  if (useCache && fs.existsSync(cacheFile)) {
    const ageHours = (Date.now() - fs.statSync(cacheFile).mtimeMs) / 1000 / 3600
    if (ageHours < CACHE_TTL_HOURS) {
      const cached: Video[] = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'))
      return cached
    }
  }

  let raw: string
  try {
    raw = execFileSync(
      'yt-dlp',
      [
        '--no-warnings',
        '--flat-playlist',
        '--skip-download',
        '--dump-json',
        `ytsearch${n}:${query}`,
      ],
      { encoding: 'utf-8', maxBuffer: 32 * 1024 * 1024 },
    )
  } catch (err) {
    console.error(`    ✗ search failed: ${err instanceof Error ? err.message.split('\n')[0] : err}`)
    return []
  }

  const videos: Video[] = []
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    try {
      const j = JSON.parse(trimmed) as {
        id?: string
        title?: string
        url?: string
        webpage_url?: string
        uploader?: string
        channel?: string
      }
      if (!j.id || !j.title) continue
      videos.push({
        id: j.id,
        title: j.title,
        url: j.webpage_url ?? j.url ?? `https://youtu.be/${j.id}`,
        channel: j.channel ?? j.uploader ?? '',
      })
    } catch {
      // skip malformed lines
    }
  }

  fs.mkdirSync(CACHE_DIR, { recursive: true })
  fs.writeFileSync(cacheFile, JSON.stringify(videos, null, 2))
  return videos
}

function buildQuery(kite: ValidatedKite): string {
  return `${kite.brand} ${kite.model} ${kite.year} review`
}

interface CandidateMatch {
  video: Video
  score: number
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  checkYtDlp()

  const allKites = loadKites()
  const ingested = new Set<string>()
  for (const k of allKites) {
    for (const r of k.reviews) {
      if (r.source === 'youtube') ingested.add(r.video_id)
    }
  }

  // Pick targets: --slug overrides everything; --all means every kite;
  // default is "kites without a structured_review".
  let targets: ValidatedKite[]
  if (args.slug) {
    targets = allKites.filter((k) => k.slug === args.slug)
    if (targets.length === 0) {
      console.error(`No kite with slug ${args.slug}`)
      process.exit(1)
    }
  } else if (args.all) {
    targets = allKites
  } else {
    targets = allKites.filter((k) => !k.structured_review)
  }

  console.error(`Searching YouTube for ${targets.length} kite(s) (results=${args.results}, threshold=${args.threshold})…\n`)

  const candidatesByKite = new Map<string, CandidateMatch[]>()
  let queried = 0
  for (const kite of targets) {
    queried++
    const query = buildQuery(kite)
    process.stderr.write(`  [${queried}/${targets.length}] ${kite.slug} — "${query}"\n`)

    const videos = searchYouTube(query, args.results, !args.refresh)
    const matches: CandidateMatch[] = []
    for (const v of videos) {
      if (ingested.has(v.id)) continue
      const s = matchScore(kite, v)
      if (s >= args.threshold) matches.push({ video: v, score: s })
    }
    matches.sort((a, b) => b.score - a.score)
    candidatesByKite.set(kite.slug, matches.slice(0, args.top))
  }

  // Build report.
  const lines: string[] = []
  lines.push(`# YouTube search candidates\n`)
  lines.push(`Generated ${new Date().toISOString()}. Threshold ${args.threshold}, top ${args.top} per kite, ${args.results} search results queried per kite.\n`)

  let withCandidates = 0
  let noCandidates = 0
  const buckets = { withMatches: [] as ValidatedKite[], noMatches: [] as ValidatedKite[] }
  for (const k of targets) {
    const m = candidatesByKite.get(k.slug) ?? []
    if (m.length > 0) buckets.withMatches.push(k)
    else buckets.noMatches.push(k)
  }
  withCandidates = buckets.withMatches.length
  noCandidates = buckets.noMatches.length

  lines.push(`## Kites with candidates (${withCandidates})\n`)
  for (const k of buckets.withMatches) {
    const m = candidatesByKite.get(k.slug)!
    lines.push(`### ${k.brand} ${k.model} ${k.year}`)
    if (k.structured_review) lines.push(`*Already has structured_review; new candidates below.*`)
    lines.push(`Slug: \`${k.slug}\``)
    for (const c of m) {
      const channel = c.video.channel ? `[${c.video.channel}] ` : ''
      lines.push(`- **${c.score}** ${channel}[${c.video.title}](${c.video.url})`)
      lines.push(`  \`\`\``)
      lines.push(`  npm run ingest-review -- --slug ${k.slug} --url ${c.video.url}`)
      lines.push(`  \`\`\``)
    }
    lines.push('')
  }

  if (buckets.noMatches.length > 0) {
    lines.push(`## Kites with no candidates above threshold (${buckets.noMatches.length})\n`)
    lines.push(`Try \`--results 10\`, lower \`--threshold\`, or accept that no review exists yet.\n`)
    for (const k of buckets.noMatches) {
      lines.push(`- \`${k.slug}\` — ${k.brand} ${k.model} ${k.year}`)
    }
    lines.push('')
  }

  lines.push(`---`)
  lines.push(`Summary: ${withCandidates} with candidates, ${noCandidates} without.`)

  const out = lines.join('\n') + '\n'
  if (args.out) {
    fs.writeFileSync(args.out, out)
    console.error(`\nWrote report to ${args.out}`)
  } else if (!args.autoIngest) {
    process.stdout.write(out)
  }

  // --auto-ingest: for each kite where the top match is above auto-threshold,
  // shell out to ingest-review.ts. Strong threshold (default 85) is a guard
  // against bad matches being committed automatically; lower it deliberately
  // (--auto-threshold 70) only when you know what you're doing.
  if (args.autoIngest) {
    const eligible: Array<{ slug: string; match: CandidateMatch }> = []
    for (const k of targets) {
      const matches = candidatesByKite.get(k.slug) ?? []
      if (matches.length === 0) continue
      if (matches[0].score < args.autoThreshold) continue
      eligible.push({ slug: k.slug, match: matches[0] })
    }
    console.error(`\nAuto-ingesting ${eligible.length} kite(s) (top match ≥ ${args.autoThreshold})…\n`)
    let ok = 0
    let failed = 0
    for (const { slug, match } of eligible) {
      console.error(`  ${slug}: ${match.video.title} (${match.score})`)
      try {
        execFileSync(
          'npx',
          ['tsx', 'scripts/ingest-review.ts', '--slug', slug, '--url', match.video.url],
          { stdio: 'inherit' },
        )
        ok++
      } catch {
        failed++
        console.error(`  ✗ ingest failed for ${slug}`)
      }
    }
    console.error(`\nAuto-ingest done. Succeeded: ${ok}, Failed: ${failed}`)
    if (ok > 0) {
      console.error(`Next: npm run process-reviews   (will generate structured_review for newly-ingested kites)`)
    }
  }
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
