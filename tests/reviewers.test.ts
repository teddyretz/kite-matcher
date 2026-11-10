import assert from 'node:assert/strict';
import test from 'node:test';
import { channelHandle, limitedEvidenceLabel, reviewerForChannel, reviewSortKey, sourceMixLabel } from '../lib/reviewers';

test('channel handles resolve regardless of URL form or case', () => {
  assert.equal(channelHandle('https://youtube.com/@Kitemana'), '@kitemana');
  assert.equal(channelHandle('https://www.youtube.com/@jasonofmontreal/videos'), '@jasonofmontreal');
  assert.equal(reviewerForChannel('https://www.youtube.com/@REALWatersports')?.type, 'retailer');
});

test('evidence label states the commercial mix instead of claiming independence', () => {
  assert.equal(sourceMixLabel(['Jason Montreal']), '1 independent source');
  assert.equal(sourceMixLabel(['Jason Montreal', 'Kitemana']), '1 independent + 1 retailer sources');
  assert.equal(sourceMixLabel(['Someone New']), '1 unverified source');
});

test('ratings without an independent or owner source are tagged and ranked lower', () => {
  assert.equal(limitedEvidenceLabel(['Kitemana']), 'Shop reviews only');
  assert.equal(limitedEvidenceLabel(['Gleiten tv']), 'No independent review yet');
  assert.equal(limitedEvidenceLabel(['Kitemana', 'Jason Montreal']), null);
  const shopOnly = { rating: 4.9, sources: ['Kitemana'] };
  const independent = { rating: 3.5, sources: ['Jason Montreal'] };
  assert.ok(reviewSortKey(independent) > reviewSortKey(shopOnly));
  assert.ok(reviewSortKey(shopOnly) > reviewSortKey(null));
});
