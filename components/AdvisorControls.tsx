'use client';

import type { CSSProperties } from 'react';
import type { SkillLevel } from '@/lib/types';
import type { KiteConstruction } from '@/lib/matcher';

export type AdvisorControlName = 'style' | 'shape' | 'wave' | 'handling' | 'wind' | 'budget';

export interface AdvisorControlValues {
  style: number;
  shape: number;
  wavePriority: number;
  handling: number;
  wind: number;
  level: SkillLevel;
  construction: KiteConstruction;
  budget: number;
}

interface AdvisorControlsProps extends AdvisorControlValues {
  onSliderChange: (name: AdvisorControlName, value: number) => void;
  onSliderCommit?: (name: AdvisorControlName, value: number) => void;
  onLevelChange: (level: SkillLevel) => void;
  onConstructionChange: (construction: KiteConstruction) => void;
  compact?: boolean;
}

const skillGuidance: Record<SkillLevel, string> = {
  beginner: 'Prioritizes control, easy relaunch and a forgiving wind range.',
  intermediate: 'Balances progression, versatility and room to push harder.',
  advanced: 'Lets your performance preferences drive the ranking.',
};

const disciplineOptions = [
  { label: 'Foil', value: 10 },
  { label: 'Wave', value: 30 },
  { label: 'Freestyle', value: 50 },
  { label: 'Freeride', value: 70 },
  { label: 'Big air', value: 90 },
] as const;

export function styleLabel(value: number): string {
  if (value <= 20) return 'Foil';
  if (value <= 40) return 'Surf';
  if (value <= 60) return 'Freestyle';
  if (value <= 80) return 'Freeride';
  return 'Big Air';
}

function rangePct(value: number, min = 0, max = 100): string {
  return `${((value - min) / (max - min)) * 100}%`;
}

type SliderRowProps = {
  name: AdvisorControlName;
  label: string;
  valueLabel: string;
  value: number;
  onChange: (name: AdvisorControlName, value: number) => void;
  onCommit?: (name: AdvisorControlName, value: number) => void;
  left: string;
  right: string;
  min?: number;
  max?: number;
  step?: number;
};

function SliderRow({ name, label, valueLabel, value, onChange, onCommit, left, right, min = 0, max = 100, step = 1 }: SliderRowProps) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <label htmlFor={`advisor-${name}`} className="text-xs font-semibold text-gray-300">{label}</label>
        <span className="text-sm font-bold text-ocean">{valueLabel}</span>
      </div>
      <input
        id={`advisor-${name}`}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={event => onChange(name, Number(event.target.value))}
        onPointerUp={() => onCommit?.(name, value)}
        onKeyUp={() => onCommit?.(name, value)}
        className="w-full touch-pan-y"
        style={{ '--range-pct': rangePct(value, min, max) } as CSSProperties}
        aria-label={label}
        aria-valuetext={valueLabel}
      />
      <div className="mt-1.5 flex justify-between text-xs text-gray-400">
        <span>{left}</span>
        <span>{right}</span>
      </div>
    </div>
  );
}

