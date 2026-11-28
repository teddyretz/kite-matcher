'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { DisciplineKey, Kite } from '@/lib/types';
import { displayFitScore, scoreKite } from '@/lib/matcher';
import { applyFilters, filtersToRiderProfile, useFilters, type SortOption } from '@/lib/useFilters';
import KiteCard from '@/components/KiteCard';
import KiteFilters from '@/components/KiteFilters';
import { reviewSortKey } from '@/lib/reviewers';

const DISCIPLINES: Array<{ value: DisciplineKey; label: string }> = [
  { value: 'freeride', label: 'Freeride' },
  { value: 'big_air', label: 'Big Air' },
  { value: 'wave', label: 'Wave' },
  { value: 'foil', label: 'Foil' },
  { value: 'freestyle', label: 'Freestyle' },
];

export default function BrowseContent({ kites }: { kites: Kite[] }) {
  const { filters, setFilters } = useFilters();
  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [visibleCount, setVisibleCount] = useState(18);

  const profile = useMemo(() => filtersToRiderProfile(filters), [filters]);

  const scoredAndSorted = useMemo(() => {
    const filtered = applyFilters(kites, filters);
    const normalizedQuery = query.trim().toLowerCase();
    const searched = normalizedQuery
      ? filtered.filter((kite) =>
          `${kite.brand} ${kite.model} ${kite.year} ${kite.canopy_shape}`
            .toLowerCase()
            .includes(normalizedQuery),
        )
      : filtered;

    const withScores = searched.map((kite) => ({
      kite,
      score: scoreKite(kite, profile),
    }));

    switch (filters.sort) {
      case 'match':
        return withScores.sort((a, b) => b.score - a.score);
      case 'price-low':
        return withScores.sort((a, b) => a.kite.price_new - b.kite.price_new);
      case 'price-high':
        return withScores.sort((a, b) => b.kite.price_new - a.kite.price_new);
      case 'rating':
        return withScores.sort(
          (a, b) => reviewSortKey(b.kite.structured_review) - reviewSortKey(a.kite.structured_review),
        );
      case 'alpha':
      default:
        return withScores.sort((a, b) =>
          `${a.kite.brand} ${a.kite.model}`.localeCompare(`${b.kite.brand} ${b.kite.model}`),
        );
    }
  }, [kites, filters, profile, query]);

  const visibleKites = scoredAndSorted.slice(0, visibleCount);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6 flex flex-col gap-2 border-b border-gray-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-ocean">
            Kite index
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate">
            All {kites.length} active kites
          </h1>
        </div>
        <p className="font-mono text-xs text-gray-500 tabular-nums">
          {scoredAndSorted.length} shown
        </p>
      </div>

      {/* Discipline quick-rank bar (unified matcher) */}
      <div className="mb-4 border border-gray-200 bg-card p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-500">
              Rank for:
            </span>
            {DISCIPLINES.map((d) => {
              const active = filters.sort === 'match' && filters.discipline === d.value;
              return (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setFilters({ discipline: d.value, sort: 'match' })}
                  aria-pressed={active}
                  className={`border px-2.5 py-1 text-xs font-semibold transition-colors ${
                    active
                      ? 'border-ocean bg-ocean text-white'
                      : 'border-gray-200 bg-surface text-gray-600 hover:border-gray-400 hover:text-slate'
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-1 font-mono text-[11px]">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              aria-pressed={viewMode === 'cards'}
              className={`border px-2.5 py-1 font-semibold ${
                viewMode === 'cards'
                  ? 'border-slate bg-slate text-white'
                  : 'border-gray-200 bg-surface text-gray-600'
              }`}
            >
              Cards
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              aria-pressed={viewMode === 'table'}
              className={`border px-2.5 py-1 font-semibold ${
                viewMode === 'table'
                  ? 'border-slate bg-slate text-white'
                  : 'border-gray-200 bg-surface text-gray-600'
              }`}
            >
              Spec table
            </button>
          </div>
        </div>
      </div>

      {/* Search + sort */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setVisibleCount(18);
          }}
          placeholder="Filter by brand, model, year, or canopy shape…"
          className="min-h-10 flex-1 border border-gray-200 bg-card px-3 py-2 text-sm text-slate placeholder:text-gray-400 sm:max-w-md"
        />
        <select
          value={filters.sort}
          onChange={(e) => setFilters({ sort: e.target.value as SortOption })}
          className="min-h-10 border border-gray-200 px-3 py-1.5 text-xs font-semibold"
          aria-label="Sort kites"
        >
          <option value="alpha">A–Z</option>
          <option value="match">Best fit ({filters.discipline.replace('_', ' ')})</option>
          <option value="price-low">Price: low → high</option>
          <option value="price-high">Price: high → low</option>
          <option value="rating">Review score</option>
        </select>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:gap-8">
        <KiteFilters kites={kites} />
        <div className="flex-1 min-w-0">
          {viewMode === 'table' ? (
            <div className="overflow-x-auto border border-gray-200 bg-card">
              <table className="w-full min-w-[700px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 font-mono text-[10px] uppercase tracking-wider text-gray-500">
                    <th className="p-3">Kite</th>
                    <th className="p-3">Shape</th>
                    <th className="p-3">Struts</th>
                    <th className="p-3">Bar</th>
                    <th className="p-3">Wind</th>
                    <th className="p-3">Feel</th>
                    <th className="p-3 text-right">Price</th>
                    {filters.sort === 'match' && <th className="p-3 text-right">Fit</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {visibleKites.map(({ kite, score }) => (
                    <tr key={kite.id} className="hover:bg-surface">
                      <td className="p-3">
                        <Link href={`/kite/${kite.slug}`} className="font-semibold text-slate hover:text-ocean">
                          {kite.brand} {kite.model}
                        </Link>
                        <span className="ml-1.5 font-mono text-[10px] text-gray-400">{kite.year}</span>
                      </td>
                      <td className="p-3 font-mono uppercase text-gray-600">{kite.canopy_shape}</td>
                      <td className="p-3 font-mono tabular-nums text-gray-600">{kite.strut_count}</td>
                      <td className="p-3 font-mono text-gray-600">{kite.bar_type}</td>
                      <td className="p-3 font-mono tabular-nums text-gray-600">
                        {kite.wind_range_low}–{kite.wind_range_high}kt
                      </td>
                      <td className="p-3 text-gray-600 capitalize">
                        {kite.bar_pressure} / {kite.flying_style.replace(/-/g, ' ')}
                      </td>
                      <td className="p-3 text-right font-mono font-semibold tabular-nums text-slate">
                        ${kite.price_new.toLocaleString()}
                      </td>
                      {filters.sort === 'match' && (
                        <td className="p-3 text-right font-mono font-bold tabular-nums text-ocean">
                          {displayFitScore(score)}%
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visibleKites.map(({ kite, score }) => (
                <KiteCard
                  key={kite.id}
                  kite={kite}
                  matchScore={filters.sort === 'match' ? score : undefined}
                />
              ))}
            </div>
          )}

          {scoredAndSorted.length === 0 && (
            <div className="border border-gray-200 bg-card py-16 text-center text-sm text-gray-500">
              No kites match your filters.
            </div>
          )}

          {visibleCount < scoredAndSorted.length && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setVisibleCount((c) => c + 18)}
                className="border border-slate bg-slate px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-white hover:border-ocean hover:bg-ocean"
              >
                Show 18 more ({scoredAndSorted.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
