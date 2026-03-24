import { Kite } from './types';

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
