import type {
  AspectRatio,
  BarPressure,
  CanopyShape,
  DisciplineKey,
  FlyingStyle,
  Kite,
  SkillLevel,
} from './types';

export type KiteConstruction = 'all' | 'dacron' | 'aluula' | 'brainchild';
export type BoardType = 'twin-tip' | 'surfboard' | 'hydrofoil';
export type BarPreference = 'any' | 'high-y' | 'low-v';
export type BarPressurePreference = 'any' | BarPressure;
export type FlyingStylePreference = 'any' | FlyingStyle;

export interface MatchConstraints {
  construction?: KiteConstruction;
  barType?: BarPreference;
  budget?: number;
}

export interface RiderProfile extends MatchConstraints {
  discipline: DisciplineKey;
  secondaryDiscipline?: DisciplineKey;
  boardType?: BoardType;
  level: SkillLevel;
  windKnots?: number;
  barPressure?: BarPressurePreference;
  flyingStyle?: FlyingStylePreference;
  riderWeightKg?: number;
}

export interface KiteSizeRecommendation {
  idealSize: number;
  minSize: number;
  maxSize: number;
  matchingSizes: number[];
  note: string;
}

export interface UnifiedMatch extends Kite {
  score: number;
  fitLabel: 'Excellent fit' | 'Strong fit' | 'Good fit' | 'Worth a look';
  reasons: string[];
  tradeoffs: string[];
  recommendedSize?: KiteSizeRecommendation;
}

export const DEFAULT_RIDER_PROFILE: RiderProfile = {
  discipline: 'freeride',
  boardType: 'twin-tip',
  level: 'intermediate',
  barType: 'any',
  construction: 'all',
  barPressure: 'any',
  flyingStyle: 'any',
  windKnots: 18,
  budget: 5000,
};

const DISCIPLINE_LABELS: Record<DisciplineKey, string> = {
  freeride: 'freeride',
  big_air: 'big air',
  wave: 'wave',
  foil: 'foil',
  freestyle: 'freestyle',
};

const TURNING_VALUES: Record<Kite['turning_speed'], number> = {
  slow: 20,
  medium: 45,
  'medium-fast': 65,
  fast: 85,
  'very-fast': 100,
};

const RELAUNCH_VALUES: Record<Kite['relaunch'], number> = {
  easy: 100,
  medium: 60,
  hard: 20,
};

const ASPECT_VALUES: Record<AspectRatio, number> = {
  low: 20,
  medium: 45,
  'medium-high': 65,
  high: 85,
  'very-high': 100,
};

const CANOPY_DISCIPLINE_AFFINITY: Record<DisciplineKey, Record<CanopyShape, number>> = {
  freeride: { delta: 100, hybrid: 95, bow: 88, 'open-c': 72, foil: 62, c: 35 },
  big_air: { bow: 100, hybrid: 95, delta: 80, 'open-c': 75, foil: 68, c: 58 },
  wave: { delta: 92, hybrid: 95, 'open-c': 72, bow: 60, foil: 45, c: 30 },
  foil: { foil: 100, delta: 90, hybrid: 84, bow: 60, 'open-c': 48, c: 20 },
  freestyle: { c: 100, 'open-c': 96, hybrid: 76, delta: 60, bow: 42, foil: 20 },
};

const PRESSURE_SCALE: Record<BarPressure, number> = {
  light: 1,
  medium: 2,
  heavy: 3,
};

const FLYING_SCALE: Record<FlyingStyle, number> = {
  'sheet-and-go': 1,
  balanced: 2,
  active: 3,
};

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

function closeness(actual: number, target: number): number {
  return Math.max(0, 100 - Math.abs(actual - target));
}

/**
 * Pure physics-based kite size estimate from rider weight, wind speed,
 * board type, and kite low-end efficiency. Completely independent of reviews,
 * brand, or commercial links.
 */
