'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Kite, SkillLevel } from '@/lib/types';
import { getSliderAdvisorMatches, type KiteConstruction } from '@/lib/matcher';

const styleZones = ['Foil', 'Surf', 'Freestyle', 'Freeride', 'Big Air'];

function styleLabel(value: number): string {
  return styleZones[Math.min(4, Math.floor(value / 20))];
}

function rangePct(value: number, min = 0, max = 100): string {
  return `${((value - min) / (max - min)) * 100}%`;
}

type SliderRowProps = {
  label: string;
  valueLabel: string;
  value: number;
  onChange: (value: number) => void;
  left: string;
  right: string;
};

function SliderRow({ label, valueLabel, value, onChange, left, right }: SliderRowProps) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">{label}</label>
        <span className="text-xs font-bold text-ocean">{valueLabel}</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={event => onChange(Number(event.target.value))}
        className="w-full"
        style={{ '--range-pct': rangePct(value) } as React.CSSProperties}
        aria-label={label}
        aria-valuetext={valueLabel}
      />
      <div className="mt-1.5 flex justify-between text-[9px] text-gray-400">
        <span>{left}</span>
        <span>{right}</span>
      </div>
    </div>
  );
}

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

        <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
          <SliderRow label="Riding style" valueLabel={styleLabel(style)} value={style} onChange={setStyle} left="Foil" right="Big air" />
          <SliderRow label="Kite shape" valueLabel={shape < 35 ? 'Low aspect' : shape > 65 ? 'High aspect' : 'Medium aspect'} value={shape} onChange={setShape} left="Low aspect · C" right="High aspect · Bow" />
          <SliderRow label="Wave priority" valueLabel={wavePriority < 30 ? 'Low' : wavePriority > 70 ? 'Core priority' : 'Important'} value={wavePriority} onChange={setWavePriority} left="Not important" right="Wave focused" />
          <SliderRow label="Handling" valueLabel={handling < 35 ? 'Calm & forgiving' : handling > 65 ? 'Fast & reactive' : 'Balanced'} value={handling} onChange={setHandling} left="Forgiving" right="Performance" />
          <SliderRow label="Typical wind" valueLabel={wind < 35 ? 'Mostly light' : wind > 65 ? 'Mostly strong' : 'Mixed conditions'} value={wind} onChange={setWind} left="Light wind" right="Strong wind" />
          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">Maximum price</label>
              <span className="text-xs font-bold text-ocean">{budget >= 5000 ? 'No limit' : `$${budget.toLocaleString()}`}</span>
            </div>
            <input type="range" min={800} max={5000} step={100} value={budget} onChange={event => setBudget(Number(event.target.value))} className="w-full" style={{ '--range-pct': rangePct(budget, 800, 5000) } as React.CSSProperties} aria-label="Maximum price" aria-valuetext={budget >= 5000 ? 'No limit' : `$${budget}`} />
            <div className="mt-1.5 flex justify-between text-[9px] text-gray-400"><span>$800</span><span>No limit</span></div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 border-t border-white/10 pt-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">Rider level</p>
            <div className="flex gap-1.5">
              {(['beginner', 'intermediate', 'advanced'] as const).map(value => (
                <button key={value} type="button" aria-pressed={level === value} onClick={() => setLevel(value)} className={`flex-1 rounded-lg border px-2 py-1.5 text-[10px] font-semibold capitalize transition-colors ${level === value ? 'border-ocean bg-ocean/10 text-ocean' : 'border-white/10 text-gray-500 hover:border-white/20'}`}>{value}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">Construction</p>
            <div className="flex flex-wrap gap-1.5">
              {(['all', 'dacron', 'aluula', 'brainchild'] as const).map(value => (
                <button key={value} type="button" aria-pressed={construction === value} onClick={() => setConstruction(value)} className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold capitalize transition-colors ${construction === value ? 'border-ocean bg-ocean/10 text-ocean' : 'border-white/10 text-gray-500 hover:border-white/20'}`}>{value === 'all' ? 'Any' : value}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 border-t border-white/10 pt-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Live top matches</p>
            <p className="text-[9px] text-gray-400">Updates as you tune</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {matches.slice(0, 3).map(match => (
              <div key={match.slug} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-2.5 text-center transition-all duration-200">
                <p className="font-display text-xl font-black italic leading-none text-ocean">{match.score}%</p>
                <p className="mt-1 truncate text-[10px] font-bold text-gray-700">{match.brand}</p>
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
