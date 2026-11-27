// Bomb Squad: a co-op game. The bomb is on the TV for everyone to see. The rules for which wire to cut
// are split up across the phones, so you have to read them out loud and work it out together.
// Only the cutter can cut. Three mistakes and it's over. (Bomb Corp / Keep Talking-style, our own rules.)
import { esc } from '../ui.js';

export const meta = {
  id: 'bomb',
  name: 'Bomb Squad',
  min: 2,
  max: 8,
  blurb: 'Co-op: everyone holds part of the manual. Talk fast, cut the right wire.',
};

export const COLORS = { red: '#e2473b', blue: '#3f7fe0', yellow: '#f2b21d', white: '#f4f1e6', black: '#1d1f2e', green: '#3fa34d' };
const CNAMES = Object.keys(COLORS);
const LIGHTS = ['red', 'blue', 'green'];
const ORD = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth'];
export const BOMBS = 6, STRIKES = 3;
export const TIMES = { brief: 8000, defuse: 90000, result: 5000 };
const pick = (a, rnd) => a[Math.floor(rnd() * a.length)];

export function makeBomb(rnd = Math.random, level = 0) {
  const n = Math.min(6, 3 + Math.floor(rnd() * 2) + Math.floor(level / 2));
  const wires = Array.from({ length: n }, () => pick(CNAMES, rnd));
  const serial = String(Math.floor(rnd() * 900) + 100);
  const light = pick(LIGHTS, rnd);
  const count = c => wires.filter(w => w === c).length;
  const lastOf = c => wires.lastIndexOf(c);
  // Rule templates: each returns {text, test, cut}. The first rule that applies wins.
  const T = [
    () => { const c = pick(CNAMES, rnd), k = Math.floor(rnd() * n); return { text: `If there are no ${c} wires, cut the ${ORD[k]} wire.`, test: () => !count(c), cut: () => k }; },
    () => { const c = pick(CNAMES, rnd); return { text: `If there is exactly one ${c} wire, cut it.`, test: () => count(c) === 1, cut: () => wires.indexOf(c) }; },
    () => { const c = pick(CNAMES, rnd); return { text: `If the last wire is ${c}, cut the first wire.`, test: () => wires[n - 1] === c, cut: () => 0 }; },
    () => { const c = pick(CNAMES, rnd), m = 1 + Math.floor(rnd() * 2); return { text: `If there are more than ${m} ${c} wires, cut the last ${c} wire.`, test: () => count(c) > m, cut: () => lastOf(c) }; },
    () => { const k = Math.floor(rnd() * n); return { text: `If the serial number ends in an odd digit, cut the ${ORD[k]} wire.`, test: () => Number(serial.at(-1)) % 2 === 1, cut: () => k }; },
    () => { const l = pick(LIGHTS, rnd), k = Math.floor(rnd() * n); return { text: `If the light is ${l}, cut the ${ORD[k]} wire.`, test: () => light === l, cut: () => k }; },
    () => { const c = pick(CNAMES, rnd), d = pick(CNAMES.filter(x => x !== c), rnd); return { text: `If there are more ${c} wires than ${d} wires, cut the last wire.`, test: () => count(c) > count(d), cut: () => n - 1 }; },
  ];
  // Bomb 1 is a training bomb: fewer rules, and the timer is generous.
  const rules = Array.from({ length: level === 0 ? 2 : 4 + Math.min(2, Math.floor(level / 2)) }, () => pick(T, rnd)());
  const k = Math.floor(rnd() * n);
  rules.push({ text: `Otherwise, cut the ${ORD[k]} wire.`, test: () => true, cut: () => k });
  const answer = rules.find(r => r.test()).cut();
  return { wires, serial, light, rules: rules.map(r => r.text), answer };
}

const shuffle = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export function setup(players, rnd = Math.random) {
  const s = { game: 'bomb', players: shuffle(players.map(p => ({ pid: p.pid, name: p.name })), rnd), b: 0, defused: 0, strikes: 0, round: 0, log: [] };
  brief(s, Date.now(), rnd);
  return s;
}
function brief(s, now, rnd) {
  s.bomb = makeBomb(rnd, s.b);
  s.cutter = s.players[s.b % s.players.length].pid;
  const readers = s.players.length > 1 ? s.players.filter(p => p.pid !== s.cutter) : s.players;
  s.hands = Object.fromEntries(s.players.map(p => [p.pid, []]));
  s.bomb.rules.forEach((_, i) => s.hands[readers[i % readers.length].pid].push(i));
  s.cut = null; s.phase = 'brief'; s.round++; s.deadline = now + TIMES.brief;
}
const nameOf = (s, pid) => (s.players.find(p => p.pid === pid) || {}).name || 'Someone';

