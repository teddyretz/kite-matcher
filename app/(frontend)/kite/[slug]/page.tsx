import Link from 'next/link';
import { getAllKites, getKiteBySlug } from '@/lib/getKites';
import KiteDetailClient from './KiteDetailClient';

export default async function KiteProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [kite, allKites] = await Promise.all([
    getKiteBySlug(slug),
    getAllKites(),
  ]);

  if (!kite) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-slate mb-4">Kite not found</h1>
        <Link href="/kites" className="text-ocean hover:underline">Browse all kites</Link>
      </div>
    );
  }

  return <KiteDetailClient kite={kite} allKites={allKites} />;
}
