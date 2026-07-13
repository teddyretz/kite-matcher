import assert from 'node:assert/strict';
import test from 'node:test';
import { filterByMatchConstraints, getRankedMatchesV2, matchScore } from '../lib/matcher';
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
