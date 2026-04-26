import { Suspense } from 'react';
import { getActiveKites } from '@/lib/getKites';
import BrowseContent from './BrowseContent';

export default async function BrowsePage() {
  const kites = await getActiveKites();
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-8">Loading kites…</div>}>
      <BrowseContent kites={kites} />
    </Suspense>
  );
}
