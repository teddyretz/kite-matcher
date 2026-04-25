import type { Kite } from './types';

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://kitematch.com';

export function kiteJsonLd(kite: Kite): Record<string, unknown> {
  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${kite.brand} ${kite.model} ${kite.year}`,
    description: kite.summary,
    image: `${SITE_URL}/kites/${kite.slug}.jpg`,
    brand: { '@type': 'Brand', name: kite.brand },
    sku: kite.slug,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      price: kite.price_new,
      availability: kite.discontinued
        ? 'https://schema.org/Discontinued'
        : 'https://schema.org/InStock',
      url: `${SITE_URL}/kite/${kite.slug}`,
    },
  };

  if (kite.structured_review && kite.structured_review.sources.length > 0) {
    ld.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: kite.structured_review.rating,
      bestRating: 5,
      worstRating: 0,
      ratingCount: kite.structured_review.sources.length,
      reviewCount: kite.structured_review.sources.length,
    };
  }

  return ld;
}
