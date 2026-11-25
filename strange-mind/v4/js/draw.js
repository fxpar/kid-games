// Outils de dessin partagés par les mini-jeux (contexte 2D en pixels CSS).
import { drawGlyph, roundRect } from './glyphs.js';

export { drawGlyph, roundRect };
export const n360 = (d) => ((Math.round(d) % 360) + 360) % 360;
export const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const FONT = '"Baloo 2","Comic Sans MS","Trebuchet MS",sans-serif';

export function text(ctx, s, x, y, size, color = '#3d2c6b', weight = 800) {
  ctx.save();
  ctx.font = `${weight} ${Math.round(size)}px ${FONT}`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = color; ctx.fillText(s, x, y);
  ctx.restore();
}

/** Dessin « fantôme » (ce qu'il faut obtenir). */
export function ghost(ctx, g, x, y, r, a = 0, m = false) {
  ctx.save();
  ctx.setLineDash([6, 6]); ctx.strokeStyle = 'rgba(123,44,191,.5)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(x, y, r * 1.1, 0, 7); ctx.stroke();
  ctx.restore();
  drawGlyph(ctx, g, x, y, r, a, m, 0.3);
}

/**
 * Une ligne d'éléments centrée : 'texte' ou { g, a, m, alpha, box, ghost: {g,a,m}, hide }.
 * Renvoie les centres (pour placer des zones à toucher).
 */
export function row(ctx, w, h, items, y = h / 2, maxR = Infinity) {
  const units = items.map((it) => (typeof it === 'string' ? 0.75 : it.big ? 2.5 : 2));
  const total = units.reduce((s, u) => s + u, 0);
  const u = Math.min(w / total, (h * 0.92) / 2.5);
  const r = Math.min(u * 0.9, maxR);
  let x = (w - total * u) / 2;
  const centers = [];
  items.forEach((it, i) => {
    const cw = units[i] * u, cx = x + cw / 2;
    centers.push([cx, y, r]);
    if (typeof it === 'string') text(ctx, it, cx, y, r * 0.95, '#7b6fa8');
    else {
      const rr = it.big ? r * 1.1 : r * 0.9;
      if (it.box) {
        ctx.save(); ctx.fillStyle = 'rgba(123,44,191,.07)'; ctx.strokeStyle = 'rgba(123,44,191,.35)'; ctx.lineWidth = 2;
        roundRect(ctx, cx - rr * 1.12, y - rr * 1.12, rr * 2.24, rr * 2.24, rr * 0.3); ctx.fill(); ctx.stroke(); ctx.restore();
      }
      if (it.ghost) ghost(ctx, it.ghost.g, cx, y, rr * 0.9, it.ghost.a || 0, !!it.ghost.m);
      if (it.q) text(ctx, '?', cx, y, rr * 1.3, '#c9b8ea');
      if (it.g && !it.hide) drawGlyph(ctx, it.g, cx, y, rr * (it.ghost ? 0.82 : 1), it.a || 0, !!it.m, it.alpha ?? 1);
    }
    x += cw;
  });
  return centers;
}

/** Mer ronde : dauphin au centre, poisson-cible sur le bord. */
export function sea(ctx, w, h, { dir, target, step = 90, glyph = 'dolphin' }) {
  const R = Math.min(w, h) * 0.44, cx = w / 2, cy = h / 2;
  const g = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R);
  g.addColorStop(0, '#eaf7ff'); g.addColorStop(1, '#9fd3ff');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 2;
  for (let a = 0; a < 360; a += step) {
    const t = (a * Math.PI) / 180;
    ctx.beginPath(); ctx.arc(cx + Math.cos(t) * R * 0.8, cy - Math.sin(t) * R * 0.8, R * 0.04, 0, 7); ctx.stroke();
  }
  if (target != null) {
    const t = (target * Math.PI) / 180;
    drawGlyph(ctx, 'fish', cx + Math.cos(t) * R * 0.8, cy - Math.sin(t) * R * 0.8, R * 0.17, target + 180);
  }
  drawGlyph(ctx, glyph, cx, cy, R * 0.45, dir);
}

/** Suite de petits tours : +1 = ↺, -1 = ↻ ; vide = • (rien). */
export function turns(ctx, seq, cx, cy, size, color = '#7b2cbf') {
  const s = seq.length ? seq.map((k) => (k > 0 ? '↺' : '↻')).join(' ') : '•';
  text(ctx, s, cx, cy, size, color);
}

/** Droite des nombres avec la coccinelle (valeur) et le drapeau (cible). */
export function numberLine(ctx, x0, x1, y, { value, target, min = -5, max = 5, size = 16 }) {
  const X = (v) => x0 + ((v - min) / (max - min)) * (x1 - x0);
  ctx.save();
  ctx.lineCap = 'round'; ctx.strokeStyle = '#7b6fa8'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
  for (let v = min; v <= max; v++) {
    ctx.lineWidth = v === 0 ? 4 : 2;
    ctx.beginPath(); ctx.moveTo(X(v), y - 7); ctx.lineTo(X(v), y + 7); ctx.stroke();
    text(ctx, (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v), X(v), y + size * 1.15, size, v === 0 ? '#3d2c6b' : v > 0 ? '#c9184a' : '#1d4e89');
  }
  if (target != null) text(ctx, '🚩', X(target) + size * 0.3, y - size * 1.1, size * 1.5);
  if (value != null) drawGlyph(ctx, 'ladybug', X(Math.max(min, Math.min(max, value))), y - size * 0.7, size * 0.8, 90);
  ctx.restore();
}

