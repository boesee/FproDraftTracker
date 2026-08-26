import { Logger } from './logger.js';
import { loadRankingsSnapshot, sortPlayersByRank, describeFreshness } from './rankings.js';
import { fetchDraftPicks, matchDraftedPlayers } from './sleeperDraft.js';
import { applyFilters } from './filters.js';
import { computeStats } from './stats.js';
import { createMessageCenter } from './messages.js';

const logger = new Logger(false);

const bannerEl = document.getElementById('rankingsBanner');
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
const statAvailableEl = document.getElementById('statAvailable');
const statDraftedEl = document.getElementById('statDrafted');

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
      createCell(player.rank),
      createCell(player.player_name),
      createCell(player.position),
      createCell(player.team),
      createCell(player.opponent ?? '-'),
      createCell(player.drafted ? 'Gedraftet' : 'Verfügbar')
    );
    tbodyEl.appendChild(row);
  }
}

// UC-004 main flow (BR-001: always the full list, not the filtered one).
function renderStats() {
  const { total, available, drafted } = computeStats(allPlayers);
  statTotalEl.textContent = total;
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

// UC-002 main flow.
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

  try {
    const picks = await fetchDraftPicks(draftId);
    const { players, matched } = matchDraftedPlayers(allPlayers, picks);
    allPlayers = players;
    renderAll();
    messages.showSuccess(`${picks.length} Picks geladen, ${matched} Spieler zugeordnet.`);
  } catch (error) {
    // UC-002 AF-2: invalid/unknown draft ID or unexpected response.
    logger.error('Draft-Abgleich fehlgeschlagen', error);
    messages.showError('Draft-ID ungültig oder keine Daten gefunden.');
  }
}

async function init() {
  try {
    const snapshot = await loadRankingsSnapshot();
    renderBanner(snapshot.generatedAt);
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

  loadDraftBtn.addEventListener('click', loadDraft);
  clearFiltersBtn.addEventListener('click', clearFilters);
  positionFilter.addEventListener('change', renderTable);
  rankFilter.addEventListener('input', renderTable);
  draftedFilter.addEventListener('change', renderTable);
  playerSearch.addEventListener('input', renderTable);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
