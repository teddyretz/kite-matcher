/**
 * Append a human-approved Reddit/Kiteforum owner thread to a kite as a `forum` review.
 *
 * Read the thread yourself first. Count only posters who say they own the kite,
 * and only for the model year this kite file describes.
 *
 * Usage:
 *   npm run add-owner-report -- --slug slingshot-code-v2-2025 \
 *     --url "https://kiteforum.com/viewtopic.php?t=2418786" --platform kiteforum \
 *     --title "Slingshot code v1 compared to v2" --posted 2024-10 --year 2025 \
 *     --owners 3 --excerpt "short verbatim quote" \
 *     --summary "What the owners agreed on, in your words." --approved-by Ted
 */
import fs from 'fs'
import path from 'path'
import { KiteSchema } from '../lib/schema'

const DATA_DIR = path.join(path.resolve(__dirname, '..'), 'data', 'kites')

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`)
  return i > -1 ? process.argv[i + 1] : undefined
}

function main() {
  const slug = arg('slug')
  const required = ['slug', 'url', 'platform', 'title', 'posted', 'owners', 'excerpt', 'summary', 'approved-by']
  const missing = required.filter((r) => !arg(r))
  if (missing.length) {
    console.error(`Missing --${missing.join(', --')}. See the header of this script for usage.`)
    process.exit(1)
  }
  const file = path.join(DATA_DIR, `${slug}.json`)
  if (!fs.existsSync(file)) {
    console.error(`No kite file for slug "${slug}"`)
    process.exit(1)
  }
  const kite = JSON.parse(fs.readFileSync(file, 'utf-8'))
  const url = arg('url')!
  if (kite.reviews.some((r: { thread_url?: string }) => r.thread_url === url)) {
    console.error('That thread is already on this kite.')
    process.exit(1)
  }
  const year = arg('year')
  kite.reviews.push({
    source: 'forum',
    platform: arg('platform'),
    thread_url: url,
    thread_title: arg('title'),
    posted: arg('posted'),
    kite_year_discussed: year ? Number(year) : null,
    owner_count: Number(arg('owners')),
    excerpt: arg('excerpt'),
    summary: arg('summary'),
    approved_by: arg('approved-by'),
  })
  const parsed = KiteSchema.safeParse(kite)
  if (!parsed.success) {
    for (const issue of parsed.error.issues) console.error(`  ${issue.path.join('.')}: ${issue.message}`)
    process.exit(1)
  }
  fs.writeFileSync(file, JSON.stringify(kite, null, 2) + '\n')
  console.log(`Added owner report to ${slug}. Run npm run validate-kites to check model-year rules.`)
}

main()
