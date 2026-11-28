// Mystery Manor: a whole-evening whodunit in 15 minutes. Everyone gets a character. One of you secretly stole
// the Moon Diamond during dinner. Over three acts, the TV reveals clues to everyone, and each phone gets private
// clues. Talk, question, accuse. Then vote: who did it, where, and how? The thief wins by not getting caught.
import { esc } from '../ui.js';

export const meta = {
  walk: [
    { text: 'Here is how Mystery Manor works. It takes one minute.' },
    { phase: 'roles', text: 'Everyone plays a character at the manor. One of you is secretly the thief.' },
    { phase: 'act', text: 'There are three acts. In each one the TV shows clues for everyone, and your phone shows clues only you know.' },
    { phase: 'act', text: 'Share what you know out loud. Careful. The thief will lie.' },
    { phase: 'accuse', text: 'At the end, everyone accuses on their phone: who did it, where, and how.' },
    { phase: 'reveal', text: 'Get it right and the guests win. Get it wrong and the thief gets away.' },
  ],
  id: 'mystery',
  name: 'Mystery Manor',
  min: 4,
  max: 10,
  blurb: 'Someone at the party stole the diamond. Three acts of clues. Who did it?',
};

export const CHARACTERS = [
  ['The Butler', '🤵', 'Knows every secret passage in the manor.'], ['The Chef', '👩‍🍳', 'Was in and out of the kitchen all night.'],
  ['The Gardener', '🧑‍🌾', 'Has muddy boots and a key to the greenhouse.'], ['The Duchess', '👸', 'Owes a lot of money to someone.'],
  ['The Opera Singer', '🎤', 'Sang a very long song right before the lights went out.'], ['The Mechanic', '🧑‍🔧', 'Fixed the fuse box earlier that day.'],
  ['The Librarian', '📚', 'Was looking for an old map of the manor.'], ['The Pilot', '🧑‍✈️', 'Has a plane waiting at the airfield.'],
  ['The Magician', '🎩', 'Did a disappearing trick at dinner.'], ['The Detective\'s Cousin', '🕵️', 'Claims to be "helping" with the case.'],
];
export const ROOMS = ['Library', 'Kitchen', 'Greenhouse', 'Ballroom', 'Wine Cellar', 'Observatory'];
export const ITEMS = ['Rope', 'Ladder', 'Umbrella', 'Fishing rod', 'Roller skates', 'Candle'];
export const ACTS = ['The lights go out', 'Footprints and whispers', 'The final clue'];
export const TIMES = { roles: 25000, act: 150000, accuse: 60000, reveal: 20000 };
const shuffle = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export function setup(players, rnd = Math.random) {
  const order = shuffle(players.map(p => ({ pid: p.pid, name: p.name })), rnd);
  const chars = shuffle([...CHARACTERS.keys()], rnd);
  const s = { game: 'mystery', players: order, char: {}, round: 0, act: 0, clues: {}, pub: [], votes: {}, phase: 'roles', deadline: Date.now() + TIMES.roles };
  order.forEach((p, i) => { s.char[p.pid] = chars[i % chars.length]; s.clues[p.pid] = []; });
  s.thief = order[Math.floor(rnd() * order.length)].pid;
  s.room = Math.floor(rnd() * ROOMS.length); s.item = Math.floor(rnd() * ITEMS.length);
  // Everything that isn't the answer can be ruled out by a clue, in a shuffled order.
  s.falseRooms = shuffle(ROOMS.map((_, i) => i).filter(i => i !== s.room), rnd);
  s.falseItems = shuffle(ITEMS.map((_, i) => i).filter(i => i !== s.item), rnd);
  s.innocents = shuffle(order.map(p => p.pid).filter(p => p !== s.thief), rnd);
  s.alibied = [];
  const decoyRoom = s.falseRooms[s.falseRooms.length - 1];
  const buddy = s.innocents[0];
  s.clues[s.thief].push(`🤫 You are the thief! You used the ${ITEMS[s.item]} in the ${ROOMS[s.room]}.`, `Your cover story: say you were in the ${ROOMS[decoyRoom]} with ${who(s, buddy)}.`);
  return s;
}
const nameOf = (s, pid) => (s.players.find(p => p.pid === pid) || {}).name || 'Someone';
const who = (s, pid) => `${nameOf(s, pid)} (${CHARACTERS[s.char[pid]][0]})`;

