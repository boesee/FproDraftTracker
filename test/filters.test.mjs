import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyFilters } from '../js/filters.js';

const players = [
  { player_name: 'Jalen Hurts', position: 'QB4', team: 'PHI', rank: 8, drafted: false, opponent: 'vs WAS' },
  { player_name: 'Christian McCaffrey', position: 'RB3', team: 'SF', rank: 14, drafted: true, opponent: 'at SEA' },
  { player_name: "Ja'Marr Chase", position: 'WR1', team: 'CIN', rank: 2, drafted: false, opponent: 'vs TB' },
  { player_name: 'Travis Kelce', position: 'TE1', team: 'KC', rank: 40, drafted: false, opponent: null },
];

function names(result) {
  return result.map((p) => p.player_name);
}

function noFilters(overrides = {}) {
  return { position: '', maxRank: '', draftStatus: '', search: '', ...overrides };
}

test('applyFilters: no active filters returns everyone', () => {
  assert.deepEqual(names(applyFilters(players, noFilters())), names(players));
});

test('applyFilters: position filter matches exact position prefix', () => {
  const result = applyFilters(players, noFilters({ position: 'QB' }));
  assert.deepEqual(names(result), ['Jalen Hurts']);
});

test('applyFilters: BR-003 FLEX includes RB/WR/TE but not QB', () => {
  const result = applyFilters(players, noFilters({ position: 'FLEX' }));
  assert.deepEqual(names(result).sort(), ['Christian McCaffrey', "Ja'Marr Chase", 'Travis Kelce'].sort());
});

test('applyFilters: maxRank excludes players ranked below the threshold', () => {
  const result = applyFilters(players, noFilters({ maxRank: '10' }));
  assert.deepEqual(names(result).sort(), ['Jalen Hurts', "Ja'Marr Chase"].sort());
});

test('applyFilters: BR-005 a non-numeric maxRank is ignored, not treated as 0', () => {
  const result = applyFilters(players, noFilters({ maxRank: 'abc' }));
  assert.deepEqual(names(result), names(players));
});

test('applyFilters: draftStatus available/drafted', () => {
  assert.deepEqual(names(applyFilters(players, noFilters({ draftStatus: 'drafted' }))), ['Christian McCaffrey']);
  assert.deepEqual(
    names(applyFilters(players, noFilters({ draftStatus: 'available' }))).sort(),
    ['Jalen Hurts', "Ja'Marr Chase", 'Travis Kelce'].sort()
  );
});

test('applyFilters: BR-001 free-text search matches any column, case-insensitive', () => {
  assert.deepEqual(names(applyFilters(players, noFilters({ search: 'HURTS' }))), ['Jalen Hurts']);
  assert.deepEqual(names(applyFilters(players, noFilters({ search: 'sea' }))), ['Christian McCaffrey']);
});

test('applyFilters: BR-002 column:value targets one field only', () => {
  const result = applyFilters(players, noFilters({ search: 'team:phi' }));
  assert.deepEqual(names(result), ['Jalen Hurts']);
});

test('applyFilters: BR-002 an unknown column matches nothing (no fallback to free-text)', () => {
  const result = applyFilters(players, noFilters({ search: 'nosuchcolumn:phi' }));
  assert.deepEqual(result, []);
});

test('applyFilters: column:value on a null field value does not throw and matches nothing for a non-empty value', () => {
  const result = applyFilters(players, noFilters({ search: 'opponent:sea' }));
  assert.deepEqual(names(result), ['Christian McCaffrey']);
});

test('applyFilters: BR-004 multiple active filters combine with AND', () => {
  const result = applyFilters(players, { position: 'WR', maxRank: '5', draftStatus: 'available', search: 'chase' });
  assert.deepEqual(names(result), ["Ja'Marr Chase"]);
});
