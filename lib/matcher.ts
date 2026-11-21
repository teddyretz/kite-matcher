import { Kite, SkillLevel } from './types';

export type KiteConstruction = 'all' | 'dacron' | 'aluula' | 'brainchild';

export interface MatchConstraints {
  construction?: KiteConstruction;
  budget?: number;
}

export interface MatchPreferencesV2 extends MatchConstraints {
  version: 2;
  style: number;
  shape: number;
  wave?: number;
}

export type RidingGoal = 'freeride' | 'big-air' | 'wave' | 'freestyle' | 'foil';
export type FlightFeel = 'forgiving' | 'balanced' | 'performance';
export type WindProfile = 'light' | 'mixed' | 'strong';

export interface AdvisorPreferences extends MatchConstraints {
  version: 2;
  goal: RidingGoal;
  level: SkillLevel;
  feel: FlightFeel;
  wind: WindProfile;
}

export interface AdvisorMatch extends Kite {
  score: number;
  fitLabel: 'Excellent fit' | 'Strong fit' | 'Good fit' | 'Worth a look';
  reasons: string[];
  tradeoffs: string[];
}

export interface SliderAdvisorPreferences extends MatchConstraints {
  version: 2;
  style: number;
  shape: number;
  wavePriority: number;
  handling: number;
  wind: number;
  level: SkillLevel;
}

const styleTargets: Record<RidingGoal, number> = {
  foil: 10,
  wave: 30,
  freestyle: 50,
  freeride: 70,
  'big-air': 90,
};

const turningValues: Record<Kite['turning_speed'], number> = {
  slow: 20,
  medium: 40,
  'medium-fast': 60,
  fast: 80,
  'very-fast': 100,
};

const relaunchValues: Record<Kite['relaunch'], number> = {
  easy: 100,
  medium: 60,
  hard: 20,
};

function closeness(actual: number, target: number): number {
  return Math.max(0, 100 - Math.abs(actual - target));
}

function styleFit(kite: Kite, goal: RidingGoal): number {
  const spectrumFit = closeness(kite.style_spectrum, styleTargets[goal]);
  if (goal !== 'wave') return spectrumFit;
  return spectrumFit * 0.45 + closeness(kite.wave_spectrum, 90) * 0.55;
}

function feelFit(kite: Kite, feel: FlightFeel): number {
  if (feel === 'forgiving') {
    return kite.depower_range * 4.5 + relaunchValues[kite.relaunch] * 0.35 + closeness(turningValues[kite.turning_speed], 45) * 0.2;
  }
  if (feel === 'performance') {
    return turningValues[kite.turning_speed] * 0.55 + closeness(kite.shape_spectrum, 80) * 0.25 + kite.depower_range * 2;
  }
  return closeness(turningValues[kite.turning_speed], 60) * 0.35 + kite.depower_range * 3.5 + kite.low_end_power * 3;
}

function windFit(kite: Kite, wind: WindProfile): number {
  if (wind === 'light') {
    return kite.low_end_power * 7 + closeness(kite.wind_range_low * 5, 50) * 0.3;
  }
  if (wind === 'strong') {
    return kite.depower_range * 6 + Math.min(100, kite.wind_range_high * 2.5) * 0.4;
  }
  const rangeWidth = Math.max(0, kite.wind_range_high - kite.wind_range_low);
  return Math.min(100, rangeWidth * 4) * 0.55 + kite.depower_range * 4.5;
}

function sliderHandlingFit(kite: Kite, handling: number): number {
  const forgiveness = kite.depower_range * 5 + relaunchValues[kite.relaunch] * 0.5;
  const performance = turningValues[kite.turning_speed] * 0.6 + closeness(kite.shape_spectrum, 80) * 0.4;
  const weight = Math.max(0, Math.min(100, handling)) / 100;
  return forgiveness * (1 - weight) + performance * weight;
}

function sliderWindFit(kite: Kite, wind: number): number {
  const light = windFit(kite, 'light');
  const mixed = windFit(kite, 'mixed');
  const strong = windFit(kite, 'strong');
  const value = Math.max(0, Math.min(100, wind));
  if (value <= 50) {
    const weight = value / 50;
    return light * (1 - weight) + mixed * weight;
  }
  const weight = (value - 50) / 50;
  return mixed * (1 - weight) + strong * weight;
}

