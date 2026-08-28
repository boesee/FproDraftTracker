import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchDraftedPlayers, fetchDraftPicks } from '../js/sleeperDraft.js';

function player(first_name, last_name, overrides = {}) {
  return { first_name, last_name, player_name: `${first_name} ${last_name}`, ...overrides };
}

function pick(first_name, last_name) {
  return { metadata: { first_name, last_name } };
}

test('matchDraftedPlayers: exact first+last name match', () => {
  const { players, matched } = matchDraftedPlayers([player('Josh', 'Allen')], [pick('Josh', 'Allen')]);
  assert.equal(matched, 1);
  assert.equal(players[0].drafted, true);
});

test('matchDraftedPlayers: BR-002 case/whitespace/punctuation-insensitive', () => {
  const { players, matched } = matchDraftedPlayers(
    [player("Ja'Marr", 'Chase')],
    [pick('  ja marr ', 'CHASE')]
  );
  assert.equal(matched, 1);
  assert.equal(players[0].drafted, true);
});

test('matchDraftedPlayers: BR-003 generational suffix stripped ("Marvin Harrison Jr." vs "Marvin Harrison")', () => {
  const { players, matched } = matchDraftedPlayers(
    [player('Marvin', 'Harrison Jr.')],
    [pick('Marvin', 'Harrison')]
  );
  assert.equal(matched, 1);
  assert.equal(players[0].drafted, true);
});

test('matchDraftedPlayers: BR-004 hyphenated last name matches space-separated variant', () => {
  const { players, matched } = matchDraftedPlayers(
    [player('Jaxon', 'Smith-Njigba')],
    [pick('Jaxon', 'Smith Njigba')]
  );
  assert.equal(matched, 1);
  assert.equal(players[0].drafted, true);
});

test('matchDraftedPlayers: BR-005 no fuzzy matching beyond BR-001..BR-004 - unmatched stays available', () => {
  const { players, matched, unmatchedPicks } = matchDraftedPlayers(
    [player('Jayden', 'Higgins')],
    [pick('Jaydon', 'Higgins')] // typo'd first name, not covered by any normalization rule
  );
  assert.equal(matched, 0);
  assert.equal(players[0].drafted, false);
  assert.equal(players[0].draftInfo, null);
  assert.equal(unmatchedPicks.length, 1);
});

test('matchDraftedPlayers: a pick without name metadata is ignored, not reported as unmatched', () => {
  const { unmatchedPicks } = matchDraftedPlayers([player('Josh', 'Allen')], [{ metadata: {} }]);
  assert.equal(unmatchedPicks.length, 0);
});

test('matchDraftedPlayers: reports every leftover Sleeper pick that matched no player', () => {
  const { unmatchedPicks } = matchDraftedPlayers(
    [player('Josh', 'Allen')],
    [pick('Josh', 'Allen'), pick('Zach', 'Charbonnet')]
  );
  assert.equal(unmatchedPicks.length, 1);
  assert.equal(unmatchedPicks[0].metadata.last_name, 'Charbonnet');
});

test('fetchDraftPicks: throws a descriptive error on a non-OK response', async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => ({ ok: false, status: 404 });
  try {
    await assert.rejects(() => fetchDraftPicks('bad-id'), /Status 404/);
  } finally {
    global.fetch = originalFetch;
  }
});

test('fetchDraftPicks: throws on an unexpected (non-array) response body', async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => ({ ok: true, json: async () => ({ not: 'an array' }) });
  try {
    await assert.rejects(() => fetchDraftPicks('some-id'), /Unerwartetes Antwortformat/);
  } finally {
    global.fetch = originalFetch;
  }
});

test('fetchDraftPicks: returns the parsed picks array on success', async () => {
  const originalFetch = global.fetch;
  const fakePicks = [{ metadata: { first_name: 'Josh', last_name: 'Allen' } }];
  global.fetch = async () => ({ ok: true, json: async () => fakePicks });
  try {
    const picks = await fetchDraftPicks('some-id');
    assert.deepEqual(picks, fakePicks);
  } finally {
    global.fetch = originalFetch;
  }
});
