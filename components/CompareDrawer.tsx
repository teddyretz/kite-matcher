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
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-4">
        <span className="text-xs sm:text-sm font-semibold text-slate shrink-0">
          <span className="hidden sm:inline">Compare </span>({compareKites.length}/3)
        </span>
        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto flex-1 min-w-0">
          {pills.map(({ slug, kite }) =>
            kite ? (
              <div
                key={slug}
                className="flex items-center gap-1.5 sm:gap-2 bg-surface px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm shrink-0"
              >
                <span className="font-medium whitespace-nowrap">{kite.brand} {kite.model}</span>
                <button
                  onClick={() => removeFromCompare(slug)}
                  className="text-gray-400 hover:text-red-500 leading-none"
                  aria-label={`Remove ${kite.model} from compare`}
                >
                  &times;
                </button>
              </div>
            ) : (
              <div
                key={slug}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm shrink-0 bg-gray-100 text-gray-400 animate-pulse"
                aria-busy={kitesLoading || undefined}
              >
                <span className="font-medium whitespace-nowrap">{kitesLoading ? 'Loading…' : slug}</span>
                {!kitesLoading && (
                  <button
                    onClick={() => removeFromCompare(slug)}
                    className="text-gray-400 hover:text-red-500 leading-none"
                    aria-label={`Remove ${slug} from compare`}
                  >
                    &times;
                  </button>
                )}
              </div>
            ),
          )}
        </div>
        <div className="flex gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={clearCompare}
            className="text-xs sm:text-sm text-gray-500 hover:text-red-500 px-2 sm:px-3 py-1.5"
          >
            Clear
          </button>
          <Link
            href={`/compare?kites=${compareKites.join(',')}`}
            aria-disabled={hasUnresolved && kitesLoading}
            className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              hasUnresolved && kitesLoading
                ? 'bg-gray-200 text-gray-400 pointer-events-none'
                : 'bg-ocean text-[#080D16] hover:bg-ocean-light'
            }`}
          >
            <span className="hidden sm:inline">Compare Now</span>
            <span className="sm:hidden">Compare</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

