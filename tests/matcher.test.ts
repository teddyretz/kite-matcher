import assert from 'node:assert/strict';
import test from 'node:test';
import { displayFitScore, filterByMatchConstraints, getAdvisorMatches, getDiverseAdvisorShortlist, getRankedMatchesV2, getSliderAdvisorMatches, matchScore } from '../lib/matcher';
import type { Kite } from '../lib/types';

function kite(overrides: Partial<Kite> = {}): Kite {
  return {
    id: 'test-kite',
    slug: 'test-kite',
    brand: 'Test',
    model: 'Kite',
    year: 2026,
    image: '/kites/test-kite.jpg',
    style_spectrum: 50,
    shape_spectrum: 50,
    wave_spectrum: 50,
    style_tags: [],
    skill_level: ['intermediate'],
    aspect_ratio: 'medium',
    strut_count: 3,
    bar_type: 'low-v',
    aluula: false,
    brainchild: false,
    turning_speed: 'medium',
    low_end_power: 5,
    depower_range: 5,
    relaunch: 'easy',
    wind_range_low: 12,
    wind_range_high: 30,
    sizes: [7, 9, 12],
    price_new: 1500,
    summary: 'Test summary',
    best_for: 'Testing',
    reviews: [],
    buy_links: { new: [], used: [] },
    ...overrides,
  };
}

test('legacy match score remains stable during the V2 rollout', () => {
  assert.equal(matchScore(kite({ style_spectrum: 60, shape_spectrum: 40 }), 50, 50), 90);
});

test('hard constraints exclude kites over budget', () => {
  const eligible = filterByMatchConstraints(
    [kite({ slug: 'under', price_new: 1200 }), kite({ slug: 'over', price_new: 2200 })],
    { budget: 1500 },
  );

  assert.deepEqual(eligible.map(item => item.slug), ['under']);
});

test('construction constraints distinguish standard, Aluula, and Brainchild kites', () => {
  const kites = [
    kite({ slug: 'dacron' }),
    kite({ slug: 'aluula', aluula: true }),
    kite({ slug: 'brainchild', brainchild: true }),
  ];

  assert.deepEqual(filterByMatchConstraints(kites, { construction: 'dacron' }).map(k => k.slug), ['dacron']);
  assert.deepEqual(filterByMatchConstraints(kites, { construction: 'aluula' }).map(k => k.slug), ['aluula']);
  assert.deepEqual(filterByMatchConstraints(kites, { construction: 'brainchild' }).map(k => k.slug), ['brainchild']);
});

test('V2 applies constraints before ranking eligible kites', () => {
  const ranked = getRankedMatchesV2(
    [
      kite({ slug: 'perfect-but-over-budget', price_new: 3000 }),
      kite({ slug: 'eligible', price_new: 1400, style_spectrum: 60 }),
    ],
    { version: 2, style: 50, shape: 50, budget: 1500 },
  );

  assert.deepEqual(ranked.map(item => item.slug), ['eligible']);
});

test('advisor excludes kites that are not suitable for the rider level', () => {
  const ranked = getAdvisorMatches(
    [
      kite({ slug: 'advanced-only', skill_level: ['advanced'] }),
      kite({ slug: 'beginner-fit', skill_level: ['beginner', 'intermediate'] }),
    ],
    { version: 2, goal: 'freeride', level: 'beginner', feel: 'forgiving', wind: 'mixed' },
  );

  assert.deepEqual(ranked.map(item => item.slug), ['beginner-fit']);
});

test('advisor returns human-readable reasons and honest tradeoffs', () => {
  const [match] = getAdvisorMatches(
    [kite({ relaunch: 'hard', low_end_power: 4, price_new: 2800 })],
    { version: 2, goal: 'freeride', level: 'intermediate', feel: 'balanced', wind: 'light' },
  );

  assert.ok(match.reasons.some(reason => reason.includes('freeride')));
  assert.ok(match.tradeoffs.includes('Relaunch takes more technique'));
  assert.ok(match.tradeoffs.includes('Needs more wind to come alive'));
});

