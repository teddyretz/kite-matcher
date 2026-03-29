import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "FindMyKite — Find Your Next Kite",
  description:
    "Match your riding style to the right kite — with real reviews, not sponsored content.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-surface text-slate`}>
        {children}
      </body>
    </html>
  );
}
