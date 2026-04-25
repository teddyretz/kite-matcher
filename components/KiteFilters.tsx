'use client';

import { useEffect, useState } from 'react';
import { Kite } from '@/lib/types';

export interface KiteFiltersInitial {
  aluula?: boolean;
  brainchild?: boolean;
  priceMax?: number;
}

interface KiteFiltersProps {
  kites: Kite[];
  onFilter: (filtered: Kite[]) => void;
  initial?: KiteFiltersInitial;
}

export default function KiteFilters({ kites, onFilter, initial }: KiteFiltersProps) {
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<string[]>([]);
  const [selectedBarType, setSelectedBarType] = useState<string>('');
  const [onlyAluula, setOnlyAluula] = useState(initial?.aluula ?? false);
  const [onlyBrainchild, setOnlyBrainchild] = useState(initial?.brainchild ?? false);
  const [priceMax, setPriceMax] = useState(initial?.priceMax ?? 5000);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [mobileOpen, setMobileOpen] = useState(false);

  // Notify parent of the initial filter pass so quiz-derived
  // construction/budget filters apply on first render, not just after a click.
  useEffect(() => {
    applyFilters();
    // intentionally run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const brands = [...new Set(kites.map(k => k.brand))].sort();
  const years = [...new Set(kites.map(k => k.year))].sort((a, b) => b - a);

  const applyFilters = (
    newBrands = selectedBrands,
    newSkill = selectedSkill,
    newBarType = selectedBarType,
    newAluula = onlyAluula,
    newBrainchild = onlyBrainchild,
    newPriceMax = priceMax,
    newYear = selectedYear,
  ) => {
    let filtered = [...kites];
    if (newBrands.length > 0) filtered = filtered.filter(k => newBrands.includes(k.brand));
    if (newSkill.length > 0) filtered = filtered.filter(k => k.skill_level.some(s => newSkill.includes(s)));
    if (newBarType) filtered = filtered.filter(k => k.bar_type === newBarType);
    if (newAluula) filtered = filtered.filter(k => k.aluula);
    if (newBrainchild) filtered = filtered.filter(k => k.brainchild);
    if (newPriceMax < 5000) filtered = filtered.filter(k => k.price_new <= newPriceMax);
    if (newYear) filtered = filtered.filter(k => k.year === Number(newYear));
    onFilter(filtered);
  };

  const toggleBrand = (brand: string) => {
    const next = selectedBrands.includes(brand)
      ? selectedBrands.filter(b => b !== brand)
      : [...selectedBrands, brand];
    setSelectedBrands(next);
    applyFilters(next);
  };

  const toggleSkill = (skill: string) => {
    const next = selectedSkill.includes(skill)
      ? selectedSkill.filter(s => s !== skill)
      : [...selectedSkill, skill];
    setSelectedSkill(next);
    applyFilters(undefined, next);
  };

  const filterContent = (
    <div className="space-y-6">
      {/* Year */}
      <div>
        <h4 className="text-sm font-semibold text-slate mb-2">Year</h4>
        <select
          value={selectedYear}
          onChange={e => { setSelectedYear(e.target.value); applyFilters(undefined, undefined, undefined, undefined, undefined, undefined, e.target.value); }}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
        >
          <option value="">All Years</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Brands */}
      <div>
        <h4 className="text-sm font-semibold text-slate mb-2">Brand</h4>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {brands.map(brand => (
            <label key={brand} className="flex items-center gap-2 text-sm cursor-pointer hover:text-ocean">
              <input
                type="checkbox"
                checked={selectedBrands.includes(brand)}
                onChange={() => toggleBrand(brand)}
                className="rounded border-gray-300 text-ocean focus:ring-ocean"
              />
              {brand}
            </label>
          ))}
        </div>
      </div>

      {/* Skill Level */}
      <div>
        <h4 className="text-sm font-semibold text-slate mb-2">Skill Level</h4>
        <div className="space-y-1">
          {['beginner', 'intermediate', 'advanced'].map(skill => (
            <label key={skill} className="flex items-center gap-2 text-sm capitalize cursor-pointer hover:text-ocean">
              <input
                type="checkbox"
                checked={selectedSkill.includes(skill)}
                onChange={() => toggleSkill(skill)}
                className="rounded border-gray-300 text-ocean focus:ring-ocean"
              />
              {skill}
            </label>
          ))}
        </div>
      </div>

      {/* Bar Type */}
      <div>
        <h4 className="text-sm font-semibold text-slate mb-2">Bar Type</h4>
        <select
          value={selectedBarType}
          onChange={e => { setSelectedBarType(e.target.value); applyFilters(undefined, undefined, e.target.value); }}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
        >
          <option value="">All</option>
          <option value="high-y">High-Y</option>
          <option value="low-v">Low-V</option>
          <option value="both">Both</option>
        </select>
      </div>

      {/* Special Tech */}
      <div>
        <h4 className="text-sm font-semibold text-slate mb-2">Technology</h4>
        <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-ocean">
          <input
            type="checkbox"
            checked={onlyAluula}
            onChange={e => { setOnlyAluula(e.target.checked); applyFilters(undefined, undefined, undefined, e.target.checked); }}
            className="rounded border-gray-300 text-ocean focus:ring-ocean"
          />
          Aluula
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-ocean mt-1">
          <input
            type="checkbox"
            checked={onlyBrainchild}
            onChange={e => { setOnlyBrainchild(e.target.checked); applyFilters(undefined, undefined, undefined, undefined, e.target.checked); }}
            className="rounded border-gray-300 text-ocean focus:ring-ocean"
          />
          Brainchild
        </label>
      </div>

      {/* Price */}
      <div>
        <h4 className="text-sm font-semibold text-slate mb-2">Max Price: ${priceMax.toLocaleString()}</h4>
        <input
          type="range"
          min={500}
          max={5000}
          step={100}
          value={priceMax}
          onChange={e => { setPriceMax(Number(e.target.value)); applyFilters(undefined, undefined, undefined, undefined, undefined, Number(e.target.value)); }}
          className="w-full"
        />
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile filter toggle */}
      <button
        className="lg:hidden w-full py-2 px-4 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 mb-4"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? 'Hide Filters' : 'Show Filters'}
      </button>

      {/* Desktop sidebar */}
      <div className="hidden lg:block w-64 shrink-0">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sticky top-20">
          <h3 className="font-bold text-slate mb-4">Filters</h3>
          {filterContent}
        </div>
      </div>

      {/* Mobile filters */}
      {mobileOpen && (
        <div className="lg:hidden bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
          {filterContent}
        </div>
      )}
    </>
  );
}
