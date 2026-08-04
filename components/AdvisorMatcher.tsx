'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { track } from '@vercel/analytics/react';
import type { Kite, SkillLevel } from '@/lib/types';
import { getDiverseAdvisorShortlist, getSliderAdvisorMatches, type KiteConstruction } from '@/lib/matcher';
import AdvisorControls, { type AdvisorControlName } from '@/components/AdvisorControls';

export default function AdvisorMatcher({ kites }: { kites: Kite[] }) {
  const [style, setStyle] = useState(70);
  const [shape, setShape] = useState(55);
  const [wavePriority, setWavePriority] = useState(20);
  const [handling, setHandling] = useState(50);
  const [wind, setWind] = useState(50);
  const [level, setLevel] = useState<SkillLevel>('intermediate');
  const [construction, setConstruction] = useState<KiteConstruction>('all');
  const [budget, setBudget] = useState(5000);
  const router = useRouter();

  const matches = useMemo(() => getSliderAdvisorMatches(kites, {
    version: 2,
    style,
    shape,
    wavePriority,
    handling,
    wind,
    level,
    construction,
    budget: budget < 5000 ? budget : undefined,
  }), [budget, construction, handling, kites, level, shape, style, wavePriority, wind]);
  const topMatches = useMemo(() => getDiverseAdvisorShortlist(matches, 3, 1), [matches]);

  const openResults = () => {
    track('advisor_results_opened', {
      level,
      top_brand: matches[0]?.brand ?? 'none',
      eligible_count: matches.length,
    });
    const params = new URLSearchParams({
      advisor: 'sliders',
      style: String(style),
      shape: String(shape),
      wave: String(wavePriority),
      handling: String(handling),
      wind: String(wind),
      level,
      construction,
      budget: String(budget),
    });
    router.push(`/results?${params.toString()}`);
  };

  const updateSlider = (name: AdvisorControlName, value: number) => {
    if (name === 'style') setStyle(value);
    else if (name === 'shape') setShape(value);
    else if (name === 'wave') setWavePriority(value);
    else if (name === 'handling') setHandling(value);
    else if (name === 'wind') setWind(value);
    else setBudget(value);
  };

  const trackSlider = (name: AdvisorControlName, value: number) => {
    track('advisor_preference_changed', { control: name, value, level });
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0B1420]/95 shadow-[0_30px_90px_rgba(0,0,0,0.35)]">
      <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-ocean/10 blur-3xl pointer-events-none" />
      <div className="relative p-5 sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-ocean">Live kite tuner</p>
            <h2 className="mt-1 font-display text-2xl font-black italic uppercase text-white">Dial in your ride.</h2>
          </div>
          <div className="text-right">
            <p className="font-display text-3xl font-black italic leading-none text-ocean">{matches.length}</p>
            <p className="text-[9px] uppercase tracking-wider text-gray-400">eligible</p>
          </div>
        </div>

        <AdvisorControls
          style={style}
          shape={shape}
          wavePriority={wavePriority}
          handling={handling}
          wind={wind}
          level={level}
          construction={construction}
          budget={budget}
          onSliderChange={updateSlider}
          onSliderCommit={trackSlider}
          onLevelChange={value => {
            setLevel(value);
            track('advisor_level_changed', { level: value });
          }}
          onConstructionChange={value => {
            setConstruction(value);
            track('advisor_construction_changed', { construction: value });
          }}
        />

        <div className="mt-5 border-t border-white/10 pt-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Live top matches</p>
            <p className="text-[9px] text-gray-400">Updates as you tune</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {topMatches.map(match => (
              <div key={match.slug} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-2.5 text-center transition-all duration-200">
                <p className="font-display text-xl font-black italic leading-none text-ocean">≈{Math.round(match.score / 5) * 5}%</p>
                <p className="mt-1 truncate text-[10px] font-bold text-gray-300">{match.brand}</p>
                <p className="truncate text-[9px] text-gray-400">{match.model}</p>
              </div>
            ))}
          </div>
        </div>

        <button type="button" onClick={openResults} className="mt-5 w-full rounded-xl bg-ocean px-6 py-3 font-display text-xl font-black italic uppercase tracking-wide text-[#08101A] shadow-[0_0_24px_rgba(0,229,255,0.3)] transition-all hover:bg-ocean-light hover:shadow-[0_0_32px_rgba(0,229,255,0.45)]">
          Explore my matches →
        </button>
      </div>
    </div>
  );
}
