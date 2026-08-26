// Sleeper draft sync + player name matching. Implements UC-002
// (docs/use_cases/UC-002-draft-fortschritt-abgleichen.md).

const SUFFIX_PATTERN = /\s+(jr|sr|ii|iii|iv|v)\.?$/i;

// BR-002: case-, whitespace- and punctuation-insensitive comparison.
function normalize(value) {
  return (value || '')
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, '');
}

// BR-003: strip generational suffixes before comparing last names.
function stripGenerationalSuffix(lastName) {
  return (lastName || '').replace(SUFFIX_PATTERN, '').trim();
}

// BR-001 + BR-004: separate first/last name key; removing all non-word
// characters means hyphenated surnames (e.g. "Smith-Njigba") match their
// space-separated variant ("Smith Njigba") too.
function nameKey(firstName, lastName) {
  const first = normalize(firstName);
  const last = normalize(stripGenerationalSuffix(lastName));
  return { first, last, full: `${first}${last}` };
}

// BR-005: no fuzzy matching beyond BR-001..BR-004 - returns null (AF-3)
// when nothing matches.
function findMatchingPick(player, picks) {
  const playerKey = nameKey(player.first_name, player.last_name);
  return (
    picks.find((pick) => {
      const meta = pick.metadata;
      if (!meta?.first_name || !meta?.last_name) return false;
      const pickKey = nameKey(meta.first_name, meta.last_name);
      return (
        (playerKey.first === pickKey.first && playerKey.last === pickKey.last) ||
        playerKey.full === pickKey.full
      );
    }) ?? null
  );
}

export async function fetchDraftPicks(draftId) {
  const response = await fetch(`https://api.sleeper.app/v1/draft/${draftId}/picks`);
  if (!response.ok) {
    throw new Error(`Sleeper-API antwortete mit Status ${response.status}`);
  }
  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error('Unerwartetes Antwortformat von der Sleeper-API');
  }
  return data;
}

// UC-002 main flow, steps 4-5. Also reports which Sleeper picks found no
// matching player (AF-3), so mismatches can be diagnosed quickly instead
// of manually diffing the pick list against the rankings.
export function matchDraftedPlayers(players, picks) {
  const matchedPicks = new Set();
  let matched = 0;
  const result = players.map((player) => {
    const pick = findMatchingPick(player, picks);
    if (pick) {
      matched += 1;
      matchedPicks.add(pick);
    }
    return { ...player, drafted: Boolean(pick), draftInfo: pick };
  });

  const unmatchedPicks = picks.filter(
    (pick) => !matchedPicks.has(pick) && pick.metadata?.first_name && pick.metadata?.last_name
  );

  return { players: result, matched, unmatchedPicks };
}
