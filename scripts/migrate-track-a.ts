/**
 * One-time deterministic migration for Track A schema upgrades:
 * Replaces style_spectrum + shape_spectrum + wave_spectrum with:
 *   - discipline_scores: { freeride, big_air, wave, foil, freestyle }
 *   - canopy_shape: 'c' | 'open-c' | 'hybrid' | 'delta' | 'bow' | 'foil'
 *   - bar_pressure: 'light' | 'medium' | 'heavy'
 *   - flying_style: 'sheet-and-go' | 'balanced' | 'active'
 */
import fs from 'fs';
import path from 'path';
import { KiteSchema } from '../lib/schema';
import type { BarPressure, CanopyShape, DisciplineScores, FlyingStyle } from '../lib/types';

const DATA_DIR = path.resolve(__dirname, '..', 'data', 'kites');

interface LegacyKite {
  id: string;
  slug: string;
  brand: string;
  model: string;
  year: number;
  style_spectrum?: number;
  shape_spectrum?: number;
  wave_spectrum?: number;
  discipline_scores?: DisciplineScores;
  canopy_shape?: CanopyShape;
  bar_pressure?: BarPressure;
  flying_style?: FlyingStyle;
  style_tags: string[];
  skill_level: string[];
  aspect_ratio: string;
  strut_count: number;
  bar_type: string;
  aluula: boolean;
  brainchild: boolean;
  turning_speed: string;
  low_end_power: number;
  depower_range: number;
  relaunch: string;
  wind_range_low: number;
  wind_range_high: number;
  summary: string;
  best_for: string;
  [key: string]: unknown;
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function deriveCanopyShape(k: LegacyKite): CanopyShape {
  const text = `${k.model} ${k.summary} ${k.best_for} ${k.style_tags.join(' ')}`.toLowerCase();
  const isRamFoil =
    text.includes('foil kite') ||
    text.includes('closed-cell') ||
    text.includes('closed cell') ||
    text.includes('single-skin') ||
    text.includes('ram-air') ||
    k.brand === 'Flysurfer' && /sonic|soul|peak|hybrid|vmg|stoke/.test(k.model.toLowerCase()) && !/era|stoke/.test(k.model.toLowerCase()) ||
    /hyperlink|chrono|r1/.test(k.model.toLowerCase());

  if (isRamFoil) return 'foil';
  if (/\bvegas\b|\bhadlow\b|\btorch\b|\bfuel\b|\brazor\b/.test(k.model.toLowerCase()) || text.includes('pure c-kite') || text.includes('true c-kite')) {
    return 'c';
  }
  if (/\bdice\b|\bgts\b|\brpm\b|\brpx\b|\bfx\b|\bpulse\b|\benduro\b|\bamp\b|\bunion\b/.test(k.model.toLowerCase()) || text.includes('open-c') || text.includes('open c')) {
    return 'open-c';
  }
  if (text.includes('bow kite') || /\bedge\b|\bxr\b|\brebel\b|\bswitchblade\b|\bmachine\b/.test(k.model.toLowerCase()) || (k.strut_count === 5 && (k.aspect_ratio === 'high' || k.aspect_ratio === 'very-high') && (k.shape_spectrum ?? 50) >= 72)) {
    return 'bow';
  }
  if (text.includes('delta') || /\bevo\b|\breach\b|\bmoto\b|\brally\b|\bmono\b|\bjuice\b|\balpha\b|\bufo\b|\bghost\b|\bultra\b|\bxlite\b|\bdrifter\b|\bneo\b/.test(k.model.toLowerCase())) {
    return 'delta';
  }
  return 'hybrid';
}

function deriveDisciplineScores(k: LegacyKite, canopy: CanopyShape): DisciplineScores {
  const style = k.style_spectrum ?? 65;
  const waveSpec = k.wave_spectrum ?? 20;
  const tags = new Set(k.style_tags.map((t) => t.toLowerCase()));
  const text = `${k.model} ${k.summary} ${k.best_for}`.toLowerCase();

  const hasTag = (...keys: string[]) => keys.some((key) => tags.has(key) || text.includes(key));

  // Start from legacy primary zone signals, then enrich each discipline independently.
  let freeride = 55;
  let big_air = 35;
  let wave = waveSpec;
  let foil = 25;
  let freestyle = 25;

  // Freeride baseline
  if (style >= 58 && style <= 82) freeride = 88;
  else if (style > 82) freeride = 68;
  else if (style >= 40 && style < 58) freeride = 62;
  else if (style >= 20 && style < 40) freeride = 58;
  else freeride = 52;

  if (hasTag('freeride', 'all-round', 'all-rounder', 'progression', 'beginner')) freeride = Math.max(freeride, 86);
  if (k.relaunch === 'easy' && k.depower_range >= 8) freeride += 6;
  if (canopy === 'c') freeride = Math.min(freeride, 45);
  if (canopy === 'foil' && !hasTag('freeride')) freeride = Math.min(freeride, 68);

  // Big air baseline
  if (style >= 82) big_air = 92;
  else if (style >= 72) big_air = 78;
  else if (style >= 60) big_air = 60;
  else big_air = 30;

  if (hasTag('big air', 'megaloops', 'king of the air', 'hangtime', 'boosting')) big_air = Math.max(big_air, 88);
  if (k.strut_count === 5 && (k.aspect_ratio === 'high' || k.aspect_ratio === 'very-high')) big_air = Math.max(big_air, 88);
  if (k.aluula || k.brainchild) big_air += 5;
  if (k.strut_count <= 1 && canopy !== 'foil') big_air = Math.min(big_air, 35);
  if (hasTag('dedicated wave', 'surf')) big_air = Math.min(big_air, 50);

  // Wave baseline
  if (style >= 20 && style <= 40) wave = Math.max(wave, 88);
  if (hasTag('wave', 'surf', 'drift', 'strapless')) wave = Math.max(wave, 82);
  if (/\bneo\b|\bcarve\b|\bdrifter\b|\breo\b|\bsection\b|\bsst\b|\bws\b|\bbandit s\b|\bsession\b/.test(k.model.toLowerCase())) {
    wave = Math.max(wave, 92);
  }
  if (k.strut_count === 5) wave = Math.min(wave, 32);
  if (canopy === 'foil') wave = Math.min(wave, 30);

  // Foil baseline
  if (style <= 20 || canopy === 'foil') foil = 92;
  else if (k.strut_count === 0) foil = 95;
  else if (k.strut_count === 1) foil = 90;
  else if (hasTag('foil', 'foiling', 'lightwind', 'light wind')) foil = Math.max(foil, 82);
  else if (k.strut_count === 3 && k.low_end_power >= 8) foil = 65;
  else if (k.strut_count === 3) foil = 50;
  else foil = 22;

  if (k.aluula && k.strut_count <= 3) foil += 8;

  // Freestyle baseline
  if (canopy === 'c') freestyle = 96;
  else if (canopy === 'open-c') freestyle = 88;
  else if (style >= 41 && style <= 60) freestyle = 82;
  else if (hasTag('freestyle', 'unhooked', 'wakestyle', 'kiteloop')) freestyle = Math.max(freestyle, 76);
  else if (style >= 61 && style <= 80) freestyle = 48;
  else freestyle = 25;

  if (canopy === 'foil' || k.strut_count <= 1) freestyle = Math.min(freestyle, 25);

  return {
    freeride: clamp(freeride),
    big_air: clamp(big_air),
    wave: clamp(wave),
    foil: clamp(foil),
    freestyle: clamp(freestyle),
  };
}

function deriveBarPressure(k: LegacyKite, canopy: CanopyShape): BarPressure {
  const text = `${k.summary} ${k.best_for}`.toLowerCase();
  if (text.includes('light bar pressure') || text.includes('featherlight')) return 'light';
  if (text.includes('heavy bar pressure') || text.includes('firm bar')) return 'heavy';
  if (canopy === 'foil' || k.strut_count <= 1 || k.aluula || k.brainchild) return 'light';
  if (canopy === 'c' || (k.strut_count === 5 && /\bswitchblade\b|\bxr\b|\brebel\b|\bedge\b|\bmachine\b/.test(k.model.toLowerCase()))) {
    return 'heavy';
  }
  if (k.turning_speed === 'very-fast') return 'light';
  return 'medium';
}

function deriveFlyingStyle(k: LegacyKite, canopy: CanopyShape): FlyingStyle {
  if (canopy === 'c' || canopy === 'open-c' || canopy === 'foil') return 'active';
  if (k.relaunch === 'easy' && k.depower_range >= 8 && (canopy === 'delta' || canopy === 'bow')) {
    return 'sheet-and-go';
  }
  if (k.turning_speed === 'very-fast' && k.strut_count <= 3 && !k.skill_level.includes('beginner')) {
    return 'active';
  }
  return 'balanced';
}

function main() {
  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.json')).sort();
  let migrated = 0;

  for (const file of files) {
    const fullPath = path.join(DATA_DIR, file);
    const raw = JSON.parse(fs.readFileSync(fullPath, 'utf-8')) as LegacyKite;

    const canopy_shape = raw.canopy_shape ?? deriveCanopyShape(raw);
    const discipline_scores = raw.discipline_scores ?? deriveDisciplineScores(raw, canopy_shape);
    const bar_pressure = raw.bar_pressure ?? deriveBarPressure(raw, canopy_shape);
    const flying_style = raw.flying_style ?? deriveFlyingStyle(raw, canopy_shape);

    const { style_spectrum: _s, shape_spectrum: _sh, wave_spectrum: _w, ...rest } = raw;
    void _s;
    void _sh;
    void _w;

    const next = {
      id: rest.id,
      slug: rest.slug,
      brand: rest.brand,
      model: rest.model,
      year: rest.year,
      image: rest.image,
      discipline_scores,
      canopy_shape,
      bar_pressure,
      flying_style,
      ...Object.fromEntries(
        Object.entries(rest).filter(
          ([k]) => !['id', 'slug', 'brand', 'model', 'year', 'image', 'discipline_scores', 'canopy_shape', 'bar_pressure', 'flying_style'].includes(k),
        ),
      ),
    };

    KiteSchema.parse(next);
    fs.writeFileSync(fullPath, JSON.stringify(next, null, 2) + '\n');
    migrated++;
  }

  console.log(`✓ Migrated ${migrated} kite file(s) to Track A schema`);
}

main();
