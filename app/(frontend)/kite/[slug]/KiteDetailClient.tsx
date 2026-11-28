'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { track } from '@vercel/analytics/react';
import type { DisciplineKey, Kite, ReviewEntry } from '@/lib/types';
import { getRelatedKites, recommendKiteSizeRange, type BoardType } from '@/lib/matcher';
import { retailerSearchUrls } from '@/lib/retailers';
import { brandSlug } from '@/lib/seo';
import StructuredReview from '@/components/StructuredReview';
import YouTubeReviews from '@/components/YouTubeReviews';
import OwnerReports from '@/components/OwnerReports';
import KiteCard from '@/components/KiteCard';
import UserReviews from '@/components/UserReviews';
import { normalizeBuyLink } from '@/lib/buyLinks';
import { sourceMixLabel, sourceType } from '@/lib/reviewers';

const DISCIPLINE_ROWS: Array<{ key: DisciplineKey; label: string }> = [
  { key: 'freeride', label: 'Freeride' },
  { key: 'big_air', label: 'Big Air' },
  { key: 'wave', label: 'Wave' },
  { key: 'foil', label: 'Foil' },
  { key: 'freestyle', label: 'Freestyle' },
];

function buyLinkTypeMeta(type?: 'direct_product' | 'search_fallback') {
  if (type === 'direct_product') return { badge: 'Direct', detail: 'Product page' };
  return { badge: 'Search', detail: 'Retailer search' };
}

