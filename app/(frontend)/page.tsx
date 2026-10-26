import StyleMatcher from '@/components/StyleMatcher';
import AdvisorMatcher from '@/components/AdvisorMatcher';
import { getActiveKites } from '@/lib/getKites';
import Link from 'next/link';

export default async function Home({ searchParams }: { searchParams: Promise<{ legacy?: string }> }) {
  const kites = await getActiveKites();
  const { legacy } = await searchParams;

  return (
    <div>
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute -left-32 top-24 h-96 w-96 rounded-full bg-ocean/[0.06] blur-3xl" />
        <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-[1440px] lg:grid-cols-[minmax(0,1.08fr)_minmax(430px,.92fr)]">
          <div className="relative flex flex-col justify-between border-white/10 px-4 py-8 sm:px-8 sm:py-12 lg:border-r lg:px-12 lg:py-14">
            <div className="editorial-in my-14 [animation-delay:80ms] lg:my-8">
              <p className="mb-6 text-xs font-bold uppercase tracking-[0.18em] text-sand">Independent kite review aggregator</p>
              <h1 className="font-display text-[clamp(4.8rem,9vw,8.5rem)] font-black uppercase leading-[0.92] tracking-[-0.02em] text-slate">
                Find your<br />next <span className="text-ocean">kite.</span>
              </h1>
              <div className="mt-8 max-w-xl">
                <p className="max-w-md text-base leading-relaxed text-gray-600 sm:text-lg">Tell us how you actually ride. We&apos;ll cut through the launch copy and show you what belongs on your shortlist.</p>
              </div>
            </div>

            <div className="editorial-in grid grid-cols-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] [animation-delay:160ms]">
              <div className="px-4 py-4"><strong className="block font-display text-3xl font-black text-slate">{kites.length}</strong><span className="text-[9px] font-bold uppercase tracking-[0.17em] text-gray-400">Kites indexed</span></div>
              <div className="border-x border-white/15 px-4 py-4"><strong className="block font-display text-3xl font-black text-slate">13</strong><span className="text-[9px] font-bold uppercase tracking-[0.17em] text-gray-400">Brands</span></div>
              <Link href="/kites" className="group px-4 py-4 transition-colors hover:bg-ocean hover:text-surface"><strong className="block font-display text-3xl font-black">→</strong><span className="text-[9px] font-bold uppercase tracking-[0.17em]">Open kite index</span></Link>
            </div>
          </div>

          <div className="relative flex items-center bg-card/50 px-4 py-10 sm:px-8 lg:px-10 lg:py-14">
            <div className="editorial-in relative w-full [animation-delay:220ms]">
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
