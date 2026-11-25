// Le vent invisible : outils de dessin et de calcul des « vents » (champs de vecteurs du plan).
//
// Un vent est fabriqué par des « choses » (tableau `things`) :
//   { k:'q', x, y, q, c }   fontaine (q > 0) ou trou (q < 0) : une charge, étalée sur un disque de rayon c
//   { k:'w', x, y, w, c }   tourbillon ↺ (w > 0) ou ↻ (w < 0) : un courant qui traverse la page
//   { k:'u', vx, vy }       vent uniforme (vient de très loin)
//   { k:'sh', a, axis }     rivière : axis 'x' → v = (a·y, 0) ; axis 'y' → v = (0, a·x)
// Coordonnées « monde » : le plateau est le carré [-1, 1]², y vers le HAUT.
import { drawGlyph, roundRect } from './glyphs.js';

export { drawGlyph, roundRect };
export const n360 = (d) => ((Math.round(d) % 360) + 360) % 360;
export const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const FONT = '"Baloo 2","Comic Sans MS","Trebuchet MS",sans-serif';
export const PINK = '#ef476f', BLUE = '#118ab2', INK = '#3d2c6b', SOFT = '#7b6fa8', VIOLET = '#7b2cbf';

export function text(ctx, s, x, y, size, color = INK, weight = 800) {
  ctx.save();
  ctx.font = `${weight} ${Math.round(size)}px ${FONT}`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = color; ctx.fillText(s, x, y);
  ctx.restore();
}

// ---------------- plateau ----------------
/** Carré monde [-1,1]² placé au centre de (w,h). X/Y : monde → pixels ; inv : pixels → monde. */
export function view(w, h, cx = w / 2, cy = h / 2, size = Math.min(w, h) * 0.96) {
  const s = size / 2;
  return { cx, cy, s, X: (x) => cx + x * s, Y: (y) => cy - y * s, inv: (px, py) => [(px - cx) / s, (cy - py) / s] };
}

export function board(ctx, v, color = '#f3fbff') {
  ctx.save();
  ctx.fillStyle = color; ctx.strokeStyle = 'rgba(17,138,178,.25)'; ctx.lineWidth = 2;
  roundRect(ctx, v.cx - v.s, v.cy - v.s, 2 * v.s, 2 * v.s, v.s * 0.08); ctx.fill(); ctx.stroke();
  ctx.restore();
}
export function clip(ctx, v) {
  roundRect(ctx, v.cx - v.s, v.cy - v.s, 2 * v.s, 2 * v.s, v.s * 0.08); ctx.clip();
}

// ---------------- les vents ----------------
export const Q = (x, y, q = 1, c = 0.12) => ({ k: 'q', x, y, q, c });
export const W = (x, y, w = 1, c = 0.12) => ({ k: 'w', x, y, w, c });
export const U = (vx, vy) => ({ k: 'u', vx, vy });
export const SH = (a, axis = 'x') => ({ k: 'sh', a, axis });

export function fieldOf(things) {
  return (x, y) => {
    let vx = 0, vy = 0;
    for (const t of things) {
      if (t.k === 'u') { vx += t.vx; vy += t.vy; continue; }
      if (t.k === 'sh') { if (t.axis === 'x') vx += t.a * y; else vy += t.a * x; continue; }
      const dx = x - t.x, dy = y - t.y, r2 = Math.max(dx * dx + dy * dy, t.c * t.c);
      if (t.k === 'q') { vx += (0.5 * t.q * dx) / r2; vy += (0.5 * t.q * dy) / r2; }
      if (t.k === 'w') { vx += (-0.5 * t.w * dy) / r2; vy += (0.5 * t.w * dx) / r2; }
    }
    return [vx, vy];
  };
}
const H = 0.004;
/** « Combien il en sort » (divergence) et « combien il tourne » (rotationnel) au point (x,y). */
export function div(f, x, y) { return (f(x + H, y)[0] - f(x - H, y)[0] + f(x, y + H)[1] - f(x, y - H)[1]) / (2 * H); }
export function curl(f, x, y) { return (f(x + H, y)[1] - f(x - H, y)[1] - f(x, y + H)[0] + f(x, y - H)[0]) / (2 * H); }
/** Circulation le long d'un cercle (sens ↺ positif). */
export function circulation(f, cx, cy, r, n = 128) {
  let s = 0;
  for (let i = 0; i < n; i++) {
    const a = ((i + 0.5) / n) * 2 * Math.PI, [vx, vy] = f(cx + r * Math.cos(a), cy + r * Math.sin(a));
    s += (-Math.sin(a) * vx + Math.cos(a) * vy) * ((2 * Math.PI * r) / n);
  }
  return s;
}
/** Vitesse « typique » d'un vent (médiane), pour régler la taille des flèches. */
export function refMag(f) {
  const m = [];
  for (let i = 0; i < 11; i++) for (let j = 0; j < 11; j++) m.push(Math.hypot(...f(-1 + (i + 0.5) / 5.5, -1 + (j + 0.5) / 5.5)));
  m.sort((a, b) => a - b);
  return m[60] || 1;
}

