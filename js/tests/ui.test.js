import { DraftUI } from '../ui.js';

describe('DraftUI Filterlogik', () => {
    let tracker, ui;

    beforeEach(() => {
        document.body.innerHTML = `
    <table>
      <thead id="playersTableHead"></thead>
      <tbody id="playersTableBody"></tbody>
    </table>
    <section id="playersTableSection"></section>
    <span id="totalPlayers"></span>
    <span id="availablePlayers"></span>
    <span id="draftedPlayers"></span>
  `;
        tracker = {
            allPlayers: [
                { player_name: 'Max', rank: 1, position: 'QB', drafted: false, team: 'ABC' },
                { player_name: 'Moritz', rank: 2, position: 'RB', drafted: true, team: 'DEF' }
            ],
            filteredPlayers: []
        };
        ui = new DraftUI(tracker, { showSuccess: jest.fn(), showError: jest.fn(), info: jest.fn() }, { debug: jest.fn() });

        ui.getFiltersFromUI = jest.fn(() => ({
            positionFilter: 'QB',
            rankFilter: '',
            draftedFilter: '',
            playerSearch: ''
        }));
    });

    test('should filter by position', () => {
        ui.applyFilters();
        expect(tracker.filteredPlayers.length).toBe(1);
        expect(tracker.filteredPlayers[0].position).toBe('QB');
    });
});