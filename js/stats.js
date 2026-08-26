// Player counts. Implements UC-004
// (docs/use_cases/UC-004-statistik-uebersicht-einsehen.md).
//
// BR-001: always computed from the full player list, independent of any
// UC-003 filters.
export function computeStats(players) {
  const total = players.length;
  const drafted = players.filter((p) => p.drafted).length;
  return { total, available: total - drafted, drafted };
}
