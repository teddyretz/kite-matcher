import Link from 'next/link';

const footerLinks = [
  { href: '/', label: 'Matcher' },
  { href: '/kites', label: 'Browse' },
  { href: '/compare', label: 'Compare' },
  { href: '/about', label: 'About' },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/5 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-8">
          <div className="max-w-sm">
            <Link href="/" className="font-display font-black italic text-lg tracking-tight select-none">
              <span className="text-white">find</span>
              <span className="text-ocean">my</span>
              <span className="text-white">kite</span>
            </Link>
            <p className="mt-3 text-xs text-gray-400 leading-relaxed">
              Review summaries are AI-distilled from independent video reviewers —
              never from brands or sponsors. No paid placements, no sponsored rankings.
            </p>
          </div>

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
