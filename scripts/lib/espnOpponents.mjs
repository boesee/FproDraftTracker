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
export async function fetchOpponents(season, week) {
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
