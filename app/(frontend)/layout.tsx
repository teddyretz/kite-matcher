'use client';

import Link from "next/link";
import { useState } from "react";
import { CompareProvider } from "@/components/CompareContext";
import CompareDrawer from "@/components/CompareDrawer";

export default function FrontendLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <CompareProvider>
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-xl font-bold text-ocean">
              findmykite
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-sm font-medium text-gray-700 hover:text-ocean transition-colors">
                Find My Kite
              </Link>
              <Link href="/kites" className="text-sm font-medium text-gray-700 hover:text-ocean transition-colors">
                Browse Kites
              </Link>
              <Link href="/compare" className="text-sm font-medium text-gray-700 hover:text-ocean transition-colors">
                Compare
              </Link>
              <Link href="/about" className="text-sm font-medium text-gray-700 hover:text-ocean transition-colors">
                About
              </Link>
            </div>
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
          {mobileOpen && (
            <div className="md:hidden pb-4 space-y-2">
              <Link href="/" className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setMobileOpen(false)}>
                Find My Kite
              </Link>
              <Link href="/kites" className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setMobileOpen(false)}>
                Browse Kites
              </Link>
              <Link href="/compare" className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setMobileOpen(false)}>
                Compare
              </Link>
              <Link href="/about" className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setMobileOpen(false)}>
                About
              </Link>
            </div>
          )}
        </div>
      </nav>
      <main>{children}</main>
      <CompareDrawer />
    </CompareProvider>
  );
}
