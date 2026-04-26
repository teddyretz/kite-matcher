/**
 * Ingest a YouTube review video as a `youtube` entry on a kite's JSON file.
 *
 * Usage:
 *   npm run ingest-review -- --slug duotone-rebel-2025 --url https://youtu.be/abc123
 *   npm run ingest-review -- --slug X --url Y --reviewer "Jason Montreal"
 *
 * What it does:
 *   1. Calls yt-dlp to fetch English auto-generated VTT subtitles + metadata
 *      (video title, channel name, channel URL, video ID).
 *   2. Strips VTT to plain text.
 *   3. Maps the channel to a known reviewer name where possible (Jason
 *      Montreal, Kitemana, Our Kite Life), or accepts --reviewer to override.
 *   4. Appends a YouTube review entry to data/kites/<slug>.json with
 *      full_transcript filled in. excerpt + verdict are left empty —
 *      `npm run process-reviews` fills those in alongside structured_review.
 *
 * Requires `yt-dlp` on PATH (brew install yt-dlp / pip install yt-dlp).
 */
import fs from 'fs'
import os from 'os'
import path from 'path'
import { execFileSync } from 'child_process'
import { KiteSchema, type ValidatedKite } from '../lib/schema'

const ROOT = path.resolve(__dirname, '..')
const DATA_DIR = path.join(ROOT, 'data', 'kites')

interface Args {
  slug: string
  url: string
  reviewer?: string
  channel?: string
  force: boolean
}

function parseArgs(argv: string[]): Args {
  const args: Partial<Args> & { force: boolean } = { force: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--slug' && argv[i + 1]) args.slug = argv[++i]
    else if (a === '--url' && argv[i + 1]) args.url = argv[++i]
    else if (a === '--reviewer' && argv[i + 1]) args.reviewer = argv[++i]
    else if (a === '--channel' && argv[i + 1]) args.channel = argv[++i]
    else if (a === '--force') args.force = true
  }
  if (!args.slug || !args.url) {
    console.error('Usage: ingest-review --slug <slug> --url <youtube-url> [--reviewer <name>] [--channel <name>] [--force]')
    process.exit(1)
  }
  return args as Args
}

function checkYtDlp(): void {
  try {
    execFileSync('yt-dlp', ['--version'], { stdio: 'pipe' })
  } catch {
    console.error('yt-dlp not found on PATH. Install with: brew install yt-dlp  (or: pip install yt-dlp)')
    process.exit(1)
  }
}

interface YtMetadata {
  id: string
  title: string
  uploader: string
  uploader_id: string
  uploader_url: string
  webpage_url: string
}

function fetchMetadata(url: string): YtMetadata {
  const raw = execFileSync(
    'yt-dlp',
    ['--no-warnings', '--skip-download', '--dump-single-json', url],
    { encoding: 'utf-8', maxBuffer: 32 * 1024 * 1024 },
  )
  const j = JSON.parse(raw) as Partial<YtMetadata>
  if (!j.id || !j.title || !j.webpage_url) {
    throw new Error('yt-dlp metadata missing required fields')
  }
  return {
    id: j.id,
    title: j.title,
    uploader: j.uploader ?? '',
    uploader_id: j.uploader_id ?? '',
    uploader_url: j.uploader_url ?? '',
    webpage_url: j.webpage_url,
  }
}

function fetchTranscript(url: string): string {
  // Use a temp dir to keep output isolated.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ingest-'))
  try {
    execFileSync(
      'yt-dlp',
      [
        '--no-warnings',
        '--skip-download',
        '--write-auto-subs',
        '--sub-lang',
        'en.*',
        '--sub-format',
        'vtt',
        '--convert-subs',
        'vtt',
        '-o',
        path.join(tmp, '%(id)s.%(ext)s'),
        url,
      ],
      { stdio: 'pipe' },
    )
    const files = fs.readdirSync(tmp).filter((f) => f.endsWith('.vtt'))
    if (files.length === 0) {
      throw new Error('No VTT subtitle file produced — does the video have English auto-captions?')
    }
    const vtt = fs.readFileSync(path.join(tmp, files[0]), 'utf-8')
    return vttToText(vtt)
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
}

function vttToText(vtt: string): string {
  const lines = vtt.split('\n')
  const out: string[] = []
  let prev = ''
  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue
    if (line === 'WEBVTT' || line.startsWith('NOTE') || line.startsWith('Kind:') || line.startsWith('Language:')) continue
    if (line.includes('-->')) continue
    // Strip VTT inline tags like <c>, <00:00:00.000>, etc.
    const stripped = line.replace(/<[^>]+>/g, '').trim()
    if (!stripped) continue
    // YouTube auto-captions often duplicate consecutive lines; dedupe.
    if (stripped === prev) continue
    out.push(stripped)
    prev = stripped
  }
  return out.join(' ').replace(/\s+/g, ' ').trim()
}

const SENTENCE_BREAK = /[.!?]\s+/g

