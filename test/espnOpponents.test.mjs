import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fetchOpponents } from '../scripts/lib/espnOpponents.mjs';

function espnScoreboard(events) {
  return { events };
}

function competitorEvent(homeAbbr, awayAbbr) {
  return {
    competitions: [
      {
        competitors: [
          { team: { abbreviation: homeAbbr }, homeAway: 'home' },
          { team: { abbreviation: awayAbbr }, homeAway: 'away' },
        ],
      },
    ],
  };
}

async function withMockedFetch(response, fn) {
  const originalFetch = global.fetch;
  global.fetch = async () => response;
  try {
    await fn();
  } finally {
    global.fetch = originalFetch;
  }
}

test('fetchOpponents: builds "vs"/"at" labels for both sides of a matchup', async () => {
  await withMockedFetch(
    { ok: true, json: async () => espnScoreboard([competitorEvent('KC', 'BUF')]) },
    async () => {
      const opponents = await fetchOpponents(2026, 1);
      assert.equal(opponents.KC, 'vs BUF');
      assert.equal(opponents.BUF, 'at KC');
    }
  );
});

test('fetchOpponents: translates ESPN team abbreviations that differ from FantasyPros (JAX/WSH)', async () => {
  await withMockedFetch(
    { ok: true, json: async () => espnScoreboard([competitorEvent('JAX', 'WSH')]) },
    async () => {
      const opponents = await fetchOpponents(2026, 1);
      assert.equal(opponents.JAC, 'vs WAS');
      assert.equal(opponents.WAS, 'at JAC');
      assert.equal(opponents.JAX, undefined);
      assert.equal(opponents.WSH, undefined);
    }
  );
});

test('fetchOpponents: an event without exactly 2 competitors is skipped', async () => {
  const malformedEvent = { competitions: [{ competitors: [{ team: { abbreviation: 'KC' }, homeAway: 'home' }] }] };
  await withMockedFetch({ ok: true, json: async () => espnScoreboard([malformedEvent]) }, async () => {
    const opponents = await fetchOpponents(2026, 1);
    assert.deepEqual(opponents, {});
  });
});

test('fetchOpponents: no events at all yields an empty map', async () => {
  await withMockedFetch({ ok: true, json: async () => espnScoreboard([]) }, async () => {
    assert.deepEqual(await fetchOpponents(2026, 1), {});
  });
});

test('fetchOpponents: a non-OK response is caught and yields an empty map, not a thrown error', async () => {
  await withMockedFetch({ ok: false, status: 503 }, async () => {
    assert.deepEqual(await fetchOpponents(2026, 1), {});
  });
});

test('fetchOpponents: a network failure is caught and yields an empty map', async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => {
    throw new Error('network down');
  };
  try {
    assert.deepEqual(await fetchOpponents(2026, 1), {});
  } finally {
    global.fetch = originalFetch;
  }
});
