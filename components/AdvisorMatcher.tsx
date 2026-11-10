'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { track } from '@vercel/analytics/react';
import type { Kite, SkillLevel } from '@/lib/types';
import { getSliderAdvisorMatches, type KiteConstruction } from '@/lib/matcher';
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
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-surface/95 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
      <div className="relative p-5 sm:p-6 lg:p-7">
        <div className="mb-5 border-b border-white/10 pb-4">
          <div>
            <p className="text-xs font-semibold text-ocean">Kite matcher</p>
            <h2 className="mt-1 font-display text-3xl font-black text-white">Tell us how you ride</h2>
            <p className="mt-1.5 text-sm text-gray-400">Choose a few basics and we&apos;ll narrow {kites.length} kites to your best matches.</p>
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

        <div className="mt-5 flex flex-col gap-3 border-t border-white/20 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-baseline gap-2">
            <strong className="font-display text-3xl font-black leading-none text-ocean">{matches.length}</strong>
            <span className="text-sm font-semibold text-gray-300">kites match</span>
          </div>
          <button type="button" onClick={openResults} className="w-full rounded-lg bg-ocean px-8 py-3.5 font-display text-xl font-black text-surface transition-colors hover:bg-white sm:w-auto">
            View my matches →
          </button>
        </div>
      </div>
    </div>
  );
}
