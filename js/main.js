import { Logger } from './logger.js';
import { loadConfig } from './config.js';
import {
  loadRankingsSnapshot,
  sortPlayersByRank,
  sortPlayersByPositionRank,
  sortPlayersByMyTeam,
  extractPositionRank,
  describeFreshness,
  describeMatchupRatingsFreshness,
  describeRankingPeriod,
} from './rankings.js';
import { fetchDraftPicks, matchDraftedPlayers } from './sleeperDraft.js';
import { applyFilters } from './filters.js';
import { computeStats } from './stats.js';
import { createMessageCenter } from './messages.js';
import { initThemeToggle } from './theme.js';

const logger = new Logger(false);

const bannerEl = document.getElementById('rankingsBanner');
const rankingPeriodInfoEl = document.getElementById('rankingPeriodInfo');
const matchupRatingsBannerEl = document.getElementById('matchupRatingsBanner');
const rankingsErrorEl = document.getElementById('rankingsError');
const sectionEl = document.getElementById('playersSection');
const tableEl = document.getElementById('playersTable');
const tbodyEl = document.getElementById('playersTableBody');

const draftIdInput = document.getElementById('draftId');
const loadDraftBtn = document.getElementById('loadDraftBtn');

const pillButtons = document.querySelectorAll('#positionPills .pill');
const myTeamPill = document.querySelector('#positionPills .pill[data-position="MYTEAM"]');
const draftedFilter = document.getElementById('draftedFilter');
const playerSearch = document.getElementById('playerSearch');

const statTotalEl = document.getElementById('statTotal');
const statMatchedEl = document.getElementById('statMatched');
const statRosFallbackEl = document.getElementById('statRosFallback');
const statAvailableEl = document.getElementById('statAvailable');
const statDraftedEl = document.getElementById('statDrafted');

const rankEstimateNoteEl = document.getElementById('rankEstimateNote');

const messages = createMessageCenter(
  document.getElementById('syncError'),
  document.getElementById('syncSuccess')
);

let allPlayers = [];
// Availability only means anything once picks have been matched (UC-002) -
// before that, every player is trivially "Verfügbar", which confused a
// tester. Gates the Status column and the Draft-Status filter until then.
let draftSynced = false;
// '' = Overall (Superflex), or 'QB'/'RB'/'WR'/'FLEX'/'MYTEAM' - selected
// via the pills-wrap nav (replaces the old Position dropdown filter).
// QB/RB/WR switch both the filter AND the displayed/sorted ranking to
// that position's own rank (see getDisplayRank, sortPlayersByPositionRank);
// FLEX still shows/sorts by the overall rank, since there's no separate
// FLEX-specific ranking bucket in the FantasyPros data - it's the overall
// ranking restricted to RB/WR/TE, same as the old FLEX filter option.
// MYTEAM (see updateDraftDependentUI) filters to the configured Sleeper
// user's own picks (js/filters.js BR-007) and sorts by position group
// then draft pick order (sortPlayersByMyTeam), not by rank at all.
let activePosition = '';
// Sleeper user_id from config/app.json's sleeperUserId (see init()) - null
// if not configured. Identifies "my" picks via picked_by (BR-007);
// roster_id isn't used since it's reassigned every week in this league.
let myUserId = null;

function createCell(text) {
  const td = document.createElement('td');
  td.textContent = text;
  return td;
}

// Colors an injury tag by severity; anything not in this map (an
// unanticipated status) falls back to a neutral grey rather than being
// silently unstyled.
const INJURY_STATUS_CLASSES = {
  Q: 'injury-questionable',
  D: 'injury-doubtful',
  O: 'injury-out',
  IR: 'injury-ir',
};

// FantasyPros injuries API enrichment (scripts/lib/injuries.mjs). Shown as
// a short colored tag right after the player name; the probability is
// only in the tooltip, not the tag itself, to keep the table compact -
// and it's omitted entirely for "Out"/"Injured Reserve" (see
// resolveProbability, injuries.mjs), where it would just be redundant.
function createInjuryTag(player) {
  const tag = document.createElement('span');
  const colorClass = INJURY_STATUS_CLASSES[player.injuryStatusShort] ?? 'injury-other';
  tag.className = `injury-tag ${colorClass}`;
  tag.textContent = player.injuryStatusShort;
  tag.title =
    player.injuryProbability != null
      ? `${player.injuryStatus} – ${player.injuryProbability}% Spielwahrscheinlichkeit`
      : player.injuryStatus;
  return tag;
}

