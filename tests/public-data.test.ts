import assert from 'node:assert/strict';
import test from 'node:test';
import { stripPrivateReviewContent, toKiteSummary } from '../lib/publicKites';
import type { Kite } from '../lib/types';

test('public review mapping removes full transcripts while preserving review evidence', () => {
  const reviews: Kite['reviews'] = [{
    source: 'youtube',
    reviewer: 'Reviewer',
    channel: 'Channel',
    channel_url: 'https://example.com/channel',
    video_id: 'video',
    video_title: 'Review',
    video_url: 'https://example.com/review',
    excerpt: 'Useful excerpt',
    verdict: 'Useful verdict',
    full_transcript: 'Private source material',
  }];

  const [review] = stripPrivateReviewContent(reviews);
  assert.equal(review.source, 'youtube');
  assert.equal('full_transcript' in review, false);
  assert.equal(review.excerpt, 'Useful excerpt');
});

test('compare summaries expose identity fields only', () => {
  const summary = toKiteSummary({
    slug: 'example', brand: 'Brand', model: 'Model', year: 2026,
  } as Kite);

  assert.deepEqual(summary, { slug: 'example', brand: 'Brand', model: 'Model', year: 2026 });
  assert.deepEqual(Object.keys(summary).sort(), ['brand', 'model', 'slug', 'year']);
});
