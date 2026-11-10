import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllKites, getKiteBySlug } from '@/lib/getKites';
import { getRelatedKites } from '@/lib/matcher';
import { SITE_URL, kiteJsonLd, breadcrumbJsonLd, brandSlug } from '@/lib/seo';
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
      title: 'Kite not found',
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

  if (!kite) notFound();

  // Picked here so the page ships three kites to the browser, not the whole catalog.
  const related = getRelatedKites(kite, allKites, 3);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            kiteJsonLd(kite),
            breadcrumbJsonLd([
              { name: 'Browse', url: `${SITE_URL}/kites` },
              { name: kite.brand, url: `${SITE_URL}/brand/${brandSlug(kite.brand)}` },
              { name: `${kite.model} ${kite.year}`, url: `${SITE_URL}/kite/${kite.slug}` },
            ]),
          ]),
        }}
      />
      <KiteDetailClient kite={kite} related={related} />
    </>
  );
}
