import StyleMatcher from '@/components/StyleMatcher';
import { getActiveKites } from '@/lib/getKites';

export default async function Home() {
  const kites = await getActiveKites();

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-ocean via-ocean-light to-ocean-dark py-20 sm:py-32">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 800 600" fill="none">
            <path d="M0 300 Q200 100 400 300 T800 300" stroke="white" strokeWidth="2" fill="none" />
            <path d="M0 350 Q200 150 400 350 T800 350" stroke="white" strokeWidth="1.5" fill="none" />
            <path d="M0 400 Q200 200 400 400 T800 400" stroke="white" strokeWidth="1" fill="none" />
          </svg>
        </div>
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-6xl font-bold text-white mb-4 tracking-tight">
            Find your next kite.
          </h1>
          <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto mb-12">
            Match your riding style to the right kite — with real reviews, not sponsored content.
          </p>
          <StyleMatcher kites={kites} />
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center text-slate mb-10">How It Works</h2>
        <div className="grid sm:grid-cols-3 gap-8">
          {[
            { step: '1', title: 'Set Your Style', desc: 'Use the sliders to tell us how you ride and what you want in a kite.' },
            { step: '2', title: 'See Matches', desc: 'We score every kite against your preferences and show the best fits.' },
            { step: '3', title: 'Compare & Buy', desc: 'Read real reviews, compare specs side by side, and find the best deal.' },
          ].map(item => (
            <div key={item.step} className="text-center">
              <div className="w-12 h-12 rounded-full bg-sand/20 text-sand-dark font-bold text-xl flex items-center justify-center mx-auto mb-4">
                {item.step}
              </div>
              <h3 className="font-semibold text-slate mb-2">{item.title}</h3>
              <p className="text-sm text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