export default function KiteDetailClient({ kite, allKites }: { kite: Kite; allKites: Kite[] }) {
  const related = getRelatedKites(kite, allKites, 3);
  const youtubeReviews = (kite.reviews ?? []).filter(
    (r): r is Extract<ReviewEntry, { source: 'youtube' }> => r.source === 'youtube',
  );
  const forumReports = (kite.reviews ?? []).filter(
    (r): r is Extract<ReviewEntry, { source: 'forum' }> => r.source === 'forum',
  );
  const [imgError, setImgError] = useState(false);

  // Interactive rider-weight kite size estimator
  const [riderWeightKg, setRiderWeightKg] = useState(80);
  const [windKnots, setWindKnots] = useState(
    Math.round((kite.wind_range_low + kite.wind_range_high) / 2),
  );
  const [boardType, setBoardType] = useState<BoardType>(
    kite.canopy_shape === 'foil' ? 'hydrofoil' : 'twin-tip',
  );

  const sizeRec = useMemo(
    () => recommendKiteSizeRange(kite, riderWeightKg, windKnots, boardType),
    [kite, riderWeightKg, windKnots, boardType],
  );

  const evidenceSources = kite.structured_review?.sources ?? [];
  const evidenceLabel = sourceMixLabel(evidenceSources);
  const allIndependent =
    evidenceSources.length > 0 && evidenceSources.every((s) => sourceType(s) === 'independent');

  const specs = [
    ['Canopy Shape', kite.canopy_shape.toUpperCase()],
    ['Aspect Ratio', kite.aspect_ratio.replace('-', ' ')],
    ['Struts', kite.strut_count === 0 ? 'Strutless' : String(kite.strut_count)],
    ['Bar System', kite.bar_type === 'high-y' ? 'High-Y' : kite.bar_type === 'low-v' ? 'Low-V' : 'High-Y / Low-V'],
    ['Bar Pressure', kite.bar_pressure],
    ['Flying Style', kite.flying_style.replace(/-/g, ' ')],
    ['Turning Speed', kite.turning_speed],
    ['Low-End Power', `${kite.low_end_power}/10`],
    ['Depower Range', `${kite.depower_range}/10`],
    ['Relaunch', kite.relaunch],
    ['Wind Range', `${kite.wind_range_low}–${kite.wind_range_high} kt`],
    ['Sizes', `${kite.sizes.join(', ')}m`],
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-5 font-mono text-xs text-gray-500">
        <Link href="/kites" className="hover:text-ocean">Index</Link>
        <span className="mx-2">/</span>
        <Link href={`/brand/${brandSlug(kite.brand)}`} className="hover:text-ocean">{kite.brand}</Link>
        <span className="mx-2">/</span>
        <span className="text-slate">{kite.model} {kite.year}</span>
      </nav>

      {/* Hero */}
      <div className="mb-6 border border-gray-200 bg-card">
        <div className="grid md:grid-cols-2">
          <div className="relative h-56 sm:h-64 md:h-auto md:min-h-[320px] border-b md:border-b-0 md:border-r border-gray-200 bg-gray-50 overflow-hidden">
            {imgError ? (
              <div className="absolute inset-0 flex items-center justify-center font-mono text-sm text-gray-400">
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
          <div className="p-6">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-ocean">
              {kite.brand} · {kite.year}
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate sm:text-4xl">
              {kite.model}
            </h1>

            <div className="mt-3 flex flex-wrap gap-1.5 font-mono text-[10px]">
              {kite.teds_pick && (
                <span className="border border-sand bg-sand-light px-2 py-0.5 font-semibold text-sand">
                  Ted&apos;s Pick
                </span>
              )}
              <span className="border border-gray-200 bg-surface px-2 py-0.5 font-semibold uppercase text-slate">
                {kite.canopy_shape}
              </span>
              {kite.aluula && (
                <span className="border border-ocean/40 bg-ocean-light px-2 py-0.5 font-semibold text-ocean">
                  Aluula
                </span>
              )}
              {kite.brainchild && (
                <span className="border border-gray-300 bg-surface px-2 py-0.5 font-semibold text-slate">
                  Brainchild
                </span>
              )}
              {kite.style_tags.map((tag) => (
                <span key={tag} className="border border-gray-200 bg-surface px-2 py-0.5 text-gray-600">
                  {tag}
                </span>
              ))}
            </div>

            <p className="mt-4 text-sm leading-relaxed text-gray-600">{kite.summary}</p>
            <p className="mt-3 text-xs text-gray-500">
              <strong className="text-slate">Best for:</strong> {kite.best_for}
            </p>

            {kite.structured_review && (
              <div className="mt-5 border border-gray-200 bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ocean">
                      Review verdict
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate">
                      {kite.structured_review.rec_blurb}
                    </p>
                  </div>
                  <div className="shrink-0 text-right font-mono">
                    <span className="text-2xl font-bold tabular-nums text-slate">
                      {kite.structured_review.rating.toFixed(1)}
                    </span>
                    <span className="block text-[10px] text-gray-400">/ 5.0</span>
                  </div>
                </div>
                <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                  <p className="text-gray-600">
                    <span className="font-mono font-bold text-ocean">+</span> {kite.structured_review.pros[0]}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-mono font-bold text-sand">−</span> {kite.structured_review.cons[0]}
                  </p>
                </div>
                <p className="mt-3 border-t border-gray-200 pt-2 font-mono text-[11px] text-gray-500">
                  Evidence: {evidenceLabel}
                  {evidenceSources.length > 0 && ` · ${evidenceSources.join(', ')}`}
                </p>
                <a
                  href="#review-summary"
                  className="mt-2 inline-block font-mono text-xs font-semibold text-ocean hover:underline"
                >
                  Full verdict &amp; sources ↓
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Discipline Scores + Interactive Size Guide */}
      <div className="mb-6 grid gap-6 md:grid-cols-2">
        <section className="border border-gray-200 bg-card p-5">
          <h2 className="mb-4 font-mono text-xs font-bold uppercase tracking-[0.1em] text-slate">
            Discipline scores
          </h2>
          <div className="space-y-3">
            {DISCIPLINE_ROWS.map(({ key, label }) => {
              const score = kite.discipline_scores[key];
              return (
                <div key={key}>
                  <div className="mb-1 flex items-baseline justify-between font-mono text-xs">
                    <span className="text-gray-600">{label}</span>
                    <span className="font-semibold tabular-nums text-slate">{score}/100</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100">
                    <div
                      className={`h-full ${score >= 80 ? 'bg-ocean' : 'bg-gray-400'}`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="border border-gray-200 bg-card p-5">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-slate">
              Recommended kite size
            </h2>
            <span className="border border-ocean bg-ocean-light px-2.5 py-0.5 font-mono text-sm font-bold tabular-nums text-ocean">
              {sizeRec.minSize === sizeRec.maxSize
                ? `${sizeRec.minSize}m`
                : `${sizeRec.minSize}–${sizeRec.maxSize}m`}
            </span>
          </div>
          <p className="mb-4 text-xs text-gray-600">{sizeRec.note}</p>

          <div className="space-y-3">
            <div>
              <div className="mb-1 flex justify-between font-mono text-[11px]">
                <label htmlFor="detail-weight" className="text-gray-500">Rider weight</label>
                <span className="font-semibold tabular-nums text-slate">
                  {riderWeightKg} kg ({Math.round(riderWeightKg * 2.20462)} lb)
                </span>
              </div>
              <input
                id="detail-weight"
                type="range"
                min={50}
                max={120}
                step={1}
                value={riderWeightKg}
                onChange={(e) => setRiderWeightKg(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <div className="mb-1 flex justify-between font-mono text-[11px]">
                <label htmlFor="detail-wind" className="text-gray-500">Target wind</label>
                <span className="font-semibold tabular-nums text-slate">{windKnots} kt</span>
              </div>
              <input
                id="detail-wind"
                type="range"
                min={10}
                max={35}
                step={1}
                value={windKnots}
                onChange={(e) => setWindKnots(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-3 gap-1 pt-1">
              {(['twin-tip', 'surfboard', 'hydrofoil'] as const).map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBoardType(b)}
                  aria-pressed={boardType === b}
                  className={`border py-1.5 text-xs font-semibold capitalize transition-colors ${
                    boardType === b
                      ? 'border-ocean bg-ocean text-white'
                      : 'border-gray-200 bg-surface text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Specs */}
      <div className="mb-6 border border-gray-200 bg-card p-5">
        <h2 className="mb-4 font-mono text-xs font-bold uppercase tracking-[0.1em] text-slate">
          Specifications
        </h2>
        <div className="grid sm:grid-cols-2 gap-x-8">
          {specs.map(([label, value]) => (
            <div key={label} className="flex justify-between border-b border-gray-100 py-2 text-xs">
              <span className="text-gray-500">{label}</span>
              <span className="font-mono font-semibold tabular-nums capitalize text-slate">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Review Summary */}
      {kite.structured_review ? (
        <div id="review-summary" className="mb-6 scroll-mt-20 border border-gray-200 bg-card p-5">
          <div className="mb-1 flex items-center gap-3">
            <h2 className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-slate">
              Review summary
            </h2>
            <span className="border border-ocean/40 bg-ocean-light px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-ocean">
              {allIndependent ? 'Independent sources' : 'Mixed sources'}
            </span>
          </div>
          <p className="mb-5 text-xs text-gray-500">
            Based on {evidenceLabel}. Brand videos never feed ratings.
          </p>
          <StructuredReview review={kite.structured_review} videos={youtubeReviews} />
        </div>
      ) : (
        <div className="mb-6 border border-gray-200 bg-card p-5">
          <h2 className="mb-2 font-mono text-xs font-bold uppercase tracking-[0.1em] text-slate">
            Review summary
          </h2>
          <p className="text-xs text-gray-500">
            No synthesized review yet for this model year.
          </p>
        </div>
      )}

      {/* Video Reviews */}
      {youtubeReviews.length > 0 && (
        <div className="mb-6 border border-gray-200 bg-card p-5">
          <h2 className="mb-4 font-mono text-xs font-bold uppercase tracking-[0.1em] text-slate">
            Video reviews
          </h2>
          <YouTubeReviews reviews={youtubeReviews} />
        </div>
      )}

      {/* Owner Reports */}
      {forumReports.length > 0 && (
        <div className="mb-6 border border-gray-200 bg-card p-5">
          <OwnerReports reports={forumReports} />
        </div>
      )}

      {/* User Reviews */}
      <div className="mb-6 border border-gray-200 bg-card p-5">
        <UserReviews kiteSlug={kite.slug} />
      </div>

      {/* Pricing */}
      <div className="mb-6 border border-gray-200 bg-card p-5">
        <h2 className="mb-4 font-mono text-xs font-bold uppercase tracking-[0.1em] text-slate">
          Where to buy
        </h2>
        <div className="space-y-5">
          <div>
            <h3 className="mb-2 font-mono text-[11px] font-semibold uppercase text-gray-500">New</h3>
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {kite.buy_links.new.map((rawLink, i) => {
                const link = normalizeBuyLink(rawLink);
                const meta = buyLinkTypeMeta(link.type);
                return (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() =>
                      track('retailer_clicked', {
                        slug: kite.slug,
                        retailer: link.retailer,
                        link_type: link.type ?? 'search_fallback',
                      })
                    }
                    className="flex items-center justify-between gap-3 border border-gray-200 bg-surface p-3.5 transition-colors hover:border-ocean"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate">{link.retailer}</span>
                        <span className="border border-gray-300 bg-card px-1.5 py-0.5 font-mono text-[9px] uppercase text-gray-600">
                          {meta.badge}
                        </span>
                      </div>
                      <div className="mt-0.5 text-[11px] text-gray-500">{meta.detail}</div>
                    </div>
                    <span className="font-mono text-sm font-bold tabular-nums text-ocean whitespace-nowrap">
                      ${link.price.toLocaleString()}
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
          {kite.price_new_aluula && (
            <p className="font-mono text-xs text-gray-500">
              Aluula version from ${kite.price_new_aluula.toLocaleString()}
            </p>
          )}
          <div>
            <h3 className="mb-2 font-mono text-[11px] font-semibold uppercase text-gray-500">Used</h3>
            <div className="flex flex-wrap gap-3">
              {kite.buy_links.used.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track('used_market_clicked', { slug: kite.slug, source: link.source })}
                  className="text-xs font-semibold text-ocean hover:underline"
                >
                  {link.source} →
                </a>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h3 className="mb-2 font-mono text-[11px] font-semibold uppercase text-gray-500">
              Search shops
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {retailerSearchUrls(kite).map((r) => (
                <a
                  key={r.name}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track('retailer_search_clicked', { slug: kite.slug, retailer: r.name })}
                  className="inline-flex items-center gap-1 border border-gray-200 bg-surface px-2.5 py-1 text-xs font-semibold text-gray-600 transition-colors hover:border-ocean hover:text-ocean"
                >
                  <span>{r.name}</span>
                  {r.region && <span className="font-mono text-[10px] text-gray-400">· {r.region}</span>}
                  <span aria-hidden>→</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Related Kites */}
      <div>
        <h2 className="mb-4 font-mono text-xs font-bold uppercase tracking-[0.1em] text-slate">
          Similar kites
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {related.map((k) => (
            <KiteCard key={k.id} kite={k} />
          ))}
        </div>
      </div>
    </div>
  );
}
