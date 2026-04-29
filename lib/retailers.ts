/**
 * Guaranteed-working retailer links — search URLs at well-known kite shops
 * keyed off the kite's brand + model + year. These complement the curated
 * `buy_links` in each kite JSON (which can rot to 404 over time): even when
 * a curated direct-product link breaks, the search URL still lands the user
 * on a relevant results page.
 */

interface RetailerTemplate {
  name: string;
  /** URL prefix; the search query gets appended (already URL-encoded). */
  search: string;
  /** Region or one-line context shown subtly under the chip. Optional. */
  region?: string;
}

const RETAILERS: RetailerTemplate[] = [
  { name: 'MACkite',          search: 'https://mackite.com/search?q=',                region: 'US' },
  { name: 'Real Watersports', search: 'https://www.realwatersports.com/search?q=',    region: 'US' },
  { name: 'Lakawa',           search: 'https://lakawa.com/?s=',                       region: 'France' },
  { name: 'Kitemana',         search: 'https://www.kitemana.com/en/search?q=',        region: 'EU' },
  { name: 'eBay (used)',      search: 'https://www.ebay.com/sch/i.html?_nkw=',        region: 'global' },
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
    url: r.search + query,
  }));
}
