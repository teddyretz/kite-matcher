import AdvisorMatcher from '@/components/AdvisorMatcher';
import { getActiveKites } from '@/lib/getKites';
import Link from 'next/link';

export default async function Home() {
  const kites = await getActiveKites();
  const brandCount = new Set(kites.map((k) => k.brand)).size;
  const reviewedCount = kites.filter((k) => Boolean(k.structured_review)).length;

  return (
    <div className="border-b border-gray-200">
      <div className="mx-auto grid max-w-7xl lg:grid-cols-[minmax(0,0.95fr)_minmax(440px,1.05fr)]">
        <div className="flex flex-col justify-between border-gray-200 px-4 py-8 sm:px-6 sm:py-12 lg:border-r lg:px-10">
          <div className="space-y-5">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-ocean">
              Independent kite index &amp; matcher
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-slate sm:text-5xl leading-[1.06]">
              Specs, sizing, and honest reviews — without shop spin.
            </h1>
            <p className="max-w-lg text-sm leading-relaxed text-gray-600 sm:text-base">
              Pick your discipline, bar system, wind speed, and weight. Fit scores run strictly
              on kite geometry and specs — reviews and shop links never touch the ranking.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-3 border border-gray-200 bg-card">
            <div className="border-r border-gray-200 p-4">
              <strong className="block font-mono text-2xl font-bold tabular-nums text-slate">
                {kites.length}
              </strong>
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-gray-500">
                Active kites
              </span>
            </div>
            <div className="border-r border-gray-200 p-4">
              <strong className="block font-mono text-2xl font-bold tabular-nums text-slate">
                {brandCount}
              </strong>
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-gray-500">
                Brands
              </span>
            </div>
            <Link
              href="/kites"
              className="group p-4 transition-colors hover:bg-ocean hover:text-white"
            >
              <strong className="block font-mono text-2xl font-bold tabular-nums">
                {reviewedCount}
              </strong>
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-gray-500 group-hover:text-white">
                Reviewed →
              </span>
            </Link>
          </div>
        </div>

        <div className="bg-gray-50/70 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <AdvisorMatcher kites={kites} />
        </div>
      </div>
    </div>
  );
}
