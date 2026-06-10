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
  const description = `${zone.blurb} Compare ${count} ${zone.label.toLowerCase()} kites ranked by independent review scores, with specs and where to buy.`;
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
      { name: 'Browse', url: `${SITE_URL}/kites` },
      { name: zone.label, url: `${SITE_URL}/kites/${zone.slug}` },
    ]),
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/kites" className="hover:text-ocean">Browse</Link>
        <span className="mx-2">/</span>
        <span className="text-slate">{zone.label}</span>
      </nav>

      <h1 className="font-display font-black italic text-4xl sm:text-5xl uppercase tracking-tight text-white mb-3">
        Best <span className="text-ocean">{zone.label}</span> Kites {year}
      </h1>
      <p className="text-gray-500 max-w-2xl mb-2">{zone.blurb}</p>
      <p className="text-sm text-gray-400 mb-8">
        {reviewed} of these {kites.length} kites have independent review summaries — those rank first,
        highest-rated on top. Not sure {zone.label.toLowerCase()} is your style?{' '}
        <Link href="/" className="text-ocean hover:underline">Take the matcher</Link>.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {kites.map((kite) => (
          <KiteCard key={kite.id} kite={kite} />
        ))}
      </div>

      <div className="mt-12 pt-8 border-t border-gray-100">
        <h2 className="text-sm font-semibold tracking-widest uppercase text-gray-500 mb-3">
          Other styles
        </h2>
        <div className="flex flex-wrap gap-2">
          {STYLE_ZONES.filter((z) => z.slug !== zone.slug).map((z) => (
            <Link
              key={z.slug}
              href={`/kites/${z.slug}`}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-full text-gray-500 hover:border-ocean hover:text-ocean transition-colors"
            >
              {z.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