export default function AdvisorControls({
  style,
  shape,
  wavePriority,
  wind,
  level,
  construction,
  budget,
  onSliderChange,
  onSliderCommit,
  onLevelChange,
  onConstructionChange,
}: AdvisorControlsProps) {
  return (
    <>
      <fieldset className="mb-5">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <legend className="text-xs font-semibold text-gray-300">1. What do you want to ride?</legend>
          <span className="text-sm font-bold text-ocean">{styleLabel(style)}</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-5">
          {disciplineOptions.map(option => {
            const selected = styleLabel(style) === (option.label === 'Wave' ? 'Surf' : option.label.replace('air', 'Air'));
            return (
              <button
                key={option.label}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  onSliderChange('style', option.value);
                  onSliderCommit?.('style', option.value);
                }}
                className={`min-h-11 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${selected ? 'border-ocean bg-ocean text-surface' : 'border-white/15 text-gray-300 hover:border-white/35 hover:text-slate'}`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs leading-5 text-gray-400">Pick the kind of session you want this kite to be best at.</p>
      </fieldset>

      <div className="grid gap-5 border-t border-white/15 pt-5 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className="mb-2 text-xs font-semibold text-gray-300">2. Rider level</p>
          <div className="flex gap-1.5">
            {(['beginner', 'intermediate', 'advanced'] as const).map(value => (
              <button key={value} type="button" aria-pressed={level === value} onClick={() => onLevelChange(value)} className={`min-h-11 flex-1 rounded-lg border px-2 py-2 text-xs font-semibold capitalize transition-colors ${level === value ? 'border-ocean bg-ocean text-surface' : 'border-white/15 text-gray-300 hover:border-white/40'}`}>{value}</button>
            ))}
          </div>
          <p className="mt-2 text-xs leading-5 text-gray-400">{skillGuidance[level]}</p>
        </div>
        <SliderRow name="wind" label="3. Typical wind" valueLabel={wind < 35 ? 'Mostly light' : wind > 65 ? 'Mostly strong' : 'Mixed conditions'} value={wind} onChange={onSliderChange} onCommit={onSliderCommit} left="Light wind" right="Strong wind" />
        <SliderRow name="budget" label="4. Budget per kite" valueLabel={budget >= 5000 ? 'No budget limit' : `Up to $${budget.toLocaleString()}`} value={budget} onChange={onSliderChange} onCommit={onSliderCommit} left="$800" right="No limit" min={800} max={5000} step={100} />
      </div>

      <details open className="group mt-5 border-t border-white/15 pt-4">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 rounded-lg px-1 text-left transition-colors hover:text-white">
          <span>
            <span className="block text-sm font-bold text-slate">Fine-tune your match <span className="font-normal text-gray-400">(optional)</span></span>
            <span className="mt-0.5 block text-xs text-gray-400">Adjust feel, wave focus, or construction if you already know what you prefer.</span>
          </span>
          <span className="text-xl text-ocean transition-transform group-open:rotate-45" aria-hidden>+</span>
        </summary>

        <div className="mt-4 grid gap-5 border-t border-white/10 pt-5 lg:grid-cols-3">
          <fieldset>
            <legend className="mb-2 text-xs font-semibold text-gray-300">Feel</legend>
            <div className="grid grid-cols-3 gap-1.5">
              {([
                { label: 'Easy', value: 20 },
                { label: 'Balanced', value: 50 },
                { label: 'Fast & direct', value: 80 },
              ] as const).map((option, index) => {
                const selected = index === (shape < 35 ? 0 : shape > 65 ? 2 : 1);
                return <button key={option.label} type="button" aria-pressed={selected} onClick={() => { onSliderChange('shape', option.value); onSliderCommit?.('shape', option.value); }} className={`min-h-11 rounded-lg border px-2 py-2 text-xs font-semibold transition-colors ${selected ? 'border-ocean bg-ocean text-surface' : 'border-white/15 text-gray-300 hover:border-white/40'}`}>{option.label}</button>;
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-xs font-semibold text-gray-300">How important are waves?</legend>
            <div className="grid grid-cols-3 gap-1.5">
              {([
                { label: 'Not important', value: 10 },
                { label: 'Sometimes', value: 50 },
                { label: 'Main focus', value: 90 },
              ] as const).map((option, index) => {
                const selected = index === (wavePriority < 30 ? 0 : wavePriority > 70 ? 2 : 1);
                return <button key={option.label} type="button" aria-pressed={selected} onClick={() => { onSliderChange('wave', option.value); onSliderCommit?.('wave', option.value); }} className={`min-h-11 rounded-lg border px-2 py-2 text-xs font-semibold transition-colors ${selected ? 'border-ocean bg-ocean text-surface' : 'border-white/15 text-gray-300 hover:border-white/40'}`}>{option.label}</button>;
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-xs font-semibold text-gray-300">Construction</legend>
            <div className="grid grid-cols-2 gap-1.5">
              {(['all', 'dacron', 'aluula', 'brainchild'] as const).map(value => (
                <button key={value} type="button" aria-pressed={construction === value} onClick={() => onConstructionChange(value)} className={`min-h-11 rounded-lg border px-3 py-2 text-xs font-semibold capitalize transition-colors ${construction === value ? 'border-ocean bg-ocean text-surface' : 'border-white/15 text-gray-300 hover:border-white/40'}`}>{value === 'all' ? 'Any material' : value}</button>
              ))}
            </div>
            <p className="mt-2 text-xs leading-5 text-gray-400">Dacron is the standard build. Aluula is lighter and stiffer. Brainchild uses welded construction.</p>
          </fieldset>
        </div>
      </details>
    </>
  );
}
