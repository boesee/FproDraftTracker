import { DraftUI } from '../ui.js';

describe('DraftUI Table Rendering', () => {
  let tracker, ui;

  beforeEach(() => {
    document.body.innerHTML = `
      <table>
        <thead id="playersTableHead"></thead>
        <tbody id="playersTableBody"></tbody>
      </table>
      <section id="playersTableSection"></section>
    `;

    tracker = {
      filteredPlayers: [
        { player_name: 'Max', rank: 1, position: 'QB', drafted: false, team: 'ABC' }
      ],
      allPlayers: [
        { player_name: 'Max', rank: 1, position: 'QB', drafted: false, team: 'ABC' }
      ]
    };
    ui = new DraftUI(tracker, { showSuccess: jest.fn(), showError: jest.fn() }, { debug: jest.fn() });
  });

  test('should render table head and player rows', () => {
    ui.renderTable(tracker.filteredPlayers, tracker.allPlayers);
    const thead = document.getElementById('playersTableHead');
    expect(thead.innerHTML).toContain('Spieler');
    const tbody = document.getElementById('playersTableBody');
    expect(tbody.innerHTML).toContain('Max');
  });
});