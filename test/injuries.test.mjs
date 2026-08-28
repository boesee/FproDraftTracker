import { test } from 'node:test';
import assert from 'node:assert/strict';

// injuries.mjs exits the process at import time if FANTASYPROS_API_KEY
// isn't set (same fail-fast pattern as fantasyProsRankings.mjs). Set it
// before a dynamic import - a static import would be hoisted above this
// assignment and run first.
process.env.FANTASYPROS_API_KEY = 'test-key';
const { mapInjuries } = await import('../scripts/lib/injuries.mjs');

test('mapInjuries: maps a normal entry keyed by player_id', () => {
  const injuries = mapInjuries([
    { player_id: 15901, status: 'Doubtful', status_short: 'D', probability_of_playing: '0.15' },
  ]);
  assert.deepEqual(injuries[15901], { status: 'Doubtful', statusShort: 'D', probability: 15 });
});

test('mapInjuries: corrects the known "Questionable" -> status_short typo (API returns "O")', () => {
  const injuries = mapInjuries([
    { player_id: 1, status: 'Questionable', status_short: 'O', probability_of_playing: '0.88797' },
  ]);
  assert.equal(injuries[1].statusShort, 'Q');
  assert.equal(injuries[1].probability, 89);
});

test('mapInjuries: trusts status_short as-is for any other status', () => {
  const injuries = mapInjuries([{ player_id: 1, status: 'Doubtful', status_short: 'D', probability_of_playing: '0.2' }]);
  assert.equal(injuries[1].statusShort, 'D');
});

test('mapInjuries: suppresses probability for "Out" - redundant, already implied by the status', () => {
  const injuries = mapInjuries([
    { player_id: 1, status: 'Out', status_short: 'O', probability_of_playing: '0.02' },
  ]);
  assert.equal(injuries[1].probability, null);
});

test('mapInjuries: suppresses probability for "Injured Reserve"', () => {
  const injuries = mapInjuries([
    { player_id: 1, status: 'Injured Reserve', status_short: 'IR', probability_of_playing: '0' },
  ]);
  assert.equal(injuries[1].probability, null);
});

test('mapInjuries: an unparseable probability becomes null instead of NaN', () => {
  const injuries = mapInjuries([
    { player_id: 1, status: 'Questionable', status_short: 'Q', probability_of_playing: 'n/a' },
  ]);
  assert.equal(injuries[1].probability, null);
});

test('mapInjuries: entries without a player_id or status are skipped', () => {
  const injuries = mapInjuries([
    { status: 'Questionable' },
    { player_id: 2 },
    { player_id: 3, status: 'Questionable', status_short: 'O', probability_of_playing: '0.5' },
  ]);
  assert.deepEqual(Object.keys(injuries), ['3']);
});

test('mapInjuries: missing/empty input yields an empty map', () => {
  assert.deepEqual(mapInjuries(undefined), {});
  assert.deepEqual(mapInjuries([]), {});
});
