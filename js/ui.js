import { readJsonFile, parseCsvFile } from './fileUtils.js';
export class DraftUI {


    constructor(tracker, messages, logger) {
        // tracker ist die Instanz von FantasyDraftTracker
        this.tracker = tracker;
        this.messages = messages;
        this.logger = logger;
    }

    initUI() {
        document.getElementById('clearFilters').addEventListener('click', () => this.clearFilters());
        document.getElementById('positionFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('rankFilter').addEventListener('input', () => this.applyFilters());
        document.getElementById('draftedFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('playerSearch').addEventListener('input', () => this.applyFilters());

        // Im initUI oder Setup
        const loadJsonBtn = document.getElementById('loadJsonBtn');
        const jsonFileUpload = document.getElementById('jsonFileUpload');

        if (loadJsonBtn && jsonFileUpload) {
            loadJsonBtn.addEventListener('click', () => {
                jsonFileUpload.click();
            });

            jsonFileUpload.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const fileName = file.name.toLowerCase();
                const isCSV = fileName.endsWith('.csv');
                const isJSON = fileName.endsWith('.json');

                try {
                    let jsonData;
                    if (isJSON) {
                        jsonData = await readJsonFile(file, this.logger, this.message);
                    } else if (isCSV) {
                        jsonData = await parseCsvFile(file, this.logger, this.message);
                    } else {
                        this.messages.showError('Nur JSON oder CSV Dateien sind erlaubt.');
                        return;
                    }

                    const processResult = this.tracker.processJsonData(JSON.stringify(jsonData));
                    if (processResult === true) {
                        const numPlayers = Array.isArray(jsonData)
                            ? jsonData.length
                            : Array.isArray(jsonData.players)
                                ? jsonData.players.length
                                : 0;
                        this.messages.showSuccess(`${numPlayers} Spieler erfolgreich geladen.`);
                        this.clearFilters();
                    } else {
                        this.messages.showError("Fehler beim Verarbeiten der Daten: " + processResult.message);
                    }
                    this.applyFilters();
                } catch (err) {
                    this.messages.showError(`Fehler beim Verarbeiten der Datei: ${err.message}`);
                    this.logger.error('Fehler beim Laden der Datei', err);
                }
            });
        }

        // Draft laden
        const loadDraftBtn = document.getElementById('loadDraft');
        if (loadDraftBtn) {
            loadDraftBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const draftId = document.getElementById('draftId').value.trim();
                this.tracker.loadDraftData(draftId);
            });
        }

    }

    renderTable(filteredPlayers, allPlayers) {
        this.logger?.debug("Active columns:", this.getActiveColumns(allPlayers));
        this.logger?.debug("Example player row:", filteredPlayers[0]);
        if (!this.logger) {
            console.error("Logger in renderTable: undefined!");
        } else {
            this.logger.debug("Logger in renderTable: vorhanden");
        }
        const tbody = document.getElementById('playersTableBody');
        const thead = document.getElementById('playersTableHead');
        const section = document.getElementById('playersTableSection');
        tbody.innerHTML = '';
        if (thead) thead.innerHTML = '';

        // Blende Section aus, wenn keine Spieler geladen
        if (!allPlayers || allPlayers.length === 0) {
            if (section) section.style.display = 'none';
            return;
        }



        // Spalten dynamisch bestimmen
        const columns = this.getActiveColumns(allPlayers);

        // Tabelle nur ausblenden, wenn WIRKLICH keine Spieler da sind
        if (!filteredPlayers.length) {
            if (section) section.style.display = 'none';
            return;
        } else {
            if (section) section.style.display = '';
        }

        // Header dynamisch rendern
        let headerHtml = `
        <tr>
            <th class="rank-col">#</th>
            <th class="player-col">Spieler</th>
            <th class="pos-col">Pos</th>
            <th class="team-col">Team</th>
            <th class="opp-col">Gegner</th>
            ${columns.upside ? '<th class="rating-col">Upside</th>' : ''}
            ${columns.bust ? '<th class="rating-col">Bust</th>' : ''}
            ${columns.matchup ? '<th class="rating-col">Matchup</th>' : ''}
            ${columns.start_sit ? '<th class="stat-col">Start/Sit</th>' : ''}
            ${columns.proj_fpts ? '<th class="stat-col">Proj FPTS</th>' : ''}
            ${columns.avgDiff ? '<th class="stat-col">Diff</th>' : ''}
            ${columns.percentOver ? '<th class="stat-col">%Über</th>' : ''}
            ${columns.opportunity ? '<th class="stat-col">Opp%</th>' : ''}
            ${columns.efficiency ? '<th class="stat-col">Eff</th>' : ''}
            <th class="status-col">Status</th>
        </tr>
    `;
        if (thead) thead.innerHTML = headerHtml;

        // Spielerzeilen rendern
        filteredPlayers.forEach(player => {
            const row = document.createElement('tr');
            if (player.drafted) row.classList.add('drafted-row');
            let draftTooltip = '';
            if (player.draftInfo) {
                const draftedName = `${player.draftInfo.metadata.first_name} ${player.draftInfo.metadata.last_name}`;
                draftTooltip = `title="Pick #${player.draftInfo.pick_no} (Round ${player.draftInfo.round}) - ${draftedName}"`;
            }
            const upsideTooltip = `${player.upside || 0}/5 Sterne - ${this.getUpsideTooltip(player.upside || 0)}`;
            const bustTooltip = `${player.bust || 0}/5 Sterne - ${this.getBustTooltip(player.bust || 0)}`;
            const matchupTooltip = `${player.matchup || 0}/5 Sterne - ${this.getMatchupTooltip(player.matchup || 0)}`;

            row.innerHTML = `
            <td class="rank-col">${player.rank}</td>
            <td class="player-col">
                <span class="player-name" title="${player.player_name}">${player.player_name}</span>
            </td>
            <td class="pos-col">${player.position || '-'}</td>
            <td class="team-col">${player.team || '-'}</td>
            <td class="opp-col">${player.opponent || '-'}</td>
            ${columns.upside ? `<td class="rating-col"><span class="rating-display upside-stars" title="${upsideTooltip}">${this.renderStarRating(player.upside, 'upside')}</span></td>` : ''}
            ${columns.bust ? `<td class="rating-col"><span class="rating-display bust-stars" title="${bustTooltip}">${this.renderStarRating(player.bust, 'bust')}</span></td>` : ''}
            ${columns.matchup ? `<td class="rating-col"><span class="rating-display matchup-stars" title="${matchupTooltip}">${this.renderStarRating(player.matchup, 'matchup')}</span></td>` : ''}
            ${columns.start_sit ? `<td class="stat-col"><span class="compact-stat">${this.formatStatValue(player.start_sit)}</span></td>` : ''}
            ${columns.proj_fpts ? `<td class="stat-col"><span class="compact-stat">${this.formatStatValue(player.proj_fpts)}</span></td>` : ''}
            ${columns.avgDiff ? `<td class="stat-col"><span class="compact-stat">${this.formatStatValue(player.avgDiff)}</span></td>` : ''}
            ${columns.percentOver ? `<td class="stat-col"><span class="compact-stat">${this.formatStatValue(player.percentOver)}</span></td>` : ''}
            ${columns.opportunity ? `<td class="stat-col"><span class="compact-stat">${this.formatStatValue(player.opportunity)}</span></td>` : ''}
            ${columns.efficiency ? `<td class="stat-col"><span class="compact-stat">${this.formatStatValue(player.efficiency)}</span></td>` : ''}
            <td class="status-col">
                <span class="status-badge ${player.drafted ? 'status-drafted' : 'status-available'}" ${draftTooltip}>
                    ${player.drafted ? 'Drafted' : 'Available'}
                </span>
            </td>
        `;
            tbody.appendChild(row);
        });

    }

    renderEmptyCell(value) {
        if (!value || value === '-' || value === '') {
            return '<span class="no-rating" title="Keine Bewertung">-</span>';
        }
    }

    roundToStarRating(rating) {
        const value = parseFloat(rating) || 0;
        const base = Math.floor(value);
        const decimal = value - base;

        if (decimal > 0.75) {
            return base + 1;
        } else if (decimal > 0.25) {
            return base + 0.5;
        } else {
            return base;
        }
    }


    renderStarRating(rating, type = 'default') {
        const maxStars = 5;
        const rounded = this.roundToStarRating(rating);

        const fullStars = Math.floor(rounded);
        const hasHalfStar = (rounded - fullStars) === 0.5 ? 1 : 0;
        const emptyStars = maxStars - fullStars - hasHalfStar;

        const filledStar = '<i class="fa-solid fa-star"></i>';
        const halfStar = '<i class="fa-solid fa-star-half-stroke"></i>';
        const emptyStar = '<i class="fa-regular fa-star"></i>';

        if (rounded === 0) return this.renderEmptyCell();
        let html = '';
        html += `<span class="filled">${filledStar.repeat(fullStars)}</span>`;
        if (hasHalfStar) html += `<span class="filled">${halfStar}</span>`;
        html += `<span class="empty">${emptyStar.repeat(emptyStars)}</span>`;
        return html;
    }


    renderCompactRating(rating) {
        if (!rating || rating === 0) return '-';
        const filled = '●'.repeat(rating);
        const empty = '○'.repeat(5 - rating);
        return filled + empty;
    }

    renderCompactStars(rating) {
        if (!rating || rating === 0) return '-';
        return '★'.repeat(rating);
    }

    formatStatValue(value) {
        if (!value || value === '-' || value === '') return this.renderEmptyCell();
        if (typeof value === 'string' && value.includes('%')) {
            const match = value.match(/(\d+)%/);
            if (match) return match[1] + '%';
        }
        if (typeof value === 'string' && value.length > 8) {
            return value.substring(0, 8) + '...';
        }
        return value;
    }

    getUpsideTooltip(rating) {
        const descriptions = {
            0: 'Keine Upside-Bewertung',
            1: 'Sehr geringes Upside-Potenzial',
            2: 'Geringes Upside-Potenzial',
            3: 'Mittleres Upside-Potenzial',
            4: 'Hohes Upside-Potenzial',
            5: 'Sehr hohes Upside-Potenzial'
        };
        return descriptions[rating] || 'Unbekannte Bewertung';
    }

    getBustTooltip(rating) {
        const descriptions = {
            0: 'Keine Bust-Bewertung',
            1: 'Sehr geringes Bust-Risiko',
            2: 'Geringes Bust-Risiko',
            3: 'Mittleres Bust-Risiko',
            4: 'Hohes Bust-Risiko',
            5: 'Sehr hohes Bust-Risiko'
        };
        return descriptions[rating] || 'Unbekannte Bewertung';
    }

    getMatchupTooltip(rating) {
        const rounded = this.roundToStarRating(rating);

        const descriptions = {
            0: 'Keine Matchup-Bewertung',
            1: 'Sehr schwieriges Matchup',
            2: 'Schwieriges Matchup',
            3: 'Neutrales Matchup',
            4: 'Günstiges Matchup',
            5: 'Sehr günstiges Matchup'
        };
        // Für halbe Sterne nimm die untere ganze Zahl für das Mapping
        return descriptions[Math.floor(rounded)] || 'Unbekannte Bewertung';
    }

    updateStats(allPlayers) {
        const total = allPlayers.length;
        const drafted = allPlayers.filter(p => p.drafted).length;
        document.getElementById('totalPlayers').textContent = total;
        document.getElementById('availablePlayers').textContent = total - drafted;
        document.getElementById('draftedPlayers').textContent = drafted;
    }

    showError(msg, details = null) {
        this.messages.showError(msg, details);
    }
    showSuccess(msg) {
        this.messages.showSuccess(msg);
    }
    showLoading(show) {
        this.messages.showLoading(show);
    }

    clearFilters() {
        document.getElementById('positionFilter').value = '';
        document.getElementById('rankFilter').value = '';
        document.getElementById('draftedFilter').value = '';
        document.getElementById('playerSearch').value = '';
        // Nach dem Zurücksetzen: Tracker-Filter aktualisieren
        const filters = this.getFiltersFromUI();
        this.applyFilters(filters);
    }

    getFiltersFromUI() {
        return {
            positionFilter: document.getElementById('positionFilter').value,
            rankFilter: document.getElementById('rankFilter').value,
            draftedFilter: document.getElementById('draftedFilter').value,
            playerSearch: document.getElementById('playerSearch').value.trim().toLowerCase()
        };
    }

    /**
     * Wendet die aktuellen Filtereinstellungen aus dem UI auf die Spieler-Liste an.
     * - Liest alle Filterwerte (Position, Rang, Draft-Status, Suchfeld) aus dem UI.
     * - Unterstützt gezielte Spaltensuche per Syntax (z.B. "team:phi").
     * - Filtert die Spieler nach Position, maximalem Rang, Draft-Status und Suchbegriff.
     * - Aktualisiert die gefilterte Spieler-Liste im Tracker.
     * - Rendert die gefilterte Tabelle und aktualisiert die Statistik-Badges.
     * 
     * Hinweis: Die Logik ist komplex, da verschiedene Filter-Kombinationen und Suchmodi unterstützt werden.
     */

    applyFilters() {
        // Filterwerte aus dem UI holen
        const filters = this.getFiltersFromUI();

        let columnSearch = null;
        let columnValue = null;
        const match = filters.playerSearch.match(/^([a-z_]+):(.*)$/i);
        if (match) {
            columnSearch = match[1].toLowerCase();
            columnValue = match[2].trim().toLowerCase();
        }

        // Filterlogik auf die Tracker-Daten anwenden
        this.tracker.filteredPlayers = this.tracker.allPlayers.filter(player => {
            if (filters.positionFilter && (
                (filters.positionFilter === "FLEX" &&
                    !["RB", "WR", "TE"].some(pos => player.position.includes(pos))) ||
                (filters.positionFilter !== "FLEX" &&
                    !player.position.includes(filters.positionFilter))
            )) return false;
            if (filters.rankFilter && player.rank > parseInt(filters.rankFilter)) return false;
            if (filters.draftedFilter === 'available' && player.drafted) return false;
            if (filters.draftedFilter === 'drafted' && !player.drafted) return false;
            if (columnSearch && player.hasOwnProperty(columnSearch)) {
                return (player[columnSearch] || '').toString().toLowerCase().includes(columnValue);
            }
            if (filters.playerSearch && !columnSearch) {
                const values = Object.values(player).map(v => (v || '').toString().toLowerCase());
                if (!values.some(val => val.includes(filters.playerSearch))) return false;
            }
            return true;
        });

        // Tabelle und Stats updaten
        this.renderTable(this.tracker.filteredPlayers, this.tracker.allPlayers);
        this.updateStats(this.tracker.allPlayers);
    }

    getActiveColumns(allPlayers) {
        return {
            matchup: true,
            upside: allPlayers.some(p => p.upside && p.upside !== 0),
            bust: allPlayers.some(p => p.bust && p.bust !== 0),
            start_sit: allPlayers.some(p => p.start_sit && p.start_sit !== ''),
            proj_fpts: allPlayers.some(p => p.proj_fpts && p.proj_fpts !== ''),
            avgDiff: allPlayers.some(p => p.avgDiff && p.avgDiff !== ''),
            percentOver: allPlayers.some(p => p.percentOver && p.percentOver !== ''),
            opportunity: allPlayers.some(p => p.opportunity && p.opportunity !== ''),
            efficiency: allPlayers.some(p => p.efficiency && p.efficiency !== ''),
        };
    }
}


