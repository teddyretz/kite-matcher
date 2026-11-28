'use client';

import { useMemo, useState } from 'react';
import { track } from '@vercel/analytics/react';
import type { Kite } from '@/lib/types';
import {
  getDiverseAdvisorShortlist,
  getUnifiedMatches,
  type BarPreference,
} from '@/lib/matcher';
import { applyFilters, filtersToRiderProfile, useFilters } from '@/lib/useFilters';
import KiteCard from '@/components/KiteCard';
import KiteFilters from '@/components/KiteFilters';
import AdvisorControls, { type AdvisorControlValues } from '@/components/AdvisorControls';

const DISCIPLINE_LABEL: Record<string, string> = {
  freeride: 'Freeride',
  big_air: 'Big Air',
  wave: 'Wave',
  foil: 'Foil',
  freestyle: 'Freestyle',
};

export default function ResultsContent({ kites }: { kites: Kite[] }) {
  const { filters, setFilters, reset } = useFilters();
  const [tunerOpen, setTunerOpen] = useState(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle');
  const [showAll, setShowAll] = useState(false);

  const profile = useMemo(() => filtersToRiderProfile(filters), [filters]);

  const rankedKites = useMemo(() => {
    const filtered = applyFilters(kites, filters);
    return getUnifiedMatches(filtered, profile);
  }, [kites, filters, profile]);

  const displayKites =
    !showAll && rankedKites.length > 12
      ? getDiverseAdvisorShortlist(rankedKites, 12, 2)
      : rankedKites;

  const handleControlChange = (updates: Partial<AdvisorControlValues>) => {
    setFilters({
      ...(updates.discipline !== undefined ? { discipline: updates.discipline } : {}),
      ...(updates.boardType !== undefined ? { boardType: updates.boardType } : {}),
      ...(updates.level !== undefined ? { level: updates.level } : {}),
      ...(updates.barType !== undefined ? { barType: updates.barType === 'any' ? '' : updates.barType } : {}),
      ...(updates.construction !== undefined ? { construction: updates.construction } : {}),
      ...(updates.barPressure !== undefined ? { barPressure: updates.barPressure } : {}),
      ...(updates.flyingStyle !== undefined ? { flyingStyle: updates.flyingStyle } : {}),
      ...(updates.windKnots !== undefined ? { windKnots: updates.windKnots } : {}),
      ...(updates.budget !== undefined ? { budget: updates.budget } : {}),
      ...(updates.riderWeightKg !== undefined ? { riderWeightKg: updates.riderWeightKg } : {}),
    });
  };

  const shareResults = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'FindMyKite matches', url });
      } else {
        await navigator.clipboard.writeText(url);
        setShareStatus('copied');
        window.setTimeout(() => setShareStatus('idle'), 1800);
      }
      track('advisor_profile_shared', { level: filters.level });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      await navigator.clipboard.writeText(url);
      setShareStatus('copied');
      window.setTimeout(() => setShareStatus('idle'), 1800);
    }
  };

  const barPref: BarPreference =
    filters.barType === 'high-y' || filters.barType === 'low-v' ? filters.barType : 'any';

  const summaryChips = [
    DISCIPLINE_LABEL[filters.discipline],
    filters.boardType,
    filters.level,
    `${filters.windKnots} kt`,
    ...(filters.riderWeightKg ? [`${filters.riderWeightKg} kg`] : []),
    ...(barPref !== 'any' ? [barPref.toUpperCase()] : []),
    ...(filters.construction !== 'all' ? [filters.construction] : []),
  ];

  const topThree = displayKites.slice(0, 3);
  const rest = displayKites.slice(3);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6 border-b border-gray-200 pb-5">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-ocean">
          Ranked by specs &amp; geometry
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate">
          Your Kite Matches
        </h1>
        <p className="mt-1 font-mono text-xs text-gray-500">
          {!showAll && rankedKites.length > 12
            ? `Showing brand-diverse shortlist of 12 from ${rankedKites.length} eligible kites`
            : `${rankedKites.length} eligible kites`}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5 font-mono text-[11px]">
          {summaryChips.map((chip) => (
            <span
              key={chip}
              className="border border-gray-200 bg-card px-2.5 py-0.5 capitalize text-gray-600"
            >
              {chip}
            </span>
          ))}
        </div>
      </div>

      {/* Collapsible live match controls */}
      <section className="mb-6 border border-gray-200 bg-card">
        <button
          type="button"
          onClick={() => setTunerOpen((v) => !v)}
          className="flex min-h-12 w-full items-center justify-between gap-4 px-4 py-3 text-left"
          aria-expanded={tunerOpen}
        >
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ocean">
              Match controls
            </p>
            <p className="text-sm font-semibold text-slate">
              Adjust discipline, wind, weight, or bar setup
            </p>
          </div>
          <span className="font-mono text-xs text-gray-500">
            {tunerOpen ? 'Hide ↑' : 'Edit ↓'}
          </span>
        </button>

        {tunerOpen && (
          <div className="border-t border-gray-200 p-4 sm:p-5">
            <AdvisorControls
              compact
              discipline={filters.discipline}
              boardType={filters.boardType}
              level={filters.level}
              barType={barPref}
              construction={filters.construction}
              barPressure={filters.barPressure}
              flyingStyle={filters.flyingStyle}
              windKnots={filters.windKnots}
              budget={filters.budget}
              riderWeightKg={filters.riderWeightKg}
              onChange={handleControlChange}
            />
            <div className="mt-4 flex flex-col gap-2 border-t border-gray-200 pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={reset}
                className="border border-gray-300 bg-surface px-4 py-2 text-xs font-semibold text-gray-600 hover:border-ocean hover:text-ocean"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={shareResults}
                className="border border-ocean bg-ocean px-4 py-2 text-xs font-semibold text-white hover:bg-ocean-dark"
              >
                {shareStatus === 'copied' ? 'Link copied ✓' : 'Copy share link'}
              </button>
            </div>
          </div>
        )}
      </section>

      <div className="flex flex-col gap-4 lg:flex-row lg:gap-8">
        <KiteFilters kites={kites} />
        <div className="flex-1 min-w-0 space-y-8">
          {topThree.length > 0 && (
            <section>
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="text-lg font-bold text-slate">Top three</h2>
                <span className="font-mono text-[11px] text-gray-400">Highest spec alignment</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {topThree.map((kite, idx) => (
                  <KiteCard
                    key={kite.id}
                    kite={kite}
                    matchScore={kite.score}
                    matchReasons={kite.reasons}
                    tradeoff={kite.tradeoffs[0]}
                    recommendedSize={kite.recommendedSize}
                    compactMatch
                    pickLabel={`#${idx + 1}`}
                  />
                ))}
              </div>
            </section>
          )}

          {rest.length > 0 && (
            <section>
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="text-lg font-bold text-slate">Also worth comparing</h2>
                <span className="font-mono text-[11px] text-gray-400">{rest.length} kites</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((kite) => (
                  <KiteCard
                    key={kite.id}
                    kite={kite}
                    matchScore={kite.score}
                    matchReasons={kite.reasons}
                    tradeoff={kite.tradeoffs[0]}
                    recommendedSize={kite.recommendedSize}
                    compactMatch
                  />
                ))}
              </div>
            </section>
          )}

          {displayKites.length === 0 && (
            <div className="border border-gray-200 bg-card py-16 text-center text-sm text-gray-500">
              No kites match these constraints. Try widening budget, bar type, or construction.
            </div>
          )}

          {rankedKites.length > 12 && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowAll((v) => !v)}
                className="border border-gray-300 bg-card px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-slate hover:border-ocean hover:text-ocean"
              >
                {showAll ? 'Show brand-diverse top 12' : `Show all ${rankedKites.length} eligible kites`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
