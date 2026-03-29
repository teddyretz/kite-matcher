import { Suspense } from 'react';
import { getAllKites } from '@/lib/getKites';
import CompareContent from './CompareContent';

export default async function ComparePage() {
  const allKites = await getAllKites();

  return (
    <Suspense fallback={<div className="max-w-5xl mx-auto px-4 py-8">Loading comparison...</div>}>
      <CompareContent allKites={allKites} />
    </Suspense>
  );
}
