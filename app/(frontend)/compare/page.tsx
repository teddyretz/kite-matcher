import { Suspense } from 'react';
import { getAllKites } from '@/lib/getKites';
import CompareContent from './CompareContent';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Compare Kites',
  description: 'Compare kite specifications and riding characteristics side by side.',
  robots: { index: false, follow: true },
};

export default async function ComparePage() {
  const allKites = await getAllKites();

  return (
    <Suspense fallback={<div className="max-w-5xl mx-auto px-4 py-8">Loading comparison...</div>}>
      <CompareContent allKites={allKites} />
    </Suspense>
  );
}
