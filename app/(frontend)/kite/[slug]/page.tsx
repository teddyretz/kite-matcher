import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllKites, getKiteBySlug } from '@/lib/getKites';
import KiteDetailClient from './KiteDetailClient';

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const kite = await getKiteBySlug(slug);
  if (!kite) return { title: 'Kite not found' };

  const title = `${kite.brand} ${kite.model} ${kite.year} Review & Specs`;
  const description = kite.structured_review?.rec_blurb || kite.summary;

  return {
    title,
    description,
    alternates: { canonical: `/kite/${kite.slug}` },
    openGraph: {
      type: 'article',
      title,
      description,
      url: `/kite/${kite.slug}`,
      images: [{ url: kite.image, alt: `${kite.brand} ${kite.model} ${kite.year}` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [kite.image],
    },
  };
}

export default async function KiteProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const [kite, allKites] = await Promise.all([
    getKiteBySlug(slug),
    getAllKites(),
  ]);

  if (!kite) {
    notFound();
  }

  const prices = kite.buy_links.new.map(link => link.price).filter(price => price > 0);
  const productData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${kite.brand} ${kite.model} ${kite.year}`,
    image: `https://findmykite.com${kite.image}`,
    description: kite.summary,
    brand: { '@type': 'Brand', name: kite.brand },
    category: 'Kitesurfing Kite',
    ...(prices.length > 0 ? {
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: 'USD',
        lowPrice: Math.min(...prices),
        highPrice: Math.max(...prices),
        offerCount: prices.length,
      },
    } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productData).replace(/</g, '\\u003c') }}
      />
      <KiteDetailClient kite={kite} allKites={allKites} />
    </>
  );
}
