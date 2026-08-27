// Loads the human-maintained config.json at the repo root (draftId,
// and the same season/week overrides scripts/update-rankings.mjs reads).
// Missing file or fields fall back to sensible defaults - config.json is
// optional, not required for the app to function.

const CONFIG_URL = 'config.json';

export async function loadConfig() {
  try {
    const response = await fetch(CONFIG_URL, { cache: 'no-store' });
    if (!response.ok) return {};
    return await response.json();
  } catch {
    return {};
  }
}