// First ~250 chars, ended on a sentence boundary if possible.
function extractExcerpt(transcript: string, maxLen = 320): string {
  const window = transcript.slice(0, maxLen + 80)
  const matches = [...window.matchAll(SENTENCE_BREAK)]
  for (let i = matches.length - 1; i >= 0; i--) {
    const end = matches[i].index! + matches[i][0].length
    if (end <= maxLen + 80 && end >= maxLen - 80) return window.slice(0, end).trim()
  }
  return window.slice(0, maxLen).trim()
}

// Last ~250 chars, started on a sentence boundary if possible.
function extractVerdict(transcript: string, maxLen = 320): string {
  if (transcript.length <= maxLen) return transcript.trim()
  const tail = transcript.slice(-(maxLen + 80))
  const m = tail.match(SENTENCE_BREAK)
  if (m && m.index !== undefined) {
    return tail.slice(m.index + m[0].length).trim()
  }
  return tail.slice(-maxLen).trim()
}

// Known kite-review channels. Keys are stored lower-cased; lookup is
// case-insensitive (yt-dlp returns the @handle with whatever capitalization
// the channel set, which can vary between videos).
//
// To add a reviewer: drop their @handle (lower-cased) into this map. If a
// channel has multiple hosts (e.g. MACkite has Tucker, Joey, Lucas), set
// `reviewer` to the channel name and pass `--reviewer "Host Name"` per
// ingest call when you want the host credited specifically.
const REVIEWER_BY_UPLOADER_ID: Record<string, { reviewer: string; channel: string }> = {
  '@jasonofmontreal':       { reviewer: 'Jason Montreal', channel: 'Jason Montreal' },
  '@kitemana':              { reviewer: 'Kitemana',       channel: 'Kitemana' },
  '@ourkitelife':           { reviewer: 'Our Kite Life',  channel: 'Our Kite Life' },
  '@mackiteboarding':       { reviewer: 'MACkite',        channel: 'MACkite' },
  '@mackiteboardingofficial': { reviewer: 'MACkite',      channel: 'MACkite' },
  '@mackite':               { reviewer: 'MACkite',        channel: 'MACkite' },
}

function lookupReviewer(uploaderId: string | undefined) {
  if (!uploaderId) return undefined
  return REVIEWER_BY_UPLOADER_ID[uploaderId.toLowerCase()]
}

function loadKite(slug: string): { kite: ValidatedKite; file: string } {
  const file = path.join(DATA_DIR, `${slug}.json`)
  if (!fs.existsSync(file)) {
    console.error(`No kite at ${file}. Check the slug against data/kites/.`)
    process.exit(1)
  }
  const raw = fs.readFileSync(file, 'utf-8')
  const parsed = KiteSchema.parse(JSON.parse(raw))
  return { kite: parsed, file }
}

function writeKite(file: string, kite: ValidatedKite): void {
  fs.writeFileSync(file, JSON.stringify(kite, null, 2) + '\n')
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  checkYtDlp()

  const { kite, file } = loadKite(args.slug)

  console.log(`Fetching metadata for ${args.url}…`)
  const meta = fetchMetadata(args.url)

  // De-dupe: don't ingest the same video twice.
  const existing = kite.reviews.find(
    (r) => r.source === 'youtube' && r.video_id === meta.id,
  )
  if (existing && !args.force) {
    console.log(`Already have a review for video ${meta.id} on ${args.slug}. Use --force to overwrite.`)
    process.exit(0)
  }

  console.log(`Fetching transcript…`)
  const transcript = fetchTranscript(args.url)
  console.log(`  ${transcript.length} chars (~${Math.round(transcript.length / 4)} tokens)`)

  const known = lookupReviewer(meta.uploader_id)
  const reviewer = args.reviewer ?? known?.reviewer ?? meta.uploader
  const channel = args.channel ?? known?.channel ?? meta.uploader

  const entry = {
    source: 'youtube' as const,
    reviewer,
    channel,
    channel_url: meta.uploader_url,
    video_id: meta.id,
    video_title: meta.title,
    video_url: meta.webpage_url,
    excerpt: extractExcerpt(transcript),
    verdict: extractVerdict(transcript),
    full_transcript: transcript,
  }

  const nextReviews = existing
    ? kite.reviews.map((r) =>
        r.source === 'youtube' && r.video_id === meta.id ? entry : r,
      )
    : [...kite.reviews, entry]

  const nextKite: ValidatedKite = { ...kite, reviews: nextReviews }
  // Re-validate before writing so a regression in this script can't ship bad data.
  KiteSchema.parse(nextKite)
  writeKite(file, nextKite)

  console.log(`\n✓ ${existing ? 'Updated' : 'Added'} ${reviewer} review on ${args.slug}`)
  console.log(`  title:   ${meta.title}`)
  console.log(`  channel: ${channel}`)
  console.log(`  video:   ${meta.webpage_url}`)
  console.log(`\nNext: npm run process-reviews -- --slug ${args.slug}`)
}

main()