/** Flèche en pixels de (x,y) vers (x+dx, y+dy). */
export function arrowPx(ctx, x, y, dx, dy, color, lw = 2, head = null) {
  const L = Math.hypot(dx, dy);
  if (L < 0.5) return;
  const ux = dx / L, uy = dy / L, hd = head ?? Math.min(L * 0.45, lw * 3.6);
  ctx.save();
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dx - ux * hd * 0.6, y + dy - uy * hd * 0.6); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + dx, y + dy);
  ctx.lineTo(x + dx - ux * hd - uy * hd * 0.55, y + dy - uy * hd + ux * hd * 0.55);
  ctx.lineTo(x + dx - ux * hd + uy * hd * 0.55, y + dy - uy * hd - ux * hd * 0.55);
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

/** Grille de flèches d'un vent. */
export function arrows(ctx, v, f, { n = 9, color = 'rgba(61,44,107,.5)', lw, mref } = {}) {
  mref ||= refMag(f);
  const cell = (2 * v.s) / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const x = -1 + ((i + 0.5) * 2) / n, y = -1 + ((j + 0.5) * 2) / n;
    const [vx, vy] = f(x, y), m = Math.hypot(vx, vy);
    if (m < mref * 0.04) { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(v.X(x), v.Y(y), Math.max(1.5, cell * 0.04), 0, 7); ctx.fill(); continue; }
    const L = cell * 0.8 * clamp(m / mref, 0.3, 1.25);
    const ux = vx / m, uy = -vy / m;
    arrowPx(ctx, v.X(x) - (ux * L) / 2, v.Y(y) - (uy * L) / 2, ux * L, uy * L, color, lw ?? Math.max(1.5, cell * 0.07));
  }
}

/** Petites graines emportées par le vent : on « voit » le vent bouger. */
export class Flow {
  constructor(things, n = 150) { this.n = n; this.p = []; this.last = null; this.set(things); }
  set(things) { this.things = things; this.f = fieldOf(things); this.mref = refMag(this.f); }
  spawn(p) {
    const src = this.things.filter((t) => t.k === 'q' && t.q > 0);
    if (src.length && Math.random() < 0.4) {
      const s = src[Math.floor(Math.random() * src.length)], a = Math.random() * 7, r = Math.random() * s.c;
      p.x = s.x + Math.cos(a) * r; p.y = s.y + Math.sin(a) * r;
    } else { p.x = Math.random() * 2.1 - 1.05; p.y = Math.random() * 2.1 - 1.05; }
    p.age = 0; p.life = 1.2 + Math.random() * 2.6;
    return p;
  }
  draw(ctx, v, now, color = '#118ab2') {
    const dt = this.last == null ? 0 : clamp((now - this.last) / 1000, 0, 0.05);
    this.last = now;
    while (this.p.length < this.n) { const p = this.spawn({}); p.age = Math.random() * p.life; this.p.push(p); }
    ctx.save(); ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(2, v.s * 0.012);
    for (const p of this.p) {
      const [vx, vy] = this.f(p.x, p.y), m = Math.hypot(vx, vy);
      const sp = clamp(m / this.mref, 0.15, 1.8) * 0.38;
      if (m > 1e-6) { p.x += (vx / m) * sp * dt; p.y += (vy / m) * sp * dt; }
      p.age += dt;
      const sink = this.things.some((t) => t.k === 'q' && t.q < 0 && Math.hypot(p.x - t.x, p.y - t.y) < t.c * 0.7);
      if (p.age > p.life || Math.abs(p.x) > 1.08 || Math.abs(p.y) > 1.08 || sink) { this.spawn(p); continue; }
      const k = Math.min(1, p.age / 0.3, (p.life - p.age) / 0.4);
      if (m < 1e-6) continue;
      ctx.globalAlpha = 0.65 * k;
      const tl = 0.045 * clamp(m / this.mref, 0.4, 1.6);
      ctx.beginPath(); ctx.moveTo(v.X(p.x - (vx / m) * tl), v.Y(p.y - (vy / m) * tl)); ctx.lineTo(v.X(p.x), v.Y(p.y)); ctx.stroke();
    }
    ctx.restore();
  }
}

