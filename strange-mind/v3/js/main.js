// Strange Mind v2 : carte des niveaux, HUD, modes Rush et Défi du jour, sons, sauvegarde.
import { Game } from './game.js';
import { LEVELS, RUSH, SPECIES } from './levels.js';
import { drawGlyph } from './glyphs.js';
import { t, setDictionary, translateDom, langToggle } from './i18n.js';
import EN from './i18n-en.js';

setDictionary(EN);
translateDom();
langToggle(document.querySelector('#btn-lang'));

const $ = (s) => document.querySelector(s);

// ---------------- sauvegarde (facultative) ----------------
const store = {
  get(k, d) { try { const v = localStorage.getItem('strange-mind-v3:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('strange-mind-v3:' + k, JSON.stringify(v)); } catch { /* navigation privée */ } },
};
// reprise des scores enregistrés quand ce jeu s'appelait encore « v2 »
function legacySave() { try { const v = JSON.parse(localStorage.getItem('strange-mind-v2:save')); return v && 'rush' in v ? v : null; } catch { return null; } }
const save = store.get('save', null) || legacySave() || { stars: {}, best: {}, rush: 0, daily: {} };
const persist = () => store.set('save', save);
let soundOn = store.get('sound', true);

// ---------------- sons (synthétisés) ----------------
let ac;
const SCALE = [523, 587, 659, 784, 880, 1047, 1175, 1319, 1568];
function tone(f, t, d, type = 'triangle', vol = 0.15, f2) {
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g).connect(ac.destination);
  o.start(t); o.stop(t + d + 0.02);
}
function sound(name, n = 1) {
  if (!soundOn) return;
  try {
    ac ||= new (window.AudioContext || window.webkitAudioContext)();
    const t = ac.currentTime;
    switch (name) {
      case 'rotate': tone(300, t, 0.08, 'sine', 0.08, 420); break;
      case 'nope': tone(160, t, 0.15, 'square', 0.04); break;
      case 'pop': { const f = SCALE[Math.min(n - 1, SCALE.length - 1)]; tone(f, t, 0.12, 'triangle', 0.16); tone(f * 1.5, t + 0.04, 0.1, 'sine', 0.08); break; }
      case 'parade': [0, 2, 4, 7].forEach((k, i) => tone(SCALE[0] * Math.pow(2, k / 12) * 2, t + i * 0.06, 0.12, 'square', 0.05)); break;
      case 'rocket': tone(200, t, 0.35, 'sawtooth', 0.06, 1600); break;
      case 'bomb': tone(140, t, 0.4, 'sine', 0.3, 40); break;
      case 'whirl': tone(220, t, 0.6, 'triangle', 0.12, 880); tone(330, t + 0.1, 0.5, 'sine', 0.08, 1320); break;
      case 'bisou': tone(1320, t, 0.08, 'sine', 0.12); tone(1760, t + 0.09, 0.12, 'sine', 0.12); break;
      case 'tick': tone(1000, t, 0.04, 'square', 0.03); break;
      case 'win': [0, 4, 7, 12, 16].forEach((k, i) => tone(523 * Math.pow(2, k / 12), t + i * 0.1, 0.25, 'triangle', 0.16)); break;
      case 'lose': [7, 4, 0].forEach((k, i) => tone(392 * Math.pow(2, k / 12), t + i * 0.16, 0.25, 'triangle', 0.12)); break;
      default: break;
    }
  } catch { /* pas de son */ }
}

// ---------------- icônes ----------------
function icon(kind, sp, size = 34) {
  const c = document.createElement('canvas');
  const dpr = Math.min(devicePixelRatio || 1, 2);
  c.width = c.height = size * dpr; c.style.width = c.style.height = size + 'px';
  const ctx = c.getContext('2d'); ctx.scale(dpr, dpr);
  const emoji = { ice: '🧊', parade: '🎺', rocket: '🚀', whirl: '🌀', score: '⭐' }[kind];
  drawGlyph(ctx, kind === 'sp' ? SPECIES[sp] : emoji, size / 2, size / 2, size * 0.42);
  return c;
}

// ---------------- écrans ----------------
function show(id) { for (const s of document.querySelectorAll('.screen')) s.hidden = s.id !== id; }
const today = () => new Date().toISOString().slice(0, 10);

function renderMap() {
  const list = $('#map-levels');
  list.innerHTML = '';
  LEVELS.forEach((lv, i) => {
    const stars = save.stars[i] || 0;
    const locked = i > 0 && !save.stars[i - 1];
    const b = document.createElement('button');
    b.className = 'node' + (locked ? ' locked' : '') + (stars ? ' done' : '') + (!locked && !stars ? ' next' : '');
    b.style.setProperty('--x', ['0%', '30%', '55%', '30%', '0%', '-30%', '-55%', '-30%', '0%', '30%'][i % 10]);
    b.innerHTML = `<span class="n">${locked ? '🔒' : i + 1}</span><span class="st">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</span><span class="nm">${t(lv.name)}</span>`;
    if (!locked) b.addEventListener('click', () => startLevel(i));
    list.append(b);
  });
  $('#rush-best').textContent = save.rush ? t('Record : {n}', { n: save.rush }) : t('Pas encore de record');
  $('#daily-best').textContent = save.daily[today()] ? t('Ton score du jour : {n}', { n: save.daily[today()] }) : t('Nouveau défi aujourd’hui !');
  $('#opt-sound').textContent = soundOn ? '🔊' : '🔇';
}

let game = null;
let current = null; // { kind:'level', index } | { kind:'rush', daily }

function startLevel(index) {
  current = { kind: 'level', index };
  const lv = LEVELS[index];
  begin(lv, 'level', Date.now());
  $('#hud-title').textContent = `${index + 1}. ${t(lv.name)}`;
  showIntro(lv);
}

function startRush(daily) {
  current = { kind: 'rush', daily };
  begin(RUSH, 'rush', daily ? 'daily-' + today() : Date.now());
  $('#hud-title').textContent = daily ? t('Défi du jour') : 'Rush 60 s';
  flash(daily ? t('Défi du jour : 60 secondes !') : t('60 secondes ! Tourne vite !'));
}

function begin(level, mode, seed) {
  game?.destroy();
  show('play');
  $('#modal').hidden = true;
  $('#hud').classList.toggle('rush', mode === 'rush');
  game = new Game($('#board'), { level, mode, seed, sound, onUpdate: hud, onEnd: end });
  buildGoals();
  hud();
}

function buildGoals() {
  const box = $('#hud-goals');
  box.innerHTML = '';
  if (game.mode === 'rush') return;
  game.goalEls = game.goal().items.map((it) => {
    const el = document.createElement('div');
    el.className = 'goal';
    el.append(icon(it.kind, it.sp));
    const n = document.createElement('b');
    el.append(n);
    box.append(el);
    return { el, n };
  });
}

function hud() {
  if (!game) return;
  if (game.mode === 'rush') {
    $('#hud-moves').textContent = Math.ceil(Math.max(0, game.timeLeft));
    $('#hud-moves-label').textContent = t('secondes');
    $('#hud-moves').classList.toggle('low', game.timeLeft < 10);
  } else {
    $('#hud-moves').textContent = game.movesLeft;
    $('#hud-moves-label').textContent = t('coups');
    $('#hud-moves').classList.toggle('low', game.movesLeft <= 3);
    game.goal().items.forEach((it, i) => {
      const g = game.goalEls?.[i];
      if (!g) return;
      g.n.textContent = it.left === 0 ? '✓' : it.left;
      g.el.classList.toggle('ok', it.left === 0);
    });
  }
  $('#hud-score').textContent = game.stats.score;
  const s = game.level.stars;
  if (s) {
    const max = s[2] * 1.1;
    $('#hud-bar').style.width = Math.min(100, (100 * game.stats.score) / max) + '%';
    document.querySelectorAll('#hud-starbar .mark').forEach((m, i) => {
      m.style.left = (100 * (i === 0 ? 0.04 * max : s[i])) / max + '%';
      m.classList.toggle('on', i === 0 ? game.goal().done : game.stats.score >= s[i]);
    });
  }
  $('#hud-starbar').hidden = !s;
}

function showIntro(lv) {
  const parts = game.goal().items.map((it) => {
    if (it.kind === 'sp') return { it, txt: `${it.left}` };
    if (it.kind === 'ice') return { it, txt: t('toute la glace') };
    if (it.kind === 'parade') return { it, txt: t('{n} parades', { n: it.left }) };
    if (it.kind === 'rocket') return { it, txt: t('{n} fusées', { n: it.left }) };
    if (it.kind === 'whirl') return { it, txt: t('{n} tourbillon', { n: it.left }) };
    return { it, txt: t('{n} points', { n: it.left }) };
  });
  const body = $('#modal .modal-body');
  body.innerHTML = `<h2>${t(lv.name)}</h2><div class="intro-goals"></div><p class="moves">${t('en <b>{n}</b> coups', { n: lv.moves })}</p>
    <button class="btn primary big" data-act="go">${t('Jouer ▶')}</button>`;
  const g = body.querySelector('.intro-goals');
  for (const p of parts) {
    const d = document.createElement('div');
    d.className = 'goal big';
    d.append(icon(p.it.kind, p.it.sp, 48));
    const b = document.createElement('b'); b.textContent = p.txt; d.append(b);
    g.append(d);
  }
  openModal({ go: closeModal });
}

function end(res) {
  if (!game) return;
  if (current.kind === 'rush') {
    let rec = false;
    if (current.daily) { if (res.score > (save.daily[today()] || 0)) { save.daily[today()] = res.score; rec = true; } }
    else if (res.score > save.rush) { save.rush = res.score; rec = true; }
    persist();
    $('#modal .modal-body').innerHTML = `<h2>${rec ? t('🏆 Nouveau record !') : t('Temps écoulé !')}</h2>
      <p class="score">${res.score}</p><p>${current.daily ? t('Défi du jour : {n}', { n: save.daily[today()] }) : t('Record : {n}', { n: save.rush })}</p>
      <div class="row"><button class="btn primary big" data-act="again">${t('Encore ! ↻')}</button><button class="btn" data-act="map">${t('Carte')}</button></div>`;
    openModal({ again: () => startRush(current.daily), map: goMap });
    return;
  }
  const i = current.index;
  if (res.win) {
    const prev = save.stars[i] || 0;
    save.stars[i] = Math.max(prev, res.stars);
    save.best[i] = Math.max(save.best[i] || 0, res.score);
    persist();
    const next = LEVELS[i + 1];
    $('#modal .modal-body').innerHTML = `<h2>${t('Niveau réussi !')}</h2>
      <div class="stars">${[1, 2, 3].map((k) => `<span class="${k <= res.stars ? 'on' : ''}" style="animation-delay:${k * 0.25}s">★</span>`).join('')}</div>
      <p class="score">${res.score}</p>
      <div class="row">${next ? `<button class="btn primary big" data-act="next">${t('Suivant ▶')}</button>` : ''}
      <button class="btn" data-act="again">${t('Rejouer ↻')}</button><button class="btn" data-act="map">${t('Carte')}</button></div>`;
    openModal({ next: () => startLevel(i + 1), again: () => startLevel(i), map: goMap });
  } else {
    const left = res.goal.items.filter((x) => x.left > 0);
    $('#modal .modal-body').innerHTML = `<h2>${t('Presque !')}</h2><p>${t('Il manquait :')}</p><div class="intro-goals"></div>
      <div class="row"><button class="btn primary big" data-act="again">${t('Réessayer ↻')}</button><button class="btn" data-act="map">${t('Carte')}</button></div>`;
    const g = $('#modal .intro-goals');
    for (const it of left) {
      const d = document.createElement('div'); d.className = 'goal big';
      d.append(icon(it.kind, it.sp, 44));
      const b = document.createElement('b'); b.textContent = it.left; d.append(b); g.append(d);
    }
    openModal({ again: () => startLevel(i), map: goMap });
  }
}

function goMap() {
  game?.destroy(); game = null;
  $('#modal').hidden = true;
  renderMap();
  show('map');
}

function openModal(actions) {
  const m = $('#modal');
  m.hidden = false;
  m.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', () => actions[b.dataset.act]?.(), { once: true }));
}
function closeModal() { $('#modal').hidden = true; }

function flash(txt) {
  const el = $('#flash');
  el.textContent = txt;
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
}

// ---------------- boutons ----------------
$('#btn-map').addEventListener('click', goMap);
$('#btn-restart').addEventListener('click', () => { if (!current) return; current.kind === 'rush' ? startRush(current.daily) : startLevel(current.index); });
$('#btn-rush').addEventListener('click', () => startRush(false));
$('#btn-daily').addEventListener('click', () => startRush(true));
$('#opt-sound').addEventListener('click', () => { soundOn = !soundOn; store.set('sound', soundOn); renderMap(); });
$('#btn-help').addEventListener('click', () => {
  $('#modal .modal-body').innerHTML = $('#help-template').innerHTML;
  openModal({ ok: closeModal });
});

// accès direct : #3 (niveau 3), #rush, #daily
function route() {
  const n = parseInt(location.hash.slice(1), 10);
  if (n >= 1 && n <= LEVELS.length) startLevel(n - 1);
  else if (location.hash === '#rush') startRush(false);
  else if (location.hash === '#daily') startRush(true);
  else goMap();
}
window.addEventListener('hashchange', route);
route();

window.strangeMind = { get game() { return game; }, LEVELS, startLevel, startRush };
