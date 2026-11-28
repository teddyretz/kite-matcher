'use client';

import type { Kite } from '@/lib/types';
import AdvisorMatcher from './AdvisorMatcher';

/**
 * Legacy wrapper kept only so any stale import resolves to the unified matcher.
 */
export default function StyleMatcher({ kites }: { kites: Kite[] }) {
  return <AdvisorMatcher kites={kites} />;
}
