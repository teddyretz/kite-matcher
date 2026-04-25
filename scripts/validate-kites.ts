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
  }

  if (invalid === 0) {
    console.log(`✓ ${files.length} kite file(s) validated`)
    process.exit(0)
  }
  console.error(`\n${invalid} of ${files.length} kite file(s) failed validation.`)
  process.exit(1)
}

main()