export function recommendKiteSizeRange(
  kite: Pick<Kite, 'sizes' | 'low_end_power' | 'canopy_shape'>,
  riderWeightKg: number,
  windKnots = 18,
  boardType: BoardType = 'twin-tip',
): KiteSizeRecommendation {
  const safeWeight = clamp(riderWeightKg, 40, 140);
  const safeWind = clamp(windKnots, 8, 45);

  const boardFactor =
    boardType === 'hydrofoil' ? 0.72 : boardType === 'surfboard' ? 0.88 : 1.0;

  // Baseline: 75kg twin-tip rider in 18 knots rides a ~10m kite.
  let rawIdeal = (safeWeight / 75) * (18 / safeWind) * 10 * boardFactor;

  // Adjust slightly for canopy efficiency / low-end pull.
  if (kite.canopy_shape === 'foil') rawIdeal *= 0.92;
  if (kite.low_end_power >= 9) rawIdeal -= 0.5;
  else if (kite.low_end_power <= 5) rawIdeal += 0.5;

  const idealSize = Math.max(4, Math.min(18, Math.round(rawIdeal * 2) / 2));
  const targetMin = Math.max(3, Math.floor(idealSize - 1));
  const targetMax = Math.min(19, Math.ceil(idealSize + 1));

  const matchingSizes = kite.sizes.filter((s) => s >= targetMin && s <= targetMax);
  let minSize = targetMin;
  let maxSize = targetMax;
  let note: string;

  if (matchingSizes.length > 0) {
    minSize = matchingSizes[0];
    maxSize = matchingSizes[matchingSizes.length - 1];
    note =
      minSize === maxSize
        ? `${minSize}m fits ${safeWeight} kg in ~${safeWind} kt (${boardType}).`
        : `${minSize}–${maxSize}m covers ${safeWeight} kg in ~${safeWind} kt (${boardType}).`;
  } else if (kite.sizes.length > 0) {
    const sorted = [...kite.sizes].sort((a, b) => Math.abs(a - idealSize) - Math.abs(b - idealSize));
    const closest = sorted[0];
    minSize = closest;
    maxSize = closest;
    note = `Closest available size is ${closest}m (ideal ~${idealSize}m for ${safeWeight} kg in ${safeWind} kt).`;
  } else {
    note = `Estimated ~${idealSize}m for ${safeWeight} kg in ${safeWind} kt.`;
  }

  return { idealSize, minSize, maxSize, matchingSizes, note };
}

export function kiteMatchesConstraints(kite: Kite, constraints: MatchConstraints): boolean {
  const { construction = 'all', barType = 'any', budget } = constraints;

  if (typeof budget === 'number' && budget < 5000 && kite.price_new > budget) return false;
  if (construction === 'aluula' && !kite.aluula) return false;
  if (construction === 'brainchild' && !kite.brainchild) return false;
  if (construction === 'dacron' && (kite.aluula || kite.brainchild)) return false;

  if (barType === 'high-y' && kite.bar_type === 'low-v') return false;
  if (barType === 'low-v' && kite.bar_type === 'high-y') return false;

  return true;
}

export function filterByMatchConstraints(kites: Kite[], constraints: MatchConstraints): Kite[] {
  return kites.filter((kite) => kiteMatchesConstraints(kite, constraints));
}

function disciplineFit(kite: Kite, profile: RiderProfile): number {
  const primary = kite.discipline_scores[profile.discipline];
  let score = primary;

  if (profile.secondaryDiscipline && profile.secondaryDiscipline !== profile.discipline) {
    const secondary = kite.discipline_scores[profile.secondaryDiscipline];
    score = primary * 0.75 + secondary * 0.25;
  }

  // Board-type synergy nudges without overriding primary discipline.
  if (profile.boardType === 'hydrofoil') {
    score = score * 0.8 + kite.discipline_scores.foil * 0.2;
  } else if (profile.boardType === 'surfboard') {
    score = score * 0.8 + kite.discipline_scores.wave * 0.2;
  }

  return clamp(score);
}

function canopyAndAspectFit(kite: Kite, profile: RiderProfile): number {
  const canopyScore = CANOPY_DISCIPLINE_AFFINITY[profile.discipline][kite.canopy_shape];

  const targetAspect =
    profile.discipline === 'big_air'
      ? 90
      : profile.discipline === 'foil'
        ? 75
        : profile.discipline === 'freeride'
          ? 60
          : profile.discipline === 'wave'
            ? 45
            : 35;

  const aspectScore = closeness(ASPECT_VALUES[kite.aspect_ratio], targetAspect);
  return canopyScore * 0.65 + aspectScore * 0.35;
}

function feelFit(kite: Kite, profile: RiderProfile): number {
  const parts: number[] = [];

  if (profile.barPressure && profile.barPressure !== 'any') {
    const diff = Math.abs(PRESSURE_SCALE[kite.bar_pressure] - PRESSURE_SCALE[profile.barPressure]);
    parts.push(diff === 0 ? 100 : diff === 1 ? 65 : 30);
  }

  if (profile.flyingStyle && profile.flyingStyle !== 'any') {
    const diff = Math.abs(FLYING_SCALE[kite.flying_style] - FLYING_SCALE[profile.flyingStyle]);
    parts.push(diff === 0 ? 100 : diff === 1 ? 65 : 25);
  }

  // Turning speed alignment for the chosen discipline & rider level.
  const targetTurning =
    profile.level === 'beginner'
      ? 45
      : profile.discipline === 'wave'
        ? 85
        : profile.discipline === 'big_air'
          ? 80
          : profile.discipline === 'freestyle'
            ? 70
            : 65;

  parts.push(closeness(TURNING_VALUES[kite.turning_speed], targetTurning));

  return parts.reduce((sum, v) => sum + v, 0) / parts.length;
}

