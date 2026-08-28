import { decodeHtmlEntities } from './htmlEntities.mjs';

const API_KEY = process.env.FANTASYPROS_API_KEY;
if (!API_KEY) {
  console.error('FANTASYPROS_API_KEY is not set.');
  process.exit(1);
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

export async function fetchRankings(season, week) {
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

export function mapPlayers(rawPlayers, opponents, matchupRatings, injuries = {}) {
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

      const injury = injuries[p.id] ?? null;

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
        matchupRating: matchupRatings[String(p.id)] ?? null,
        injuryStatus: injury?.status ?? null,
        injuryStatusShort: injury?.statusShort ?? null,
        injuryProbability: injury?.probability ?? null,
      };
    })
    .filter((p) => p && p.player_name && p.rank !== null)
    .sort((a, b) => a.rank - b.rank);
}
