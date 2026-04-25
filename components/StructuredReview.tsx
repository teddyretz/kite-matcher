import { StructuredReview as StructuredReviewType } from '@/lib/types';

function Stars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.3;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          className={`w-5 h-5 ${
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
    </div>
  );
}

export default function StructuredReview({ review }: { review: StructuredReviewType }) {
  return (
    <div className="space-y-6">
      <div className="flex items-baseline gap-4">
        <span className="text-4xl font-bold text-slate">{review.rating.toFixed(1)}</span>
        <Stars rating={review.rating} />
        <span className="text-sm text-gray-500">/ 5.0</span>
      </div>

      <p className="text-gray-700 leading-relaxed">{review.summary}</p>

      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-bold tracking-wide uppercase text-emerald-700 mb-3">Pros</h3>
          <ul className="space-y-2">
            {review.pros.map((p, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-700">
                <span className="text-emerald-600 font-bold mt-0.5">+</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold tracking-wide uppercase text-amber-700 mb-3">Cons</h3>
          <ul className="space-y-2">
            {review.cons.map((c, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-700">
                <span className="text-amber-600 font-bold mt-0.5">−</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 pt-2">
        <div className="bg-emerald-50/60 border border-emerald-100 rounded-lg p-4">
          <p className="text-xs font-bold tracking-wide uppercase text-emerald-700 mb-1">Best for</p>
          <p className="text-sm text-gray-700">{review.best_for}</p>
        </div>
        <div className="bg-amber-50/60 border border-amber-100 rounded-lg p-4">
          <p className="text-xs font-bold tracking-wide uppercase text-amber-700 mb-1">Not for</p>
          <p className="text-sm text-gray-700">{review.not_for}</p>
        </div>
      </div>

      {review.sources.length > 0 && (
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            <span className="font-semibold">Synthesized from:</span>{' '}
            {review.sources.join(', ')}
          </p>
        </div>
      )}
    </div>
  );
}
