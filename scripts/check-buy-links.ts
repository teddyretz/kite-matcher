import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { normalizeBuyLinkUrl } from '../lib/buyLinks';

type BuyLinkRecord = {
  slug: string;
  kind: 'new' | 'used';
  retailer: string;
  url: string;
};

const DATA_DIR = path.join(process.cwd(), 'data', 'kites');

function getArgValue(flag: string): string | null {
  const argv = process.argv.slice(2);
  const index = argv.indexOf(flag);
  if (index === -1) return null;
  return argv[index + 1] ?? null;
}

async function checkUrl(url: string): Promise<{ status: number | null; finalUrl: string | null; error: string | null }> {
  try {
    const output = execFileSync(
      'curl',
      [
        '-L',
        '--retry',
        '2',
        '--retry-all-errors',
        '--max-time',
        '10',
        '-A',
        'Mozilla/5.0 (compatible; FindMyKite link audit/1.0)',
        '-o',
        '/dev/null',
        '-sS',
        '-w',
        '%{http_code} %{url_effective}',
        url,
      ],
      { encoding: 'utf-8' },
    ).trim();

    const firstSpace = output.indexOf(' ');
    const status = firstSpace === -1 ? Number(output) : Number(output.slice(0, firstSpace));
    const finalUrl = firstSpace === -1 ? url : output.slice(firstSpace + 1).trim();

    return {
      status: Number.isFinite(status) ? status : null,
      finalUrl: finalUrl || null,
      error: null,
    };
  } catch (error) {
    return {
      status: null,
      finalUrl: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main() {
  const limit = Number(getArgValue('--limit') ?? '0') || 0;
  const domainFilter = getArgValue('--domain');
  const concurrency = Number(getArgValue('--concurrency') ?? '8') || 8;

  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.json')).sort();
  const links: BuyLinkRecord[] = [];

  for (const file of files) {
    const raw = fs.readFileSync(path.join(DATA_DIR, file), 'utf-8');
    const kite = JSON.parse(raw);

    for (const link of kite.buy_links.new as Array<{ retailer: string; url: string }>) {
      links.push({ slug: kite.slug, kind: 'new', retailer: link.retailer, url: link.url });
    }

    for (const link of kite.buy_links.used as Array<{ source: string; url: string }>) {
      links.push({ slug: kite.slug, kind: 'used', retailer: link.source, url: link.url });
    }
  }

  let filteredLinks = links;
  if (domainFilter) {
    filteredLinks = filteredLinks.filter((link) => {
      try {
        return new URL(link.url).hostname.includes(domainFilter);
      } catch {
        return false;
      }
    });
  }
  if (limit > 0) filteredLinks = filteredLinks.slice(0, limit);

  const failures: Array<BuyLinkRecord & { normalizedUrl: string; status: number | null; finalUrl: string | null; error: string | null }> = [];

  for (let i = 0; i < filteredLinks.length; i += concurrency) {
    const batch = filteredLinks.slice(i, i + concurrency);
    const results = await Promise.all(
      batch.map(async (link) => {
        const normalizedUrl = normalizeBuyLinkUrl(link.url);
        const result = await checkUrl(normalizedUrl);
        return { link, normalizedUrl, result };
      }),
    );

    for (const { link, normalizedUrl, result } of results) {
      if (result.error || (result.status !== null && result.status >= 400)) {
        failures.push({ ...link, normalizedUrl, ...result });
      }
    }
  }

  if (failures.length === 0) {
    console.log(`All ${filteredLinks.length} checked buy links resolved successfully.`);
    return;
  }

  console.log(JSON.stringify({
    checked: filteredLinks.length,
    failed: failures.length,
    failures,
  }, null, 2));
  process.exitCode = 1;
}

void main();