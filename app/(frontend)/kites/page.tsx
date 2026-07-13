import { getActiveKites } from '@/lib/getKites';
import BrowseContent from './BrowseContent';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Browse Kitesurfing Kites',
  description: 'Browse and filter independent specs, reviews, prices, and riding characteristics across the FindMyKite catalog.',
  alternates: { canonical: '/kites' },
};

export default async function BrowsePage() {
  const kites = await getActiveKites();
  return <BrowseContent kites={kites} />;
}
