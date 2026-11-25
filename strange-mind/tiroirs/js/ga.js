// Les tiroirs magiques : l'algèbre géométrique de l'espace (Cl(3)), et ses dessins pour enfants.
//
// Une « lame » est { m, s } : m = masque des directions (1 = x, 2 = y, 4 = z), s = ±1.
//   m = 0 : un nombre (lapin debout +1, tête en bas −1)          tiroir 0
//   m = 1, 2, 4 : une flèche le long de x, y ou z                tiroir 1
//   m = 3, 6, 5 : un tapis dans le plan xy, yz ou xz            tiroir 2 (sens : de la plus petite direction vers l'autre)
//   m = 7 : le cube i = xyz                                      tiroir 3
// Un « panier » (multivecteur) est un objet { masque: coefficient entier }.
import { drawGlyph, roundRect } from './glyphs.js';
import { text, arrowPx, numberTile, INK, SOFT } from './wind.js';

export const grade = (m) => (m & 1) + ((m >> 1) & 1) + ((m >> 2) & 1);
function reorder(a, b) { a >>= 1; let s = 0; while (a) { s += grade(a & b); a >>= 1; } return s & 1 ? -1 : 1; }
/** Produit géométrique de deux lames. */
export const mul = (A, B) => ({ m: A.m ^ B.m, s: A.s * B.s * reorder(A.m, B.m) });
export const I = { m: 7, s: 1 };
export const AXES = [1, 2, 4], PLANES = [3, 6, 5];
export const bkey = (b) => b.m + ':' + b.s;
export const blade = (m, s = 1) => ({ m, s });

// ---------------- paniers ----------------
export const mvAdd = (...ps) => {
  const out = {};
  for (const p of ps) for (const [m, c] of Object.entries(p)) out[m] = (out[m] || 0) + c;
  for (const m of Object.keys(out)) if (!out[m]) delete out[m];
  return out;
};
export const mvNeg = (p) => Object.fromEntries(Object.entries(p).map(([m, c]) => [m, -c]));
export const mvKey = (p) => Object.keys(p).map(Number).sort((a, b) => a - b).map((m) => m + ':' + p[m]).join(',') || 'vide';
export const mvEq = (a, b) => mvKey(a) === mvKey(b);
/** Un panier « en vrac » : une lame par objet (des objets opposés peuvent cohabiter). */
export const units = (p) => Object.entries(p).flatMap(([m, c]) => Array.from({ length: Math.abs(c) }, () => ({ m: +m, s: Math.sign(c) })));
export const fromUnits = (us) => mvAdd(...us.map((u) => ({ [u.m]: u.s })));

// ---------------- dessin en 3D (perspective cavalière) ----------------
// x vers la droite, z vers le haut, y « dans l'écran » (en diagonale vers le haut à droite) : repère direct.
export const AXIS_COL = { 1: '#e63946', 2: '#2bb673', 4: '#3a86ff' };
const PLANE_COL = { 3: 'rgba(255,209,102,.75)', 6: 'rgba(155,231,255,.8)', 5: 'rgba(255,198,217,.85)' };
const VEC = { 1: [1, 0, 0], 2: [0, 1, 0], 4: [0, 0, 1] };
const proj = (cx, cy, s) => ([x, y, z]) => [cx + s * (x + 0.45 * y), cy - s * (z + 0.32 * y)];
const add3 = (a, b, k = 1) => [a[0] + k * b[0], a[1] + k * b[1], a[2] + k * b[2]];
const lowBits = (m) => AXES.filter((a) => m & a);

/** Axes en pointillés (repère). */
export function axes(ctx, cx, cy, s, alpha = 0.35) {
  const P = proj(cx, cy, s);
  ctx.save(); ctx.globalAlpha = alpha; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.5;
  for (const a of AXES) {
    const [x0, y0] = P(VEC[a].map((v) => -v * 0.95)), [x1, y1] = P(VEC[a].map((v) => v * 0.95));
    ctx.strokeStyle = AXIS_COL[a]; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  }
  ctx.restore();
}