function riderLevelFit(kite: Kite, level: SkillLevel): number {
  if (level === 'beginner') {
    return kite.depower_range * 6 + relaunchValues[kite.relaunch] * 0.4;
  }

  if (level === 'intermediate') {
    const rangeWidth = Math.min(100, Math.max(0, kite.wind_range_high - kite.wind_range_low) * 4);
    return kite.depower_range * 4
      + relaunchValues[kite.relaunch] * 0.25
      + closeness(turningValues[kite.turning_speed], 60) * 0.2
      + rangeWidth * 0.15;
  }

  return 100;
}

export function displayFitScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score / 5) * 5));
}

export function fitLabel(score: number): AdvisorMatch['fitLabel'] {
  if (score >= 88) return 'Excellent fit';
  if (score >= 78) return 'Strong fit';
  if (score >= 68) return 'Good fit';
  return 'Worth a look';
}

export function hasReviewEvidence(kite: Kite): boolean {
  return Boolean(kite.structured_review);
}

/**
 * Groups model-year and version pairs into one line, e.g. "Thrive" and
 * "Thrive V2", or "Sonic V4" and "Sonic 5", so a shortlist doesn't spend two
 * slots on the same kite in different years.
 */
export function modelLineKey(kite: Pick<Kite, 'brand' | 'model'>): string {
  let model = kite.model.toLowerCase().trim();
  let previous = '';
  while (model !== previous) {
    previous = model;
    model = model.replace(/\s+(v\d+|\d+)$/, '').trim();
  }
  return `${kite.brand.toLowerCase()}::${model}`;
}

/**
 * Builds a discovery shortlist without changing any underlying fit score.
 * One kite per model line and at most `maxPerBrand` per brand; overflow
 * candidates are appended only when the caps would leave the shortlist short,
 * so small categories still return the requested count.
 */
export function getDiverseAdvisorShortlist(
  matches: AdvisorMatch[],
  count = 12,
  maxPerBrand = 2,
): AdvisorMatch[] {
  const selected: AdvisorMatch[] = [];
  const overflow: AdvisorMatch[] = [];
  const brandCounts = new Map<string, number>();
  const modelLines = new Set<string>();

  for (const match of matches) {
    const brandCount = brandCounts.get(match.brand) ?? 0;
    const line = modelLineKey(match);
    if (brandCount < maxPerBrand && !modelLines.has(line) && selected.length < count) {
      selected.push(match);
      brandCounts.set(match.brand, brandCount + 1);
      modelLines.add(line);
    } else {
      overflow.push(match);
    }
  }

  return selected.concat(overflow.slice(0, Math.max(0, count - selected.length))).slice(0, count);
}

/** How far below the best score a reviewed kite can sit and still take a top-pick slot. */
export const REVIEWED_PICK_MARGIN = 8;

/**
 * Reorders the first `slots` picks so kites with review evidence go first when
 * their fit is close to the best one. Unreviewed kites only take a top slot when
 * there aren't enough reviewed kites near the top. Scores never change.
 */
export function prioritizeReviewedPicks<T extends Kite & { score: number }>(
  matches: T[],
  slots = 3,
  margin = REVIEWED_PICK_MARGIN,
): T[] {
  if (matches.length === 0) return matches;
  const best = matches[0].score;
  const top: T[] = matches
    .filter(match => hasReviewEvidence(match) && match.score >= best - margin)
    .slice(0, slots);
  for (const match of matches) {
    if (top.length >= slots) break;
    if (!top.includes(match)) top.push(match);
  }
  return top.concat(matches.filter(match => !top.includes(match)));
}

export const SHORTLIST_SIZE = 12;

/**
 * The list both the homepage preview and the results page show, so the
 * homepage's top three always match the results page's top three.
 */
export function getAdvisorShortlist(matches: AdvisorMatch[], showAll = false): AdvisorMatch[] {
  if (showAll || matches.length <= SHORTLIST_SIZE) return prioritizeReviewedPicks(matches);
  return prioritizeReviewedPicks(getDiverseAdvisorShortlist(matches, SHORTLIST_SIZE, 2));
}

const styleZoneLabels = ['Foil', 'Surf', 'Freestyle', 'Freeride', 'Big Air'];

function styleZoneLabel(value: number): string {
  if (value <= 20) return styleZoneLabels[0];
  if (value <= 40) return styleZoneLabels[1];
  if (value <= 60) return styleZoneLabels[2];
  if (value <= 80) return styleZoneLabels[3];
  return styleZoneLabels[4];
}

const turningLabels: Record<Kite['turning_speed'], string> = {
  slow: 'Slow, steady',
  medium: 'Medium',
  'medium-fast': 'Medium-fast',
  fast: 'Fast',
  'very-fast': 'Very fast',
};