function deal(s, rnd) {
  const a = s.act;
  // Public clues: rule out rooms and items, a little more each act.
  const rooms = s.falseRooms.splice(0, a === 0 ? 1 : 1), items = s.falseItems.splice(0, a === 0 ? 1 : 1);
  rooms.forEach(r => s.pub.push(`🚪 Muddy footprints show nobody went into the ${ROOMS[r]}.`));
  items.forEach(i => s.pub.push(`🔎 Dust shows nobody used the ${ITEMS[i]}.`));
  // Private clues: some innocents learn that someone else is innocent, others learn a room or item that's ruled out.
  const pool = s.innocents.filter(p => !s.alibied.includes(p));
  s.innocents.forEach((pid, i) => {
    if ((i + a) % 2 === 0 && pool.length > 1) {
      const other = pool.find(x => x !== pid && !s.alibied.includes(x));
      if (other && s.alibied.length < s.innocents.length - 1) { s.alibied.push(other); s.clues[pid].push(`👀 Act ${a + 1}: you were with ${who(s, other)} the whole time the lights were out. They couldn't have done it.`); return; }
    }
    // A room or item this player hasn't heard about yet (never the real one).
    const heard = s.clues[pid].join(' ');
    const room = s.falseRooms.find(r => !heard.includes(`the ${ROOMS[r]} was locked`));
    const item = s.falseItems.find(x => !heard.includes(`the ${ITEMS[x]} with you`));
    if (room !== undefined && (i % 2 === 0 || item === undefined)) s.clues[pid].push(`🗝️ Act ${a + 1}: the ${ROOMS[room]} was locked all night.`);
    else if (item !== undefined) s.clues[pid].push(`🧤 Act ${a + 1}: you had the ${ITEMS[item]} with you all evening.`);
  });
  s.clues[s.thief].push(a === 2 ? `⚠️ Act 3: ${s.alibied.length ? `${who(s, s.alibied[0])} has a solid alibi. Point suspicion somewhere else!` : 'Nobody has a solid alibi yet. Stay calm.'}` : (a === 0 ? '🗣️ Act 1: tell your cover story early, before anyone asks.' : `🗣️ Act 2: ${who(s, s.innocents[s.innocents.length - 1])} looks nervous. Maybe point that out?`));
}

export function act(s, pid, a, now = Date.now()) {
  if (!a || !s.char.hasOwnProperty(pid) || s.phase !== 'accuse' || a.type !== 'accuse') return s;
  if (!s.char.hasOwnProperty(a.suspect) || a.suspect === pid || !ROOMS[a.room] || !ITEMS[a.item]) return s;
  s.votes[pid] = { suspect: a.suspect, room: a.room, item: a.item };
  if (s.players.every(p => s.votes[p.pid])) reveal(s, now);
  return s;
}

function reveal(s, now) {
  const count = {};
  Object.values(s.votes).forEach(v => (count[v.suspect] = (count[v.suspect] || 0) + 1));
  const top = Math.max(0, ...Object.values(count));
  const most = Object.keys(count).filter(k => count[k] === top);
  const caught = top > 0 && most.length === 1 && most[0] === s.thief;
  s.points = {};
  s.players.forEach(p => {
    const v = s.votes[p.pid]; let pts = 0;
    if (p.pid === s.thief) pts = caught ? 0 : 5;
    else if (v) pts = (v.suspect === s.thief ? 3 : 0) + (v.room === s.room ? 1 : 0) + (v.item === s.item ? 1 : 0);
    s.points[p.pid] = pts;
  });
  s.caught = caught; s.count = count;
  s.phase = 'reveal'; s.round++; s.deadline = now + 12000;   // the answer holds for a moment, then the game ends like every other (podium choices, tonight's tally)
}

