'use client';

import { useCallback, useMemo, useState } from 'react';
import { Kite } from '@/lib/types';
import { matchScore } from '@/lib/matcher';
import { applyFilters, useFilters, type Construction, type SortOption } from '@/lib/useFilters';
import { useDebouncedNumber } from '@/lib/useDebouncedNumber';
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
  const [query, setQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(12);

  // Debounced slider state — see lib/useDebouncedNumber. Adjusting style or
  // shape also flips sort to 'match'; we batch that into the commit.
  const commitStyle = useCallback((v: number) => setFilters({ style: v, sort: 'match' }), [setFilters]);
  const commitShape = useCallback((v: number) => setFilters({ shape: v, sort: 'match' }), [setFilters]);
  const [styleVal, setStyleVal] = useDebouncedNumber(filters.style, commitStyle);
  const [shapeVal, setShapeVal] = useDebouncedNumber(filters.shape, commitShape);

  const displayKites = useMemo(() => {
    const filtered = applyFilters(kites, filters);
    const normalizedQuery = query.trim().toLowerCase();
    const searched = normalizedQuery
      ? filtered.filter(kite => `${kite.brand} ${kite.model} ${kite.year}`.toLowerCase().includes(normalizedQuery))
      : filtered;
    return sortKites(searched, filters.sort, styleVal, shapeVal);
  }, [kites, filters, query, styleVal, shapeVal]);

  const visibleKites = displayKites.slice(0, visibleCount);

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
                  <span className={styleZones[getActiveZone(styleVal)].color}>
                    {styleZones[getActiveZone(styleVal)].label}
                  </span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={styleVal}
                  onChange={(e) => setStyleVal(Number(e.target.value))}
                  className="w-full"
                  style={{ '--range-pct': `${styleVal}%` } as React.CSSProperties}
                  aria-label="Riding style preference"
                />
                <div className="flex justify-between mt-1">
                  {styleZones.map((zone, i) => (
                    <span
                      key={zone.label}
                      className={`text-[10px] font-medium ${i === getActiveZone(styleVal) ? zone.color : 'text-gray-400'}`}
                    >
                      {zone.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Shape */}
              <div>
                <label className="block text-xs font-semibold text-ocean mb-2">Kite Shape & Aspect</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={shapeVal}
                  onChange={(e) => setShapeVal(Number(e.target.value))}
                  className="w-full"
                  style={{ '--range-pct': `${shapeVal}%` } as React.CSSProperties}
                  aria-label="Kite shape and aspect preference"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-gray-400">Low Aspect · C-Kite</span>
                  <span className="text-[10px] text-gray-400">High Aspect · Bow</span>
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
                      className={`min-h-9 px-3 py-1 text-xs rounded-full border transition-colors ${
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
                  style={{ '--range-pct': `${((filters.budget - 500) / 4500) * 100}%` } as React.CSSProperties}
                  aria-label="Maximum budget"
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

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block flex-1 sm:max-w-md">
          <span className="sr-only">Search kites by brand or model</span>
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-4.35-4.35m1.35-5.65a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={event => {
              setQuery(event.target.value);
              setVisibleCount(12);
            }}
            placeholder="Search brand or model"
            className="min-h-11 w-full rounded-lg border border-white/10 bg-white py-2 pl-10 pr-3 text-sm text-slate placeholder:text-gray-400"
          />
        </label>
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

      <div className="flex flex-col gap-4 lg:flex-row lg:gap-8">
        <KiteFilters kites={kites} />
        <div className="flex-1 min-w-0">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleKites.map((kite) => (
              <KiteCard
                key={kite.id}
                kite={kite}
                matchScore={
                  filters.sort === 'match' ? matchScore(kite, styleVal, shapeVal) : undefined
                }
              />
            ))}
          </div>
          {displayKites.length === 0 && (
            <div className="text-center py-20 text-gray-400">No kites match your filters.</div>
          )}
          {visibleCount < displayKites.length && (
            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() => setVisibleCount(count => count + 12)}
                className="min-h-11 rounded-lg border border-ocean/30 bg-ocean/10 px-6 py-2.5 text-sm font-bold text-ocean transition-colors hover:bg-ocean/15"
              >
                Show 12 more <span className="font-normal text-gray-400">({displayKites.length - visibleCount} remaining)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
