import type { MetadataRoute } from 'next';
import { getAllKites } from '@/lib/getKites';
import { SITE_URL, STYLE_ZONES, brandSlug } from '@/lib/seo';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const kites = await getAllKites();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`,        lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${SITE_URL}/kites`,   lastModified: now, changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${SITE_URL}/compare`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/about`,   lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
  ];

  const styleRoutes: MetadataRoute.Sitemap = STYLE_ZONES.map((z) => ({
    url: `${SITE_URL}/kites/${z.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.9,
  }));

  const activeBrands = [...new Set(kites.filter((k) => !k.discontinued).map((k) => brandSlug(k.brand)))].sort();
  const brandRoutes: MetadataRoute.Sitemap = activeBrands.map((b) => ({
    url: `${SITE_URL}/brand/${b}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const kiteRoutes: MetadataRoute.Sitemap = kites.map((k) => ({
    url: `${SITE_URL}/kite/${k.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  return [...staticRoutes, ...styleRoutes, ...brandRoutes, ...kiteRoutes];
}
