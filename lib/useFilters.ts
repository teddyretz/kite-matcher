'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import type {
  AspectRatio as KiteAspectRatio,
  CanopyShape,
  DisciplineKey,
  Kite,
  SkillLevel,
} from './types';
import type {
  BarPreference,
  BarPressurePreference,
  BoardType,
  FlyingStylePreference,
  KiteConstruction,
  RiderProfile,
} from './matcher';

export type Construction = KiteConstruction;
export type BarType = '' | 'high-y' | 'low-v' | 'both';
export type SortOption = 'alpha' | 'match' | 'price-low' | 'price-high' | 'rating';
export type AspectRatio = '' | KiteAspectRatio;
export type CanopyFilter = '' | CanopyShape;
export type { SkillLevel };

export interface FilterValues {
  discipline: DisciplineKey;
  boardType: BoardType;
  level: SkillLevel;
  windKnots: number;
  barPressure: BarPressurePreference;
  flyingStyle: FlyingStylePreference;
  riderWeightKg: number | null;
  construction: Construction;
  budget: number;
  brands: string[];
  skill: SkillLevel[];
  barType: BarType;
  aspect: AspectRatio;
  canopy: CanopyFilter;
  foilOnly: boolean;
  year: string;
  sort: SortOption;
}

export const DEFAULT_FILTERS: FilterValues = {
  discipline: 'freeride',
  boardType: 'twin-tip',
  level: 'intermediate',
  windKnots: 18,
  barPressure: 'any',
  flyingStyle: 'any',
  riderWeightKg: null,
  construction: 'all',
  budget: 5000,
  brands: [],
  skill: [],
  barType: '',
  aspect: '',
  canopy: '',
  foilOnly: false,
  year: '',
  sort: 'alpha',
};

const VALID_DISCIPLINE = new Set<DisciplineKey>(['freeride', 'big_air', 'wave', 'foil', 'freestyle']);
const VALID_BOARD = new Set<BoardType>(['twin-tip', 'surfboard', 'hydrofoil']);
const VALID_LEVEL = new Set<SkillLevel>(['beginner', 'intermediate', 'advanced']);
const VALID_PRESSURE = new Set<BarPressurePreference>(['any', 'light', 'medium', 'heavy']);
const VALID_FLYING = new Set<FlyingStylePreference>(['any', 'sheet-and-go', 'balanced', 'active']);
const VALID_CONSTRUCTION = new Set<Construction>(['all', 'dacron', 'aluula', 'brainchild']);
const VALID_BAR_TYPE = new Set<BarType>(['', 'high-y', 'low-v', 'both']);
const VALID_ASPECT = new Set<AspectRatio>(['', 'low', 'medium', 'medium-high', 'high', 'very-high']);
const VALID_CANOPY = new Set<CanopyFilter>(['', 'c', 'open-c', 'hybrid', 'delta', 'bow', 'foil']);
const VALID_SORT = new Set<SortOption>(['alpha', 'match', 'price-low', 'price-high', 'rating']);

