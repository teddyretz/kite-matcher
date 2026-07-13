/**
 * Discover candidate review videos for kites missing a YouTube source.
 *
 * Lists every recent upload from a small set of known kite-review channels
 * (Jason Montreal, Kitemana, Our Kite Life, MACkite — extend with --channel),
 * fuzzy-matches each video title against the 79 kite slugs in data/kites/,
 * and prints a per-kite list of likely matches with ready-to-paste
 * `npm run ingest-review` commands.
 *
 * Usage:
 *   npm run find-candidates                      # report to stdout
 *   npm run find-candidates -- --out candidates.md
 *   npm run find-candidates -- --limit 500       # videos per channel (default 200)
 *   npm run find-candidates -- --threshold 50    # min match score 0-100 (default 60)
 *   npm run find-candidates -- --top 5           # candidates shown per kite (default 3)
 *   npm run find-candidates -- --refresh         # bypass 24h channel cache
 *   npm run find-candidates -- --channel https://www.youtube.com/@SomeReviewer/videos
 *
 * Workflow:
 *   1. Run this script. Skim the report.
 *   2. For each candidate that looks correct, run the printed
 *      `npm run ingest-review -- --slug X --url Y` command.
 *   3. After ingesting, run `npm run process-reviews` to generate
 *      structured_review for the freshly-ingested kites.
 *   4. git add data/kites/ && commit && push.
 *
 * Requires yt-dlp on PATH (brew install yt-dlp / pip install yt-dlp).
 */
import fs from 'fs'
import path from 'path'
import { execFileSync } from 'child_process'
import { KiteSchema, type ValidatedKite } from '../lib/schema'
import { matchScore, type Video, type ReviewChannel } from '../lib/candidate-scoring'

const ROOT = path.resolve(__dirname, '..')
const DATA_DIR = path.join(ROOT, 'data', 'kites')
const CACHE_DIR = path.join(ROOT, 'data', '_channel-cache')
const CACHE_TTL_HOURS = 24

const DEFAULT_CHANNELS: ReviewChannel[] = [
  { name: 'Jason Montreal',     url: 'https://www.youtube.com/@jasonofmontreal/videos' },
  { name: 'Kitemana',           url: 'https://www.youtube.com/@Kitemana/videos' },
  { name: 'Our Kite Life',      url: 'https://www.youtube.com/@OurKiteLife/videos' },
  { name: 'MACkite',            url: 'https://www.youtube.com/@MACkiteboarding/videos' },
  // Additional channels — may 404 on yt-dlp if the handle is wrong; the script
  // logs and continues. Override or extend with --channel <url>.
  { name: 'Progression Sports', url: 'https://www.youtube.com/@ProgressionSports/videos' },
  { name: 'Kiteworld Magazine', url: 'https://www.youtube.com/@KiteworldMag/videos' },
  { name: 'Tom Court',          url: 'https://www.youtube.com/@TomCourt/videos' },
]

interface Args {
  limit: number
  threshold: number
  top: number
  refresh: boolean
  out: string
  extraChannels: string[]
}

function parseArgs(argv: string[]): Args {
  const args: Args = { limit: 200, threshold: 60, top: 3, refresh: false, out: '', extraChannels: [] }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--limit' && argv[i + 1]) args.limit = parseInt(argv[++i], 10)
    else if (a === '--threshold' && argv[i + 1]) args.threshold = parseInt(argv[++i], 10)
    else if (a === '--top' && argv[i + 1]) args.top = parseInt(argv[++i], 10)
    else if (a === '--refresh') args.refresh = true
    else if (a === '--out' && argv[i + 1]) args.out = argv[++i]
    else if (a === '--channel' && argv[i + 1]) args.extraChannels.push(argv[++i])
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

function slugifyChannelName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function fetchChannelVideos(channel: ReviewChannel, limit: number, useCache: boolean): Video[] {
  const cacheFile = path.join(CACHE_DIR, `${slugifyChannelName(channel.name)}.json`)
  if (useCache && fs.existsSync(cacheFile)) {
    const ageHours = (Date.now() - fs.statSync(cacheFile).mtimeMs) / 1000 / 3600
    if (ageHours < CACHE_TTL_HOURS) {
      const cached: Video[] = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'))
      console.error(`  ${channel.name}: ${cached.length} videos (cached, ${ageHours.toFixed(1)}h old)`)
      return cached
    }
  }

  console.error(`  ${channel.name}: fetching (limit ${limit})…`)
  const raw = execFileSync(
    'yt-dlp',
    [
      '--no-warnings',
      '--flat-playlist',
      '--skip-download',
      '--playlist-end', String(limit),
      '--dump-json',
      channel.url,
    ],
    { encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024 },
  )

  const videos: Video[] = []
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    try {
      const j = JSON.parse(trimmed) as { id?: string; title?: string; url?: string; webpage_url?: string }
      if (!j.id || !j.title) continue
      videos.push({
        id: j.id,
        title: j.title,
        url: j.webpage_url ?? j.url ?? `https://youtu.be/${j.id}`,
        channel: channel.name,
      })
    } catch {
      // skip malformed lines (yt-dlp warning lines, etc.)
    }
  }

  console.error(`  ${channel.name}: ${videos.length} videos`)
  fs.mkdirSync(CACHE_DIR, { recursive: true })
  fs.writeFileSync(cacheFile, JSON.stringify(videos, null, 2))
  return videos
}

