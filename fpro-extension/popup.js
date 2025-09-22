/**
 * Steuert die Benutzerinteraktion im Popup der Extension.
 * Führt die Extraktion der Spielerdaten nach Klick aus, prüft die aktive Seite
 * und zeigt Statusmeldungen im Popup an.
 */
document.addEventListener('DOMContentLoaded', function() {
    const extractBtn = document.getElementById('extractBtn');
    const status = document.getElementById('status');

    /**
     * Event-Handler für den Extrahieren-Button.
     * Sendet eine Anfrage an das Content Script im aktiven Tab,
     * lädt die extrahierten Daten als JSON herunter und zeigt Feedback an.
     */
    extractBtn.addEventListener('click', function() {
        extractBtn.disabled = true;
        extractBtn.textContent = '⏳ Extrahiere...';
        status.innerHTML = '';

        browser.tabs.query({active: true, currentWindow: true}).then(function(tabs) {
            const currentTab = tabs[0];

            // Prüft, ob die aktuelle Seite eine FantasyPros-Seite ist
            if (!currentTab.url.includes('fantasypros.com')) {
                status.innerHTML = `<div class="error">❌ Bitte öffnen Sie zuerst eine FantasyPros-Rankings-Seite.</div>`;
                extractBtn.disabled = false;
                extractBtn.textContent = '📊 Spielerdaten extrahieren';
                return;
            }

            // Nachricht an das Content Script senden
            browser.tabs.sendMessage(currentTab.id, {action: "extractData"})
                .then(function(response) {
                    extractBtn.disabled = false;
                    extractBtn.textContent = '📊 Spielerdaten extrahieren';

                    if (response && response.success) {
                        const data = response.data;
                        if (data.length > 0) {
                            status.innerHTML = `<div class="success">✅ ${data.length} Spieler extrahiert!<br>Daten als JSON heruntergeladen.</div>`;

                            // JSON-Datei herunterladen
                            const jsonString = JSON.stringify(data, null, 2);
                            const blob = new Blob([jsonString], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);

                            browser.downloads.download({
                                url: url,
                                filename: `fantasypros-data-${new Date().toISOString().split('T')[0]}.json`
                            }).then(() => {
                                URL.revokeObjectURL(url);
                            });

                        } else {
                            status.innerHTML = `<div class="error">❌ Keine Spielerdaten gefunden. Stellen Sie sicher, dass eine Rankings-Tabelle geladen ist.</div>`;
                        }
                    } else {
                        status.innerHTML = `<div class="error">❌ Extraktion fehlgeschlagen. Bitte erneut versuchen.</div>`;
                    }
                })
                .catch(function(error) {
                    extractBtn.disabled = false;
                    extractBtn.textContent = '📊 Spielerdaten extrahieren';
                    status.innerHTML = `<div class="error">❌ Fehler: ${error.message}</div>`;
                });
        });
    });
});