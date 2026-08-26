#!/usr/bin/env node
// Fetches the current NFL rankings from the FantasyPros API and writes them
// as a RANKINGS_SNAPSHOT JSON file (see docs/entity_model.md) for the
// static frontend. Implements UC-007 (docs/use_cases/UC-007-*.md).
//
// Scoring/format choice: Half-PPR, Superflex ("OP") for the overall rank,
// confirmed against a real sample response. `player.rank.ECR` nests by
// scoring format (STD/PPR/HALF/ROS-*/DYN) and then by position group
// (per-position/FLX/OP/ALL) - see SCORING/OVERALL_POSITION below.

import { writeFile } from 'node:fs/promises';

const API_KEY = process.env.FANTASYPROS_API_KEY;
if (!API_KEY) {
  console.error('FANTASYPROS_API_KEY is not set.');
  process.exit(1);
}

const OUTPUT_PATH = new URL('../data/rankings.json', import.meta.url);

// Half-PPR, week-specific scoring; "OP" is the Superflex-style overall
// rank across all offensive positions (see docs/architecture.md).
const SCORING = 'HALF';
const OVERALL_POSITION = 'OP';

function currentNflSeason(now = new Date()) {
  // An NFL season labeled "YYYY" runs roughly Aug (YYYY) - Feb (YYYY+1).
  // From March onward, treat the current year as the upcoming season.
  const month = now.getUTCMonth(); // 0 = January
  return month >= 2 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
}

// Computes the current NFL week (0 = preseason, 1-18 = regular season) so
// the `week` query param never needs manual, weekly upkeep. Week N runs
// from the Tuesday before its Thursday kickoff through the following
// Monday (the common "week rolls over on Tuesday" convention); anything
// before Week 1's Tuesday is preseason (0), anything past Week 18 is
// clamped to 18 (late-season/offseason).
function currentNflWeek(now = new Date()) {
  const season = currentNflSeason(now);

  // Labor Day = first Monday of September; the season's Week 1 kicks off
  // the following Thursday.
  const sept1 = new Date(Date.UTC(season, 8, 1));
  const daysToMonday = (8 - sept1.getUTCDay()) % 7;
  const laborDay = Date.UTC(season, 8, 1 + daysToMonday);
  const week1Thursday = laborDay + 3 * 24 * 60 * 60 * 1000;
  const week1Tuesday = week1Thursday - 2 * 24 * 60 * 60 * 1000;

  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const diff = now.getTime() - week1Tuesday;
  if (diff < 0) return 0;
  return Math.min(Math.floor(diff / msPerWeek) + 1, 18);
}

async function fetchRankings() {
  const season = currentNflSeason();
  const week = currentNflWeek();
  const url =
    `https://api.fantasypros.com/public/v2/json/nfl/${season}/rankings` +
    `?week=${week}&range=true`;

  const response = await fetch(url, {
    headers: { 'x-api-key': API_KEY },
  });

  if (!response.ok) {
    throw new Error(`FantasyPros API returned ${response.status} ${response.statusText}`);
  }

  return response.json();
}

function extractOverallRank(player) {
  const value = player.rank?.ECR?.[SCORING]?.[OVERALL_POSITION];
  return typeof value === 'number' ? value : null;
}

// Combines the position with its position-specific rank (e.g. "RB" + 81 =>
// "RB81"), matching the display format of the previous product's `pos_rank`.
function extractPositionLabel(player) {
  const positionId = player.position_id ?? '';
  const positionalRank = player.rank?.ECR?.[SCORING]?.[positionId];
  return typeof positionalRank === 'number' ? `${positionId}${positionalRank}` : positionId;
}

function mapPlayers(rawPlayers) {
  return rawPlayers
    .map((p) => ({
      rank: extractOverallRank(p),
      player_name: p.player_name ?? '',
      first_name: p.first_name ?? '',
      last_name: p.last_name ?? '',
      position: extractPositionLabel(p),
      team: p.team_id ?? '',
      // Not provided by this endpoint in the samples seen so far; kept as an
      // optional field per docs/entity_model.md until confirmed otherwise.
      opponent: p.opponent ?? null,
    }))
    .filter((p) => p.player_name && p.rank !== null)
    .sort((a, b) => a.rank - b.rank);
}

async function main() {
  const data = await fetchRankings();
  const rawPlayers = data.players ?? [];
  const players = mapPlayers(rawPlayers);

  // Safety net per UC-007 AF-2: refuse to commit an implausible or empty
  // result instead of overwriting the last known-good snapshot.
  const validShare = rawPlayers.length ? players.length / rawPlayers.length : 0;
  if (players.length < 50 || validShare < 0.5) {
    console.error(
      `Refusing to write rankings: only ${players.length}/${rawPlayers.length} players mapped successfully.`
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
