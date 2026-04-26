'use client';

import { useMemo, useState } from 'react';
import { Kite } from '@/lib/types';
import { matchScore } from '@/lib/matcher';
import { applyFilters, useFilters, type Construction, type SortOption } from '@/lib/useFilters';
import KiteCard from '@/components/KiteCard';
import KiteFilters from '@/components/KiteFilters';

const styleZones = [
  { label: 'Foil', color: 'text-teal-600' },
  { label: 'Surf', color: 'text-emerald-600' },
  { label: 'Freestyle', color: 'text-violet-600' },
  { label: 'Freeride', color: 'text-blue-600' },
  { label: 'Big Air', color: 'text-orange-600' },
];

function getActiveZone(value: number): number {
  if (value <= 20) return 0;
  if (value <= 40) return 1;
  if (value <= 60) return 2;
  if (value <= 80) return 3;
  return 4;
}

function sortKites<K extends Kite & { score?: number }>(
  list: K[],
  sort: SortOption,
  style: number,
  shape: number,
): K[] {
  switch (sort) {
    case 'match':
      return [...list].sort(
        (a, b) => matchScore(b, style, shape) - matchScore(a, style, shape),
      );
    case 'price-low':
      return [...list].sort((a, b) => a.price_new - b.price_new);
    case 'price-high':
      return [...list].sort((a, b) => b.price_new - a.price_new);
    case 'rating':
      return [...list].sort(
        (a, b) => (b.structured_review?.rating ?? 0) - (a.structured_review?.rating ?? 0),
      );
    case 'alpha':
    default:
      return [...list].sort((a, b) =>
        `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`),
      );
  }
}

export default function BrowseContent({ kites }: { kites: Kite[] }) {
  const { filters, setFilters } = useFilters();
  const [filtersOpen, setFiltersOpen] = useState(true);

  const displayKites = useMemo(() => {
    const filtered = applyFilters(kites, filters);
    return sortKites(filtered, filters.sort, filters.style, filters.shape);
  }, [kites, filters]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate">Browse All Kites</h1>
        <p className="text-sm text-gray-500">{displayKites.length} kites</p>
      </div>

      {/* Quick Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="w-full flex items-center justify-between p-4 text-left"
          aria-expanded={filtersOpen}
        >
          <span className="font-semibold text-slate text-sm">Quick Filters</span>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${filtersOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {filtersOpen && (
          <div className="px-4 pb-5 space-y-5 border-t border-gray-100 pt-4">
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Style */}
              <div>
                <label className="block text-xs font-semibold text-ocean mb-1">
                  Riding Style:{' '}
                  <span className={styleZones[getActiveZone(filters.style)].color}>
                    {styleZones[getActiveZone(filters.style)].label}
                  </span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={filters.style}
                  onChange={(e) => setFilters({ style: Number(e.target.value), sort: 'match' })}
                  className="w-full"
                />
                <div className="flex justify-between mt-1">
                  {styleZones.map((zone, i) => (
                    <span
                      key={zone.label}
                      className={`text-[10px] font-medium ${i === getActiveZone(filters.style) ? zone.color : 'text-gray-400'}`}
                    >
                      {zone.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Shape */}
              <div>
                <label className="block text-xs font-semibold text-ocean mb-2">Kite Character</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={filters.shape}
                  onChange={(e) => setFilters({ shape: Number(e.target.value), sort: 'match' })}
                  className="w-full"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-gray-400">Low Aspect (C/Delta)</span>
                  <span className="text-[10px] text-gray-400">High Aspect (Bow/LEI)</span>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {/* Construction */}
              <div>
                <label className="block text-xs font-semibold text-ocean mb-2">Construction</label>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      { value: 'all', label: 'All' },
                      { value: 'dacron', label: 'Dacron' },
                      { value: 'aluula', label: 'Aluula' },
                      { value: 'brainchild', label: 'Brainchild' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setFilters({ construction: opt.value as Construction })}
                      className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                        filters.construction === opt.value
                          ? 'bg-ocean text-white border-ocean'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-ocean hover:text-ocean'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget */}
              <div>
                <label className="block text-xs font-semibold text-ocean mb-2">
                  Budget: {filters.budget >= 5000 ? 'No limit' : `Up to $${filters.budget.toLocaleString()}`}
                </label>
                <input
                  type="range"
                  min={500}
                  max={5000}
                  step={100}
                  value={filters.budget}
                  onChange={(e) => setFilters({ budget: Number(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-gray-400">$500</span>
                  <span className="text-[10px] text-gray-400">$5,000+</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end mb-4">
        <select
          value={filters.sort}
          onChange={(e) => setFilters({ sort: e.target.value as SortOption })}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5"
          aria-label="Sort kites"
        >
          <option value="alpha">A–Z</option>
          <option value="match">Best Match</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="rating">Highest Rated</option>
        </select>
      </div>

      <div className="flex gap-8">
        <KiteFilters kites={kites} />
        <div className="flex-1">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayKites.map((kite) => (
              <KiteCard
                key={kite.id}
                kite={kite}
                matchScore={
                  filters.sort === 'match' ? matchScore(kite, filters.style, filters.shape) : undefined
                }
              />
            ))}
          </div>
          {displayKites.length === 0 && (
            <div className="text-center py-20 text-gray-400">No kites match your filters.</div>
          )}
        </div>
      </div>
    </div>
  );
}
