#!/usr/bin/env node
// Fetches the current NFL rankings from the FantasyPros API and writes them
// as a RANKINGS_SNAPSHOT JSON file (see docs/entity_model.md) for the
// static frontend. Implements UC-007 (docs/use_cases/UC-007-*.md).
//
// NOTE: The exact shape of `player.rank` and the `scoring`/`position` query
// parameters below are a best-effort reading of the FantasyPros API docs,
// not yet verified against a real response. Run this workflow once via
// workflow_dispatch and check the Actions log / committed data/rankings.json
// after the first real run.

import { writeFile } from 'node:fs/promises';

const API_KEY = process.env.FANTASYPROS_API_KEY;
if (!API_KEY) {
  console.error('FANTASYPROS_API_KEY is not set.');
  process.exit(1);
}

const OUTPUT_PATH = new URL('../data/rankings.json', import.meta.url);

function currentNflSeason(now = new Date()) {
  // An NFL season labeled "YYYY" runs roughly Aug (YYYY) - Feb (YYYY+1).
  // From March onward, treat the current year as the upcoming season.
  const month = now.getUTCMonth(); // 0 = January
  return month >= 2 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
}

async function fetchRankings() {
  const season = currentNflSeason();
  const url =
    `https://api.fantasypros.com/public/v2/json/nfl/${season}/rankings` +
    `?week=0&range=true&scoring=PPR&position=OP`;

  const response = await fetch(url, {
    headers: { 'x-api-key': API_KEY },
  });

  if (!response.ok) {
    throw new Error(`FantasyPros API returned ${response.status} ${response.statusText}`);
  }

  return response.json();
}

function extractRank(player) {
  const ecr = player.rank?.ECR;
  return typeof ecr === 'number' ? ecr : null;
}

function mapPlayers(rawPlayers) {
  return rawPlayers
    .map((p) => ({
      rank: extractRank(p),
      player_name: p.player_name ?? '',
      first_name: p.first_name ?? '',
      last_name: p.last_name ?? '',
      position: p.position_id ?? '',
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
