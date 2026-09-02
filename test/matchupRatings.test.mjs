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

// Regression: a real paste wrapped the reminder comment across 3 lines
// (the URL landed on its own line) instead of 1. The old regex only
// stripped a single leading "//" line, so the 2 leftover comment lines
// broke JSON.parse for the *entire* file - silently dropping every
// player's matchup rating, not just the one intended as a comment.
test('parseMatchupRatings: strips multiple consecutive leading comment lines', () => {
  const raw =
    '// FantasyPros-Konsole (eingeloggt auf \n' +
    '// https://www.fantasypros.com/nfl/rankings/ppr-superflex.php)\n' +
    '// copy(JSON.stringify(advancedMetrics))\n' +
    '{"9001":{"matchup_rating":{"rating":"3.5"}}}';
  assert.deepEqual(parseMatchupRatings(raw), { 9001: 3.5 });
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