/** Rider preferences on a 0-100 scale, shared by both advisor modes. */
interface ReasonPreferences {
  style: number;
  handling: number;
  wind: number;
  wavePriority: number;
  level: SkillLevel;
}

interface ReasonTrait {
  value: (kite: Kite) => number;
  relevant: (prefs: ReasonPreferences) => boolean;
  applies: (kite: Kite, prefs: ReasonPreferences) => boolean;
  text: (kite: Kite, prefs: ReasonPreferences) => string;
}

const reasonTraits: ReasonTrait[] = [
  {
    value: kite => kite.low_end_power,
    relevant: prefs => prefs.wind <= 50,
    applies: kite => kite.low_end_power >= 7,
    text: kite => `Low-end power ${kite.low_end_power}/10 for lighter days`,
  },
  {
    value: kite => kite.depower_range,
    relevant: prefs => prefs.wind >= 50 || prefs.handling <= 50 || prefs.level === 'beginner',
    applies: kite => kite.depower_range >= 7,
    text: kite => `Depower ${kite.depower_range}/10 keeps gusts manageable`,
  },
  {
    value: kite => kite.wind_range_high - kite.wind_range_low,
    relevant: prefs => prefs.wind > 30 && prefs.wind < 70,
    applies: kite => kite.wind_range_high - kite.wind_range_low >= 18,
    text: kite => `Usable from ${kite.wind_range_low} to ${kite.wind_range_high} knots`,
  },
  {
    value: kite => kite.wind_range_high,
    relevant: prefs => prefs.wind >= 65,
    applies: kite => kite.wind_range_high >= 35,
    text: kite => `Rated up to ${kite.wind_range_high} knots for strong days`,
  },
  {
    value: kite => turningValues[kite.turning_speed],
    relevant: prefs => prefs.handling >= 55 && prefs.level !== 'beginner',
    applies: kite => turningValues[kite.turning_speed] >= 60,
    text: (kite, prefs) => `${turningLabels[kite.turning_speed]} turning, fits your ${prefs.handling >= 65 ? 'performance' : 'balanced'} handling`,
  },
  {
    value: kite => relaunchValues[kite.relaunch],
    relevant: prefs => prefs.handling <= 45 || prefs.level === 'beginner',
    applies: kite => kite.relaunch === 'easy',
    text: (_kite, prefs) => prefs.level === 'beginner' ? 'Easy relaunch for a newer rider' : 'Easy relaunch suits a forgiving feel',
  },
  {
    value: kite => kite.wave_spectrum,
    relevant: prefs => prefs.wavePriority >= 40,
    applies: kite => kite.wave_spectrum >= 65,
    text: kite => `Wave score ${kite.wave_spectrum}/100 for drift and surf sessions`,
  },
  {
    value: kite => kite.structured_review?.rating ?? 0,
    relevant: () => true,
    applies: kite => (kite.structured_review?.rating ?? 0) >= 4,
    text: kite => {
      const review = kite.structured_review!;
      const count = review.sources.length;
      return `Rated ${review.rating.toFixed(1)}/5 by ${count} review ${count === 1 ? 'source' : 'sources'}`;
    },
  },
];

function percentile(value: number, pool: number[]): number {
  if (pool.length <= 1) return 0.5;
  let below = 0;
  let equal = 0;
  for (const other of pool) {
    if (other < value) below += 1;
    else if (other === value) equal += 1;
  }
  return (below + (equal - 1) / 2) / (pool.length - 1);
}

function styleReason(kite: Kite, prefs: ReasonPreferences): string {
  const zone = styleZoneLabel(kite.style_spectrum);
  const targetZone = styleZoneLabel(prefs.style);
  const difference = kite.style_spectrum - prefs.style;
  if (Math.abs(difference) <= 5) return `Sits right on your ${targetZone} target`;
  if (zone !== targetZone) return `${zone}-leaning, next to the ${targetZone} you picked`;
  return difference > 0
    ? `${zone} kite with a lean toward ${styleZoneLabels[Math.min(4, styleZoneLabels.indexOf(zone) + 1)]}`
    : `${zone} kite with a lean toward ${styleZoneLabels[Math.max(0, styleZoneLabels.indexOf(zone) - 1)]}`;
}

/**
 * Picks the reasons that make this kite stand out from the rest of the pool
 * for what the rider asked for, so cards don't all repeat the same line.
 */
