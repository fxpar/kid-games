// Strange Mind v5 : la chasse aux relations. Accueil, chapitres de 3 plateaux, chasse libre.
import { CHAPTERS, RELATIONS, makeR } from './relations.js';
import { Hunt, drawTile } from './hunt.js';
import { t, setDictionary, translateDom, langToggle, speechLang, voicePrefix } from './i18n.js';
import EN from './i18n-en.js';

setDictionary(EN);
translateDom();

const $ = (s) => document.querySelector(s);
const store = {
  get(k, d) { try { const v = localStorage.getItem('strange-mind-v5:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('strange-mind-v5:' + k, JSON.stringify(v)); } catch { /* */ } },
};
const save = store.get('save', { stars: {}, free: 0 });
const prefs = { sound: true, voice: true, ...store.get('prefs', {}) };
const persist = () => store.set('save', save);
const BOARDS = 3;

// ---------------- sons & voix ----------------
let ac;
function tone(f, t, d, type = 'triangle', vol = 0.14) {
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.value = f;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g).connect(ac.destination); o.start(t); o.stop(t + d + 0.02);
}
function sound(name, n = 1) {
  if (!prefs.sound) return;
  try {
    ac ||= new (window.AudioContext || window.webkitAudioContext)();
    const t = ac.currentTime, f = 523 * Math.pow(2, Math.min(n - 1, 12) * 2 / 12);
    if (name === 'tap') tone(900, t, 0.03, 'sine', 0.04);
    if (name === 'find') { tone(f, t, 0.12); tone(f * 1.5, t + 0.07, 0.2); }
    if (name === 'miss') tone(200, t, 0.18, 'sine', 0.1);
    if (name === 'almost') { tone(500, t, 0.1, 'sine', 0.08); tone(400, t + 0.1, 0.1, 'sine', 0.08); }
    if (name === 'already') tone(600, t, 0.06, 'sine', 0.05);
    if (name === 'board') [0, 4, 7, 12].forEach((k, i) => tone(523 * Math.pow(2, k / 12), t + i * 0.09, 0.2));
    if (name === 'tick') tone(1000, t, 0.03, 'square', 0.03);
  } catch { /* */ }
}
function speak(txt) {
  if (!prefs.voice || !('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(txt.replace(/\p{Extended_Pictographic}|️|[↺↻×]/gu, ''));
  u.lang = speechLang(); u.pitch = 1.1;
  const v = speechSynthesis.getVoices().find((x) => x.lang?.startsWith(voicePrefix()));
  if (v) u.voice = v;
  speechSynthesis.speak(u);
}

// ---------------- accueil ----------------
function show(id) { for (const s of document.querySelectorAll('.screen')) s.hidden = s.id !== id; }
const unlocked = (i) => i === 0 || (save.stars[CHAPTERS[i - 1].id] || 0) > 0;

function renderHome() {
  const box = $('#chapters');
  box.innerHTML = '';
  CHAPTERS.forEach((ch, i) => {
    const st = save.stars[ch.id] || 0, lock = !unlocked(i);
    const b = document.createElement('button');
    b.className = 'chap' + (lock ? ' locked' : '') + (!lock && !st ? ' next' : '');
    const pts = ch.rels.map((id) => RELATIONS[id].pts);
    b.innerHTML = `<span class="num">${i + 1}</span><span class="icon">${lock ? '🔒' : ch.icon}</span><span class="name">${t(ch.name)}</span>
      <span class="pts">${t('jusqu’à {n} pts', { n: Math.max(...pts) })}</span><span class="st">${'★'.repeat(st)}${'☆'.repeat(3 - st)}</span>`;
    if (!lock) b.addEventListener('click', () => startChapter(i));
    box.append(b);
  });
  $('#free-best').textContent = save.free ? t('Record : {n}', { n: save.free }) : t('Toutes les relations débloquées');
  $('#opt-sound').textContent = prefs.sound ? '🔊' : '🔇';
  $('#opt-voice').textContent = prefs.voice ? '🗣️' : '🤐';
}

// ---------------- partie ----------------
let G = null; // { mode:'chapter'|'free', chIndex, boardNo, score, stars:[], hunt, time }

function startChapter(i) {
  G?.hunt?.destroy();
  G = { mode: 'chapter', chIndex: i, boardNo: 0, score: 0, stars: [] };
  show('play');
  nextBoard();
}
function startFree() {
  G?.hunt?.destroy();
  G = { mode: 'free', boardNo: 0, score: 0, time: 90, last: performance.now() };
  show('play');
  nextBoard();
  requestAnimationFrame(tickFree);
}

function nextBoard() {
  G.hunt?.destroy();
  $('#modal').hidden = true;
  const pool = CHAPTERS.filter((_, i) => unlocked(i));
  const ch = G.mode === 'chapter' ? CHAPTERS[G.chIndex] : pool[Math.floor(Math.random() * pool.length)];
  G.ch = ch;
  G.boardNo++;
  $('#hud-title').textContent = G.mode === 'chapter' ? t('{icon} {name} · plateau {n}/{total}', { icon: ch.icon, name: t(ch.name), n: G.boardNo, total: BOARDS }) : t('⏱️ Chasse libre · {name}', { name: t(ch.name) });
  G.hunt = new Hunt($('#board'), ch, makeR(Math.random), {
    sound,
    onFind: (id, pts, combo) => {
      G.score += pts;
      say(combo >= 3 ? t('Combo ×{n} ! 🔥', { n: combo }) : t(['Trouvé !', 'Bien vu !', 'Oui !', 'Bravo !'][Math.floor(Math.random() * 4)]));
      if (G.mode === 'free') G.time += 1;
      refresh();
    },
    onMiss: (kind) => {
      if (kind === 'reverse') say(t('Presque ! Essaie dans l’autre sens ↔'), true);
      else if (kind === 'already') say(t('Celui-là, tu l’as déjà trouvé !'));
      else say(t('Non… regarde bien le modèle.'));
      refresh();
    },
    onDone: boardDone,
  });
  buildCards();
  refresh();
  const names = ch.rels.map((id) => t(RELATIONS[id].name)).join(', ');
  say(G.boardNo === 1 && G.mode === 'chapter' ? t('Trouve TOUS les endroits comme les modèles : {names}', { names }) : t('Trouve-les tous !'), true);
}

function say(txt, voice = false) {
  $('#say').textContent = txt;
  if (voice) speak(txt);
}

// cartes « modèle » : un exemple qui tourne, les points, les trouvailles
function buildCards() {
  const box = $('#cards');
  box.innerHTML = '';
  G.cards = G.ch.rels.map((id) => {
    const rel = RELATIONS[id];
    const card = document.createElement('div');
    card.className = 'card';
    card.style.setProperty('--rc', rel.color);
    card.innerHTML = `<canvas></canvas><div class="info"><b>${t(rel.name)}</b><span class="pts">${rel.pts} pts</span><div class="dots"></div></div>`;
    box.append(card);
    return { id, rel, card, canvas: card.querySelector('canvas'), dots: card.querySelector('.dots') };
  });
}

function drawCards(now) {
  if (!G?.cards) return;
  const k = Math.floor(now / 1700);
  for (const c of G.cards) {
    const cv = c.canvas, w = cv.clientWidth, h = cv.clientHeight;
    if (!w || !h) continue;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const tiles = c.rel.example(k);
    if (c.rel.kind === 'square') {
      const s = Math.min(w, h) * 0.46;
      tiles.forEach((t, i) => drawTile(ctx, t, w / 2 + ((i % 2) - 0.5) * s * 1.04, h / 2 + (Math.floor(i / 2) - 0.5) * s * 1.04, s));
    } else {
      const n = tiles.length, s = Math.min(h * 0.8, (w / n) * 0.9);
      const x0 = w / 2 - ((n - 1) / 2) * s * 1.05;
      tiles.forEach((t, i) => drawTile(ctx, t, x0 + i * s * 1.05, h / 2, s));
      if (c.rel.ordered) {
        ctx.save(); ctx.strokeStyle = c.rel.color; ctx.fillStyle = c.rel.color; ctx.lineWidth = 3; ctx.lineCap = 'round';
        const y = h / 2 + s * 0.6, xa = x0 - s * 0.2, xb = x0 + (n - 1) * s * 1.05 + s * 0.2;
        ctx.beginPath(); ctx.moveTo(xa, y); ctx.lineTo(xb, y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(xb + 7, y); ctx.lineTo(xb - 3, y - 6); ctx.lineTo(xb - 3, y + 6); ctx.fill();
        ctx.restore();
      }
    }
  }
}

function refresh() {
  const h = G.hunt;
  $('#hud-score').textContent = G.score;
  $('#hud-combo').textContent = h.combo >= 2 ? `🔥×${h.combo}` : '';
  for (const c of G.cards) {
    const tot = h.total(c.id), got = h.found[c.id].size;
    c.dots.innerHTML = Array.from({ length: tot }, (_, i) => `<i class="${i < got ? 'on' : ''}"></i>`).join('');
    c.card.classList.toggle('done', got === tot);
  }
}

function boardDone() {
  const h = G.hunt;
  sound('board');
  burst();
  if (G.mode === 'free') {
    G.time += 15;
    G.score += 100;
    say(t('Plateau terminé ! +15 s'), true);
    setTimeout(() => G && nextBoard(), 900);
    return;
  }
  const st = h.mistakes <= 1 ? 3 : h.mistakes <= 3 ? 2 : 1;
  G.stars.push(st);
  const bonus = 50 * st;
  G.score += bonus;
  const last = G.boardNo >= BOARDS;
  const body = $('#modal .modal-body');
  if (!last) {
    body.innerHTML = `<h2>${t('Plateau réussi !')}</h2>${starsHtml(st)}<p>${h.mistakes ? t(h.mistakes > 1 ? '{n} erreurs' : '{n} erreur', { n: h.mistakes }) : t('Aucune erreur !')} · bonus +${bonus}</p>
      <div class="row"><button class="btn primary big" data-act="next">${t('Plateau suivant ▶')}</button></div>`;
  } else {
    const avg = Math.round(G.stars.reduce((a, b) => a + b, 0) / G.stars.length);
    const id = CHAPTERS[G.chIndex].id;
    save.stars[id] = Math.max(save.stars[id] || 0, avg);
    persist();
    const nxt = CHAPTERS[G.chIndex + 1];
    body.innerHTML = `<h2>${t('Chapitre réussi !')}</h2>${starsHtml(avg)}<p class="score">${G.score}</p>
      ${nxt ? `<p>${t('Nouveau chapitre : <b>{icon} {name}</b> (relations à {pts} pts)', { icon: nxt.icon, name: t(nxt.name), pts: Math.max(...nxt.rels.map((r) => RELATIONS[r].pts)) })}</p>` : `<p>${t('Tu as trouvé toutes les relations !')}</p>`}
      <div class="row">${nxt ? `<button class="btn primary big" data-act="nextch">${t('Chapitre suivant ▶')}</button>` : ''}
      <button class="btn" data-act="again">${t('Rejouer ↻')}</button><button class="btn" data-act="home">${t('Accueil')}</button></div>`;
  }
  $('#modal').hidden = false;
  body.querySelector('[data-act=next]')?.addEventListener('click', nextBoard);
  body.querySelector('[data-act=nextch]')?.addEventListener('click', () => startChapter(G.chIndex + 1));
  body.querySelector('[data-act=again]')?.addEventListener('click', () => startChapter(G.chIndex));
  body.querySelector('[data-act=home]')?.addEventListener('click', goHome);
}
const starsHtml = (n) => `<div class="stars">${[1, 2, 3].map((k) => `<span class="${k <= n ? 'on' : ''}" style="animation-delay:${k * 0.2}s">★</span>`).join('')}</div>`;

function tickFree(now) {
  if (!G || G.mode !== 'free') return;
  const dt = Math.min(0.1, (now - G.last) / 1000); G.last = now;
  if (!G.hunt.done) G.time -= dt;
  $('#hud-time').textContent = `⏱️ ${Math.ceil(Math.max(0, G.time))}`;
  $('#hud-time').classList.toggle('low', G.time < 10);
  if (G.time <= 0) return endFree();
  requestAnimationFrame(tickFree);
}
function endFree() {
  const score = G.score;
  G.hunt.destroy(); G = null;
  const rec = score > save.free;
  if (rec) save.free = score;
  persist();
  $('#modal .modal-body').innerHTML = `<h2>${t(rec ? '🏆 Nouveau record !' : 'Temps écoulé !')}</h2><p class="score">${score}</p><p>${t('Record : {n}', { n: save.free })}</p>
    <div class="row"><button class="btn primary big" data-act="again">${t('Encore ↻')}</button><button class="btn" data-act="home">${t('Accueil')}</button></div>`;
  $('#modal').hidden = false;
  $('#modal [data-act=again]').onclick = startFree;
  $('#modal [data-act=home]').onclick = goHome;
}

function goHome() {
  G?.hunt?.destroy(); G = null;
  $('#modal').hidden = true;
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  renderHome();
  show('home');
}

// boucle des cartes-modèles
(function loop(now) { drawCards(now); requestAnimationFrame(loop); })(performance.now());

// ---------------- confettis ----------------
const conf = $('#confetti');
let parts = [];
function burst(n = 80) {
  conf.width = innerWidth; conf.height = innerHeight;
  const cols = ['#ef476f', '#ffd166', '#06d6a0', '#118ab2', '#7b2cbf'];
  const start = !parts.length;
  for (let i = 0; i < n; i++) parts.push({ x: innerWidth / 2, y: innerHeight * 0.45, vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 12 - 3, c: cols[i % 5], a: 0, l: 1 });
  if (start) requestAnimationFrame(stepConf);
}
function stepConf() {
  const ctx = conf.getContext('2d');
  ctx.clearRect(0, 0, conf.width, conf.height);
  parts = parts.filter((p) => p.l > 0);
  for (const p of parts) { p.x += p.vx; p.y += p.vy; p.vy += 0.4; p.a += 0.2; p.l -= 0.014; ctx.save(); ctx.globalAlpha = Math.max(0, p.l); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.c; ctx.fillRect(-5, -3, 10, 6); ctx.restore(); }
  if (parts.length) requestAnimationFrame(stepConf);
}

// ---------------- boutons ----------------
$('#btn-home').addEventListener('click', goHome);
langToggle($('#opt-lang'));
$('#btn-hint').addEventListener('click', () => { if (G?.hunt && !G.hunt.done && G.hunt.showHint()) { say(t('Regarde la case qui brille… et cherche autour !')); refresh(); } });
$('#btn-free').addEventListener('click', startFree);
$('#opt-sound').addEventListener('click', () => { prefs.sound = !prefs.sound; store.set('prefs', prefs); renderHome(); });
$('#opt-voice').addEventListener('click', () => { prefs.voice = !prefs.voice; store.set('prefs', prefs); renderHome(); });
$('#btn-help').addEventListener('click', () => { $('#modal .modal-body').innerHTML = $('#help-template').innerHTML; $('#modal').hidden = false; $('#modal [data-act=ok]').onclick = () => { $('#modal').hidden = true; }; });

function route() {
  const n = parseInt(location.hash.slice(1), 10);
  if (n >= 1 && n <= CHAPTERS.length) startChapter(n - 1);
  else if (location.hash === '#libre') startFree();
  else goHome();
}
window.addEventListener('hashchange', route);
route();
window.strangeMind = { get G() { return G; }, CHAPTERS, startChapter };
