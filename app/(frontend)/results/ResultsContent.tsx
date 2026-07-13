'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useMemo } from 'react';
import { Kite } from '@/lib/types';
import { getRankedMatchesV2, KiteConstruction } from '@/lib/matcher';
import KiteCard from '@/components/KiteCard';
import KiteFilters from '@/components/KiteFilters';

export default function ResultsContent({ kites }: { kites: Kite[] }) {
  const searchParams = useSearchParams();
  const styleValue = Number(searchParams.get('style') ?? 50);
  const shapeValue = Number(searchParams.get('shape') ?? 50);
  const requestedConstruction = searchParams.get('construction');
  const construction: KiteConstruction = ['dacron', 'aluula', 'brainchild'].includes(requestedConstruction ?? '')
    ? requestedConstruction as KiteConstruction
    : 'all';
  const requestedBudget = Number(searchParams.get('budget') ?? 5000);
  const budget = Number.isFinite(requestedBudget) ? Math.max(500, Math.min(5000, requestedBudget)) : 5000;
  const scoredKites = useMemo(
    () => getRankedMatchesV2(kites, {
      version: 2,
      style: styleValue,
      shape: shapeValue,
      construction,
      budget: budget < 5000 ? budget : undefined,
    }),
    [kites, styleValue, shapeValue, construction, budget]
  );

  const [filteredSlugs, setFilteredSlugs] = useState<Set<string> | null>(null);

  const displayKites = filteredSlugs
    ? scoredKites.filter(k => filteredSlugs.has(k.slug))
    : scoredKites;

  const handleFilter = (filtered: Kite[]) => {
    if (filtered.length === kites.length) {
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
        {(construction !== 'all' || budget < 5000) && (
          <div className="flex flex-wrap gap-2 mt-3" aria-label="Applied match constraints">
            {construction !== 'all' && (
              <span className="px-2.5 py-1 rounded-full bg-ocean/10 text-ocean text-xs font-semibold capitalize">
                {construction} construction
              </span>
            )}
            {budget < 5000 && (
              <span className="px-2.5 py-1 rounded-full bg-ocean/10 text-ocean text-xs font-semibold">
                Up to ${budget.toLocaleString()}
              </span>
            )}
          </div>
        )}
      </div>
      <div className="flex gap-8">
        <KiteFilters kites={kites} onFilter={handleFilter} />
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
