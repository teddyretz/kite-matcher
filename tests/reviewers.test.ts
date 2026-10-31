import assert from 'node:assert/strict';
import test from 'node:test';
import { channelHandle, reviewerForChannel, sourceMixLabel } from '../lib/reviewers';

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
