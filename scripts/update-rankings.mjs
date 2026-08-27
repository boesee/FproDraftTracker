#!/usr/bin/env node
// Fetches the current NFL rankings from the FantasyPros API and writes them
// as a RANKINGS_SNAPSHOT JSON file (see docs/entity_model.md) for the
// static frontend. Implements UC-007 (docs/use_cases/UC-007-*.md).
//
// Scoring/format choice: Half-PPR, Superflex ("OP") for the overall rank,
// confirmed against a real sample response. `player.rank.ECR` nests by
// scoring format (STD/PPR/HALF/ROS-*/DYN) and then by position group
// (per-position/FLX/OP/ALL) - see SCORING/OVERALL_POSITION below.

import { readFile, writeFile } from 'node:fs/promises';

const API_KEY = process.env.FANTASYPROS_API_KEY;
if (!API_KEY) {
  console.error('FANTASYPROS_API_KEY is not set.');
  process.exit(1);
}

const OUTPUT_PATH = new URL('../data/rankings.json', import.meta.url);
const CONFIG_PATH = new URL('../config.json', import.meta.url);

// Reads the human-maintained config.json at the repo root. `season`/`week`
// there override the auto-computed values below when set (non-null); a
// missing file or unset fields fall back to the automatic computation, so
// config.json is an optional override, not a requirement.
async function loadConfig() {
  try {
    return JSON.parse(await readFile(CONFIG_PATH, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return {};
    throw err;
  }
}

// Full PPR; "OP" is the Superflex-style overall rank across all offensive
// positions, including QB (see docs/architecture.md). Week-specific PPR is
// preferred; ROS-PPR is a fallback for players who have no week-specific
// bucket at all this week (common for backups/deep bench players - it's
// not that they lack an OP rank specifically, they lack STD/PPR/HALF
// entirely). Dynasty ("DYN") is deliberately not a further fallback: it
// reflects long-term keeper/rookie value, not redraft relevance, so using
// it here would show misleading numbers for players who aren't otherwise
// ranked at all this season.
const PRIMARY_SCORING = 'PPR';
const FALLBACK_SCORING = 'ROS-PPR';
const OVERALL_POSITION = 'OP';

// Picks whichever scoring bucket actually has a usable OP value for this
// player, or null if neither does (player is excluded, see mapPlayers).
function resolveScoringBucket(player) {
  if (typeof player.rank?.ECR?.[PRIMARY_SCORING]?.[OVERALL_POSITION] === 'number') {
    return PRIMARY_SCORING;
  }
  if (typeof player.rank?.ECR?.[FALLBACK_SCORING]?.[OVERALL_POSITION] === 'number') {
    return FALLBACK_SCORING;
  }
  return null;
}

function currentNflSeason(now = new Date()) {
  // An NFL season labeled "YYYY" runs roughly Aug (YYYY) - Feb (YYYY+1).
  // From March onward, treat the current year as the upcoming season.
  const month = now.getUTCMonth(); // 0 = January
  return month >= 2 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
}

// Computes the current NFL week (1-18) so the `week` query param never
// needs manual, weekly upkeep. Week N runs from the Tuesday before its
// Thursday kickoff through the following Monday (the common "week rolls
// over on Tuesday" convention); anything before Week 1's Tuesday is
// clamped to 1 rather than treated as a separate "preseason" value, since
// drafts (and FantasyPros' Week 1 rankings) happen well before the actual
// Week 1 games. Anything past Week 18 is clamped to 18
// (late-season/offseason).
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
  const week = Math.floor(diff / msPerWeek) + 1;
  return Math.min(Math.max(week, 1), 18);
}

async function fetchRankings(season, week) {
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

// FantasyPros' public API has no schedule/matchup endpoint at all (checked
// against their full OpenAPI spec) - it's only ever been available via
// scraping their website, which this rebuild deliberately doesn't do. The
// opponent (without any favorability rating - that data simply isn't
// published anywhere we can use) comes from ESPN's public scoreboard
// instead. A couple of team abbreviations differ from FantasyPros' and are
// translated back, confirmed against a real response.
const ESPN_TO_FANTASYPROS_TEAM = {
  JAX: 'JAC',
  WSH: 'WAS',
};

function toFantasyProsTeamId(espnAbbreviation) {
  return ESPN_TO_FANTASYPROS_TEAM[espnAbbreviation] ?? espnAbbreviation;
}

// Returns a map of FantasyPros team_id -> opponent label ("vs XXX" at home,
// "at XXX" away). Opponent is a nice-to-have, not critical like the
// rankings themselves, so a fetch failure here logs and returns an empty
// map (every player's opponent falls back to null) instead of failing the
// whole run.
async function fetchOpponents(season, week) {
  const url =
    `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard` +
    `?week=${week}&seasontype=2&year=${season}`;

  let data;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`ESPN API returned ${response.status} ${response.statusText}`);
    }
    data = await response.json();
  } catch (err) {
    console.error('Could not fetch opponents from ESPN, continuing without them:', err.message);
    return {};
  }

  const opponents = {};
  for (const event of data.events ?? []) {
    const competitors = event.competitions?.[0]?.competitors ?? [];
    if (competitors.length !== 2) continue;
    const [a, b] = competitors;
    const teamA = toFantasyProsTeamId(a.team.abbreviation);
    const teamB = toFantasyProsTeamId(b.team.abbreviation);
    opponents[teamA] = a.homeAway === 'home' ? `vs ${teamB}` : `at ${teamB}`;
    opponents[teamB] = b.homeAway === 'home' ? `vs ${teamA}` : `at ${teamA}`;
  }
  return opponents;
}

