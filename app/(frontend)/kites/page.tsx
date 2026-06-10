import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getActiveKites } from '@/lib/getKites';
import { SITE_URL } from '@/lib/seo';
import BrowseContent from './BrowseContent';

export const metadata: Metadata = {
  title: 'Browse All Kites — Filter by Style, Brand, Budget & Skill',
  description:
    'Browse every kitesurfing kite in our catalog. Filter by riding style, brand, skill level, construction, and budget — with independent review summaries.',
  alternates: { canonical: `${SITE_URL}/kites` },
};

export default async function BrowsePage() {
  const kites = await getActiveKites();
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-8">Loading kites…</div>}>
      <BrowseContent kites={kites} />
    </Suspense>
  );
}
