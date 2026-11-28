// Caption This: a silly picture goes up on the TV. Everyone writes a caption for it, then everyone votes for the
// best one that is not their own. A vote is worth 100 to the writer, and the round's favorite gets a bonus.
import { esc } from '../ui.js';
import { isRude } from '../names.js';

export const meta = {
  id: 'caption',
  name: 'Caption This',
  min: 3,
  max: 10,
  blurb: 'A silly picture, and everyone writes the caption. Vote for the funniest.',
  ownReveal: true,   // this game holds its scores back itself until its reveal has played
};

// The pictures, as art/<name>.jpg, with a plain description (shown to nobody; it is here for whoever maintains the list).
export const PICS = [
  ['cap-01', 'a raccoon in a suit presenting a chart to pigeons'], ['cap-02', 'a T. rex failing to make a bed'], ['cap-03', 'a stressed cat doing paperwork'], ['cap-04', 'a job interview where the candidate is wearing a full suit of armor'],
  ['cap-06', 'an office meeting where a horse sits at the table and nobody mentions it'], ['cap-08', 'two astronauts on the moon staring at a parking ticket on their rover'], ['cap-09', 'a doctor showing a patient an x-ray with a rubber duck in it'],
  ['cap-05', 'a couple at a fancy restaurant; the waiter is presenting a single pea under a silver dome'], ['cap-07', 'a man asleep on a pool float drifting far out at sea past a lighthouse and a cargo ship'], ['cap-10', 'a wedding where the groom is checking his phone and the bride is checking hers'], ['cap-11', 'a firefighter up a tree while a cat on the ground watches'], ['cap-12', 'a pirate at an airport security checkpoint emptying hooks and swords into a tray'],
];
// Every planned picture is in. New ones follow the same style: a deadpan gag cartoon of an awkward moment, drier and
// more grown-up than a children's book, with no words in the picture. Add each to PICS once its file is in art/.
export const PLANNED = [];
export const EACH = 100, FAVORITE = 100;
export const TIMES = { write: 60000, vote: 25000, settle: 3400, after: 7000 };
const shuffle = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export function cleanCaption(t) { const x = String(t || '').replace(/\s+/g, ' ').trim().slice(0, 80); if (x.length < 2) return { ok: false, why: 'Write a few words.' }; if (isRude(x)) return { ok: false, why: 'Keep it family-friendly.' }; return { ok: true, text: x }; }
const BOT_LINES = ['Monday again.', 'Nobody told me about this in the interview.', 'This is fine. Everything is fine.', 'And that is when I knew I had made a mistake.', 'We do not talk about last time.', 'Nailed it.', 'I was told there would be snacks.', 'Day 3. They still suspect nothing.'];

