'use client';

import Link from "next/link";
import { useState } from "react";
import { CompareProvider } from "@/components/CompareContext";
import CompareDrawer from "@/components/CompareDrawer";
import CompareNavLink from "@/components/CompareNavLink";

const navLinks = [
  { href: "/", label: "Matcher" },
  { href: "/kites", label: "Browse" },
  { href: "/about", label: "About" },
];

const navLinkClass =
  "text-sm font-medium text-gray-500 hover:text-white transition-colors duration-200";

export default function FrontendLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <CompareProvider>
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#080D16]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            {/* Logo */}
            <Link href="/" className="font-display font-black italic text-xl tracking-tight select-none">
              <span className="text-white">find</span>
              <span className="text-ocean">my</span>
              <span className="text-white">kite</span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className={navLinkClass}>
                  {link.label}
                </Link>
              ))}
              <CompareNavLink className={navLinkClass} />
            </div>

            {/* Mobile toggle */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-500 hover:text-white hover:bg-gray-100 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
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
            <div className="md:hidden pb-4 border-t border-white/5 pt-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block px-3 py-2 text-sm font-medium text-gray-500 hover:text-white hover:bg-gray-100 rounded-lg transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <CompareNavLink
                className="block px-3 py-2 text-sm font-medium text-gray-500 hover:text-white hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => setMobileOpen(false)}
              />
            </div>
          )}
        </div>
      </nav>

      <main>{children}</main>
      <CompareDrawer />
    </CompareProvider>
  );
}