export function hostAct(s, a, now = Date.now(), rnd = Math.random) {
  if (a !== 'next') return s;
  if (s.phase === 'roles' || (s.phase === 'act' && s.act < ACTS.length - 1)) {
    if (s.phase === 'act') s.act++;
    s.phase = 'act'; deal(s, rnd); s.round++; s.deadline = now + TIMES.act;
  } else if (s.phase === 'act') { s.phase = 'accuse'; s.round++; s.deadline = now + TIMES.accuse; }
  else if (s.phase === 'accuse') reveal(s, now);
  else if (s.phase === 'reveal') { s.phase = 'over'; s.round++; }
  return s;
}
export function tick(s, now = Date.now(), rnd = Math.random) { return s.deadline && now >= s.deadline ? hostAct(s, 'next', now, rnd) : s; }

export function narration(s) {
  if (s.phase === 'roles') return 'Welcome to Mystery Manor. During dinner, the lights went out, and when they came back on, the Moon Diamond was gone! One of you is the thief. Check your phone for your character. Keep it secret if you are the thief!';
  if (s.phase === 'act') return [`Act one. ${ACTS[0]}. Read your clues, then share what you know. Or what you want people to think you know.`, `Act two. ${ACTS[1]}. New clues are on your phones and on the TV.`, `Act three. ${ACTS[2]}. This is your last chance to question each other.`][s.act];
  if (s.phase === 'accuse') return 'Time to accuse! On your phone, choose who did it, where, and how.';
  if (s.phase === 'reveal') return `It happened in the ${ROOMS[s.room]}, with the ${ITEMS[s.item]}. The thief was ${who(s, s.thief)}! ${s.caught ? 'And you caught them!' : 'And they got away with it!'}`;   // the place and the tool are their own sentence, so the host can say them (a sentence with a player's name has no recording)
  return '';
}
export function cue(s) {
  if (s.phase === 'roles') return { sound: 'night', wait: 1800, title: 'Mystery Manor', sub: 'The Moon Diamond is missing', tone: 'night', ambient: 'crickets' };
  if (s.phase === 'act') return { sound: 'drumroll', wait: 1200, title: `Act ${s.act + 1}`, sub: ACTS[s.act], tone: 'night' };
  if (s.phase === 'accuse') return { sound: 'vote', wait: 500, title: 'Accuse!', tone: 'blood' };
  if (s.phase === 'reveal') return { sound: s.caught ? 'win' : 'death', wait: 1500, title: s.caught ? 'Case closed!' : 'The thief escaped!', sub: nameOf(s, s.thief), tone: s.caught ? 'dawn' : 'blood', fx: s.caught ? 'confetti' : '' };   // claw marks belong to the werewolf games
  return null;
}

export function botAct(v, rnd = Math.random) {
  if (v.phase !== 'accuse' || v.voted) return null;
  const sus = v.suspects.filter(x => !x.clear);
  const t = (sus.length ? sus : v.suspects)[Math.floor(rnd() * (sus.length || v.suspects.length))];
  const rooms = v.rooms.filter(r => !r.out), items = v.items.filter(r => !r.out);
  return { type: 'accuse', suspect: t.pid, room: rooms[Math.floor(rnd() * rooms.length)].i, item: items[Math.floor(rnd() * items.length)].i };
}

