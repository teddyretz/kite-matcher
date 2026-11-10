import StyleMatcher from '@/components/StyleMatcher';
import AdvisorMatcher from '@/components/AdvisorMatcher';
import { getActiveKites } from '@/lib/getKites';
import Link from 'next/link';

export default async function Home({ searchParams }: { searchParams: Promise<{ legacy?: string }> }) {
  const kites = await getActiveKites();
  const { legacy } = await searchParams;
  const brandCount = new Set(kites.map((k) => k.brand)).size;

  return (
    <div>
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute -left-32 top-24 h-96 w-96 rounded-full bg-ocean/[0.06] blur-3xl" />
        <div className="mx-auto max-w-[1600px]">
          <div className="relative border-b border-white/10 px-4 py-6 sm:px-8 sm:py-8 lg:px-12">
            <div className="editorial-in [animation-delay:80ms]">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-sand sm:text-xs">Independent kite review aggregator</p>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <h1 className="font-display text-[clamp(2.75rem,5vw,5rem)] font-black uppercase leading-[0.92] tracking-[-0.01em] text-slate">
                  Find your next <span className="text-ocean">kite.</span>
                </h1>
                <div className="flex shrink-0 items-center border-y border-white/10 py-2 sm:border-y-0 sm:py-0">
                  <div className="flex items-baseline gap-1.5 pr-3">
                    <strong className="font-display text-3xl font-black leading-none text-slate">{kites.length}</strong>
                    <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-gray-400">Kites</span>
                  </div>
                  <div className="flex items-baseline gap-1.5 border-l border-white/15 px-3">
                    <strong className="font-display text-3xl font-black leading-none text-slate">{brandCount}</strong>
                    <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-gray-400">Brands</span>
                  </div>
                  <Link href="/kites" className="border-l border-white/15 pl-3 text-[9px] font-bold uppercase tracking-[0.14em] text-gray-400 transition-colors hover:text-ocean">Kite index →</Link>
                </div>
              </div>
              <div className="mt-3 max-w-xl">
                <p className="max-w-lg text-sm leading-relaxed text-gray-600 sm:text-base">Tell us how you actually ride. We&apos;ll cut through the launch copy and show you what belongs on your shortlist.</p>
              </div>
            </div>
          </div>

          <div className="relative bg-card/50 px-4 py-7 sm:px-8 lg:px-12 lg:py-10">
            <div className="editorial-in relative mx-auto w-full [animation-delay:220ms]">
              {legacy === '1' ? (
                <div><div className="mb-3 flex justify-end"><Link href="/" className="text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-ocean">Use the full finder →</Link></div><StyleMatcher kites={kites} /></div>
              ) : <AdvisorMatcher kites={kites} />}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
