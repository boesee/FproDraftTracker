// Player list filtering/search. Implements UC-003
// (docs/use_cases/UC-003-spielerliste-filtern-durchsuchen.md).

const FLEX_POSITIONS = ['RB', 'WR', 'TE'];
const COLUMN_SEARCH_PATTERN = /^([a-z_]+):(.*)$/i;

// Lets a friendlier search token stand in for the actual PLAYER field name
// (see entity_model.md) - "injury:q" reads better than "injurystatusshort:q".
const COLUMN_ALIASES = { injury: 'injuryStatusShort' };

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

  return players.filter((player) => {
    // BR-007: "MYTEAM" (the "Mein Team" pill) is a different kind of
    // filter than the other position pills - it doesn't look at
    // `player.position` at all, only at whether Sleeper recorded this
    // player as picked by the configured user. `picked_by` (a Sleeper
    // user_id) is used rather than `roster_id`, since roster_id is
    // reassigned per draft (this league re-draws weekly), while
    // picked_by/user_id stays constant across every week's draft.
    if (filters.position === 'MYTEAM') {
      if (!player.drafted || !filters.myUserId || player.draftInfo?.picked_by !== filters.myUserId) return false;
    } else if (filters.position) {
      // BR-003: "FLEX" includes any player whose position contains RB/WR/TE.
      const matchesFlex =
        filters.position === 'FLEX' && FLEX_POSITIONS.some((pos) => player.position.includes(pos));
      const matchesExact = filters.position !== 'FLEX' && player.position.includes(filters.position);
      if (!matchesFlex && !matchesExact) return false;
    }

    if (filters.draftStatus === 'available' && player.drafted) return false;
    if (filters.draftStatus === 'drafted' && !player.drafted) return false;

    // BR-006: `rank:` is a numeric "at most this rank" filter (replaces
    // the old dedicated Maximaler-Rang input) rather than a substring
    // match on the other spalte:wert tokens below. An unparseable value
    // (e.g. "rank:abc") is ignored gracefully, same as the old input's
    // BR-005 behavior, instead of matching zero players.
    if (column === 'rank') {
      const maxRank = parseInt(value, 10);
      return Number.isNaN(maxRank) || player.rank <= maxRank;
    }

    if (column) {
      // BR-002: an unknown column means no match - no fallback to
      // full-text search.
      const field = COLUMN_ALIASES[column] ?? column;
      if (!Object.prototype.hasOwnProperty.call(player, field)) return false;
      return String(player[field] ?? '').toLowerCase().includes(value);
    }

    if (value) {
      const haystack = Object.values(player).map((v) => String(v ?? '').toLowerCase());
      if (!haystack.some((v) => v.includes(value))) return false;
    }

    // BR-004: all active criteria above are combined with AND.
    return true;
  });
}