/** Tuile-nombre : 1 lapin debout, -1 lapin tête en bas, 0 nuage. */
export function numberTile(ctx, x, y, s, v) {
  ctx.save();
  ctx.fillStyle = v === 0 ? '#e3f1ff' : '#ffe3ec';
  ctx.strokeStyle = 'rgba(61,44,107,.3)'; ctx.lineWidth = 2;
  roundRect(ctx, x - s / 2, y - s / 2, s, s, s * 0.18); ctx.fill(); ctx.stroke();
  ctx.restore();
  drawGlyph(ctx, v === 0 ? 'cloud' : 'bunny', x, y, s * 0.36, v < 0 ? 180 : 0);
}

// ---------------- jardin (matrices) ----------------
function gardenPicture(ctx) {
  ctx.fillStyle = '#bde0fe'; ctx.fillRect(0, 0, 1, 1);
  ctx.fillStyle = '#80c66a'; ctx.fillRect(0, 0, 1, 0.3);
  ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(0.17, 0.83, 0.1, 0, 7); ctx.fill();
  ctx.fillStyle = '#8d5a2b'; ctx.fillRect(0.2, 0.25, 0.06, 0.25);
  ctx.fillStyle = '#2d6a4f'; ctx.beginPath(); ctx.arc(0.23, 0.55, 0.13, 0, 7); ctx.fill();
  ctx.fillStyle = '#ffe8d6'; ctx.fillRect(0.5, 0.25, 0.36, 0.3);
  ctx.fillStyle = '#e63946';
  ctx.beginPath(); ctx.moveTo(0.46, 0.55); ctx.lineTo(0.68, 0.78); ctx.lineTo(0.9, 0.55); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#6d4c41'; ctx.fillRect(0.74, 0.25, 0.08, 0.16);
  ctx.fillStyle = '#4ea8de'; ctx.fillRect(0.55, 0.36, 0.1, 0.09);
}
export const det2 = (M) => M[0][0] * M[1][1] - M[0][1] * M[1][0];
export const I2 = [[1, 0], [0, 1]];
export const lerpM = (A, B, t) => A.map((r, i) => r.map((x, j) => x + (B[i][j] - x) * t));

/** Jardin transformé par M, centré en (cx, cy), s pixels par unité ; T = fantôme. */
export function garden(ctx, cx, cy, s, M, T = null, grid = true, ext = 2) {
  ctx.save();
  if (grid) {
    ctx.strokeStyle = 'rgba(123,111,168,.16)'; ctx.lineWidth = 1;
    const L = ext + 0.2;
    for (let i = -ext; i <= ext; i++) {
      ctx.beginPath(); ctx.moveTo(cx + i * s, cy - L * s); ctx.lineTo(cx + i * s, cy + L * s); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - L * s, cy + i * s); ctx.lineTo(cx + L * s, cy + i * s); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(123,111,168,.45)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cx, cy - L * s); ctx.lineTo(cx, cy + L * s); ctx.moveTo(cx - L * s, cy); ctx.lineTo(cx + L * s, cy); ctx.stroke();
  }
  const paint = (A, alpha, dashed) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(cx, cy); ctx.scale(s, -s);
    ctx.transform(A[0][0], A[1][0], A[0][1], A[1][1], 0, 0);
    if (Math.abs(det2(A)) > 1e-6) gardenPicture(ctx);
    ctx.restore();
    const P = (x, y) => [cx + (A[0][0] * x + A[0][1] * y) * s, cy - (A[1][0] * x + A[1][1] * y) * s];
    ctx.save();
    ctx.globalAlpha = Math.max(alpha, 0.55);
    ctx.strokeStyle = dashed ? '#7b2cbf' : '#3d2c6b'; ctx.lineWidth = dashed ? 2 : 3;
    if (dashed) ctx.setLineDash([7, 6]);
    ctx.beginPath();
    [[0, 0], [1, 0], [1, 1], [0, 1]].forEach(([x, y], i) => { const [X, Y] = P(x, y); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
    ctx.closePath(); ctx.stroke();
    ctx.restore();
  };
  if (T) paint(T, 0.25, true);
  paint(M, 1, false);
  ctx.restore();
}

/** Jardin à la plus grande taille possible dans un carré de côté `size`. */
export function gardenFit(ctx, cx, cy, size, M, T = null, grid = true) {
  const ext = (A) => Math.max(1, ...[[1, 0], [0, 1], [1, 1]].flatMap(([x, y]) => [Math.abs(A[0][0] * x + A[0][1] * y), Math.abs(A[1][0] * x + A[1][1] * y)]));
  const e = Math.max(ext(M), T ? ext(T) : 1);
  garden(ctx, cx, cy, size / (2 * e + 0.5), M, T, grid, Math.ceil(e));
}

/** Grille 2×2 de tuiles-nombres ; renvoie les centres des 4 cases. */
export function matrixGrid(ctx, cx, cy, s, M) {
  const pos = [[cx - s * 0.55, cy - s * 0.55], [cx + s * 0.55, cy - s * 0.55], [cx - s * 0.55, cy + s * 0.55], [cx + s * 0.55, cy + s * 0.55]];
  const v = [M[0][0], M[0][1], M[1][0], M[1][1]];
  ctx.save();
  ctx.strokeStyle = '#3d2c6b'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  for (const sgn of [-1, 1]) {
    const x = cx + sgn * s * 1.18;
    ctx.beginPath(); ctx.moveTo(x - sgn * s * 0.15, cy - s * 1.15); ctx.lineTo(x, cy - s * 1.15); ctx.lineTo(x, cy + s * 1.15); ctx.lineTo(x - sgn * s * 0.15, cy + s * 1.15); ctx.stroke();
  }
  ctx.restore();
  pos.forEach(([x, y], i) => numberTile(ctx, x, y, s * 0.95, v[i]));
  return pos;
}
