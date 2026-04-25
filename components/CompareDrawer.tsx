'use client';

import Link from 'next/link';
import { useCompare } from './CompareContext';
import { Kite } from '@/lib/types';

export default function CompareDrawer() {
  const { compareKites, removeFromCompare, clearCompare, allKites } = useCompare();

  if (compareKites.length === 0) return null;

  const selected = compareKites
    .map(slug => allKites.find(k => k.slug === slug))
    .filter(Boolean) as Kite[];

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg animate-slide-up"
      role="region"
      aria-label="Compare drawer"
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        <span className="text-sm font-semibold text-slate shrink-0">
          Compare ({selected.length}/3)
        </span>
        <div className="flex gap-2 overflow-x-auto flex-1">
          {selected.map(kite => (
            <div
              key={kite.slug}
              className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-full text-sm shrink-0"
            >
              <span className="font-medium">{kite.brand} {kite.model}</span>
              <button
                onClick={() => removeFromCompare(kite.slug)}
                className="text-gray-400 hover:text-red-500"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={clearCompare}
            className="text-sm text-gray-500 hover:text-red-500 px-3 py-1.5"
          >
            Clear
          </button>
          <Link
            href={`/compare?kites=${compareKites.join(',')}`}
            className="px-4 py-1.5 bg-ocean text-white text-sm font-medium rounded-lg hover:bg-ocean-light transition-colors"
          >
            Compare Now
          </Link>
        </div>
      </div>
    </div>
  );
}
