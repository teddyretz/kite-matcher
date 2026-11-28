import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center">
      <h1 className="text-2xl font-bold text-slate mb-4">Page not found</h1>
      <p className="text-gray-500 mb-6">That kite or page isn&apos;t in the catalog.</p>
      <Link href="/kites" className="text-ocean hover:underline">Browse all kites</Link>
    </div>
  );
}
