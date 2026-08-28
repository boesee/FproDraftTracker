import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseMatchupRatings } from '../scripts/lib/matchupRatings.mjs';

test('parseMatchupRatings: strips the leading "//" reminder comment line', () => {
  const raw = '// copy(JSON.stringify(advancedMetrics)) into this file\n{"9001":{"matchup_rating":{"rating":"3.5"}}}';
  assert.deepEqual(parseMatchupRatings(raw), { 9001: 3.5 });
});

test('parseMatchupRatings: works without a leading comment line too', () => {
  const raw = '{"9001":{"matchup_rating":{"rating":"4"}}}';
  assert.deepEqual(parseMatchupRatings(raw), { 9001: 4 });
});

test('parseMatchupRatings: multiple players', () => {
  const raw = JSON.stringify({
    '1': { matchup_rating: { rating: '1' } },
    '2': { matchup_rating: { rating: '5' } },
  });
  assert.deepEqual(parseMatchupRatings(raw), { 1: 1, 2: 5 });
});

test('parseMatchupRatings: an entry with a non-numeric rating is skipped, not NaN', () => {
  const raw = JSON.stringify({
    '1': { matchup_rating: { rating: '3' } },
    '2': { matchup_rating: { rating: 'n/a' } },
  });
  assert.deepEqual(parseMatchupRatings(raw), { 1: 3 });
});

test('parseMatchupRatings: an entry missing matchup_rating entirely is skipped', () => {
  const raw = JSON.stringify({ '1': { matchup_rating: { rating: '3' } }, '2': {} });
  assert.deepEqual(parseMatchupRatings(raw), { 1: 3 });
});

test('parseMatchupRatings: throws on malformed JSON (caller decides how to handle it)', () => {
  assert.throws(() => parseMatchupRatings('{not valid json'));
});

test('parseMatchupRatings: empty object input yields an empty ratings map', () => {
  assert.deepEqual(parseMatchupRatings('{}'), {});
});
