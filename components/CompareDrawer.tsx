'use client';

import Link from 'next/link';
import { useCompare } from './CompareContext';

export default function CompareDrawer() {
  const { compareKites, removeFromCompare, clearCompare, allKites, kitesLoading } = useCompare();

  if (compareKites.length === 0) return null;

  const matched = new Map(allKites.map((k) => [k.slug, k]));
  const pills = compareKites.map((slug) => ({ slug, kite: matched.get(slug) }));
  const hasUnresolved = pills.some((p) => !p.kite);

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg animate-slide-up"
      role="region"
      aria-label="Compare drawer"
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        <span className="text-sm font-semibold text-slate shrink-0">
          Compare ({compareKites.length}/3)
        </span>
        <div className="flex gap-2 overflow-x-auto flex-1">
          {pills.map(({ slug, kite }) =>
            kite ? (
              <div
                key={slug}
                className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-full text-sm shrink-0"
              >
                <span className="font-medium">{kite.brand} {kite.model}</span>
                <button
                  onClick={() => removeFromCompare(slug)}
                  className="text-gray-400 hover:text-red-500"
                  aria-label={`Remove ${kite.model} from compare`}
                >
                  &times;
                </button>
              </div>
            ) : (
              <div
                key={slug}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm shrink-0 bg-gray-100 text-gray-400 animate-pulse"
                aria-busy={kitesLoading || undefined}
              >
                <span className="font-medium">{kitesLoading ? 'Loading…' : slug}</span>
                {!kitesLoading && (
                  <button
                    onClick={() => removeFromCompare(slug)}
                    className="text-gray-400 hover:text-red-500"
                    aria-label={`Remove ${slug} from compare`}
                  >
                    &times;
                  </button>
                )}
              </div>
            ),
          )}
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
            aria-disabled={hasUnresolved && kitesLoading}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              hasUnresolved && kitesLoading
                ? 'bg-gray-200 text-gray-400 pointer-events-none'
                : 'bg-ocean text-[#080D16] hover:bg-ocean-light'
            }`}
          >
            Compare Now
          </Link>
        </div>
      </div>
    </div>
  );
}