/** Plateau complet : fond, flèches, graines. */
export function windBoard(ctx, v, flow, now, { arrowsN = 9, particles = true, ghost = null } = {}) {
  board(ctx, v);
  ctx.save(); clip(ctx, v);
  if (ghost) arrows(ctx, v, fieldOf(ghost), { n: arrowsN, color: 'rgba(123,44,191,.28)', lw: Math.max(3, v.s * 0.03) });
  arrows(ctx, v, flow.f, { n: arrowsN, mref: flow.mref });
  if (particles) flow.draw(ctx, v, now);
  ctx.restore();
}

// ---------------- petits dessins ----------------
/** Flèche courbe qui tourne : sign +1 = ↺ (rose), -1 = ↻ (bleu). */
export function spin(ctx, x, y, r, sign, color, lw) {
  color ||= sign > 0 ? PINK : BLUE;
  lw ||= Math.max(2, r * 0.22);
  ctx.save();
  ctx.translate(x, y);
  if (sign < 0) ctx.scale(-1, 1);
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round';
  const a0 = 0.5, a1 = -Math.PI * 1.45; // anti-horaire à l'écran
  ctx.beginPath(); ctx.arc(0, 0, r, a0, a1, true); ctx.stroke();
  const ex = r * Math.cos(a1), ey = r * Math.sin(a1), tx = Math.sin(a1), ty = -Math.cos(a1), hd = lw * 1.9;
  ctx.beginPath();
  ctx.moveTo(ex + tx * hd * 1.2, ey + ty * hd * 1.2);
  ctx.lineTo(ex - ty * hd, ey + tx * hd);
  ctx.lineTo(ex + ty * hd, ey - tx * hd);
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

/** Fontaine (+1) ou trou (−1). */
export function source(ctx, x, y, r, sign, alpha = 1) {
  ctx.save(); ctx.globalAlpha *= alpha;
  const col = sign > 0 ? '#ff9f1c' : '#3a86ff', dark = sign > 0 ? '#b35c00' : '#1d4e89';
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * 2 * Math.PI, c = Math.cos(a), s = Math.sin(a);
    if (sign > 0) arrowPx(ctx, x + c * r * 1.05, y + s * r * 1.05, c * r * 0.75, s * r * 0.75, col, Math.max(1.5, r * 0.16));
    else arrowPx(ctx, x + c * r * 1.85, y + s * r * 1.85, -c * r * 0.75, -s * r * 0.75, col, Math.max(1.5, r * 0.16));
  }
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  g.addColorStop(0, sign > 0 ? '#ffe8a3' : '#bcd6ff'); g.addColorStop(1, col);
  ctx.fillStyle = g; ctx.strokeStyle = dark; ctx.lineWidth = Math.max(1.5, r * 0.1);
  ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.stroke();
  text(ctx, sign > 0 ? '+' : '−', x, y + r * 0.04, r * 1.5, '#fff');
  ctx.restore();
}
/** « Rien ici » : cercle pointillé. */
export function nothing(ctx, x, y, r) {
  ctx.save(); ctx.setLineDash([r * 0.25, r * 0.2]); ctx.strokeStyle = 'rgba(123,111,168,.6)'; ctx.lineWidth = Math.max(1.5, r * 0.1);
  ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke(); ctx.restore();
}
/** Tourbillon-chose (courant) : disque violet avec sa flèche qui tourne. */
export function whirlThing(ctx, x, y, r, sign, alpha = 1) {
  ctx.save(); ctx.globalAlpha *= alpha;
  ctx.fillStyle = sign > 0 ? 'rgba(239,71,111,.18)' : 'rgba(17,138,178,.18)';
  ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  spin(ctx, x, y, r * 0.62, sign);
  ctx.restore();
}

