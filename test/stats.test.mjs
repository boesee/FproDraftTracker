import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeStats } from '../js/stats.js';

function player(overrides = {}) {
  return { drafted: false, rankIsEstimated: false, ...overrides };
}

test('computeStats: empty list', () => {
  assert.deepEqual(computeStats([]), {
    total: 0,
    available: 0,
    drafted: 0,
    matched: 0,
    rosFallback: 0,
  });
});

test('computeStats: BR-002 available = total - drafted', () => {
  const players = [player({ drafted: true }), player({ drafted: false }), player({ drafted: false })];
  const stats = computeStats(players);
  assert.equal(stats.total, 3);
  assert.equal(stats.drafted, 1);
  assert.equal(stats.available, 2);
});

test('computeStats: BR-003 matched/rosFallback split on rankIsEstimated, matched + rosFallback = total', () => {
  const players = [
    player({ rankIsEstimated: false }),
    player({ rankIsEstimated: false }),
    player({ rankIsEstimated: true }),
  ];
  const stats = computeStats(players);
  assert.equal(stats.total, 3);
  assert.equal(stats.matched, 2);
  assert.equal(stats.rosFallback, 1);
  assert.equal(stats.matched + stats.rosFallback, stats.total);
});

test('computeStats: matches the real-world 607/579/28 split (rank-collision bug regression)', () => {
  const players = [
    ...Array.from({ length: 579 }, () => player({ rankIsEstimated: false })),
    ...Array.from({ length: 28 }, () => player({ rankIsEstimated: true })),
  ];
  const stats = computeStats(players);
  assert.equal(stats.total, 607);
  assert.equal(stats.matched, 579);
  assert.equal(stats.rosFallback, 28);
});
