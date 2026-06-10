import type { Kite } from './types';

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://findmykite.com';

export function brandSlug(brand: string): string {
  return brand.toLowerCase().replace(/\s+/g, '-');
}

export interface StyleZone {
  slug: string;
  label: string;
  min: number;
  max: number;
  blurb: string;
}

// Mirrors the style_spectrum zones: Foil(0-20), Surf(21-40), Freestyle(41-60),
// Freeride(61-80), Big Air(81-100).
export const STYLE_ZONES: StyleZone[] = [
  {
    slug: 'foil',
    label: 'Foil',
    min: 0,
    max: 20,
    blurb:
      'Light, drifty kites built for hydrofoiling — easy low-end power, stable at the edge of the window, and forgiving when the wind goes soft.',
  },
  {
    slug: 'surf',
    label: 'Surf & Wave',
    min: 21,
    max: 40,
    blurb:
      'Wave kites prioritize drift, fast pivot turns, and instant depower so the kite stays out of your way on a wave face.',
  },
  {
    slug: 'freestyle',
    label: 'Freestyle',
    min: 41,
    max: 60,
    blurb:
      'Freestyle and C-style kites with the pop, slack, and predictable arc you need for unhooked tricks and kickers.',
  },
  {
    slug: 'freeride',
    label: 'Freeride',
    min: 61,
    max: 80,
    blurb:
      'All-round kites that make sessions easy: forgiving relaunch, big depower range, and comfortable cruising for the widest range of riders.',
  },
  {
    slug: 'big-air',
    label: 'Big Air',
    min: 81,
    max: 100,
    blurb:
      'High-aspect boosting machines — maximum lift, hangtime, and loop recovery for riders chasing height.',
  },
];

export function styleZoneForKite(kite: Kite): StyleZone {
  return (
    STYLE_ZONES.find((z) => kite.style_spectrum >= z.min && kite.style_spectrum <= z.max) ??
    STYLE_ZONES[STYLE_ZONES.length - 1]
  );
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function kiteListJsonLd(name: string, kites: Kite[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: kites.length,
    itemListElement: kites.map((k, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: `${k.brand} ${k.model} ${k.year}`,
      url: `${SITE_URL}/kite/${k.slug}`,
    })),
  };
}

// Rating-first ordering for category/brand pages: reviewed kites by rating,
// unreviewed after, alphabetical within ties.
export function sortForListing(kites: Kite[]): Kite[] {
  return [...kites].sort((a, b) => {
    const ra = a.structured_review?.rating ?? -1;
    const rb = b.structured_review?.rating ?? -1;
    if (rb !== ra) return rb - ra;
    return `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`);
  });
}

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

  // Only emit AggregateRating when it reflects 2+ independent source
  // reviewers. Single-source ratings are AI-distilled from one video and
  // shouldn't be surfaced as star snippets in search.
  if (kite.structured_review && kite.structured_review.sources.length >= 2) {
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
