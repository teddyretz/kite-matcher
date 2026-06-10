/**
 * Guaranteed-working retailer links — search URLs at well-known kite shops
 * keyed off the kite's brand + model + year. These complement the curated
 * `buy_links` in each kite JSON (which can rot to 404 over time): even when
 * a curated direct-product link breaks, the search URL still lands the user
 * on a relevant results page.
 *
 * Keep this list conservative. If a retailer's generic search endpoint starts
 * 404ing or challenging heavily, it's better to hide it than ship a bad link
 * on every kite detail page.
 */
import { normalizeBuyLinkUrl } from './buyLinks';

interface RetailerTemplate {
  name: string;
  /** URL prefix; the search query gets appended (already URL-encoded). */
  search: string;
  /** Region or one-line context shown subtly under the chip. Optional. */
  region?: string;
}

const RETAILERS: RetailerTemplate[] = [
  { name: 'MACkite',          search: 'https://www.mackiteboarding.com/search.php?search_query=', region: 'US' },
  { name: 'Real Watersports', search: 'https://www.realwatersports.com/search?q=',                 region: 'US' },
  { name: 'Kite Paddle Surf', search: 'https://www.kitepaddlesurf.com/search?q=',                  region: 'US' },
  { name: 'eBay (used)',      search: 'https://www.ebay.com/sch/i.html?_nkw=',                     region: 'global' },
];

export interface RetailerSearch {
  name: string;
  url: string;
  region?: string;
}

export function retailerSearchUrls(kite: { brand: string; model: string; year: number }): RetailerSearch[] {
  const query = encodeURIComponent(`${kite.brand} ${kite.model} ${kite.year}`.trim());
  return RETAILERS.map((r) => ({
    name: r.name,
    region: r.region,
    url: normalizeBuyLinkUrl(r.search + query),
  }));
}
