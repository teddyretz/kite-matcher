import type { DisciplineKey, Kite } from './types';

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://findmykite.com';

export function brandSlug(brand: string): string {
  return brand.toLowerCase().replace(/\s+/g, '-');
}

export interface StyleZone {
  slug: string;
  discipline: DisciplineKey;
  label: string;
  blurb: string;
}

export const STYLE_ZONES: StyleZone[] = [
  {
    slug: 'foil',
    discipline: 'foil',
    label: 'Foil',
    blurb:
      'Light, drifty kites built for hydrofoiling — strong low-end pull, stable at the edge of the window, and easy to keep airborne in lulls.',
  },
  {
    slug: 'surf',
    discipline: 'wave',
    label: 'Surf & Wave',
    blurb:
      'Wave kites built for drift, fast pivot turns, and instant depower so the canopy stays out of your way on a wave face.',
  },
  {
    slug: 'freestyle',
    discipline: 'freestyle',
    label: 'Freestyle',
    blurb:
      'C and open-C kites with direct bar feel, line slack, and predictable pull for unhooked tricks and wakestyle.',
  },
  {
    slug: 'freeride',
    discipline: 'freeride',
    label: 'Freeride',
    blurb:
      'All-round kites that cover the widest conditions: easy relaunch, broad depower, and predictable handling for everyday sessions.',
  },
  {
    slug: 'big-air',
    discipline: 'big_air',
    label: 'Big Air',
    blurb:
      'High-aspect boosters built for vertical lift, hangtime, and reliable loop catch in strong wind.',
  },
];

export function primaryDisciplineForKite(kite: Kite): DisciplineKey {
  const entries = Object.entries(kite.discipline_scores) as Array<[DisciplineKey, number]>;
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

export function styleZoneForKite(kite: Kite): StyleZone {
  const primary = primaryDisciplineForKite(kite);
  return STYLE_ZONES.find((z) => z.discipline === primary) ?? STYLE_ZONES[3];
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
