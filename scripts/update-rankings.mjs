#!/usr/bin/env node
// Fetches the current NFL rankings from the FantasyPros API and writes them
// as a RANKINGS_SNAPSHOT JSON file (see docs/entity_model.md) for the
// static frontend. Implements UC-007 (docs/use_cases/UC-007-*.md).
//
// This file only orchestrates; the actual logic lives in scripts/lib/:
// - config.mjs: human-maintained config/app.json (season/week overrides)
// - nflSchedule.mjs: auto-computed season/week
// - fantasyProsRankings.mjs: the FantasyPros fetch + rank/position mapping
// - espnOpponents.mjs: opponent enrichment via ESPN's scoreboard
// - matchupRatings.mjs: the manually maintained matchup-rating snapshot

import { writeFile } from 'node:fs/promises';
import { loadConfig } from './lib/config.mjs';
import { currentNflSeason, currentNflWeek } from './lib/nflSchedule.mjs';
import { fetchRankings, mapPlayers } from './lib/fantasyProsRankings.mjs';
import { fetchOpponents } from './lib/espnOpponents.mjs';
import { loadMatchupRatings } from './lib/matchupRatings.mjs';

const OUTPUT_PATH = new URL('../data/rankings.json', import.meta.url);

// Safety net per UC-007 AF-2: refuse to commit an implausible or empty
// result instead of overwriting the last known-good snapshot. Note: most
// of the raw response is expected to map to null here and get filtered
// out - DST, kickers, and deep bench players legitimately have no "OP"
// (Superflex) rank at all, so a low players/rawPlayers ratio is normal,
// not a sign of a broken response. A real full-season pull maps a few
// hundred players; MIN_PLAYERS is set well below that as a floor against
// a near-empty or malformed response.
const MIN_PLAYERS = 100;

async function main() {
  const config = await loadConfig();
  const season = config.season ?? currentNflSeason();
  const week = config.week ?? currentNflWeek();

  const [data, opponents, matchupRatings] = await Promise.all([
    fetchRankings(season, week),
    fetchOpponents(season, week),
    loadMatchupRatings(),
  ]);
  const rawPlayers = data.players ?? [];
  const players = mapPlayers(rawPlayers, opponents, matchupRatings);

  if (players.length < MIN_PLAYERS) {
    console.error(
      `Refusing to write rankings: only ${players.length}/${rawPlayers.length} players mapped successfully (minimum ${MIN_PLAYERS}).`
    );
    if (rawPlayers[0]) {
      console.error('Sample raw player:', JSON.stringify(rawPlayers[0], null, 2));
    }
    process.exit(1);
  }

  const snapshot = {
    generatedAt: new Date().toISOString(),
    source: 'fantasypros-api',
    players,
  };

  await writeFile(OUTPUT_PATH, JSON.stringify(snapshot, null, 2) + '\n');
  console.log(`Wrote ${players.length} players to ${OUTPUT_PATH.pathname}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