function loadKites(): ValidatedKite[] {
  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.json')).sort()
  return files.map((f) => KiteSchema.parse(JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf-8'))))
}

interface CandidateMatch {
  video: Video
  score: number
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  checkYtDlp()

  const channels: ReviewChannel[] = [
    ...DEFAULT_CHANNELS,
    ...args.extraChannels.map((url) => ({ name: new URL(url).pathname.split('/').filter(Boolean)[0] || url, url })),
  ]

  console.error(`Sweeping ${channels.length} channel(s):`)
  const allVideos: Video[] = []
  for (const ch of channels) {
    try {
      const videos = fetchChannelVideos(ch, args.limit, !args.refresh)
      allVideos.push(...videos)
    } catch (err) {
      console.error(`  ✗ ${ch.name}: ${err instanceof Error ? err.message : err}`)
    }
  }
  console.error(`Total videos to score: ${allVideos.length}`)

  const kites = loadKites()
  console.error(`Loaded ${kites.length} kites.\n`)

  // Skip videos we've already ingested for any kite.
  const ingestedVideoIds = new Set<string>()
  for (const k of kites) {
    for (const r of k.reviews) {
      if (r.source === 'youtube') ingestedVideoIds.add(r.video_id)
    }
  }

  // Per-kite candidates above threshold, top N.
  const candidatesByKite = new Map<string, CandidateMatch[]>()
  for (const k of kites) {
    const matches: CandidateMatch[] = []
    for (const v of allVideos) {
      if (ingestedVideoIds.has(v.id)) continue
      const s = matchScore(k, v)
      if (s >= args.threshold) matches.push({ video: v, score: s })
    }
    matches.sort((a, b) => b.score - a.score)
    candidatesByKite.set(k.slug, matches.slice(0, args.top))
  }

  // Build the report.
  const lines: string[] = []
  lines.push(`# Candidate review videos\n`)
  lines.push(
    `Generated ${new Date().toISOString()}. Threshold ${args.threshold}, top ${args.top} per kite.`,
  )
  lines.push(
    `Channels swept: ${channels.map((c) => c.name).join(', ')}. ${allVideos.length} videos scored.\n`,
  )

  let withCandidates = 0
  let alreadyDone = 0
  let noCandidates = 0

  // Group: kites with candidates first, then "no candidates" at the bottom.
  const buckets: { withMatches: ValidatedKite[]; noMatches: ValidatedKite[] } = { withMatches: [], noMatches: [] }
  for (const k of kites) {
    const m = candidatesByKite.get(k.slug) ?? []
    if (m.length > 0) buckets.withMatches.push(k)
    else if (k.structured_review) alreadyDone++
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
      lines.push(`- **${c.score}** [${c.video.channel}] [${c.video.title}](${c.video.url})`)
      lines.push(`  \`\`\``)
      lines.push(`  npm run ingest-review -- --slug ${k.slug} --url ${c.video.url}`)
      lines.push(`  \`\`\``)
    }
    lines.push('')
  }

  if (buckets.noMatches.length > 0) {
    lines.push(`## Kites with no candidates above threshold (${buckets.noMatches.length})\n`)
    lines.push(`Probably need wider sweep (\`--limit 500\`) or a different channel.\n`)
    for (const k of buckets.noMatches) {
      lines.push(`- \`${k.slug}\` — ${k.brand} ${k.model} ${k.year}`)
    }
    lines.push('')
  }

  lines.push(`---`)
  lines.push(
    `Summary: ${withCandidates} with candidates, ${alreadyDone} already-covered (no new candidates), ${noCandidates} need attention.`,
  )

  const out = lines.join('\n') + '\n'
  if (args.out) {
    fs.writeFileSync(args.out, out)
    console.error(`\nWrote report to ${args.out}`)
  } else {
    process.stdout.write(out)
  }
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