/** Moulinet à 4 pales (angle en degrés, sens ↺). */
export function pinwheel(ctx, x, y, r, angle = 0, alpha = 1) {
  ctx.save(); ctx.globalAlpha *= alpha;
  ctx.translate(x, y); ctx.rotate((-angle * Math.PI) / 180);
  const cols = ['#ef476f', '#ffd166', '#06d6a0', '#118ab2'];
  for (let i = 0; i < 4; i++) {
    ctx.save(); ctx.rotate((i * Math.PI) / 2);
    ctx.fillStyle = cols[i]; ctx.strokeStyle = 'rgba(61,44,107,.55)'; ctx.lineWidth = Math.max(1, r * 0.05);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(r, 0); ctx.quadraticCurveTo(r * 0.75, -r * 0.6, 0, -r * 0.42); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = Math.max(1, r * 0.06);
  ctx.beginPath(); ctx.arc(0, 0, r * 0.13, 0, 7); ctx.fill(); ctx.stroke();
  ctx.restore();
}

/** Boussole : aiguille rouge (nord) vers `dir` (degrés, ↺ depuis la droite) ; dir null = aiguille cachée. */
export function compass(ctx, x, y, r, dir, { ghost = null, alpha = 1 } = {}) {
  ctx.save(); ctx.globalAlpha *= alpha;
  ctx.fillStyle = '#fff'; ctx.strokeStyle = '#8d99ae'; ctx.lineWidth = Math.max(1.5, r * 0.1);
  ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.stroke();
  const needle = (d, north, south, big = 1) => {
    const a = (-d * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a), L = r * 0.82 * big, wd = r * 0.22 * big;
    ctx.save(); ctx.translate(x, y);
    const half = (sg, col) => {
      ctx.beginPath(); ctx.moveTo(c * L * sg, s * L * sg); ctx.lineTo(-s * wd, c * wd); ctx.lineTo(s * wd, -c * wd); ctx.closePath();
      ctx.fillStyle = col; ctx.fill();
    };
    half(1, north); half(-1, south);
    ctx.restore();
  };
  // fantôme : grande aiguille violette transparente (pointe nord plus foncée)
  if (ghost != null) needle(ghost, 'rgba(123,44,191,.55)', 'rgba(123,44,191,.18)', 1.45);
  if (dir == null) text(ctx, '?', x, y, r * 1.1, '#c9b8ea');
  else needle(dir, '#e63946', '#d9dce3');
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x, y, r * 0.09, 0, 7); ctx.fill();
  ctx.restore();
}

/** Fil vu du dessus : 1 = le courant sort vers toi (•), −1 = il rentre (×), 0 = éteint. */
export function wire(ctx, x, y, r, state) {
  ctx.save();
  const on = state !== 0;
  ctx.fillStyle = on ? '#ffd166' : '#e9e4f5'; ctx.strokeStyle = on ? '#b58900' : '#a9a1c6'; ctx.lineWidth = Math.max(2, r * 0.14);
  if (on) { ctx.shadowColor = '#ffd166'; ctx.shadowBlur = r * 0.8; }
  ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = INK; ctx.strokeStyle = INK; ctx.lineWidth = Math.max(2, r * 0.16); ctx.lineCap = 'round';
  if (state === 1) { ctx.beginPath(); ctx.arc(x, y, r * 0.24, 0, 7); ctx.fill(); }
  if (state === -1) { const k = r * 0.45; ctx.beginPath(); ctx.moveTo(x - k, y - k); ctx.lineTo(x + k, y + k); ctx.moveTo(x + k, y - k); ctx.lineTo(x - k, y + k); ctx.stroke(); }
  ctx.restore();
}

/** Lac circulaire (chemin fermé). colorBy(f) : colore chaque morceau selon le sens où le vent pousse. */
export function lake(ctx, v, c, r, { f = null, highlight = false, mref = 1 } = {}) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = highlight ? 'rgba(255,209,102,.9)' : 'rgba(17,138,178,.35)'; ctx.lineWidth = Math.max(6, v.s * 0.07);
  ctx.beginPath(); ctx.arc(v.X(c[0]), v.Y(c[1]), r * v.s, 0, 7); ctx.stroke();
  if (f) {
    const n = 48;
    ctx.lineWidth = Math.max(4, v.s * 0.035);
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * 2 * Math.PI, a1 = ((i + 1) / n) * 2 * Math.PI, am = (a0 + a1) / 2;
      const [vx, vy] = f(c[0] + r * Math.cos(am), c[1] + r * Math.sin(am));
      const tg = (-Math.sin(am) * vx + Math.cos(am) * vy) / mref;
      ctx.strokeStyle = tg > 0 ? PINK : BLUE; ctx.globalAlpha = clamp(Math.abs(tg), 0.15, 1);
      ctx.beginPath(); ctx.arc(v.X(c[0]), v.Y(c[1]), r * v.s, -a1, -a0); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  } else {
    ctx.setLineDash([v.s * 0.03, v.s * 0.03]); ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(v.X(c[0]), v.Y(c[1]), r * v.s, 0, 7); ctx.stroke();
  }
  ctx.restore();
}

