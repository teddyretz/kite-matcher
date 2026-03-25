'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import kiteData from '@/data/kites.json';
import { Kite } from '@/lib/types';
import { getTopMatches, getActiveKites } from '@/lib/matcher';

const kites = getActiveKites(kiteData as Kite[]);

const styleZones = [
  { label: 'Foil', color: 'text-teal-600' },
  { label: 'Surf', color: 'text-emerald-600' },
  { label: 'Freestyle', color: 'text-violet-600' },
  { label: 'Freeride', color: 'text-blue-600' },
  { label: 'Big Air', color: 'text-orange-600' },
];

function getActiveZone(value: number): number {
  if (value <= 20) return 0;
  if (value <= 40) return 1;
  if (value <= 60) return 2;
  if (value <= 80) return 3;
  return 4;
}

const shapeLabels = [
  { label: 'Low Aspect (C/Delta)', position: 0 },
  { label: 'High Aspect (Bow/LEI)', position: 100 },
];

type Construction = 'all' | 'dacron' | 'aluula' | 'brainchild';

function filterByConstruction(kiteList: Kite[], construction: Construction): Kite[] {
  if (construction === 'all') return kiteList;
  if (construction === 'aluula') return kiteList.filter(k => k.aluula);
  if (construction === 'brainchild') return kiteList.filter(k => k.brainchild);
  return kiteList.filter(k => !k.aluula && !k.brainchild);
}

export default function StyleMatcher() {
  const [styleValue, setStyleValue] = useState(50);
  const [shapeValue, setShapeValue] = useState(50);
  const [construction, setConstruction] = useState<Construction>('all');
  const [budget, setBudget] = useState(5000);
  const router = useRouter();

  const filtered = useMemo(() => {
    let list = filterByConstruction(kites, construction);
    if (budget < 5000) list = list.filter(k => k.price_new <= budget);
    return list;
  }, [construction, budget]);

  const topMatches = useMemo(
    () => getTopMatches(filtered, styleValue, shapeValue, 3),
    [filtered, styleValue, shapeValue]
  );

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-8">
        {/* Style Slider */}
        <div>
          <label className="block text-sm font-semibold text-ocean mb-1">
            Your Riding Style
          </label>
          <p className={`text-lg font-bold mb-3 ${styleZones[getActiveZone(styleValue)].color}`}>
            {styleZones[getActiveZone(styleValue)].label}
          </p>
          <input
            type="range"
            min={0}
            max={100}
            value={styleValue}
            onChange={e => setStyleValue(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between mt-2">
            {styleZones.map((zone, i) => (
              <span key={zone.label} className={`text-xs font-medium ${i === getActiveZone(styleValue) ? zone.color : 'text-gray-400'}`}>
                {zone.label}
              </span>
            ))}
          </div>
        </div>

        {/* Shape Slider */}
        <div>
          <label className="block text-sm font-semibold text-ocean mb-4">
            Kite Character
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={shapeValue}
            onChange={e => setShapeValue(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between mt-2">
            {shapeLabels.map(l => (
              <span key={l.label} className="text-xs text-gray-500">{l.label}</span>
            ))}
          </div>
        </div>

        {/* Construction Filter */}
        <div>
          <label className="block text-sm font-semibold text-ocean mb-3">
            Construction
          </label>
          <div className="flex flex-wrap gap-2">
            {([
              { value: 'all', label: 'All' },
              { value: 'dacron', label: 'Dacron' },
              { value: 'aluula', label: 'Aluula' },
              { value: 'brainchild', label: 'Brainchild' },
            ] as const).map(opt => (
              <button
                key={opt.value}
                onClick={() => setConstruction(opt.value)}
                className={`px-4 py-1.5 text-sm rounded-full border transition-colors ${
                  construction === opt.value
                    ? 'bg-ocean text-white border-ocean'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-ocean hover:text-ocean'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Budget Slider */}
        <div>
          <label className="block text-sm font-semibold text-ocean mb-4">
            Budget: {budget >= 5000 ? 'No limit' : `Up to $${budget.toLocaleString()}`}
          </label>
          <input
            type="range"
            min={500}
            max={5000}
            step={100}
            value={budget}
            onChange={e => setBudget(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-500">$500</span>
            <span className="text-xs text-gray-500">$5,000+</span>
          </div>
        </div>

        {/* Top Matches Preview */}
        {topMatches.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-500 mb-3">Top Matches</p>
            <div className="grid grid-cols-3 gap-3">
              {topMatches.map((kite) => (
                <div
                  key={kite.id}
                  className="text-center p-3 bg-surface rounded-lg border border-gray-100"
                >
                  <div className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold mb-1 ${
                    kite.score >= 80 ? 'bg-green-100 text-green-700' :
                    kite.score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {kite.score}%
                  </div>
                  <p className="text-xs font-semibold text-slate truncate">
                    {kite.brand} {kite.model}
                  </p>
                  <p className="text-xs text-gray-400">{kite.year}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Find Kites Button */}
        <button
          onClick={() => router.push(`/results?style=${styleValue}&shape=${shapeValue}&construction=${construction}&budget=${budget}`)}
          className="w-full py-3 px-6 bg-ocean text-white font-semibold rounded-xl hover:bg-ocean-light transition-colors shadow-sm"
        >
          Find Kites
        </button>
      </div>
    </div>
  );
}
