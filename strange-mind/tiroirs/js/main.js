// Strange Mind · Les tiroirs magiques (moteur repris des défis éclair v4) : accueil, séances de 10 défis, Rush 60 s, défi du jour.
import { GAMES, makeR } from './games.js';
import { t, setDictionary, translateDom, langToggle, speechLang, voicePrefix } from './i18n.js';
import EN from './i18n-en.js';

setDictionary(EN);
translateDom();

const $ = (s) => document.querySelector(s);
const store = {
  get(k, d) { try { const v = localStorage.getItem('strange-mind-tiroirs:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('strange-mind-tiroirs:' + k, JSON.stringify(v)); } catch { /* */ } },
};
const save = store.get('save', { games: {}, rush: 0, daily: {} });
const prefs = { sound: true, voice: true, ...store.get('prefs', {}) };
const persist = () => store.set('save', save);
const gsave = (id) => (save.games[id] ||= { lvl: 1, medal: 0, stars: 0 });
const today = () => new Date().toISOString().slice(0, 10);
const MEDALS = ['', '🥉', '🥈', '🥇', '💎'];
const CHEERS = ['Bravo !', 'Super !', 'Génial !', 'Bien vu !', 'Oui !', 'Champion !', 'Trop fort !'];

// ---------------- sons & voix ----------------
let ac;
function tone(f, t, d, type = 'triangle', vol = 0.14) {
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.value = f;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g).connect(ac.destination); o.start(t); o.stop(t + d + 0.02);
}
function sound(name, n = 0) {
  if (!prefs.sound) return;
  try {
    ac ||= new (window.AudioContext || window.webkitAudioContext)();
    const t = ac.currentTime, base = 523 * Math.pow(2, Math.min(n, 12) / 12);
    if (name === 'ok') { tone(base, t, 0.12); tone(base * 1.5, t + 0.08, 0.18); }
    if (name === 'perfect') { tone(base, t, 0.1); tone(base * 1.26, t + 0.07, 0.1); tone(base * 1.5, t + 0.14, 0.2); }
    if (name === 'bad') { tone(260, t, 0.16, 'sine', 0.12); tone(220, t + 0.12, 0.22, 'sine', 0.1); }
    if (name === 'click') tone(700, t, 0.05, 'sine', 0.06);
    if (name === 'up') [0, 4, 7, 12].forEach((k, i) => tone(660 * Math.pow(2, k / 12), t + i * 0.07, 0.15, 'square', 0.04));
    if (name === 'end') [0, 4, 7, 12, 16].forEach((k, i) => tone(523 * Math.pow(2, k / 12), t + i * 0.1, 0.25));
    if (name === 'tick') tone(1000, t, 0.03, 'square', 0.025);
  } catch { /* */ }
}
function speak(txt) {
  if (!prefs.voice || !('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(txt.replace(/\p{Extended_Pictographic}|️/gu, ''));
  u.lang = speechLang(); u.rate = 1; u.pitch = 1.1;
  const v = speechSynthesis.getVoices().find((x) => x.lang?.startsWith(voicePrefix()));
  if (v) u.voice = v;
  speechSynthesis.speak(u);
}

// ---------------- confettis ----------------
const conf = $('#confetti');
let parts = [];
function burst(n = 60) {
  conf.width = innerWidth; conf.height = innerHeight;
  const cols = ['#ef476f', '#ffd166', '#06d6a0', '#118ab2', '#7b2cbf'];
  const start = !parts.length;
  for (let i = 0; i < n; i++) parts.push({ x: innerWidth / 2, y: innerHeight * 0.4, vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 12 - 3, c: cols[i % 5], a: 0, l: 1 });
  if (start) requestAnimationFrame(stepConf);
}
function stepConf() {
  const ctx = conf.getContext('2d');
  ctx.clearRect(0, 0, conf.width, conf.height);
  parts = parts.filter((p) => p.l > 0);
  for (const p of parts) {
    p.x += p.vx; p.y += p.vy; p.vy += 0.4; p.a += 0.2; p.l -= 0.014;
    ctx.save(); ctx.globalAlpha = Math.max(0, p.l); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.c; ctx.fillRect(-5, -3, 10, 6); ctx.restore();
  }
  if (parts.length) requestAnimationFrame(stepConf);
}

// ---------------- accueil ----------------
function show(id) { for (const s of document.querySelectorAll('.screen')) s.hidden = s.id !== id; }
const unlocked = (i) => i === 0 || gsave(GAMES[i - 1].id).stars > 0;

function renderHome() {
  const box = $('#games');
  box.innerHTML = '';
  GAMES.forEach((g, i) => {
    const s = gsave(g.id), lock = !unlocked(i);
    const b = document.createElement('button');
    b.className = 'game-card' + (lock ? ' locked' : '') + (!lock && !s.stars ? ' next' : '');
    b.innerHTML = `<span class="num">${i + 1}</span><span class="icon">${lock ? '🔒' : g.icon}</span><span class="name">${t(g.name)}</span>
      <span class="meta">${'★'.repeat(s.stars)}${'☆'.repeat(3 - s.stars)} <span class="medal">${MEDALS[s.medal]}</span></span>`;
    if (!lock) b.addEventListener('click', () => startSession({ kind: 'game', ids: [g.id] }));
    box.append(b);
  });
  $('#rush-best').textContent = save.rush ? t('Record : {n}', { n: save.rush }) : t('Bats ton record !');
  $('#daily-best').textContent = save.daily[today()] != null ? t('Aujourd’hui : {n}/10', { n: save.daily[today()] }) : t('Nouveau défi !');
  $('#opt-sound').textContent = prefs.sound ? '🔊' : '🔇';
  $('#opt-voice').textContent = prefs.voice ? '🗣️' : '🤐';
}

// ---------------- séance ----------------
let S = null; // séance en cours
let R = null; // défi en cours

function startSession(cfg) {
  const rush = cfg.kind === 'rush', daily = cfg.kind === 'daily';
  const seed = daily ? hash('daily' + today()) : (Math.random() * 2 ** 32) >>> 0;
  let a = seed;
  const rand = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const ids = cfg.ids || GAMES.filter((g, i) => daily || unlocked(i)).map((g) => g.id);
  S = {
    ...cfg, rush, daily, ids, R: makeR(rand),
    total: rush ? Infinity : 10, idx: 0, correct: 0, streak: 0, best: 0, score: 0,
    timeLeft: rush ? 60 : Infinity,
    lvl: Object.fromEntries(ids.map((id) => [id, rush || daily ? (daily ? 1 + Math.floor(rand() * 2) : 1) : gsave(id).lvl])),
    runOk: {}, runBad: {}, maxLvl: {},
  };
  show('play');
  $('#hud').classList.toggle('rush', rush);
  $('#hud-title').textContent = rush ? '⚡ Rush' : daily ? t('📅 Défi du jour') : t(GAMES.find((g) => g.id === ids[0]).name);
  hud();
  nextRound();
  S.last = performance.now();
  requestAnimationFrame(loop);
}
function hash(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }

function hud() {
  $('#hud-score').textContent = S.score;
  $('#hud-streak').textContent = S.streak >= 2 ? `🔥 ${S.streak}` : '';
  $('#hud-streak').classList.toggle('hot', S.streak >= 5);
  const prog = $('#hud-prog');
  if (S.rush) prog.innerHTML = `<b class="${S.timeLeft < 10 ? 'low' : ''}">${Math.ceil(S.timeLeft)}</b> s`;
  else prog.innerHTML = Array.from({ length: S.total }, (_, i) => `<i class="${i < S.idx ? (S.results?.[i] ? 'ok' : 'ko') : i === S.idx ? 'cur' : ''}"></i>`).join('');
}

function nextRound() {
  if (!S) return;
  if (!S.rush && S.idx >= S.total) return endSession();
  const id = S.R.pick(S.ids);
  const game = GAMES.find((g) => g.id === id);
  const lvl = S.lvl[id];
  const mode = S.forceMode || (S.R.f() < 0.5 ? 'faire' : 'prevoir');
  const round = game.gen(lvl, S.R, mode);
  round.prompt = t(round.prompt);
  R = { ...round, id, game, lvl, actions: 0, t0: performance.now(), anim: null, done: false, picked: new Set() };
  R.limit = S.rush ? Math.max(4, 10 - S.streak * 0.35) : Infinity;
  $('#say').textContent = R.prompt;
  $('#mascot').textContent = '🦉';
  $('#lvl').textContent = '★'.repeat(lvl);
  $('#feedback').className = '';
  buildBottom();
  speak(R.prompt);
}

function buildBottom() {
  const opts = $('#options'), ctr = $('#controls');
  opts.innerHTML = ''; ctr.innerHTML = '';
  opts.hidden = !R.options; ctr.hidden = !R.controls;
  if (R.options) {
    R.options.forEach((draw, i) => {
      const b = document.createElement('button');
      b.className = 'opt';
      const c = document.createElement('canvas');
      b.append(c);
      b.addEventListener('click', () => pick(i, b));
      opts.append(b);
      b._draw = draw; b._c = c;
    });
    requestAnimationFrame(drawOptions);
  }
  if (R.controls) {
    for (const c of R.controls) {
      const b = document.createElement('button');
      b.className = 'ctl'; b.textContent = c.label;
      b.addEventListener('click', () => act(() => c.act()));
      ctr.append(b);
    }
  }
}

function drawOptions() {
  for (const b of document.querySelectorAll('#options .opt')) {
    const c = b._c, w = c.clientWidth, h = c.clientHeight;
    if (!w || !h) continue;
    const dpr = Math.min(devicePixelRatio || 1, 2.5);
    c.width = w * dpr; c.height = h * dpr;
    const ctx = c.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    b._draw(ctx, w, h);
  }
}

// ---- réponses ----
function isGood(i) {
  const a = R.answer;
  if (typeof a === 'number') return i === a;
  return (a.any || a.all).includes(i);
}
function pick(i, btn) {
  if (!R || R.done) return;
  const a = R.answer;
  if (a.all) {
    if (!isGood(i)) return finish(false, i);
    R.picked.add(i); btn.classList.add('chosen'); sound('click');
    if (R.picked.size === a.all.length) finish(true);
    return;
  }
  finish(isGood(i), i);
}
function act(fn) {
  if (!R || R.done) return;
  fn();
  R.actions++;
  sound('click');
  if (R.check()) finish(true);
  else if (R.fail?.() || R.actions >= R.maxActions) { R.solve?.(); finish(false); }
}
$('#scene').addEventListener('pointerdown', (e) => {
  if (!R?.tap || R.done) return;
  const r = e.currentTarget.getBoundingClientRect();
  if (R.tap(e.clientX - r.left, e.clientY - r.top, r.width, r.height)) act(() => {});
});

function finish(ok, picked) {
  R.done = true;
  const dt = (performance.now() - R.t0) / 1000;
  const perfect = ok && R.optimal != null && R.actions === R.optimal;
  // révélation : la bonne carte s'allume, l'animation montre ce qui se passe
  const btns = [...document.querySelectorAll('#options .opt')];
  if (R.options) {
    btns.forEach((b, i) => { if (isGood(i)) b.classList.add('good'); });
    if (!ok && picked != null) btns[picked]?.classList.add('bad');
  }
  R.anim = 0; R.animT0 = performance.now();
  const id = R.id;
  if (!S.rush) (S.results ||= [])[S.idx] = ok;
  S.idx++;
  if (ok) {
    S.correct++; S.streak++; S.best = Math.max(S.best, S.streak);
    const pts = 100 + 20 * Math.min(S.streak, 10) + (dt < 4 ? 50 : 0) + (perfect ? 50 : 0);
    S.score += pts;
    if (S.rush && S.streak % 3 === 0) S.timeLeft += 2; // +2 s toutes les 3 bonnes réponses d’affilée
    S.runOk[id] = (S.runOk[id] || 0) + 1; S.runBad[id] = 0;
    let msg = t(perfect ? 'Parfait !' : CHEERS[Math.floor(Math.random() * CHEERS.length)]);
    if ([3, 5, 10, 15, 20].includes(S.streak)) { msg = t('Série de {n} ! 🔥', { n: S.streak }); burst(S.streak * 6); }
    // 4 réussites d'affilée à un niveau : il est maîtrisé (médaille) et on monte
    let up = false;
    if (S.runOk[id] >= 4) {
      S.maxLvl[id] = Math.max(S.maxLvl[id] || 0, S.lvl[id]);
      S.runOk[id] = 0;
      if (S.lvl[id] < 4) { S.lvl[id]++; up = true; msg = t('Niveau supérieur ! ⭐'); sound('up'); }
    }
    if (!up) sound(perfect ? 'perfect' : 'ok', S.streak);
    feedback(true, `${msg}  +${pts}`);
    $('#mascot').textContent = S.streak >= 5 ? '🥳' : '🦉';
  } else {
    S.streak = 0;
    S.runBad[id] = (S.runBad[id] || 0) + 1; S.runOk[id] = 0;
    if (S.runBad[id] >= 2 && S.lvl[id] > 1) { S.lvl[id]--; S.runBad[id] = 0; }
    sound('bad');
    feedback(false, t(R.options ? 'Presque ! Regarde la bonne réponse.' : 'Presque ! Regarde.'));
    $('#mascot').textContent = '🤔';
  }
  hud();
  setTimeout(() => { if (S) nextRound(); }, ok ? 1100 : 1900);
}

function feedback(ok, msg) {
  const f = $('#feedback');
  f.textContent = msg;
  f.className = ok ? 'show ok' : 'show ko';
  if (!ok || msg.length > 14) speak(msg);
}

// ---- boucle de dessin ----
function loop(now) {
  if (!S) return;
  requestAnimationFrame(loop);
  const dt = Math.min(0.1, (now - S.last) / 1000); S.last = now;
  if (S.rush && R && !R.done) {
    S.timeLeft -= dt;
    if (S.timeLeft <= 0) { S.timeLeft = 0; return endSession(); }
    if ((now - R.t0) / 1000 > R.limit) { R.solve?.(); finish(false); }
  }
  if (S.rush) hud();
  if (R?.anim != null) R.anim = Math.min(1, (now - R.animT0) / 700);
  const c = $('#scene'), w = c.clientWidth, h = c.clientHeight;
  if (!w || !h || !R) return;
  const dpr = Math.min(devicePixelRatio || 1, 2.5);
  if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); drawOptions(); }
  const ctx = c.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  try { R.scene(ctx, w, h, now, R.anim); } catch (e) { console.error(e); }
  // barre de temps (Rush)
  if (S.rush && !R.done) {
    const k = Math.max(0, 1 - (now - R.t0) / 1000 / R.limit);
    ctx.fillStyle = k < 0.3 ? '#ef476f' : '#ffd166';
    ctx.fillRect(0, h - 6, w * k, 6);
  }
}

function endSession() {
  const s = S; S = null; R = null;
  speechSynthesis?.cancel?.();
  sound('end');
  let title = t('Bravo !'), extra = '';
  if (s.rush) {
    const rec = s.score > save.rush;
    if (rec) save.rush = s.score;
    title = t(rec ? '🏆 Nouveau record !' : 'Temps écoulé !');
    extra = `<p>${t('{n} bonnes réponses · meilleure série {b}', { n: s.correct, b: s.best })}</p>`;
  } else {
    const stars = s.correct >= 10 ? 3 : s.correct >= 8 ? 2 : s.correct >= 6 ? 1 : 0;
    let medalTxt = '';
    if (s.daily) save.daily[today()] = Math.max(save.daily[today()] || 0, s.correct);
    else {
      const g = gsave(s.ids[0]);
      g.stars = Math.max(g.stars, stars);
      g.lvl = s.lvl[s.ids[0]];
      const before = g.medal;
      if (stars > 0) g.medal = Math.max(g.medal, s.maxLvl[s.ids[0]] || 0);
      if (g.medal > before) medalTxt = `<p class="medal-up">${t('Nouvelle médaille : {m}', { m: MEDALS[g.medal] })}</p>`;
    }
    title = t(stars ? 'Bravo !' : 'On continue !');
    extra = `<div class="stars">${[1, 2, 3].map((k) => `<span class="${k <= stars ? 'on' : ''}" style="animation-delay:${k * 0.2}s">★</span>`).join('')}</div>
      <p>${t('{n} / 10 · meilleure série 🔥 {b}', { n: s.correct, b: s.best })}</p>` + medalTxt;
    if (stars >= 2) burst(120);
  }
  persist();
  $('#modal .modal-body').innerHTML = `<h2>${title}</h2><p class="score">${s.score}</p>${extra}
    <div class="row"><button class="btn primary big" data-act="again">${t('Encore ! ↻')}</button><button class="btn" data-act="home">${t('Accueil')}</button></div>`;
  $('#modal').hidden = false;
  $('#modal [data-act=again]').onclick = () => { $('#modal').hidden = true; startSession({ kind: s.kind, ids: s.kind === 'game' ? s.ids : undefined }); };
  $('#modal [data-act=home]').onclick = goHome;
}

function goHome() {
  S = null; R = null;
  $('#modal').hidden = true;
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  renderHome();
  show('home');
}

// ---------------- boutons ----------------
$('#btn-home').addEventListener('click', goHome);
langToggle($('#opt-lang'));
$('#btn-say').addEventListener('click', () => R && speak(R.prompt));
$('#btn-rush').addEventListener('click', () => startSession({ kind: 'rush' }));
$('#btn-daily').addEventListener('click', () => startSession({ kind: 'daily' }));
$('#opt-sound').addEventListener('click', () => { prefs.sound = !prefs.sound; store.set('prefs', prefs); renderHome(); });
$('#opt-voice').addEventListener('click', () => { prefs.voice = !prefs.voice; store.set('prefs', prefs); renderHome(); });
window.addEventListener('resize', () => R && drawOptions());

// accès direct : #3 (mini-jeu 3), #rush, #daily
function route() {
  const n = parseInt(location.hash.slice(1), 10);
  if (n >= 1 && n <= GAMES.length) startSession({ kind: 'game', ids: [GAMES[n - 1].id] });
  else if (location.hash === '#rush') startSession({ kind: 'rush' });
  else if (location.hash === '#daily') startSession({ kind: 'daily' });
  else goHome();
}
window.addEventListener('hashchange', route);
route();
// outil de test : strangeMind.show('panier', 3, 'faire')
function debugRound(id, lvl, mode) {
  if (!S) startSession({ kind: 'game', ids: [id] });
  S.ids = [id]; S.lvl[id] = lvl; S.forceMode = mode;
  nextRound();
}
window.strangeMind = { get S() { return S; }, get R() { return R; }, GAMES, startSession, show: debugRound, act };
