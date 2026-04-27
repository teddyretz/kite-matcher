/**
 * Shared scoring + types for candidate-discovery scripts.
 * Used by scripts/find-candidates.ts (channel sweep) and
 * scripts/search-candidates.ts (per-kite YouTube search).
 *
 * Takes a structurally-typed `KiteInput` so it works equally with
 * the Zod-inferred ValidatedKite and the hand-written Kite interface
 * (they differ in nullable fields the scorer doesn't touch).
 */

export interface Video {
  id: string
  title: string
  url: string
  channel: string
}

export interface KiteInput {
  brand: string
  model: string
  year: number
}

export interface ReviewChannel {
  name: string
  url: string
}

const NOISE_MODEL_TOKENS = new Set([
  'pro', 'sls', 'dlab', 'nxt', 'mk2', 'mk3',
  'v2', 'v3', 'v4', 'v5', 'v6', 'v7', 'v8', 'v9',
  'v10', 'v11', 'v12', 'v13', 'v14', 'v15',
])

const YEARS_TO_DISCRIMINATE = [2023, 2024, 2025, 2026, 2027]

export function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim()
}

export function normalizeAlnum(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '')
}

// Detect a variant qualifier (SLS / D-Lab / NXT / Pro) in the given text.
// Returns the canonical key, or null if no qualifier is present.
export function detectVariant(text: string): string | null {
  const norm = ' ' + normalize(text) + ' '
  if (norm.includes(' sls ')) return 'sls'
  if (norm.includes(' dlab ') || norm.includes(' d lab ')) return 'dlab'
  if (norm.includes(' nxt ')) return 'nxt'
  if (norm.includes(' pro ')) return 'pro'
  return null
}

/**
 * Score how likely a video title is to be a review of the given kite, 0-100.
 *
 * Rules (returns 0 if any required check fails):
 * - Brand match: alnum-collapsed brand must be substring of alnum-collapsed title.
 * - Strong model token match: at least one non-noise model token (length ≥ 2)
 *   must appear as a whole word.
 *
 * Bonuses / penalties:
 * - +20 per model token hit (counted up to total tokens, after base)
 * - +25 if kite year appears in title
 * - −35 if a different year (2023-2027) appears
 * - −40 if " board " whole word appears (catches twin-tip reviews)
 * - −40 if title states a different variant qualifier than the kite
 *   (asymmetric: only when title is explicit; generic title doesn't penalize)
 */
export function matchScore(kite: KiteInput, video: Video): number {
  const titleNorm = ' ' + normalize(video.title) + ' '
  const titleAlnum = normalizeAlnum(video.title)

  const brandAlnum = normalizeAlnum(kite.brand)
  if (!titleAlnum.includes(brandAlnum)) return 0

  const modelTokens = normalize(kite.model).split(' ').filter((t) => t.length >= 2)
  const isHit = (t: string) => titleNorm.includes(' ' + t + ' ')
  const strongHits = modelTokens.filter((t) => !NOISE_MODEL_TOKENS.has(t) && isHit(t)).length
  if (strongHits === 0) return 0

  const totalHits = modelTokens.filter(isHit).length
  let score = 40 + totalHits * 20

  const yearStr = String(kite.year)
  if (titleNorm.includes(' ' + yearStr + ' ') || titleAlnum.includes(yearStr)) {
    score += 25
  }
  for (const y of YEARS_TO_DISCRIMINATE) {
    if (y !== kite.year && (titleNorm.includes(' ' + y + ' ') || titleAlnum.includes(String(y)))) {
      score -= 35
      break
    }
  }

  if (titleNorm.includes(' board ')) score -= 40

  const kiteVariant = detectVariant(kite.model)
  const titleVariant = detectVariant(video.title)
  if (titleVariant !== null && titleVariant !== kiteVariant) score -= 40

  return Math.max(0, Math.min(100, score))
}
