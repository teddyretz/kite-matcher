'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useMemo } from 'react';
import { Kite } from '@/lib/types';
import {
  AdvisorMatch,
  FlightFeel,
  getAdvisorMatches,
  getRankedMatchesV2,
  KiteConstruction,
  RidingGoal,
  WindProfile,
} from '@/lib/matcher';
import { SkillLevel } from '@/lib/types';
import KiteCard from '@/components/KiteCard';
import KiteFilters from '@/components/KiteFilters';

export default function ResultsContent({ kites }: { kites: Kite[] }) {
  const searchParams = useSearchParams();
  const advisorMode = searchParams.get('advisor') === '1';
  const styleValue = Number(searchParams.get('style') ?? 50);
  const shapeValue = Number(searchParams.get('shape') ?? 50);
  const requestedConstruction = searchParams.get('construction');
  const construction: KiteConstruction = ['dacron', 'aluula', 'brainchild'].includes(requestedConstruction ?? '')
    ? requestedConstruction as KiteConstruction
    : 'all';
  const requestedBudget = Number(searchParams.get('budget') ?? 5000);
  const budget = Number.isFinite(requestedBudget) ? Math.max(500, Math.min(5000, requestedBudget)) : 5000;
  const requestedGoal = searchParams.get('goal');
  const goal: RidingGoal = ['freeride', 'big-air', 'wave', 'freestyle', 'foil'].includes(requestedGoal ?? '')
    ? requestedGoal as RidingGoal
    : 'freeride';
  const requestedLevel = searchParams.get('level');
  const level: SkillLevel = ['beginner', 'intermediate', 'advanced'].includes(requestedLevel ?? '')
    ? requestedLevel as SkillLevel
    : 'intermediate';
  const requestedFeel = searchParams.get('feel');
  const feel: FlightFeel = ['forgiving', 'balanced', 'performance'].includes(requestedFeel ?? '')
    ? requestedFeel as FlightFeel
    : 'balanced';
  const requestedWind = searchParams.get('wind');
  const wind: WindProfile = ['light', 'mixed', 'strong'].includes(requestedWind ?? '')
    ? requestedWind as WindProfile
    : 'mixed';
  const scoredKites = useMemo(
    () => advisorMode
      ? getAdvisorMatches(kites, {
          version: 2,
          goal,
          level,
          feel,
          wind,
          construction,
          budget: budget < 5000 ? budget : undefined,
        })
      : getRankedMatchesV2(kites, {
          version: 2,
          style: styleValue,
          shape: shapeValue,
          construction,
          budget: budget < 5000 ? budget : undefined,
        }),
    [advisorMode, kites, styleValue, shapeValue, construction, budget, goal, level, feel, wind]
  );

  const [filteredSlugs, setFilteredSlugs] = useState<Set<string> | null>(null);
  const [showAll, setShowAll] = useState(false);

  const eligibleDisplayKites = filteredSlugs
    ? scoredKites.filter(k => filteredSlugs.has(k.slug))
    : scoredKites;
  const displayKites = advisorMode && !showAll
    ? eligibleDisplayKites.slice(0, 12)
    : eligibleDisplayKites;

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
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ocean mb-2">
          {advisorMode ? 'Your rider profile' : 'Classic matcher'}
        </p>
        <h1 className="font-display text-4xl font-black italic uppercase text-slate">Your Kite Matches</h1>
        <p className="text-sm text-gray-500">
          {advisorMode && !showAll && eligibleDisplayKites.length > 12
            ? `Showing the strongest 12 of ${eligibleDisplayKites.length} eligible kites`
            : `${eligibleDisplayKites.length} eligible kites, ranked for fit`}
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
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <KiteFilters kites={kites} onFilter={handleFilter} />
        <div className="flex-1">
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
            <div className="text-center py-20 text-gray-400">
              No kites match your filters. Try adjusting your criteria.
            </div>
          )}
          {advisorMode && eligibleDisplayKites.length > 12 && (
            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() => setShowAll(value => !value)}
                className="rounded-lg border border-white/10 px-5 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:border-ocean/40 hover:text-ocean"
              >
                {showAll ? 'Show strongest 12' : `Show all ${eligibleDisplayKites.length} eligible kites`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