/** Tuile-nombre (comme dans les défis éclair) : 1 lapin debout, -1 tête en bas, 0 nuage. */
export function numberTile(ctx, x, y, s, val) {
  ctx.save();
  ctx.fillStyle = val === 0 ? '#e3f1ff' : '#ffe3ec';
  ctx.strokeStyle = 'rgba(61,44,107,.3)'; ctx.lineWidth = 2;
  roundRect(ctx, x - s / 2, y - s / 2, s, s, s * 0.18); ctx.fill(); ctx.stroke();
  ctx.restore();
  drawGlyph(ctx, val === 0 ? 'cloud' : 'bunny', x, y, s * 0.36, val < 0 ? 180 : 0);
}
/** Tuile-tourbillon : ↺ (1), ↻ (−1) ou nuage (0). */
export function whirlTile(ctx, x, y, s, val) {
  ctx.save();
  ctx.fillStyle = val === 0 ? '#e3f1ff' : '#efe3ff';
  ctx.strokeStyle = 'rgba(61,44,107,.3)'; ctx.lineWidth = 2;
  roundRect(ctx, x - s / 2, y - s / 2, s, s, s * 0.18); ctx.fill(); ctx.stroke();
  ctx.restore();
  if (val === 0) drawGlyph(ctx, 'cloud', x, y, s * 0.36);
  else spin(ctx, x, y, s * 0.27, val);
}

/** Loupe magique (la « sonde »). */
export function loupe(ctx, x, y, r) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#6d4c41'; ctx.lineWidth = r * 0.28;
  ctx.beginPath(); ctx.moveTo(x + r * 0.75, y + r * 0.75); ctx.lineTo(x + r * 1.5, y + r * 1.5); ctx.stroke();
  ctx.strokeStyle = VIOLET; ctx.lineWidth = r * 0.16;
  ctx.fillStyle = 'rgba(255,255,255,.18)';
  ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.stroke();
  ctx.restore();
}

/** Tapis balayé par deux flèches (o = origine en pixels, a et b en pixels, y vers le bas). */
export function wedgeTile(ctx, o, a, b, sign, alpha) {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha *= alpha;
  ctx.fillStyle = sign > 0 ? 'rgba(239,71,111,.22)' : sign < 0 ? 'rgba(17,138,178,.22)' : 'rgba(123,111,168,.2)';
  ctx.beginPath(); ctx.moveTo(o[0], o[1]); ctx.lineTo(o[0] + a[0], o[1] + a[1]); ctx.lineTo(o[0] + a[0] + b[0], o[1] + a[1] + b[1]); ctx.lineTo(o[0] + b[0], o[1] + b[1]); ctx.closePath(); ctx.fill();
  ctx.setLineDash([6, 6]); ctx.strokeStyle = 'rgba(123,111,168,.6)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.restore();
  if (sign) {
    const m = [o[0] + (a[0] + b[0]) / 2, o[1] + (a[1] + b[1]) / 2];
    const area = Math.abs(a[0] * b[1] - a[1] * b[0]);
    ctx.save(); ctx.globalAlpha *= alpha; spin(ctx, m[0], m[1], clamp(Math.sqrt(area) * 0.25, 8, 60), sign); ctx.restore();
  }
}
/** Carte-réponse d'un tapis : ↺, ↻ ou tout plat (0). */
export function tileCard(ctx, w, h, sign) {
  const s = Math.min(w, h) * 0.62, x = w / 2, y = h / 2;
  if (!sign) {
    ctx.save(); ctx.strokeStyle = SOFT; ctx.lineWidth = Math.max(3, s * 0.05); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - s * 0.55, y); ctx.lineTo(x + s * 0.55, y); ctx.stroke(); ctx.restore();
    text(ctx, '=', x, y - s * 0.32, s * 0.3, SOFT);
    return;
  }
  ctx.save();
  ctx.fillStyle = sign > 0 ? 'rgba(239,71,111,.2)' : 'rgba(17,138,178,.2)';
  ctx.beginPath(); ctx.moveTo(x - s * 0.5, y + s * 0.35); ctx.lineTo(x + s * 0.3, y + s * 0.35); ctx.lineTo(x + s * 0.5, y - s * 0.35); ctx.lineTo(x - s * 0.3, y - s * 0.35); ctx.closePath(); ctx.fill();
  ctx.restore();
  spin(ctx, x, y, s * 0.24, sign);
}

