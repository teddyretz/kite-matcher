import { ReviewEntry } from '@/lib/types';
import SourceBadge from './SourceBadge';

type ForumReport = Extract<ReviewEntry, { source: 'forum' }>;

const PLATFORM: Record<ForumReport['platform'], string> = { reddit: 'Reddit', kiteforum: 'Kiteforum' };

export default function OwnerReports({ reports }: { reports: ForumReport[] }) {
  if (reports.length === 0) return null;
  const owners = reports.reduce((n, r) => n + r.owner_count, 0);

  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <h2 className="text-lg font-bold text-slate">Owner Reports</h2>
        <SourceBadge type="owner" />
      </div>
      <p className="text-xs text-gray-500 mb-4">
        {owners} owner{owners === 1 ? '' : 's'} across {reports.length} public thread{reports.length === 1 ? '' : 's'}.
        Owner posts are anecdotal and are not used in the rating.
      </p>
      <div className="space-y-4">
        {reports.map((r) => (
          <div key={r.thread_url} className="border border-gray-100 rounded-lg p-4">
            <a
              href={r.thread_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-ocean hover:underline"
            >
              {r.thread_title}
            </a>
            <p className="mt-0.5 text-xs text-gray-500">
              {PLATFORM[r.platform]} · {r.posted} · {r.owner_count} owner{r.owner_count === 1 ? '' : 's'}
            </p>
            <p className="mt-2 text-sm text-gray-700 leading-relaxed">{r.summary}</p>
            <blockquote className="mt-2 border-l-2 border-gray-200 pl-3 text-xs italic text-gray-500">
              “{r.excerpt}”
            </blockquote>
          </div>
        ))}
      </div>
    </div>
  );
}
