'use client';

import { useCallback, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Kite } from '@/lib/types';
import { matchScore } from '@/lib/matcher';
import { useFilters, DEFAULT_FILTERS } from '@/lib/useFilters';
import SpectrumBar from '@/components/SpectrumBar';

const MAX_COMPARE = 3;

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

export default function CompareContent({ allKites }: { allKites: Kite[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { filters, setFilters } = useFilters();

  const slugs = (searchParams.get('kites') ?? '').split(',').filter(Boolean);
  const bySlug = useMemo(() => new Map(allKites.map((k) => [k.slug, k])), [allKites]);
  const kitesInCompare = useMemo(
    () => slugs.map((s) => bySlug.get(s)).filter((k): k is Kite => Boolean(k)),
    [slugs, bySlug],
  );
  const missing = slugs.filter((s) => !bySlug.has(s));

  const slidersAdjusted =
    filters.style !== DEFAULT_FILTERS.style || filters.shape !== DEFAULT_FILTERS.shape;

  // Score + sort. Always score; only show the score badge when sliders are
  // off the default so we don't visually emphasize a meaningless 50/50 result.
  const scoredKites = useMemo(() => {
    return kitesInCompare
      .map((k) => ({ kite: k, score: matchScore(k, filters.style, filters.shape) }))
      .sort((a, b) => b.score - a.score);
  }, [kitesInCompare, filters.style, filters.shape]);

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
    for (const k of available) {
      (groups[k.brand] ??= []).push(k);
    }
    return groups;
  }, [available]);

  // Slider + dropdown header — always rendered, even when nothing is selected.
  const Header = (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6 space-y-5">
      <div className="grid sm:grid-cols-2 gap-5">
        {/* Style slider */}
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

        {/* Shape slider */}
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

      {/* Add-kite dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2 border-t border-gray-100">
        <label className="text-xs font-semibold tracking-widest uppercase text-gray-500 shrink-0">
          Add a kite
        </label>
        <select
          className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 disabled:opacity-50"
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
              : 'Pick a kite to add to the comparison…'}
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

      {slidersAdjusted && (
        <p className="text-xs text-gray-500">
          Columns ordered by match score against your sliders. Adjust to re-rank.
        </p>
      )}
    </div>
  );

  if (slugs.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate mb-6">Compare Kites</h1>
        {Header}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <p className="text-gray-500 mb-4">Pick a kite from the dropdown above, or add one from any kite card.</p>
          <Link href="/kites" className="text-ocean hover:underline">Browse all kites</Link>
        </div>
      </div>
    );
  }

  if (kitesInCompare.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate mb-6">Compare Kites</h1>
        {Header}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <p className="text-gray-500 mb-2">
            We couldn&apos;t find {missing.length === 1 ? 'this kite' : 'these kites'}:
          </p>
          <p className="text-sm text-gray-400 mb-6 font-mono">{missing.join(', ')}</p>
          <Link href="/kites" className="text-ocean hover:underline">Browse all kites</Link>
        </div>
      </div>
    );
  }

  type SpecRow = { label: string; values: string[]; highlight: boolean };
  const getVal = (k: Kite, field: string): string => {
    switch (field) {
      case 'brand': return k.brand;
      case 'year': return k.year.toString();
      case 'style_spectrum': return k.style_spectrum.toString();
      case 'shape_spectrum': return k.shape_spectrum.toString();
      case 'aspect_ratio': return k.aspect_ratio.replace('-', ' ');
      case 'strut_count': return k.strut_count === 0 ? 'Strutless' : k.strut_count.toString();
      case 'bar_type': return k.bar_type === 'high-y' ? 'High-Y' : k.bar_type === 'low-v' ? 'Low-V' : 'Both';
      case 'turning_speed': return k.turning_speed;
      case 'low_end_power': return `${k.low_end_power}/10`;
      case 'depower_range': return `${k.depower_range}/10`;
      case 'relaunch': return k.relaunch;
      case 'wind_range': return `${k.wind_range_low}–${k.wind_range_high} kts`;
      case 'sizes': return k.sizes.join(', ') + 'm';
      case 'price': return `$${k.price_new.toLocaleString()}`;
      case 'aluula': return k.aluula ? 'Yes' : 'No';
      case 'brainchild': return k.brainchild ? 'Yes' : 'No';
      case 'review_score': return (k.structured_review?.rating ?? 0).toFixed(1);
      default: return '';
    }
  };

  const fields = [
    'brand', 'year', 'style_spectrum', 'shape_spectrum', 'aspect_ratio',
    'strut_count', 'bar_type', 'turning_speed', 'low_end_power', 'depower_range',
    'relaunch', 'wind_range', 'sizes', 'price', 'aluula', 'brainchild', 'review_score',
  ];
  const labels: Record<string, string> = {
    brand: 'Brand', year: 'Year', style_spectrum: 'Style Spectrum', shape_spectrum: 'Shape Spectrum',
    aspect_ratio: 'Aspect Ratio', strut_count: 'Struts', bar_type: 'Bar Type',
    turning_speed: 'Turning Speed', low_end_power: 'Low-End Power', depower_range: 'Depower Range',
    relaunch: 'Relaunch', wind_range: 'Wind Range', sizes: 'Sizes', price: 'Price (New)',
    aluula: 'Aluula', brainchild: 'Brainchild', review_score: 'Review Score',
  };

  // Order kites by score (highest match first) and compute per-row values in
  // that same order.
  const orderedKites = scoredKites;
  const rows: SpecRow[] = fields.map((f) => {
    const values = orderedKites.map(({ kite }) => getVal(kite, f));
    const unique = new Set(values);
    return { label: labels[f], values, highlight: unique.size > 1 };
  });

  function scoreBadgeClass(score: number): string {
    if (score >= 80) return 'bg-ocean/15 text-ocean';
    if (score >= 60) return 'bg-sand/15 text-sand';
    return 'bg-gray-100 text-gray-500';
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate mb-6">Compare Kites</h1>

      {Header}

      {missing.length > 0 && (
        <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 text-amber-900 text-sm rounded-lg">
          {missing.length === 1
            ? <>Skipped <span className="font-mono">{missing[0]}</span> — kite not found.</>
            : <>Skipped {missing.length} kites that couldn&apos;t be found: <span className="font-mono">{missing.join(', ')}</span></>}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left p-3 sm:p-4 w-28 sm:w-40 text-xs sm:text-sm font-medium text-gray-500">Spec</th>
                {orderedKites.map(({ kite, score }) => (
                  <th key={kite.id} className="p-3 sm:p-4 text-center align-top">
                    <div className="flex flex-col items-center gap-1.5">
                      <Link href={`/kite/${kite.slug}`} className="hover:text-ocean">
                        <p className="font-bold text-slate text-sm sm:text-base">{kite.model}</p>
                        <p className="text-[11px] sm:text-xs text-gray-500">{kite.brand} {kite.year}</p>
                      </Link>
                      {slidersAdjusted && (
                        <span className={`px-2 py-0.5 text-[11px] font-bold rounded ${scoreBadgeClass(score)}`}>
                          {score}% match
                        </span>
                      )}
                      <button
                        onClick={() => removeKite(kite.slug)}
                        className="text-[11px] text-gray-400 hover:text-red-500"
                        aria-label={`Remove ${kite.model} from compare`}
                      >
                        Remove
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className={`border-b border-gray-50 ${row.highlight ? 'bg-sand/5' : ''}`}>
                  <td className="p-3 sm:p-4 text-xs sm:text-sm text-gray-500 font-medium">{row.label}</td>
                  {row.values.map((val, i) => (
                    <td key={i} className={`p-3 sm:p-4 text-center text-xs sm:text-sm capitalize ${row.highlight ? 'font-semibold text-slate' : 'text-gray-700'}`}>
                      {val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Style spectrum visual */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-8 space-y-4">
        <h2 className="text-lg font-bold text-slate">Style Comparison</h2>
        {orderedKites.map(({ kite }) => (
          <div key={kite.id}>
            <p className="text-sm font-medium text-gray-600 mb-1">{kite.brand} {kite.model}</p>
            <SpectrumBar label="" value={kite.style_spectrum} leftLabel="Foiling" rightLabel="Big Air" />
          </div>
        ))}
      </div>
    </div>
  );
}
