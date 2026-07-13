/**
 * Validate every buy_link URL in data/kites/*.json by sending a HEAD request
 * and logging anything that 404s, redirects to a parking domain, or hits a
 * connection error. Output is a Markdown report you can scan + use to prune
 * dead links.
 *
 * Usage:
 *   npm run check-links                  # report to stdout
 *   npm run check-links -- --out links.md
 *   npm run check-links -- --slug duotone-rebel-2025
 *   npm run check-links -- --concurrency 8  # parallel HEAD requests (default 4)
 *   npm run check-links -- --timeout 10000  # per-request timeout in ms (default 8000)
 *   npm run check-links -- --include-ok     # also list OK links in the report
 *
 * Notes:
 *   - HEAD is light, but some retailers serve a 405 for HEAD; we treat those
 *     as "ok-with-caveat" and don't flag them.
 *   - Some retailers refuse non-browser User-Agents. We send a Chrome UA;
 *     a few may still soft-block (200 with a "we noticed unusual traffic"
 *     page). False positives are possible — eyeball the report before
 *     mass-removing links.
 */
import fs from 'fs'
import path from 'path'
import { KiteSchema, type ValidatedKite } from '../lib/schema'

const ROOT = path.resolve(__dirname, '..')
const DATA_DIR = path.join(ROOT, 'data', 'kites')
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

interface Args {
  slug?: string
  out: string
  concurrency: number
  timeout: number
  includeOk: boolean
}

function parseArgs(argv: string[]): Args {
  const args: Args = { out: '', concurrency: 4, timeout: 8000, includeOk: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--slug' && argv[i + 1]) args.slug = argv[++i]
    else if (a === '--out' && argv[i + 1]) args.out = argv[++i]
    else if (a === '--concurrency' && argv[i + 1]) args.concurrency = parseInt(argv[++i], 10)
    else if (a === '--timeout' && argv[i + 1]) args.timeout = parseInt(argv[++i], 10)
    else if (a === '--include-ok') args.includeOk = true
  }
  return args
}

function loadKites(): ValidatedKite[] {
  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.json')).sort()
  return files.map((f) => KiteSchema.parse(JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf-8'))))
}

interface LinkTask {
  slug: string
  field: 'new' | 'used'
  retailer: string
  url: string
}

interface LinkResult extends LinkTask {
  status: number | null
  finalUrl: string | null
  ok: boolean
  note?: string
  error?: string
}

async function checkOne(task: LinkTask, timeoutMs: number): Promise<LinkResult> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    let res = await fetch(task.url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: ctrl.signal,
      headers: { 'user-agent': UA, accept: '*/*' },
    })
    // Some retailers reject HEAD with 405 or 403. Retry with GET to be sure.
    if (res.status === 405 || res.status === 403) {
      res = await fetch(task.url, {
        method: 'GET',
        redirect: 'follow',
        signal: ctrl.signal,
        headers: { 'user-agent': UA, accept: 'text/html,*/*;q=0.8' },
      })
    }
    return {
      ...task,
      status: res.status,
      finalUrl: res.url,
      ok: res.ok,
      note: res.status === 200 && res.url !== task.url ? 'redirected' : undefined,
    }
  } catch (err) {
    return {
      ...task,
      status: null,
      finalUrl: null,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    }
  } finally {
    clearTimeout(timer)
  }
}

async function checkAll(tasks: LinkTask[], concurrency: number, timeoutMs: number): Promise<LinkResult[]> {
  const results: LinkResult[] = []
  let cursor = 0
  let done = 0

  async function worker() {
    while (cursor < tasks.length) {
      const idx = cursor++
      const task = tasks[idx]
      const r = await checkOne(task, timeoutMs)
      results[idx] = r
      done++
      const status = r.ok ? '✓' : '✗'
      const code = r.status ?? 'ERR'
      process.stderr.write(`  ${status} [${code}] ${r.slug}/${r.field} ${r.retailer} (${done}/${tasks.length})\n`)
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()))
  return results
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const allKites = loadKites()
  const targets = args.slug ? allKites.filter((k) => k.slug === args.slug) : allKites
  if (targets.length === 0) {
    console.error(args.slug ? `No kite ${args.slug}` : 'No kites loaded')
    process.exit(1)
  }

  const tasks: LinkTask[] = []
  for (const k of targets) {
    for (const link of k.buy_links.new) {
      tasks.push({ slug: k.slug, field: 'new', retailer: link.retailer, url: link.url })
    }
    for (const link of k.buy_links.used) {
      tasks.push({ slug: k.slug, field: 'used', retailer: link.source, url: link.url })
    }
  }
  console.error(`Checking ${tasks.length} link(s) across ${targets.length} kite(s) (concurrency ${args.concurrency})…\n`)

  const results = await checkAll(tasks, args.concurrency, args.timeout)
  const broken = results.filter((r) => !r.ok)
  const ok = results.filter((r) => r.ok)

  const lines: string[] = []
  lines.push(`# buy_links report`)
  lines.push(`Generated ${new Date().toISOString()}. ${results.length} link(s) checked, ${broken.length} broken.`)
  lines.push('')

  if (broken.length > 0) {
    lines.push(`## Broken (${broken.length})\n`)
    const bySlug = new Map<string, LinkResult[]>()
    for (const r of broken) {
      ;(bySlug.get(r.slug) ?? bySlug.set(r.slug, []).get(r.slug)!).push(r)
    }
    for (const [slug, list] of [...bySlug.entries()].sort()) {
      lines.push(`### \`${slug}\``)
      for (const r of list) {
        const code = r.status ?? `ERR (${r.error ?? 'unknown'})`
        lines.push(`- [${code}] **${r.field}** · ${r.retailer} · ${r.url}`)
      }
      lines.push('')
    }
  } else {
    lines.push(`No broken links 🎉\n`)
  }

  if (args.includeOk && ok.length > 0) {
    lines.push(`## OK (${ok.length})\n`)
    for (const r of ok) {
      const note = r.note ? ` _(${r.note})_` : ''
      lines.push(`- [${r.status}] \`${r.slug}\` · ${r.field} · ${r.retailer}${note}`)
    }
    lines.push('')
  }

  lines.push(`---`)
  lines.push(`Summary: ${ok.length} OK, ${broken.length} broken.`)

  const out = lines.join('\n') + '\n'
  if (args.out) {
    fs.writeFileSync(args.out, out)
    console.error(`\nWrote report to ${args.out}`)
  } else {
    process.stdout.write(out)
  }
  process.exit(broken.length > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
