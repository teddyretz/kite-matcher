/**
 * Who each review source is, and what commercial ties they have to the kites.
 *
 * Every YouTube review must come from a channel listed here (validate-kites
 * enforces it), so adding a new reviewer means deciding their label first.
 * `brand` sources are shown but never feed a structured_review rating.
 */
export type SourceType = 'independent' | 'owner' | 'retailer' | 'brand' | 'unverified';

export interface Reviewer {
  name: string;
  type: SourceType;
  note: string;
}

export const SOURCE_TYPE_META: Record<SourceType, { label: string; detail: string }> = {
  independent: { label: 'Independent', detail: 'Reviewer does not sell kites. May ride demo gear lent by brands or shops.' },
  owner: { label: 'Owner reports', detail: 'Riders who bought the kite, posting on public forums.' },
  retailer: { label: 'Retailer', detail: 'A shop that sells this kite.' },
  brand: { label: 'Brand', detail: "The kite maker's own content. Not used in ratings." },
  unverified: { label: 'Unverified', detail: "We haven't confirmed this channel's commercial ties yet." },
};

// Keyed by lowercased YouTube handle from channel_url.
export const REVIEWERS: Record<string, Reviewer> = {
  '@jasonofmontreal': {
    name: 'Jason Montreal',
    type: 'independent',
    note: 'Plus-Sized Kite Reviews. Discloses demo kites lent by MACkiteboarding and brands.',
  },
  '@kitemana': { name: 'Kitemana', type: 'retailer', note: 'Online kite shop that sells the kites it reviews.' },
  '@realwatersports': { name: 'REAL Watersports', type: 'retailer', note: 'Kite shop and school, Cape Hatteras.' },
  '@kiterepublicaustralia': { name: 'Kite Republic', type: 'retailer', note: 'Australian kite shop.' },
  '@forcekiteandwake': { name: 'FORCE Kiteboarding', type: 'retailer', note: 'Kite shop and school.' },
  '@glidecharleston': { name: 'Glide Charleston', type: 'retailer', note: 'Kite shop; video is a dealer walkthrough.' },
  '@north_kiteboarding': { name: 'North Kiteboarding', type: 'brand', note: "North's own designer-notes video." },
  '@gtv2011': { name: 'Gleiten tv', type: 'unverified', note: 'German kite test channel; affiliation not yet confirmed.' },
  '@ourkitelife': { name: 'Our Kite Life', type: 'unverified', note: 'Kiteboarding channel; affiliation not yet confirmed.' },
  '@bradstrahm7278': { name: 'Brad Strahm', type: 'unverified', note: 'Rider channel; affiliation not yet confirmed.' },
  '@kiteboardingstpetersburg': {
    name: 'Kiteboarding St Petersburg',
    type: 'unverified',
    note: 'Kiteboarding channel; affiliation not yet confirmed.',
  },
};

export function channelHandle(channelUrl: string): string {
  const m = channelUrl.match(/youtube\.com\/(@[^/?#\s]+)/i);
  return m ? m[1].toLowerCase() : '';
}

export function reviewerForChannel(channelUrl: string): Reviewer | undefined {
  return REVIEWERS[channelHandle(channelUrl)];
}

export function reviewerByName(name: string): Reviewer | undefined {
  return Object.values(REVIEWERS).find((r) => r.name === name);
}

export function sourceType(name: string): SourceType {
  return reviewerByName(name)?.type ?? 'unverified';
}

// "1 independent + 1 retailer source" — honest evidence wording for a rating.
export function sourceMixLabel(names: string[]): string {
  const counts = new Map<SourceType, number>();
  for (const n of names) counts.set(sourceType(n), (counts.get(sourceType(n)) ?? 0) + 1);
  const parts = [...counts].map(([type, n]) => `${n} ${type === 'owner' ? 'owner' : type}`);
  return `${parts.join(' + ')} source${names.length === 1 ? '' : 's'}`;
}
