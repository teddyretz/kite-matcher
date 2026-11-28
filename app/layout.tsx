import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SITE_URL } from "@/lib/seo";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-plex-mono",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "FindMyKite — Kite Specs, Sizing & Independent Reviews",
    template: "%s | FindMyKite",
  },
  description:
    "Match kites by discipline, bar system, wind range, and rider weight — with review sources labeled by commercial tie and zero sponsored rankings.",
  openGraph: {
    type: "website",
    siteName: "FindMyKite",
    url: SITE_URL,
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${plexMono.variable} font-sans antialiased bg-surface text-slate`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
