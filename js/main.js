import { FantasyDraftTracker } from './draft.js';
import { DraftUI } from './ui.js';

const tracker = new FantasyDraftTracker();
const ui = new DraftUI(tracker);
tracker.ui = ui;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.draftTracker = tracker;
        window.draftUI = ui;
        ui.initUI();
    });
} else {
    window.draftTracker = tracker;
    window.draftUI = ui;
    ui.initUI();
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