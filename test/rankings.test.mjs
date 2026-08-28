import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  sortPlayersByRank,
  extractPositionRank,
  sortPlayersByPositionRank,
  describeRankingPeriod,
  describeFreshness,
  describeMatchupRatingsFreshness,
} from '../js/rankings.js';

test('sortPlayersByRank: BR-001 ascending by rank, does not mutate the input array', () => {
  const players = [{ rank: 3 }, { rank: 1 }, { rank: 2 }];
  const sorted = sortPlayersByRank(players);
  assert.deepEqual(
    sorted.map((p) => p.rank),
    [1, 2, 3]
  );
  assert.deepEqual(
    players.map((p) => p.rank),
    [3, 1, 2]
  );
});

test('extractPositionRank: parses the trailing digits from a combined position label', () => {
  assert.equal(extractPositionRank('RB1'), 1);
  assert.equal(extractPositionRank('QB23'), 23);
  assert.equal(extractPositionRank('WR100'), 100);
});

test('extractPositionRank: returns null for unparseable input instead of NaN', () => {
  assert.equal(extractPositionRank('RB'), null);
  assert.equal(extractPositionRank(''), null);
  assert.equal(extractPositionRank(null), null);
  assert.equal(extractPositionRank(undefined), null);
});

test('sortPlayersByPositionRank: ascending by positional rank, not overall rank', () => {
  const players = [
    { rank: 5, position: 'QB2' },
    { rank: 1, position: 'QB10' },
    { rank: 20, position: 'QB1' },
  ];
  const sorted = sortPlayersByPositionRank(players);
  assert.deepEqual(
    sorted.map((p) => p.position),
    ['QB1', 'QB2', 'QB10']
  );
});

test('sortPlayersByPositionRank: unparseable positions sort last, not first', () => {
  const players = [{ position: 'DST' }, { position: 'RB2' }, { position: 'RB1' }];
  const sorted = sortPlayersByPositionRank(players);
  assert.deepEqual(
    sorted.map((p) => p.position),
    ['RB1', 'RB2', 'DST']
  );
});

test('describeRankingPeriod: names week and season', () => {
  assert.equal(describeRankingPeriod(2026, 1), 'Woche 1, Saison 2026');
});

test('describeRankingPeriod: returns empty string when season/week are missing (older snapshot)', () => {
  assert.equal(describeRankingPeriod(null, null), '');
  assert.equal(describeRankingPeriod(undefined, undefined), '');
});

test('describeFreshness: missing/invalid timestamp is handled gracefully (BR-003)', () => {
  assert.deepEqual(describeFreshness(null), { text: 'Aktualität unbekannt', stale: false });
  assert.deepEqual(describeFreshness('not-a-date'), { text: 'Aktualität unbekannt', stale: false });
});

// isWithinOperatingWindow reads local hours (the app assumes a
// Europe/Zurich browser), so "now" is built by setting the local hour
// directly rather than a fixed UTC instant - keeps these tests correct
// regardless of the timezone the test runner happens to be in.
function localTimeToday(hours) {
  const now = new Date();
  now.setHours(hours, 0, 0, 0);
  return now;
}

test('describeFreshness: within threshold and operating window is not stale', () => {
  const now = localTimeToday(16); // inside 07-23h window
  const generatedAt = new Date(now.getTime() - 10 * 60000).toISOString(); // 10 min old
  const result = describeFreshness(generatedAt, now);
  assert.equal(result.stale, false);
});

test('describeFreshness: older than 30min inside the operating window is stale', () => {
  const now = localTimeToday(16);
  const generatedAt = new Date(now.getTime() - 60 * 60000).toISOString(); // 60 min old
  const result = describeFreshness(generatedAt, now);
  assert.equal(result.stale, true);
  assert.match(result.text, /veraltet/);
});

test('describeFreshness: BR-002 old data outside the 07-23h operating window is not flagged stale', () => {
  const now = localTimeToday(3); // outside the window
  const generatedAt = new Date(now.getTime() - 6 * 60 * 60000).toISOString(); // several hours old
  const result = describeFreshness(generatedAt, now);
  assert.equal(result.stale, false);
});

test('describeMatchupRatingsFreshness: missing/invalid timestamp stays hidden (no warning, no error)', () => {
  assert.deepEqual(describeMatchupRatingsFreshness(null), { stale: false, text: '' });
  assert.deepEqual(describeMatchupRatingsFreshness('not-a-date'), { stale: false, text: '' });
});

test('describeMatchupRatingsFreshness: under the 1-day threshold is not stale', () => {
  const now = new Date('2026-08-28T12:00:00Z');
  const result = describeMatchupRatingsFreshness('2026-08-28T00:00:00Z', now); // 12h old
  assert.equal(result.stale, false);
});

test('describeMatchupRatingsFreshness: over the 1-day threshold is stale and mentions a date', () => {
  const now = new Date('2026-08-28T12:00:00Z');
  const result = describeMatchupRatingsFreshness('2026-08-26T12:00:00Z', now); // 2 days old
  assert.equal(result.stale, true);
  assert.match(result.text, /aktualisiert am \d{2}\.\d{2}\./);
});
