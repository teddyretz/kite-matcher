'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useMemo, Suspense } from 'react';
import kiteData from '@/data/kites.json';
import { Kite } from '@/lib/types';
import { matchScore, getActiveKites } from '@/lib/matcher';
import KiteCard from '@/components/KiteCard';
import KiteFilters from '@/components/KiteFilters';

const allKites = getActiveKites(kiteData as unknown as Kite[]);

function ResultsContent() {
  const searchParams = useSearchParams();
  const styleValue = Number(searchParams.get('style') ?? 50);
  const shapeValue = Number(searchParams.get('shape') ?? 50);
  const scoredKites = useMemo(
    () => allKites
      .map(k => ({ ...k, score: matchScore(k, styleValue, shapeValue) }))
      .sort((a, b) => b.score - a.score),
    [styleValue, shapeValue]
  );

  const [filteredSlugs, setFilteredSlugs] = useState<Set<string> | null>(null);

  const displayKites = filteredSlugs
    ? scoredKites.filter(k => filteredSlugs.has(k.slug))
    : scoredKites;

  const handleFilter = (filtered: Kite[]) => {
    if (filtered.length === allKites.length) {
      setFilteredSlugs(null);
    } else {
      setFilteredSlugs(new Set(filtered.map(k => k.slug)));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate">Your Kite Matches</h1>
        <p className="text-sm text-gray-500">
          {displayKites.length} kites found
        </p>
      </div>
      <div className="flex gap-8">
        <KiteFilters kites={allKites} onFilter={handleFilter} />
        <div className="flex-1">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayKites.map(kite => (
              <KiteCard key={kite.id} kite={kite} matchScore={kite.score} />
            ))}
          </div>
          {displayKites.length === 0 && (
            <div className="text-center py-20 text-gray-400">
              No kites match your filters. Try adjusting your criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-8">Loading results...</div>}>
      <ResultsContent />
    </Suspense>
  );
}
