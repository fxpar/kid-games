// Outils de dessin pour les panneaux (cartes sous la scène) : objectifs, machines, jardins…
// Toutes les fonctions reçoivent un contexte 2D déjà mis à l'échelle en pixels CSS.

import { drawGlyph, roundRect } from './glyphs.js';

export const OK_COLOR = '#2a9d8f';

export function check(ctx, x, y, r) {
  ctx.save();
  ctx.fillStyle = OK_COLOR;
  ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = r * 0.28; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(x - r * 0.45, y); ctx.lineTo(x - r * 0.1, y + r * 0.35); ctx.lineTo(x + r * 0.5, y - r * 0.35); ctx.stroke();
  ctx.restore();
}

/** Dessin "fantôme" : ce qu'il faut obtenir. */
export function ghost(ctx, g, x, y, r, a = 0, m = false) {
  ctx.save();
  ctx.setLineDash([6, 6]);
  ctx.strokeStyle = 'rgba(123,44,191,.45)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(x, y, r * 1.08, 0, 7); ctx.stroke();
  ctx.restore();
  drawGlyph(ctx, g, x, y, r, a, m, 0.3);
}

export function text(ctx, s, x, y, size, color = '#3d2c6b', align = 'center') {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `700 ${Math.round(size)}px "Baloo 2","Comic Sans MS","Trebuchet MS",sans-serif`;
  ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
  ctx.restore();
}

/** Cible à trouver (emoji ou dessin). */
export function find(ctx, w, h, targets, found) {
  const list = Array.isArray(targets) ? targets : [targets];
  const r = Math.min(h * 0.32, (w / list.length) * 0.3);
  text(ctx, '🔎', w * 0.1, h * 0.2, h * 0.18);
  list.forEach((g, i) => {
    const x = (w * (i + 0.5)) / list.length, y = h * 0.52;
    drawGlyph(ctx, g, x, y, r);
    if (found[i]) check(ctx, x + r * 0.9, y + r * 0.8, r * 0.32);
  });
}

/** Mer circulaire : le dauphin au centre, le poisson-cible sur le bord. */
export function compass(ctx, w, h, { dir, target, glyph = 'dolphin' }) {
  const R = Math.min(w, h) * 0.44, cx = w / 2, cy = h / 2;
  const g = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R);
  g.addColorStop(0, '#e9f6ff'); g.addColorStop(1, '#9fd3ff');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 2;
  for (let a = 0; a < 360; a += 90) {
    const t = (a * Math.PI) / 180;
    ctx.beginPath(); ctx.arc(cx + Math.cos(t) * R * 0.78, cy - Math.sin(t) * R * 0.78, R * 0.05, 0, 7); ctx.stroke();
  }
  if (target != null) {
    const t = (target * Math.PI) / 180;
    drawGlyph(ctx, 'fish', cx + Math.cos(t) * R * 0.78, cy - Math.sin(t) * R * 0.78, R * 0.2, target + 180);
  }
  drawGlyph(ctx, glyph, cx, cy, R * 0.45, dir);
  if (dir === target) check(ctx, cx + R * 0.75, cy + R * 0.75, R * 0.16);
}

/**
 * Ligne d'éléments : glyphes et opérateurs.
 * item = 'texte' | { g, a, m, ghost, big, ok, label }
 */