/** Petite flèche courbe dessinée DANS le plan (u, v), autour du point c (3D). sign +1 = de u vers v. */
function planeSpin(ctx, P, c, u, v, r, sign, col = '#7b2cbf', lw = 3) {
  const pts = [];
  for (let k = 0; k <= 24; k++) {
    const th = sign * (0.5 + (k / 24) * 4.6);
    pts.push(P(add3(add3(c, u, r * Math.cos(th)), v, r * Math.sin(th))));
  }
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'round';
  ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
  ctx.restore();
  const [a, b] = [pts[pts.length - 3], pts[pts.length - 1]];
  arrowPx(ctx, a[0], a[1], b[0] - a[0], b[1] - a[1], col, lw, lw * 3.2);
}

/**
 * Dessine une lame centrée en (cx, cy) dans un carré de côté ~2·size.
 * opts.axes : repère en pointillés ; opts.alpha.
 */
export function drawBlade(ctx, cx, cy, size, b, { showAxes = true, alpha = 1 } = {}) {
  ctx.save(); ctx.globalAlpha *= alpha;
  const g = grade(b.m), s = size * 0.95, P = proj(cx, cy + size * 0.08, s), L = 0.7;
  if (g === 0) { numberTile(ctx, cx, cy, size * 1.25, b.s); ctx.restore(); return; }
  if (showAxes) axes(ctx, cx, cy + size * 0.08, s);
  const lw = Math.max(2.5, size * 0.09);
  if (g === 1) {
    const d = VEC[b.m].map((v) => v * b.s * L);
    const [x0, y0] = P(d.map((v) => -v * 0.5)), [x1, y1] = P(d.map((v) => v * 0.5));
    arrowPx(ctx, x0, y0, x1 - x0, y1 - y0, AXIS_COL[b.m], lw, lw * 3);
  } else if (g === 2) {
    const [ua, va] = lowBits(b.m), u = VEC[ua].map((x) => x * L), v = VEC[va].map((x) => x * L);
    const c0 = add3(add3([0, 0, 0], u, -0.5), v, -0.5);
    const cs = [c0, add3(c0, u), add3(add3(c0, u), v), add3(c0, v)].map(P);
    ctx.fillStyle = PLANE_COL[b.m]; ctx.strokeStyle = 'rgba(61,44,107,.55)'; ctx.lineWidth = 2;
    ctx.beginPath(); cs.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fill(); ctx.stroke();
    // les deux bords colorés disent « de quelle flèche vers quelle flèche »
    planeSpin(ctx, P, [0, 0, 0], VEC[ua], VEC[va], L * 0.27, b.s, '#7b2cbf', lw * 0.8);
  } else {
    const h = L * 0.5, C = (x, y, z) => P([x * h, y * h, z * h]);
    const faces = [
      [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]], // devant
      [[1, -1, -1], [1, 1, -1], [1, 1, 1], [1, -1, 1]], // droite
      [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]], // dessus
    ];
    const cols = b.s > 0 ? ['#ffcad4', '#ffb3c1', '#ffe5ec'] : ['#c8d7ff', '#b3c7ff', '#e3ebff'];
    faces.forEach((f, i) => {
      ctx.fillStyle = cols[i]; ctx.strokeStyle = 'rgba(61,44,107,.6)'; ctx.lineWidth = 2;
      ctx.beginPath(); f.map((p) => C(...p)).forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fill(); ctx.stroke();
    });
    // le sens du cube : son couvercle tourne ↺ (vu d'en haut) s'il est « à l'endroit »
    planeSpin(ctx, P, [0, 0, h], [h, 0, 0], [0, h, 0], 0.55, b.s, b.s > 0 ? '#c9184a' : '#1d4e89', lw * 0.75);
  }
  ctx.restore();
}

