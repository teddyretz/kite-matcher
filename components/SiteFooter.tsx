import Link from 'next/link';
import { STYLE_ZONES } from '@/lib/seo';

const footerLinks = [
  { href: '/', label: 'Matcher' },
  { href: '/kites', label: 'Index' },
  { href: '/compare', label: 'Compare' },
  { href: '/about', label: 'About' },
];

export default function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-gray-200 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-8">
          <div className="max-w-sm">
            <Link href="/" className="font-mono text-sm font-bold uppercase tracking-[0.08em] text-slate select-none">
              FindMyKite
            </Link>
            <p className="mt-2.5 text-xs text-gray-500 leading-relaxed">
              Independent kite specs, sizing, and source-labeled reviews. Fit scores never use
              reviews, shop ties, or affiliate links.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <nav className="flex flex-wrap gap-x-6 gap-y-2">
              {footerLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-xs font-semibold uppercase tracking-wider text-gray-600 hover:text-ocean transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <nav className="flex flex-wrap gap-x-4 gap-y-1.5">
              {STYLE_ZONES.map((zone) => (
                <Link
                  key={zone.slug}
                  href={`/kites/${zone.slug}`}
                  className="text-xs text-gray-500 hover:text-ocean transition-colors"
                >
                  {zone.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        <div className="mt-8 pt-5 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="font-mono text-[11px] text-gray-400">
            © {new Date().getFullYear()} findmykite.com
          </p>
          <p className="text-[11px] text-gray-400">
            Retailer links go to external shops — confirm live pricing and size stock before buying.
          </p>
        </div>
      </div>
    </footer>
  );
}
