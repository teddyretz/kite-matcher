'use client';

import { useState } from 'react';
import { Kite } from '@/lib/types';
import { useFilters, type SkillLevel } from '@/lib/useFilters';

interface KiteFiltersProps {
  kites: Kite[];
}

const SKILL_LEVELS: SkillLevel[] = ['beginner', 'intermediate', 'advanced'];

export default function KiteFilters({ kites }: KiteFiltersProps) {
  const { filters, setFilters } = useFilters();
  const [mobileOpen, setMobileOpen] = useState(false);

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
    <div className="space-y-6">
      {/* Year */}
      <div>
        <h4 className="text-sm font-semibold text-slate mb-2">Year</h4>
        <select
          value={filters.year}
          onChange={(e) => setFilters({ year: e.target.value })}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
        >
          <option value="">All Years</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* Brands */}
      <div>
        <h4 className="text-sm font-semibold text-slate mb-2">Brand</h4>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {brands.map((brand) => (
            <label key={brand} className="flex items-center gap-2 text-sm cursor-pointer hover:text-ocean">
              <input
                type="checkbox"
                checked={filters.brands.includes(brand)}
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
          {SKILL_LEVELS.map((skill) => (
            <label key={skill} className="flex items-center gap-2 text-sm capitalize cursor-pointer hover:text-ocean">
              <input
                type="checkbox"
                checked={filters.skill.includes(skill)}
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
          value={filters.barType}
          onChange={(e) => setFilters({ barType: e.target.value as typeof filters.barType })}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
        >
          <option value="">All</option>
          <option value="high-y">High-Y</option>
          <option value="low-v">Low-V</option>
          <option value="both">Both</option>
        </select>
      </div>

      {/* Construction */}
      <div>
        <h4 className="text-sm font-semibold text-slate mb-2">Construction</h4>
        <select
          value={filters.construction}
          onChange={(e) => setFilters({ construction: e.target.value as typeof filters.construction })}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
        >
          <option value="all">All</option>
          <option value="dacron">Dacron only</option>
          <option value="aluula">Aluula only</option>
          <option value="brainchild">Brainchild only</option>
        </select>
      </div>

      {/* Price */}
      <div>
        <h4 className="text-sm font-semibold text-slate mb-2">
          Max Price: {filters.budget >= 5000 ? 'No limit' : `$${filters.budget.toLocaleString()}`}
        </h4>
        <input
          type="range"
          min={500}
          max={5000}
          step={100}
          value={filters.budget}
          onChange={(e) => setFilters({ budget: Number(e.target.value) })}
          className="w-full"
        />
      </div>
    </div>
  );

  return (
    <>
      <button
        className="lg:hidden w-full py-2 px-4 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 mb-4"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? 'Hide Filters' : 'Show Filters'}
      </button>

      <div className="hidden lg:block w-64 shrink-0">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sticky top-20">
          <h3 className="font-bold text-slate mb-4">Filters</h3>
          {filterContent}
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
          {filterContent}
        </div>
      )}
    </>
  );
}
