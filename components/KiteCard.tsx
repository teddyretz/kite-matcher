'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { track } from '@vercel/analytics/react';
import type { Kite } from '@/lib/types';
import { displayFitScore, type KiteSizeRecommendation } from '@/lib/matcher';
import { primaryDisciplineForKite } from '@/lib/seo';
import { useCompare } from './CompareContext';
import { limitedEvidenceLabel } from '@/lib/reviewers';

const DISCIPLINE_LABEL: Record<string, string> = {
  freeride: 'Freeride',
  big_air: 'Big Air',
  wave: 'Wave',
  foil: 'Foil',
  freestyle: 'Freestyle',
};

function KiteImage({ slug, model, brand, compact = false }: { slug: string; model: string; brand: string; compact?: boolean }) {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    return (
      <div className={`w-full ${compact ? 'h-36' : 'h-40'} flex items-center justify-center border-b border-gray-200 bg-gray-50`}>
        <div className="text-center">
          <div className="font-mono text-sm font-bold uppercase tracking-wider text-slate">{brand}</div>
          <div className="mt-0.5 text-xs text-gray-500">{model}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full ${compact ? 'h-36' : 'h-40'} overflow-hidden border-b border-gray-200 bg-gray-50`}>
      <Image
        src={`/kites/${slug}.jpg`}
        alt={`${brand} ${model}`}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="object-cover"
        onError={() => setImgError(true)}
      />
    </div>
  );
}

interface KiteCardProps {
  kite: Kite;
  matchScore?: number;
  matchReasons?: string[];
  tradeoff?: string;
  recommendedSize?: KiteSizeRecommendation;
  compactMatch?: boolean;
  pickLabel?: string;
}

export default function KiteCard({
  kite,
  matchScore,
  matchReasons,
  tradeoff,
  recommendedSize,
  compactMatch = false,
  pickLabel,
}: KiteCardProps) {
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();
  const inCompare = isInCompare(kite.slug);
  const primaryDiscipline = DISCIPLINE_LABEL[primaryDisciplineForKite(kite)] ?? 'Freeride';
  const barLabel = kite.bar_type === 'high-y' ? 'High-Y' : kite.bar_type === 'low-v' ? 'Low-V' : 'High-Y / Low-V';

  return (
    <article className="flex flex-col border border-gray-200 bg-card transition-colors hover:border-ocean">
      <KiteImage slug={kite.slug} model={kite.model} brand={kite.brand} compact={compactMatch} />

      <div className="flex flex-1 flex-col space-y-3 p-4">
        {/* Header: Brand/year + fit score */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">
              {kite.brand} · {kite.year}
            </p>
            <h3 className="mt-0.5 truncate text-lg font-bold tracking-tight text-slate">
              {kite.model}
            </h3>
          </div>
          {matchScore !== undefined && (
            <div className="shrink-0 border border-ocean/30 bg-ocean-light px-2 py-1 text-right">
              <span className="block font-mono text-sm font-bold tabular-nums leading-none text-ocean">
                {displayFitScore(matchScore)}%
              </span>
              {pickLabel && (
                <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-wider text-ocean-dark">
                  {pickLabel}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Dense tabular spec strip */}
        <div className="grid grid-cols-3 border border-gray-200 bg-surface font-mono text-[11px] tabular-nums">
          <div className="border-r border-gray-200 px-2 py-1.5">
            <span className="block text-[9px] uppercase text-gray-400">Wind</span>
            <span className="font-semibold text-slate">{kite.wind_range_low}–{kite.wind_range_high}kt</span>
          </div>
          <div className="border-r border-gray-200 px-2 py-1.5">
            <span className="block text-[9px] uppercase text-gray-400">Frame</span>
            <span className="font-semibold text-slate">
              {kite.strut_count === 0 ? '0-st' : `${kite.strut_count}-st`} · {kite.canopy_shape}
            </span>
          </div>
          <div className="px-2 py-1.5">
            <span className="block text-[9px] uppercase text-gray-400">Bar</span>
            <span className="font-semibold text-slate">{barLabel}</span>
          </div>
        </div>

        {/* Compact tags */}
        <div className="flex flex-wrap gap-1 font-mono text-[10px]">
          <span className="border border-gray-200 bg-gray-50 px-1.5 py-0.5 font-semibold text-gray-600">
            {primaryDiscipline}
          </span>
          {kite.aluula && (
            <span className="border border-ocean/40 bg-ocean-light px-1.5 py-0.5 font-semibold text-ocean">
              Aluula
            </span>
          )}
          {kite.brainchild && (
            <span className="border border-gray-300 bg-gray-50 px-1.5 py-0.5 font-semibold text-slate">
              Brainchild
            </span>
          )}
          {recommendedSize && (
            <span className="border border-ocean bg-ocean px-1.5 py-0.5 font-semibold text-white">
              Size {recommendedSize.minSize === recommendedSize.maxSize ? `${recommendedSize.minSize}m` : `${recommendedSize.minSize}–${recommendedSize.maxSize}m`}
            </span>
          )}
        </div>

        {/* Verdict blurb */}
        {kite.structured_review?.rec_blurb && (
          <p className="line-clamp-2 text-xs leading-relaxed text-gray-600">
            {kite.structured_review.rec_blurb}
          </p>
        )}

        {/* Rating + price */}
        <div className="flex items-baseline justify-between border-t border-gray-100 pt-2.5 font-mono text-xs tabular-nums">
          {kite.structured_review ? (
            limitedEvidenceLabel(kite.structured_review.sources) ? (
              <span className="text-gray-500">
                {kite.structured_review.rating.toFixed(1)}/5 ·{' '}
                <span className="font-bold uppercase text-sand">{limitedEvidenceLabel(kite.structured_review.sources)}</span>
              </span>
            ) : (
              <span className="text-gray-600">
                <strong className="text-slate">{kite.structured_review.rating.toFixed(1)}</strong>/5 ·{' '}
                {kite.structured_review.sources.length}{' '}
                {kite.structured_review.sources.length === 1 ? 'src' : 'srcs'}
              </span>
            )
          ) : (
            <span className="text-gray-400">No synthesis yet</span>
          )}
          <span className="font-bold text-slate">${kite.price_new.toLocaleString()}</span>
        </div>

        {/* Match reasons / tradeoff */}
        {matchReasons && matchReasons.length > 0 && (
          <div className="border border-gray-200 bg-surface p-2.5 text-[11px] leading-4 text-gray-600">
            <ul className="space-y-1">
              {matchReasons.slice(0, 2).map((reason) => (
                <li key={reason} className="flex gap-1.5">
                  <span className="font-mono font-bold text-ocean">+</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
            {tradeoff && (
              <p className="mt-1.5 border-t border-gray-200 pt-1.5 text-[11px] text-sand">
                <span className="font-mono font-bold">−</span> {tradeoff}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-auto flex gap-2 pt-1">
          <Link
            href={`/kite/${kite.slug}`}
            onClick={() =>
              track('kite_detail_opened', {
                slug: kite.slug,
                source: matchScore === undefined ? 'catalog' : 'results',
              })
            }
            className="flex-1 border border-slate bg-slate px-3 py-2 text-center text-xs font-semibold text-white transition-colors hover:border-ocean hover:bg-ocean"
          >
            Specs &amp; reviews
          </Link>
          <button
            type="button"
            onClick={() => {
              if (inCompare) removeFromCompare(kite.slug);
              else {
                addToCompare(kite.slug);
                track('kite_added_to_compare', {
                  slug: kite.slug,
                  source: matchScore === undefined ? 'catalog' : 'results',
                });
              }
            }}
            aria-label={inCompare ? `Remove ${kite.model} from compare` : `Add ${kite.model} to compare`}
            aria-pressed={inCompare}
            className={`min-h-9 min-w-9 border px-3 py-1.5 font-mono text-xs font-bold transition-colors ${
              inCompare
                ? 'border-ocean bg-ocean-light text-ocean'
                : 'border-gray-300 bg-card text-gray-600 hover:border-ocean hover:text-ocean'
            }`}
          >
            {inCompare ? '✓' : '+'}
          </button>
        </div>
      </div>
    </article>
  );
}