/** Icône d'un tiroir (0 lapin, 1 flèche, 2 tapis, 3 cube). */
export function drawerIcon(ctx, cx, cy, size, g) {
  const b = [{ m: 0, s: 1 }, { m: 1, s: 1 }, { m: 3, s: 1 }, { m: 7, s: 1 }][g];
  drawBlade(ctx, cx, cy, size, b, { showAxes: false });
}
/** Carte « tiroir » : une commode avec l'icône de ce qu'on y range. */
export function drawerCard(ctx, w, h, g) {
  const W = w * 0.8, H = h * 0.62, x = (w - W) / 2, y = (h - H) / 2;
  ctx.save();
  ctx.fillStyle = '#c08552'; ctx.strokeStyle = '#6f4518'; ctx.lineWidth = 3;
  roundRect(ctx, x, y, W, H, 10); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff4e6'; roundRect(ctx, x + W * 0.08, y + H * 0.12, W * 0.84, H * 0.76, 8); ctx.fill();
  ctx.fillStyle = '#6f4518'; ctx.beginPath(); ctx.arc(w / 2, y + H * 0.94, 4, 0, 7); ctx.fill();
  ctx.restore();
  drawerIcon(ctx, w / 2, h / 2, Math.min(W, H) * 0.3, g);
}

/** Panier en vrac : les objets posés dans l'ordre donné (non rangés). */
export function pile(ctx, x, y, w, h, items, { basket = true } = {}) {
  if (basket) {
    ctx.save();
    ctx.fillStyle = 'rgba(192,133,82,.18)'; ctx.strokeStyle = 'rgba(111,69,24,.55)'; ctx.lineWidth = 2;
    roundRect(ctx, x, y, w, h, Math.min(w, h) * 0.12); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  if (!items.length) { text(ctx, '∅', x + w / 2, y + h / 2, Math.min(w, h) * 0.3, SOFT); return; }
  const n = items.length, cols = Math.ceil(Math.sqrt(n * (w / h))), rows = Math.ceil(n / cols);
  const cw = w / cols, ch = h / rows, r = Math.min(cw, ch) * 0.36;
  items.forEach((b, i) => drawBlade(ctx, x + cw * ((i % cols) + 0.5), y + ch * (Math.floor(i / cols) + 0.5), r, b, { showAxes: false }));
}

/** Panier rangé : 4 tiroirs (2×2), chaque objet regroupé avec ses semblables (×2…). marks[g] = 'ok' | 'ko'. */
export function drawers(ctx, x, y, w, h, p, marks = null) {
  const cw = w / 2, ch = h / 2;
  for (let g = 0; g < 4; g++) {
    const X = x + (g % 2) * cw, Y = y + Math.floor(g / 2) * ch;
    ctx.save();
    ctx.fillStyle = marks?.[g] === 'ko' ? '#ffe3ea' : marks?.[g] === 'ok' ? '#e3fff6' : '#fff8ef';
    ctx.strokeStyle = marks?.[g] === 'ko' ? '#ef476f' : 'rgba(111,69,24,.5)'; ctx.lineWidth = marks?.[g] === 'ko' ? 3 : 1.5;
    roundRect(ctx, X + 2, Y + 2, cw - 4, ch - 4, 6); ctx.fill(); ctx.stroke();
    ctx.restore();
    const here = Object.entries(p).filter(([m]) => grade(+m) === g);
    if (!here.length) { ctx.save(); ctx.globalAlpha = 0.18; drawerIcon(ctx, X + cw / 2, Y + ch / 2, Math.min(cw, ch) * 0.25, g); ctx.restore(); continue; }
    const k = here.length, r = Math.min(cw / k, ch) * 0.28;
    here.forEach(([m, c], i) => {
      const cx = X + (cw / k) * (i + 0.5) - (Math.abs(c) > 1 ? r * 0.35 : 0), cy = Y + ch / 2;
      drawBlade(ctx, cx, cy, r, { m: +m, s: Math.sign(c) }, { showAxes: false });
      if (Math.abs(c) > 1) text(ctx, '×' + Math.abs(c), cx + r * 1.25, cy + r * 0.55, r * 0.75, INK);
    });
  }
}
export { drawGlyph };
