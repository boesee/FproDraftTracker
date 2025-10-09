export class FantasyDraftTracker {
    constructor() {
        this.ecrData = null;
        this.loadDefaultEcrData();
        this.allPlayers = [];
        this.filteredPlayers = [];
        this.draftedPlayers = [];
        this.sortField = 'rank';
        this.sortDirection = 'asc';
        this.debugMode = true;

        // Die DraftUI-Instanz muss später von außen zugewiesen werden!
        this.ui = null;


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
            this.ui.applyFilters();
            if (this.ui) this.ui.updateStats(this.allPlayers);
            if (this.ui) this.ui.showSuccess(`${this.allPlayers.length} Spieler erfolgreich geladen.`);
        } catch (error) {
            console.error('Error parsing JSON:', error);
            if (this.ui) this.ui.showError(`Fehler beim Verarbeiten der JSON-Daten: ${error.message}`);
        }
    }

    findPlayerMatch(fantasyPlayer, draftedPlayersArray) {
        if (!Array.isArray(draftedPlayersArray)) return null; // <- Schutz gegen null/undefined
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

    async loadDraftData(draftId) { // <--- draftId als Parameter!
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

            // Prüfe, ob die Daten wirklich ein Array sind!
            if (!Array.isArray(draftData)) {
                if (this.ui) this.ui.showError('Fehler: Keine gültigen Draft-Daten erhalten. Überprüfe die Draft-ID!');
                return;
            }

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
            this.ui.applyFilters();
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

    async loadDefaultEcrData() {

        

        try {
            const response = await fetch('data/ecrData.json');
            if (!response.ok) throw new Error('Fehler beim Laden der ecrData.json');
            const rawData = await response.json();

            const mappedPlayers = (Array.isArray(rawData) ? rawData : rawData.players).map(p => ({
                rank: p.rank_ecr ?? '',
                player_name: p.player_name ?? '',
                position: p.pos_rank ?? '',
                team: p.player_team_id ?? '',
                opponent: p.player_opponent ?? '',
                matchup: p.star_rating ?? 0
            }));

            this.ecrData = mappedPlayers;
            this.processJsonData(JSON.stringify(mappedPlayers));
            if (this.ui) this.ui.applyFilters();
            if (this.ui) this.ui.showSuccess(`${mappedPlayers.length} ECR-Spieler erfolgreich geladen.`);
        } catch (error) {
            if (this.ui) this.ui.showError("Fehler beim Laden der ECR-Daten: " + error.message);
        }
    }
}