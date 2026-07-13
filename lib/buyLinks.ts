import type { BuyLink } from './types';

function normalizeMackiteUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== 'www.mackiteboarding.com') return url;

    if (parsed.pathname === '/search') {
      const query = parsed.searchParams.get('q');
      if (query && query.trim()) {
        const normalized = new URL('https://www.mackiteboarding.com/search.php');
        normalized.searchParams.set('search_query', query.trim());
        return normalized.toString();
      }
    }

    return url;
  } catch {
    return url;
  }
}

export function normalizeBuyLinkUrl(url: string): string {
  return normalizeMackiteUrl(url);
}

export function normalizeBuyLink<T extends Pick<BuyLink, 'url'>>(link: T): T {
  return {
    ...link,
    url: normalizeBuyLinkUrl(link.url),
  };
}