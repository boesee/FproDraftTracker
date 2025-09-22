class FantasyDraftTracker {
    constructor() {
        this.allPlayers = [];
        this.filteredPlayers = [];
        this.draftedPlayers = [];
        this.sortField = 'rank';
        this.sortDirection = 'asc';
        this.debugMode = true;

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Debug: Check if button exists
        console.log('Initializing event listeners...');

        const loadJsonBtn = document.getElementById('loadJsonData');
        const loadDraftBtn = document.getElementById('loadDraft');

        console.log('loadJsonData button:', loadJsonBtn);
        console.log('loadDraft button:', loadDraftBtn);

        if (loadJsonBtn) {
            loadJsonBtn.addEventListener('click', (e) => {
                console.log('loadJsonData button clicked');
                e.preventDefault();
                this.showJsonImport();
            });
        } else {
            console.error('loadJsonData button not found!');
        }

        if (loadDraftBtn) {
            loadDraftBtn.addEventListener('click', (e) => {
                console.log('loadDraft button clicked');
                e.preventDefault();
                this.loadDraftData();
            });
        }

        // Other event listeners
        const positionFilter = document.getElementById('positionFilter');
        const rankFilter = document.getElementById('rankFilter');
        const draftedFilter = document.getElementById('draftedFilter');
        const clearFilters = document.getElementById('clearFilters');
        const playerSearch = document.getElementById('playerSearch');

        if (positionFilter) positionFilter.addEventListener('change', () => this.applyFilters());
        if (rankFilter) rankFilter.addEventListener('input', () => this.applyFilters());
        if (draftedFilter) draftedFilter.addEventListener('change', () => this.applyFilters());
        if (clearFilters) clearFilters.addEventListener('click', () => this.clearFilters());
        if (playerSearch) playerSearch.addEventListener('input', () => this.applyFilters());

        // File input for JSON
        const jsonFileInput = document.getElementById('jsonFileInput');
        if (jsonFileInput) {
            jsonFileInput.addEventListener('change', (e) => this.handleJsonFile(e));
        }

        console.log('Event listeners initialized');
    }

    showJsonImport() {
        console.log('showJsonImport called');

        try {
            // Remove existing modal if present
            const existingModal = document.querySelector('.json-import-modal');
            if (existingModal) {
                existingModal.remove();
            }

            const modal = document.createElement('div');
            modal.className = 'json-import-modal';
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.6);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                backdrop-filter: blur(3px);
            `;

            const content = document.createElement('div');
            content.style.cssText = `
                background: white;
                padding: 2rem;
                border-radius: 12px;
                max-width: 700px;
                max-height: 90vh;
                overflow-y: auto;
                position: relative;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                margin: 1rem;
            `;

            content.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h3 style="margin: 0; color: #333;">📊 Spielerdaten Importieren</h3>
                    <button id="closeModalBtn" style="
                        background: none; 
                        border: none; 
                        font-size: 24px; 
                        cursor: pointer; 
                        color: #666;
                        padding: 0;
                        width: 30px;
                        height: 30px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">×</button>
                </div>
                
                <div style="margin: 1.5rem 0;">
                    <h4 style="color: #28a745; margin-bottom: 1rem;">🔧 Option 1: Browser Extension (Empfohlen)</h4>
                    <p style="margin-bottom: 1rem;">Installieren Sie die FantasyPros Extension für automatische Extraktion:</p>
                    <button id="downloadExtension" style="
                        background: #28a745; 
                        color: white; 
                        border: none; 
                        padding: 12px 20px; 
                        border-radius: 6px; 
                        cursor: pointer;
                        font-weight: bold;
                    ">
                        📥 Extension Anleitung
                    </button>
                    <small style="display: block; margin-top: 8px; color: #666;">
                        Nach Installation: Gehen Sie zu FantasyPros → Extension Icon klicken → "Extract Data"
                    </small>
                </div>
                
                <hr style="margin: 2rem 0; border: none; border-top: 1px solid #ddd;">
                
                <div style="margin: 1.5rem 0;">
                    <h4 style="color: #007bff; margin-bottom: 1rem;">📁 Option 2: JSON Datei Hochladen</h4>
                    <input type="file" id="jsonFileUpload" accept=".json" style="
                        margin: 10px 0;
                        padding: 8px;
                        border: 2px dashed #007bff;
                        border-radius: 6px;
                        width: 100%;
                        cursor: pointer;
                    ">
                    <small style="display: block; color: #666;">
                        Laden Sie eine JSON-Datei mit Spielerdaten hoch
                    </small>
                </div>
                
                <hr style="margin: 2rem 0; border: none; border-top: 1px solid #ddd;">
                
                <div style="margin: 1.5rem 0;">
                    <h4 style="color: #6f42c1; margin-bottom: 1rem;">📝 Option 3: JSON Text Einfügen</h4>
                    <textarea id="jsonTextInput" placeholder="JSON Daten hier einfügen..." 
                        style="
                            width: 100%; 
                            height: 200px; 
                            font-family: 'Courier New', monospace; 
                            font-size: 12px;
                            border: 1px solid #ddd;
                            border-radius: 6px;
                            padding: 10px;
                            resize: vertical;
                        "></textarea>
                    <button id="processJsonText" style="
                        margin-top: 10px;
                        background: #6f42c1;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: bold;
                    ">JSON Verarbeiten</button>
                </div>
                
                <hr style="margin: 2rem 0; border: none; border-top: 1px solid #ddd;">
                
// In der showJsonImport() Funktion, ersetzen Sie den Bookmark-Bereich mit:

// In der showJsonImport() Funktion, ersetzen Sie den Bookmark-Bereich mit:

<div style="margin: 1.5rem 0;">
    <h4 style="color: #fd7e14; margin-bottom: 1rem;">🔖 Option 4: Browser Bookmark (Einfachste Lösung)</h4>
    <p style="margin-bottom: 1rem;">Klicken Sie den Button zum Kopieren des erweiterten Bookmark-Codes:</p>
    <button id="copyBookmarkBtn" style="
        background: #fd7e14;
        color: white;
        border: none;
        padding: 12px 20px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
        margin-bottom: 10px;
    ">📋 Bookmark Code Kopieren</button>
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

            // Event listeners für Modal
            this.setupModalEventListeners(modal);

            console.log('Modal created and added to DOM');

        } catch (error) {
            console.error('Error creating modal:', error);
            alert('Fehler beim Öffnen des Import-Dialogs. Bitte Seite neu laden.');
        }
    }

    setupModalEventListeners(modal) {
        // Close button
        const closeBtn = modal.querySelector('#closeModalBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                console.log('Close button clicked');
                document.body.removeChild(modal);
            });

            const copyBookmarkBtn = modal.querySelector('#copyBookmarkBtn');
            if (copyBookmarkBtn) {
                copyBookmarkBtn.addEventListener('click', async () => {
                    const bookmarkCode = `javascript:void(function(){
    var p=[];
    var isQB = window.location.href.toLowerCase().includes('/qb.php');
    document.querySelectorAll('tr.player-row').forEach(function(r){
        try{
            var c = r.querySelectorAll('td');
            if(c.length<11) return;
            var n = c[2].querySelector('.player-cell-name');
            if(!n) return;
            var t = c[2].querySelector('.player-cell-team');
            var position = isQB ? 'QB' : c[3].textContent.trim().replace(/\d+/g,'');
            var opponent = isQB ? c[3].textContent.trim() : c[4].textContent.trim();
            var upside = isQB ? c[4].querySelectorAll('.mcu-rating-meter__segment.is-filled').length : c[5].querySelectorAll('.mcu-rating-meter__segment.is-filled').length;
            var bust = isQB ? c[5].querySelectorAll('.mcu-rating-meter__segment.is-filled').length : c[6].querySelectorAll('.mcu-rating-meter__segment.is-filled').length;
            var matchup = isQB ? c[6].querySelectorAll('.template-stars-star .fa-star.template-stars-star-filled').length : c[7].querySelectorAll('.template-stars-star .fa-star.template-stars-star-filled').length;
            var startSit = isQB ? c[7].textContent.trim() : '';
            var projFpts = isQB ? c[8].textContent.trim() : '';
            var avgDiff = isQB ? (c[9]?c[9].textContent.trim():'') : (c[8]?c[8].textContent.trim():'');
            var percentOver = isQB ? (c[10]?c[10].textContent.trim():'') : (c[9]?c[9].textContent.trim():'');
            var opportunity = isQB ? (c[11]?c[11].textContent.trim():'') : (c[10]?c[10].textContent.trim():'');
            var efficiency = isQB ? (c[12]?c[12].textContent.trim():'') : (c[11]?c[11].textContent.trim():'');
            p.push({
                rank:parseInt(c[0].textContent.trim()),
                player_name:n.textContent.trim(),
                position:position,
                team:t?t.textContent.replace(/[()]/g,''):'',
                opponent:opponent,
                upside:upside,
                bust:bust,
                matchup:matchup,
                start_sit:startSit,
                proj_fpts:projFpts,
                avgDiff:avgDiff,
                percentOver:percentOver,
                opportunity:opportunity,
                efficiency:efficiency
            });
        }catch(e){}
    });
    if(p.length===0){
        alert('Keine Daten gefunden');
        return;
    }
    var j=JSON.stringify(p,null,2);
    var b=new Blob([j],{type:'application/json'});
    var u=URL.createObjectURL(b);
    var a=document.createElement('a');
    a.href=u;
    a.download='fantasypros-data.json';
    a.click();
    URL.revokeObjectURL(u);
    if(navigator.clipboard){
        navigator.clipboard.writeText(j).then(function(){
            alert('✅ '+p.length+' Spieler - Download+Clipboard');
        }).catch(function(){
            alert('✅ '+p.length+' Spieler - Download');
        });
    }else{
        alert('✅ '+p.length+' Spieler - Download');
    }
})()`;

                    try {
                        await navigator.clipboard.writeText(bookmarkCode);
                        copyBookmarkBtn.textContent = '✅ Bookmark Code kopiert!';
                        copyBookmarkBtn.style.background = '#28a745';

                        setTimeout(() => {
                            copyBookmarkBtn.textContent = '📋 Bookmark Code Kopieren';
                            copyBookmarkBtn.style.background = '#fd7e14';
                        }, 2000);

                    } catch (error) {
                        console.error('Clipboard error:', error);
                        // Fallback: Show in text area
                        const fallbackDiv = document.createElement('div');
                        fallbackDiv.style.cssText = `
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                    z-index: 10002;
                    max-width: 90%;
                    max-height: 90%;
                `;

                        fallbackDiv.innerHTML = `
                    <h4>📋 Bookmark Code (Zwischenablage nicht verfügbar)</h4>
                    <p>Kopieren Sie den folgenden Code und verwenden Sie ihn als Lesezeichen-URL:</p>
                    <textarea style="width: 100%; height: 100px; font-family: monospace; font-size: 12px;" readonly>${bookmarkCode}</textarea>
                    <br><br>
                    <button onclick="this.parentElement.remove()" style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Schließen</button>
                `;

                        document.body.appendChild(fallbackDiv);
                    }
                });
            }


        }

        // Extension download
        const downloadExtBtn = modal.querySelector('#downloadExtension');
        if (downloadExtBtn) {
            downloadExtBtn.addEventListener('click', () => {
                this.showExtensionInstructions();
            });
        }

        // File upload
        const fileUpload = modal.querySelector('#jsonFileUpload');
        if (fileUpload) {
            fileUpload.addEventListener('change', (e) => {
                this.handleJsonFile(e);
                document.body.removeChild(modal);
            });
        }

        // JSON text processing
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

        // Click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });

        // ESC key to close
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                document.body.removeChild(modal);
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

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

        // Log extension files to console
        console.log(`
=== BROWSER EXTENSION FILES ===

Erstellen Sie diese Dateien in einem Ordner:

--- manifest.json ---
{
  "manifest_version": 3,
  "name": "FantasyPros Data Extractor",
  "version": "1.0",
  "description": "Extract player data from FantasyPros",
  "permissions": ["activeTab"],
  "content_scripts": [{
    "matches": ["*://*.fantasypros.com/*"],
    "js": ["content.js"]
  }],
  "action": {
    "default_popup": "popup.html"
  }
}

--- content.js ---
// Siehe vorherige Nachrichten für den vollständigen Code

--- popup.html ---
// Siehe vorherige Nachrichten für den vollständigen Code

--- popup.js ---
// Siehe vorherige Nachrichten für den vollständigen Code
        `);
    }

    // Rest der Funktionen bleiben gleich...
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
            this.showError(`Fehler beim Lesen der Datei: ${error.message}`);
        }
    }

    processJsonData(jsonString) {
        try {
            const data = JSON.parse(jsonString);

            // Handle both array and object with players array
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

    findPlayerMatch(fantasyPlayer, draftedPlayersArray) {
        const fantasyNormalized = this.normalizePlayerName(fantasyPlayer.player_name);

        for (const draftedPick of draftedPlayersArray) {
            if (!draftedPick.metadata?.first_name || !draftedPick.metadata?.last_name) {
                continue;
            }

            const draftedFullName = `${draftedPick.metadata.first_name} ${draftedPick.metadata.last_name}`;
            const draftedNormalized = this.normalizePlayerName(draftedFullName);

            if (fantasyNormalized.fullName === draftedNormalized.fullName ||
                (fantasyNormalized.first === draftedNormalized.first &&
                    fantasyNormalized.last === draftedNormalized.last)) {
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

            return this.sortDirection === 'asc' ?
                (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
        });
    }

    applyFilters() {
        const positionFilter = document.getElementById('positionFilter').value;
        const rankFilter = document.getElementById('rankFilter').value;
        const draftedFilter = document.getElementById('draftedFilter').value;
        const playerSearch = document.getElementById('playerSearch').value.trim().toLowerCase();

        // Suche nach Syntax: spalte:wert
        let columnSearch = null;
        let columnValue = null;

        // Regex für z.B. startsit:A+ oder proj_fpts:10
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
                // Suche nur in der gewünschten Spalte
                return (player[columnSearch] || '').toString().toLowerCase().includes(columnValue);
            }
            // Normale globale Suche
            if (playerSearch && !columnSearch) {
                const values = Object.values(player).map(v => (v || '').toString().toLowerCase());
                if (!values.some(val => val.includes(playerSearch))) return false;
            }
            return true;
        });

        this.renderTable();
        this.updateStats();
    }

    clearFilters() {
        document.getElementById('positionFilter').value = '';
        document.getElementById('rankFilter').value = '';
        document.getElementById('draftedFilter').value = '';
        this.applyFilters();
    }

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

            // Erweiterte Tooltips
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

    renderStarRating(rating, type = 'default') {
        const maxStars = 5;
        const filledStars = Math.max(0, Math.min(maxStars, parseInt(rating) || 0));
        const emptyStars = maxStars - filledStars;

        let filledStar = '★';
        let emptyStar = '☆';

        // Verschiedene Star-Styles für verschiedene Typen
        switch (type) {
            case 'upside':
                // Grüne gefüllte Sterne für Upside
                break;
            case 'bust':
                // Rote gefüllte Sterne für Bust Risk
                break;
            case 'matchup':
                // Blaue gefüllte Sterne für Matchup
                break;
        }

        if (rating === 0 || !rating) {
            return '<span class="no-rating" title="Keine Bewertung">-</span>';
        }

        const filled = `<span class="filled">${filledStar.repeat(filledStars)}</span>`;
        const empty = `<span class="empty">${emptyStar.repeat(emptyStars)}</span>`;

        return filled + empty;
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
        if (!value || value === '-' || value === '') return '-';

        if (typeof value === 'string' && value.includes('%')) {
            const match = value.match(/(\d+)%/);
            if (match) {
                return match[1] + '%';
            }
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

    updateStats() {
        const total = this.allPlayers.length;
        const drafted = this.allPlayers.filter(p => p.drafted).length;
        document.getElementById('totalPlayers').textContent = total;
        document.getElementById('availablePlayers').textContent = total - drafted;
        document.getElementById('draftedPlayers').textContent = drafted;
    }

    showLoading(show) {
        const loadingElement = document.getElementById('loading');
        loadingElement.style.display = show ? 'block' : 'none';
        if (show) loadingElement.setAttribute('aria-busy', 'true');
        else loadingElement.removeAttribute('aria-busy');
    }

    showError(message) {
        this.hideSuccess();
        const errorElement = document.getElementById('error');
        errorElement.style.display = 'block';
        document.getElementById('errorMessage').textContent = message;
        setTimeout(() => this.hideError(), 5000);
    }

    hideError() {
        document.getElementById('error').style.display = 'none';
    }

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

    hideSuccess() {
        const successElement = document.getElementById('success');
        if (successElement) successElement.style.display = 'none';
    }
}

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

// Ensure DOM is loaded before initializing
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM loaded, initializing tracker...');
        window.draftTracker = new FantasyDraftTracker();
    });
} else {
    console.log('DOM already loaded, initializing tracker...');
    window.draftTracker = new FantasyDraftTracker();
}