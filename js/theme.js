// Manual light/dark switch, layered on top of Pico's automatic
// prefers-color-scheme support. index.html leaves data-theme unset by
// default, so the OS/browser preference wins live until the user
// overrides it here; the override is then pinned and remembered
// per-browser via localStorage.

const STORAGE_KEY = 'theme-preference';

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function readStoredTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null; // private browsing / storage disabled - fall back to system
  }
}

function writeStoredTheme(theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Ignore - the toggle still works for this page load, it just won't
    // be remembered on the next visit.
  }
}

export function initThemeToggle(toggleEl) {
  const stored = readStoredTheme();
  // Only pin data-theme when the user has actually made a choice; leaving
  // it unset otherwise keeps following the OS preference live.
  if (stored) {
    document.documentElement.setAttribute('data-theme', stored);
  }
  toggleEl.checked = (stored ?? getSystemTheme()) === 'dark';

  toggleEl.addEventListener('change', () => {
    const theme = toggleEl.checked ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    writeStoredTheme(theme);
  });
}
