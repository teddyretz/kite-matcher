'use client';

import { useMemo, useState } from 'react';
import { Kite } from '@/lib/types';
import { matchScore } from '@/lib/matcher';
import { applyFilters, useFilters } from '@/lib/useFilters';
import KiteCard from '@/components/KiteCard';
import KiteFilters from '@/components/KiteFilters';

const styleZones = [
  { label: 'Foil',      color: 'text-teal-400'    },
  { label: 'Surf',      color: 'text-emerald-400' },
  { label: 'Freestyle', color: 'text-violet-400'  },
  { label: 'Freeride',  color: 'text-blue-400'    },
  { label: 'Big Air',   color: 'text-orange-400'  },
];
function getActiveZone(value: number): number {
  if (value <= 20) return 0;
  if (value <= 40) return 1;
  if (value <= 60) return 2;
  if (value <= 80) return 3;
  return 4;
}

export default function ResultsContent({ kites }: { kites: Kite[] }) {
  const { filters, setFilters } = useFilters();
  const [slidersOpen, setSlidersOpen] = useState(true);

  const displayKites = useMemo(() => {
    const filtered = applyFilters(kites, filters);
    return filtered
      .map((k) => ({ ...k, score: matchScore(k, filters.style, filters.shape) }))
      .sort((a, b) => b.score - a.score);
  }, [kites, filters]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate">Your Kite Matches</h1>
        <p className="text-sm text-gray-500">{displayKites.length} kites found</p>
      </div>

      {/* Match preferences — collapsible, default expanded */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <button
          onClick={() => setSlidersOpen(!slidersOpen)}
          className="w-full flex items-center justify-between p-4 text-left"
          aria-expanded={slidersOpen}
        >
          <span className="font-semibold text-slate text-sm">Match Preferences</span>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${slidersOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {slidersOpen && (
          <div className="px-4 pb-5 border-t border-gray-100 pt-4">
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Style */}
              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <label className="text-xs font-semibold tracking-widest uppercase text-gray-500">
                    Riding Style
                  </label>
                  <span
                    className={`font-display font-bold italic text-base uppercase leading-none ${styleZones[getActiveZone(filters.style)].color}`}
                  >
                    {styleZones[getActiveZone(filters.style)].label}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={filters.style}
                  onChange={(e) => setFilters({ style: Number(e.target.value) })}
                  className="w-full"
                  style={{ '--range-pct': `${filters.style}%` } as React.CSSProperties}
                  aria-label="Riding style preference"
                />
                <div className="flex justify-between mt-1.5">
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
                <div className="flex items-baseline justify-between mb-2">
                  <label className="text-xs font-semibold tracking-widest uppercase text-gray-500">
                    Kite Character
                  </label>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={filters.shape}
                  onChange={(e) => setFilters({ shape: Number(e.target.value) })}
                  className="w-full"
                  style={{ '--range-pct': `${filters.shape}%` } as React.CSSProperties}
                  aria-label="Kite character preference"
                />
                <div className="flex justify-between mt-1.5">
                  <span className="text-[10px] text-gray-400">C / Delta</span>
                  <span className="text-[10px] text-gray-400">Bow / LEI</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:gap-8">
        <KiteFilters kites={kites} />
        <div className="flex-1 min-w-0">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayKites.map((kite) => (
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