export function row(ctx, w, h, items, y = h / 2, maxR = Infinity) {
  const units = items.map((it) => (typeof it === 'string' ? 0.7 : it.big ? 2.4 : 2));
  const total = units.reduce((s, u) => s + u, 0);
  const u = Math.min(w / total, (h * 0.9) / 2.4);
  const r = Math.min(u * 0.92, maxR);
  let x = (w - total * u) / 2;
  items.forEach((it, i) => {
    const cw = units[i] * u, cx = x + cw / 2;
    if (typeof it === 'string') text(ctx, it, cx, y, r * 0.9, '#7b6fa8');
    else {
      const rr = it.big ? r * 1.15 : r * 0.92;
      if (it.box) {
        ctx.save(); ctx.fillStyle = 'rgba(123,44,191,.08)'; ctx.strokeStyle = 'rgba(123,44,191,.35)'; ctx.lineWidth = 2;
        roundRect(ctx, cx - rr * 1.12, y - rr * 1.12, rr * 2.24, rr * 2.24, rr * 0.3); ctx.fill(); ctx.stroke(); ctx.restore();
      }
      if (it.target) ghost(ctx, it.target.g, cx, y, rr, it.target.a || 0, !!it.target.m);
      if (it.g) drawGlyph(ctx, it.g, cx, y, rr * (it.target ? 0.8 : 1), it.a || 0, !!it.m, it.alpha ?? 1);
      if (it.ok) check(ctx, cx + rr * 0.85, y + rr * 0.85, rr * 0.28);
      if (it.label) text(ctx, it.label, cx, y + rr * 1.25, rr * 0.38, '#7b6fa8');
    }
    x += cw;
  });
}

/** Droite des nombres avec la coccinelle (somme) et le drapeau (cible). */
export function numberLine(ctx, w, h, { value, target, min = -4, max = 4, y = h * 0.72 }) {
  const x0 = w * 0.06, x1 = w * 0.94;
  const X = (v) => x0 + ((v - min) / (max - min)) * (x1 - x0);
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#7b6fa8'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
  const fs = Math.min(h * 0.13, (x1 - x0) / (max - min) * 0.42);
  for (let v = min; v <= max; v++) {
    ctx.lineWidth = v === 0 ? 4 : 2;
    ctx.beginPath(); ctx.moveTo(X(v), y - 8); ctx.lineTo(X(v), y + 8); ctx.stroke();
    text(ctx, (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v), X(v), y + fs * 1.1, fs, v === 0 ? '#3d2c6b' : v > 0 ? '#c9184a' : '#1d4e89');
  }
  if (target != null) text(ctx, '🚩', X(target) + fs * 0.3, y - fs * 1.0, fs * 1.4);
  if (value != null && value >= min && value <= max) drawGlyph(ctx, 'ladybug', X(value), y - fs * 0.6, fs * 0.75, 90);
  ctx.restore();
}

/** Dessin du jardin dans le carré unité [0,1]² (y vers le haut). */
function gardenPicture(ctx) {
  ctx.fillStyle = '#bde0fe'; ctx.fillRect(0, 0, 1, 1);
  ctx.fillStyle = '#80c66a'; ctx.fillRect(0, 0, 1, 0.3);
  ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(0.17, 0.83, 0.1, 0, 7); ctx.fill();
  // arbre (à gauche)
  ctx.fillStyle = '#8d5a2b'; ctx.fillRect(0.2, 0.25, 0.06, 0.25);
  ctx.fillStyle = '#2d6a4f'; ctx.beginPath(); ctx.arc(0.23, 0.55, 0.13, 0, 7); ctx.fill();
  // maison (à droite) avec la porte à droite
  ctx.fillStyle = '#ffe8d6'; ctx.fillRect(0.5, 0.25, 0.36, 0.3);
  ctx.fillStyle = '#e63946';
  ctx.beginPath(); ctx.moveTo(0.46, 0.55); ctx.lineTo(0.68, 0.78); ctx.lineTo(0.9, 0.55); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#6d4c41'; ctx.fillRect(0.74, 0.25, 0.08, 0.16);
  ctx.fillStyle = '#4ea8de'; ctx.fillRect(0.55, 0.36, 0.1, 0.09);
  // fleur
  ctx.fillStyle = '#ff70a6';
  for (let k = 0; k < 5; k++) { const t = (k * 2 * Math.PI) / 5; ctx.beginPath(); ctx.arc(0.4 + Math.cos(t) * 0.03, 0.15 + Math.sin(t) * 0.03, 0.022, 0, 7); ctx.fill(); }
  ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(0.4, 0.15, 0.018, 0, 7); ctx.fill();
}

