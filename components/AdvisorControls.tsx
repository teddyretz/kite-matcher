'use client';

import type { CSSProperties } from 'react';
import type { DisciplineKey, SkillLevel } from '@/lib/types';
import type {
  BarPreference,
  BarPressurePreference,
  BoardType,
  FlyingStylePreference,
  KiteConstruction,
} from '@/lib/matcher';

export interface AdvisorControlValues {
  discipline: DisciplineKey;
  boardType: BoardType;
  level: SkillLevel;
  barType: BarPreference;
  construction: KiteConstruction;
  barPressure: BarPressurePreference;
  flyingStyle: FlyingStylePreference;
  windKnots: number;
  budget: number;
  riderWeightKg: number | null;
}

interface AdvisorControlsProps extends AdvisorControlValues {
  onChange: (updates: Partial<AdvisorControlValues>) => void;
  compact?: boolean;
}

const DISCIPLINES: Array<{ value: DisciplineKey; label: string }> = [
  { value: 'freeride', label: 'Freeride' },
  { value: 'big_air', label: 'Big Air' },
  { value: 'wave', label: 'Wave' },
  { value: 'foil', label: 'Foil' },
  { value: 'freestyle', label: 'Freestyle' },
];

const BOARDS: Array<{ value: BoardType; label: string }> = [
  { value: 'twin-tip', label: 'Twin-tip' },
  { value: 'surfboard', label: 'Surfboard' },
  { value: 'hydrofoil', label: 'Hydrofoil' },
];

const LEVELS: Array<{ value: SkillLevel; label: string }> = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const BAR_SYSTEMS: Array<{ value: BarPreference; label: string }> = [
  { value: 'any', label: 'Any bar' },
  { value: 'low-v', label: 'Low-V' },
  { value: 'high-y', label: 'High-Y' },
];

const CONSTRUCTIONS: Array<{ value: KiteConstruction; label: string }> = [
  { value: 'all', label: 'Any' },
  { value: 'dacron', label: 'Dacron' },
  { value: 'aluula', label: 'Aluula' },
  { value: 'brainchild', label: 'Brainchild' },
];

const BAR_PRESSURES: Array<{ value: BarPressurePreference; label: string }> = [
  { value: 'any', label: 'Any' },
  { value: 'light', label: 'Light' },
  { value: 'medium', label: 'Medium' },
  { value: 'heavy', label: 'Heavy' },
];

const FLYING_STYLES: Array<{ value: FlyingStylePreference; label: string }> = [
  { value: 'any', label: 'Any' },
  { value: 'sheet-and-go', label: 'Sheet & go' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'active', label: 'Active' },
];

function rangePct(value: number, min: number, max: number): string {
  return `${((value - min) / (max - min)) * 100}%`;
}

