import { Kite } from './types';

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
