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
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-surface/95 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
      <div className="relative p-5 sm:p-7">
        <div className="mb-6 flex items-start justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <p className="text-xs font-semibold text-ocean">Live kite finder</p>
            <h2 className="mt-1 font-display text-3xl font-black text-white">Build your riding brief</h2>
          </div>
          <div className="border-l border-white/20 pl-4 text-right">
            <p className="font-display text-4xl font-black leading-none text-ocean">{matches.length}</p>
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

        <div className="mt-6 border-t border-white/20 pt-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Live top matches</p>
            <p className="text-[9px] text-gray-400">Updates as you tune</p>
          </div>
          <div className="grid grid-cols-3 border border-white/10">
            {topMatches.map((match, index) => (
              <div key={match.slug} className="border-r border-white/10 p-2.5 text-center last:border-r-0">
                <p className="font-display text-xl font-black leading-none text-ocean">#{index + 1}</p>
                <p className="mt-1 truncate text-[10px] font-bold text-gray-300">{match.brand}</p>
                <p className="truncate text-[9px] text-gray-400">{match.model}</p>
              </div>
            ))}
          </div>
        </div>

        <button type="button" onClick={openResults} className="mt-5 w-full rounded-xl bg-ocean px-6 py-3.5 font-display text-xl font-black text-surface transition-colors hover:bg-white">
          Show my shortlist →
        </button>
      </div>
    </div>
  );
}
