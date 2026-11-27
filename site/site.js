// Party Night website: the shared top bar and footer, plus the game catalog and pricing, all drawn from the
// same game list and pack list the app uses, so the site never falls out of date.
import { FREE, PACKS, PRICES, packOf } from '../js/packs.js';

const page = document.body.dataset.page;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => '$' + n.toFixed(2);

document.querySelector('#top').innerHTML = `<div class="wrapw">
  <a class="logo" href="./">Party <span>Night</span></a>
  <nav class="nav" aria-label="Site">${[['games.html', 'Games', 'games'], ['pricing.html', 'Pricing', 'pricing'], ['faq.html', 'Questions', 'faq']].map(([h, t, k]) => `<a href="${h}" ${page === k ? 'aria-current="page"' : ''}>${t}</a>`).join('')}</nav>
  <a class="btn small" href="../tv.html">Play free</a></div>`;
document.querySelector('#foot').innerHTML = `<div class="wrapw">
  <span class="sp">© ${new Date().getFullYear()} Toolshed Apps LLC</span>
  <a href="games.html">Games</a><a href="pricing.html">Pricing</a><a href="faq.html">Questions</a><a href="privacy.html">Privacy</a><a href="terms.html">Terms</a>
  <a href="mailto:support@toolshedapps.com">support@toolshedapps.com</a></div>`;

// The game list is the app's own module. It expects to run inside the game pages, so it is loaded on demand and a
// failure only costs the catalog, never the rest of the page.
async function games() {
  const { GAMES, SHELVES } = await import('../js/games/index.js');
  return { list: Object.entries(GAMES).map(([id, G]) => ({ id, ...G.meta, pack: packOf(id) })), SHELVES };
}
const facts = g => `<span class="tag">${g.min} to ${g.max} players</span>${g.mins ? `<span class="tag">About ${g.mins} min</span>` : ''}${g.mood ? `<span class="tag">${esc(g.mood)}</span>` : ''}${g.kids ? '<span class="tag">All ages</span>' : ''}`;
const card = g => `<article class="game" data-id="${g.id}" data-pack="${g.pack?.id || ''}" tabindex="0" role="button" aria-label="${esc(g.name)}: watch it play">
  <span class="gshot"><img src="../art/${g.id}.jpg" alt="" loading="lazy" width="400" height="300"><em>▶ Watch it play</em></span>
  <div class="gbody"><h3>${esc(g.name)}</h3><p>${esc(g.blurb)}</p>
  <div class="tags">${facts(g)}<span class="tag ${g.pack?.id === 'free' ? 'free' : 'inpack'}">${esc(g.pack?.name || '')}</span></div></div></article>`;

if (page === 'home') {
  const HEAD = ['funny', 'ducks', 'werewolf', 'bluff', 'sketch', 'trivia', 'whosaid', 'spin'];
  games().then(({ list }) => {
    document.querySelector('#count').textContent = list.length;
    document.querySelector('#headliners').innerHTML = HEAD.map(id => list.find(g => g.id === id)).filter(Boolean).map(card).join('');
  }).catch(() => {});
}

if (page === 'games') {
  games().then(({ list }) => {
    const groups = [['all', 'All games'], ['free', 'Free'], ...PACKS.map(p => [p.id, p.name.replace(' Pack', '')])];
    const bar = document.querySelector('#filters'), grid = document.querySelector('#grid');
    let on = new URLSearchParams(location.search).get('pack') || 'all';
    const draw = () => {
      bar.innerHTML = groups.map(([id, n]) => `<button aria-pressed="${on === id}" data-f="${id}">${esc(n)}</button>`).join('');
      const show = list.filter(g => on === 'all' || g.pack?.id === on).sort((a, b) => a.name.localeCompare(b.name));
      grid.innerHTML = show.map(card).join('');
      document.querySelector('#shown').textContent = `${show.length} game${show.length === 1 ? '' : 's'}`;
    };
    bar.addEventListener('click', e => { const f = e.target.closest('[data-f]'); if (f) { on = f.dataset.f; draw(); } });
    draw();
  }).catch(() => { document.querySelector('#grid').innerHTML = '<p class="note">The game list could not load. Try a refresh.</p>'; });
}

