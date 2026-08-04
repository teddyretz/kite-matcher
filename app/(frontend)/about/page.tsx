import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'About — Why FindMyKite Exists',
  description:
    'FindMyKite is an independent kite buying advisor: no sponsors, no paid placements, review summaries distilled from independent video reviewers.',
  alternates: { canonical: `${SITE_URL}/about` },
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-slate mb-6">About FindMyKite</h1>

      <div className="space-y-8 text-gray-600 leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-slate mb-3">Hey, I&apos;m Ted</h2>
          <p>
            I love to kite. I&apos;m not a pro or a brand ambassador or anything like that.
            I just spend way too much time thinking, reading, and watching videos about kites.
          </p>
          <p className="mt-3">
            A while back I was trying to figure out my next kite to get and I realized most
            of what is on the internet is not good. Most shops want you to buy kites no matter
            if they are right for you or not. Most reviewers are sponsored or get their kites for free.
          </p>
          <p className="mt-3">
            So I built this. It&apos;s a work in progress and probably has some rough edges,
            but the idea is simple: tell it how you ride, and it shows you what fits. If you
            have feedback or want to help make it better, I&apos;d genuinely love to hear from you.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate mb-3">Reviews I actually trust</h2>
          <p>
            The people I actually listen to and like:{' '}
            <a href="https://www.youtube.com/channel/UCqYmOgADcUgcMmme-MtKfww" target="_blank" rel="noopener noreferrer" className="text-ocean hover:underline font-medium">Jason Montreal</a>
            {' '}on YouTube.{' '}
            <a href="https://www.reddit.com/r/Kiteboarding/" target="_blank" rel="noopener noreferrer" className="text-ocean hover:underline font-medium">r/kiteboarding on Reddit</a>
            , where random people post their honest takes and you can tell who actually rides
            the gear.{' '}
            <a href="https://www.kiteforum.com/" target="_blank" rel="noopener noreferrer" className="text-ocean hover:underline font-medium">Kiteforum</a>
            , which has been around forever and still has solid discussion if you dig through it.
            And{' '}
            <a href="https://www.youtube.com/@portraitpremium" target="_blank" rel="noopener noreferrer" className="text-ocean hover:underline font-medium">Portrait Kite</a>
            , which does really thoughtful breakdowns.
            That&apos;s the data source for a lot of what I build here.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate mb-3">How the matching works</h2>
          <p>
            Every kite is scored against the way you actually want to ride: discipline, flight
            character, wave priority, handling, wind profile, budget, construction, and rider
            level. The sliders update the ranking live. Rider level changes the emphasis too:
            newer riders get more weight on control and relaunch, while advanced riders can let
            the performance controls drive the result.
          </p>
          <p className="mt-3">
            The fit percentage is an estimate, not a laboratory measurement. We round the number
            and show the review-source count separately so a close match is never confused with
            strong independent evidence. Two kites with the same score can still feel very
            different on the water, but the matcher gets you into the right neighborhood quickly.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate mb-3">No sponsors, no affiliates</h2>
          <p>
            Nobody pays me to put their kite higher in the results. There are no affiliate links.
            No brand deals. I pay for the hosting and the development myself because I wanted a
            tool that doesn&apos;t have strings attached. If a kite scores well it&apos;s because
            the math says it matches what you&apos;re looking for, not because someone wrote me a check.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate mb-3">Things I want to add</h2>
          <p>
            Next I want to build a scraper that looks for used kites or good kite deals. Did you
            know the margin on kites can be around 100% for shops, brokers and brands? Kiting is
            an expensive hobby but there are good deals to be had, we just have to look for them.
          </p>
          <p className="mt-3">
            More reviews would also help. If you have a good or bad experience with a kite,
            add a review here.
          </p>
        </section>

        <section className="bg-sand/10 rounded-xl p-6 border border-sand/20">
          <h2 className="text-xl font-bold text-sand-dark mb-3">Support the site</h2>
          <p className="text-gray-600">
            I pay for everything out of pocket and I&apos;m adding a tip jar soon. If FindMyKite
            has helped you at all, that&apos;ll be the way to support it. No pressure, but it
            would help me keep things running and keep adding new kites every season.
          </p>
          <p className="mt-4 text-sm text-gray-500 italic">
            Tip jar coming soon.
          </p>
        </section>

        <section className="bg-ocean/5 rounded-xl p-6">
          <h2 className="text-xl font-bold text-ocean mb-3">Say hi</h2>
          <p>
            Got a kite that should be on here? Found something broken? Just want to talk kites?
            Hit me up at{' '}
            <a href="mailto:hello@findmykite.com" className="text-ocean hover:underline font-medium">
              hello@findmykite.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
