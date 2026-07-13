import { Barlow_Condensed, Plus_Jakarta_Sans } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  variable: "--font-barlow",
  weight: ["400", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://findmykite.com"),
  title: {
    default: "FindMyKite — Find Your Next Kite",
    template: "%s | FindMyKite",
  },
  description:
    "Match your riding style to the right kite — with real reviews, not sponsored content.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "FindMyKite",
    title: "FindMyKite — Find Your Next Kite",
    description: "Independent kite recommendations matched to how you actually ride.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "FindMyKite — Find Your Next Kite",
    description: "Independent kite recommendations matched to how you actually ride.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${jakartaSans.variable} ${barlowCondensed.variable} font-sans antialiased bg-surface text-slate`}
      >
        {children}
      </body>
    </html>
  );
}
