// Player list filtering/search. Implements UC-003
// (docs/use_cases/UC-003-spielerliste-filtern-durchsuchen.md).

const FLEX_POSITIONS = ['RB', 'WR', 'TE'];
const COLUMN_SEARCH_PATTERN = /^([a-z_]+):(.*)$/i;

// BR-002: `column:value` targets one field; anything else falls back to
// full-text search (BR-001).
function parseSearch(searchTerm) {
  const trimmed = (searchTerm || '').trim();
  const match = trimmed.match(COLUMN_SEARCH_PATTERN);
  if (!match) return { column: null, value: trimmed.toLowerCase() };
  return { column: match[1].toLowerCase(), value: match[2].trim().toLowerCase() };
}

export function applyFilters(players, filters) {
  const { column, value } = parseSearch(filters.search);
  const maxRank = parseInt(filters.maxRank, 10); // BR-005: NaN => ignored below

  return players.filter((player) => {
    // BR-003: "FLEX" includes any player whose position contains RB/WR/TE.
    if (filters.position) {
      const matchesFlex =
        filters.position === 'FLEX' && FLEX_POSITIONS.some((pos) => player.position.includes(pos));
      const matchesExact = filters.position !== 'FLEX' && player.position.includes(filters.position);
      if (!matchesFlex && !matchesExact) return false;
    }

    if (!Number.isNaN(maxRank) && player.rank > maxRank) return false;

    if (filters.draftStatus === 'available' && player.drafted) return false;
    if (filters.draftStatus === 'drafted' && !player.drafted) return false;

    if (column) {
      // BR-002: an unknown column means no match - no fallback to
      // full-text search.
      if (!Object.prototype.hasOwnProperty.call(player, column)) return false;
      return String(player[column] ?? '').toLowerCase().includes(value);
    }

    if (value) {
      const haystack = Object.values(player).map((v) => String(v ?? '').toLowerCase());
      if (!haystack.some((v) => v.includes(value))) return false;
    }

    // BR-004: all active criteria above are combined with AND.
    return true;
  });
}
