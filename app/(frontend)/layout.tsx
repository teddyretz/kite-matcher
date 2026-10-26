'use client';

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { CompareProvider } from "@/components/CompareContext";
import CompareDrawer from "@/components/CompareDrawer";
import CompareNavLink from "@/components/CompareNavLink";
import SiteFooter from "@/components/SiteFooter";

const navLinks = [
  { href: "/", label: "Kite finder" },
  { href: "/kites", label: "Kite index" },
  { href: "/about", label: "The story" },
];

const navLinkClass =
  "border-b border-transparent pb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-gray-500 transition-colors duration-200 hover:border-ocean hover:text-white";

export default function FrontendLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <CompareProvider>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-ocean focus:px-4 focus:py-3 focus:font-bold focus:text-[#080D16]">
        Skip to content
      </a>
      <nav className="sticky top-0 z-50 border-b border-white/15 bg-surface/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 font-display text-xl font-black uppercase tracking-[-0.03em] text-white select-none">
              <span className="grid h-7 w-7 place-items-center bg-ocean text-sm not-italic text-surface">FMK</span>
              <span>Find My Kite</span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className={navLinkClass} aria-current={pathname === link.href ? 'page' : undefined}>
                  {link.label}
                </Link>
              ))}
              <CompareNavLink className={navLinkClass} />
            </div>

            {/* Mobile toggle */}
            <button
              className="md:hidden border border-white/15 p-2 text-gray-500 transition-colors hover:border-ocean hover:text-white"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile menu */}
          {mobileOpen && (
            <div className="space-y-1 border-t border-white/10 pb-4 pt-3 md:hidden">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block border-b border-white/5 px-1 py-3 text-sm font-bold uppercase tracking-wider text-gray-500 transition-colors hover:text-white"
                  onClick={() => setMobileOpen(false)}
                  aria-current={pathname === link.href ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              ))}
              <CompareNavLink
                className="block px-1 py-3 text-sm font-bold uppercase tracking-wider text-gray-500 transition-colors hover:text-white"
                onClick={() => setMobileOpen(false)}
              />
            </div>
          )}
        </div>
      </nav>

      <main id="main-content" className="pb-24 lg:pb-0">{children}</main>
      <SiteFooter />
      <CompareDrawer />
    </CompareProvider>
  );
}
