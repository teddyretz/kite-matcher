import { Suspense } from 'react';
import { getActiveKites } from '@/lib/getKites';
import ResultsContent from './ResultsContent';

export default async function ResultsPage() {
  const kites = await getActiveKites();

  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-8">Loading results...</div>}>
      <ResultsContent kites={kites} />
    </Suspense>
  );
}
