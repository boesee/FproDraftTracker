export class DraftUI {
    constructor(tracker) {
        // tracker ist die Instanz von FantasyDraftTracker
        this.tracker = tracker;
    }

    initUI() {
        document.getElementById('clearFilters').addEventListener('click', () => this.clearFilters());
        document.getElementById('positionFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('rankFilter').addEventListener('input', () => this.applyFilters());
        document.getElementById('draftedFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('playerSearch').addEventListener('input', () => this.applyFilters());

        const loadJsonBtn = document.getElementById('loadJsonData');
        if (loadJsonBtn) {
            loadJsonBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showJsonImport();
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

        // JSON File Input
        const jsonFileInput = document.getElementById('jsonFileInput');
        if (jsonFileInput) {
            jsonFileInput.addEventListener('change', (e) => this.handleJsonFile(e));
        }

        // ECR Daten holen
        const fetchEcrBtn = document.getElementById('fetchEcrData');
        if (fetchEcrBtn) {

            fetchEcrBtn.addEventListener('click', () => this.tracker.fetchEcrData());
        }



    }

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
    <button id="closeModalBtn"
        style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666; padding: 0; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">×</button>
</div>

<div style="margin: 1.5rem 0;">
    <h4 style="color: #28a745; margin-bottom: 1rem;">🌐 Empfohlen: FPro Scraper</h4>
    <p style="margin-bottom: 1rem;">Scrapen Sie die Daten direkt von FantasyPros:</p>
    <button id="fetchEcrData" class="modal-button modal-button--primary"><span style="margin-right:8px;">🤖</span>Auto Import</button>
</div>


<div style="margin: 1.5rem 0;">
    <h4 style="color: #28a745; margin-bottom: 1rem;">🔧 Alternative 1: Browser Extension</h4>
    <p style="margin-bottom: 1rem;">Installieren Sie die FantasyPros Extension für automatische Extraktion:</p>
    <button id="downloadExtension" class="modal-button"><span style="margin-right:8px;">📥</span>Extension Anleitung</button>
    <small style="display: block; margin-top: 8px; color: #666;">
        Nach Installation: Gehen Sie zu FantasyPros → Extension Icon klicken → "Extract Data"
    </small>
</div>


<hr style="margin: 2rem 0; border: none; border-top: 1px solid #ddd;">
<div style="margin: 1.5rem 0;">
    <label for="jsonFileUpload" class="modal-button" style="display: inline-block;"><span style="margin-right:8px;">📁</span>JSON Datei Hochladen</label>
<input type="file" id="jsonFileUpload" accept=".json" style="display:none;">
    <small style="display: block; margin-top: 8px; color: #666;">Laden Sie eine JSON-Datei mit Spielerdaten hoch</small>
</div>
<hr style="margin: 2rem 0; border: none; border-top: 1px solid #ddd;">
<div style="margin: 1.5rem 0;">
    <h4 style="color: #6f42c1; margin-bottom: 1rem;">📝 Alternative 3: JSON Text Einfügen</h4>
    <textarea id="jsonTextInput" placeholder="JSON Daten hier einfügen..."
        style="width: 100%; height: 200px; font-family: 'Courier New', monospace; font-size: 12px; border: 1px solid #ddd; border-radius: 6px; padding: 10px; resize: vertical;"></textarea>
    <button id="processJsonText" class="modal-button">JSON Verarbeiten</button>
</div>
<hr style="margin: 2rem 0; border: none; border-top: 1px solid #ddd;">
<div style="margin: 1.5rem 0;">
    <h4 style="color: #fd7e14; margin-bottom: 1rem;">🔖 Alternative 4: Browser Bookmark (Einfachste Lösung)</h4>
    <p style="margin-bottom: 1rem;">Klicken Sie den Button zum Kopieren des erweiterten Bookmark-Codes:</p>
    <button id="copyBookmarkBtn" class="modal-button"><span style="margin-right:8px;">📋</span>Bookmark Code Kopieren</button>
    <div
        style="font-size: 12px; color: #666; background: #f8f9fa; padding: 10px; border-radius: 4px; margin-top: 10px;">
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

    setupModalEventListeners(modal) {
        const closeBtn = modal.querySelector('#closeModalBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (document.body.contains(modal)) {
                    document.body.removeChild(modal);
                }
            });
        }
        const copyBookmarkBtn = modal.querySelector('#copyBookmarkBtn');
        if (copyBookmarkBtn) {
            copyBookmarkBtn.addEventListener('click', async () => {
                const bookmarkCode = `javascript:void(function(){
var p=[];
var isQB = window.location.href.toLowerCase().includes('/qb.php');
document.querySelectorAll('tr.player-row').forEach(function(r){
    try{
        var c = r.querySelectorAll('td');
        if(c.length<6) return;
        var n = c[2].querySelector('.player-cell-name');
        if(!n) return;
        var t = c[2].querySelector('.player-cell-team');
        var position = isQB ? 'QB' : c[3].textContent.trim().replace(/[^A-Z]/gi, '');
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
        const downloadExtBtn = modal.querySelector('#downloadExtension');
        if (downloadExtBtn) {
            downloadExtBtn.addEventListener('click', () => this.showExtensionInstructions());
        }
        const fileUpload = modal.querySelector('#jsonFileUpload');
        if (fileUpload) {
            fileUpload.addEventListener('change', (e) => {
                this.handleJsonFile(e);
                if (document.body.contains(modal)) {
                    document.body.removeChild(modal);
                }
            });
        }
        const processBtn = modal.querySelector('#processJsonText');
        if (processBtn) {
            processBtn.addEventListener('click', () => {
                const jsonText = modal.querySelector('#jsonTextInput').value;
                if (jsonText.trim()) {
                    this.tracker.processJsonData(jsonText);
                    if (document.body.contains(modal)) {
                        document.body.removeChild(modal);
                    }
                } else {
                    alert('Bitte geben Sie JSON-Daten ein.');
                }
            });
        }

        const fetchEcrBtn = modal.querySelector('#fetchEcrData');
        if (fetchEcrBtn) {
            fetchEcrBtn.addEventListener('click', () => {
                console.log('fetchEcrBtn geklickt'); // Debug Log
                this.tracker.fetchEcrData();
                if (document.body.contains(modal)) {
                    document.body.removeChild(modal);
                }
            });
        }
        modal.addEventListener('click', (e) => {
            if (e.target === modal && document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        });
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                if (document.body.contains(modal)) {
                    document.body.removeChild(modal);
                }
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
   Die Dateien können Sie von GitHub kopieren: https://github.com/boesee/FproDraftTracker/tree/main/fpro-extension

3. Chrome: chrome://extensions/ → Entwicklermodus → "Entpackte Erweiterung laden"

4. Firefox: about:debugging → "Temporäres Add-on laden"

5. Gehen Sie zu einer FantasyPros Ranking-Seite und klicken Sie auf das Extension-Icon → "Extract Data"

6. Die Daten werden automatisch heruntergeladen und in die Zwischenablage kopiert.`);
    }

    renderTable(filteredPlayers, allPlayers) {
        const tbody = document.getElementById('playersTableBody');
        tbody.innerHTML = '';

        if (filteredPlayers.length === 0) {
            tbody.innerHTML = `
            <tr><td colspan="13" style="text-align: center; padding: 2rem;">
                ${allPlayers.length === 0 ? 'Keine Spielerdaten geladen.' : 'Keine Spieler entsprechen den Filtern.'}
            </td></tr>
        `;
            return;
        }

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
            <td class="rating-col">
                <span class="rating-display upside-stars" title="${upsideTooltip}">${this.renderStarRating(player.upside, 'upside')}</span>
            </td>
            <td class="rating-col">
                <span class="rating-display bust-stars" title="${bustTooltip}">${this.renderStarRating(player.bust, 'bust')}</span>
            </td>
            <td class="rating-col">
                <span class="rating-display matchup-stars" title="${matchupTooltip}">${this.renderStarRating(player.matchup, 'matchup')}</span>
            </td>
            <td class="stat-col">
                <span class="compact-stat">${this.formatStatValue(player.start_sit)}</span>
            </td>
            <td class="stat-col">
                <span class="compact-stat">${this.formatStatValue(player.proj_fpts)}</span>
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

    renderEmptyCell(value) {
        if (!value || value === '-' || value === '') {
            return '<span class="no-rating" title="Keine Bewertung">-</span>';
        }
    }

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
            return this.renderEmptyCell();
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

    updateStats(allPlayers) {
        const total = allPlayers.length;
        const drafted = allPlayers.filter(p => p.drafted).length;
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
        const successElement = document.getElementById('success');
        successElement.style.display = 'block';
        document.getElementById('successMessage').textContent = message;
        setTimeout(() => this.hideSuccess(), 3000);
    }

    /**
     * Blendet die Erfolgsmeldung aus.
     */
    hideSuccess() {
        const successElement = document.getElementById('success');
        if (successElement) successElement.style.display = 'none';
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
                (filters.positionFilter === "FLEX" && !["RB", "WR", "TE"].includes(player.position)) ||
                (filters.positionFilter !== "FLEX" && player.position !== filters.positionFilter)
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

    async handleJsonFile(event) {
        const file = event.target.files[0];
        if (!file) return;
        try {
            const text = await file.text();
            this.tracker.processJsonData(text);
        } catch (error) {
            this.showError(`Fehler beim Lesen der Datei: ${error.message}`);
        }
    }
}