function result(s, now, ok, why) {
  if (ok) s.defused++; else s.strikes++;
  s.log.push(ok ? '✅' : '💥');
  s.last = { ok, why, answer: s.bomb.answer, cut: s.cut };
  s.phase = 'result'; s.round++; s.deadline = now + TIMES.result;
}
export function act(s, pid, a, now = Date.now()) {
  if (!a || s.phase !== 'defuse' || pid !== s.cutter || a.type !== 'cut') return s;
  const i = Number(a.i);
  if (!(i >= 0 && i < s.bomb.wires.length)) return s;
  s.cut = i;
  result(s, now, i === s.bomb.answer, i === s.bomb.answer ? 'right' : 'wrong');
  return s;
}
export function hostAct(s, a, now = Date.now(), rnd = Math.random) {
  if (a !== 'next') return s;
  if (s.phase === 'brief') { s.phase = 'defuse'; s.round++; s.deadline = now + (s.b === 0 ? 150000 : Math.max(45000, TIMES.defuse - s.b * 8000)); }
  else if (s.phase === 'defuse') result(s, now, false, 'time');
  else if (s.phase === 'result') {
    s.b++;
    if (s.strikes >= STRIKES || s.b >= BOMBS) { s.phase = 'over'; s.round++; s.deadline = 0; }
    else brief(s, now, rnd);
  }
  return s;
}
export function tick(s, now = Date.now(), rnd = Math.random) { return s.deadline && now >= s.deadline ? hostAct(s, 'next', now, rnd) : s; }

export function narration(s) {
  if (s.phase === 'brief') return s.b === 0 ? `Bomb Squad! You are all one team. The bomb is on the TV. Each of your phones has some of the rules. Read them out loud. The first rule that applies is the one to follow. ${nameOf(s, s.cutter)} is the only one who can cut.` : `Bomb ${s.b + 1}. ${nameOf(s, s.cutter)} has the cutters.`;
  if (s.phase === 'defuse') return 'The timer is running. Talk it out!';
  if (s.phase === 'result') return s.last.ok ? 'Defused! Nice work, team.' : s.last.why === 'time' ? 'Out of time! Boom.' : 'Wrong wire! Boom!';
  if (s.phase === 'over') return s.strikes >= STRIKES ? `Three strikes. The squad defused ${s.defused} bombs.` : `All done! The squad defused ${s.defused} of ${BOMBS} bombs!`;
  return '';
}
export function cue(s) {
  if (s.phase === 'brief') return { sound: 'join', wait: 600, title: s.b === 0 ? 'Bomb Squad' : `Bomb ${s.b + 1}`, sub: `${nameOf(s, s.cutter)} cuts` };
  if (s.phase === 'defuse') return { sound: 'drumroll', wait: 300, ambient: 'buzz' };
  if (s.phase === 'result') return { sound: s.last.ok ? 'win' : 'death', wait: 300, title: s.last.ok ? 'Defused!' : 'BOOM!', tone: s.last.ok ? 'dawn' : 'blood', fx: s.last.ok ? 'confetti' : 'claws' };
  if (s.phase === 'over') return { sound: s.defused >= 4 ? 'win' : 'lose', wait: 1200, title: `${s.defused} / ${BOMBS} defused`, sub: s.defused >= 5 ? 'Elite squad!' : s.defused >= 3 ? 'Solid work' : 'Back to training…', tone: 'dawn', fx: s.defused >= 4 ? 'confetti' : null };
  return null;
}
export function botAct(v, rnd = Math.random) {
  if (v.phase === 'defuse' && v.isCutter && v._a !== undefined && rnd() < 0.2) return { type: 'cut', i: rnd() < 0.8 ? v._a : Math.floor(rnd() * v.wires.length) };
  return null;
}

const bombView = s => ({ wires: s.bomb.wires, serial: s.bomb.serial, light: s.bomb.light });
export function tvView(s, now = Date.now()) {
  const v = { phase: s.phase, b: s.b + 1, of: BOMBS, defused: s.defused, strikes: s.strikes, log: s.log, cutter: nameOf(s, s.cutter), left: Math.max(0, Math.ceil((s.deadline - now) / 1000)), nRules: s.bomb.rules.length, ...bombView(s) };
  if (s.phase === 'result' || s.phase === 'over') { v.last = s.last; v.rules = s.bomb.rules; }
  return v;
}
export function phoneView(s, pid) {
  if (!s.hands?.[pid]) return { phase: 'spectate' };
  const v = { phase: s.phase, round: s.round, isCutter: pid === s.cutter, cutter: nameOf(s, s.cutter), rules: s.hands[pid].map(i => ({ n: i + 1, text: s.bomb.rules[i] })), strikes: s.strikes, defused: s.defused, ...bombView(s) };
  if (String(pid).startsWith('bot-')) v._a = s.bomb.answer;
  if (s.phase === 'result') v.last = s.last;
  return v;
}

