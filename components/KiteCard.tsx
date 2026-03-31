'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Kite } from '@/lib/types';
import { useCompare } from './CompareContext';

function getStyleZone(spectrum: number): string {
  if (spectrum <= 20) return 'Foil';
  if (spectrum <= 40) return 'Surf';
  if (spectrum <= 60) return 'Freestyle';
  if (spectrum <= 80) return 'Freeride';
  return 'Big Air';
}

function StarRating({ score }: { score: number }) {
  const full = Math.floor(score);
  const hasHalf = score - full >= 0.3;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg
          key={i}
          className={`w-3.5 h-3.5 ${
            i <= full
              ? 'text-sand'
              : i === full + 1 && hasHalf
              ? 'text-sand/50'
              : 'text-gray-200'
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="ml-1 text-xs text-gray-400">{score.toFixed(1)}</span>
    </div>
  );
}

function KiteImage({ slug, model, brand }: { slug: string; model: string; brand: string }) {
  const [imgError, setImgError] = useState(false);
  const brandColors: Record<string, string> = {
    Duotone:   '#00A3E0',
    Cabrinha:  '#E31937',
    Core:      '#FF6B00',
    North:     '#E8EFFF',
    Eleveight: '#6366F1',
    'F-One':   '#00B4D8',
    Ozone:     '#22C55E',
    Slingshot: '#EAB308',
    Naish:     '#3B82F6',
    Airush:    '#EC4899',
    Reedin:    '#8B5CF6',
    Flysurfer: '#14B8A6',
    Harlem:    '#F97316',
  };

  if (imgError) {
    const color = brandColors[brand] || '#3D5870';
    return (
      <div
        className="w-full h-44 flex items-center justify-center bg-gray-50"
        style={{ borderBottom: `1px solid ${color}20` }}
      >
        <div className="text-center">
          <div
            className="font-display font-black italic text-3xl uppercase tracking-wide"
            style={{ color }}
          >
            {brand}
          </div>
          <div className="text-xs text-gray-400 mt-1">{model}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-44 overflow-hidden bg-gray-50">
      <Image
        src={`/kites/${slug}.jpg`}
        alt={`${brand} ${model}`}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="object-cover group-hover:scale-105 transition-transform duration-500"
        onError={() => setImgError(true)}
      />
      {/* Fade bottom into card */}
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-gray-50 to-transparent" />
    </div>
  );
}

interface KiteCardProps {
  kite: Kite;
  matchScore?: number;
}

export default function KiteCard({ kite, matchScore }: KiteCardProps) {
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();
  const inCompare = isInCompare(kite.slug);

  return (
    <div className="group bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden hover:border-gray-200 transition-all duration-300 hover:shadow-[0_0_40px_rgba(0,229,255,0.06)]">
      <KiteImage slug={kite.slug} model={kite.model} brand={kite.brand} />

      <div className="px-4 pb-5 pt-1 space-y-3">
        {/* Brand + match score */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400">
            {kite.brand}
          </span>
          {matchScore !== undefined && (
            <span className={`font-display font-black italic text-xl leading-none ${
              matchScore >= 80 ? 'text-ocean' :
              matchScore >= 60 ? 'text-sand' :
              'text-gray-400'
            }`}>
              {matchScore}%
            </span>
          )}
        </div>

        {/* Model name */}
        <div>
          <h3 className="font-display font-bold italic text-xl uppercase tracking-wide text-slate leading-tight">
            {kite.model}{' '}
            <span className="text-gray-400 font-normal not-italic text-sm normal-case tracking-normal">
              {kite.year}
            </span>
          </h3>
          {kite.structured_review?.rec_blurb && (
            <p className="text-xs text-gray-500 mt-1 leading-snug line-clamp-2">
              {kite.structured_review.rec_blurb}
            </p>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {kite.teds_pick && (
            <span className="px-2 py-0.5 bg-sand/15 text-sand text-[10px] rounded font-bold uppercase tracking-wide">
              Ted&apos;s Pick
            </span>
          )}
          <span className="px-2 py-0.5 bg-ocean/10 text-ocean text-[10px] rounded font-medium">
            {getStyleZone(kite.style_spectrum)}
          </span>
          {kite.aluula && (
            <span className="px-2 py-0.5 bg-violet-500/10 text-violet-400 text-[10px] rounded font-medium">
              Aluula
            </span>
          )}
          {kite.brainchild && (
            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] rounded font-medium">
              Brainchild
            </span>
          )}
          {kite.snow_kite && (
            <span className="px-2 py-0.5 bg-sky-500/10 text-sky-400 text-[10px] rounded font-medium">
              Snow
            </span>
          )}
          {kite.discontinued && (
            <span className="px-2 py-0.5 bg-gray-200/30 text-gray-400 text-[10px] rounded font-medium">
              Discontinued
            </span>
          )}
        </div>

        {/* Rating + price */}
        <div className="flex items-center justify-between">
          {kite.structured_review?.rating ? (
            <StarRating score={kite.structured_review.rating} />
          ) : (
            <div />
          )}
          <span className="text-sm font-bold text-slate">
            ${kite.price_new.toLocaleString()}
          </span>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 pt-1">
          <Link
            href={`/kite/${kite.slug}`}
            className="flex-1 text-center py-2 px-3 bg-ocean text-[#080D16] text-sm font-bold rounded-lg hover:bg-ocean-light transition-colors"
          >
            View
          </Link>
          <button
            onClick={() =>
              inCompare ? removeFromCompare(kite.slug) : addToCompare(kite.slug)
            }
            className={`py-2 px-4 text-sm font-semibold rounded-lg border transition-all ${
              inCompare
                ? 'bg-ocean/10 border-ocean/40 text-ocean'
                : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-600'
            }`}
          >
            {inCompare ? '✓' : '+'}
          </button>
        </div>
      </div>
    </div>
  );
}
