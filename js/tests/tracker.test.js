import { FantasyDraftTracker } from '../draft.js';

describe('FantasyDraftTracker', () => {
    let tracker;

    beforeEach(() => {
        tracker = new FantasyDraftTracker({ debugMode: false }, { debug: jest.fn(), error: jest.fn(), info: jest.fn() });
        tracker.ui = {
            applyFilters: jest.fn(),
            updateStats: jest.fn(),
            showSuccess: jest.fn(),
            showError: jest.fn()
        };
    });

    test('should parse valid JSON and populate allPlayers', () => {
        const jsonString = JSON.stringify([
            { player_name: 'Max Mustermann', rank: 1, position: 'QB', team: 'ABC', drafted: false }
        ]);
        const result = tracker.processJsonData(jsonString);

        expect(result).toBe(true);
        expect(tracker.allPlayers.length).toBe(1);
        expect(tracker.allPlayers[0].player_name).toBe('Max Mustermann');
    });

    test('should handle invalid JSON gracefully', () => {
        const invalidJsonString = '{"player_name": "Max Mustermann",';
        const result = tracker.processJsonData(invalidJsonString);

        expect(result).toBeInstanceOf(Error);
        expect(tracker.allPlayers.length).toBe(0);
    });
});