import type { MetadataRoute } from 'next';
import { getActiveKites } from '@/lib/getKites';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const kites = await getActiveKites();
  const baseUrl = 'https://findmykite.com';

  return [
    { url: baseUrl, changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/kites`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/about`, changeFrequency: 'monthly', priority: 0.5 },
    ...kites.map(kite => ({
      url: `${baseUrl}/kite/${kite.slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ];
}
