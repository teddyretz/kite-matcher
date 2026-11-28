'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { track } from '@vercel/analytics/react';
import type { Kite } from '@/lib/types';
import {
  displayFitScore,
  getDiverseAdvisorShortlist,
  getUnifiedMatches,
} from '@/lib/matcher';
import AdvisorControls, { type AdvisorControlValues } from '@/components/AdvisorControls';

const INITIAL_VALUES: AdvisorControlValues = {
  discipline: 'freeride',
  boardType: 'twin-tip',
  level: 'intermediate',
  barType: 'any',
  construction: 'all',
  barPressure: 'any',
  flyingStyle: 'any',
  windKnots: 18,
  budget: 5000,
  riderWeightKg: null,
};

export default function AdvisorMatcher({ kites }: { kites: Kite[] }) {
  const [values, setValues] = useState<AdvisorControlValues>(INITIAL_VALUES);
  const router = useRouter();

  const matches = useMemo(
    () =>
      getUnifiedMatches(kites, {
        discipline: values.discipline,
        boardType: values.boardType,
        level: values.level,
        barType: values.barType,
        construction: values.construction,
        barPressure: values.barPressure,
        flyingStyle: values.flyingStyle,
        windKnots: values.windKnots,
        budget: values.budget < 5000 ? values.budget : undefined,
        riderWeightKg: values.riderWeightKg ?? undefined,
      }),
    [kites, values],
  );

  const topMatches = useMemo(() => getDiverseAdvisorShortlist(matches, 3, 1), [matches]);

  const handleChange = (updates: Partial<AdvisorControlValues>) => {
    setValues((prev) => ({ ...prev, ...updates }));
  };

  const openResults = () => {
    track('advisor_results_opened', {
      level: values.level,
      discipline: values.discipline,
      top_brand: matches[0]?.brand ?? 'none',
      eligible_count: matches.length,
    });
    const params = new URLSearchParams({
      discipline: values.discipline,
      board: values.boardType,
      level: values.level,
      wind: String(values.windKnots),
      sort: 'match',
    });
    if (values.barType !== 'any') params.set('barType', values.barType);
    if (values.construction !== 'all') params.set('construction', values.construction);
    if (values.barPressure !== 'any') params.set('pressure', values.barPressure);
    if (values.flyingStyle !== 'any') params.set('flying', values.flyingStyle);
    if (values.budget < 5000) params.set('budget', String(values.budget));
    if (values.riderWeightKg !== null) params.set('weight', String(values.riderWeightKg));
    router.push(`/results?${params.toString()}`);
  };

  return (
    <div className="border border-gray-200 bg-card p-5 sm:p-6">
      <div className="mb-5 flex items-baseline justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-ocean">
            Kite matcher
          </p>
          <h2 className="mt-0.5 text-xl font-bold tracking-tight text-slate">
            Dial in your setup
          </h2>
        </div>
        <div className="border-l border-gray-200 pl-4 text-right">
          <p className="font-mono text-2xl font-bold tabular-nums leading-none text-slate">
            {matches.length}
          </p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-gray-400">
            eligible
          </p>
        </div>
      </div>

      <AdvisorControls {...values} onChange={handleChange} />

      <div className="mt-5 border-t border-gray-200 pt-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">
            Top 3 preview
          </p>
          <p className="font-mono text-[10px] text-gray-400">Specs only · no sponsored boosts</p>
        </div>
        {topMatches.length > 0 ? (
          <div className="grid grid-cols-3 border border-gray-200 bg-surface">
            {topMatches.map((match) => (
              <div key={match.slug} className="border-r border-gray-200 p-2.5 last:border-r-0">
                <p className="font-mono text-sm font-bold tabular-nums text-ocean">
                  {displayFitScore(match.score)}%
                </p>
                <p className="mt-0.5 truncate text-xs font-semibold text-slate">{match.model}</p>
                <p className="truncate font-mono text-[10px] text-gray-500">
                  {match.brand}
                  {match.recommendedSize ? ` · ${match.recommendedSize.minSize}–${match.recommendedSize.maxSize}m` : ''}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="border border-gray-200 bg-surface p-3 text-xs text-gray-500">
            No kites match all constraints. Try widening budget, bar system, or construction.
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={openResults}
        className="mt-4 w-full border border-ocean bg-ocean px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-ocean-dark"
      >
        View {matches.length} ranked matches →
      </button>
    </div>
  );
}
