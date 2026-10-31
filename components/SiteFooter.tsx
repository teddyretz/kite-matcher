import Link from 'next/link';
import { STYLE_ZONES } from '@/lib/seo';

const footerLinks = [
  { href: '/', label: 'Kite finder' },
  { href: '/kites', label: 'Kite index' },
  { href: '/compare', label: 'Compare' },
  { href: '/about', label: 'The story' },
];

export default function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-white/10 bg-[#08141D]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-8">
          <div className="max-w-sm">
            <Link href="/" className="font-display text-2xl font-black uppercase tracking-tight text-white select-none">
              Find My Kite<span className="text-ocean">.</span>
            </Link>
            <p className="mt-3 text-xs text-gray-400 leading-relaxed">
              An independent kite review aggregator. Every review source is labeled, so shop and
              brand hype is easy to spot. No paid placements. No sponsored rankings.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <nav className="flex flex-wrap gap-x-8 gap-y-2">
              {footerLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-gray-500 hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <nav className="flex flex-wrap gap-x-4 gap-y-2">
              {STYLE_ZONES.map((zone) => (
                <Link
                  key={zone.slug}
                  href={`/kites/${zone.slug}`}
                  className="text-xs text-gray-400 hover:text-ocean transition-colors"
                >
                  {zone.label} Kites
                </Link>
              ))}
            </nav>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} findmykite.com
          </p>
          <p className="text-xs text-gray-400">
            Retailer links go to external shops — prices change often, so always confirm before buying.
          </p>
        </div>
      </div>
    </footer>
  );
}
