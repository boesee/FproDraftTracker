/**
 * FantasyPros Data Extractor für Firefox
 * --------------------------------------
 * Dieses Skript extrahiert Spielerdaten von der FantasyPros-Rankings-Seite.
 * Es bietet eine Schaltfläche zum Extrahieren und Downloaden der Daten als JSON
 * und kopiert sie zusätzlich in die Zwischenablage.
 */

/**
 * Extrahiert alle relevanten Spielerdaten aus der aktuellen Tabelle auf der Seite.
 * @returns {Array<Object>} Array mit Spielerobjekten
 */
function extractPlayersData() {
    const players = [];
    const rows = document.querySelectorAll('tr.player-row');
    const isQB = window.location.href.toLowerCase().includes('/qb.php');

    rows.forEach((row) => {
        try {
            const cells = row.querySelectorAll('td');
            if (cells.length < 3) return;

            const rank = parseInt(cells[0].textContent.trim());
            const playerLink = cells[2].querySelector('.player-cell-name');
            const teamSpan = cells[2].querySelector('.player-cell-team');
            if (!playerLink) return;

            const playerName = playerLink.textContent.trim();
            const team = teamSpan ? teamSpan.textContent.replace(/[()]/g, '') : '';
            const position = isQB ? 'QB' : cells[3].textContent.trim().replace(/\d+/g, '');
            const opponent = isQB ? cells[3].textContent.trim() : cells[4].textContent.trim();
            const upside = isQB ? cells[4].querySelectorAll('.mcu-rating-meter__segment.is-filled').length : cells[5].querySelectorAll('.mcu-rating-meter__segment.is-filled').length;
            const bust = isQB ? cells[5].querySelectorAll('.mcu-rating-meter__segment.is-filled').length : cells[6].querySelectorAll('.mcu-rating-meter__segment.is-filled').length;
            const matchup = isQB ? cells[6].querySelectorAll('.template-stars-star .fa-star.template-stars-star-filled').length : cells[7].querySelectorAll('.template-stars-star .fa-star.template-stars-star-filled').length;
            const startSit = isQB ? cells[7].textContent.trim() : '';
            const projFpts = isQB ? cells[8].textContent.trim() : '';
            const avgDiff = isQB ? cells[9]?.textContent.trim() || '' : cells[8]?.textContent.trim() || '';
            const percentOver = isQB ? cells[10]?.textContent.trim() || '' : cells[9]?.textContent.trim() || '';
            const opportunity = isQB ? cells[11]?.textContent.trim() || '' : cells[10]?.textContent.trim() || '';
            const efficiency = isQB ? cells[12]?.textContent.trim() || '' : cells[11]?.textContent.trim() || '';

            players.push({
                rank,
                player_name: playerName,
                position,
                team,
                opponent,
                upside,
                bust,
                matchup,
                start_sit: startSit,
                proj_fpts: projFpts,
                avgDiff,
                percentOver,
                opportunity,
                efficiency
            });
        } catch (error) {
            // Fehler beim Parsen einer Zeile - ignorieren, damit andere Spieler verarbeitet werden
        }
    });

    return players;
}

/**
 * Empfängt Nachrichten vom Popup und startet die Datenextraktion.
 */
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "extractData") {
        const data = extractPlayersData();
        sendResponse({ success: true, data: data, count: data.length });
    }
});

/**
 * Fügt eine Schaltfläche zum Extrahieren der Daten sichtbar auf der Seite hinzu.
 * Die Schaltfläche ermöglicht Download und Kopieren der extrahierten Daten.
 */
function injectExtractionButton() {
    const existingBtn = document.querySelector('#fp-extract-btn');
    if (existingBtn) existingBtn.remove();

    const button = document.createElement('button');
    button.id = 'fp-extract-btn';
    button.textContent = '📊 Daten extrahieren';
    button.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        background: #007bff;
        color: white;
        border: none;
        padding: 12px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: bold;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transition: all 0.3s ease;
    `;

    button.addEventListener('mouseenter', () => {
        button.style.background = '#0056b3';
        button.style.transform = 'translateY(-2px)';
    });

    button.addEventListener('mouseleave', () => {
        button.style.background = '#007bff';
        button.style.transform = 'translateY(0)';
    });

    button.addEventListener('click', async () => {
        button.textContent = '⏳ Extrahiere...';
        button.style.background = '#ffc107';
        button.style.color = '#000';

        try {
            const data = extractPlayersData();

            if (data.length === 0) {
                button.textContent = '❌ Keine Daten';
                button.style.background = '#dc3545';
                button.style.color = '#fff';
                setTimeout(() => {
                    button.textContent = '📊 Daten extrahieren';
                    button.style.background = '#007bff';
                    button.style.color = '#fff';
                }, 3000);
                return;
            }

            // Download als JSON-Datei
            const jsonString = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `fantasypros-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // Kopieren in die Zwischenablage
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(jsonString);
                } else {
                    const textArea = document.createElement('textarea');
                    textArea.value = jsonString;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                }
            } catch (clipboardError) {
                // Clipboard nicht verfügbar, Daten nur heruntergeladen
            }

            button.textContent = '✅ Heruntergeladen';
            button.style.background = '#28a745';
            button.style.color = '#fff';

            setTimeout(() => {
                button.textContent = '📊 Daten extrahieren';
                button.style.background = '#007bff';
                button.style.color = '#fff';
            }, 3000);

        } catch (error) {
            button.textContent = '❌ Fehler';
            button.style.background = '#dc3545';
            button.style.color = '#fff';

            setTimeout(() => {
                button.textContent = '📊 Daten extrahieren';
                button.style.background = '#007bff';
                button.style.color = '#fff';
            }, 3000);
        }
    });

    document.body.appendChild(button);
}

/**
 * Initialisiere die Schaltfläche bei Seitenaufruf.
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectExtractionButton);
} else {
    injectExtractionButton();
}

/**
 * Beobachtet das DOM und fügt die Schaltfläche erneut ein, wenn neue Inhalte geladen werden.
 */
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            const hasTable = Array.from(mutation.addedNodes).some(node =>
                node.nodeType === Node.ELEMENT_NODE &&
                (node.querySelector?.('.player-row') || node.classList?.contains('player-row'))
            );
            if (hasTable) {
                setTimeout(injectExtractionButton, 1000);
            }
        }
    });
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});