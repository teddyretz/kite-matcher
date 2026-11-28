/**
 * Automated independent YouTube review ingestion pipeline.
 *
 * Reads vetted channels from data/review-sources.json, queries recent uploads
 * via yt-dlp, deduplicates against existing video_id entries across all
 * data/kites/*.json files, filters by title_include / title_exclude, matches
 * video titles to kite slugs, fetches English VTT captions, appends a
 * YouTubeReview entry, and regenerates structured_review + per-video summary
 * via scripts/process-reviews.ts.
 *
 * Usage:
 *   npx tsx scripts/ingest-independent-reviews.ts --dry-run
 *   npx tsx scripts/ingest-independent-reviews.ts
 *   npx tsx scripts/ingest-independent-reviews.ts --reviewer "Jason Montreal" --dry-run
 *   npx tsx scripts/ingest-independent-reviews.ts --max-recent 25 --dry-run
 *
 * Requires `yt-dlp` on PATH and `ANTHROPIC_API_KEY` (when not using --dry-run).
 */
import fs from 'fs'
import os from 'os'
import path from 'path'
import { execFileSync } from 'child_process'
import { z } from 'zod'
import { KiteSchema, type ValidatedKite } from '../lib/schema'
import { reviewerForChannel } from '../lib/reviewers'
import { matchScore, normalize, normalizeAlnum } from '../lib/candidate-scoring'

const ROOT = path.resolve(__dirname, '..')
const DATA_DIR = path.join(ROOT, 'data', 'kites')
const SOURCES_FILE = path.join(ROOT, 'data', 'review-sources.json')

const MIN_MATCH_SCORE = 60

const ReviewSourceSchema = z.object({
  reviewer: z.string().min(1),
  channel: z.string().min(1),
  channel_url: z.string().url(),
  commercial_tie: z.enum(['independent', 'shop-affiliated', 'brand-sponsored']),
  title_include: z.array(z.string()),
  title_exclude: z.array(z.string()),
  max_recent: z.number().int().min(1).max(500),
})

const ReviewSourcesSchema = z.array(ReviewSourceSchema)

type ReviewSource = z.infer<typeof ReviewSourceSchema>

interface PlaylistVideo {
  id: string
  title: string
  url: string
}

interface CliArgs {
  dryRun: boolean
  reviewer?: string
  maxRecent?: number
  limit?: number
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { dryRun: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--dry-run') args.dryRun = true
    else if (a === '--reviewer' && argv[i + 1]) args.reviewer = argv[++i]
    else if (a === '--max-recent' && argv[i + 1]) args.maxRecent = parseInt(argv[++i], 10)
    else if (a === '--limit' && argv[i + 1]) args.limit = parseInt(argv[++i], 10)
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

const TRANSIENT_YTDLP_PATTERNS = [
  'http error 429',
  'too many requests',
  'timed out',
  'connection reset',
  'temporarily unavailable',
]

function sleepMs(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
}

function isTransientYtDlpError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  const detail = [
    error.message,
    (error as { stdout?: Buffer }).stdout?.toString('utf-8') ?? '',
    (error as { stderr?: Buffer }).stderr?.toString('utf-8') ?? '',
  ]
    .join('\n')
    .toLowerCase()
  return TRANSIENT_YTDLP_PATTERNS.some((pattern) => detail.includes(pattern))
}

function runYtDlp(args: string[], label: string): string {
  const maxAttempts = 3
  let lastError: unknown

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return execFileSync('yt-dlp', args, {
        encoding: 'utf-8',
        stdio: 'pipe',
        maxBuffer: 64 * 1024 * 1024,
      })
    } catch (error) {
      lastError = error
      if (!isTransientYtDlpError(error) || attempt === maxAttempts) {
        throw error
      }
      const waitMs = attempt * 5000
      console.warn(
        `yt-dlp ${label} hit a transient error (attempt ${attempt}/${maxAttempts}); retrying in ${Math.round(waitMs / 1000)}s…`,
      )
      sleepMs(waitMs)
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`yt-dlp ${label} failed`)
}