export const det2 = (M) => M[0][0] * M[1][1] - M[0][1] * M[1][0];

/** Le jardin déformé par la matrice M = [[a,b],[c,d]] ; T = matrice cible (fantôme). */
export function garden(ctx, w, h, { M, T }) {
  const s = Math.min(w, h) / 4.8, cx = w / 2, cy = h / 2;
  ctx.save();
  // quadrillage
  ctx.strokeStyle = 'rgba(123,111,168,.18)'; ctx.lineWidth = 1;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath(); ctx.moveTo(cx + i * s, cy - 2.3 * s); ctx.lineTo(cx + i * s, cy + 2.3 * s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - 2.3 * s, cy + i * s); ctx.lineTo(cx + 2.3 * s, cy + i * s); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(123,111,168,.5)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(cx, cy - 2.3 * s); ctx.lineTo(cx, cy + 2.3 * s); ctx.moveTo(cx - 2.3 * s, cy); ctx.lineTo(cx + 2.3 * s, cy); ctx.stroke();

  const paint = (A, alpha, dashed) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(cx, cy); ctx.scale(s, -s);
    ctx.transform(A[0][0], A[1][0], A[0][1], A[1][1], 0, 0);
    if (Math.abs(det2(A)) > 1e-9) gardenPicture(ctx);
    ctx.restore();
    // contour
    const P = (x, y) => [cx + (A[0][0] * x + A[0][1] * y) * s, cy - (A[1][0] * x + A[1][1] * y) * s];
    ctx.save();
    ctx.globalAlpha = Math.max(alpha, 0.5);
    ctx.strokeStyle = dashed ? '#7b2cbf' : '#3d2c6b'; ctx.lineWidth = dashed ? 2 : 3;
    if (dashed) ctx.setLineDash([7, 6]);
    ctx.beginPath();
    [[0, 0], [1, 0], [1, 1], [0, 1]].forEach(([x, y], i) => { const [X, Y] = P(x, y); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
    ctx.closePath(); ctx.stroke();
    ctx.restore();
    return P;
  };
  if (T) paint(T, 0.22, true);
  const P = paint(M, 1, false);
  // flèches des deux directions : poisson rouge (→) et oiseau bleu (↑) transformés
  const arrow = (x, y, col) => {
    const [X, Y] = P(x, y);
    if (Math.hypot(X - cx, Y - cy) < 2) return;
    ctx.save(); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(X, Y); ctx.stroke();
    const t = Math.atan2(Y - cy, X - cx);
    ctx.beginPath(); ctx.moveTo(X + Math.cos(t) * 8, Y + Math.sin(t) * 8);
    ctx.lineTo(X + Math.cos(t + 2.4) * 12, Y + Math.sin(t + 2.4) * 12);
    ctx.lineTo(X + Math.cos(t - 2.4) * 12, Y + Math.sin(t - 2.4) * 12); ctx.closePath(); ctx.fill();
    ctx.restore();
  };
  arrow(1, 0, '#ef476f');
  arrow(0, 1, '#118ab2');
  if (Math.abs(det2(M)) < 1e-9) text(ctx, '💨', cx + s * 1.6, cy - s * 1.7, s * 0.7);
  ctx.restore();
}

/** Pastille "taille du jardin" : |det| carreaux, miroir si det < 0. */
export function detBadge(ctx, x, y, size, d) {
  ctx.save();
  ctx.fillStyle = d === 0 ? '#adb5bd' : d > 0 ? '#2a9d8f' : '#e76f51';
  roundRect(ctx, x - size, y - size * 0.55, size * 2, size * 1.1, size * 0.3); ctx.fill();
  ctx.restore();
  const label = d === 0 ? '0' : (d < 0 ? '🪞 ' : '') + '×' + Math.abs(d);
  text(ctx, label, x, y + 1, size * 0.62, '#fff');
}