export function setup(players, rnd = Math.random, prev = null, opts = {}) {
  const max = opts.short ? 3 : 4;
  let deck = (prev?.deck || []).slice(); if (deck.length < max) deck = shuffle(PICS.map((_, i) => i), rnd);
  const s = {
    game: 'caption', players: players.map(p => ({ pid: p.pid, name: p.name })), round: 0,
    scores: Object.fromEntries(players.map(p => [p.pid, 0])),
    pics: deck.splice(0, max), deck, n: 0, caps: {}, order: [], votes: {}, result: null, settled: false, settleAt: 0,
    phase: 'write', deadline: Date.now() + TIMES.write + 3000,
  };
  return s;
}
function toVote(s, now, rnd) {
  s.order = shuffle(Object.keys(s.caps), rnd);   // shown in a mixed-up order so nobody can tell whose is whose
  if (s.order.length < 2) return result(s, now);
  s.phase = 'vote'; s.round++; s.deadline = now + TIMES.vote;
}
function result(s, now) {
  const before = { ...s.scores }, tally = Object.fromEntries(s.order.map(p => [p, 0]));
  Object.values(s.votes).forEach(p => (tally[p] = (tally[p] || 0) + 1));
  const top = Math.max(0, ...Object.values(tally)), fav = top > 0 ? s.order.filter(p => tally[p] === top) : [];
  s.order.forEach(p => (s.scores[p] += tally[p] * EACH + (fav.includes(p) ? FAVORITE : 0)));
  s.result = { before, tally, fav };
  s.settled = false; s.settleAt = now + TIMES.settle;
  s.phase = 'result'; s.round++; s.deadline = s.settleAt + TIMES.after;
}
export function act(s, pid, a, now = Date.now(), rnd = Math.random) {
  if (!a || !s.players.some(p => p.pid === pid)) return s;
  if (s.phase === 'write' && a.type === 'caption' && !s.caps[pid]) {
    const r = cleanCaption(a.text); if (!r.ok) return s;
    s.caps[pid] = r.text; if (s.players.every(p => s.caps[p.pid])) toVote(s, now, rnd);
  } else if (s.phase === 'vote' && a.type === 'vote' && s.votes[pid] === undefined) {
    const k = Number(a.k), who = s.order[k]; if (!who || who === pid) return s;
    s.votes[pid] = who; if (s.players.every(p => s.votes[p.pid] !== undefined)) result(s, now);
  }
  return s;
}
export function hostAct(s, a, now = Date.now(), rnd = Math.random) {
  if (a !== 'next') return s;
  if (s.phase === 'write') toVote(s, now, rnd);
  else if (s.phase === 'vote') result(s, now);
  else if (s.phase === 'result') { if (s.n + 1 >= s.pics.length) { s.phase = 'over'; s.round++; s.deadline = 0; } else { s.n++; s.caps = {}; s.order = []; s.votes = {}; s.result = null; s.settled = false; s.phase = 'write'; s.round++; s.deadline = now + TIMES.write; } }
  return s;
}
export function tick(s, now = Date.now(), rnd = Math.random) {
  if (s.phase === 'result' && !s.settled && now >= s.settleAt) { s.settled = true; return s; }
  return s.deadline && now >= s.deadline ? hostAct(s, 'next', now, rnd) : s;
}
const nameOf = (s, pid) => (s.players.find(p => p.pid === pid) || {}).name || 'Someone';
const ranking = (s, sc = s.scores) => s.players.map(p => ({ pid: p.pid, name: p.name, score: sc[p.pid] })).sort((a, b) => b.score - a.score);
const say = (lines, k) => lines[((k % lines.length) + lines.length) % lines.length];   // the host does not say the same thing every round

