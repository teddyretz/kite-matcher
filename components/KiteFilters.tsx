'use client';

import { useState } from 'react';
import type { Kite } from '@/lib/types';
import { useFilters, type CanopyFilter, type SkillLevel } from '@/lib/useFilters';
import { useDebouncedNumber } from '@/lib/useDebouncedNumber';

interface KiteFiltersProps {
  kites: Kite[];
}

const SKILL_LEVELS: SkillLevel[] = ['beginner', 'intermediate', 'advanced'];
const CANOPY_OPTIONS: Array<{ value: CanopyFilter; label: string }> = [
  { value: '', label: 'All shapes' },
  { value: 'delta', label: 'Delta' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'bow', label: 'Bow' },
  { value: 'open-c', label: 'Open-C' },
  { value: 'c', label: 'C-Kite' },
  { value: 'foil', label: 'Foil' },
];

export default function KiteFilters({ kites }: KiteFiltersProps) {
  const { filters, setFilters, reset } = useFilters();
  const [mobileOpen, setMobileOpen] = useState(false);
  // Dragging the price slider would otherwise rewrite the URL on every tick.
  const [budgetVal, setBudgetVal] = useDebouncedNumber(filters.budget, (v) => setFilters({ budget: v }));

  const brands = [...new Set(kites.map((k) => k.brand))].sort();
  const years = [...new Set(kites.map((k) => k.year))].sort((a, b) => b - a);

  const toggleBrand = (brand: string) => {
    const next = filters.brands.includes(brand)
      ? filters.brands.filter((b) => b !== brand)
      : [...filters.brands, brand];
    setFilters({ brands: next });
  };

  const toggleSkill = (skill: SkillLevel) => {
    const next = filters.skill.includes(skill)
      ? filters.skill.filter((s) => s !== skill)
      : [...filters.skill, skill];
    setFilters({ skill: next });
  };

  const filterContent = (
    <div className="space-y-5">
      <div>
        <h4 className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">
          Year
        </h4>
        <select
          aria-label="Filter by year"
          value={filters.year}
          onChange={(e) => setFilters({ year: e.target.value })}
          className="w-full border border-gray-200 px-2.5 py-1.5 font-mono text-xs"
        >
          <option value="">All years</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      <div>
        <h4 className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">
          Canopy shape
        </h4>
        <select
          aria-label="Filter by canopy shape"
          value={filters.canopy}
          onChange={(e) => setFilters({ canopy: e.target.value as CanopyFilter })}
          className="w-full border border-gray-200 px-2.5 py-1.5 text-xs"
        >
          {CANOPY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <h4 className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">
          Bar system
        </h4>
        <div className="grid grid-cols-3 gap-1">
          {([
            ['', 'Any'],
            ['low-v', 'Low-V'],
            ['high-y', 'High-Y'],
          ] as const).map(([val, label]) => (
            <button
              key={label}
              type="button"
              onClick={() => setFilters({ barType: val })}
              aria-pressed={filters.barType === val}
              className={`border py-1.5 text-xs font-semibold transition-colors ${
                filters.barType === val
                  ? 'border-ocean bg-ocean text-white'
                  : 'border-gray-200 bg-surface text-gray-600 hover:border-gray-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">
          Construction
        </h4>
        <div className="grid grid-cols-2 gap-1">
          {(['all', 'dacron', 'aluula', 'brainchild'] as const).map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => setFilters({ construction: val })}
              aria-pressed={filters.construction === val}
              className={`border py-1.5 text-xs font-semibold capitalize transition-colors ${
                filters.construction === val
                  ? 'border-ocean bg-ocean text-white'
                  : 'border-gray-200 bg-surface text-gray-600 hover:border-gray-400'
              }`}
            >
              {val === 'all' ? 'Any' : val}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">
          Skill level
        </h4>
        <div className="space-y-1">
          {SKILL_LEVELS.map((skill) => (
            <label key={skill} className="flex items-center gap-2 text-xs capitalize text-gray-600 cursor-pointer hover:text-ocean">
              <input
                type="checkbox"
                checked={filters.skill.includes(skill)}
                onChange={() => toggleSkill(skill)}
                className="accent-ocean"
              />
              {skill}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">
          Aspect ratio
        </h4>
        <select
          aria-label="Filter by aspect ratio"
          value={filters.aspect}
          onChange={(e) => setFilters({ aspect: e.target.value as typeof filters.aspect })}
          className="w-full border border-gray-200 px-2.5 py-1.5 text-xs"
        >
          <option value="">All</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="medium-high">Medium-High</option>
          <option value="high">High</option>
          <option value="very-high">Very High</option>
        </select>
      </div>

      <div>
        <h4 className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">
          Brand
        </h4>
        <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
          {brands.map((brand) => (
            <label key={brand} className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer hover:text-ocean">
              <input
                type="checkbox"
                checked={filters.brands.includes(brand)}
                onChange={() => toggleBrand(brand)}
                className="accent-ocean"
              />
              {brand}
            </label>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-baseline justify-between">
          <h4 className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">
            Max price
          </h4>
          <span className="font-mono text-xs font-semibold tabular-nums text-ocean">
            {budgetVal >= 5000 ? 'No limit' : `$${budgetVal.toLocaleString()}`}
          </span>
        </div>
        <input
          aria-label="Maximum price"
          type="range"
          min={500}
          max={5000}
          step={100}
          value={budgetVal}
          onChange={(e) => setBudgetVal(Number(e.target.value))}
          className="w-full"
          style={{ '--range-pct': `${((budgetVal - 500) / 4500) * 100}%` } as React.CSSProperties}
        />
      </div>

      <button
        type="button"
        onClick={reset}
        className="w-full border border-gray-300 bg-surface py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-gray-600 hover:border-ocean hover:text-ocean"
      >
        Reset filters
      </button>
    </div>
  );

  return (
    <>
      <button
        type="button"
        className="mb-4 min-h-10 w-full border border-gray-200 bg-card px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? 'Hide filters' : 'Show filters'}
      </button>

      <div className="hidden lg:block w-60 shrink-0">
        <div className="sticky top-18 border border-gray-200 bg-card p-4">
          <h3 className="mb-4 border-b border-gray-200 pb-2 font-mono text-xs font-bold uppercase tracking-[0.1em] text-slate">
            Filters
          </h3>
          {filterContent}
        </div>
      </div>

      {mobileOpen && (
        <div className="mb-4 border border-gray-200 bg-card p-4 lg:hidden">
          {filterContent}
        </div>
      )}
    </>
  );
}
