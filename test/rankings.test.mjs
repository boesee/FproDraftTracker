import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  sortPlayersByRank,
  extractPositionRank,
  sortPlayersByPositionRank,
  sortPlayersByMyTeam,
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

test('sortPlayersByMyTeam: groups by position (QB, RB, WR, TE order), not by rank', () => {
  const players = [
    { name: 'wr1', position: 'WR12', rank: 5, draftInfo: { pick_no: 3 } },
    { name: 'qb1', position: 'QB4', rank: 40, draftInfo: { pick_no: 1 } },
    { name: 'rb1', position: 'RB8', rank: 20, draftInfo: { pick_no: 2 } },
    { name: 'te1', position: 'TE2', rank: 60, draftInfo: { pick_no: 4 } },
  ];
  const sorted = sortPlayersByMyTeam(players);
  assert.deepEqual(
    sorted.map((p) => p.name),
    ['qb1', 'rb1', 'wr1', 'te1']
  );
});

test('sortPlayersByMyTeam: within a position group, sorts by draft pick order', () => {
  const players = [
    { name: 'rb-picked-3rd', position: 'RB20', draftInfo: { pick_no: 30 } },
    { name: 'rb-picked-1st', position: 'RB1', draftInfo: { pick_no: 2 } },
    { name: 'rb-picked-2nd', position: 'RB10', draftInfo: { pick_no: 15 } },
  ];
  const sorted = sortPlayersByMyTeam(players);
  assert.deepEqual(
    sorted.map((p) => p.name),
    ['rb-picked-1st', 'rb-picked-2nd', 'rb-picked-3rd']
  );
});

test('sortPlayersByMyTeam: positions outside QB/RB/WR/TE (e.g. DST) sort last', () => {
  const players = [
    { name: 'dst', position: 'DST1', draftInfo: { pick_no: 1 } },
    { name: 'qb', position: 'QB1', draftInfo: { pick_no: 2 } },
  ];
  const sorted = sortPlayersByMyTeam(players);
  assert.deepEqual(
    sorted.map((p) => p.name),
    ['qb', 'dst']
  );
});

test('sortPlayersByMyTeam: a missing pick_no (no draftInfo) sorts last within its group, not first', () => {
  const players = [
    { name: 'no-draftinfo', position: 'RB5', draftInfo: null },
    { name: 'picked-later', position: 'RB1', draftInfo: { pick_no: 50 } },
  ];
  const sorted = sortPlayersByMyTeam(players);
  assert.deepEqual(
    sorted.map((p) => p.name),
    ['picked-later', 'no-draftinfo']
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
  // Staleness is surfaced visually via the `.stale` CSS class (js/main.js),
  // not by appending wording to the text itself.
  assert.match(result.text, /^Rankings zuletzt aktualisiert am \d{2}\.\d{2}\.\d{4} um \d{2}:\d{2} Uhr$/);
});

test('describeFreshness: BR-002 old data outside the 07-23h operating window is not flagged stale', () => {
  const now = localTimeToday(3); // outside the window
  const generatedAt = new Date(now.getTime() - 6 * 60 * 60000).toISOString(); // several hours old
  const result = describeFreshness(generatedAt, now);
  assert.equal(result.stale, false);
});

test('describeMatchupRatingsFreshness: missing/invalid timestamp is handled gracefully, not flagged stale', () => {
  assert.deepEqual(describeMatchupRatingsFreshness(null), {
    stale: false,
    text: 'Matchup-Ratings: Aktualität unbekannt',
  });
  assert.deepEqual(describeMatchupRatingsFreshness('not-a-date'), {
    stale: false,
    text: 'Matchup-Ratings: Aktualität unbekannt',
  });
});

test('describeMatchupRatingsFreshness: under the 1-day threshold is not stale', () => {
  const now = new Date('2026-08-28T12:00:00Z');
  const result = describeMatchupRatingsFreshness('2026-08-28T00:00:00Z', now); // 12h old
  assert.equal(result.stale, false);
});

test('describeMatchupRatingsFreshness: over the 1-day threshold is stale and mentions a full date', () => {
  const now = new Date('2026-08-28T12:00:00Z');
  const result = describeMatchupRatingsFreshness('2026-08-26T12:00:00Z', now); // 2 days old
  assert.equal(result.stale, true);
  assert.match(result.text, /^Matchup-Ratings zuletzt aktualisiert am \d{2}\.\d{2}\.\d{4} um \d{2}:\d{2} Uhr$/);
});