function SegmentedGroup<T extends string>({
  label,
  value,
  options,
  onSelect,
  columns = 3,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onSelect: (next: T) => void;
  columns?: number;
}) {
  const gridCols =
    columns === 5
      ? 'grid-cols-3 sm:grid-cols-5'
      : columns === 4
        ? 'grid-cols-2 sm:grid-cols-4'
        : 'grid-cols-3';

  return (
    <fieldset>
      <legend className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">
        {label}
      </legend>
      <div className={`grid gap-1 ${gridCols}`}>
        {options.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(option.value)}
              className={`min-h-9 border px-2 py-1.5 text-xs font-semibold transition-colors ${
                active
                  ? 'border-ocean bg-ocean text-white'
                  : 'border-gray-200 bg-card text-gray-600 hover:border-gray-400 hover:text-slate'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export default function AdvisorControls({
  discipline,
  boardType,
  level,
  barType,
  construction,
  barPressure,
  flyingStyle,
  windKnots,
  budget,
  riderWeightKg,
  onChange,
  compact = false,
}: AdvisorControlsProps) {
  return (
    <div className="space-y-4">
      <SegmentedGroup
        label="Discipline"
        value={discipline}
        options={DISCIPLINES}
        columns={5}
        onSelect={(next) => {
          const nextBoard: BoardType =
            next === 'foil' ? 'hydrofoil' : next === 'wave' ? 'surfboard' : boardType;
          onChange({ discipline: next, boardType: nextBoard });
        }}
      />

      <div className={`grid gap-4 ${compact ? 'md:grid-cols-3' : 'sm:grid-cols-2'}`}>
        <SegmentedGroup
          label="Board"
          value={boardType}
          options={BOARDS}
          columns={3}
          onSelect={(next) => onChange({ boardType: next })}
        />
        <SegmentedGroup
          label="Skill level"
          value={level}
          options={LEVELS}
          columns={3}
          onSelect={(next) => onChange({ level: next })}
        />
        <SegmentedGroup
          label="Bar system"
          value={barType}
          options={BAR_SYSTEMS}
          columns={3}
          onSelect={(next) => onChange({ barType: next })}
        />
        <SegmentedGroup
          label="Construction"
          value={construction}
          options={CONSTRUCTIONS}
          columns={4}
          onSelect={(next) => onChange({ construction: next })}
        />
        <SegmentedGroup
          label="Bar pressure"
          value={barPressure}
          options={BAR_PRESSURES}
          columns={4}
          onSelect={(next) => onChange({ barPressure: next })}
        />
        <SegmentedGroup
          label="Flying style"
          value={flyingStyle}
          options={FLYING_STYLES}
          columns={4}
          onSelect={(next) => onChange({ flyingStyle: next })}
        />
      </div>

      {/* True continuums only: wind speed (kt), max budget (USD), optional rider weight (kg) */}
      <div className={`grid gap-4 border-t border-gray-200 pt-4 ${compact ? 'md:grid-cols-3' : 'sm:grid-cols-2'}`}>
        <div>
          <div className="mb-1.5 flex items-baseline justify-between gap-2">
            <label htmlFor="advisor-wind" className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">
              Typical wind
            </label>
            <span className="font-mono text-xs font-semibold tabular-nums text-ocean">
              {windKnots} kt
            </span>
          </div>
          <input
            id="advisor-wind"
            type="range"
            min={10}
            max={35}
            step={1}
            value={windKnots}
            onChange={(e) => onChange({ windKnots: Number(e.target.value) })}
            className="w-full"
            style={{ '--range-pct': rangePct(windKnots, 10, 35) } as CSSProperties}
          />
          <div className="mt-1 flex justify-between font-mono text-[10px] text-gray-400">
            <span>10 kt</span>
            <span>35 kt</span>
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-baseline justify-between gap-2">
            <label htmlFor="advisor-budget" className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">
              Max price
            </label>
            <span className="font-mono text-xs font-semibold tabular-nums text-ocean">
              {budget >= 5000 ? 'No limit' : `$${budget.toLocaleString()}`}
            </span>
          </div>
          <input
            id="advisor-budget"
            type="range"
            min={800}
            max={5000}
            step={100}
            value={budget}
            onChange={(e) => onChange({ budget: Number(e.target.value) })}
            className="w-full"
            style={{ '--range-pct': rangePct(budget, 800, 5000) } as CSSProperties}
          />
          <div className="mt-1 flex justify-between font-mono text-[10px] text-gray-400">
            <span>$800</span>
            <span>$5,000+</span>
          </div>
        </div>

        <div className={compact ? '' : 'sm:col-span-2'}>
          <div className="mb-1.5 flex items-baseline justify-between gap-2">
            <label htmlFor="advisor-weight" className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">
              Rider weight <span className="font-normal normal-case text-gray-400">(optional, for kite sizing)</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold tabular-nums text-ocean">
                {riderWeightKg ? `${riderWeightKg} kg (${Math.round(riderWeightKg * 2.20462)} lb)` : 'Not set'}
              </span>
              {riderWeightKg !== null && (
                <button
                  type="button"
                  onClick={() => onChange({ riderWeightKg: null })}
                  className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 hover:text-sand"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          <input
            id="advisor-weight"
            type="range"
            min={50}
            max={120}
            step={1}
            value={riderWeightKg ?? 80}
            onChange={(e) => onChange({ riderWeightKg: Number(e.target.value) })}
            className="w-full"
            style={{ '--range-pct': rangePct(riderWeightKg ?? 80, 50, 120) } as CSSProperties}
          />
          <div className="mt-1 flex justify-between font-mono text-[10px] text-gray-400">
            <span>50 kg</span>
            <span>85 kg</span>
            <span>120 kg</span>
          </div>
        </div>
      </div>
    </div>
  );
}
