import { SOURCE_TYPE_META, type SourceType } from '@/lib/reviewers';

const TONE: Record<SourceType, string> = {
  independent: 'border-emerald-300 text-emerald-700',
  owner: 'border-ocean/40 text-ocean',
  retailer: 'border-amber-300 text-amber-700',
  brand: 'border-gray-300 text-gray-500',
  unverified: 'border-gray-300 text-gray-500',
};

export default function SourceBadge({ type, note }: { type: SourceType; note?: string }) {
  const meta = SOURCE_TYPE_META[type];
  return (
    <span
      title={note ? `${meta.detail} ${note}` : meta.detail}
      className={`inline-flex items-center border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${TONE[type]}`}
    >
      {meta.label}
    </span>
  );
}
