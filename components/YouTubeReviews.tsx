import { ReviewEntry } from '@/lib/types';

type YouTubeReview = Extract<ReviewEntry, { source: 'youtube' }>;

export default function YouTubeReviews({ reviews }: { reviews: YouTubeReview[] }) {
  if (reviews.length === 0) return null;

  return (
    <div className="space-y-6">
      {reviews.map((r, i) => (
        <div key={i} className="bg-surface rounded-lg border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate">{r.reviewer}</p>
              <a
                href={r.channel_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-500 hover:text-ocean"
              >
                {r.channel}
              </a>
            </div>
            <a
              href={r.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-ocean hover:underline"
            >
              Watch on YouTube →
            </a>
          </div>

          <div className="aspect-video bg-gray-100">
            <iframe
              src={`https://www.youtube.com/embed/${r.video_id}`}
              className="w-full h-full"
              allowFullScreen
              title={r.video_title}
              loading="lazy"
            />
          </div>

          {(r.excerpt || r.verdict) && (
            <div className="p-4 space-y-3">
              {r.excerpt && (
                <div>
                  <p className="text-xs font-bold tracking-wide uppercase text-gray-500 mb-1">What they said</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{r.excerpt}</p>
                </div>
              )}
              {r.verdict && (
                <div>
                  <p className="text-xs font-bold tracking-wide uppercase text-gray-500 mb-1">Bottom line</p>
                  <p className="text-sm text-gray-700 leading-relaxed italic">{r.verdict}</p>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
