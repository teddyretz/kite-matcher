'use client';

import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Kite, SkillLevel } from '@/lib/types';
import {
  type AdvisorMatch,
  type FlightFeel,
  getAdvisorMatches,
  matchScore,
  type RidingGoal,
  type WindProfile,
} from '@/lib/matcher';
import { applyFilters, useFilters } from '@/lib/useFilters';
import { useDebouncedNumber } from '@/lib/useDebouncedNumber';
import KiteCard from '@/components/KiteCard';
import KiteFilters from '@/components/KiteFilters';

const styleZones = [
  { label: 'Foil', color: 'text-teal-400' },
  { label: 'Surf', color: 'text-emerald-400' },
  { label: 'Freestyle', color: 'text-violet-400' },
  { label: 'Freeride', color: 'text-blue-400' },
  { label: 'Big Air', color: 'text-orange-400' },
];

function getActiveZone(value: number): number {
  if (value <= 20) return 0;
  if (value <= 40) return 1;
  if (value <= 60) return 2;
  if (value <= 80) return 3;
  return 4;
}

function parseAdvisorValue<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  return value && allowed.includes(value as T) ? value as T : fallback;
}

export default function ResultsContent({ kites }: { kites: Kite[] }) {
  const searchParams = useSearchParams();
  const advisorMode = searchParams.get('advisor') === '1';
  const { filters, setFilters } = useFilters();
  const [slidersOpen, setSlidersOpen] = useState(!advisorMode);
  const [showAll, setShowAll] = useState(false);

  const goal = parseAdvisorValue<RidingGoal>(
    searchParams.get('goal'),
    ['freeride', 'big-air', 'wave', 'freestyle', 'foil'],
    'freeride',
  );
  const level = parseAdvisorValue<SkillLevel>(
    searchParams.get('level'),
    ['beginner', 'intermediate', 'advanced'],
    'intermediate',
  );
  const feel = parseAdvisorValue<FlightFeel>(
    searchParams.get('feel'),
    ['forgiving', 'balanced', 'performance'],
    'balanced',
  );
  const wind = parseAdvisorValue<WindProfile>(
    searchParams.get('wind'),
    ['light', 'mixed', 'strong'],
    'mixed',
  );

  const commitStyle = useCallback((value: number) => setFilters({ style: value }), [setFilters]);
  const commitShape = useCallback((value: number) => setFilters({ shape: value }), [setFilters]);
  const [styleVal, setStyleVal] = useDebouncedNumber(filters.style, commitStyle);
  const [shapeVal, setShapeVal] = useDebouncedNumber(filters.shape, commitShape);

  const eligibleKites = useMemo(() => {
    const filtered = applyFilters(kites, filters);
    if (advisorMode) {
      return getAdvisorMatches(filtered, {
        version: 2,
        goal,
        level,
        feel,
        wind,
        construction: filters.construction,
        budget: filters.budget < 5000 ? filters.budget : undefined,
      });
    }
    return filtered
      .map(kite => ({ ...kite, score: matchScore(kite, styleVal, shapeVal) }))
      .sort((a, b) => b.score - a.score);
  }, [advisorMode, feel, filters, goal, kites, level, shapeVal, styleVal, wind]);

  const displayKites = advisorMode && !showAll ? eligibleKites.slice(0, 12) : eligibleKites;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        {advisorMode && (
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-ocean">Your rider profile</p>
        )}
        <h1 className={advisorMode ? 'font-display text-4xl font-black italic uppercase text-slate' : 'text-2xl font-bold text-slate'}>
          Your Kite Matches
        </h1>
        <p className="text-sm text-gray-500">
          {advisorMode && !showAll && eligibleKites.length > 12
            ? `Showing the strongest 12 of ${eligibleKites.length} eligible kites`
            : `${eligibleKites.length} eligible kites, ranked for fit`}
        </p>
        {advisorMode && (
          <div className="mt-3 flex flex-wrap gap-2">
            {[goal.replace('-', ' '), level, `${feel} feel`, `${wind} wind`].map(item => (
              <span key={item} className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs capitalize text-gray-600">
                {item}
              </span>
            ))}
          </div>
        )}
      </div>

      {!advisorMode && <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <button
          type="button"
          onClick={() => setSlidersOpen(!slidersOpen)}
          className="w-full flex items-center justify-between p-4 text-left"
          aria-expanded={slidersOpen}
        >
          <span className="font-semibold text-slate text-sm">Match Preferences</span>
          <svg className={`w-5 h-5 text-gray-400 transition-transform ${slidersOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {slidersOpen && (
          <div className="px-4 pb-5 border-t border-gray-100 pt-4">
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <label className="text-xs font-semibold tracking-widest uppercase text-gray-500">Riding Style</label>
                  <span className={`font-display font-bold italic text-base uppercase leading-none ${styleZones[getActiveZone(styleVal)].color}`}>
                    {styleZones[getActiveZone(styleVal)].label}
                  </span>
                </div>
                <input type="range" min={0} max={100} value={styleVal} onChange={event => setStyleVal(Number(event.target.value))} className="w-full" style={{ '--range-pct': `${styleVal}%` } as React.CSSProperties} aria-label="Riding style preference" />
                <div className="flex justify-between mt-1.5">
                  {styleZones.map((zone, index) => (
                    <span key={zone.label} className={`text-[10px] font-medium ${index === getActiveZone(styleVal) ? zone.color : 'text-gray-400'}`}>{zone.label}</span>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold tracking-widest uppercase text-gray-500">Kite Shape & Aspect</label>
                <input type="range" min={0} max={100} value={shapeVal} onChange={event => setShapeVal(Number(event.target.value))} className="w-full" style={{ '--range-pct': `${shapeVal}%` } as React.CSSProperties} aria-label="Kite character preference" />
                <div className="flex justify-between mt-1.5">
                  <span className="text-[10px] text-gray-400">Low Aspect · C-Kite</span>
                  <span className="text-[10px] text-gray-400">High Aspect · Bow</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>}

      <div className="flex flex-col gap-4 lg:flex-row lg:gap-8">
        <KiteFilters kites={kites} />
        <div className="flex-1 min-w-0">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayKites.map(kite => {
              const advisorMatch = advisorMode ? kite as AdvisorMatch : null;
              return (
                <KiteCard
                  key={kite.id}
                  kite={kite}
                  matchScore={kite.score}
                  matchReasons={advisorMatch?.reasons}
                  tradeoff={advisorMatch?.tradeoffs[0]}
                />
              );
            })}
          </div>
          {displayKites.length === 0 && (
            <div className="text-center py-20 text-gray-400">No kites match your filters. Try adjusting your criteria.</div>
          )}
          {advisorMode && eligibleKites.length > 12 && (
            <div className="mt-8 text-center">
              <button type="button" onClick={() => setShowAll(value => !value)} className="rounded-lg border border-white/10 px-5 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:border-ocean/40 hover:text-ocean">
                {showAll ? 'Show strongest 12' : `Show all ${eligibleKites.length} eligible kites`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
