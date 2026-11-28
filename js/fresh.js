// Picks up a new version by itself. A TV app can sit open on the menu for days, so the page it loaded goes stale.
// Every few minutes, while the menu is showing, this asks the server whether the page's own files have changed.
// If so it refreshes the browser's copies of every file the page uses and reloads. Never during a game.
const KEYS = ['css/app.css', 'js/tv.js', 'js/ui.js', 'js/games/index.js'];
const tag = async u => { const r = await fetch(u, { method: 'HEAD', cache: 'no-store' }); return r.ok ? (r.headers.get('etag') || r.headers.get('last-modified') || '') : ''; };
export function watchFresh(idle, every = 180000) {
  if (new URLSearchParams(location.search).has('local')) return;
  let first = null, busy = false;
  const check = async () => {
    if (busy || document.hidden || !idle()) return; busy = true;
    try {
      const now = (await Promise.all(KEYS.map(tag))).join('|');
      if (!now.replace(/\|/g, '')) return;
      if (first === null) { first = now; return; }
      if (now === first || !idle()) return;
      const mine = performance.getEntriesByType('resource').map(e => e.name).filter(n => n.startsWith(location.origin) && /\.(js|css)(\?|$)/.test(n));
      await Promise.all([...new Set(mine)].map(u => fetch(u, { cache: 'reload' }).catch(() => {})));
      if (idle()) location.reload();
    } catch { /* offline: try again next time */ } finally { busy = false; }
  };
  check(); setInterval(check, every); document.addEventListener('visibilitychange', check);
}
