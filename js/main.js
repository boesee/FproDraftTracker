import { Logger } from './logger.js';
import { loadRankingsSnapshot, sortPlayersByRank, describeFreshness } from './rankings.js';

const logger = new Logger(false);

const bannerEl = document.getElementById('rankingsBanner');
const errorEl = document.getElementById('rankingsError');
const sectionEl = document.getElementById('playersSection');
const tbodyEl = document.getElementById('playersTableBody');

function createCell(text) {
  const td = document.createElement('td');
  td.textContent = text;
  return td;
}

// UC-001 main flow, step 3.
function renderPlayers(players) {
  tbodyEl.innerHTML = '';
  for (const player of sortPlayersByRank(players)) {
    const row = document.createElement('tr');
    row.append(
      createCell(player.rank),
      createCell(player.player_name),
      createCell(player.position),
      createCell(player.team),
      createCell(player.opponent ?? '-')
    );
    tbodyEl.appendChild(row);
  }
}

// UC-001 main flow, step 4 / UC-006.
function renderBanner(generatedAt) {
  const { text, stale } = describeFreshness(generatedAt);
  bannerEl.textContent = text;
  bannerEl.classList.toggle('stale', stale);
  bannerEl.hidden = false;
}

// UC-001 AF-1: no rankings file available.
function showError(message) {
  errorEl.textContent = message;
  errorEl.hidden = false;
  bannerEl.hidden = true;
  sectionEl.hidden = true;
}

async function init() {
  try {
    const snapshot = await loadRankingsSnapshot();
    renderBanner(snapshot.generatedAt);
    renderPlayers(snapshot.players ?? []);
    errorEl.hidden = true;
    sectionEl.hidden = false;
  } catch (error) {
    logger.error('Rankings konnten nicht geladen werden', error);
    showError('Aktuell sind keine Rankings verfügbar.');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
