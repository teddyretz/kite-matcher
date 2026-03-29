import { getActiveKites } from '@/lib/getKites';
import BrowseContent from './BrowseContent';

export default async function BrowsePage() {
  const kites = await getActiveKites();
  return <BrowseContent kites={kites} />;
}