function createPlayerCell(player) {
  const td = document.createElement('td');
  td.textContent = player.player_name;
  if (player.injuryStatusShort) {
    td.appendChild(createInjuryTag(player));
  }
  return td;
}

const POSITION_RANKED_PILLS = ['QB', 'RB', 'WR'];

// On a QB/RB/WR pill, the "#" column shows that position's own rank
// (e.g. QB1, QB2, ...) instead of the overall Superflex rank - matches
// FantasyPros' own pill behavior. Falls back to the overall rank if a
// positional rank can't be parsed (shouldn't normally happen, since
// applyFilters already restricts to matching players).
function getDisplayRank(player) {
  if (POSITION_RANKED_PILLS.includes(activePosition)) {
    return extractPositionRank(player.position) ?? player.rank;
  }
  return player.rank;
}

// Marks a rank derived from the ROS-PPR fallback (see
// scripts/update-rankings.mjs, resolveScoringBucket) visibly, since it's on
// a different scale than a week-specific rank - a bare number next to
// regular ranks would misleadingly suggest direct comparability. Applies
// regardless of which rank is displayed (getDisplayRank), since the
// positional rank comes from the same resolved scoring bucket.
function createRankCell(player) {
  const td = document.createElement('td');
  const displayRank = getDisplayRank(player);
  if (player.rankIsEstimated) {
    td.textContent = `${displayRank}*`;
    td.title = 'Rang basiert auf Rest-of-Season-Daten, da für diese Woche keine Daten vorliegen.';
    td.classList.add('rank-estimated');
  } else {
    td.textContent = displayRank;
  }
  return td;
}

// "Verfügbar"/"Gedraftet" is the single widest column on a narrow screen
// (e.g. iPhone 15, 393px) after the rank/player columns, which are already
// as tight as they can get. Renders both a full-text label (shown on wider
// screens) and a compact colored dot (shown below 480px, see style.css);
// the accessible name always comes from the cell's aria-label, independent
// of which one is visually hidden.
function createStatusCell(player) {
  const td = document.createElement('td');
  td.className = 'status-column';
  const label = player.drafted ? 'Gedraftet' : 'Verfügbar';
  td.setAttribute('aria-label', label);

  const full = document.createElement('span');
  full.className = 'status-full';
  full.textContent = label;
  full.setAttribute('aria-hidden', 'true');

  const dot = document.createElement('span');
  dot.className = `status-dot ${player.drafted ? 'status-dot-drafted' : 'status-dot-available'}`;
  dot.textContent = '●';
  dot.setAttribute('aria-hidden', 'true');

  td.append(full, dot);
  return td;
}

const MATCHUP_STAR_COUNT = 5;

// FantasyPros' matchup-favorability rating (0-5), from the manually
// maintained config/matchup-ratings.json (see
// scripts/lib/matchupRatings.mjs, loadMatchupRatings). Rounded to the
// nearest whole star, e.g. 2.7 -> 3 filled + 2 empty stars.
function createMatchupCell(matchupRating) {
  const td = document.createElement('td');
  if (matchupRating === null || matchupRating === undefined) {
    td.textContent = '-';
    return td;
  }

  const filled = Math.max(0, Math.min(MATCHUP_STAR_COUNT, Math.round(matchupRating)));
  const empty = MATCHUP_STAR_COUNT - filled;

  const full = document.createElement('span');
  full.className = 'matchup-full';

  const filledSpan = document.createElement('span');
  filledSpan.className = 'matchup-star-filled';
  filledSpan.textContent = '★'.repeat(filled);

  const emptySpan = document.createElement('span');
  emptySpan.className = 'matchup-star-empty';
  emptySpan.textContent = '★'.repeat(empty);

  full.append(filledSpan, emptySpan);

  // Five individual star glyphs don't fit a phone screen (e.g. iPhone 15)
  // alongside the other six columns; below 480px this compact "★4" badge
  // replaces them (see style.css) while the full row's tooltip still gives
  // the exact rating.
  const compact = document.createElement('span');
  compact.className = 'matchup-compact';
  compact.textContent = `★${filled}`;

  td.append(full, compact);
  td.title = `Matchup-Rating: ${matchupRating}`;
  return td;
}

function getFilters() {
  return {
    position: activePosition,
    myUserId,
    draftStatus: draftedFilter.value,
    search: playerSearch.value,
  };
}