function loadSources(): ReviewSource[] {
  if (!fs.existsSync(SOURCES_FILE)) {
    console.error(`Missing source registry: ${SOURCES_FILE}`)
    process.exit(1)
  }
  const raw = fs.readFileSync(SOURCES_FILE, 'utf-8')
  return ReviewSourcesSchema.parse(JSON.parse(raw))
}

function loadAllKites(): ValidatedKite[] {
  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.json')).sort()
  return files.map((f) => {
    const raw = fs.readFileSync(path.join(DATA_DIR, f), 'utf-8')
    return KiteSchema.parse(JSON.parse(raw))
  })
}

function writeKite(kite: ValidatedKite): void {
  const file = path.join(DATA_DIR, `${kite.slug}.json`)
  KiteSchema.parse(kite)
  fs.writeFileSync(file, JSON.stringify(kite, null, 2) + '\n')
}

function channelVideosUrl(channelUrl: string): string {
  const trimmed = channelUrl.replace(/\/+$/, '')
  return trimmed.endsWith('/videos') ? trimmed : `${trimmed}/videos`
}

function fetchRecentVideos(source: ReviewSource, maxRecent: number): PlaylistVideo[] {
  const raw = runYtDlp(
    [
      '--no-warnings',
      '--flat-playlist',
      '--skip-download',
      '--playlist-end',
      String(maxRecent),
      '--dump-json',
      channelVideosUrl(source.channel_url),
    ],
    `channel listing (${source.reviewer})`,
  )

  const videos: PlaylistVideo[] = []
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    try {
      const j = JSON.parse(trimmed) as { id?: string; title?: string; webpage_url?: string; url?: string }
      if (!j.id || !j.title) continue
      const url = j.webpage_url ?? (j.url?.startsWith('http') ? j.url : `https://www.youtube.com/watch?v=${j.id}`)
      videos.push({ id: j.id, title: j.title, url })
    } catch {
      // Skip non-JSON lines from yt-dlp output.
    }
  }
  return videos
}

function checkTitleFilters(title: string, source: ReviewSource): { pass: boolean; reason?: string } {
  const lower = title.toLowerCase()

  for (const excl of source.title_exclude) {
    if (lower.includes(excl.toLowerCase())) {
      return { pass: false, reason: `excluded by "${excl}"` }
    }
  }

  if (source.title_include.length > 0) {
    const matchedInclude = source.title_include.some((inc) => lower.includes(inc.toLowerCase()))
    if (!matchedInclude) {
      return { pass: false, reason: `missing required keyword (${source.title_include.join(' | ')})` }
    }
  }

  return { pass: true }
}

function extractYearsFromTitle(title: string): number[] {
  const matches = title.match(/\b(20[12]\d)\b/g)
  if (!matches) return []
  return [...new Set(matches.map((y) => parseInt(y, 10)))]
}

interface KiteMatch {
  kite: ValidatedKite
  score: number
  exactYearMatch: boolean
}

const VARIANT_QUALIFIERS: Array<{ key: string; patterns: string[] }> = [
  { key: 'dlab', patterns: [' dlab ', ' d lab '] },
  { key: 'sls', patterns: [' sls '] },
  { key: 'nxt', patterns: [' nxt '] },
  { key: 'pro', patterns: [' pro '] },
  { key: 'ultra', patterns: [' ultra '] },
  { key: 'nvision', patterns: [' nvision '] },
  { key: 'brainchild', patterns: [' brainchild '] },
]

const WEAK_SUFFIX_TOKENS = new Set(['apex', 'air', 'team', 'lightwind', 'design', 'designer'])

function detectQualifiers(text: string): Set<string> {
  const norm = ' ' + normalize(text) + ' '
  const found = new Set<string>()
  for (const { key, patterns } of VARIANT_QUALIFIERS) {
    if (patterns.some((p) => norm.includes(p))) found.add(key)
  }
  return found
}