function windAndWeightFit(kite: Kite, profile: RiderProfile): number {
  const wind = profile.windKnots ?? 18;
  const weight = profile.riderWeightKg;

  // Check if the rider's typical wind sits inside the kite's published wind window.
  let rangeFit = 100;
  if (wind < kite.wind_range_low) {
    rangeFit = clamp(100 - (kite.wind_range_low - wind) * 10);
  } else if (wind > kite.wind_range_high) {
    rangeFit = clamp(100 - (wind - kite.wind_range_high) * 10);
  }

  const lowEndBonus = wind <= 15 ? kite.low_end_power * 10 : kite.depower_range * 10;
  let score = rangeFit * 0.6 + lowEndBonus * 0.4;

  // When rider weight is supplied, reward kites whose available size lineup covers their needed size.
  if (typeof weight === 'number' && Number.isFinite(weight)) {
    const rec = recommendKiteSizeRange(kite, weight, wind, profile.boardType ?? 'twin-tip');
    const sizeCoverage = rec.matchingSizes.length > 0 ? 100 : 55;
    // Heavier riders benefit slightly more from low-end power in lighter winds.
    const weightLowEnd = weight >= 90 && wind <= 20 ? kite.low_end_power * 10 : score;
    score = score * 0.65 + sizeCoverage * 0.25 + weightLowEnd * 0.1;
  }

  return clamp(score);
}

function levelFit(kite: Kite, level: SkillLevel): number {
  if (level === 'beginner') {
    const sheetBonus = kite.flying_style === 'sheet-and-go' ? 100 : kite.flying_style === 'balanced' ? 75 : 35;
    return clamp(
      kite.depower_range * 4.5 +
        RELAUNCH_VALUES[kite.relaunch] * 0.35 +
        sheetBonus * 0.2,
    );
  }
  if (level === 'intermediate') {
    const width = clamp((kite.wind_range_high - kite.wind_range_low) * 4);
    return clamp(kite.depower_range * 4 + RELAUNCH_VALUES[kite.relaunch] * 0.25 + width * 0.35);
  }
  return 100;
}

export function displayFitScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score / 5) * 5));
}

export function fitLabel(score: number): UnifiedMatch['fitLabel'] {
  if (score >= 88) return 'Excellent fit';
  if (score >= 78) return 'Strong fit';
  if (score >= 68) return 'Good fit';
  return 'Worth a look';
}

function buildReasons(kite: Kite, profile: RiderProfile): string[] {
  const reasons: string[] = [];
  const dScore = kite.discipline_scores[profile.discipline];
  const dLabel = DISCIPLINE_LABELS[profile.discipline];

  if (dScore >= 85) reasons.push(`Dedicated ${dLabel} score (${dScore}/100)`);
  else if (dScore >= 70) reasons.push(`Strong ${dLabel} versatility (${dScore}/100)`);
  else reasons.push(`Closest available ${dLabel} fit (${dScore}/100)`);

  if (profile.level === 'beginner' && kite.relaunch === 'easy' && kite.depower_range >= 8) {
    reasons.push('Easy relaunch and wide depower suit a progressing rider');
  }
  if (profile.barPressure && profile.barPressure !== 'any' && kite.bar_pressure === profile.barPressure) {
    reasons.push(`Matches your ${profile.barPressure} bar pressure preference`);
  }
  if (profile.flyingStyle && profile.flyingStyle !== 'any' && kite.flying_style === profile.flyingStyle) {
    reasons.push(`${kite.flying_style.replace(/-/g, ' ')} flying character`);
  }

  const wind = profile.windKnots ?? 18;
  if (wind <= 15 && kite.low_end_power >= 8) {
    reasons.push(`Strong low-end pull (${kite.low_end_power}/10) for ${wind} kt sessions`);
  } else if (wind >= 24 && kite.wind_range_high >= 34) {
    reasons.push(`Holds up to ${kite.wind_range_high} kt in powered wind`);
  } else if (kite.wind_range_high - kite.wind_range_low >= 22) {
    reasons.push(`Broad ${kite.wind_range_low}–${kite.wind_range_high} kt wind range`);
  }

  if (reasons.length < 2) {
    reasons.push(`${kite.canopy_shape.toUpperCase()} canopy · ${kite.aspect_ratio.replace('-', ' ')} aspect`);
  }
  return reasons.slice(0, 3);
}