test('advisor does not describe a weak style fit as strong alignment', () => {
  const [match] = getAdvisorMatches(
    [kite({ style_spectrum: 95, wave_spectrum: 5 })],
    { version: 2, goal: 'wave', level: 'intermediate', feel: 'balanced', wind: 'mixed' },
  );

  assert.equal(match.reasons[0], 'Closest available wave fit');
});

test('slider advisor updates ranking continuously as riding style changes', () => {
  const kites = [
    kite({ slug: 'surf', style_spectrum: 30, wave_spectrum: 80 }),
    kite({ slug: 'big-air', style_spectrum: 90, wave_spectrum: 20 }),
  ];
  const base = { version: 2 as const, shape: 50, wavePriority: 0, handling: 50, wind: 50, level: 'intermediate' as const };

  assert.equal(getSliderAdvisorMatches(kites, { ...base, style: 30 })[0].slug, 'surf');
  assert.equal(getSliderAdvisorMatches(kites, { ...base, style: 90 })[0].slug, 'big-air');
});

test('wave-priority slider can lift a wave-oriented kite in the ranking', () => {
  const kites = [
    kite({ slug: 'wave', style_spectrum: 45, wave_spectrum: 95 }),
    kite({ slug: 'neutral', style_spectrum: 50, wave_spectrum: 20 }),
  ];
  const matches = getSliderAdvisorMatches(kites, {
    version: 2, style: 50, shape: 50, wavePriority: 100, handling: 50, wind: 50, level: 'intermediate',
  });

  assert.equal(matches[0].slug, 'wave');
});

test('beginner ranking prioritizes control and relaunch over technical performance', () => {
  const matches = getSliderAdvisorMatches(
    [
      kite({ slug: 'technical', skill_level: ['beginner'], turning_speed: 'very-fast', depower_range: 4, relaunch: 'hard' }),
      kite({ slug: 'forgiving', skill_level: ['beginner'], turning_speed: 'medium', depower_range: 10, relaunch: 'easy' }),
    ],
    { version: 2, style: 50, shape: 50, wavePriority: 0, handling: 50, wind: 50, level: 'beginner' },
  );

  assert.equal(matches[0].slug, 'forgiving');
  assert.ok(matches[0].reasons.includes('Control and relaunch suit a newer rider'));
});

test('brand identity never changes a fit score', () => {
  const matches = getSliderAdvisorMatches(
    [
      kite({ id: 'core', slug: 'core', brand: 'Core' }),
      kite({ id: 'other', slug: 'other', brand: 'Other' }),
    ],
    { version: 2, style: 50, shape: 50, wavePriority: 0, handling: 50, wind: 50, level: 'intermediate' },
  );

  assert.equal(matches[0].score, matches[1].score);
});

test('displayed fit scores round to five-point increments', () => {
  assert.equal(displayFitScore(93), 95);
  assert.equal(displayFitScore(92), 90);
});

test('advisor shortlist limits brand repetition without changing fit scores', () => {
  const ranked = getSliderAdvisorMatches(
    [
      kite({ id: 'core-1', slug: 'core-1', brand: 'Core', style_spectrum: 50 }),
      kite({ id: 'core-2', slug: 'core-2', brand: 'Core', style_spectrum: 51 }),
      kite({ id: 'core-3', slug: 'core-3', brand: 'Core', style_spectrum: 52 }),
      kite({ id: 'north-1', slug: 'north-1', brand: 'North', style_spectrum: 55 }),
    ],
    { version: 2, style: 50, shape: 50, wavePriority: 0, handling: 50, wind: 50, level: 'intermediate' },
  );
  const originalScore = ranked.find(match => match.slug === 'core-1')?.score;
  const shortlist = getDiverseAdvisorShortlist(ranked, 3, 2);

  assert.equal(shortlist.filter(match => match.brand === 'Core').length, 2);
  assert.ok(shortlist.some(match => match.brand === 'North'));
  assert.equal(ranked.find(match => match.slug === 'core-1')?.score, originalScore);
});