const boards = s => ({
  rooms: ROOMS.map((r, i) => ({ i, name: r, out: s.pub.some(c => c.includes(`the ${r}.`)) })),
  items: ITEMS.map((r, i) => ({ i, name: r, out: s.pub.some(c => c.includes(`used the ${r}.`)) })),
});
export function tvView(s, now = Date.now()) {
  const v = { phase: s.phase, act: s.act + 1, actName: ACTS[s.act], pub: s.pub, ...boards(s), left: Math.max(0, Math.ceil((s.deadline - now) / 1000)), cast: s.players.map(p => ({ name: p.name, char: CHARACTERS[s.char[p.pid]] })), n: Object.keys(s.votes).length, total: s.players.length };
  if (s.phase === 'reveal' || s.phase === 'over') v.truth = { thief: nameOf(s, s.thief), char: CHARACTERS[s.char[s.thief]], room: ROOMS[s.room], item: ITEMS[s.item], caught: s.caught, votes: s.players.map(p => ({ name: p.name, n: s.count[p.pid] || 0, pts: s.points[p.pid] })) };
  return v;
}
export function phoneView(s, pid) {
  if (!s.char.hasOwnProperty(pid)) return { phase: 'spectate' };
  const thief = pid === s.thief;
  const v = { phase: s.phase, round: s.round, char: CHARACTERS[s.char[pid]], thief, clues: s.clues[pid], act: s.act + 1, ...boards(s) };
  // Also grey out what this player's own clues rule out.
  if (!thief) { const mine = s.clues[pid].join(' '); v.rooms.forEach(r => { if (mine.includes(`the ${r.name} was locked`)) r.out = true; }); v.items.forEach(r => { if (mine.includes(`the ${r.name} with you`)) r.out = true; }); }
  if (s.phase === 'accuse') { v.voted = !!s.votes[pid]; v.suspects = s.players.filter(p => p.pid !== pid).map(p => ({ pid: p.pid, name: p.name, char: CHARACTERS[s.char[p.pid]][0], clear: s.clues[pid].some(c => c.includes(who(s, p.pid)) && c.includes("couldn't")) })); }
  if (s.phase === 'reveal' || s.phase === 'over') { v.points = s.points[pid]; v.caught = s.caught; v.truth = `${who(s, s.thief)}, ${ROOMS[s.room]}, ${ITEMS[s.item]}`; }
  return v;
}

const grid = v => `<div class="mmboards"><div><h3>Rooms</h3>${v.rooms.map(r => `<span class="${r.out ? 'out' : ''}">${esc(r.name)}</span>`).join('')}</div><div><h3>How</h3>${v.items.map(r => `<span class="${r.out ? 'out' : ''}">${esc(r.name)}</span>`).join('')}</div></div>`;
export function renderTV(v, el) {
  document.body.classList.toggle('night', v.phase !== 'reveal' && v.phase !== 'over');
  const cast = `<div class="mmcast">${v.cast.map(c => `<div><span>${c.char[1]}</span><b>${esc(c.name)}</b><small>${esc(c.char[0])}</small></div>`).join('')}</div>`;
  let h = '';
  if (v.phase === 'roles') h = `<h2>💎 The Moon Diamond is missing!</h2><p class="say">During dinner the lights went out. When they came back on, the diamond was gone. One of you is the thief. Check your phone to meet your character.</p>${cast}<button class="btn" data-host="next">Begin Act 1</button><div class="how"><h3>How to play</h3><ol><li>Everyone plays a character. One of you is secretly the thief.</li><li>Each act, the TV shows clues for everyone, and your phone shows clues only you know.</li><li>Share what you know. The thief will lie!</li><li>At the end, accuse: who, where, and how. The thief wins if the group gets it wrong.</li></ol></div>`;
  if (v.phase === 'act') h = `<p class="cat">Act ${v.act} of 3</p><h2>${esc(v.actName)}</h2><div class="mmclues">${v.pub.map((c, i) => `<p style="animation-delay:${i * 0.1}s">${esc(c)}</p>`).join('')}</div>${grid(v)}<p class="clock ${v.left <= 20 ? 'hurry' : ''}">${Math.floor(v.left / 60)}:${String(v.left % 60).padStart(2, '0')}</p>${cast}<button class="btn ghost" data-host="next">${v.act < 3 ? 'Next act' : 'Time to accuse'}</button>`;
  if (v.phase === 'accuse') h = `<h2>🔍 Accuse!</h2><p class="say">Who did it, where, and how? Vote on your phone.</p>${grid(v)}<div class="meter"><span style="width:${(100 * v.n) / v.total}%"></span></div><p class="muted center">${v.n} of ${v.total} <span class="clock">${v.left}</span></p><button class="btn ghost" data-host="next">Reveal the truth</button>`;
  if (v.phase === 'reveal' || v.phase === 'over') h = `<h2 class="${v.truth.caught ? 'win' : 'lose'}">${v.truth.caught ? 'Case closed!' : 'The thief got away!'}</h2><div class="mmtruth"><span>${v.truth.char[1]}</span><p><b>${esc(v.truth.thief)}</b>, ${esc(v.truth.char[0])},<br>in the <b>${esc(v.truth.room)}</b> with the <b>${esc(v.truth.item)}</b>.</p></div><div class="scores">${v.truth.votes.sort((a, b) => b.pts - a.pts).map(x => `<div class="srow"><span>${esc(x.name)} <small class="muted">${x.n} vote${x.n === 1 ? '' : 's'}</small></span><b>+${x.pts}</b></div>`).join('')}</div>${v.phase === 'reveal' ? '<div class="row"><button class="btn ghost" data-host="next">Finish</button></div>' : ''}`;
  el.innerHTML = `<div class="stage solo ${v.fresh ? 'enter' : ''}"><div class="panel mmpanel">${h}</div></div>`;
}

