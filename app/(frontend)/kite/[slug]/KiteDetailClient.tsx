'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Kite, ReviewEntry } from "@/lib/types";
import { getRelatedKites } from '@/lib/matcher';
import { retailerSearchUrls } from '@/lib/retailers';
import SpectrumBar from '@/components/SpectrumBar';
import StructuredReview from '@/components/StructuredReview';
import YouTubeReviews from '@/components/YouTubeReviews';
import KiteCard from '@/components/KiteCard';
import UserReviews from '@/components/UserReviews';

export default function KiteDetailClient({ kite, allKites }: { kite: Kite; allKites: Kite[] }) {
  const related = getRelatedKites(kite, allKites, 3);
  const youtubeReviews = (kite.reviews ?? []).filter(
    (r): r is Extract<ReviewEntry, { source: 'youtube' }> => r.source === 'youtube',
  );
  const [imgError, setImgError] = useState(false);

  const specs = [
    ['Aspect Ratio', kite.aspect_ratio.replace('-', ' ')],
    ['Struts', kite.strut_count === 0 ? 'Strutless' : kite.strut_count.toString()],
    ['Bar Type', kite.bar_type === 'high-y' ? 'High-Y' : kite.bar_type === 'low-v' ? 'Low-V' : 'Both'],
    ['Turning Speed', kite.turning_speed],
    ['Low-End Power', `${kite.low_end_power}/10`],
    ['Depower Range', `${kite.depower_range}/10`],
    ['Relaunch', kite.relaunch],
    ['Wind Range', `${kite.wind_range_low}–${kite.wind_range_high} knots`],
    ['Sizes', kite.sizes.join(', ') + 'm'],
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/kites" className="hover:text-ocean">Browse</Link>
        <span className="mx-2">/</span>
        <span className="text-slate">{kite.brand} {kite.model} {kite.year}</span>
      </nav>

      {/* Hero */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="grid md:grid-cols-2 gap-0">
          <div className="relative h-48 sm:h-64 md:h-auto md:min-h-[320px] bg-gray-50 overflow-hidden">
            {imgError ? (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                {kite.brand} {kite.model}
              </div>
            ) : (
              <Image
                src={`/kites/${kite.slug}.jpg`}
                alt={`${kite.brand} ${kite.model} ${kite.year} kite`}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                onError={() => setImgError(true)}
              />
            )}
          </div>
          <div className="p-6 sm:p-8">
            <p className="text-sm text-gray-500 mb-1">{kite.brand} &middot; {kite.year}</p>
            <h1 className="text-3xl font-bold text-slate mb-3">{kite.model}</h1>
            <div className="flex flex-wrap gap-2 mb-4">
              {kite.teds_pick && <span className="px-3 py-1 bg-amber-100 text-amber-700 text-sm rounded-full font-medium">Ted&apos;s Pick</span>}
              {kite.style_tags.map(tag => (
                <span key={tag} className="px-3 py-1 bg-ocean/5 text-ocean text-sm rounded-full">{tag}</span>
              ))}
              {kite.aluula && <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full font-medium">Aluula</span>}
              {kite.brainchild && <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full font-medium">Brainchild</span>}
              {kite.snow_kite && <span className="px-3 py-1 bg-sky-100 text-sky-700 text-sm rounded-full font-medium">Great for Snow</span>}
            </div>
            <p className="text-gray-600 mb-6">{kite.summary}</p>
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-slate">Best for:</span> {kite.best_for}
            </p>
          </div>
        </div>
      </div>

      {/* Spectrum Bars */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8 space-y-6">
        <h2 className="text-lg font-bold text-slate">Style Placement</h2>
        <SpectrumBar
          label="Riding Style"
          value={kite.style_spectrum}
          leftLabel="Foil"
          rightLabel="Big Air"
        />
        <SpectrumBar
          label="Kite Shape"
          value={kite.shape_spectrum}
          leftLabel="Low Aspect (C/Delta)"
          rightLabel="High Aspect (Bow/LEI)"
        />
      </div>

      {/* Specs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <h2 className="text-lg font-bold text-slate mb-4">Specifications</h2>
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
          {specs.map(([label, value]) => (
            <div key={label} className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">{label}</span>
              <span className="text-sm font-medium text-slate capitalize">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Expert Review */}
      {kite.structured_review ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="text-lg font-bold text-slate mb-4">Expert Review</h2>
          <StructuredReview review={kite.structured_review} />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="text-lg font-bold text-slate mb-2">Expert Review</h2>
          <p className="text-sm text-gray-500">
            We haven&apos;t published a detailed review for this kite yet. Check back soon.
          </p>
        </div>
      )}

      {/* Video Reviews */}
      {youtubeReviews.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="text-lg font-bold text-slate mb-4">Video Reviews</h2>
          <YouTubeReviews reviews={youtubeReviews} />
        </div>
      )}

      {/* User Reviews */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <UserReviews kiteSlug={kite.slug} />
      </div>

      {/* Pricing */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <h2 className="text-lg font-bold text-slate mb-4">Where to Buy</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-3">New</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {kite.buy_links.new.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-ocean transition-colors"
                >
                  <span className="font-medium text-sm">{link.retailer}</span>
                  <span className="text-ocean font-bold">${link.price.toLocaleString()}</span>
                </a>
              ))}
            </div>
          </div>
          {kite.price_new_aluula && (
            <p className="text-sm text-gray-500">Aluula version from ${kite.price_new_aluula.toLocaleString()}</p>
          )}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-3">Used</h3>
            <div className="flex flex-wrap gap-3">
              {kite.buy_links.used.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-ocean hover:underline"
                >
                  {link.source} &rarr;
                </a>
              ))}
            </div>
          </div>

          {/* Search retailers — guaranteed-working fallback links */}
          <div className="pt-6 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-500 mb-3">
              Or search popular retailers
            </h3>
            <div className="flex flex-wrap gap-2">
              {retailerSearchUrls(kite).map((r) => (
                <a
                  key={r.name}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 border border-gray-200 rounded-full text-gray-600 hover:border-ocean hover:text-ocean transition-colors"
                >
                  <span className="font-medium">{r.name}</span>
                  {r.region && <span className="text-gray-400">· {r.region}</span>}
                  <span aria-hidden>→</span>
                </a>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-gray-400">
              Direct retailer pricing changes often. The links above run a search at each shop for {kite.brand} {kite.model} {kite.year}.
            </p>
          </div>
        </div>
      </div>

      {/* Related Kites */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-slate mb-4">Similar Kites</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {related.map(k => (
            <KiteCard key={k.id} kite={k} />
          ))}
        </div>
      </div>
    </div>
  );
}
