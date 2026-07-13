import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getActiveKites } from '@/lib/getKites';
import ResultsContent from './ResultsContent';

export const metadata: Metadata = {
  title: 'Your Kite Matches',
  // Quiz results are per-user query-param permutations — keep them out of
  // the index but let crawlers follow links through to the kite pages.
  robots: { index: false, follow: true },
};

export default async function ResultsPage() {
  const kites = await getActiveKites();

  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-8">Loading results...</div>}>
      <ResultsContent kites={kites} />
    </Suspense>
  );
}
