import { Logger } from './logger.js';
import { loadConfig } from './config.js';
import {
  loadRankingsSnapshot,
  sortPlayersByRank,
  describeFreshness,
  describeMatchupRatingsFreshness,
} from './rankings.js';
import { fetchDraftPicks, matchDraftedPlayers } from './sleeperDraft.js';
import { applyFilters } from './filters.js';
import { computeStats } from './stats.js';
import { createMessageCenter } from './messages.js';

const logger = new Logger(false);

const bannerEl = document.getElementById('rankingsBanner');
const matchupRatingsBannerEl = document.getElementById('matchupRatingsBanner');
const rankingsErrorEl = document.getElementById('rankingsError');
const sectionEl = document.getElementById('playersSection');
const tbodyEl = document.getElementById('playersTableBody');

const draftIdInput = document.getElementById('draftId');
const loadDraftBtn = document.getElementById('loadDraftBtn');

const positionFilter = document.getElementById('positionFilter');
const rankFilter = document.getElementById('rankFilter');
const draftedFilter = document.getElementById('draftedFilter');
const playerSearch = document.getElementById('playerSearch');
const clearFiltersBtn = document.getElementById('clearFiltersBtn');

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

function createCell(text) {
  const td = document.createElement('td');
  td.textContent = text;
  return td;
}

// Marks a rank derived from the ROS-PPR fallback (see
// scripts/update-rankings.mjs, resolveScoringBucket) visibly, since it's on
// a different scale than a week-specific rank - a bare number next to
// regular ranks would misleadingly suggest direct comparability.
function createRankCell(player) {
  const td = document.createElement('td');
  if (player.rankIsEstimated) {
    td.textContent = `${player.rank}*`;
    td.title = 'Rang basiert auf Rest-of-Season-Daten, da für diese Woche keine Daten vorliegen.';
    td.classList.add('rank-estimated');
  } else {
    td.textContent = player.rank;
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
    position: positionFilter.value,
    maxRank: rankFilter.value,
    draftStatus: draftedFilter.value,
    search: playerSearch.value,
  };
}

// UC-001 main flow, step 3 / UC-003 main flow.
function renderTable() {
  const filtered = applyFilters(sortPlayersByRank(allPlayers), getFilters());
  tbodyEl.innerHTML = '';
  for (const player of filtered) {
    const row = document.createElement('tr');
    if (player.drafted) row.classList.add('drafted-row');
    row.append(
      createRankCell(player),
      createCell(player.player_name),
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

// Surfaces a warning only when config/matchup-ratings.json's last commit is
// older than the weekly refresh cadence (see describeMatchupRatingsFreshness)
// - stays hidden otherwise so it doesn't clutter the UI when ratings are
// current or simply weren't set up at all.
function renderMatchupRatingsBanner(matchupRatingsUpdatedAt) {
  const { text, stale } = describeMatchupRatingsFreshness(matchupRatingsUpdatedAt);
  matchupRatingsBannerEl.textContent = text;
  matchupRatingsBannerEl.hidden = !stale;
}

// UC-001 AF-1: no rankings file available.
function showRankingsError(message) {
  rankingsErrorEl.textContent = message;
  rankingsErrorEl.hidden = false;
  bannerEl.hidden = true;
  sectionEl.hidden = true;
}

// UC-003 AF-4.
function clearFilters() {
  positionFilter.value = '';
  rankFilter.value = '';
  draftedFilter.value = '';
  playerSearch.value = '';
  renderTable();
}

// UC-002 main flow. `silent` suppresses the UC-005 success/error toasts for
// the automatic config/app.json sync on page load (see init()), so the
// banner only appears when the Fantasy-Football-Manager explicitly triggers
// a sync via the "Draft-Daten laden" button.
async function loadDraft({ silent = false } = {}) {
  const draftId = draftIdInput.value.trim();
  if (!draftId) {
    if (!silent) messages.showError('Bitte geben Sie eine gültige Draft-ID ein.');
    return;
  }
  // UC-002 AF-1: rankings not loaded yet.
  if (allPlayers.length === 0) {
    if (!silent) messages.showError('Bitte zuerst die Rankings laden.');
    return;
  }

  try {
    const picks = await fetchDraftPicks(draftId);
    const { players, matched, unmatchedPicks } = matchDraftedPlayers(allPlayers, picks);
    allPlayers = players;
    renderAll();
    if (!silent) messages.showSuccess(`${picks.length} Picks geladen, ${matched} Spieler zugeordnet.`);
    // UC-002 AF-3: surface unmatched picks in the console for quick
    // diagnosis, instead of having to manually diff 100+ picks by hand.
    if (unmatchedPicks.length > 0) {
      const names = unmatchedPicks.map((pick) => `${pick.metadata.first_name} ${pick.metadata.last_name}`);
      console.warn(`Nicht zugeordnete Sleeper-Picks (${names.length}):`, names);
    }
  } catch (error) {
    // UC-002 AF-2: invalid/unknown draft ID or unexpected response.
    logger.error('Draft-Abgleich fehlgeschlagen', error);
    if (!silent) messages.showError('Draft-ID ungültig oder keine Daten gefunden.');
  }
}

async function init() {
  const config = await loadConfig();

  try {
    const snapshot = await loadRankingsSnapshot();
    renderBanner(snapshot.generatedAt);
    renderMatchupRatingsBanner(snapshot.matchupRatingsUpdatedAt);
    allPlayers = (snapshot.players ?? []).map((player) => ({
      ...player,
      drafted: false,
      draftInfo: null,
    }));
    renderAll();
    rankingsErrorEl.hidden = true;
    sectionEl.hidden = false;
  } catch (error) {
    logger.error('Rankings konnten nicht geladen werden', error);
    showRankingsError('Aktuell sind keine Rankings verfügbar.');
    return;
  }

  loadDraftBtn.addEventListener('click', () => loadDraft());
  clearFiltersBtn.addEventListener('click', clearFilters);
  positionFilter.addEventListener('change', renderTable);
  rankFilter.addEventListener('input', renderTable);
  draftedFilter.addEventListener('change', renderTable);
  playerSearch.addEventListener('input', renderTable);

  // Pre-fill and auto-sync from config/app.json, so a recurring draft
  // doesn't need the Draft-ID typed in and "Draft-Daten laden" clicked
  // every time.
  if (config.draftId) {
    draftIdInput.value = config.draftId;
    loadDraft({ silent: true });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
