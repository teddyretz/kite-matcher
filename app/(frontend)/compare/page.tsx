import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getAllKites } from '@/lib/getKites';
import { SITE_URL } from '@/lib/seo';
import CompareContent from './CompareContent';

export const metadata: Metadata = {
  title: 'Compare Kites Side by Side — Specs, Reviews & Match Scores',
  description:
    'Put up to three kitesurfing kites side by side: full specs, review scores, wind ranges, and style placement, re-ranked against your riding preferences.',
  // Canonicalize all ?kites=… variants onto the bare compare page.
  alternates: { canonical: `${SITE_URL}/compare` },
};

export default async function ComparePage() {
  const allKites = await getAllKites();

  return (
    <Suspense fallback={<div className="max-w-5xl mx-auto px-4 py-8">Loading comparison...</div>}>
      <CompareContent allKites={allKites} />
    </Suspense>
  );
}
