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
  reasons: string[];
  tradeoffs: string[];
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

function advisorReasons(kite: Kite, preferences: AdvisorPreferences): string[] {
  const goalFit = styleFit(kite, preferences.goal);
  const goalLabel = preferences.goal.replace('-', ' ');
  const reasons = [
    goalFit >= 80
      ? `Strong ${goalLabel} alignment`
      : goalFit >= 65
        ? `Good ${goalLabel} versatility`
        : `Closest available ${goalLabel} fit`,
  ];

  if (preferences.feel === 'forgiving' && kite.relaunch === 'easy') reasons.push('Easy relaunch builds confidence');
  else if (preferences.feel === 'performance' && turningValues[kite.turning_speed] >= 80) reasons.push('Fast steering suits an aggressive rider');
  else if (kite.depower_range >= 8) reasons.push('Wide depower range adds control');

  if (preferences.wind === 'light' && kite.low_end_power >= 8) reasons.push('Strong low-end power for lighter sessions');
  else if (preferences.wind === 'strong' && kite.wind_range_high >= 35) reasons.push('High top end for stronger wind');
  else if (preferences.wind === 'mixed' && kite.wind_range_high - kite.wind_range_low >= 20) reasons.push('Broad usable wind range');

  if (kite.skill_level.includes(preferences.level)) reasons.push(`Suitable for ${preferences.level} riders`);
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
  return filterByMatchConstraints(kites, preferences)
    .filter(kite => kite.skill_level.includes(preferences.level))
    .map(kite => ({
      ...kite,
      score: Math.round(
        styleFit(kite, preferences.goal) * 0.55
        + feelFit(kite, preferences.feel) * 0.25
        + windFit(kite, preferences.wind) * 0.2,
      ),
      reasons: advisorReasons(kite, preferences),
      tradeoffs: advisorTradeoffs(kite, preferences),
    }))
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
