import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getActiveKites } from '@/lib/getKites';
import { SITE_URL, brandSlug, breadcrumbJsonLd, kiteListJsonLd, sortForListing, styleZoneForKite } from '@/lib/seo';
import KiteCard from '@/components/KiteCard';

export const dynamicParams = false;

export async function generateStaticParams() {
  const kites = await getActiveKites();
  const brands = [...new Set(kites.map((k) => brandSlug(k.brand)))];
  return brands.map((brand) => ({ brand }));
}

async function getBrandKites(param: string) {
  const kites = await getActiveKites();
  const matches = kites.filter((k) => brandSlug(k.brand) === param);
  return matches.length > 0 ? { name: matches[0].brand, kites: sortForListing(matches) } : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ brand: string }>;
}): Promise<Metadata> {
  const { brand } = await params;
  const data = await getBrandKites(brand);
  if (!data) return { title: 'Brand not found', robots: { index: false } };

  const years = data.kites.map((k) => k.year);
  const title = `${data.name} Kites — ${Math.min(...years)}–${Math.max(...years)} Lineup, Reviews & Specs`;
  const description = `Compare all ${data.kites.length} ${data.name} kites side by side: independent review summaries, specs, style placement, and where to buy.`;
  const url = `${SITE_URL}/brand/${brand}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: 'FindMyKite' },
  };
}

export default async function BrandPage({ params }: { params: Promise<{ brand: string }> }) {
  const { brand } = await params;
  const data = await getBrandKites(brand);
  if (!data) notFound();

  const { name, kites } = data;
  const zones = [...new Set(kites.map((k) => styleZoneForKite(k).label))];
  const reviewed = kites.filter((k) => k.structured_review).length;

  const jsonLd = [
    kiteListJsonLd(`${name} kites`, kites),
    breadcrumbJsonLd([
      { name: 'Browse', url: `${SITE_URL}/kites` },
      { name, url: `${SITE_URL}/brand/${brand}` },
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
        <span className="text-slate">{name}</span>
      </nav>

      <h1 className="font-display font-black italic text-4xl sm:text-5xl uppercase tracking-tight text-white mb-3">
        {name} <span className="text-ocean">Kites</span>
      </h1>
      <p className="text-gray-500 max-w-2xl mb-2">
        All {kites.length} current {name} kites in our catalog, covering {zones.join(', ')}.
        {reviewed > 0 && (
          <> {reviewed} of them have independent review summaries distilled from video reviews — ranked highest-rated first.</>
        )}
      </p>
      <p className="text-sm text-gray-400 mb-8">
        <Link href="/kites" className="text-ocean hover:underline">Browse every brand</Link>
        {' '}or{' '}
        <Link href="/" className="text-ocean hover:underline">take the style matcher</Link>{' '}
        to see which kite fits how you ride.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {kites.map((kite) => (
          <KiteCard key={kite.id} kite={kite} />
        ))}
      </div>
    </div>
  );
}
