import { readFile } from 'node:fs/promises';

const CONFIG_PATH = new URL('../../config/app.json', import.meta.url);

// Reads the human-maintained config/app.json. `season`/`week` there
// override the auto-computed values in nflSchedule.mjs when set
// (non-null); a missing file or unset fields fall back to the automatic
// computation, so config/app.json is an optional override, not a
// requirement.
export async function loadConfig() {
  try {
    return JSON.parse(await readFile(CONFIG_PATH, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return {};
    throw err;
  }
}
