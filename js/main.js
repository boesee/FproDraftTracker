import AppConfig from './config.js';
import { Logger } from './logger.js';
import {MessageHandler} from './messageHandler.js';
import {FantasyDraftTracker} from './draft.js';
import {DraftUI} from './ui.js';

const logger = new Logger(AppConfig.debugMode);
const messages = new MessageHandler({ logger });
const tracker = new FantasyDraftTracker(AppConfig, logger);
const ui = new DraftUI(tracker, messages, logger);
tracker.ui = ui;

function initializeApp() {
    window.draftTracker = tracker;
    window.draftUI = ui;
    ui.initUI();
    tracker.loadDefaultEcrData();   // <--- Hier wird ECR-Daten geladen!
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

window.sortTable = function(field) {
    const tracker = window.draftTracker;
    if (tracker.sortField === field) {
        tracker.sortDirection = tracker.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        tracker.sortField = field;
        tracker.sortDirection = 'asc';
    }
    tracker.sortPlayers();
    tracker.applyFilters();
};