function scoreVideoAgainstKite(kite: ValidatedKite, video: PlaylistVideo, channelName: string, titleYears: number[]): number {
  const titleNorm = ' ' + normalize(video.title) + ' '
  const titleAlnum = normalizeAlnum(video.title)
  const brandAlnum = normalizeAlnum(kite.brand)
  if (!titleAlnum.includes(brandAlnum)) return 0

  // Prevent attaching a special-edition review (e.g. "North Reach Ultra") to a
  // base kite ("North Reach") when a variant qualifier is explicitly named.
  const titleQualifiers = detectQualifiers(video.title)
  const kiteQualifiers = detectQualifiers(kite.model)
  for (const q of titleQualifiers) {
    if (!kiteQualifiers.has(q)) return 0
  }

  let score = matchScore(kite, {
    id: video.id,
    title: video.title,
    url: video.url,
    channel: channelName,
  })

  const modelTokens = normalize(kite.model).split(' ').filter((t) => t.length >= 2)
  const fullModelAlnum = normalizeAlnum(kite.model)

  // Handle compound-word model names (e.g. "Master Model" vs "MasterModel")
  // where alnum collapse matches cleanly even though word boundaries differ.
  if (fullModelAlnum.length >= 4 && titleAlnum.includes(fullModelAlnum)) {
    const phraseScore = 40 + modelTokens.length * 20 + (titleYears.includes(kite.year) ? 25 : 0)
    score = Math.max(score, Math.min(100, phraseScore))
  }

  // Handle kites whose only unmatched model token is a weak marketing suffix
  // (e.g. "Nitro Apex" vs "Cabrinha Nitro 2027") when all distinctive tokens + exact year match.
  if (score === 0 && modelTokens.length >= 2) {
    const distinctive = modelTokens.filter((t) => !WEAK_SUFFIX_TOKENS.has(t))
    const allDistinctiveHit =
      distinctive.length > 0 && distinctive.every((t) => titleNorm.includes(' ' + t + ' '))
    if (allDistinctiveHit && titleYears.includes(kite.year)) {
      score = Math.min(100, 40 + distinctive.length * 20 + 25)
    }
  }

  return score
}

function matchVideoToKite(video: PlaylistVideo, channelName: string, kites: ValidatedKite[]): KiteMatch | null {
  const titleYears = extractYearsFromTitle(video.title)
  const candidates: Array<KiteMatch & { modelTokenCount: number }> = []

  for (const kite of kites) {
    // If the video title explicitly states a model year (e.g. 2024), don't attach
    // it to a different year's kite entry.
    if (titleYears.length > 0 && !titleYears.includes(kite.year)) {
      continue
    }

    const score = scoreVideoAgainstKite(kite, video, channelName, titleYears)

    if (score >= MIN_MATCH_SCORE) {
      const modelTokenCount = normalize(kite.model)
        .split(' ')
        .filter((t) => t.length >= 2).length
      candidates.push({
        kite,
        score,
        exactYearMatch: titleYears.includes(kite.year),
        modelTokenCount,
      })
    }
  }

  if (candidates.length === 0) return null

  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    if (a.exactYearMatch !== b.exactYearMatch) return a.exactYearMatch ? -1 : 1
    if (b.kite.year !== a.kite.year) return b.kite.year - a.kite.year
    return b.modelTokenCount - a.modelTokenCount
  })

  const best = candidates[0]
  return { kite: best.kite, score: best.score, exactYearMatch: best.exactYearMatch }
}

function vttToText(vtt: string): string {
  const lines = vtt.split('\n')
  const out: string[] = []
  let prev = ''
  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue
    if (
      line === 'WEBVTT' ||
      line.startsWith('NOTE') ||
      line.startsWith('Kind:') ||
      line.startsWith('Language:')
    ) {
      continue
    }
    if (line.includes('-->')) continue
    const stripped = line.replace(/<[^>]+>/g, '').trim()
    if (!stripped) continue
    if (stripped === prev) continue
    out.push(stripped)
    prev = stripped
  }
  return out.join(' ').replace(/\s+/g, ' ').trim()
}

