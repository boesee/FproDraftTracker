export function currentNflSeason(now = new Date()) {
  // An NFL season labeled "YYYY" runs roughly Aug (YYYY) - Feb (YYYY+1).
  // From March onward, treat the current year as the upcoming season.
  const month = now.getUTCMonth(); // 0 = January
  return month >= 2 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
}

// Computes the current NFL week (1-18) so the `week` query param never
// needs manual, weekly upkeep. Week N runs from the Tuesday before its
// Thursday kickoff through the following Monday (the common "week rolls
// over on Tuesday" convention); anything before Week 1's Tuesday is
// clamped to 1 rather than treated as a separate "preseason" value, since
// drafts (and FantasyPros' Week 1 rankings) happen well before the actual
// Week 1 games. Anything past Week 18 is clamped to 18
// (late-season/offseason).
export function currentNflWeek(now = new Date()) {
  const season = currentNflSeason(now);

  // Labor Day = first Monday of September; the season's Week 1 kicks off
  // the following Thursday.
  const sept1 = new Date(Date.UTC(season, 8, 1));
  const daysToMonday = (8 - sept1.getUTCDay()) % 7;
  const laborDay = Date.UTC(season, 8, 1 + daysToMonday);
  const week1Thursday = laborDay + 3 * 24 * 60 * 60 * 1000;
  const week1Tuesday = week1Thursday - 2 * 24 * 60 * 60 * 1000;

  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const diff = now.getTime() - week1Tuesday;
  const week = Math.floor(diff / msPerWeek) + 1;
  return Math.min(Math.max(week, 1), 18);
}
