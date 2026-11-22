// Strange Mind v2 : carte des mondes, HUD, sons, sauvegarde.
import { Game } from './game.js';
import { LEVELS, WORLDS } from './levels.js';
import { drawGlyph } from './glyphs.js';
import { t, setDictionary, translateDom, langToggle } from './i18n.js';
import EN from './i18n-en.js';

setDictionary(EN);
translateDom();
langToggle(document.querySelector('#btn-lang'));

const $ = (s) => document.querySelector(s);
const store = {
  get(k, d) { try { const v = localStorage.getItem('strange-mind-cubes:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('strange-mind-cubes:' + k, JSON.stringify(v)); } catch { /* */ } },
};
const save = store.get('save', { stars: {} });
let soundOn = store.get('sound', true);

// ---------------- sons ----------------
let ac;
function tone(f, t, d, type = 'triangle', vol = 0.14, f2) {
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g).connect(ac.destination); o.start(t); o.stop(t + d + 0.02);
}
function sound(name) {
  if (!soundOn) return;
  try {
    ac ||= new (window.AudioContext || window.webkitAudioContext)();
    const t = ac.currentTime;
    ({
      roll: () => { tone(180, t + 0.18, 0.09, 'sine', 0.25, 90); },
      swim: () => { tone(500, t, 0.18, 'sine', 0.08, 900); },
      slide: () => { tone(1200, t, 0.1, 'sine', 0.04, 1500); },
      spin: () => { tone(400, t, 0.3, 'triangle', 0.1, 800); },
      fish: () => { [0, 4, 7, 12].forEach((k, i) => tone(880 * Math.pow(2, k / 12), t + i * 0.06, 0.15, 'sine', 0.12)); },
      bump: () => { tone(120, t, 0.1, 'square', 0.05); },
      undo: () => { tone(600, t, 0.08, 'sine', 0.08, 400); },
      win: () => { [0, 4, 7, 12, 16].forEach((k, i) => tone(523 * Math.pow(2, k / 12), t + i * 0.1, 0.25, 'triangle', 0.15)); },
    }[name] || (() => {}))();
  } catch { /* */ }
}

// ---------------- carte ----------------
function show(id) { for (const s of document.querySelectorAll('.screen')) s.hidden = s.id !== id; }

function renderMap() {
  const box = $('#worlds');
  box.innerHTML = '';
  WORLDS.forEach((w, wi) => {
    const sec = document.createElement('section');
    sec.className = 'world';
    sec.style.setProperty('--wc', w.color);
    sec.innerHTML = `<h2>${w.icon} ${t(w.name)}</h2><div class="nodes"></div>`;
    const nodes = sec.querySelector('.nodes');
    LEVELS.forEach((lv, i) => {
      if (lv.world !== wi) return;
      const st = save.stars[i] || 0;
      const locked = i > 0 && !save.stars[i - 1];
      const b = document.createElement('button');
      b.className = 'node' + (locked ? ' locked' : '') + (!locked && !st ? ' next' : '');
      b.innerHTML = `<span class="n">${locked ? '🔒' : i + 1}</span><span class="st">${'★'.repeat(st)}${'☆'.repeat(3 - st)}</span><span class="nm">${t(lv.name)}</span>`;
      if (!locked) b.addEventListener('click', () => start(i));
      nodes.append(b);
    });
    box.append(sec);
  });
  $('#opt-sound').textContent = soundOn ? '🔊' : '🔇';
}

// ---------------- partie ----------------
let game = null, current = 0;

function start(i) {
  current = i;
  game?.destroy();
  show('play');
  $('#modal').hidden = true;
  const def = LEVELS[i];
  $('#hud-title').textContent = `${i + 1}. ${t(def.name)}`;
  game = new Game($('#board'), def, { sound, onMove: hud, onWin: win });
  hud();
}

function hud() {
  if (!game) return;
  $('#hud-moves').textContent = game.state.moves;
  $('#hud-par').textContent = game.par;
  $('#hud-moves').parentElement.classList.toggle('over', game.state.moves > game.par);
  const fishBox = $('#hud-fish');
  const n = game.level.fish.length;
  fishBox.hidden = !n;
  fishBox.textContent = n ? (game.state.fish.every(Boolean) ? '🐟 ✓' : '🐟 ?') : '';
  $('#btn-undo').disabled = !game.history.length;
  // aperçu des 6 faces du cube sélectionné (dessous compris)
  drawNet();
}

function drawNet() {
  const c = $('#net');
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const s = 26;
  c.width = 4 * s * dpr; c.height = 3 * s * dpr;
  c.style.width = 4 * s + 'px'; c.style.height = 3 * s + 'px';
  const ctx = c.getContext('2d'); ctx.scale(dpr, dpr);
  const lv = game.level, cube = game.state.cubes[game.sel], M = cube.M;
  // face visible dans chaque direction du monde
  const want = { up: [0, 0, 1], down: [0, 0, -1], E: [1, 0, 0], W: [-1, 0, 0], N: [0, 1, 0], S: [0, -1, 0] };
  const slot = { N: [1, 0], W: [0, 1], up: [1, 1], E: [2, 1], down: [3, 1], S: [1, 2] };
  for (const [k, v] of Object.entries(want)) {
    const fi = [0, 1, 2, 3, 4, 5].find((f) => {
      const n = [[0, 0, 1], [0, 0, -1], [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0]][f];
      const w = [M[0] * n[0] + M[1] * n[1] + M[2] * n[2], M[3] * n[0] + M[4] * n[1] + M[5] * n[2], M[6] * n[0] + M[7] * n[1] + M[8] * n[2]];
      return w[0] === v[0] && w[1] === v[1] && w[2] === v[2];
    });
    const [sx, sy] = slot[k];
    ctx.fillStyle = k === 'up' ? '#fff3c4' : k === 'down' ? '#e7dbff' : '#fff';
    ctx.strokeStyle = '#7b6fa8'; ctx.lineWidth = 1.5;
    ctx.fillRect(sx * s + 1, sy * s + 1, s - 2, s - 2); ctx.strokeRect(sx * s + 1, sy * s + 1, s - 2, s - 2);
    drawGlyph(ctx, lv.glyph(game.sel, fi), sx * s + s / 2, sy * s + s / 2, s * 0.36);
  }
}

function win(g) {
  const st = g.stars();
  save.stars[current] = Math.max(save.stars[current] || 0, st);
  store.set('save', save);
  const next = LEVELS[current + 1];
  const fishMsg = g.level.fish.length ? (g.state.fish.every(Boolean) ? t('Poisson doré trouvé ! 🐟') : t('Un poisson doré se cache ici… 🐟')) : '';
  $('#modal .modal-body').innerHTML = `<h2>${t('Bravo !')}</h2>
    <div class="stars">${[1, 2, 3].map((k) => `<span class="${k <= st ? 'on' : ''}" style="animation-delay:${k * 0.25}s">★</span>`).join('')}</div>
    <p>${t('{n} coups · le moins possible : {par}', { n: g.state.moves, par: g.par })}</p>${fishMsg ? `<p>${fishMsg}</p>` : ''}
    <div class="row">${next ? `<button class="btn primary big" data-act="next">${t('Suivant ▶')}</button>` : ''}
    <button class="btn" data-act="again">${t('Rejouer ↻')}</button><button class="btn" data-act="map">${t('Carte')}</button></div>`;
  openModal({ next: () => start(current + 1), again: () => start(current), map: goMap });
}

function goMap() { game?.destroy(); game = null; $('#modal').hidden = true; renderMap(); show('map'); }
function openModal(actions) {
  const m = $('#modal'); m.hidden = false;
  m.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', () => actions[b.dataset.act]?.(), { once: true }));
}

$('#btn-map').addEventListener('click', goMap);
$('#btn-restart').addEventListener('click', () => start(current));
$('#btn-undo').addEventListener('click', () => game?.undo());
$('#btn-hint').addEventListener('click', async () => {
  const h = game?.hint();
  if (!h) return;
  game.sel = h.cube;
  hud();
  await game.go(h.dir, h.cube);
});
$('#opt-sound').addEventListener('click', () => { soundOn = !soundOn; store.set('sound', soundOn); renderMap(); });
$('#btn-help').addEventListener('click', () => { $('#modal .modal-body').innerHTML = $('#help-template').innerHTML; openModal({ ok: () => { $('#modal').hidden = true; } }); });

function route() {
  const n = parseInt(location.hash.slice(1), 10);
  if (n >= 1 && n <= LEVELS.length) start(n - 1); else goMap();
}
window.addEventListener('hashchange', route);
route();
window.strangeMind = { get game() { return game; }, start, LEVELS };
