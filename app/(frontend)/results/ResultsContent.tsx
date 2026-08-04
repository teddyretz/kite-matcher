'use client';

import { useCallback, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { track } from '@vercel/analytics/react';
import type { Kite, SkillLevel } from '@/lib/types';
import {
  type AdvisorMatch,
  type FlightFeel,
  getAdvisorMatches,
  getDiverseAdvisorShortlist,
  getSliderAdvisorMatches,
  matchScore,
  type RidingGoal,
  type WindProfile,
} from '@/lib/matcher';
import { applyFilters, useFilters } from '@/lib/useFilters';
import { useDebouncedNumber } from '@/lib/useDebouncedNumber';
import KiteCard from '@/components/KiteCard';
import KiteFilters from '@/components/KiteFilters';
import AdvisorControls, { type AdvisorControlName } from '@/components/AdvisorControls';

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

function parseSliderValue(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : fallback;
}

export default function ResultsContent({ kites }: { kites: Kite[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const advisorParam = searchParams.get('advisor');
  const sliderMode = advisorParam === 'sliders';
  const advisorMode = sliderMode || advisorParam === '1';
  const { filters, setFilters } = useFilters();
  const [slidersOpen, setSlidersOpen] = useState(!advisorMode);
  const [advisorTunerOpen, setAdvisorTunerOpen] = useState(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle');
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
  const wavePriority = parseSliderValue(searchParams.get('wave'), 20);
  const handling = parseSliderValue(searchParams.get('handling'), 50);
  const windValue = parseSliderValue(searchParams.get('wind'), 50);

  const commitAdvisorParam = useCallback((name: string, value: string | number) => {
    const next = new URLSearchParams(window.location.search);
    next.set(name, String(value));
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }, [pathname, router]);

  const commitStyle = useCallback((value: number) => setFilters({ style: value }), [setFilters]);
  const commitShape = useCallback((value: number) => setFilters({ shape: value }), [setFilters]);
  const commitWave = useCallback((value: number) => commitAdvisorParam('wave', value), [commitAdvisorParam]);
  const commitHandling = useCallback((value: number) => commitAdvisorParam('handling', value), [commitAdvisorParam]);
  const commitWindValue = useCallback((value: number) => commitAdvisorParam('wind', value), [commitAdvisorParam]);
  const commitBudget = useCallback((value: number) => setFilters({ budget: value }), [setFilters]);
  const [styleVal, setStyleVal] = useDebouncedNumber(filters.style, commitStyle);
  const [shapeVal, setShapeVal] = useDebouncedNumber(filters.shape, commitShape);
  const [waveVal, setWaveVal] = useDebouncedNumber(wavePriority, commitWave);
  const [handlingVal, setHandlingVal] = useDebouncedNumber(handling, commitHandling);
  const [windSliderVal, setWindSliderVal] = useDebouncedNumber(windValue, commitWindValue);
  const [budgetVal, setBudgetVal] = useDebouncedNumber(filters.budget, commitBudget);

  const updateAdvisorSlider = (name: AdvisorControlName, value: number) => {
    if (name === 'style') setStyleVal(value);
    else if (name === 'shape') setShapeVal(value);
    else if (name === 'wave') setWaveVal(value);
    else if (name === 'handling') setHandlingVal(value);
    else if (name === 'wind') setWindSliderVal(value);
    else setBudgetVal(value);
  };

  const resetAdvisor = () => {
    track('advisor_profile_reset', { level });
    router.replace('/results?advisor=sliders&style=70&shape=55&wave=20&handling=50&wind=50&level=intermediate&construction=all&budget=5000', { scroll: false });
  };

  const shareAdvisor = async () => {
    const url = new URL(window.location.href);
    url.searchParams.set('advisor', 'sliders');
    url.searchParams.set('style', String(styleVal));
    url.searchParams.set('shape', String(shapeVal));
    url.searchParams.set('wave', String(waveVal));
    url.searchParams.set('handling', String(handlingVal));
    url.searchParams.set('wind', String(windSliderVal));
    url.searchParams.set('level', level);
    url.searchParams.set('construction', filters.construction);
    url.searchParams.set('budget', String(budgetVal));

    try {
      if (navigator.share) {
        await navigator.share({ title: 'My FindMyKite matches', url: url.toString() });
      } else {
        await navigator.clipboard.writeText(url.toString());
        setShareStatus('copied');
        window.setTimeout(() => setShareStatus('idle'), 1800);
      }
      track('advisor_profile_shared', { level });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      await navigator.clipboard.writeText(url.toString());
      setShareStatus('copied');
      window.setTimeout(() => setShareStatus('idle'), 1800);
    }
  };

  const eligibleKites = useMemo(() => {
    const liveFilters = { ...filters, style: styleVal, shape: shapeVal, budget: budgetVal };
    const filtered = applyFilters(kites, liveFilters);
    if (sliderMode) {
      return getSliderAdvisorMatches(filtered, {
        version: 2,
        style: styleVal,
        shape: shapeVal,
        wavePriority: waveVal,
        handling: handlingVal,
        wind: windSliderVal,
        level,
        construction: filters.construction,
        budget: budgetVal < 5000 ? budgetVal : undefined,
      });
    }
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
  }, [advisorMode, budgetVal, feel, filters, goal, handlingVal, kites, level, shapeVal, sliderMode, styleVal, waveVal, wind, windSliderVal]);

  const displayKites = advisorMode && !showAll && eligibleKites.length > 12
    ? getDiverseAdvisorShortlist(eligibleKites as AdvisorMatch[], 12, 2)
    : eligibleKites;

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
            ? `Showing a brand-diverse shortlist of 12 from ${eligibleKites.length} eligible kites`
            : `${eligibleKites.length} eligible kites, ranked for fit`}
        </p>
        {advisorMode && (
          <div className="mt-3 flex flex-wrap gap-2">
            {(sliderMode
              ? [styleZones[getActiveZone(styleVal)].label, level, handlingVal < 35 ? 'forgiving handling' : handlingVal > 65 ? 'performance handling' : 'balanced handling', windSliderVal < 35 ? 'light wind' : windSliderVal > 65 ? 'strong wind' : 'mixed wind']
              : [goal.replace('-', ' '), level, `${feel} feel`, `${wind} wind`]
            ).map(item => (
              <span key={item} className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs capitalize text-gray-600">
                {item}
              </span>
            ))}
          </div>
        )}
      </div>

      {sliderMode && (
        <section className="mb-6 overflow-hidden rounded-2xl border border-ocean/15 bg-[#0B1420] shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
          <button
            type="button"
            onClick={() => {
              const next = !advisorTunerOpen;
              setAdvisorTunerOpen(next);
              if (next) track('advisor_tuner_opened', { level });
            }}
            className="flex min-h-16 w-full items-center justify-between gap-4 px-4 py-3 text-left sm:px-5"
            aria-expanded={advisorTunerOpen}
          >
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ocean">Live match controls</p>
              <p className="truncate text-sm font-semibold text-slate">
                Tune any preference and the ranking updates instantly
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="hidden text-xs text-gray-400 sm:inline">{advisorTunerOpen ? 'Hide controls' : 'Tune results'}</span>
              <svg className={`h-5 w-5 text-ocean transition-transform ${advisorTunerOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {advisorTunerOpen && (
            <div className="border-t border-white/10 px-4 pb-5 pt-5 sm:px-5">
              <AdvisorControls
                compact
                style={styleVal}
                shape={shapeVal}
                wavePriority={waveVal}
                handling={handlingVal}
                wind={windSliderVal}
                level={level}
                construction={filters.construction}
                budget={budgetVal}
                onSliderChange={updateAdvisorSlider}
                onSliderCommit={(control, value) => track('advisor_preference_changed', { control, value, level, surface: 'results' })}
                onLevelChange={value => {
                  commitAdvisorParam('level', value);
                  track('advisor_level_changed', { level: value, surface: 'results' });
                }}
                onConstructionChange={value => {
                  setFilters({ construction: value });
                  track('advisor_construction_changed', { construction: value, surface: 'results' });
                }}
              />
              <div className="mt-5 flex flex-col gap-2 border-t border-white/10 pt-4 sm:flex-row sm:justify-end">
                <button type="button" onClick={resetAdvisor} className="min-h-11 rounded-lg border border-white/10 px-4 py-2 text-xs font-semibold text-gray-400 transition-colors hover:border-white/20 hover:text-slate">
                  Reset profile
                </button>
                <button type="button" onClick={shareAdvisor} className="min-h-11 rounded-lg border border-ocean/30 bg-ocean/10 px-4 py-2 text-xs font-bold text-ocean transition-colors hover:bg-ocean/15">
                  {shareStatus === 'copied' ? 'Link copied ✓' : 'Share these matches'}
                </button>
              </div>
            </div>
          )}
        </section>
      )}

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
                  matchLabel={advisorMatch?.fitLabel}
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
                {showAll ? 'Show diverse shortlist' : `Show all ${eligibleKites.length} eligible kites`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