if (page === 'pricing') {
  const total = PACKS.length * PRICES.pack;
  for (const [k, v] of Object.entries({ pack: money(PRICES.pack), everything: money(PRICES.everything), month: money(PRICES.passMonth), year: money(PRICES.passYear), save: money(total - PRICES.everything), packs: PACKS.length, free: FREE.length }))
    document.querySelectorAll(`[data-p=${k}]`).forEach(el => (el.textContent = v));
  games().then(({ list }) => {
    const name = id => list.find(g => g.id === id)?.name || id;
    document.querySelectorAll('[data-p=count]').forEach(el => (el.textContent = list.length));
    document.querySelector('#freelist').textContent = FREE.map(name).join(', ');
    document.querySelector('#packs').innerHTML = PACKS.map(p => `<div class="pack"><div><h3>${esc(p.name)}</h3><p class="lead" style="font-size:16px">${esc(p.blurb)}</p></div>
      <div class="thumbs">${p.games.slice(0, 3).map(id => `<img src="../art/${id}.jpg" alt="" loading="lazy">`).join('')}</div>
      <ul>${p.games.map(id => `<li>${esc(name(id))}</li>`).join('')}</ul>
      <div class="cta"><b class="price" style="font-size:30px">${money(PRICES.pack)}</b><a class="btn ghost small" href="games.html?pack=${p.id}">See the ${p.games.length} games</a></div></div>`).join('');
  }).catch(() => {});
}

// Watch a game play: the real game, run by bots, in a frame. Opened from any game card; the frame is removed on close
// so nothing keeps running in the background.
const demoUrl = id => `../tv.html?local=1&demo=${encodeURIComponent(id)}`;
let dlg = null;
async function watch(id) {
  const { list } = await games(), g = list.find(x => x.id === id);
  if (!g) return;
  if (!dlg) {
    dlg = document.createElement('dialog'); dlg.className = 'watch'; document.body.append(dlg);
    dlg.addEventListener('close', () => { dlg.innerHTML = ''; });
    dlg.addEventListener('click', e => { if (e.target === dlg || e.target.closest('[data-close]')) dlg.close(); });
  }
  dlg.innerHTML = `<div class="winner"><button class="wclose" data-close aria-label="Close">×</button>
    <div class="screen"><iframe src="${demoUrl(id)}" title="${esc(g.name)} playing" loading="eager" tabindex="-1"></iframe><span class="live">Bots playing live</span></div>
    <div class="wtext"><p class="kick">${esc(g.pack?.name || '')}</p><h2>${esc(g.name)}</h2><p class="lead">${esc(g.blurb)}</p>
      <div class="tags">${facts(g)}${g.best ? `<span class="tag">Best with ${esc(g.best)}</span>` : ''}</div>
      ${g.how ? `<ol class="how">${g.how.map(h => `<li>${esc(h)}</li>`).join('')}</ol>` : ''}
      <div class="cta"><a class="btn" href="../tv.html">Play free</a><button class="btn ghost" data-close>Close</button></div></div></div>`;
  if (!dlg.open) dlg.showModal();
}
document.addEventListener('click', e => { const c = e.target.closest('.game[data-id]'); if (c) watch(c.dataset.id); });
document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('.game[data-id]')) { e.preventDefault(); watch(e.target.dataset.id); } });

// Home page: one game playing by itself, with a few to switch between. It starts when scrolled into view.
const live = document.querySelector('#live');
if (live) {
  const PICK = ['funny', 'ducks', 'bluff', 'sketch', 'trivia', 'werewolf'];
  games().then(({ list }) => {
    const tabs = live.querySelector('.livetabs'), frame = live.querySelector('.screen');
    const show = id => { frame.querySelector('iframe')?.remove(); frame.insertAdjacentHTML('afterbegin', `<iframe src="${demoUrl(id)}" title="A game playing" tabindex="-1"></iframe>`); tabs.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.id === id)); };
    tabs.innerHTML = PICK.map(id => list.find(g => g.id === id)).filter(Boolean).map(g => `<button data-id="${g.id}" aria-pressed="false">${esc(g.name)}</button>`).join('');
    tabs.addEventListener('click', e => { const b = e.target.closest('[data-id]'); if (b) show(b.dataset.id); });
    new IntersectionObserver((en, io) => { if (en.some(x => x.isIntersecting)) { io.disconnect(); show(PICK[0]); } }, { rootMargin: '200px' }).observe(live);
  }).catch(() => live.remove());
}