const PLAYER_TABLE_COLUMN_COUNT = 7;

// Hides the Status column (table + CSS class, see style.css) until a draft
// has actually been synced - before that every player is trivially
// "Verfügbar", which is confusing rather than informative. Also gates the
// Draft-Status filter, since filtering by drafted/available means nothing
// yet either - and the "Mein Team" pill, which depends on the same draft
// data plus a configured sleeperUserId (config/app.json).
function updateDraftDependentUI() {
  tableEl.classList.toggle('draft-not-synced', !draftSynced);
  draftedFilter.disabled = !draftSynced;
  if (!draftSynced) draftedFilter.value = '';

  if (myTeamPill) {
    const myTeamAvailable = draftSynced && myUserId;
    myTeamPill.disabled = !myTeamAvailable;
    myTeamPill.title = myTeamAvailable
      ? ''
      : 'Erst nach dem Laden der Draft-Daten verfügbar' +
        (myUserId ? '' : ' (sleeperUserId fehlt in config/app.json)');
  }
}

// UC-001 main flow, step 3 / UC-003 main flow.
function renderTable() {
  updateDraftDependentUI();
  const sortFn =
    activePosition === 'MYTEAM'
      ? sortPlayersByMyTeam
      : POSITION_RANKED_PILLS.includes(activePosition)
        ? sortPlayersByPositionRank
        : sortPlayersByRank;
  const filtered = applyFilters(sortFn(allPlayers), getFilters());
  tbodyEl.innerHTML = '';

  if (filtered.length === 0) {
    const row = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = draftSynced ? PLAYER_TABLE_COLUMN_COUNT : PLAYER_TABLE_COLUMN_COUNT - 1;
    td.className = 'empty-state';
    td.textContent = 'Keine Spieler entsprechen den aktuellen Filtern.';
    row.appendChild(td);
    tbodyEl.appendChild(row);
    rankEstimateNoteEl.hidden = true;
    return;
  }

  for (const player of filtered) {
    const row = document.createElement('tr');
    if (player.drafted) row.classList.add('drafted-row');
    row.append(
      createRankCell(player),
      createPlayerCell(player),
      createCell(player.position),
      createCell(player.team),
      createCell(player.opponent ?? '-'),
      createMatchupCell(player.matchupRating),
      createStatusCell(player)
    );
    tbodyEl.appendChild(row);
  }
  rankEstimateNoteEl.hidden = !filtered.some((player) => player.rankIsEstimated);
}

// UC-004 main flow (BR-001: always the full list, not the filtered one).
function renderStats() {
  const { total, available, drafted, matched, rosFallback } = computeStats(allPlayers);
  statTotalEl.textContent = total;
  statMatchedEl.textContent = matched;
  statRosFallbackEl.textContent = rosFallback;
  statAvailableEl.textContent = available;
  statDraftedEl.textContent = drafted;
}

function renderAll() {
  renderTable();
  renderStats();
}

// UC-001 main flow, step 4 / UC-006.
function renderBanner(generatedAt) {
  const { text, stale } = describeFreshness(generatedAt);
  bannerEl.textContent = text;
  bannerEl.classList.toggle('stale', stale);
  bannerEl.hidden = false;
}

// Always shown, same as renderBanner - only the orange warning styling
// (.stale) depends on config/matchup-ratings.json's last commit being
// older than the weekly refresh cadence (see describeMatchupRatingsFreshness).
function renderMatchupRatingsBanner(matchupRatingsUpdatedAt) {
  const { text, stale } = describeMatchupRatingsFreshness(matchupRatingsUpdatedAt);
  matchupRatingsBannerEl.textContent = text;
  matchupRatingsBannerEl.classList.toggle('stale', stale);
  matchupRatingsBannerEl.hidden = false;
}

// UC-008 transparency: the Ranking/Scoring selects (currently a single
// option each - "Wochen-Ranking"/"PPR" - are the only ranking type/scoring
// format the pipeline actually produces today; more options land here as
// the pipeline grows to support them, e.g. Dynasty/ROS rankings or
// Half-PPR scoring) say *what kind* of ranking this is; this fills in
// *which* week/season it resolves to, since "Weekly" alone doesn't say
// that. Left empty (not an error state) if season/week are missing - an
// older snapshot from before those fields existed.
function renderRankingPeriodInfo(season, week) {
  rankingPeriodInfoEl.textContent = describeRankingPeriod(season, week);
}

