'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback, useMemo } from 'react';

export type Construction = 'all' | 'dacron' | 'aluula' | 'brainchild';
export type BarType = '' | 'high-y' | 'low-v' | 'both';
export type SortOption = 'alpha' | 'match' | 'price-low' | 'price-high' | 'rating';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

export interface FilterValues {
  style: number;
  shape: number;
  construction: Construction;
  budget: number;
  brands: string[];
  skill: SkillLevel[];
  barType: BarType;
  year: string;
  sort: SortOption;
}

export const DEFAULT_FILTERS: FilterValues = {
  style: 50,
  shape: 50,
  construction: 'all',
  budget: 5000,
  brands: [],
  skill: [],
  barType: '',
  year: '',
  sort: 'alpha',
};

const VALID_CONSTRUCTION = new Set<Construction>(['all', 'dacron', 'aluula', 'brainchild']);
const VALID_BAR_TYPE = new Set<BarType>(['', 'high-y', 'low-v', 'both']);
const VALID_SORT = new Set<SortOption>(['alpha', 'match', 'price-low', 'price-high', 'rating']);
const VALID_SKILL = new Set<SkillLevel>(['beginner', 'intermediate', 'advanced']);

function parseInt0to100(s: string | null, fallback: number): number {
  const n = Number(s);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(100, n));
}

function parseBudget(s: string | null): number {
  const n = Number(s);
  if (!Number.isFinite(n)) return DEFAULT_FILTERS.budget;
  return Math.max(500, Math.min(5000, n));
}

function parseList<T extends string>(s: string | null, allowed: Set<T>): T[] {
  if (!s) return [];
  return s
    .split(',')
    .map((v) => v.trim())
    .filter((v): v is T => allowed.has(v as T));
}

function parseFreeList(s: string | null): string[] {
  if (!s) return [];
  return s
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

function parseFilters(params: URLSearchParams | ReadonlyURLSearchParamsLike): FilterValues {
  const get = (key: string): string | null => params.get(key);

  const construction = get('construction');
  const barType = get('barType');
  const sort = get('sort');

  return {
    style: parseInt0to100(get('style'), DEFAULT_FILTERS.style),
    shape: parseInt0to100(get('shape'), DEFAULT_FILTERS.shape),
    construction:
      construction && VALID_CONSTRUCTION.has(construction as Construction)
        ? (construction as Construction)
        : DEFAULT_FILTERS.construction,
    budget: parseBudget(get('budget')),
    brands: parseFreeList(get('brands')),
    skill: parseList<SkillLevel>(get('skill'), VALID_SKILL),
    barType:
      barType && VALID_BAR_TYPE.has(barType as BarType)
        ? (barType as BarType)
        : DEFAULT_FILTERS.barType,
    year: get('year') ?? '',
    sort:
      sort && VALID_SORT.has(sort as SortOption) ? (sort as SortOption) : DEFAULT_FILTERS.sort,
  };
}

interface ReadonlyURLSearchParamsLike {
  get: (name: string) => string | null;
  toString: () => string;
}

function isDefault<K extends keyof FilterValues>(key: K, value: FilterValues[K]): boolean {
  const def = DEFAULT_FILTERS[key];
  if (Array.isArray(def) && Array.isArray(value)) return value.length === 0;
  return value === def;
}

function serialize<K extends keyof FilterValues>(_key: K, value: FilterValues[K]): string {
  if (Array.isArray(value)) return value.join(',');
  return String(value);
}

/**
 * Apply filter values to a kite array. Pure function; safe to call from
 * server or client. Sorting is left to the caller since `match` sort needs
 * style/shape values that may live elsewhere.
 */
export function applyFilters<K extends import('./types').Kite>(
  kites: K[],
  filters: FilterValues,
): K[] {
  let list = kites;
  if (filters.construction === 'aluula') list = list.filter((k) => k.aluula);
  else if (filters.construction === 'brainchild') list = list.filter((k) => k.brainchild);
  else if (filters.construction === 'dacron') list = list.filter((k) => !k.aluula && !k.brainchild);
  if (filters.budget < DEFAULT_FILTERS.budget) list = list.filter((k) => k.price_new <= filters.budget);
  if (filters.brands.length > 0) list = list.filter((k) => filters.brands.includes(k.brand));
  if (filters.skill.length > 0)
    list = list.filter((k) => k.skill_level.some((s) => filters.skill.includes(s as SkillLevel)));
  if (filters.barType) list = list.filter((k) => k.bar_type === filters.barType);
  if (filters.year) list = list.filter((k) => String(k.year) === filters.year);
  return list;
}

/**
 * URL-driven filter state. Reading and writing both go through the URL
 * (useSearchParams + router.replace), so refresh and shareable links Just Work.
 *
 * Defaults are NOT serialized — the URL only holds non-default values. This
 * keeps the address bar readable.
 */
export function useFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const filters = useMemo<FilterValues>(() => parseFilters(searchParams), [searchParams]);

  const setFilters = useCallback(
    (updates: Partial<FilterValues>) => {
      const next = new URLSearchParams(searchParams.toString());
      (Object.entries(updates) as Array<[keyof FilterValues, FilterValues[keyof FilterValues]]>).forEach(
        ([key, value]) => {
          if (value === undefined) return;
          if (isDefault(key, value)) {
            next.delete(key);
          } else {
            next.set(key, serialize(key, value));
          }
        },
      );
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  const reset = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  return { filters, setFilters, reset };
}
