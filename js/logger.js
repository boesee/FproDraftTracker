export class Logger {
    constructor(debugMode = false) {
        this.debugMode = debugMode;
    }

    info(message, ...details) {
        if (this.debugMode) {
            console.info('[INFO]', message, ...details);
        }
    }

    error(message, ...details) {
        // Fehler sollen immer ausgegeben werden, auch ohne Debug-Mode
        console.error('[ERROR]', message, ...details);
    }

    debug(message, ...details) {
        if (this.debugMode) {
            console.log('[DEBUG]', message, ...details);
        }
    }
}