function traitReasons(kite: Kite, prefs: ReasonPreferences, pool: Kite[]): string[] {
  return reasonTraits
    .filter(trait => trait.relevant(prefs) && trait.applies(kite, prefs))
    .map(trait => ({
      text: trait.text(kite, prefs),
      rank: percentile(trait.value(kite), pool.map(trait.value)),
    }))
    .filter(candidate => candidate.rank >= 0.5)
    .sort((a, b) => b.rank - a.rank)
    .map(candidate => candidate.text);
}

function buildReasons(kite: Kite, prefs: ReasonPreferences, pool: Kite[]): string[] {
  // Lead with what sets this kite apart; the style line only fills a gap,
  // because most shortlisted kites sit close to the style target anyway.
  const reasons = traitReasons(kite, prefs, pool).slice(0, 2);
  if (reasons.length < 2) reasons.push(styleReason(kite, prefs));
  if (reasons.length < 2) reasons.push(`Suitable for ${prefs.level} riders`);
  return reasons;
}

function sliderReasonPrefs(preferences: SliderAdvisorPreferences): ReasonPreferences {
  return {
    style: preferences.style,
    handling: preferences.handling,
    wind: preferences.wind,
    wavePriority: preferences.wavePriority,
    level: preferences.level,
  };
}

const feelToHandling: Record<FlightFeel, number> = { forgiving: 20, balanced: 50, performance: 80 };
const windToValue: Record<WindProfile, number> = { light: 20, mixed: 50, strong: 80 };

function sliderTradeoffs(kite: Kite, preferences: SliderAdvisorPreferences): string[] {
  const tradeoffs: string[] = [];
  if (kite.relaunch === 'hard' && preferences.handling < 60) tradeoffs.push('Relaunch takes more technique');
  if (kite.low_end_power <= 5 && preferences.wind <= 50) tradeoffs.push('Needs more wind to come alive');
  if (kite.depower_range <= 5 && preferences.wind >= 50) tradeoffs.push('Less forgiving when conditions get gusty');
  if (preferences.handling >= 65 && turningValues[kite.turning_speed] <= 40) tradeoffs.push('Steering may feel slower than requested');
  if (preferences.level === 'beginner' && turningValues[kite.turning_speed] >= 80) tradeoffs.push('Fast steering may feel busy while progressing');
  if (kite.price_new >= 2500) tradeoffs.push('Premium price is the main compromise');
  return tradeoffs.slice(0, 2);
}

export function getSliderAdvisorMatches(kites: Kite[], preferences: SliderAdvisorPreferences): AdvisorMatch[] {
  const waveWeight = Math.max(0, Math.min(100, preferences.wavePriority)) / 100 * 0.35;

  const weights = preferences.level === 'beginner'
    ? { style: 0.3, shape: 0.05, handling: 0.15, wind: 0.2, level: 0.3 }
    : preferences.level === 'intermediate'
      ? { style: 0.45, shape: 0.08, handling: 0.2, wind: 0.17, level: 0.1 }
      : { style: 0.5, shape: 0.1, handling: 0.2, wind: 0.2, level: 0 };

  const pool = filterByMatchConstraints(kites, preferences)
    .filter(kite => kite.skill_level.includes(preferences.level));
  const reasonPrefs = sliderReasonPrefs(preferences);

  return pool
    .map(kite => {
      const styleScore = closeness(kite.style_spectrum, preferences.style) * (1 - waveWeight)
        + closeness(kite.wave_spectrum, 90) * waveWeight;
      const score = Math.round(
        styleScore * weights.style
        + closeness(kite.shape_spectrum, preferences.shape) * weights.shape
        + sliderHandlingFit(kite, preferences.handling) * weights.handling
        + sliderWindFit(kite, preferences.wind) * weights.wind
        + riderLevelFit(kite, preferences.level) * weights.level,
      );
      return {
        ...kite,
        score,
        fitLabel: fitLabel(score),
        reasons: buildReasons(kite, reasonPrefs, pool),
        tradeoffs: sliderTradeoffs(kite, preferences),
      };
    })
    .sort((a, b) => b.score - a.score);
}

function advisorReasons(kite: Kite, preferences: AdvisorPreferences, pool: Kite[]): string[] {
  const goalFit = styleFit(kite, preferences.goal);
  const goalLabel = preferences.goal.replace('-', ' ');
  const reasons = [
    goalFit >= 80
      ? `Strong ${goalLabel} alignment`
      : goalFit >= 65
        ? `Good ${goalLabel} versatility`
        : `Closest available ${goalLabel} fit`,
  ];

  const prefs: ReasonPreferences = {
    style: styleTargets[preferences.goal],
    handling: feelToHandling[preferences.feel],
    wind: windToValue[preferences.wind],
    wavePriority: preferences.goal === 'wave' ? 80 : 0,
    level: preferences.level,
  };
  reasons.push(...traitReasons(kite, prefs, pool).slice(0, 2));
  if (reasons.length < 2) reasons.push(`Suitable for ${preferences.level} riders`);
  return reasons.slice(0, 3);
}