// pills-wrap: switches which ranking is shown (Overall/Superflex vs. a
// specific position's own ranking - see getDisplayRank/sortPlayersByRank
// vs. sortPlayersByPositionRank) and doubles as the position filter. The
// active/inactive look comes from toggling Pico's own default-vs-outline
// button variants (see style.css, .pill) rather than a custom color.
function setActivePosition(position) {
  activePosition = position;
  pillButtons.forEach((btn) => {
    btn.classList.toggle('outline', btn.dataset.position !== position);
    btn.classList.toggle('secondary', btn.dataset.position !== position);
  });
  renderTable();
}

// UC-001 AF-1: no rankings file available.
function showRankingsError(message) {
  rankingsErrorEl.textContent = message;
  rankingsErrorEl.hidden = false;
  bannerEl.hidden = true;
  sectionEl.hidden = true;
}

// UC-002 main flow. Only ever runs from an explicit "Draft-Daten laden"
// click (see init()) - there is no automatic sync.
async function loadDraft() {
  const draftId = draftIdInput.value.trim();
  if (!draftId) {
    messages.showError('Bitte geben Sie eine gültige Draft-ID ein.');
    return;
  }
  // UC-002 AF-1: rankings not loaded yet.
  if (allPlayers.length === 0) {
    messages.showError('Bitte zuerst die Rankings laden.');
    return;
  }

  // Sleeper's response time varies; without a busy state a slow fetch looks
  // like the click didn't register, inviting a double-click (harmless, but
  // confusing) instead of just waiting.
  const originalLabel = loadDraftBtn.textContent;
  loadDraftBtn.disabled = true;
  loadDraftBtn.textContent = 'Lädt…';

  try {
    const picks = await fetchDraftPicks(draftId);
    const { players, matched, unmatchedPicks } = matchDraftedPlayers(allPlayers, picks);
    allPlayers = players;
    draftSynced = true;
    renderAll();
    messages.showSuccess(`${picks.length} Picks geladen, ${matched} Spieler zugeordnet.`);
    // UC-002 AF-3: surface unmatched picks in the console for quick
    // diagnosis, instead of having to manually diff 100+ picks by hand.
    if (unmatchedPicks.length > 0) {
      const names = unmatchedPicks.map((pick) => `${pick.metadata.first_name} ${pick.metadata.last_name}`);
      console.warn(`Nicht zugeordnete Sleeper-Picks (${names.length}):`, names);
    }
  } catch (error) {
    // UC-002 AF-2: invalid/unknown draft ID or unexpected response.
    logger.error('Draft-Abgleich fehlgeschlagen', error);
    messages.showError('Draft-ID ungültig oder keine Daten gefunden.');
  } finally {
    loadDraftBtn.disabled = false;
    loadDraftBtn.textContent = originalLabel;
  }
}

async function init() {
  initThemeToggle(document.getElementById('themeToggle'));

  const config = await loadConfig();
  myUserId = config.sleeperUserId ?? null;

  try {
    const snapshot = await loadRankingsSnapshot();
    renderBanner(snapshot.generatedAt);
    renderRankingPeriodInfo(snapshot.season, snapshot.week);
    renderMatchupRatingsBanner(snapshot.matchupRatingsUpdatedAt);
    allPlayers = (snapshot.players ?? []).map((player) => ({
      ...player,
      drafted: false,
      draftInfo: null,
    }));
    renderAll();
    rankingsErrorEl.hidden = true;
    sectionEl.hidden = false;

    // Pre-fill from config/app.json's draftIds (keyed by week - a
    // different weekly-redraft league has its own Sleeper draft each
    // week), so a recurring draft doesn't need the Draft-ID typed in
    // every time - but never sync automatically (see loadDraft). Keyed
    // by the loaded snapshot's own week, not a separately-computed one,
    // so the pre-filled draft always matches the rankings actually shown.
    const draftId = config.draftIds?.[snapshot.week];
    if (draftId) {
      draftIdInput.value = draftId;
    }
  } catch (error) {
    logger.error('Rankings konnten nicht geladen werden', error);
    showRankingsError('Aktuell sind keine Rankings verfügbar.');
    return;
  }

  loadDraftBtn.addEventListener('click', loadDraft);
  pillButtons.forEach((btn) => btn.addEventListener('click', () => setActivePosition(btn.dataset.position)));
  draftedFilter.addEventListener('change', renderTable);
  playerSearch.addEventListener('input', renderTable);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
