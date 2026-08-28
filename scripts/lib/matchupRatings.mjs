import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const MATCHUP_RATINGS_PATH = new URL('../../config/matchup-ratings.json', import.meta.url);
const MATCHUP_RATINGS_REPO_RELATIVE_PATH = 'config/matchup-ratings.json';

// EXCEPTION to this pipeline's "no scraping" design (see
// docs/architecture.md, "Matchup-Rating"): FantasyPros' matchup-
// favorability rating requires a logged-in session and isn't exposed by
// any API. Automating that login was deliberately rejected (credential
// exposure in Secrets, likely ToS violation, login flows are far more
// fragile than a plain page). Instead this reads a manually maintained
// snapshot: the repo owner periodically pastes the browser's
// `advancedMetrics` object (logged in, via DevTools:
// `copy(JSON.stringify(advancedMetrics))`) into
// config/matchup-ratings.json. A leading `//` comment line in that file
// (documenting the exact command above) is tolerated and stripped before
// parsing.
export async function loadMatchupRatings() {
  let raw;
  try {
    raw = await readFile(MATCHUP_RATINGS_PATH, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log('No config/matchup-ratings.json found, continuing without matchup ratings.');
      return {};
    }
    throw err;
  }

  try {
    const withoutLeadingComment = raw.replace(/^\s*\/\/.*(\r?\n|$)/, '');
    const advancedMetrics = JSON.parse(withoutLeadingComment);
    const ratings = {};
    for (const [playerId, entry] of Object.entries(advancedMetrics)) {
      const rating = parseFloat(entry?.matchup_rating?.rating);
      if (!Number.isNaN(rating)) {
        ratings[playerId] = rating;
      }
    }
    return ratings;
  } catch (err) {
    console.error('Could not parse config/matchup-ratings.json, continuing without matchup ratings:', err.message);
    return {};
  }
}

// The file itself carries no week/season tag (it's a raw copy-paste of
// FantasyPros' advancedMetrics), so freshness is derived from its last git
// commit date instead - lets the frontend warn if it wasn't refreshed for
// the current week (see js/rankings.js, describeMatchupRatingsFreshness).
// Requires full history (checkout with fetch-depth: 0); returns null on any
// failure (shallow clone, no git available, file never committed) so this
// stays a best-effort addition, not a pipeline-breaking one.
export function getMatchupRatingsUpdatedAt() {
  try {
    const repoRoot = fileURLToPath(new URL('../..', import.meta.url));
    const output = execFileSync(
      'git',
      ['log', '-1', '--format=%cI', '--', MATCHUP_RATINGS_REPO_RELATIVE_PATH],
      { cwd: repoRoot, encoding: 'utf8' }
    ).trim();
    return output || null;
  } catch (err) {
    console.error('Could not determine last commit date of config/matchup-ratings.json:', err.message);
    return null;
  }
}
