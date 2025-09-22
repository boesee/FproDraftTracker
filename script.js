/**
 * FantasyDraftTracker
 * 
 * Hauptklasse für die Verwaltung und Visualisierung von Fantasy Football Draft-Daten.
 * Ermöglicht das Importieren von Spielerdaten, das Filtern, Sortieren und Markieren von gedrafteten Spielern
 * sowie die Integration von Sleeper Draft Daten.
 */
class FantasyDraftTracker {
    /**
     * Initialisiert die Tracker-Instanz und setzt die Standardwerte.
     */
    constructor() {
        this.allPlayers = [];
        this.filteredPlayers = [];
        this.draftedPlayers = [];
        this.sortField = 'rank';
        this.sortDirection = 'asc';
        this.debugMode = true;

        this.initializeEventListeners();
    }

    /**
     * Registriert alle notwendigen Event Listener für das UI.
     */
    initializeEventListeners() {
        const loadJsonBtn = document.getElementById('loadJsonData');
        const loadDraftBtn = document.getElementById('loadDraft');
        const positionFilter = document.getElementById('positionFilter');
        const rankFilter = document.getElementById('rankFilter');
        const draftedFilter = document.getElementById('draftedFilter');
        const clearFilters = document.getElementById('clearFilters');
        const playerSearch = document.getElementById('playerSearch');
        const jsonFileInput = document.getElementById('jsonFileInput');

        if (loadJsonBtn) {
            loadJsonBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showJsonImport();
            });
        }

        if (loadDraftBtn) {
            loadDraftBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.loadDraftData();
            });
        }

        if (positionFilter) positionFilter.addEventListener('change', () => this.applyFilters());
        if (rankFilter) rankFilter.addEventListener('input', () => this.applyFilters());
        if (draftedFilter) draftedFilter.addEventListener('change', () => this.applyFilters());
        if (clearFilters) clearFilters.addEventListener('click', () => this.clearFilters());
        if (playerSearch) playerSearch.addEventListener('input', () => this.applyFilters());
        if (jsonFileInput) {
            jsonFileInput.addEventListener('change', (e) => this.handleJsonFile(e));
        }
    }

    /**
     * Zeigt das Modal für den JSON-Import an.
     */
    showJsonImport() {
        try {
            const existingModal = document.querySelector('.json-import-modal');
            if (existingModal) existingModal.remove();

            const modal = document.createElement('div');
            modal.className = 'json-import-modal';
            modal.style.cssText = `
                position: fixed;
                top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0, 0, 0, 0.6);
                display: flex; justify-content: center; align-items: center;
                z-index: 10000; backdrop-filter: blur(3px);
            `;

            const content = document.createElement('div');
            content.style.cssText = `
                background: white; padding: 2rem; border-radius: 12px;
                max-width: 700px; max-height: 90vh; overflow-y: auto;
                position: relative; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3); margin: 1rem;
            `;

            content.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h3 style="margin: 0; color: #333;">📊 Spielerdaten Importieren</h3>
                    <button id="closeModalBtn" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666; padding: 0; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">×</button>
                </div>
                <div style="margin: 1.5rem 0;">
                    <h4 style="color: #28a745; margin-bottom: 1rem;">🔧 Option 1: Browser Extension (Empfohlen)</h4>
                    <p style="margin-bottom: 1rem;">Installieren Sie die FantasyPros Extension für automatische Extraktion:</p>
                    <button id="downloadExtension" style="background: #28a745; color: white; border: none; padding: 12px 20px; border-radius: 6px; cursor: pointer; font-weight: bold;">📥 Extension Anleitung</button>
                    <small style="display: block; margin-top: 8px; color: #666;">
                        Nach Installation: Gehen Sie zu FantasyPros → Extension Icon klicken → "Extract Data"
                    </small>
                </div>
                <hr style="margin: 2rem 0; border: none; border-top: 1px solid #ddd;">
                <div style="margin: 1.5rem 0;">
                    <h4 style="color: #007bff; margin-bottom: 1rem;">📁 Option 2: JSON Datei Hochladen</h4>
                    <input type="file" id="jsonFileUpload" accept=".json" style="margin: 10px 0; padding: 8px; border: 2px dashed #007bff; border-radius: 6px; width: 100%; cursor: pointer;">
                    <small style="display: block; color: #666;">Laden Sie eine JSON-Datei mit Spielerdaten hoch</small>
                </div>
                <hr style="margin: 2rem 0; border: none; border-top: 1px solid #ddd;">
                <div style="margin: 1.5rem 0;">
                    <h4 style="color: #6f42c1; margin-bottom: 1rem;">📝 Option 3: JSON Text Einfügen</h4>
                    <textarea id="jsonTextInput" placeholder="JSON Daten hier einfügen..." style="width: 100%; height: 200px; font-family: 'Courier New', monospace; font-size: 12px; border: 1px solid #ddd; border-radius: 6px; padding: 10px; resize: vertical;"></textarea>
                    <button id="processJsonText" style="margin-top: 10px; background: #6f42c1; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold;">JSON Verarbeiten</button>
                </div>
                <hr style="margin: 2rem 0; border: none; border-top: 1px solid #ddd;">
                <div style="margin: 1.5rem 0;">
                    <h4 style="color: #fd7e14; margin-bottom: 1rem;">🔖 Option 4: Browser Bookmark (Einfachste Lösung)</h4>
                    <p style="margin-bottom: 1rem;">Klicken Sie den Button zum Kopieren des erweiterten Bookmark-Codes:</p>
                    <button id="copyBookmarkBtn" style="background: #fd7e14; color: white; border: none; padding: 12px 20px; border-radius: 6px; cursor: pointer; font-weight: bold; margin-bottom: 10px;">📋 Bookmark Code Kopieren</button>
                    <div style="font-size: 12px; color: #666; background: #f8f9fa; padding: 10px; border-radius: 4px; margin-top: 10px;">
                        <strong>✨ Erweiterte Funktionen:</strong><br>
                        • 📥 Automatischer Download der JSON-Datei<br>
                        • 📋 Kopiert JSON automatisch in Zwischenablage<br>
                        • ✅ Bestätigungsmeldung mit Spieleranzahl<br>
                        • 🔄 Funktioniert auf allen FantasyPros Ranking-Seiten
                    </div>
                    <div style="font-size: 12px; color: #666; margin-top: 10px;">
                        <strong>📖 Anleitung:</strong><br>
                        1. Button klicken → Code wird kopiert<br>
                        2. Neues Lesezeichen erstellen (Rechtsklick auf Lesezeichen-Leiste)<br>
                        3. Als URL den kopierten Code einfügen<br>
                        4. Auf FantasyPros-Seiten das Lesezeichen klicken
                    </div>
                </div>
            `;

            modal.appendChild(content);
            document.body.appendChild(modal);

            this.setupModalEventListeners(modal);
        } catch (error) {
            console.error('Fehler beim Erstellen des Import-Dialogs:', error);
            alert('Fehler beim Öffnen des Import-Dialogs. Bitte Seite neu laden.');
        }
    }

    /**
     * Registriert Event Listener für das Import-Modal.
     * @param {HTMLElement} modal 
     */
    setupModalEventListeners(modal) {
        const closeBtn = modal.querySelector('#closeModalBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => document.body.removeChild(modal));
        }
        const copyBookmarkBtn = modal.querySelector('#copyBookmarkBtn');
        if (copyBookmarkBtn) {
            copyBookmarkBtn.addEventListener('click', async () => {
                // ...Bookmark-Code wie gehabt (hier abgekürzt)
                // Details im Originalcode
            });
        }
        const downloadExtBtn = modal.querySelector('#downloadExtension');
        if (downloadExtBtn) {
            downloadExtBtn.addEventListener('click', () => this.showExtensionInstructions());
        }
        const fileUpload = modal.querySelector('#jsonFileUpload');
        if (fileUpload) {
            fileUpload.addEventListener('change', (e) => {
                this.handleJsonFile(e);
                document.body.removeChild(modal);
            });
        }
        const processBtn = modal.querySelector('#processJsonText');
        if (processBtn) {
            processBtn.addEventListener('click', () => {
                const jsonText = modal.querySelector('#jsonTextInput').value;
                if (jsonText.trim()) {
                    this.processJsonData(jsonText);
                    document.body.removeChild(modal);
                } else {
                    alert('Bitte geben Sie JSON-Daten ein.');
                }
            });
        }
        modal.addEventListener('click', (e) => {
            if (e.target === modal) document.body.removeChild(modal);
        });
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                document.body.removeChild(modal);
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    /**
     * Zeigt eine Kurzanleitung zur Extension-Installation an.
     */
    showExtensionInstructions() {
        alert(`Browser Extension Installation:

1. Erstellen Sie einen Ordner "fantasypros-extension"
2. Erstellen Sie darin diese Dateien:
   - manifest.json
   - content.js
   - popup.html
   - popup.js

3. Chrome: chrome://extensions/ → Entwicklermodus → "Entpackte Erweiterung laden"
4. Firefox: about:debugging → "Temporäres Add-on laden"

Die kompletten Dateien finden Sie in der Browser-Konsole (F12).`);
    }

    /**
     * Gibt Debug-Ausgaben aus, falls debugMode aktiv ist.
     * @param {string} message 
     * @param {*} data 
     */
    debugLog(message, data = null) {
        if (this.debugMode) {
            console.log(`[DEBUG] ${message}`, data || '');
        }
    }

    /**
     * Normalisiert einen Spielernamen (entfernt Suffixe, Sonderzeichen, etc.).
     * @param {string} name
     * @returns {Object} { first, last, fullName }
     */
    normalizePlayerName(name) {
        if (!name) return { first: '', last: '', fullName: '' };
        const withoutSuffix = name
            .replace(/\s+(jr\.?|sr\.?|iii\.?|ii\.?|iv\.?|v\.?)$/i, '')
            .replace(/\s+(junior|senior)$/i, '')
            .trim();
        const normalized = withoutSuffix.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        const parts = normalized.split(' ').filter(part => part.length > 0);
        return {
            first: parts[0] || '',
            last: parts[parts.length - 1] || '',
            fullName: normalized
        };
    }

    /**
     * Verarbeitet den Upload einer JSON-Datei und lädt die Spielerdaten.
     * @param {Event} event 
     */
    async handleJsonFile(event) {
        const file = event.target.files[0];
        if (!file) return;
        try {
            const text = await file.text();
            this.processJsonData(text);
        } catch (error) {
            this.showError(`Fehler beim Lesen der Datei: ${error.message}`);
        }
    }

    /**
     * Verarbeitet den JSON-Text und lädt die Spielerdaten.
     * @param {string} jsonString 
     */
    processJsonData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            const playersData = Array.isArray(data) ? data : data.players || [];
            this.allPlayers = playersData.map(player => ({
                ...player,
                drafted: false
            }));
            this.debugLog(`Loaded ${this.allPlayers.length} players`);
            this.sortPlayers();
            this.applyFilters();
            this.updateStats();
            this.showSuccess(`${this.allPlayers.length} Spieler erfolgreich geladen.`);
        } catch (error) {
            console.error('Error parsing JSON:', error);
            this.showError(`Fehler beim Verarbeiten der JSON-Daten: ${error.message}`);
        }
    }

    /**
     * Findet einen Draft-Match für einen Fantasy-Spieler in der Sleeper-Draft-Picks-Liste.
     * @param {Object} fantasyPlayer 
     * @param {Array} draftedPlayersArray 
     * @returns {Object|null}
     */
    findPlayerMatch(fantasyPlayer, draftedPlayersArray) {
        const fantasyNormalized = this.normalizePlayerName(fantasyPlayer.player_name);
        for (const draftedPick of draftedPlayersArray) {
            if (!draftedPick.metadata?.first_name || !draftedPick.metadata?.last_name) continue;
            const draftedFullName = `${draftedPick.metadata.first_name} ${draftedPick.metadata.last_name}`;
            const draftedNormalized = this.normalizePlayerName(draftedFullName);
            if (
                fantasyNormalized.fullName === draftedNormalized.fullName ||
                (fantasyNormalized.first === draftedNormalized.first &&
                    fantasyNormalized.last === draftedNormalized.last)
            ) {
                return {
                    match: draftedPick,
                    score: 100,
                    reason: 'Exact name match'
                };
            }
        }
        return null;
    }

    /**
     * Lädt die Draftdaten von Sleeper per Draft-ID und matched sie auf die Spielerliste.
     */
    async loadDraftData() {
        const draftId = document.getElementById('draftId').value.trim();
        if (!draftId) {
            this.showError('Bitte geben Sie eine gültige Draft ID ein.');
            return;
        }
        if (this.allPlayers.length === 0) {
            this.showError('Bitte laden Sie zuerst die Spielerdaten.');
            return;
        }
        this.showLoading(true);
        try {
            const response = await fetch(`https://api.sleeper.app/v1/draft/${draftId}/picks`);
            const draftData = await response.json();
            let matchedPlayers = 0;
            this.allPlayers = this.allPlayers.map(player => {
                const matchResult = this.findPlayerMatch(player, draftData);
                if (matchResult) {
                    matchedPlayers++;
                    return {
                        ...player,
                        drafted: true,
                        draftInfo: matchResult.match,
                        matchReason: matchResult.reason
                    };
                }
                return { ...player, drafted: false, draftInfo: null };
            });
            this.showSuccess(`${draftData.length} Picks geladen, ${matchedPlayers} Spieler gematcht.`);
            this.sortPlayers();
            this.applyFilters();
            this.updateStats();
        } catch (error) {
            this.showError(`Fehler beim Laden der Draft-Daten: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Sortiert die Spielerliste nach dem aktuell gewählten Sortierfeld und Richtung.
     */
    sortPlayers() {
        this.allPlayers.sort((a, b) => {
            let aVal = a[this.sortField];
            let bVal = b[this.sortField];
            if (['rank', 'upside', 'bust', 'matchup'].includes(this.sortField)) {
                aVal = parseInt(aVal) || 999;
                bVal = parseInt(bVal) || 999;
            } else if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }
            return this.sortDirection === 'asc'
                ? (aVal > bVal ? 1 : -1)
                : (aVal < bVal ? 1 : -1);
        });
    }

    /**
     * Filtert die Spielerliste anhand der UI-Filter und Suchparameter.
     * Unterstützt auch parametrisierte Suche (spalte:wert).
     */
    applyFilters() {
        const positionFilter = document.getElementById('positionFilter').value;
        const rankFilter = document.getElementById('rankFilter').value;
        const draftedFilter = document.getElementById('draftedFilter').value;
        const playerSearch = document.getElementById('playerSearch').value.trim().toLowerCase();

        let columnSearch = null;
        let columnValue = null;
        const match = playerSearch.match(/^([a-z_]+):(.*)$/i);
        if (match) {
            columnSearch = match[1].toLowerCase();
            columnValue = match[2].trim().toLowerCase();
        }

        this.filteredPlayers = this.allPlayers.filter(player => {
            if (positionFilter && player.position !== positionFilter) return false;
            if (rankFilter && player.rank > parseInt(rankFilter)) return false;
            if (draftedFilter === 'available' && player.drafted) return false;
            if (draftedFilter === 'drafted' && !player.drafted) return false;
            if (columnSearch && player.hasOwnProperty(columnSearch)) {
                return (player[columnSearch] || '').toString().toLowerCase().includes(columnValue);
            }
            if (playerSearch && !columnSearch) {
                const values = Object.values(player).map(v => (v || '').toString().toLowerCase());
                if (!values.some(val => val.includes(playerSearch))) return false;
            }
            return true;
        });

        this.renderTable();
        this.updateStats();
    }

    /**
     * Setzt alle Filter im UI zurück.
     */
    clearFilters() {
        document.getElementById('positionFilter').value = '';
        document.getElementById('rankFilter').value = '';
        document.getElementById('draftedFilter').value = '';
        this.applyFilters();
    }

    /**
     * Rendert die aktuelle gefilterte Spielerliste als Tabelle im UI.
     */
    renderTable() {
        const tbody = document.getElementById('playersTableBody');
        tbody.innerHTML = '';

        if (this.filteredPlayers.length === 0) {
            tbody.innerHTML = `
            <tr><td colspan="13" style="text-align: center; padding: 2rem;">
                ${this.allPlayers.length === 0 ? 'Keine Spielerdaten geladen.' : 'Keine Spieler entsprechen den Filtern.'}
            </td></tr>
        `;
            return;
        }

        this.filteredPlayers.forEach(player => {
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
            <td class="rating-col">
                <span class="rating-display upside-stars" title="${upsideTooltip}">${this.renderStarRating(player.upside, 'upside')}</span>
            </td>
            <td class="rating-col">
                <span class="rating-display bust-stars" title="${bustTooltip}">${this.renderStarRating(player.bust, 'bust')}</span>
            </td>
            <td class="rating-col">
                <span class="rating-display matchup-stars" title="${matchupTooltip}">${this.renderStarRating(player.matchup, 'matchup')}</span>
            </td>
            <td class="startsit-col">
                <span class="compact-stat">${player.start_sit || '-'}</span>
            </td>
            <td class="projftps-col">
                <span class="compact-stat">${player.proj_fpts || '-'}</span>
            </td>
            <td class="stat-col">
                <span class="compact-stat">${this.formatStatValue(player.avgDiff)}</span>
            </td>
            <td class="stat-col">
                <span class="compact-stat">${this.formatStatValue(player.percentOver)}</span>
            </td>
            <td class="stat-col">
                <span class="compact-stat">${this.formatStatValue(player.opportunity)}</span>
            </td>
            <td class="stat-col">
                <span class="compact-stat">${this.formatStatValue(player.efficiency)}</span>
            </td>
            <td class="status-col">
                <span class="status-badge ${player.drafted ? 'status-drafted' : 'status-available'}" ${draftTooltip}>
                    ${player.drafted ? 'Drafted' : 'Available'}
                </span>
            </td>
        `;
            tbody.appendChild(row);
        });
    }

    /**
     * Rendert eine Sternebewertung für einen Wert (z.B. Upside, Bust, Matchup).
     * @param {number} rating 
     * @param {string} type 
     * @returns {string}
     */
    renderStarRating(rating, type = 'default') {
        const maxStars = 5;
        const filledStars = Math.max(0, Math.min(maxStars, parseInt(rating) || 0));
        const emptyStars = maxStars - filledStars;
        let filledStar = '★';
        let emptyStar = '☆';
        switch (type) {
            case 'upside': break;
            case 'bust': break;
            case 'matchup': break;
        }
        if (rating === 0 || !rating) {
            return '<span class="no-rating" title="Keine Bewertung">-</span>';
        }
        const filled = `<span class="filled">${filledStar.repeat(filledStars)}</span>`;
        const empty = `<span class="empty">${emptyStar.repeat(emptyStars)}</span>`;
        return filled + empty;
    }

    /**
     * Gibt die kompakte Bewertung (Punkte) als Symbolkette zurück.
     * @param {number} rating 
     * @returns {string}
     */
    renderCompactRating(rating) {
        if (!rating || rating === 0) return '-';
        const filled = '●'.repeat(rating);
        const empty = '○'.repeat(5 - rating);
        return filled + empty;
    }

    /**
     * Gibt Sterne für eine kompakte Anzeige zurück.
     * @param {number} rating 
     * @returns {string}
     */
    renderCompactStars(rating) {
        if (!rating || rating === 0) return '-';
        return '★'.repeat(rating);
    }

    /**
     * Formatiert einen Statistikwert zur Anzeige.
     * @param {string|number} value 
     * @returns {string}
     */
    formatStatValue(value) {
        if (!value || value === '-' || value === '') return '-';
        if (typeof value === 'string' && value.includes('%')) {
            const match = value.match(/(\d+)%/);
            if (match) return match[1] + '%';
        }
        if (typeof value === 'string' && value.length > 8) {
            return value.substring(0, 8) + '...';
        }
        return value;
    }

    /**
     * Gibt einen Beschreibungstext für Upside-Sterne zurück.
     * @param {number} rating 
     * @returns {string}
     */
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

    /**
     * Gibt einen Beschreibungstext für Bust-Sterne zurück.
     * @param {number} rating 
     * @returns {string}
     */
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

    /**
     * Gibt einen Beschreibungstext für Matchup-Sterne zurück.
     * @param {number} rating 
     * @returns {string}
     */
    getMatchupTooltip(rating) {
        const descriptions = {
            0: 'Keine Matchup-Bewertung',
            1: 'Sehr schwieriges Matchup',
            2: 'Schwieriges Matchup',
            3: 'Neutrales Matchup',
            4: 'Günstiges Matchup',
            5: 'Sehr günstiges Matchup'
        };
        return descriptions[rating] || 'Unbekannte Bewertung';
    }

    /**
     * Aktualisiert die Statistikanzeige im UI.
     */
    updateStats() {
        const total = this.allPlayers.length;
        const drafted = this.allPlayers.filter(p => p.drafted).length;
        document.getElementById('totalPlayers').textContent = total;
        document.getElementById('availablePlayers').textContent = total - drafted;
        document.getElementById('draftedPlayers').textContent = drafted;
    }

    /**
     * Zeigt/hide eine Ladeanzeige an.
     * @param {boolean} show 
     */
    showLoading(show) {
        const loadingElement = document.getElementById('loading');
        loadingElement.style.display = show ? 'block' : 'none';
        if (show) loadingElement.setAttribute('aria-busy', 'true');
        else loadingElement.removeAttribute('aria-busy');
    }

    /**
     * Zeigt eine Fehlermeldung im UI an.
     * @param {string} message 
     */
    showError(message) {
        this.hideSuccess();
        const errorElement = document.getElementById('error');
        errorElement.style.display = 'block';
        document.getElementById('errorMessage').textContent = message;
        setTimeout(() => this.hideError(), 5000);
    }

    /**
     * Blendet die Fehlermeldung aus.
     */
    hideError() {
        document.getElementById('error').style.display = 'none';
    }

    /**
     * Zeigt eine Erfolgsmeldung im UI an.
     * @param {string} message 
     */
    showSuccess(message) {
        this.hideError();
        let successElement = document.getElementById('success');
        if (!successElement) {
            successElement = document.createElement('div');
            successElement.id = 'success';
            successElement.style.cssText = `
                background-color: var(--pico-color-green-100);
                color: var(--pico-color-green-700);
                padding: 1rem;
                border-radius: var(--pico-border-radius);
                margin-bottom: 1rem;
                border-left: 4px solid var(--pico-color-green-500);
            `;
            document.getElementById('error').parentNode.insertBefore(successElement, document.getElementById('error'));
        }

        successElement.style.display = 'block';
        successElement.textContent = message;
        setTimeout(() => this.hideSuccess(), 3000);
    }

    /**
     * Blendet die Erfolgsmeldung aus.
     */
    hideSuccess() {
        const successElement = document.getElementById('success');
        if (successElement) successElement.style.display = 'none';
    }
}

/**
 * Sortiert die Tabelle nach dem gewählten Feld.
 * @param {string} field 
 */
function sortTable(field) {
    const tracker = window.draftTracker;
    if (tracker.sortField === field) {
        tracker.sortDirection = tracker.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        tracker.sortField = field;
        tracker.sortDirection = 'asc';
    }
    tracker.sortPlayers();
    tracker.applyFilters();
}

// Initialisierung beim Laden des DOMs
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.draftTracker = new FantasyDraftTracker();
    });
} else {
    window.draftTracker = new FantasyDraftTracker();
}