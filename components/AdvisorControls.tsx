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
        <label htmlFor={`advisor-${name}`} className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">{label}</label>
        <span className="text-xs font-bold text-ocean">{valueLabel}</span>
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
      <div className="mt-1.5 flex justify-between text-[9px] text-gray-400">
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
  handling,
  wind,
  level,
  construction,
  budget,
  onSliderChange,
  onSliderCommit,
  onLevelChange,
  onConstructionChange,
  compact = false,
}: AdvisorControlsProps) {
  return (
    <>
      <div className={`grid gap-x-6 ${compact ? 'gap-y-5 md:grid-cols-3' : 'gap-y-4 sm:grid-cols-2'}`}>
        <SliderRow name="style" label="Riding style" valueLabel={styleLabel(style)} value={style} onChange={onSliderChange} onCommit={onSliderCommit} left="Foil" right="Big air" />
        <SliderRow name="shape" label="Kite character" valueLabel={shape < 35 ? 'Direct & pivotal' : shape > 65 ? 'Efficient & floaty' : 'Balanced'} value={shape} onChange={onSliderChange} onCommit={onSliderCommit} left="Direct · C-shaped" right="Efficient · high aspect" />
        <SliderRow name="wave" label="Wave priority" valueLabel={wavePriority < 30 ? 'Low' : wavePriority > 70 ? 'Core priority' : 'Important'} value={wavePriority} onChange={onSliderChange} onCommit={onSliderCommit} left="Not important" right="Wave focused" />
        <SliderRow name="handling" label="Handling" valueLabel={handling < 35 ? 'Calm & forgiving' : handling > 65 ? 'Fast & reactive' : 'Balanced'} value={handling} onChange={onSliderChange} onCommit={onSliderCommit} left="Forgiving" right="Performance" />
        <SliderRow name="wind" label="Typical wind" valueLabel={wind < 35 ? 'Mostly light' : wind > 65 ? 'Mostly strong' : 'Mixed conditions'} value={wind} onChange={onSliderChange} onCommit={onSliderCommit} left="Light wind" right="Strong wind" />
        <SliderRow name="budget" label="Maximum price" valueLabel={budget >= 5000 ? 'No limit' : `$${budget.toLocaleString()}`} value={budget} onChange={onSliderChange} onCommit={onSliderCommit} left="$800" right="No limit" min={800} max={5000} step={100} />
      </div>

      <div className={`mt-5 grid gap-4 border-t border-white/10 pt-4 ${compact ? 'md:grid-cols-[1fr_1fr]' : 'sm:grid-cols-2'}`}>
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">Rider level</p>
          <div className="flex gap-1.5">
            {(['beginner', 'intermediate', 'advanced'] as const).map(value => (
              <button key={value} type="button" aria-pressed={level === value} onClick={() => onLevelChange(value)} className={`min-h-11 flex-1 rounded-lg border px-2 py-2 text-[11px] font-semibold capitalize transition-colors ${level === value ? 'border-ocean bg-ocean/10 text-ocean' : 'border-white/10 text-gray-500 hover:border-white/20'}`}>{value}</button>
            ))}
          </div>
          <p className="mt-2 text-[10px] leading-4 text-gray-400">{skillGuidance[level]}</p>
        </div>
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">Construction <span className="font-normal normal-case tracking-normal">· optional</span></p>
          <div className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap">
            {(['all', 'dacron', 'aluula', 'brainchild'] as const).map(value => (
              <button key={value} type="button" aria-pressed={construction === value} onClick={() => onConstructionChange(value)} className={`min-h-11 rounded-full border px-3 py-2 text-[11px] font-semibold capitalize transition-colors ${construction === value ? 'border-ocean bg-ocean/10 text-ocean' : 'border-white/10 text-gray-500 hover:border-white/20'}`}>{value === 'all' ? 'Any material' : value}</button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