const wiresHTML = (v, tap, cut, answer) => `<div class="bwires">${v.wires.map((c, i) => `<${tap ? 'button' : 'div'} class="bwire ${cut === i ? 'cut' : ''} ${answer === i ? 'answer' : ''}" style="--c:${COLORS[c]}" ${tap ? `data-cut="${i}"` : ''}><small>${i + 1}</small><span></span><em>${c}</em></${tap ? 'button' : 'div'}>`).join('')}</div>`;
export function renderTV(v, el) {
  document.body.classList.toggle('night', v.phase === 'defuse');
  const head = `<div class="bhead"><span>Bomb ${Math.min(v.b, v.of)} of ${v.of}</span><span>${v.log.join(' ') || '—'}</span><span>Strikes: ${'❌'.repeat(v.strikes)}${'▫️'.repeat(Math.max(0, STRIKES - v.strikes))}</span></div>`;
  const bomb = `<div class="bbox"><div class="bpanel"><div class="blight" style="--c:${COLORS[v.light]}"></div><div class="bserial">SERIAL ${esc(v.serial)}</div>${v.phase === 'defuse' ? `<div class="btimer ${v.left <= 15 ? 'hurry' : ''}"><span class="clock">${v.left}</span></div>` : ''}</div>${wiresHTML(v, false, v.last?.cut, v.phase === 'result' ? v.last.answer : null)}</div>`;
  let h = head;
  if (v.phase === 'brief') h += `${v.b === 1 ? '<p class="cat">Training bomb: take your time and learn how the rules work.</p>' : ''}<h2>${esc(v.cutter)} has the cutters</h2>${bomb}<p class="say">Everyone else: your phones have rules numbered 1 to ${v.nRules}. Read them out loud <b>in order</b>. The first rule that's true tells ${esc(v.cutter)} which wire to cut.</p><button class="btn" data-host="next">Start the timer</button>`;
  if (v.phase === 'defuse') h += `${bomb}<p class="say center">Read your rules out loud. <b>${esc(v.cutter)}</b> cuts!</p>`;
  if (v.phase === 'result') h += `<h2 class="${v.last.ok ? 'win' : 'lose'}">${v.last.ok ? '✅ Defused!' : v.last.why === 'time' ? '💥 Out of time!' : '💥 Wrong wire!'}</h2>${bomb}<p class="muted">The right wire was the ${ORD[v.last.answer]}.</p><button class="btn" data-host="next">Next bomb</button>`;
  if (v.phase === 'over') h = `<h2 class="${v.defused >= 4 ? 'win' : ''}">The squad defused ${v.defused} of ${v.of} bombs</h2><p class="say">${v.log.join(' ')}</p><div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`;
  el.innerHTML = `<div class="stage solo ${v.fresh ? 'enter' : ''}"><div class="panel">${h}</div></div>`;
}
export function renderPhone(v, el, send) {
  if (v.phase === 'spectate') { el.innerHTML = '<h2>Game in progress</h2>'; return; }
  const rules = v.rules.length ? `<div class="brules">${v.rules.map(r => `<div><b>Rule ${r.n}</b>${esc(r.text)}</div>`).join('')}</div>` : '';
  let h = `<p class="muted">Defused ${v.defused} · Strikes ${v.strikes}/${STRIKES}</p>`;
  if (v.phase === 'over') h += '<h2>Game over</h2><p class="say">Check the TV!</p>';
  else if (v.isCutter) h += `<h2>✂️ You have the cutters</h2><p class="muted">Listen to your team. Tap a wire to cut it. No take-backs!</p>${wiresHTML(v, v.phase === 'defuse', v.last?.cut, null)}${rules}`;
  else h += `<h2>📖 Read these out loud</h2><p class="muted">Go in rule order with everyone. The first one that's true wins.</p>${rules}`;
  if (v.phase === 'result') h += `<h2 class="${v.last.ok ? 'win' : 'lose'}">${v.last.ok ? 'Defused!' : 'BOOM!'}</h2>`;
  el.innerHTML = h;
  el.querySelectorAll('[data-cut]').forEach(b => (b.onclick = () => { el.querySelectorAll('[data-cut]').forEach(x => (x.disabled = true)); b.classList.add('cut'); try { navigator.vibrate?.(100); } catch {} send({ type: 'cut', i: Number(b.dataset.cut) }); }));
}
