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

export function CompareProvider({ children }: { children: ReactNode }) {
  const [compareKites, setCompareKites] = useState<string[]>([]);
  const [allKites, setAllKites] = useState<Kite[]>([]);
  const [kitesLoading, setKitesLoading] = useState(true);

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
      if (prev.length >= 3 || prev.includes(slug)) return prev;
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
