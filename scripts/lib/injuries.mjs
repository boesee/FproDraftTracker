const API_KEY = process.env.FANTASYPROS_API_KEY;
if (!API_KEY) {
  console.error('FANTASYPROS_API_KEY is not set.');
  process.exit(1);
}

// FantasyPros' own status_short is unreliable for at least one value -
// "Questionable" comes back as "O" instead of "Q" (confirmed against a
// real API response) - so it's corrected here rather than trusted as-is.
// Only known-bad values are overridden; anything else still passes
// through the API's own status_short unchanged.
const STATUS_SHORT_OVERRIDES = {
  Questionable: 'Q',
};

// "Out" and "Injured Reserve" already imply the player won't play -
// showing a near-zero playing probability alongside them is redundant,
// not informative.
const STATUSES_WITHOUT_PROBABILITY = new Set(['Out', 'Injured Reserve']);

function resolveStatusShort(status, statusShort) {
  return STATUS_SHORT_OVERRIDES[status] ?? statusShort;
}

// probability_of_playing arrives as a decimal string (e.g. "0.88797");
// displayed as a whole-number percentage (89).
function resolveProbability(status, probabilityOfPlaying) {
  if (STATUSES_WITHOUT_PROBABILITY.has(status)) return null;
  const value = parseFloat(probabilityOfPlaying);
  return Number.isNaN(value) ? null : Math.round(value * 100);
}

// Pure mapping step, split out from fetchInjuries so it's testable
// without touching the network. Returns a map of FantasyPros
// player_id -> { status, statusShort, probability }.
export function mapInjuries(rawInjuries) {
  const injuries = {};
  for (const entry of rawInjuries ?? []) {
    if (entry?.player_id == null || !entry.status) continue;
    injuries[entry.player_id] = {
      status: entry.status,
      statusShort: resolveStatusShort(entry.status, entry.status_short),
      probability: resolveProbability(entry.status, entry.probability_of_playing),
    };
  }
  return injuries;
}

// Injury status is a nice-to-have enrichment, not critical like the
// rankings themselves - a fetch failure here logs and returns an empty
// map (every player shows no injury tag) instead of failing the whole
// pipeline run, matching fetchOpponents/loadMatchupRatings.
export async function fetchInjuries(season, week) {
  const url = `https://api.fantasypros.com/public/v2/json/nfl/injuries?year=${season}&week=${week}`;

  let data;
  try {
    const response = await fetch(url, { headers: { 'x-api-key': API_KEY } });
    if (!response.ok) {
      throw new Error(`FantasyPros injuries API returned ${response.status} ${response.statusText}`);
    }
    data = await response.json();
  } catch (err) {
    console.error('Could not fetch injuries from FantasyPros, continuing without them:', err.message);
    return {};
  }

  return mapInjuries(data.injuries);
}