let pick = { round: -1, suspect: null, room: null, item: null };
export function renderPhone(v, el, send) {
  if (v.phase === 'spectate') { el.innerHTML = '<h2>Game in progress</h2>'; return; }
  if (pick.round !== v.round) pick = { round: v.round, suspect: null, room: null, item: null };
  const me = `<div class="mmme ${v.thief ? 'thief' : ''}"><span>${v.char[1]}</span><div><b>${esc(v.char[0])}</b><small>${esc(v.char[2])}</small></div></div>`;
  const clues = v.clues.length ? `<div class="mmmine">${v.clues.map(c => `<p>${esc(c)}</p>`).join('')}</div>` : '<p class="muted">No private clues yet.</p>';
  let h = me;
  if (v.phase === 'roles') h += v.thief ? clues : '<p class="say">You are innocent. Find the thief!</p>';
  else if (v.phase === 'act') h += `<h3>Your secret clues</h3>${clues}`;
  else if (v.phase === 'accuse' && v.voted) h += '<h2>Accusation in!</h2>';
  else if (v.phase === 'accuse') {
    const row = (key, list, label) => `<h3>${label}</h3><div class="mmpick">${list.map(x => `<button class="${pick[key] === (x.pid ?? x.i) ? 'on' : ''} ${x.out || x.clear ? 'dim' : ''}" data-k="${key}" data-v="${esc(String(x.pid ?? x.i))}">${esc(x.name)}${x.char ? `<small>${esc(x.char)}</small>` : ''}</button>`).join('')}</div>`;
    h += row('suspect', v.suspects, 'Who?') + row('room', v.rooms, 'Where?') + row('item', v.items, 'How?') + `<button class="btn" id="acc" ${pick.suspect !== null && pick.room !== null && pick.item !== null ? '' : 'disabled'}>Accuse!</button><details><summary>My clues</summary>${clues}</details>`;
  } else h += `<h2 class="${v.points ? 'win' : ''}">+${v.points}</h2><p class="say">${esc(v.truth)}</p>`;
  el.innerHTML = h;
  el.querySelectorAll('[data-k]').forEach(b => (b.onclick = () => { const k = b.dataset.k; pick[k] = k === 'suspect' ? b.dataset.v : Number(b.dataset.v); renderPhone(v, el, send); }));
  el.querySelector('#acc')?.addEventListener('click', e => { e.target.disabled = true; send({ type: 'accuse', suspect: pick.suspect, room: pick.room, item: pick.item }); });
}
