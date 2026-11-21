// Day or night. The site follows the device setting until the visitor picks one with the header switch;
// a pick that matches the device setting is not kept, so the site goes back to following the device.
// The inline script in index.html sets data-theme before the first paint; this keeps everything in step.
const preferenceKey = 'shuyu-portfolio-theme';
const deviceNight = window.matchMedia('(prefers-color-scheme: dark)');
const root = document.documentElement;
const deviceTheme = () => deviceNight.matches ? 'night' : 'day';
let preference = null;
try { preference = localStorage.getItem(preferenceKey); } catch { /* Device storage is optional. */ }
if (preference !== 'day' && preference !== 'night') preference = null;
export const getTheme = () => root.dataset.theme === 'night' ? 'night' : 'day';
// Night art: a <source data-night> in a <picture> shows only at night. Call this after adding markup that has one.
export function syncThemeArt(scope = document) {
  const night = getTheme() === 'night';
  scope.querySelectorAll('source[data-night]').forEach(source => { source.media = night ? 'all' : 'not all'; });
}

function applyTheme(theme) {
  const night = theme === 'night';
  root.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', getComputedStyle(root).getPropertyValue('--bg').trim());
  syncThemeArt();
  document.querySelectorAll('.theme-toggle').forEach(button => {
    const label = night ? 'Switch to day mode' : 'Switch to night mode';
    button.setAttribute('aria-label', label);
    button.title = label;
  });
  window.dispatchEvent(new CustomEvent('portfolio-theme-change', { detail: { theme } }));
}
export function initTheme() {
  document.querySelectorAll('.theme-toggle').forEach(button => button.addEventListener('click', () => {
    const next = getTheme() === 'night' ? 'day' : 'night';
    preference = next === deviceTheme() ? null : next;
    try {
      if (preference) localStorage.setItem(preferenceKey, preference);
      else localStorage.removeItem(preferenceKey);
    } catch { /* Continue without storage. */ }
    applyTheme(next);
  }));
  deviceNight.addEventListener('change', () => { if (!preference) applyTheme(deviceTheme()); });
  // The map pages have their own day and night themes; open them in the site's, keeping the rest of the link.
  const passTheme = event => {
    const link = event.target.closest?.('a[href^="flow-map/"], a[href^="cross-dock/"]');
    if (!link) return;
    const href = link.getAttribute('href');
    const url = new URL(href, location.href);
    url.searchParams.set('theme', getTheme());
    link.setAttribute('href', href.split(/[?#]/)[0] + url.search + url.hash);
  };
  document.addEventListener('click', passTheme, true);
  document.addEventListener('auxclick', passTheme, true);
  applyTheme(preference || deviceTheme());
}
