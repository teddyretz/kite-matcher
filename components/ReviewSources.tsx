import { ReviewSource } from '@/lib/types';

interface ReviewSourcesProps {
  sources: ReviewSource[];
  aggregateScore: number;
  reviewCount: number;
}

export default function ReviewSources({ sources, aggregateScore, reviewCount }: ReviewSourcesProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold text-ocean">{aggregateScore.toFixed(1)}</span>
        <span className="text-sm text-gray-500">/ 5.0 from {reviewCount} reviews</span>
      </div>
      <div className="space-y-3">
        {sources.map((source, i) => (
          <div key={i} className="bg-surface rounded-lg p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm text-slate flex items-center gap-2">
                {source.source}
                {source.jason_montreal && (
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                    Jason Montreal
                  </span>
                )}
              </span>
              {source.score && (
                <span className="text-sm font-bold text-ocean">{source.score}/5</span>
              )}
            </div>
            <p className="text-sm text-gray-600">{source.summary}</p>
            {source.video_id && (
              <div className="mt-3 aspect-video rounded-lg overflow-hidden bg-gray-200">
                <iframe
                  src={`https://www.youtube.com/embed/${source.video_id}`}
                  className="w-full h-full"
                  allowFullScreen
                  title={`${source.source} review`}
                />
              </div>
            )}
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 text-xs text-ocean hover:underline"
            >
              Read full review &rarr;
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
