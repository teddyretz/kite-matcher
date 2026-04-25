import Link from 'next/link';
import type { Metadata } from 'next';
import { getAllKites, getKiteBySlug } from '@/lib/getKites';
import { SITE_URL, kiteJsonLd } from '@/lib/seo';
import KiteDetailClient from './KiteDetailClient';

export async function generateStaticParams() {
  const kites = await getAllKites();
  return kites.map((k) => ({ slug: k.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const kite = await getKiteBySlug(slug);
  if (!kite) {
    return {
      title: 'Kite not found — FindMyKite',
      robots: { index: false },
    };
  }

  const title = `${kite.brand} ${kite.model} ${kite.year} — Review, Specs & Where to Buy`;
  const description =
    kite.structured_review?.summary ?? kite.structured_review?.rec_blurb ?? kite.summary;
  const image = `${SITE_URL}/kites/${kite.slug}.jpg`;
  const url = `${SITE_URL}/kite/${kite.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      siteName: 'FindMyKite',
      images: [{ url: image, width: 1200, height: 630, alt: `${kite.brand} ${kite.model}` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default async function KiteProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [kite, allKites] = await Promise.all([
    getKiteBySlug(slug),
    getAllKites(),
  ]);

  if (!kite) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-slate mb-4">Kite not found</h1>
        <Link href="/kites" className="text-ocean hover:underline">Browse all kites</Link>
      </div>
    );
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(kiteJsonLd(kite)) }}
      />
      <KiteDetailClient kite={kite} allKites={allKites} />
    </>
  );
}
