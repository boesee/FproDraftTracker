/**
 * Liest eine JSON-Datei als Text und parsed sie.
 * @param {File} file - File-Objekt vom File-Input
 * @param {Logger} [logger] - Optionaler zentraler Logger
 * @param {MessageHandler} [messages] - Optionaler MessageHandler für UI-Meldungen
 * @returns {Promise<object>} - Parsed JSON-Objekt
 */
export function readJsonFile(file, logger, messages) {
    return new Promise((resolve, reject) => {
        if (!file) {
            logger?.error('Keine Datei ausgewählt.');
            messages?.showError('Keine Datei ausgewählt.');
            reject(new Error('Keine Datei ausgewählt.'));
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const result = JSON.parse(event.target.result);
                logger?.debug('JSON-Datei erfolgreich gelesen.', result);
                resolve(result);
            } catch (err) {
                logger?.error('Ungültiges JSON:', err);
                messages?.showError('Ungültiges JSON: ' + err.message);
                reject(new Error('Ungültiges JSON: ' + err.message));
            }
        };
        reader.onerror = () => {
            logger?.error('Fehler beim Lesen der Datei.');
            messages?.showError('Fehler beim Lesen der Datei.');
            reject(new Error('Fehler beim Lesen der Datei.'));
        };
        reader.readAsText(file);
    });
}