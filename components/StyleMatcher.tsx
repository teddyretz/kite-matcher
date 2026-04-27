'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Kite } from '@/lib/types';
import { getTopMatches } from '@/lib/matcher';

interface StyleMatcherProps {
  kites: Kite[];
}

const styleZones = [
  { label: 'Foil',      color: 'text-teal-400'    },
  { label: 'Surf',      color: 'text-emerald-400'  },
  { label: 'Freestyle', color: 'text-violet-400'   },
  { label: 'Freeride',  color: 'text-blue-400'     },
  { label: 'Big Air',   color: 'text-orange-400'   },
];

function getActiveZone(value: number): number {
  if (value <= 20) return 0;
  if (value <= 40) return 1;
  if (value <= 60) return 2;
  if (value <= 80) return 3;
  return 4;
}

type Construction = 'all' | 'dacron' | 'aluula' | 'brainchild';

function filterByConstruction(kiteList: Kite[], construction: Construction): Kite[] {
  if (construction === 'all') return kiteList;
  if (construction === 'aluula') return kiteList.filter(k => k.aluula);
  if (construction === 'brainchild') return kiteList.filter(k => k.brainchild);
  return kiteList.filter(k => !k.aluula && !k.brainchild);
}

function rangePct(value: number, min: number, max: number): string {
  return `${((value - min) / (max - min)) * 100}%`;
}

export default function StyleMatcher({ kites }: StyleMatcherProps) {
  const [styleValue, setStyleValue] = useState(50);
  const [shapeValue, setShapeValue] = useState(50);
  const [construction, setConstruction] = useState<Construction>('all');
  const [budget, setBudget] = useState(5000);
  const router = useRouter();

  const filtered = useMemo(() => {
    let list = filterByConstruction(kites, construction);
    if (budget < 5000) list = list.filter(k => k.price_new <= budget);
    return list;
  }, [kites, construction, budget]);

  const topMatches = useMemo(
    () => getTopMatches(filtered, styleValue, shapeValue, 3),
    [filtered, styleValue, shapeValue]
  );

  const activeZone = styleZones[getActiveZone(styleValue)];

  return (
    <div className="w-full">
      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 sm:p-7 space-y-6">

        {/* Style Slider */}
        <div>
          <div className="flex items-baseline justify-between mb-3">
            <label className="text-xs font-semibold tracking-widest uppercase text-gray-500">
              Riding Style
            </label>
            <span className={`font-display font-bold italic text-2xl uppercase leading-none ${activeZone.color}`}>
              {activeZone.label}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={styleValue}
            onChange={e => setStyleValue(Number(e.target.value))}
            className="w-full"
            style={{ '--range-pct': rangePct(styleValue, 0, 100) } as React.CSSProperties}
          />
          <div className="flex justify-between mt-2">
            {styleZones.map((zone, i) => (
              <span
                key={zone.label}
                className={`text-[10px] font-medium transition-colors ${
                  i === getActiveZone(styleValue) ? zone.color : 'text-gray-400'
                }`}
              >
                {zone.label}
              </span>
            ))}
          </div>
        </div>

        {/* Shape Slider */}
        <div>
          <div className="flex items-baseline justify-between mb-3">
            <label className="text-xs font-semibold tracking-widest uppercase text-gray-500">
              Kite Character
            </label>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={shapeValue}
            onChange={e => setShapeValue(Number(e.target.value))}
            className="w-full"
            style={{ '--range-pct': rangePct(shapeValue, 0, 100) } as React.CSSProperties}
          />
          <div className="flex justify-between mt-2">
            <span className="text-[10px] text-gray-400">C / Delta</span>
            <span className="text-[10px] text-gray-400">Bow / LEI</span>
          </div>
        </div>

        {/* Construction */}
        <div>
          <label className="text-xs font-semibold tracking-widest uppercase text-gray-500 mb-3 block">
            Construction
          </label>
          <div className="flex flex-wrap gap-2">
            {(['all', 'dacron', 'aluula', 'brainchild'] as const).map(opt => (
              <button
                key={opt}
                onClick={() => setConstruction(opt)}
                className={`px-3 py-1 text-xs font-semibold rounded-full border capitalize transition-all duration-200 ${
                  construction === opt
                    ? 'bg-ocean border-ocean text-[#080D16] shadow-[0_0_12px_rgba(0,229,255,0.3)]'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-600'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Budget */}
        <div>
          <div className="flex items-baseline justify-between mb-3">
            <label className="text-xs font-semibold tracking-widest uppercase text-gray-500">
              Budget
            </label>
            <span className="text-sm font-bold text-slate">
              {budget >= 5000 ? 'No limit' : `$${budget.toLocaleString()}`}
            </span>
          </div>
          <input
            type="range"
            min={500}
            max={5000}
            step={100}
            value={budget}
            onChange={e => setBudget(Number(e.target.value))}
            className="w-full"
            style={{ '--range-pct': rangePct(budget, 500, 5000) } as React.CSSProperties}
          />
          <div className="flex justify-between mt-2">
            <span className="text-[10px] text-gray-400">$500</span>
            <span className="text-[10px] text-gray-400">$5,000+</span>
          </div>
        </div>

        {/* Top Matches Preview */}
        {topMatches.length > 0 && (
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-gray-500 mb-3">
              Top Matches
            </p>
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              {topMatches.map((kite) => (
                <div
                  key={kite.id}
                  className="p-3 bg-surface rounded-xl border border-gray-100 text-center"
                >
                  <div className={`font-display font-black italic text-xl leading-none mb-1 ${
                    kite.score >= 80 ? 'text-ocean' :
                    kite.score >= 60 ? 'text-sand' :
                    'text-gray-500'
                  }`}>
                    {kite.score}%
                  </div>
                  <p className="text-[11px] font-semibold text-slate truncate leading-snug">{kite.brand}</p>
                  <p className="text-[10px] text-gray-400 truncate">{kite.model}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={() =>
            router.push(
              `/results?style=${styleValue}&shape=${shapeValue}&construction=${construction}&budget=${budget}`
            )
          }
          className="w-full py-3.5 px-6 bg-ocean text-[#080D16] font-display font-black italic text-2xl uppercase tracking-wide rounded-xl hover:bg-ocean-light transition-all duration-200 shadow-[0_0_24px_rgba(0,229,255,0.35)] hover:shadow-[0_0_32px_rgba(0,229,255,0.5)]"
        >
          Find Kites →
        </button>
      </div>
    </div>
  );
}
