// Fetches and interprets the RANKINGS_SNAPSHOT produced by UC-007 (see
// docs/entity_model.md). Implements UC-001 (rankings display, BR-001) and
// UC-006 (freshness banner, BR-001..BR-003).

const RANKINGS_URL = 'data/rankings.json';
const STALE_THRESHOLD_MINUTES = 30;
const OPERATING_WINDOW = { startHour: 7, endHour: 23 };
const MATCHUP_RATINGS_STALE_THRESHOLD_DAYS = 1;

export async function loadRankingsSnapshot() {
  const response = await fetch(RANKINGS_URL, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Rankings-Datei konnte nicht geladen werden (Status ${response.status})`);
  }
  return response.json();
}

// UC-001 BR-001: players are displayed sorted ascending by rank.
export function sortPlayersByRank(players) {
  return [...players].sort((a, b) => a.rank - b.rank);
}

// UC-006 BR-002: the staleness check only applies within the 07:00-23:00
// operating window (C-004) - the pipeline doesn't run outside it, so an
// older snapshot at night is expected, not stale.
function isWithinOperatingWindow(date) {
  const hours = date.getHours() + date.getMinutes() / 60;
  return hours >= OPERATING_WINDOW.startHour && hours <= OPERATING_WINDOW.endHour;
}

// UC-006 main flow + BR-001 (human-readable time) + BR-003 (missing/invalid
// timestamp handled gracefully).
export function describeFreshness(generatedAt, now = new Date()) {
  const generatedDate = generatedAt ? new Date(generatedAt) : null;
  if (!generatedDate || Number.isNaN(generatedDate.getTime())) {
    return { text: 'Aktualität unbekannt', stale: false };
  }

  const ageMinutes = (now.getTime() - generatedDate.getTime()) / 60000;
  const stale = ageMinutes > STALE_THRESHOLD_MINUTES && isWithinOperatingWindow(now);
  const time = generatedDate.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' });

  return {
    text: stale
      ? `Rankings zuletzt aktualisiert um ${time} Uhr (veraltet)`
      : `Rankings zuletzt aktualisiert um ${time} Uhr`,
    stale,
  };
}

// The manually maintained config/matchup-ratings.json carries no
// week/season tag of its own (see scripts/lib/matchupRatings.mjs) - it's a
// raw copy-paste of FantasyPros' advancedMetrics, refreshed by hand roughly
// once a week. Its freshness is derived from the file's last git commit
// date (matchupRatingsUpdatedAt in the snapshot) instead, and surfaced only
// when stale, so the UI doesn't flash a warning on every page load like
// UC-006's rankings banner does.
export function describeMatchupRatingsFreshness(updatedAt, now = new Date()) {
  const updatedDate = updatedAt ? new Date(updatedAt) : null;
  if (!updatedDate || Number.isNaN(updatedDate.getTime())) {
    return { stale: false, text: '' };
  }

  const ageDays = (now.getTime() - updatedDate.getTime()) / (24 * 60 * 60 * 1000);
  const stale = ageDays > MATCHUP_RATINGS_STALE_THRESHOLD_DAYS;
  const date = updatedDate.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit' });

  return {
    stale,
    text: `Matchup-Ratings zuletzt aktualisiert am ${date} – möglicherweise nicht mehr aktuell für diese Woche.`,
  };
}
