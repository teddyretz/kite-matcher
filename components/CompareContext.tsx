'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Kite } from '@/lib/types';

interface CompareContextType {
  compareKites: string[];
  addToCompare: (slug: string) => void;
  removeFromCompare: (slug: string) => void;
  clearCompare: () => void;
  isInCompare: (slug: string) => boolean;
  allKites: Kite[];
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
  const [allKites, setAllKites] = useState<Kite[]>([]);
  const [kitesLoading, setKitesLoading] = useState(true);

  // Hydrate from localStorage after mount (avoids SSR mismatch).
  useEffect(() => {
    setCompareKites(readStoredSlugs());
  }, []);

  // Persist on change.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(compareKites));
    } catch {
      // localStorage may be disabled (private mode); failure is non-fatal.
    }
  }, [compareKites]);

  useEffect(() => {
    fetch('/api/kites')
      .then(res => res.json())
      .then((data: Kite[]) => {
        setAllKites(data);
        setKitesLoading(false);
      })
      .catch(() => setKitesLoading(false));
  }, []);

  const addToCompare = (slug: string) => {
    setCompareKites(prev => {
      if (prev.length >= MAX_COMPARE || prev.includes(slug)) return prev;
      return [...prev, slug];
    });
  };

  const removeFromCompare = (slug: string) => {
    setCompareKites(prev => prev.filter(s => s !== slug));
  };

  const clearCompare = () => setCompareKites([]);

  const isInCompare = (slug: string) => compareKites.includes(slug);

  return (
    <CompareContext.Provider value={{ compareKites, addToCompare, removeFromCompare, clearCompare, isInCompare, allKites, kitesLoading }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) throw new Error('useCompare must be used within CompareProvider');
  return context;
}

