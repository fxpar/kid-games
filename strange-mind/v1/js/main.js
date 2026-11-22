// Application : menu, déroulement des niveaux, voix, sons, réglages.
import { World } from './engine.js';
import { LEVELS, SANDBOX } from './levels.js';
import { t, LANG, setDictionary, translateDom, langToggle, speechLang, voicePrefix } from './i18n.js';
import EN, { EN_LEVELS } from './i18n-en.js';

// ---------------- langue (français par défaut) ----------------
setDictionary(EN);
translateDom();
langToggle(document.querySelector('#btn-lang'));
// en anglais : on remplace les textes des niveaux (titre, notion, consignes) par leur version anglaise
if (LANG === 'en') {
  for (const lv of [...LEVELS, SANDBOX]) {
    const en = EN_LEVELS[lv.id];
    if (!en) continue;
    if (en.title) lv.title = en.title;
    if (en.concept) lv.concept = en.concept;
    (en.steps || []).forEach((es, i) => {
      const st = lv.steps[i];
      if (!st || !es) return;
      for (const k of ['say', 'hint', 'bravo']) if (es[k] != null) st[k] = es[k];
    });
  }
}

const $ = (s) => document.querySelector(s);

// ---------------- réglages (préférences du joueur, facultatives) ----------------
const store = {
  get(k, d) { try { const v = localStorage.getItem('strange-mind:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('strange-mind:' + k, JSON.stringify(v)); } catch { /* navigation privée */ } },
};
const settings = { voice: true, sound: true, invertScroll: false, oneFinger: true, ...store.get('settings', {}) };
const saveSettings = () => store.set('settings', settings);
const progress = store.get('progress', {});

// ---------------- sons ----------------
let audio;
function sound(name) {
  if (!settings.sound) return;
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    const notes = {
      tumble: [[392, 0.07]], twist: [[523, 0.06]], nope: [[180, 0.12, 'square']],
      ok: [[523, 0.1], [659, 0.1], [784, 0.18]], win: [[523, 0.1], [659, 0.1], [784, 0.1], [1047, 0.3]],
      oops: [[330, 0.12], [262, 0.2]],
    }[name] || [];
    let t = audio.currentTime;
    for (const [f, d, type] of notes) {
      const o = audio.createOscillator(), g = audio.createGain();
      o.type = type || 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(type ? 0.04 : 0.18, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g).connect(audio.destination);
      o.start(t); o.stop(t + d + 0.02);
      t += d * 0.85;
    }
  } catch { /* pas de son */ }
}

// ---------------- voix ----------------
function speak(txt) {
  if (!settings.voice || !('speechSynthesis' in window)) return;
  const clean = txt.replace(/\p{Extended_Pictographic}|️|[↺↻⬆️⬇️⬅️➡️]/gu, '').replace(/\s+/g, ' ').trim();
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(clean);
  u.lang = speechLang();
  const v = speechSynthesis.getVoices().find((x) => x.lang?.startsWith(voicePrefix()));
  if (v) u.voice = v;
  u.rate = 0.95; u.pitch = 1.1;
  speechSynthesis.speak(u);
}

// ---------------- confettis ----------------
const confettiCanvas = $('#confetti');
let confetti = [];
function burst(n = 70) {
  const W = innerWidth, H = innerHeight;
  confettiCanvas.width = W; confettiCanvas.height = H;
  const cols = ['#ef476f', '#ffd166', '#06d6a0', '#118ab2', '#7b2cbf', '#ff9a2e'];
  for (let i = 0; i < n; i++) {
    confetti.push({ x: W / 2, y: H * 0.45, vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 13 - 4, r: 4 + Math.random() * 5, c: cols[i % cols.length], a: Math.random() * 6, life: 1 });
  }
  if (confetti.length === n) requestAnimationFrame(stepConfetti);
}
function stepConfetti() {
  const ctx = confettiCanvas.getContext('2d');
  ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  confetti = confetti.filter((p) => p.life > 0);
  for (const p of confetti) {
    p.x += p.vx; p.y += p.vy; p.vy += 0.4; p.a += 0.2; p.life -= 0.012;
    ctx.save(); ctx.globalAlpha = Math.max(0, p.life); ctx.translate(p.x, p.y); ctx.rotate(p.a);
    ctx.fillStyle = p.c; ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); ctx.restore();
  }
  if (confetti.length) requestAnimationFrame(stepConfetti);
}

// ---------------- menu ----------------
function renderMenu() {
  const grid = $('#levels');
  grid.innerHTML = '';
  LEVELS.forEach((lv, i) => {
    const b = document.createElement('button');
    b.className = 'level-tile' + (progress[lv.id] ? ' done' : '');
    b.innerHTML = `<span class="num">${i + 1}</span><span class="icon">${lv.icon}</span><span class="name">${lv.title}</span><span class="star">${progress[lv.id] ? '⭐' : '☆'}</span>`;
    b.addEventListener('click', () => startLevel(lv));
    grid.append(b);
  });
  for (const [id, key] of [['#opt-voice', 'voice'], ['#opt-sound', 'sound'], ['#opt-invert', 'invertScroll'], ['#opt-onefinger', 'oneFinger']]) {
    const el = $(id);
    el.checked = settings[key];
    el.onchange = () => { settings[key] = el.checked; saveSettings(); };
  }
}

function show(screen) {
  for (const s of document.querySelectorAll('.screen')) s.hidden = s.id !== screen;
}

// ---------------- partie ----------------
let game = null;

function makeState(world) {
  const shape = (id) => world.get(id);
  return {
    mem: {},
    ids: () => world.shapes.map((s) => s.id),
    shape,
    dir: (id) => shape(id).dir(),
    glyph: (id) => shape(id).glyph(),
    val: (id) => shape(id).value(),
    real: (id) => Math.round(shape(id).value()[0]),
    set: (id, face, dir) => shape(id).setOrientation(face, dir),
    lock: (id, o) => shape(id).lock(o),
    show: (id, v) => { shape(id).hidden = !v; world.layout(); },
  };
}

function startLevel(level, at = 0, mem = {}) {
  game?.world.destroy();
  show('game');
  $('#level-title').textContent = level.title;
  const stage = $('#stage');
  const world = new World(stage, {
    sound,
    invertScroll: settings.invertScroll,
    oneFinger: settings.oneFinger,
    onCommit: () => onCommit(),
  });
  for (const sp of level.shapes) world.addShape(sp);
  for (const l of level.labels || []) world.addLabel(l);
  const S = makeState(world);
  S.mem = mem;
  game = { level, world, S, step: 0, busy: false, panels: [] };
  buildPanels();
  // rejoue la mise en place des étapes déjà passées (pour "recommencer l'étape")
  for (let j = 0; j < at; j++) level.steps[j].setup?.(S);
  startStep(at);
}

function buildPanels() {
  const box = $('#panels');
  box.innerHTML = '';
  game.panels = (game.level.panels || []).map((p) => {
    const card = document.createElement('div');
    card.className = 'card';
    const c = document.createElement('canvas');
    card.append(c);
    box.append(card);
    return { p, c, card };
  });
  box.hidden = game.panels.length === 0;
  sizePanels();
}

function sizePanels() {
  if (!game) return;
  const box = $('#panels');
  const H = box.clientHeight - 16;
  const W = box.clientWidth - 16;
  const totalRatio = game.panels.reduce((s, x) => s + x.p.ratio, 0);
  const h = Math.max(60, Math.min(H, W / (totalRatio || 1) - 12));
  for (const x of game.panels) {
    x.c.style.width = h * x.p.ratio + 'px';
    x.c.style.height = h + 'px';
  }
  drawPanels();
}

function drawPanels() {
  if (!game) return;
  const st = game.level.steps[game.step];
  for (const { p, c } of game.panels) {
    const w = c.clientWidth, h = c.clientHeight;
    if (!w || !h) continue;
    const dpr = Math.min(devicePixelRatio || 1, 2.5);
    c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    const ctx = c.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    try { p.draw(ctx, w, h, game.S, st); } catch (e) { console.error(e); }
  }
}

function setBubble(txt) {
  $('#say').textContent = txt;
  const dots = $('#stepdots');
  dots.innerHTML = game.level.steps.length > 1
    ? game.level.steps.map((_, i) => `<i class="${i < game.step ? 'done' : i === game.step ? 'cur' : ''}"></i>`).join('')
    : '';
}

function startStep(i, silent = false) {
  game.step = i;
  const st = game.level.steps[i];
  st.setup?.(game.S);
  for (const s of game.world.shapes) { s.resetCounters(); s.startDir = s.dir(); }
  game.busy = false;
  game.world.enabled = true;
  setBubble(st.say);
  if (!silent) speak(st.say);
  drawPanels();
}

function onCommit() {
  drawPanels();
  if (!game || game.busy) return;
  const st = game.level.steps[game.step];
  if (st.goal(game.S)) success(st);
  else if (st.fail?.(game.S)) {
    game.busy = true;
    sound('oops');
    const msg = t('Oups ! On recommence.');
    $('#say').textContent = msg;
    speak(msg);
    setTimeout(() => { if (game?.level.steps[game.step] === st) restartStep(); }, 1400);
  }
}

function success(st) {
  game.busy = true;
  game.world.enabled = false;
  st.done?.(game.S);
  for (const s of game.world.shapes) s.pulse = performance.now();
  game.world.dirty();
  const last = game.step === game.level.steps.length - 1;
  sound(last ? 'win' : 'ok');
  burst(last ? 140 : 50);
  const msg = st.bravo || t(['Bravo !', 'Super !', 'Génial !', 'Bien joué !'][Math.floor(Math.random() * 4)]);
  $('#say').textContent = msg;
  speak(msg);
  const level = game.level;
  setTimeout(() => {
    if (game?.level !== level) return;
    if (!last) startStep(game.step + 1);
    else finishLevel();
  }, last ? 1800 : 1900);
}

function finishLevel() {
  const lv = game.level;
  progress[lv.id] = true;
  store.set('progress', progress);
  const idx = LEVELS.indexOf(lv);
  const next = LEVELS[idx + 1];
  openModal(`<div class="win"><div class="big">⭐</div><h2>${lv.title}</h2><p>${t('Niveau réussi !')}</p>
    <div class="row">${next ? `<button class="btn primary" data-act="next">${t('Niveau suivant ▶')}</button>` : ''}
    <button class="btn" data-act="menu">${t('🏠 Menu')}</button></div></div>`, {
    next: () => { closeModal(); startLevel(next); },
    menu: () => { closeModal(); goMenu(); },
  });
}

function restartStep() {
  startLevel(game.level, game.step, game.S.mem);
}

function goMenu() {
  game?.world.destroy();
  game = null;
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  renderMenu();
  show('menu');
}

// ---------------- fenêtre modale ----------------
function openModal(html, actions = {}) {
  const m = $('#modal');
  m.querySelector('.modal-body').innerHTML = html;
  m.hidden = false;
  m.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', () => actions[b.dataset.act]?.()));
}
function closeModal() { $('#modal').hidden = true; }

// ---------------- boutons ----------------
$('#btn-home').addEventListener('click', goMenu);
$('#btn-speak').addEventListener('click', () => game && speak($('#say').textContent));
$('#btn-hint').addEventListener('click', () => {
  if (!game) return;
  const h = game.level.steps[game.step].hint || t('Essaie de glisser ou de tourner les formes !');
  $('#say').textContent = '💡 ' + h;
  speak(h);
});
$('#btn-reset').addEventListener('click', () => game && !game.busy && restartStep());
$('#btn-guide').addEventListener('click', () => {
  if (!game) return;
  openModal(`<h2>${t('🎓 Pour les grands : {title}', { title: game.level.title })}</h2>${game.level.concept}`);
});
$('#btn-sandbox').addEventListener('click', () => startLevel(SANDBOX));
$('#btn-help').addEventListener('click', () => openModal($('#help-template').innerHTML));
$('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal' || e.target.closest('.modal-close')) closeModal(); });
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
new ResizeObserver(() => sizePanels()).observe($('#panels'));
if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = () => {};

// Accès direct à un niveau : index.html#3  (pratique pour concevoir des niveaux)
function route() {
  const n = parseInt(location.hash.slice(1), 10);
  if (n >= 1 && n <= LEVELS.length) startLevel(LEVELS[n - 1]);
  else if (location.hash === '#sandbox') startLevel(SANDBOX);
  else goMenu();
}
window.addEventListener('hashchange', route);
route();

// pour le débogage dans la console
window.strangeMind = { get game() { return game; }, LEVELS, startLevel };