export function narration(s) {
  if (s.phase === 'write') return s.n === 0 ? 'Welcome to Caption This! Here is a picture. Write the funniest caption you can.' : say(['Next picture. Caption it!', 'Another one. Make it funny.', 'New picture, new captions.', 'What is going on here? You tell us.'], s.n);
  if (s.phase === 'vote') return say(['The captions are in. Vote for the best one!', 'Read them all, then pick your favorite.', 'Which one made you laugh? Vote now.'], s.n);
  if (s.phase === 'result') { const f = s.result.fav.length; return !f ? 'No votes at all? Tough crowd.' : f > 1 ? 'A tie for favorite!' : say(['We have a favorite!', 'The room has spoken.', 'And that one wins the round.'], s.n); }
  if (s.phase === 'over') return 'And that is the game. Thanks for playing!';
  return '';
}
export function cue(s) {
  if (s.phase === 'write') return s.n === 0 ? { sound: 'fanfare', wait: 1500, title: 'Caption This', sub: 'Write the funniest caption' } : { sound: 'join', wait: 500 };
  if (s.phase === 'vote') return { sound: 'vote', wait: 300 };
  if (s.phase === 'result') return s.settled ? null : { sound: 'drumroll', wait: TIMES.settle - 400 };
  if (s.phase === 'over') return { sound: 'win', wait: 1500, title: 'Game Over', sub: `${ranking(s)[0].name} wins!`, tone: 'dawn', fx: 'confetti' };
  return null;
}
export function botAct(v, rnd = Math.random) {
  if (v.phase === 'write' && !v.done) return { type: 'caption', text: BOT_LINES[Math.floor(rnd() * BOT_LINES.length)] };
  if (v.phase === 'vote' && v.voted === null && v.options?.length) return { type: 'vote', k: v.options[Math.floor(rnd() * v.options.length)].k };
  return null;
}
export function tvView(s, now = Date.now()) {
  const held = s.phase === 'result' && !s.settled;
  const v = { phase: s.phase, n: s.n + 1, of: s.pics.length, left: Math.max(0, Math.ceil((s.deadline - now) / 1000)), scores: ranking(s, held ? s.result.before : s.scores) };
  if (s.phase === 'over') return v;
  v.pic = PICS[s.pics[s.n]][0];
  if (s.phase === 'write') v.players = s.players.map(p => ({ name: p.name, done: !!s.caps[p.pid] }));
  if (s.phase === 'vote') { v.caps = s.order.map(p => s.caps[p]); v.voted = Object.keys(s.votes).length; v.total = s.players.length; }
  if (s.phase === 'result') { v.settled = !!s.settled; v.rows = s.order.map(p => ({ text: s.caps[p], by: nameOf(s, p), votes: s.result.tally[p], fav: s.result.fav.includes(p), pts: s.result.tally[p] * EACH + (s.result.fav.includes(p) ? FAVORITE : 0) })).sort((a, b) => b.votes - a.votes); }
  return v;
}
export function phoneView(s, pid) {
  if (!s.players.some(p => p.pid === pid)) return { phase: 'spectate' };
  const held = s.phase === 'result' && !s.settled;
  const v = { phase: s.phase, n: s.n + 1, of: s.pics.length, score: held ? s.result.before[pid] : s.scores[pid] };
  if (s.phase !== 'over') v.pic = PICS[s.pics[s.n]][0];
  if (s.phase === 'write') v.done = !!s.caps[pid];
  if (s.phase === 'vote') { v.voted = s.votes[pid] === undefined ? null : s.order.indexOf(s.votes[pid]); v.options = s.order.map((p, k) => ({ k, text: s.caps[p], mine: p === pid })).filter(o => !o.mine); }
  if (s.phase === 'result') { v.settled = !!s.settled; if (s.settled) { v.votes = s.result.tally[pid] || 0; v.fav = s.result.fav.includes(pid); v.pts = v.votes * EACH + (v.fav ? FAVORITE : 0); v.wrote = !!s.caps[pid]; } }
  if (s.phase === 'over') { const r = ranking(s); v.place = r.findIndex(x => x.pid === pid) + 1; v.winner = r[0].name; }
  return v;
}

