'use client';

import { useCallback, useMemo, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import type { DisciplineKey, Kite, SkillLevel } from '@/lib/types';
import { displayFitScore, scoreKite } from '@/lib/matcher';
import { filtersToRiderProfile, useFilters } from '@/lib/useFilters';
import { limitedEvidenceLabel } from '@/lib/reviewers';

const MAX_COMPARE = 3;

const DISCIPLINES: Array<{ value: DisciplineKey; label: string }> = [
  { value: 'freeride', label: 'Freeride' },
  { value: 'big_air', label: 'Big Air' },
  { value: 'wave', label: 'Wave' },
  { value: 'foil', label: 'Foil' },
  { value: 'freestyle', label: 'Freestyle' },
];

const LEVELS: SkillLevel[] = ['beginner', 'intermediate', 'advanced'];

export default function CompareContent({ allKites }: { allKites: Kite[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { filters, setFilters } = useFilters();
  const [showOnlyDifferences, setShowOnlyDifferences] = useState(false);

  const slugs = (searchParams.get('kites') ?? '').split(',').filter(Boolean);
  const bySlug = useMemo(() => new Map(allKites.map((k) => [k.slug, k])), [allKites]);
  const kitesInCompare = useMemo(
    () => slugs.map((s) => bySlug.get(s)).filter((k): k is Kite => Boolean(k)),
    [slugs, bySlug],
  );
  const missing = slugs.filter((s) => !bySlug.has(s));

  const profile = useMemo(() => filtersToRiderProfile(filters), [filters]);

  const orderedKites = useMemo(() => {
    return kitesInCompare
      .map((kite) => ({ kite, score: scoreKite(kite, profile) }))
      .sort((a, b) => b.score - a.score);
  }, [kitesInCompare, profile]);

  const updateKites = useCallback(
    (newSlugs: string[]) => {
      const params = new URLSearchParams(searchParams.toString());
      if (newSlugs.length > 0) params.set('kites', newSlugs.join(','));
      else params.delete('kites');
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  const addKite = (slug: string) => {
    if (!slug || slugs.includes(slug) || slugs.length >= MAX_COMPARE) return;
    updateKites([...slugs, slug]);
  };
  const removeKite = (slug: string) => updateKites(slugs.filter((s) => s !== slug));

  const available = useMemo(() => {
    return allKites
      .filter((k) => !slugs.includes(k.slug))
      .sort((a, b) => `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`));
  }, [allKites, slugs]);

  const availableByBrand = useMemo(() => {
    const groups: Record<string, Kite[]> = {};
    for (const k of available) (groups[k.brand] ??= []).push(k);
    return groups;
  }, [available]);

  const Header = (
    <div className="mb-6 space-y-4 border border-gray-200 bg-card p-4 sm:p-5">
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <p className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-500">
            Score for discipline
          </p>
          <div className="grid grid-cols-3 gap-1 sm:grid-cols-5 md:grid-cols-3">
            {DISCIPLINES.map((d) => (
              <button
                key={d.value}
                type="button"
                aria-pressed={filters.discipline === d.value}
                onClick={() => setFilters({ discipline: d.value })}
                className={`border px-2 py-1.5 text-xs font-semibold transition-colors ${
                  filters.discipline === d.value
                    ? 'border-ocean bg-ocean text-white'
                    : 'border-gray-200 bg-surface text-gray-600 hover:border-gray-400'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-500">
            Skill level
          </p>
          <div className="grid grid-cols-3 gap-1">
            {LEVELS.map((lvl) => (
              <button
                key={lvl}
                type="button"
                aria-pressed={filters.level === lvl}
                onClick={() => setFilters({ level: lvl })}
                className={`border px-2 py-1.5 text-xs font-semibold capitalize transition-colors ${
                  filters.level === lvl
                    ? 'border-ocean bg-ocean text-white'
                    : 'border-gray-200 bg-surface text-gray-600 hover:border-gray-400'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <label htmlFor="compare-wind" className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-500">
              Typical wind
            </label>
            <span className="font-mono text-xs font-bold tabular-nums text-ocean">
              {filters.windKnots} kt
            </span>
          </div>
          <input
            id="compare-wind"
            type="range"
            min={10}
            max={35}
            step={1}
            value={filters.windKnots}
            onChange={(e) => setFilters({ windKnots: Number(e.target.value) })}
            className="w-full"
          />
          <div className="mt-1 flex justify-between font-mono text-[10px] text-gray-400">
            <span>10 kt</span>
            <span>35 kt</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-gray-200 pt-3 sm:flex-row sm:items-center">
        <label className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-500 shrink-0">
          Add kite
        </label>
        <select
          className="flex-1 border border-gray-200 px-3 py-2 text-sm disabled:opacity-50"
          value=""
          disabled={slugs.length >= MAX_COMPARE}
          onChange={(e) => {
            if (e.target.value) {
              addKite(e.target.value);
              e.target.selectedIndex = 0;
            }
          }}
        >
          <option value="">
            {slugs.length >= MAX_COMPARE
              ? `Limit reached (${MAX_COMPARE} max) — remove one first`
              : 'Pick a kite to add…'}
          </option>
          {Object.entries(availableByBrand).map(([brand, list]) => (
            <optgroup key={brand} label={brand}>
              {list.map((k) => (
                <option key={k.slug} value={k.slug}>
                  {k.model} {k.year}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
    </div>
  );

  if (slugs.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="mb-5 text-2xl font-bold text-slate">Compare Kites</h1>
        {Header}
        <div className="border border-gray-200 bg-card p-8 text-center">
          <p className="mb-3 text-sm text-gray-500">Pick up to 3 kites above or add them from the index.</p>
          <Link href="/kites" className="text-sm font-semibold text-ocean hover:underline">
            Browse all kites →
          </Link>
        </div>
      </div>
    );
  }

  if (kitesInCompare.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="mb-5 text-2xl font-bold text-slate">Compare Kites</h1>
        {Header}
        <div className="border border-gray-200 bg-card p-8 text-center">
          <p className="mb-2 text-sm text-gray-500">Could not find: <span className="font-mono">{missing.join(', ')}</span></p>
          <Link href="/kites" className="text-sm font-semibold text-ocean hover:underline">
            Browse all kites →
          </Link>
        </div>
      </div>
    );
  }

  const specRows: Array<{ label: string; get: (k: Kite) => string }> = [
    { label: 'Canopy Shape', get: (k) => k.canopy_shape.toUpperCase() },
    { label: 'Aspect Ratio', get: (k) => k.aspect_ratio.replace('-', ' ') },
    { label: 'Struts', get: (k) => (k.strut_count === 0 ? 'Strutless' : String(k.strut_count)) },
    { label: 'Bar System', get: (k) => (k.bar_type === 'high-y' ? 'High-Y' : k.bar_type === 'low-v' ? 'Low-V' : 'Both') },
    { label: 'Bar Pressure', get: (k) => k.bar_pressure },
    { label: 'Flying Style', get: (k) => k.flying_style.replace(/-/g, ' ') },
    { label: 'Turning Speed', get: (k) => k.turning_speed },
    { label: 'Low-End Power', get: (k) => `${k.low_end_power}/10` },
    { label: 'Depower Range', get: (k) => `${k.depower_range}/10` },
    { label: 'Relaunch', get: (k) => k.relaunch },
    { label: 'Wind Range', get: (k) => `${k.wind_range_low}–${k.wind_range_high} kt` },
    { label: 'Sizes', get: (k) => `${k.sizes.join(', ')}m` },
    { label: 'Freeride', get: (k) => `${k.discipline_scores.freeride}/100` },
    { label: 'Big Air', get: (k) => `${k.discipline_scores.big_air}/100` },
    { label: 'Wave', get: (k) => `${k.discipline_scores.wave}/100` },
    { label: 'Foil', get: (k) => `${k.discipline_scores.foil}/100` },
    { label: 'Freestyle', get: (k) => `${k.discipline_scores.freestyle}/100` },
    { label: 'Construction', get: (k) => (k.aluula ? 'Aluula' : k.brainchild ? 'Brainchild' : 'Dacron') },
    { label: 'Retail Price', get: (k) => `$${k.price_new.toLocaleString()}` },
    { label: 'Review Score', get: (k) => {
      if (!k.structured_review) return '—';
      const limited = limitedEvidenceLabel(k.structured_review.sources);
      return `${k.structured_review.rating.toFixed(1)}/5${limited ? ` (${limited})` : ''}`;
    } },
  ];

  const rows = specRows.map((row) => {
    const values = orderedKites.map(({ kite }) => row.get(kite));
    const highlight = new Set(values).size > 1;
    return { label: row.label, values, highlight };
  });

  const visibleRows = showOnlyDifferences ? rows.filter((r) => r.highlight) : rows;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate">Compare Kites</h1>
        <label className="flex items-center gap-2 font-mono text-xs text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={showOnlyDifferences}
            onChange={(e) => setShowOnlyDifferences(e.target.checked)}
            className="accent-ocean"
          />
          Differences only
        </label>
      </div>

      {Header}

      {missing.length > 0 && (
        <div className="mb-4 border-l-2 border-sand bg-sand-light px-4 py-2.5 text-xs text-slate">
          Skipped unknown slug(s): <span className="font-mono">{missing.join(', ')}</span>
        </div>
      )}

      <div className="overflow-x-auto border border-gray-200 bg-card">
        <table className="w-full min-w-[520px] border-collapse">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="w-36 p-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                Spec
              </th>
              {orderedKites.map(({ kite, score }) => (
                <th key={kite.id} className="border-l border-gray-200 p-3 text-center align-top">
                  <div className="flex flex-col items-center gap-1">
                    <Link href={`/kite/${kite.slug}`} className="hover:text-ocean">
                      <p className="text-sm font-bold text-slate">{kite.model}</p>
                      <p className="font-mono text-[11px] font-normal text-gray-500">
                        {kite.brand} {kite.year}
                      </p>
                    </Link>
                    <span className="border border-ocean/30 bg-ocean-light px-2 py-0.5 font-mono text-[11px] font-bold tabular-nums text-ocean">
                      {displayFitScore(score)}% fit
                    </span>
                    <button
                      type="button"
                      onClick={() => removeKite(kite.slug)}
                      className="font-mono text-[10px] uppercase tracking-wider text-gray-400 hover:text-sand"
                    >
                      Remove
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {visibleRows.map((row) => (
              <tr key={row.label} className={row.highlight ? 'bg-surface/60' : ''}>
                <td className="p-3 font-mono text-[11px] font-semibold text-gray-500">{row.label}</td>
                {row.values.map((val, i) => (
                  <td
                    key={i}
                    className={`border-l border-gray-100 p-3 text-center font-mono text-xs tabular-nums capitalize ${
                      row.highlight ? 'font-semibold text-slate' : 'text-gray-600'
                    }`}
                  >
                    {val}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
