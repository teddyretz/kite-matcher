import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  DEFAULT_RIDER_PROFILE,
  displayFitScore,
  filterByMatchConstraints,
  getActiveKites,
  getDiverseAdvisorShortlist,
  getUnifiedMatches,
  recommendKiteSizeRange,
  scoreKite,
} from '../lib/matcher';
import { KiteSchema } from '../lib/schema';
import type { Kite } from '../lib/types';

function loadCatalog(): Kite[] {
  const dir = path.resolve(__dirname, '..', 'data', 'kites');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
  const kites = files.map((f) => KiteSchema.parse(JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8'))) as Kite);
  return getActiveKites(kites);
}

const CATALOG = loadCatalog();

function makeKite(overrides: Partial<Kite> = {}): Kite {
  return {
    id: 'test-kite',
    slug: 'test-kite',
    brand: 'Test',
    model: 'Kite',
    year: 2026,
    image: '/kites/test-kite.jpg',
    discipline_scores: {
      freeride: 75,
      big_air: 60,
      wave: 40,
      foil: 50,
      freestyle: 45,
    },
    canopy_shape: 'hybrid',
    bar_pressure: 'medium',
    flying_style: 'balanced',
    style_tags: ['freeride'],
    skill_level: ['intermediate'],
    aspect_ratio: 'medium',
    strut_count: 3,
    bar_type: 'low-v',
    aluula: false,
    brainchild: false,
    turning_speed: 'medium-fast',
    low_end_power: 7,
    depower_range: 8,
    relaunch: 'easy',
    wind_range_low: 12,
    wind_range_high: 30,
    sizes: [7, 9, 10, 12, 14],
    price_new: 1500,
    summary: 'Test summary',
    best_for: 'Testing',
    reviews: [],
    buy_links: { new: [], used: [] },
    ...overrides,
  };
}

// ── Core invariants ──────────────────────────────────────────────────────────

test('hard constraints exclude kites over budget, wrong construction, or incompatible bar', () => {
  const kites = [
    makeKite({ slug: 'dacron-lowv', price_new: 1300, bar_type: 'low-v' }),
    makeKite({ slug: 'aluula-highy', price_new: 2800, aluula: true, bar_type: 'high-y' }),
    makeKite({ slug: 'brainchild-both', price_new: 2200, brainchild: true, bar_type: 'both' }),
  ];

  assert.deepEqual(filterByMatchConstraints(kites, { budget: 1500 }).map((k) => k.slug), ['dacron-lowv']);
  assert.deepEqual(filterByMatchConstraints(kites, { construction: 'aluula' }).map((k) => k.slug), ['aluula-highy']);
  assert.deepEqual(filterByMatchConstraints(kites, { construction: 'brainchild' }).map((k) => k.slug), ['brainchild-both']);
  assert.deepEqual(filterByMatchConstraints(kites, { construction: 'dacron' }).map((k) => k.slug), ['dacron-lowv']);
  assert.deepEqual(filterByMatchConstraints(kites, { barType: 'high-y' }).map((k) => k.slug), ['aluula-highy', 'brainchild-both']);
  assert.deepEqual(filterByMatchConstraints(kites, { barType: 'low-v' }).map((k) => k.slug), ['dacron-lowv', 'brainchild-both']);
});

test('brand identity, reviews, and commercial links never change fit scores', () => {
  const base = makeKite({ id: 'a', slug: 'a', brand: 'BrandA' });
  const decorated = makeKite({
    id: 'b',
    slug: 'b',
    brand: 'BrandB',
    teds_pick: true,
    structured_review: {
      rating: 5.0,
      summary: 'Amazing',
      pros: ['Great'],
      cons: ['Pricey'],
      best_for: 'Everyone',
      not_for: 'Nobody',
      rec_blurb: 'Top rated',
      sources: ['Jason Montreal'],
    },
    buy_links: {
      new: [{ retailer: 'Shop', url: 'https://example.com', price: 1500 }],
      used: [{ source: 'Used', url: 'https://example.com/used' }],
    },
  });

  assert.equal(scoreKite(base, DEFAULT_RIDER_PROFILE), scoreKite(decorated, DEFAULT_RIDER_PROFILE));
});

test('displayed fit scores round to five-point increments', () => {
  assert.equal(displayFitScore(93), 95);
  assert.equal(displayFitScore(92), 90);
});

test('advisor shortlist limits brand repetition without changing fit scores', () => {
  const ranked = getUnifiedMatches(
    [
      makeKite({ id: 'core-1', slug: 'core-1', brand: 'Core', discipline_scores: { freeride: 95, big_air: 70, wave: 40, foil: 50, freestyle: 40 } }),
      makeKite({ id: 'core-2', slug: 'core-2', brand: 'Core', discipline_scores: { freeride: 94, big_air: 70, wave: 40, foil: 50, freestyle: 40 } }),
      makeKite({ id: 'core-3', slug: 'core-3', brand: 'Core', discipline_scores: { freeride: 93, big_air: 70, wave: 40, foil: 50, freestyle: 40 } }),
      makeKite({ id: 'north-1', slug: 'north-1', brand: 'North', discipline_scores: { freeride: 90, big_air: 70, wave: 40, foil: 50, freestyle: 40 } }),
    ],
    DEFAULT_RIDER_PROFILE,
  );
  const originalScore = ranked.find((m) => m.slug === 'core-1')?.score;
  const shortlist = getDiverseAdvisorShortlist(ranked, 3, 2);

  assert.equal(shortlist.filter((m) => m.brand === 'Core').length, 2);
  assert.ok(shortlist.some((m) => m.brand === 'North'));
  assert.equal(ranked.find((m) => m.slug === 'core-1')?.score, originalScore);
});

test('rider weight scales recommended kite size sensibly', () => {
  const sample = makeKite({ sizes: [6, 7, 8, 9, 10, 11, 12, 14, 15] });
  const lightRider = recommendKiteSizeRange(sample, 60, 18, 'twin-tip');
  const heavyRider = recommendKiteSizeRange(sample, 95, 18, 'twin-tip');
  const foiler = recommendKiteSizeRange(sample, 75, 14, 'hydrofoil');
  const twinTipLightWind = recommendKiteSizeRange(sample, 75, 14, 'twin-tip');

  assert.ok(heavyRider.idealSize > lightRider.idealSize, 'heavier rider should get a larger kite size');
  assert.ok(foiler.idealSize < twinTipLightWind.idealSize, 'hydrofoil should recommend a smaller kite than twin-tip in the same wind');
});

// ── Persona Regression Suite (10 real-world rider profiles on the 89-kite catalog) ──

test('persona 1: 85kg progressing beginner (freeride, twin-tip, 18kt, Dacron)', () => {
  const matches = getUnifiedMatches(CATALOG, {
    discipline: 'freeride',
    boardType: 'twin-tip',
    level: 'beginner',
    windKnots: 18,
    riderWeightKg: 85,
    construction: 'dacron',
  });

  assert.ok(matches.length >= 5);
  const top5 = matches.slice(0, 5);
  for (const k of top5) {
    assert.ok(k.skill_level.includes('beginner'), `${k.slug} should be beginner-safe`);
    assert.notEqual(k.canopy_shape, 'c', `${k.slug} must not be a pure C-kite`);
    assert.notEqual(k.relaunch, 'hard', `${k.slug} must not have hard relaunch`);
    assert.ok(k.discipline_scores.freeride >= 75, `${k.slug} should have strong freeride score`);
    assert.ok(k.recommendedSize && k.recommendedSize.idealSize >= 10 && k.recommendedSize.idealSize <= 13);
  }
});

test('persona 2: light-wind hydrofoiler (75kg, foil, hydrofoil, 11kt)', () => {
  const matches = getUnifiedMatches(CATALOG, {
    discipline: 'foil',
    boardType: 'hydrofoil',
    level: 'intermediate',
    windKnots: 11,
    riderWeightKg: 75,
  });

  assert.ok(matches.length >= 5);
  for (const k of matches.slice(0, 5)) {
    assert.ok(k.discipline_scores.foil >= 80, `${k.slug} should score >=80 for foil (got ${k.discipline_scores.foil})`);
    assert.ok(k.low_end_power >= 7, `${k.slug} should have solid low-end power`);
  }
});

test('persona 3: dedicated wave rider on a low-V bar (78kg, wave, surfboard, 20kt)', () => {
  const matches = getUnifiedMatches(CATALOG, {
    discipline: 'wave',
    boardType: 'surfboard',
    level: 'intermediate',
    barType: 'low-v',
    windKnots: 20,
    riderWeightKg: 78,
  });

  assert.ok(matches.length >= 5);
  for (const k of matches) {
    assert.ok(k.bar_type === 'low-v' || k.bar_type === 'both', `${k.slug} must work with low-V bar`);
  }
  for (const k of matches.slice(0, 5)) {
    assert.ok(k.discipline_scores.wave >= 80, `${k.slug} should score >=80 for wave (got ${k.discipline_scores.wave})`);
  }
});

test('persona 4: heavy big-air looper (98kg, big_air, twin-tip, 28kt, advanced)', () => {
  const matches = getUnifiedMatches(CATALOG, {
    discipline: 'big_air',
    boardType: 'twin-tip',
    level: 'advanced',
    windKnots: 28,
    riderWeightKg: 98,
  });

  assert.ok(matches.length >= 5);
  for (const k of matches.slice(0, 5)) {
    assert.ok(k.discipline_scores.big_air >= 85, `${k.slug} should score >=85 for big air (got ${k.discipline_scores.big_air})`);
    assert.ok(k.wind_range_high >= 32, `${k.slug} should handle powered wind`);
  }
});

test('persona 5: unhooked freestyler (72kg, freestyle, twin-tip, advanced, active)', () => {
  const matches = getUnifiedMatches(CATALOG, {
    discipline: 'freestyle',
    boardType: 'twin-tip',
    level: 'advanced',
    flyingStyle: 'active',
    windKnots: 20,
    riderWeightKg: 72,
  });

  assert.ok(matches.length >= 5);
  for (const k of matches.slice(0, 3)) {
    assert.ok(k.discipline_scores.freestyle >= 75, `${k.slug} should score >=75 for freestyle (got ${k.discipline_scores.freestyle})`);
  }
});

test('persona 6: budget-conscious beginner (70kg, freeride, max $1,500)', () => {
  const matches = getUnifiedMatches(CATALOG, {
    discipline: 'freeride',
    boardType: 'twin-tip',
    level: 'beginner',
    budget: 1500,
    windKnots: 18,
    riderWeightKg: 70,
  });

  assert.ok(matches.length >= 3);
  for (const k of matches) {
    assert.ok(k.price_new <= 1500, `${k.slug} exceeds $1,500 budget`);
    assert.ok(k.skill_level.includes('beginner'));
  }
});

test('persona 7: Aluula big-air performance seeker (82kg, big_air, Aluula, 25kt)', () => {
  const matches = getUnifiedMatches(CATALOG, {
    discipline: 'big_air',
    boardType: 'twin-tip',
    level: 'advanced',
    construction: 'aluula',
    windKnots: 25,
    riderWeightKg: 82,
  });

  assert.ok(matches.length >= 3);
  for (const k of matches) {
    assert.equal(k.aluula, true, `${k.slug} must be Aluula`);
  }
  assert.ok(matches[0].discipline_scores.big_air >= 85);
});

test('persona 8: high-Y bar ecosystem freerider (80kg, freeride, high-y)', () => {
  const matches = getUnifiedMatches(CATALOG, {
    discipline: 'freeride',
    boardType: 'twin-tip',
    level: 'intermediate',
    barType: 'high-y',
    windKnots: 18,
    riderWeightKg: 80,
  });

  assert.ok(matches.length >= 5);
  for (const k of matches) {
    assert.ok(k.bar_type === 'high-y' || k.bar_type === 'both', `${k.slug} must support high-Y`);
  }
});

test('persona 9: lighter intermediate rider preferring light bar pressure (58kg, freeride, 16kt)', () => {
  const matches = getUnifiedMatches(CATALOG, {
    discipline: 'freeride',
    boardType: 'twin-tip',
    level: 'intermediate',
    barPressure: 'light',
    windKnots: 16,
    riderWeightKg: 58,
  });

  assert.ok(matches.length >= 5);
  const top3 = matches.slice(0, 3);
  assert.ok(top3.some((k) => k.bar_pressure === 'light'), 'top 3 should include light bar-pressure kites');
  const rec = top3[0].recommendedSize;
  assert.ok(rec && rec.idealSize <= 10.5, `58kg rider in 16kt should get <=10.5m (got ${rec?.idealSize})`);
});

test('persona 10: Brainchild construction big-air/freeride rider (80kg, big_air, Brainchild)', () => {
  const matches = getUnifiedMatches(CATALOG, {
    discipline: 'big_air',
    boardType: 'twin-tip',
    level: 'advanced',
    construction: 'brainchild',
    windKnots: 24,
    riderWeightKg: 80,
  });

  assert.ok(matches.length >= 3);
  for (const k of matches) {
    assert.equal(k.brainchild, true, `${k.slug} must be Brainchild construction`);
  }
});