function fetchTranscript(videoUrl: string): string {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ingest-indep-'))
  try {
    runYtDlp(
      [
        '--no-warnings',
        '--skip-download',
        '--write-subs',
        '--write-auto-subs',
        '--sub-lang',
        'en.*',
        '--sub-format',
        'vtt',
        '--convert-subs',
        'vtt',
        '-o',
        path.join(tmp, '%(id)s.%(ext)s'),
        videoUrl,
      ],
      'transcript fetch',
    )
    const files = fs.readdirSync(tmp).filter((f) => f.endsWith('.vtt'))
    if (files.length === 0) {
      throw new Error('No English VTT subtitle file produced')
    }
    const vtt = fs.readFileSync(path.join(tmp, files[0]), 'utf-8')
    return vttToText(vtt)
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
}

const SENTENCE_BREAK = /[.!?]\s+/g

function extractExcerpt(transcript: string, maxLen = 320): string {
  const window = transcript.slice(0, maxLen + 80)
  const matches = [...window.matchAll(SENTENCE_BREAK)]
  for (let i = matches.length - 1; i >= 0; i--) {
    const end = matches[i].index! + matches[i][0].length
    if (end <= maxLen + 80 && end >= maxLen - 80) return window.slice(0, end).trim()
  }
  return window.slice(0, maxLen).trim()
}

function extractVerdict(transcript: string, maxLen = 320): string {
  if (transcript.length <= maxLen) return transcript.trim()
  const tail = transcript.slice(-(maxLen + 80))
  const m = tail.match(SENTENCE_BREAK)
  if (m && m.index !== undefined) {
    return tail.slice(m.index + m[0].length).trim()
  }
  return tail.slice(-maxLen).trim()
}

function runProcessReviews(slug: string): void {
  console.log(`  → Running process-reviews for ${slug}…`)
  execFileSync(
    'npx',
    ['tsx', '--env-file-if-exists=.env.local', 'scripts/process-reviews.ts', '--slug', slug, '--overwrite'],
    {
      cwd: ROOT,
      stdio: 'inherit',
      env: process.env,
    },
  )
}

function main(): void {
  const args = parseArgs(process.argv.slice(2))
  checkYtDlp()

  const allSources = loadSources()
  const sources = args.reviewer
    ? allSources.filter((s) => s.reviewer.toLowerCase() === args.reviewer!.toLowerCase())
    : allSources

  if (sources.length === 0) {
    console.error(
      args.reviewer
        ? `No source matching --reviewer "${args.reviewer}" in data/review-sources.json`
        : 'No sources configured in data/review-sources.json',
    )
    process.exit(1)
  }

  // Ensure every configured source is registered in lib/reviewers.ts so
  // validate-kites will never reject ingested reviews.
  for (const src of sources) {
    const known = reviewerForChannel(src.channel_url)
    if (!known) {
      console.error(`Source "${src.reviewer}" (${src.channel_url}) is not registered in lib/reviewers.ts`)
      process.exit(1)
    }
    if (known.name !== src.reviewer) {
      console.error(
        `Source reviewer "${src.reviewer}" does not match lib/reviewers.ts name "${known.name}" for ${src.channel_url}`,
      )
      process.exit(1)
    }
  }

  const kites = loadAllKites()
  const kitesBySlug = new Map(kites.map((k) => [k.slug, k]))

  // Deduplicate across ALL existing video_id values in data/kites/*.json.
  const existingVideoIds = new Set<string>()
  for (const kite of kites) {
    for (const r of kite.reviews) {
      if (r.source === 'youtube') existingVideoIds.add(r.video_id)
    }
  }

  console.log(
    `Loaded ${sources.length} source(s), ${kites.length} kite(s), ${existingVideoIds.size} existing video ID(s)${args.dryRun ? ' — DRY RUN' : ''}\n`,
  )

  const matchedQueue: Array<{ source: ReviewSource; video: PlaylistVideo; match: KiteMatch }> = []
  let skippedExisting = 0
  let skippedFilter = 0
  let skippedUnmatched = 0

  for (const source of sources) {
    const maxRecent = args.maxRecent ?? source.max_recent
    console.log(`Checking ${source.reviewer} (${source.channel_url}, max ${maxRecent})…`)
    let videos: PlaylistVideo[]
    try {
      videos = fetchRecentVideos(source, maxRecent)
    } catch (err) {
      console.error(`  ✗ Failed to list channel: ${err instanceof Error ? err.message : err}`)
      continue
    }
    console.log(`  Found ${videos.length} recent video(s)`)

    for (const video of videos) {
      if (existingVideoIds.has(video.id)) {
        skippedExisting++
        console.log(`  [SKIP:existing]  ${video.id} — ${video.title}`)
        continue
      }

      const filter = checkTitleFilters(video.title, source)
      if (!filter.pass) {
        skippedFilter++
        console.log(`  [SKIP:filter]    ${video.id} — ${video.title} (${filter.reason})`)
        continue
      }

      const match = matchVideoToKite(video, source.channel, kites)
      if (!match) {
        skippedUnmatched++
        console.log(`  [SKIP:unmatched] ${video.id} — ${video.title}`)
        continue
      }

      matchedQueue.push({ source, video, match })
      existingVideoIds.add(video.id)
      console.log(
        `  [MATCH:${match.score}]     ${video.id} — ${video.title}  ==>  ${match.kite.slug}${match.exactYearMatch ? ' (exact year)' : ' (latest year)'}`,
      )
    }
    console.log('')
  }

  const toProcess = args.limit ? matchedQueue.slice(0, args.limit) : matchedQueue

  console.log(
    `Summary: ${matchedQueue.length} matched${args.limit ? ` (processing ${toProcess.length})` : ''}, ${skippedExisting} already ingested, ${skippedFilter} filtered out, ${skippedUnmatched} unmatched.`,
  )

  if (args.dryRun) {
    console.log('\nDry run complete — no files were modified.')
    return
  }

  if (toProcess.length === 0) {
    console.log('\nNo new reviews to ingest.')
    return
  }

  const updatedSlugs = new Set<string>()
  let ingestedCount = 0
  let failedCount = 0

  for (const item of toProcess) {
    const { source, video, match } = item
    const slug = match.kite.slug
    console.log(`\nIngesting ${video.id} (${video.title}) into ${slug}…`)
    try {
      const transcript = fetchTranscript(video.url)
      if (transcript.length < 200) {
        throw new Error(`Transcript too short (${transcript.length} chars)`)
      }
      console.log(`  ✓ Fetched transcript (${transcript.length} chars)`)

      const currentKite = kitesBySlug.get(slug)!
      const entry = {
        source: 'youtube' as const,
        reviewer: source.reviewer,
        channel: source.channel,
        channel_url: source.channel_url,
        video_id: video.id,
        video_title: video.title,
        video_url: video.url,
        excerpt: extractExcerpt(transcript),
        verdict: extractVerdict(transcript),
        full_transcript: transcript,
      }

      const nextKite: ValidatedKite = {
        ...currentKite,
        reviews: [...currentKite.reviews, entry],
      }
      writeKite(nextKite)
      kitesBySlug.set(slug, nextKite)
      updatedSlugs.add(slug)
      ingestedCount++
      console.log(`  ✓ Appended review to data/kites/${slug}.json`)
    } catch (err) {
      failedCount++
      console.error(`  ✗ Failed to ingest ${video.id}: ${err instanceof Error ? err.message : err}`)
    }
  }

  if (updatedSlugs.size > 0) {
    console.log(`\nSynthesizing structured reviews for ${updatedSlugs.size} updated kite(s)…`)
    for (const slug of updatedSlugs) {
      try {
        runProcessReviews(slug)
      } catch (err) {
        failedCount++
        console.error(`  ✗ process-reviews failed for ${slug}: ${err instanceof Error ? err.message : err}`)
      }
    }
  }

  console.log(
    `\nIngestion finished. Ingested: ${ingestedCount}, Updated kites: ${updatedSlugs.size}, Failed: ${failedCount}`,
  )
  if (failedCount > 0) process.exit(1)
}

main()