/** Aimant vertical : `down` = pôle tourné vers le bas ('N' rouge ou 'S' bleu). */
export function magnet(ctx, x, y, wd, ht, down) {
  ctx.save();
  const top = down === 'N' ? 'S' : 'N';
  const col = (p) => (p === 'N' ? '#e63946' : '#3a86ff');
  ctx.strokeStyle = INK; ctx.lineWidth = 2;
  ctx.fillStyle = col(top); roundRect(ctx, x - wd / 2, y - ht / 2, wd, ht / 2, wd * 0.15); ctx.fill(); ctx.stroke();
  ctx.fillStyle = col(down); roundRect(ctx, x - wd / 2, y, wd, ht / 2, wd * 0.15); ctx.fill(); ctx.stroke();
  text(ctx, top, x, y - ht / 4, wd * 0.6, '#fff');
  text(ctx, down, x, y + ht / 4, wd * 0.6, '#fff');
  ctx.restore();
}
/** Anneau vu en perspective, avec sa lampe ; current : +1 ↺ (vu d'en haut), −1 ↻, 0 rien. */
export function ring(ctx, x, y, rx, ry, current, now = 0, glow = 1) {
  ctx.save();
  ctx.strokeStyle = '#b87333'; ctx.lineWidth = Math.max(4, ry * 0.22);
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, 7); ctx.stroke();
  // lampe à droite
  const lx = x + rx, ly = y - ry * 0.1;
  if (current) { ctx.save(); ctx.shadowColor = '#ffd166'; ctx.shadowBlur = 40 * glow; ctx.fillStyle = `rgba(255,209,102,${0.5 + 0.5 * glow})`; ctx.beginPath(); ctx.arc(lx, ly - ry * 0.6, ry * 0.75, 0, 7); ctx.fill(); ctx.restore(); }
  ctx.fillStyle = current ? '#fff3b0' : '#eceaf3'; ctx.strokeStyle = '#8d99ae'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(lx, ly - ry * 0.6, ry * 0.6, 0, 7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#8d99ae'; ctx.fillRect(lx - ry * 0.3, ly - ry * 0.1, ry * 0.6, ry * 0.35);
  // petites flèches du courant (vu d'en haut ↺ : le devant va vers la droite)
  if (current) {
    // y écran vers le bas = vers l'avant : vu d'en haut, ↺ fait aller le devant de l'anneau vers la droite,
    // c'est-à-dire l'angle a DÉCROISSANT dans ce paramétrage
    const ph = -(now / 1000) * current * 1.4;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * 2 * Math.PI + ph;
      const px = x + rx * Math.cos(a), py = y + ry * Math.sin(a);
      const tx = rx * Math.sin(a) * current, ty = -ry * Math.cos(a) * current, L = Math.hypot(tx, ty);
      arrowPx(ctx, px - (tx / L) * ry * 0.3, py - (ty / L) * ry * 0.3, (tx / L) * ry * 0.6, (ty / L) * ry * 0.6, VIOLET, Math.max(2, ry * 0.12));
    }
  }
  ctx.restore();
}
/** Carte : l'anneau vu d'en haut, avec son courant. */
export function ringCard(ctx, w, h, current) {
  const r = Math.min(w, h) * 0.3, x = w / 2, y = h / 2 + r * 0.15;
  ctx.save();
  ctx.strokeStyle = '#b87333'; ctx.lineWidth = Math.max(4, r * 0.14);
  ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke(); ctx.restore();
  if (current) spin(ctx, x, y, r * 0.55, current);
  text(ctx, current ? '💡' : '🌑', x + r * 0.95, y - r * 0.95, r * 0.7);
}