function buildTradeoffs(kite: Kite, profile: RiderProfile): string[] {
  const tradeoffs: string[] = [];
  const wind = profile.windKnots ?? 18;

  if (kite.relaunch === 'hard') tradeoffs.push('Relaunch takes technique');
  if (kite.low_end_power <= 5 && wind <= 18) tradeoffs.push('Needs solid wind to get going');
  if (kite.depower_range <= 5 && wind >= 22) tradeoffs.push('Less forgiving in gusty top-end wind');
  if (profile.level === 'beginner' && TURNING_VALUES[kite.turning_speed] >= 85) {
    tradeoffs.push('Fast turning can feel twitchy while learning');
  }
  if (profile.barPressure && profile.barPressure !== 'any' && kite.bar_pressure !== profile.barPressure) {
    tradeoffs.push(`Runs ${kite.bar_pressure} bar pressure (you asked for ${profile.barPressure})`);
  }
  if (kite.price_new >= 2500) tradeoffs.push(`$${kite.price_new.toLocaleString()} retail price`);

  return tradeoffs.slice(0, 2);
}

/**
 * Unified scoring function used across Homepage, Results, Browse, and Compare.
 * Strictly decoupled from reviews, structured_review, brand, and buy_links.
 */
export function scoreKite(kite: Kite, profile: RiderProfile): number {
  const weights =
    profile.level === 'beginner'
      ? { discipline: 0.34, canopy: 0.12, feel: 0.12, wind: 0.16, level: 0.26 }
      : profile.level === 'intermediate'
        ? { discipline: 0.46, canopy: 0.15, feel: 0.14, wind: 0.15, level: 0.1 }
        : { discipline: 0.52, canopy: 0.16, feel: 0.16, wind: 0.16, level: 0 };

  const raw =
    disciplineFit(kite, profile) * weights.discipline +
    canopyAndAspectFit(kite, profile) * weights.canopy +
    feelFit(kite, profile) * weights.feel +
    windAndWeightFit(kite, profile) * weights.wind +
    levelFit(kite, profile.level) * weights.level;

  return Math.round(clamp(raw));
}

export function getUnifiedMatches(kites: Kite[], profile: RiderProfile): UnifiedMatch[] {
  return filterByMatchConstraints(kites, profile)
    .filter((kite) => kite.skill_level.includes(profile.level))
    .map((kite) => {
      const score = scoreKite(kite, profile);
      const recommendedSize =
        typeof profile.riderWeightKg === 'number' && Number.isFinite(profile.riderWeightKg)
          ? recommendKiteSizeRange(
              kite,
              profile.riderWeightKg,
              profile.windKnots ?? 18,
              profile.boardType ?? 'twin-tip',
            )
          : undefined;
      return {
        ...kite,
        score,
        fitLabel: fitLabel(score),
        reasons: buildReasons(kite, profile),
        tradeoffs: buildTradeoffs(kite, profile),
        recommendedSize,
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.discipline_scores[profile.discipline] - a.discipline_scores[profile.discipline];
    });
}

/**
 * Builds a discovery shortlist without changing any underlying fit score.
 */
export function getDiverseAdvisorShortlist(
  matches: UnifiedMatch[],
  count = 12,
  maxPerBrand = 2,
): UnifiedMatch[] {
  const selected: UnifiedMatch[] = [];
  const overflow: UnifiedMatch[] = [];
  const brandCounts = new Map<string, number>();

  for (const match of matches) {
    const brandCount = brandCounts.get(match.brand) ?? 0;
    if (brandCount < maxPerBrand && selected.length < count) {
      selected.push(match);
      brandCounts.set(match.brand, brandCount + 1);
    } else {
      overflow.push(match);
    }
  }

  return selected.concat(overflow.slice(0, Math.max(0, count - selected.length))).slice(0, count);
}

export function getRelatedKites(kite: Kite, allKites: Kite[], count = 3): Kite[] {
  const keys: DisciplineKey[] = ['freeride', 'big_air', 'wave', 'foil', 'freestyle'];
  return allKites
    .filter((k) => k.id !== kite.id && !k.discontinued)
    .map((k) => {
      const discDist = Math.sqrt(
        keys.reduce((sum, key) => {
          const diff = k.discipline_scores[key] - kite.discipline_scores[key];
          return sum + diff * diff;
        }, 0),
      );
      const shapePenalty = k.canopy_shape === kite.canopy_shape ? 0 : 12;
      const aspectDiff = Math.abs(ASPECT_VALUES[k.aspect_ratio] - ASPECT_VALUES[kite.aspect_ratio]) * 0.2;
      return { kite: k, distance: discDist + shapePenalty + aspectDiff };
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, count)
    .map((entry) => entry.kite);
}

export function getActiveKites(kites: Kite[]): Kite[] {
  return kites.filter((k) => !k.discontinued);
}
