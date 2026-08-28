import { test } from 'node:test';
import assert from 'node:assert/strict';

// fantasyProsRankings.mjs exits the process at import time if
// FANTASYPROS_API_KEY isn't set (a deliberate fail-fast for the real
// pipeline). Set it before a dynamic import - a static import would be
// hoisted above this assignment and run first.
process.env.FANTASYPROS_API_KEY = 'test-key';
const { mapPlayers } = await import('../scripts/lib/fantasyProsRankings.mjs');

function rawPlayer(overrides = {}) {
  return {
    id: 1,
    player_name: 'Josh Allen',
    first_name: 'Josh',
    last_name: 'Allen',
    position_id: 'QB',
    team_id: 'BUF',
    rank: { ECR: { PPR: { OP: 6, QB: 2 } } },
    ...overrides,
  };
}

test('mapPlayers: maps a normal player using the primary PPR/OP bucket', () => {
  const [player] = mapPlayers([rawPlayer()], {}, {});
  assert.equal(player.rank, 6);
  assert.equal(player.rankIsEstimated, false);
  assert.equal(player.position, 'QB2');
  assert.equal(player.player_name, 'Josh Allen');
});

test('mapPlayers: falls back to ROS-PPR/OP when the weekly PPR bucket is entirely missing', () => {
  const raw = rawPlayer({
    id: 2,
    player_name: 'Zach Charbonnet',
    position_id: 'RB',
    rank: { ECR: { 'ROS-PPR': { OP: 45, RB: 18 } } },
  });
  const [player] = mapPlayers([raw], {}, {});
  assert.equal(player.rank, 45);
  assert.equal(player.rankIsEstimated, true);
  assert.equal(player.position, 'RB18');
});

test('mapPlayers: excludes a player with no OP rank in either PPR or ROS-PPR (Dynasty is not a fallback)', () => {
  const raw = rawPlayer({ id: 3, rank: { ECR: { DYN: { OP: 99 } } } });
  const players = mapPlayers([raw], {}, {});
  assert.equal(players.length, 0);
});

test('mapPlayers: excludes a player with no player_name', () => {
  const raw = rawPlayer({ player_name: '' });
  const players = mapPlayers([raw], {}, {});
  assert.equal(players.length, 0);
});

test('mapPlayers: decodes HTML-entity-encoded names (Ja&#39;Marr Chase bug)', () => {
  const raw = rawPlayer({ player_name: "Ja&#39;Marr Chase", first_name: 'Ja&#39;Marr', last_name: 'Chase' });
  const [player] = mapPlayers([raw], {}, {});
  assert.equal(player.player_name, "Ja'Marr Chase");
  assert.equal(player.first_name, "Ja'Marr");
});

test('mapPlayers: enriches opponent from the ESPN-derived map, keyed by team_id', () => {
  const [player] = mapPlayers([rawPlayer({ team_id: 'BUF' })], { BUF: 'at HOU' }, {});
  assert.equal(player.opponent, 'at HOU');
});

test('mapPlayers: opponent is null when the team has no scheduled game in the map', () => {
  const [player] = mapPlayers([rawPlayer({ team_id: 'BUF' })], {}, {});
  assert.equal(player.opponent, null);
});

test('mapPlayers: enriches matchupRating keyed by string player id', () => {
  const [player] = mapPlayers([rawPlayer({ id: 42 })], {}, { 42: 3.5 });
  assert.equal(player.matchupRating, 3.5);
});

test('mapPlayers: matchupRating is null when the player id has no rating', () => {
  const [player] = mapPlayers([rawPlayer({ id: 42 })], {}, {});
  assert.equal(player.matchupRating, null);
});

test('mapPlayers: enriches injury fields keyed by numeric player id', () => {
  const injuries = { 42: { status: 'Questionable', statusShort: 'Q', probability: 89 } };
  const [player] = mapPlayers([rawPlayer({ id: 42 })], {}, {}, injuries);
  assert.equal(player.injuryStatus, 'Questionable');
  assert.equal(player.injuryStatusShort, 'Q');
  assert.equal(player.injuryProbability, 89);
});

test('mapPlayers: injury fields are null for a player with no injury entry (the common case)', () => {
  const [player] = mapPlayers([rawPlayer({ id: 42 })], {}, {}, {});
  assert.equal(player.injuryStatus, null);
  assert.equal(player.injuryStatusShort, null);
  assert.equal(player.injuryProbability, null);
});

test('mapPlayers: injury fields are null when the injuries map is omitted entirely', () => {
  const [player] = mapPlayers([rawPlayer({ id: 42 })], {}, {});
  assert.equal(player.injuryStatus, null);
});

test('mapPlayers: result is sorted ascending by rank regardless of input order', () => {
  const players = mapPlayers(
    [
      rawPlayer({ id: 1, rank: { ECR: { PPR: { OP: 20 } } } }),
      rawPlayer({ id: 2, rank: { ECR: { PPR: { OP: 5 } } } }),
      rawPlayer({ id: 3, rank: { ECR: { PPR: { OP: 12 } } } }),
    ],
    {},
    {}
  );
  assert.deepEqual(
    players.map((p) => p.rank),
    [5, 12, 20]
  );
});

test('mapPlayers: regression - 607 total players split 579 real / 28 ROS-fallback does not collide in output length', () => {
  const rawPlayers = [
    ...Array.from({ length: 579 }, (_, i) =>
      rawPlayer({ id: i + 1, player_name: `Real Player ${i + 1}`, rank: { ECR: { PPR: { OP: i + 1 } } } })
    ),
    ...Array.from({ length: 28 }, (_, i) =>
      rawPlayer({
        id: 1000 + i,
        player_name: `Fallback Player ${i + 1}`,
        rank: { ECR: { 'ROS-PPR': { OP: 150 + i } } },
      })
    ),
  ];
  const players = mapPlayers(rawPlayers, {}, {});
  assert.equal(players.length, 607);
  assert.equal(players.filter((p) => p.rankIsEstimated).length, 28);
  assert.equal(players.filter((p) => !p.rankIsEstimated).length, 579);
});
