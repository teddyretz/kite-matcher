'use client';

import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import type { KiteSummary } from '@/lib/types';

interface CompareContextType {
  compareKites: string[];
  addToCompare: (slug: string) => void;
  removeFromCompare: (slug: string) => void;
  clearCompare: () => void;
  isInCompare: (slug: string) => boolean;
  /** Identity fields only (what /api/kites returns), for labelling compare pills. */
  allKites: KiteSummary[];
  kitesLoading: boolean;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

const STORAGE_KEY = 'findmykite:compare:v1';
const MAX_COMPARE = 3;

function readStoredSlugs(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((s): s is string => typeof s === 'string').slice(0, MAX_COMPARE);
  } catch {
    return [];
  }
}

export function CompareProvider({ children }: { children: ReactNode }) {
  const [compareKites, setCompareKites] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [allKites, setAllKites] = useState<KiteSummary[]>([]);
  const [kitesLoading, setKitesLoading] = useState(true);

  // Hydrate from localStorage after mount (avoids SSR mismatch).
  useEffect(() => {
    setCompareKites(readStoredSlugs());
    setHydrated(true);
  }, []);

  // Persist on change — but not before hydration, or the initial empty list
  // overwrites what was stored (in dev StrictMode that wiped it on every load).
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(compareKites));
    } catch {
      // localStorage may be disabled (private mode); failure is non-fatal.
    }
  }, [compareKites, hydrated]);

  // The name lookup is only needed once something is in the compare list, so
  // visitors who never compare don't pay for the request.
  const needsKites = compareKites.length > 0 && allKites.length === 0;
  useEffect(() => {
    if (!needsKites) return;
    let cancelled = false;
    fetch('/api/kites')
      .then(res => res.json())
      .then((data: KiteSummary[]) => {
        if (!cancelled) setAllKites(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setKitesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [needsKites]);

  // Stable callbacks (functional setState; no closure deps) so the context
  // value's reference identity only changes when state actually changes.
  // Without this, every parent render produces a new value object which
  // re-renders all useCompare() consumers (every KiteCard on the browse page
  // — the cause of the slider sluggishness reported on /results).
  const addToCompare = useCallback((slug: string) => {
    setCompareKites((prev) => {
      if (prev.length >= MAX_COMPARE || prev.includes(slug)) return prev;
      return [...prev, slug];
    });
  }, []);

  const removeFromCompare = useCallback((slug: string) => {
    setCompareKites((prev) => prev.filter((s) => s !== slug));
  }, []);

  const clearCompare = useCallback(() => setCompareKites([]), []);

  const value = useMemo<CompareContextType>(
    () => ({
      compareKites,
      addToCompare,
      removeFromCompare,
      clearCompare,
      isInCompare: (slug: string) => compareKites.includes(slug),
      allKites,
      kitesLoading,
    }),
    [compareKites, allKites, kitesLoading, addToCompare, removeFromCompare, clearCompare],
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) throw new Error('useCompare must be used within CompareProvider');
  return context;
}

