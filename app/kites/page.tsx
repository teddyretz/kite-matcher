'use client';

import { useState, useMemo } from 'react';
import kiteData from '@/data/kites.json';
import { Kite } from '@/lib/types';
import { matchScore, getActiveKites } from '@/lib/matcher';
import KiteCard from '@/components/KiteCard';
import KiteFilters from '@/components/KiteFilters';

const allKites = getActiveKites(kiteData as unknown as Kite[]).sort((a, b) =>
  `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`)
);

type Construction = 'all' | 'dacron' | 'aluula' | 'brainchild';
type SortOption = 'alpha' | 'match' | 'price-low' | 'price-high' | 'rating';

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

export default function BrowsePage() {
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [styleValue, setStyleValue] = useState(50);
  const [shapeValue, setShapeValue] = useState(50);
  const [construction, setConstruction] = useState<Construction>('all');
  const [budget, setBudget] = useState(5000);
  const [sortBy, setSortBy] = useState<SortOption>('alpha');
  const [sidebarFiltered, setSidebarFiltered] = useState<Set<string> | null>(null);

  const preFiltered = useMemo(() => {
    let list = [...allKites];
    if (construction === 'aluula') list = list.filter(k => k.aluula);
    else if (construction === 'brainchild') list = list.filter(k => k.brainchild);
    else if (construction === 'dacron') list = list.filter(k => !k.aluula && !k.brainchild);
    if (budget < 5000) list = list.filter(k => k.price_new <= budget);
    return list;
  }, [construction, budget]);

  const displayKites = useMemo(() => {
    const list = sidebarFiltered
      ? preFiltered.filter(k => sidebarFiltered.has(k.slug))
      : preFiltered;

    switch (sortBy) {
      case 'match':
        return [...list].sort((a, b) => matchScore(b, styleValue, shapeValue) - matchScore(a, styleValue, shapeValue));
      case 'price-low':
        return [...list].sort((a, b) => a.price_new - b.price_new);
      case 'price-high':
        return [...list].sort((a, b) => b.price_new - a.price_new);
      case 'rating':
        return [...list].sort((a, b) => (b.structured_review?.rating ?? 0) - (a.structured_review?.rating ?? 0));
      default:
        return list;
    }
  }, [preFiltered, sidebarFiltered, sortBy, styleValue, shapeValue]);

  const handleSidebarFilter = (filtered: Kite[]) => {
    if (filtered.length === allKites.length) {
      setSidebarFiltered(null);
    } else {
      setSidebarFiltered(new Set(filtered.map(k => k.slug)));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate">Browse All Kites</h1>
        <p className="text-sm text-gray-500">{displayKites.length} kites</p>
      </div>

      {/* Collapsible Quick Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="w-full flex items-center justify-between p-4 text-left"
        >
          <span className="font-semibold text-slate text-sm">Quick Filters</span>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${filtersOpen ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {filtersOpen && (
          <div className="px-4 pb-5 space-y-5 border-t border-gray-100 pt-4">
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Style Slider */}
              <div>
                <label className="block text-xs font-semibold text-ocean mb-1">Riding Style: <span className={`${styleZones[getActiveZone(styleValue)].color}`}>{styleZones[getActiveZone(styleValue)].label}</span></label>
                <input
                  type="range" min={0} max={100} value={styleValue}
                  onChange={e => { setStyleValue(Number(e.target.value)); setSortBy('match'); }}
                  className="w-full"
                />
                <div className="flex justify-between mt-1">
                  {styleZones.map((zone, i) => <span key={zone.label} className={`text-[10px] font-medium ${i === getActiveZone(styleValue) ? zone.color : 'text-gray-400'}`}>{zone.label}</span>)}
                </div>
              </div>

              {/* Shape Slider */}
              <div>
                <label className="block text-xs font-semibold text-ocean mb-2">Kite Character</label>
                <input
                  type="range" min={0} max={100} value={shapeValue}
                  onChange={e => { setShapeValue(Number(e.target.value)); setSortBy('match'); }}
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
                  {([
                    { value: 'all', label: 'All' },
                    { value: 'dacron', label: 'Dacron' },
                    { value: 'aluula', label: 'Aluula' },
                    { value: 'brainchild', label: 'Brainchild' },
                  ] as const).map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setConstruction(opt.value)}
                      className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                        construction === opt.value
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
                  Budget: {budget >= 5000 ? 'No limit' : `Up to $${budget.toLocaleString()}`}
                </label>
                <input
                  type="range" min={500} max={5000} step={100} value={budget}
                  onChange={e => setBudget(Number(e.target.value))}
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

      {/* Sort */}
      <div className="flex justify-end mb-4">
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as SortOption)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5"
        >
          <option value="alpha">A–Z</option>
          <option value="match">Best Match</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="rating">Highest Rated</option>
        </select>
      </div>

      <div className="flex gap-8">
        <KiteFilters kites={allKites} onFilter={handleSidebarFilter} />
        <div className="flex-1">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayKites.map(kite => (
              <KiteCard
                key={kite.id}
                kite={kite}
                matchScore={sortBy === 'match' ? matchScore(kite, styleValue, shapeValue) : undefined}
              />
            ))}
          </div>
          {displayKites.length === 0 && (
            <div className="text-center py-20 text-gray-400">
              No kites match your filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
