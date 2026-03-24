'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface CompareContextType {
  compareKites: string[];
  addToCompare: (slug: string) => void;
  removeFromCompare: (slug: string) => void;
  clearCompare: () => void;
  isInCompare: (slug: string) => boolean;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [compareKites, setCompareKites] = useState<string[]>([]);

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
    <CompareContext.Provider value={{ compareKites, addToCompare, removeFromCompare, clearCompare, isInCompare }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) throw new Error('useCompare must be used within CompareProvider');
  return context;
}
