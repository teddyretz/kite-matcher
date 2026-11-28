'use client';

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { CompareProvider } from "@/components/CompareContext";
import CompareDrawer from "@/components/CompareDrawer";
import CompareNavLink from "@/components/CompareNavLink";
import SiteFooter from "@/components/SiteFooter";

const navLinks = [
  { href: "/", label: "Matcher" },
  { href: "/kites", label: "Index" },
  { href: "/about", label: "About" },
];

const navLinkClass =
  "border-b-2 border-transparent pb-1 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500 transition-colors hover:border-ocean hover:text-slate";

export default function FrontendLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <CompareProvider>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:border focus:border-ocean focus:bg-ocean focus:px-4 focus:py-2 focus:text-xs focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>
      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2.5 text-sm font-bold tracking-tight text-slate select-none"
            >
              <span className="grid h-7 w-7 place-items-center bg-slate font-mono text-[11px] font-bold tracking-tight text-white">
                FMK
              </span>
              <span className="uppercase tracking-[0.06em]">FindMyKite</span>
            </Link>

            <div className="hidden md:flex items-center gap-7">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={navLinkClass}
                  aria-current={pathname === link.href ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              ))}
              <CompareNavLink className={navLinkClass} />
            </div>

            <button
              className="md:hidden border border-gray-200 bg-card p-2 text-gray-600 transition-colors hover:border-ocean hover:text-slate"
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

          {mobileOpen && (
            <div className="space-y-1 border-t border-gray-200 pb-4 pt-3 md:hidden">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block border-b border-gray-100 px-1 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-600 hover:text-ocean"
                  onClick={() => setMobileOpen(false)}
                  aria-current={pathname === link.href ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              ))}
              <CompareNavLink
                className="block px-1 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-600 hover:text-ocean"
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
