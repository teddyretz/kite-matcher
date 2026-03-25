'use client';

import { useState } from 'react';
import Link from 'next/link';
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
        <svg key={i} className={`w-4 h-4 ${i <= full ? 'text-sand' : i === full + 1 && hasHalf ? 'text-sand' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="ml-1 text-xs text-gray-500">{score.toFixed(1)}</span>
    </div>
  );
}

function KiteImage({ slug, model, brand }: { slug: string; model: string; brand: string }) {
  const [imgError, setImgError] = useState(false);
  const brandColors: Record<string, string> = {
    Duotone: '#00A3E0', Cabrinha: '#E31937', Core: '#FF6B00', North: '#1B1B1B',
    Eleveight: '#6366F1', 'F-One': '#00B4D8', Ozone: '#22C55E', Slingshot: '#EAB308',
    Naish: '#3B82F6', Airush: '#EC4899', Reedin: '#8B5CF6', Flysurfer: '#14B8A6', Harlem: '#F97316',
  };

  if (imgError) {
    const color = brandColors[brand] || '#6B7280';
    return (
      <div className="w-full h-48 rounded-t-xl flex items-center justify-center" style={{ backgroundColor: color + '15' }}>
        <span className="text-sm font-medium" style={{ color }}>{brand} {model}</span>
      </div>
    );
  }

  return (
    <div className="w-full h-48 rounded-t-xl overflow-hidden bg-gray-50">
      <img
        src={`/kites/${slug}.jpg`}
        alt={`${brand} ${model}`}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        onError={() => setImgError(true)}
      />
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
      <KiteImage slug={kite.slug} model={kite.model} brand={kite.brand} />
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500">{kite.brand}</p>
            <h3 className="font-bold text-slate">{kite.model} <span className="text-gray-400 font-normal">{kite.year}</span></h3>
          </div>
          {matchScore !== undefined && (
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
              matchScore >= 80 ? 'bg-green-100 text-green-700' :
              matchScore >= 60 ? 'bg-yellow-100 text-yellow-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              {matchScore}%
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1">
          {kite.teds_pick && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">Ted&apos;s Pick</span>}
          <span className="px-2 py-0.5 bg-ocean/5 text-ocean text-xs rounded-full">
            {getStyleZone(kite.style_spectrum)}
          </span>
          {kite.style_tags.slice(0, 2).map(tag => (
            <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
              {tag}
            </span>
          ))}
          {kite.aluula && <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">Aluula</span>}
          {kite.brainchild && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">Brainchild</span>}
          {kite.snow_kite && <span className="px-2 py-0.5 bg-sky-100 text-sky-700 text-xs rounded-full font-medium">Great for Snow</span>}
          {kite.discontinued && <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">Discontinued</span>}
        </div>

        <StarRating score={kite.structured_review?.rating ?? 0} />

        <p className="text-sm font-semibold text-slate">
          From ${kite.price_new.toLocaleString()}
        </p>

        <div className="flex gap-2 pt-1">
          <Link
            href={`/kite/${kite.slug}`}
            className="flex-1 text-center py-2 px-3 bg-ocean text-white text-sm font-medium rounded-lg hover:bg-ocean-light transition-colors"
          >
            View Kite
          </Link>
          <button
            onClick={() => inCompare ? removeFromCompare(kite.slug) : addToCompare(kite.slug)}
            className={`py-2 px-3 text-sm font-medium rounded-lg border transition-colors ${
              inCompare
                ? 'bg-sand/10 border-sand text-sand-dark'
                : 'border-gray-200 text-gray-600 hover:border-ocean hover:text-ocean'
            }`}
          >
            {inCompare ? '✓ Added' : 'Compare'}
          </button>
        </div>
      </div>
    </div>
  );
}