function parseBoundedInt(s: string | null, min: number, max: number, fallback: number): number {
  if (s == null || s.trim() === '') return fallback;
  const n = Number(s);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function parseOptionalWeight(s: string | null): number | null {
  if (s == null || s.trim() === '') return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 40 || n > 140) return null;
  return Math.round(n);
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

interface ReadonlyURLSearchParamsLike {
  get: (name: string) => string | null;
  toString: () => string;
}

function parseFilters(params: URLSearchParams | ReadonlyURLSearchParamsLike): FilterValues {
  const get = (key: string): string | null => params.get(key);

  const disciplineRaw = get('discipline');
  const boardRaw = get('board');
  const levelRaw = get('level');
  const pressureRaw = get('pressure');
  const flyingRaw = get('flying');
  const construction = get('construction');
  const barType = get('barType');
  const aspect = get('aspect');
  const canopy = get('canopy');
  const sort = get('sort');

  return {
    discipline:
      disciplineRaw && VALID_DISCIPLINE.has(disciplineRaw as DisciplineKey)
        ? (disciplineRaw as DisciplineKey)
        : DEFAULT_FILTERS.discipline,
    boardType:
      boardRaw && VALID_BOARD.has(boardRaw as BoardType)
        ? (boardRaw as BoardType)
        : DEFAULT_FILTERS.boardType,
    level:
      levelRaw && VALID_LEVEL.has(levelRaw as SkillLevel)
        ? (levelRaw as SkillLevel)
        : DEFAULT_FILTERS.level,
    windKnots: parseBoundedInt(get('wind'), 10, 35, DEFAULT_FILTERS.windKnots),
    barPressure:
      pressureRaw && VALID_PRESSURE.has(pressureRaw as BarPressurePreference)
        ? (pressureRaw as BarPressurePreference)
        : DEFAULT_FILTERS.barPressure,
    flyingStyle:
      flyingRaw && VALID_FLYING.has(flyingRaw as FlyingStylePreference)
        ? (flyingRaw as FlyingStylePreference)
        : DEFAULT_FILTERS.flyingStyle,
    riderWeightKg: parseOptionalWeight(get('weight')),
    construction:
      construction && VALID_CONSTRUCTION.has(construction as Construction)
        ? (construction as Construction)
        : DEFAULT_FILTERS.construction,
    budget: parseBoundedInt(get('budget'), 500, 5000, DEFAULT_FILTERS.budget),
    brands: parseFreeList(get('brands')),
    skill: parseList<SkillLevel>(get('skill'), VALID_LEVEL),
    barType:
      barType && VALID_BAR_TYPE.has(barType as BarType)
        ? (barType as BarType)
        : DEFAULT_FILTERS.barType,
    aspect:
      aspect && VALID_ASPECT.has(aspect as AspectRatio)
        ? (aspect as AspectRatio)
        : DEFAULT_FILTERS.aspect,
    canopy:
      canopy && VALID_CANOPY.has(canopy as CanopyFilter)
        ? (canopy as CanopyFilter)
        : DEFAULT_FILTERS.canopy,
    foilOnly: get('foilOnly') === '1',
    year: get('year') ?? '',
    sort:
      sort && VALID_SORT.has(sort as SortOption) ? (sort as SortOption) : DEFAULT_FILTERS.sort,
  };
}

export function filtersToRiderProfile(filters: FilterValues): RiderProfile {
  const barPref: BarPreference =
    filters.barType === 'high-y' || filters.barType === 'low-v' ? filters.barType : 'any';
  return {
    discipline: filters.discipline,
    boardType: filters.boardType,
    level: filters.level,
    windKnots: filters.windKnots,
    barPressure: filters.barPressure,
    flyingStyle: filters.flyingStyle,
    riderWeightKg: filters.riderWeightKg ?? undefined,
    construction: filters.construction,
    barType: barPref,
    budget: filters.budget < 5000 ? filters.budget : undefined,
  };
}

const PARAM_KEY_MAP: Record<keyof FilterValues, string> = {
  discipline: 'discipline',
  boardType: 'board',
  level: 'level',
  windKnots: 'wind',
  barPressure: 'pressure',
  flyingStyle: 'flying',
  riderWeightKg: 'weight',
  construction: 'construction',
  budget: 'budget',
  brands: 'brands',
  skill: 'skill',
  barType: 'barType',
  aspect: 'aspect',
  canopy: 'canopy',
  foilOnly: 'foilOnly',
  year: 'year',
  sort: 'sort',
};

function isDefault<K extends keyof FilterValues>(key: K, value: FilterValues[K]): boolean {
  const def = DEFAULT_FILTERS[key];
  if (Array.isArray(def) && Array.isArray(value)) return value.length === 0;
  return value === def;
}

function serialize<K extends keyof FilterValues>(_key: K, value: FilterValues[K]): string {
  if (value === null) return '';
  if (Array.isArray(value)) return value.join(',');
  if (typeof value === 'boolean') return value ? '1' : '0';
  return String(value);
}

export function applyFilters<K extends Kite>(kites: K[], filters: FilterValues): K[] {
  let list = kites;
  if (filters.construction === 'aluula') list = list.filter((k) => k.aluula);
  else if (filters.construction === 'brainchild') list = list.filter((k) => k.brainchild);
  else if (filters.construction === 'dacron') list = list.filter((k) => !k.aluula && !k.brainchild);
  if (filters.budget < DEFAULT_FILTERS.budget) list = list.filter((k) => k.price_new <= filters.budget);
  if (filters.brands.length > 0) list = list.filter((k) => filters.brands.includes(k.brand));
  if (filters.skill.length > 0) {
    list = list.filter((k) => k.skill_level.some((s) => filters.skill.includes(s as SkillLevel)));
  }
  if (filters.barType === 'high-y') list = list.filter((k) => k.bar_type === 'high-y' || k.bar_type === 'both');
  else if (filters.barType === 'low-v') list = list.filter((k) => k.bar_type === 'low-v' || k.bar_type === 'both');
  else if (filters.barType === 'both') list = list.filter((k) => k.bar_type === 'both');

  if (filters.aspect) list = list.filter((k) => k.aspect_ratio === filters.aspect);
  if (filters.canopy) list = list.filter((k) => k.canopy_shape === filters.canopy);
  if (filters.foilOnly) list = list.filter((k) => k.canopy_shape === 'foil' || k.style_tags.includes('foil'));
  if (filters.year) list = list.filter((k) => String(k.year) === filters.year);
  return list;
}

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
          const paramKey = PARAM_KEY_MAP[key];
          if (isDefault(key, value)) {
            next.delete(paramKey);
          } else {
            next.set(paramKey, serialize(key, value));
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
