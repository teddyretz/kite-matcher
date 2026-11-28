import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getActiveKites } from '@/lib/getKites';
import { SITE_URL, STYLE_ZONES, breadcrumbJsonLd, kiteListJsonLd, sortForListing, styleZoneForKite } from '@/lib/seo';
import KiteCard from '@/components/KiteCard';

export const dynamicParams = false;

export function generateStaticParams() {
  return STYLE_ZONES.map((z) => ({ style: z.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ style: string }>;
}): Promise<Metadata> {
  const { style } = await params;
  const zone = STYLE_ZONES.find((z) => z.slug === style);
  if (!zone) return { title: 'Not found', robots: { index: false } };

  const kites = await getActiveKites();
  const count = kites.filter((k) => styleZoneForKite(k).slug === zone.slug).length;
  const year = new Date().getFullYear();
  const title = `Best ${zone.label} Kites ${year} — ${count} Kites Ranked & Reviewed`;
  const description = `${zone.blurb} Compare ${count} ${zone.label.toLowerCase()} kites with specs and source-labeled reviews.`;
  const url = `${SITE_URL}/kites/${zone.slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: 'FindMyKite' },
  };
}

export default async function StylePage({ params }: { params: Promise<{ style: string }> }) {
  const { style } = await params;
  const zone = STYLE_ZONES.find((z) => z.slug === style);
  if (!zone) notFound();

  const all = await getActiveKites();
  const kites = sortForListing(all.filter((k) => styleZoneForKite(k).slug === zone.slug));
  const reviewed = kites.filter((k) => k.structured_review).length;
  const year = new Date().getFullYear();

  const jsonLd = [
    kiteListJsonLd(`Best ${zone.label} kites ${year}`, kites),
    breadcrumbJsonLd([
      { name: 'Index', url: `${SITE_URL}/kites` },
      { name: zone.label, url: `${SITE_URL}/kites/${zone.slug}` },
    ]),
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="mb-5 font-mono text-xs text-gray-500">
        <Link href="/kites" className="hover:text-ocean">Index</Link>
        <span className="mx-2">/</span>
        <span className="text-slate">{zone.label}</span>
      </nav>

      <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate sm:text-4xl">
        {zone.label} Kites ({year})
      </h1>
      <p className="mb-2 max-w-2xl text-sm text-gray-600">{zone.blurb}</p>
      <p className="mb-6 font-mono text-xs text-gray-500">
        {reviewed} of {kites.length} kites have review summaries. Want personalized sizing?{' '}
        <Link href="/" className="text-ocean hover:underline">Open the matcher →</Link>
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {kites.map((kite) => (
          <KiteCard key={kite.id} kite={kite} />
        ))}
      </div>

      <div className="mt-10 border-t border-gray-200 pt-6">
        <h2 className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
          Other disciplines
        </h2>
        <div className="flex flex-wrap gap-2">
          {STYLE_ZONES.filter((z) => z.slug !== zone.slug).map((z) => (
            <Link
              key={z.slug}
              href={`/kites/${z.slug}`}
              className="border border-gray-200 bg-card px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:border-ocean hover:text-ocean"
            >
              {z.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