const NAMED_HTML_ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

function decodeHtmlEntitiesOnce(value) {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity) => {
    if (entity[0] === '#') {
      const codePoint =
        entity[1] === 'x' || entity[1] === 'X' ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
      return Number.isNaN(codePoint) ? match : String.fromCodePoint(codePoint);
    }
    return NAMED_HTML_ENTITIES[entity.toLowerCase()] ?? match;
  });
}

// FantasyPros' player names come out of a CMS that HTML-encodes them (e.g.
// "Ja&#39;Marr Chase" instead of "Ja'Marr Chase"). Decode in a small loop
// (bounded) so this also recovers from an entity being encoded more than
// once, without looping forever on input that never stabilizes.
function decodeHtmlEntities(value) {
  if (typeof value !== 'string' || !value.includes('&')) return value;
  let result = value;
  for (let i = 0; i < 3; i += 1) {
    const decoded = decodeHtmlEntitiesOnce(result);
    if (decoded === result) break;
    result = decoded;
  }
  return result;
}

function extractOverallRank(player, scoring) {
  const value = player.rank?.ECR?.[scoring]?.[OVERALL_POSITION];
  return typeof value === 'number' ? value : null;
}

// Combines the position with its position-specific rank (e.g. "RB" + 81 =>
// "RB81"), matching the display format of the previous product's `pos_rank`.
function extractPositionLabel(player, scoring) {
  const positionId = player.position_id ?? '';
  const positionalRank = player.rank?.ECR?.[scoring]?.[positionId];
  return typeof positionalRank === 'number' ? `${positionId}${positionalRank}` : positionId;
}

function mapPlayers(rawPlayers, opponents) {
  return rawPlayers
    .map((p) => {
      const scoring = resolveScoringBucket(p);
      if (!scoring) return null; // no usable OP rank in PPR or ROS-PPR

      const rankIsEstimated = scoring === FALLBACK_SCORING;
      if (rankIsEstimated) {
        // Makes it possible to query this one player directly for
        // debugging (e.g. via the API's player id) without having to
        // grep the full response by name.
        console.log(`Fallback (${FALLBACK_SCORING}) used for id=${p.id} "${p.player_name}"`);
      }

      return {
        player_id: p.id ?? null,
        rank: extractOverallRank(p, scoring),
        rankIsEstimated,
        player_name: decodeHtmlEntities(p.player_name ?? ''),
        first_name: decodeHtmlEntities(p.first_name ?? ''),
        last_name: decodeHtmlEntities(p.last_name ?? ''),
        position: extractPositionLabel(p, scoring),
        team: p.team_id ?? '',
        opponent: opponents[p.team_id] ?? null,
      };
    })
    .filter((p) => p && p.player_name && p.rank !== null)
    .sort((a, b) => a.rank - b.rank);
}

async function main() {
  const config = await loadConfig();
  const season = config.season ?? currentNflSeason();
  const week = config.week ?? currentNflWeek();

  const [data, opponents] = await Promise.all([
    fetchRankings(season, week),
    fetchOpponents(season, week),
  ]);
  const rawPlayers = data.players ?? [];
  const players = mapPlayers(rawPlayers, opponents);

  // Safety net per UC-007 AF-2: refuse to commit an implausible or empty
  // result instead of overwriting the last known-good snapshot. Note: most
  // of the raw response is expected to map to null here and get filtered
  // out - DST, kickers, and deep bench players legitimately have no "OP"
  // (Superflex) rank at all, so a low players/rawPlayers ratio is normal,
  // not a sign of a broken response. A real full-season pull maps a few
  // hundred players; MIN_PLAYERS is set well below that as a floor against
  // a near-empty or malformed response.
  const MIN_PLAYERS = 100;
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
