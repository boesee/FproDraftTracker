import { test } from 'node:test';
import assert from 'node:assert/strict';
import { currentNflSeason, currentNflWeek } from '../scripts/lib/nflSchedule.mjs';

test('currentNflSeason: January belongs to the previous year\'s season', () => {
  assert.equal(currentNflSeason(new Date(Date.UTC(2026, 0, 15))), 2025);
});

test('currentNflSeason: February still belongs to the previous year\'s season', () => {
  assert.equal(currentNflSeason(new Date(Date.UTC(2026, 1, 28))), 2025);
});

test('currentNflSeason: March onward belongs to the upcoming season', () => {
  assert.equal(currentNflSeason(new Date(Date.UTC(2026, 2, 1))), 2026);
});

test('currentNflSeason: mid-season (November) belongs to that year\'s season', () => {
  assert.equal(currentNflSeason(new Date(Date.UTC(2026, 10, 15))), 2026);
});

test('currentNflWeek: before Week 1\'s Tuesday is clamped to 1, not 0', () => {
  // 2026-08-28 is well before Labor Day/Week 1 kickoff - typical draft season.
  assert.equal(currentNflWeek(new Date(Date.UTC(2026, 7, 28))), 1);
});

test('currentNflWeek: on Week 1\'s Thursday kickoff is week 1', () => {
  // Labor Day 2026 is Mon Sep 7; Week 1 Thursday is Sep 10.
  assert.equal(currentNflWeek(new Date(Date.UTC(2026, 8, 10))), 1);
});

test('currentNflWeek: the following Tuesday rolls over to week 2', () => {
  // Week 1 Tuesday is Sep 8; Week 2 starts the Tuesday after, Sep 15.
  assert.equal(currentNflWeek(new Date(Date.UTC(2026, 8, 15))), 2);
});

test('currentNflWeek: the Monday just before rollover is still week 1', () => {
  assert.equal(currentNflWeek(new Date(Date.UTC(2026, 8, 14))), 1);
});

test('currentNflWeek: late in the season is clamped to 18', () => {
  assert.equal(currentNflWeek(new Date(Date.UTC(2027, 1, 1))), 18);
});