function advisorTradeoffs(kite: Kite, preferences: AdvisorPreferences): string[] {
  const tradeoffs: string[] = [];
  if (kite.relaunch === 'hard') tradeoffs.push('Relaunch takes more technique');
  if (kite.low_end_power <= 5 && preferences.wind !== 'strong') tradeoffs.push('Needs more wind to come alive');
  if (kite.depower_range <= 5) tradeoffs.push('Less forgiving when conditions get gusty');
  if (preferences.feel === 'performance' && turningValues[kite.turning_speed] <= 40) tradeoffs.push('Steering may feel slower than requested');
  if (kite.price_new >= 2500) tradeoffs.push('Premium price is the main compromise');
  return tradeoffs.slice(0, 2);
}

export function getAdvisorMatches(kites: Kite[], preferences: AdvisorPreferences): AdvisorMatch[] {
  const pool = filterByMatchConstraints(kites, preferences)
    .filter(kite => kite.skill_level.includes(preferences.level));

  return pool
    .map(kite => {
      const score = Math.round(
        styleFit(kite, preferences.goal) * 0.55
        + feelFit(kite, preferences.feel) * 0.25
        + windFit(kite, preferences.wind) * 0.2,
      );
      return {
        ...kite,
        score,
        fitLabel: fitLabel(score),
        reasons: advisorReasons(kite, preferences, pool),
        tradeoffs: advisorTradeoffs(kite, preferences),
      };
    })
    .sort((a, b) => b.score - a.score);
}

export function kiteMatchesConstraints(kite: Kite, constraints: MatchConstraints): boolean {
  const { construction = 'all', budget } = constraints;

  if (typeof budget === 'number' && kite.price_new > budget) return false;
  if (construction === 'aluula' && !kite.aluula) return false;
  if (construction === 'brainchild' && !kite.brainchild) return false;
  if (construction === 'dacron' && (kite.aluula || kite.brainchild)) return false;

  return true;
}

export function filterByMatchConstraints(kites: Kite[], constraints: MatchConstraints): Kite[] {
  return kites.filter(kite => kiteMatchesConstraints(kite, constraints));
}

export function matchScore(kite: Kite, styleValue: number, shapeValue: number, waveValue?: number): number {
  const styleDiff = Math.abs(kite.style_spectrum - styleValue);
  const shapeDiff = Math.abs(kite.shape_spectrum - shapeValue);

  if (waveValue !== undefined && waveValue > 0) {
    const waveDiff = Math.abs(kite.wave_spectrum - waveValue);
    // When wave matters, split weight three ways
    const score = 100 - (styleDiff * 0.4 + shapeDiff * 0.3 + waveDiff * 0.3);
    return Math.max(0, Math.round(score));
  }

  // Default: style weighted slightly more than shape
  const score = 100 - (styleDiff * 0.6 + shapeDiff * 0.4);
  return Math.max(0, Math.round(score));
}

export function getTopMatches(kites: Kite[], styleValue: number, shapeValue: number, count: number = 3, waveValue?: number): (Kite & { score: number })[] {
  return kites
    .map(kite => ({ ...kite, score: matchScore(kite, styleValue, shapeValue, waveValue) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}

export function getRankedMatchesV2(kites: Kite[], preferences: MatchPreferencesV2): (Kite & { score: number })[] {
  const eligibleKites = filterByMatchConstraints(kites, preferences);

  return eligibleKites
    .map(kite => ({
      ...kite,
      score: matchScore(kite, preferences.style, preferences.shape, preferences.wave),
    }))
    .sort((a, b) => b.score - a.score);
}

export function getRelatedKites(kite: Kite, allKites: Kite[], count: number = 3): Kite[] {
  return allKites
    .filter(k => k.id !== kite.id && !k.discontinued)
    .map(k => ({
      kite: k,
      distance: Math.abs(k.style_spectrum - kite.style_spectrum) + Math.abs(k.shape_spectrum - kite.shape_spectrum),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, count)
    .map(k => k.kite);
}

export function getActiveKites(kites: Kite[]): Kite[] {
  return kites.filter(k => !k.discontinued);
}
