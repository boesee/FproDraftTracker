export class FantasyDraftTracker {
    constructor() {
        this.allPlayers = [];
        this.filteredPlayers = [];
        this.draftedPlayers = [];
        this.sortField = 'rank';
        this.sortDirection = 'asc';
        this.debugMode = true;

        // Die DraftUI-Instanz muss später von außen zugewiesen werden!
        this.ui = null;

        this.initializeEventListeners();
    }

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
                if (this.ui) this.ui.showJsonImport();
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

    debugLog(message, data = null) {
        if (this.debugMode) {
            console.log(`[DEBUG] ${message}`, data || '');
        }
    }

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

    async handleJsonFile(event) {
        const file = event.target.files[0];
        if (!file) return;
        try {
            const text = await file.text();
            this.processJsonData(text);
        } catch (error) {
            if (this.ui) this.ui.showError(`Fehler beim Lesen der Datei: ${error.message}`);
        }
    }

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
            if (this.ui) this.ui.updateStats(this.allPlayers);
            if (this.ui) this.ui.showSuccess(`${this.allPlayers.length} Spieler erfolgreich geladen.`);
        } catch (error) {
            console.error('Error parsing JSON:', error);
            if (this.ui) this.ui.showError(`Fehler beim Verarbeiten der JSON-Daten: ${error.message}`);
        }
    }

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

    async loadDraftData() {
        const draftId = document.getElementById('draftId').value.trim();
        if (!draftId) {
            if (this.ui) this.ui.showError('Bitte geben Sie eine gültige Draft ID ein.');
            return;
        }
        if (this.allPlayers.length === 0) {
            if (this.ui) this.ui.showError('Bitte laden Sie zuerst die Spielerdaten.');
            return;
        }
        if (this.ui) this.ui.showLoading(true);
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
            if (this.ui) this.ui.showSuccess(`${draftData.length} Picks geladen, ${matchedPlayers} Spieler gematcht.`);
            this.sortPlayers();
            this.applyFilters();
            if (this.ui) this.ui.updateStats(this.allPlayers);
        } catch (error) {
            if (this.ui) this.ui.showError(`Fehler beim Laden der Draft-Daten: ${error.message}`);
        } finally {
            if (this.ui) this.ui.showLoading(false);
        }
    }

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
            if (positionFilter && ((positionFilter === "FLEX" && !["RB", "WR", "TE"].includes(player.position)) || (positionFilter !== "FLEX" && player.position !== positionFilter))) return false;
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

        if (this.ui) this.ui.renderTable(this.filteredPlayers, this.allPlayers);
        if (this.ui) this.ui.updateStats(this.allPlayers);
    }

    clearFilters() {
        document.getElementById('positionFilter').value = '';
        document.getElementById('rankFilter').value = '';
        document.getElementById('draftedFilter').value = '';
        document.getElementById('playerSearch').value = '';
        this.applyFilters();
    }
}