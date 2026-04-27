import StyleMatcher from '@/components/StyleMatcher';
import { getActiveKites } from '@/lib/getKites';
import Link from 'next/link';

export default async function Home() {
  const kites = await getActiveKites();

  return (
    <div className="min-h-[calc(100vh-3.5rem)]">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden min-h-[80vh] sm:min-h-[88vh] flex items-center">

        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#040810] via-surface to-[#061018]" />

        {/* Glowing ambient orbs */}
        <div className="absolute top-1/4 right-1/3 w-[700px] h-[700px] rounded-full bg-ocean/[0.04] blur-[140px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-sand/[0.04] blur-[120px] pointer-events-none" />

        {/* Diagonal grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(#00E5FF 1px, transparent 1px), linear-gradient(90deg, #00E5FF 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />

        {/* Wind line SVGs */}
        <div className="absolute inset-0 overflow-hidden">
          <svg
            className="w-full h-full"
            viewBox="0 0 1400 700"
            preserveAspectRatio="xMidYMid slice"
            fill="none"
          >
            <path d="M-200 450 Q300 120 800 380 T1600 200" stroke="#00E5FF" strokeWidth="1.5" opacity="0.07" />
            <path d="M-200 550 Q300 220 800 480 T1600 300" stroke="#00E5FF" strokeWidth="1" opacity="0.05" />
            <path d="M-200 350 Q400 80 900 320 T1600 100" stroke="#00E5FF" strokeWidth="0.75" opacity="0.04" />
            <path d="M-200 620 Q200 350 700 550 T1600 420" stroke="#FF5A30" strokeWidth="0.75" opacity="0.05" />
            <path d="M-200 680 Q250 420 750 610 T1600 480" stroke="#FF5A30" strokeWidth="0.5" opacity="0.04" />
          </svg>
        </div>

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-20 grid lg:grid-cols-2 gap-8 lg:gap-16 items-center w-full">

          {/* Left: Headline */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-ocean/25 bg-ocean/8 text-ocean text-xs font-semibold tracking-widest uppercase mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-ocean animate-pulse" />
              {kites.length} kites · Zero sponsors
            </div>

            <h1 className="font-display font-black italic uppercase leading-[0.88] tracking-tight text-white"
                style={{ fontSize: 'clamp(4.5rem, 11vw, 9rem)' }}>
              Find<br />
              <span className="text-ocean drop-shadow-[0_0_30px_rgba(0,229,255,0.4)]">Your</span><br />
              Kite.
            </h1>

            <p className="mt-7 text-gray-500 text-lg max-w-[340px] leading-relaxed">
              Match your riding style to the right kite — with real reviews, not sponsored content.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/kites"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gray-100 text-gray-600 text-sm font-medium hover:text-white hover:bg-gray-200 transition-colors"
              >
                Browse all {kites.length} kites
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Right: StyleMatcher */}
          <StyleMatcher kites={kites} />
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="max-w-5xl mx-auto px-4 py-16 sm:py-24">
        <div className="flex items-center gap-5 mb-16">
          <div className="h-px flex-1 bg-gray-100" />
          <h2 className="font-display font-bold italic text-xl uppercase tracking-widest text-gray-400">
            How It Works
          </h2>
          <div className="h-px flex-1 bg-gray-100" />
        </div>

        <div className="grid sm:grid-cols-3 gap-10">
          {[
            {
              num: '01',
              title: 'Set Your Style',
              desc: 'Use the sliders to tell us how you ride and what you want in a kite.',
            },
            {
              num: '02',
              title: 'See Matches',
              desc: 'We score every kite against your preferences and surface the best fits.',
            },
            {
              num: '03',
              title: 'Compare & Buy',
              desc: 'Read real reviews, compare specs side by side, and find the best deal.',
            },
          ].map((item) => (
            <div key={item.num} className="group">
              <div className="font-display font-black italic text-7xl text-gray-100 leading-none mb-5 group-hover:text-ocean/20 transition-colors duration-500">
                {item.num}
              </div>
              <h3 className="font-semibold text-slate mb-2 text-base">{item.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
