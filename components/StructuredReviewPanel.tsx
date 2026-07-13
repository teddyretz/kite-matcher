import type { StructuredReview } from '@/lib/types';

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map(star => (
        <svg
          key={star}
          viewBox="0 0 20 20"
          aria-hidden="true"
          className={`h-4 w-4 ${star <= Math.round(rating) ? 'text-sand' : 'text-gray-200'}`}
          fill="currentColor"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function StructuredReviewPanel({ review }: { review: StructuredReview }) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-ocean/20 bg-[#09121D] mb-8">
      <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-ocean/10 blur-3xl pointer-events-none" />
      <div className="relative p-6 sm:p-8">
        <div className="flex flex-col gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-ocean mb-2">
              Review synthesis
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-black italic uppercase tracking-wide text-white">
              The honest take
            </h2>
            <p className="mt-3 text-sm sm:text-base leading-7 text-gray-600">{review.summary}</p>
          </div>

          <div className="shrink-0 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4">
            <div className="flex items-end gap-1">
              <span className="font-display text-4xl font-black italic leading-none text-white">
                {review.rating.toFixed(1)}
              </span>
              <span className="pb-1 text-xs text-gray-400">/ 5</span>
            </div>
            <div className="mt-2"><Stars rating={review.rating} /></div>
          </div>
        </div>

        <div className="grid gap-6 py-6 md:grid-cols-2">
          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-emerald-400">Where it shines</h3>
            <ul className="space-y-3">
              {review.pros.map(pro => (
                <li key={pro} className="flex gap-3 text-sm leading-6 text-gray-700">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                  {pro}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-sand">Where it compromises</h3>
            <ul className="space-y-3">
              {review.cons.map(con => (
                <li key={con} className="flex gap-3 text-sm leading-6 text-gray-700">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sand" />
                  {con}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 md:grid-cols-2">
          <div className="bg-[#0B1521] p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ocean">Buy it if</p>
            <p className="mt-2 text-sm leading-6 text-gray-700">{review.best_for}</p>
          </div>
          <div className="bg-[#0B1521] p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sand">Skip it if</p>
            <p className="mt-2 text-sm leading-6 text-gray-700">{review.not_for}</p>
          </div>
        </div>

        {review.sources.length > 0 && (
          <p className="mt-5 text-xs text-gray-400">
            Synthesized from independent coverage by {review.sources.join(' and ')}. Rating reflects the review evidence, not rider submissions.
          </p>
        )}
      </div>
    </section>
  );
}