let revKey = '', revAt = 0;
const picHtml = pic => `<div class="cppic"><img src="art/${pic}.jpg" alt=""></div>`;
export function renderTV(v, el) {
  document.body.classList.toggle('day', true);
  const scores = `<div class="scores"><h3>Scores</h3>${v.scores.map(p => `<div class="srow"><span>${esc(p.name)}</span><b>${p.score.toLocaleString()}</b></div>`).join('')}</div>`;
  let h = '';
  if (v.phase === 'write') h = `<p class="cat">Picture ${v.n} of ${v.of} <span class="clock small ${v.left <= 10 ? 'hurry' : ''}">${v.left}</span></p><div class="cprow">${picHtml(v.pic)}<div class="cpside"><h2 class="cphead">What is the caption?</h2><p class="wsrule">Write it on your phone. Funniest wins.</p><div class="roster">${v.players.map(p => `<div class="chip ${p.done ? '' : 'waiting'}">${esc(p.name)}${p.done ? ' ✓' : ''}</div>`).join('')}</div></div></div><button class="btn ghost" data-host="next">Show the captions</button>`;
  if (v.phase === 'vote') h = `<p class="cat">Picture ${v.n} of ${v.of} · vote on your phone · ${v.voted} of ${v.total} <span class="clock small">${v.left}</span></p><div class="cprow">${picHtml(v.pic)}<div class="cpside"><div class="cpcaps">${v.caps.map((c, i) => `<div style="animation-delay:${i * 250}ms">“${esc(c)}”</div>`).join('')}</div></div></div><button class="btn ghost" data-host="next">Close voting</button>`;
  if (v.phase === 'result') {
    const key = 'r' + v.n, n = v.rows.length; if (revKey !== key) { revKey = key; revAt = Date.now(); import('../sfx.js').then(m => { v.rows.forEach((r, i) => setTimeout(() => m.play(i === 0 && r.votes ? 'win' : r.votes ? 'points' : 'pop'), 500 + (n - 1 - i) * 450)); if (v.rows[0]?.votes) setTimeout(() => m.play('laugh'), 800 + n * 450); }).catch(() => {}); }
    const el0 = Date.now() - revAt;   // the list fills from the bottom, so the favorite lands last
    h = `<p class="cat">Picture ${v.n} of ${v.of}</p><div class="cprow">${picHtml(v.pic)}<div class="cpside"><div class="cpcaps res">${v.rows.map((r, i) => `<div class="${r.fav ? 'fav' : ''}" style="animation-delay:${500 + (n - 1 - i) * 450 - el0}ms"><span>“${esc(r.text)}”</span><small>${esc(r.by)} · ❤️ ${r.votes}${r.fav ? ' · favorite' : ''}</small><em>${r.pts ? '+' + r.pts : ''}</em></div>`).join('') || '<div><span>Nobody wrote a caption!</span></div>'}</div></div></div><button class="btn" data-host="next">${v.n < v.of ? 'Next picture' : 'Finish'}</button>`;
  }
  if (v.phase === 'over') h = `<h2 class="win">${esc(v.scores[0].name)} wins!</h2><div class="podium">${v.scores.slice(0, 3).map((p, i) => `<div class="pod p${i + 1}"><b>${esc(p.name)}</b><span>${p.score.toLocaleString()}</span></div>`).join('')}</div><div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`;
  el.innerHTML = `<div class="stage ${v.fresh ? 'enter' : ''}"><div class="panel cp">${h}</div>${scores}</div>`;
}
let typed = { key: '', text: '' };
export function renderPhone(v, el, send) {
  if (v.phase === 'spectate') { el.innerHTML = '<h2>Game in progress</h2><p>You\'ll join the next game.</p>'; return; }
  if (v.phase === 'over') { el.innerHTML = `<h2 class="${v.place === 1 ? 'win' : ''}">${v.place === 1 ? 'You won! 🏆' : `${esc(v.winner)} wins`}</h2><p class="say">You finished ${['1st', '2nd', '3rd'][v.place - 1] || v.place + 'th'} with ${v.score.toLocaleString()} points.</p>`; return; }
  const pic = `<img class="cpthumb" src="art/${v.pic}.jpg" alt="">`;
  if (v.phase === 'result') { el.innerHTML = !v.settled ? '<h2>Watch the TV…</h2>' : `<h2 class="${v.pts ? 'win' : ''}">${!v.wrote ? 'No caption from you' : v.fav ? `The favorite! +${v.pts}` : v.votes ? `❤️ ${v.votes} · +${v.pts}` : 'No votes this time'}</h2><p class="muted">${v.score.toLocaleString()} points</p>`; return; }
  if (v.phase === 'vote') {
    el.innerHTML = v.voted !== null ? '<h2>Vote in ❤️</h2><p class="say">Waiting for everyone else…</p>' : `${pic}<h2>Which caption is best?</h2><p class="muted">Not your own.</p><div class="opts">${v.options.map(o => `<button class="opt" data-k="${o.k}">${esc(o.text)}</button>`).join('')}</div>`;
    el.querySelectorAll('[data-k]').forEach(b => (b.onclick = () => send({ type: 'vote', k: +b.dataset.k })));
    return;
  }
  if (v.done) { el.innerHTML = '<h2>Sent ✓</h2><p class="say">Waiting for everyone else…</p>'; return; }
  const key = 'c' + v.n; if (typed.key !== key) typed = { key, text: '' };
  if (el.querySelector('#cpf') && el.dataset.cp === key) return;   // typing is never interrupted by a redraw
  el.dataset.cp = key;
  el.innerHTML = `${pic}<h2>Write a caption</h2><form id="cpf"><textarea id="cpt" maxlength="80" rows="3" placeholder="What is going on here?">${esc(typed.text)}</textarea><p class="lose" id="err"></p><button class="btn" type="submit">Send</button></form>`;
  const f = el.querySelector('#cpf'), t = f.querySelector('#cpt'); t.oninput = () => { typed.text = t.value; };
  f.onsubmit = e => { e.preventDefault(); const r = cleanCaption(t.value); if (!r.ok) { f.querySelector('#err').textContent = r.why; return; } f.querySelector('button').disabled = true; delete el.dataset.cp; send({ type: 'caption', text: r.text }); };
}
