// Dessins posés sur les faces (et réutilisés dans les panneaux).
// Convention : chaque dessin est centré en (0,0), de rayon r, en coordonnées canvas (y vers le bas).
//  - les dessins "orientés" (dauphin, poisson, flèche) regardent vers la DROITE  -> angle 0
//  - les dessins "debout" (lapin) ont la tête en HAUT                             -> valeur +1
// Valeur mathématique d'une face : v · e^{iθ}, θ = rotation de la face (sens anti-horaire).
// Tout texte qui n'est pas un nom de dessin est affiché comme un emoji (décor).

const EMOJI_FONT = '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';

function path(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
}

const DRAW = {
  dolphin(ctx) {
    const dark = '#1f5fa8', mid = '#3b8fe0', belly = '#d8ecff';
    ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.lineWidth = 0.045; ctx.strokeStyle = '#123d6b';
    // queue
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.moveTo(-0.6, 0.02);
    ctx.quadraticCurveTo(-0.78, -0.06, -0.98, -0.34);
    ctx.quadraticCurveTo(-0.86, 0.04, -0.98, 0.4);
    ctx.quadraticCurveTo(-0.78, 0.12, -0.6, 0.08);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // aileron dorsal
    ctx.beginPath();
    ctx.moveTo(-0.18, -0.24);
    ctx.quadraticCurveTo(-0.12, -0.5, -0.36, -0.6);
    ctx.quadraticCurveTo(0.06, -0.52, 0.16, -0.27);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // corps
    ctx.fillStyle = mid;
    ctx.beginPath();
    ctx.moveTo(-0.72, 0.05);
    ctx.bezierCurveTo(-0.42, -0.38, 0.32, -0.42, 0.6, -0.08);
    ctx.quadraticCurveTo(0.82, -0.04, 0.96, 0.02);
    ctx.quadraticCurveTo(0.98, 0.1, 0.88, 0.11);
    ctx.lineTo(0.6, 0.13);
    ctx.bezierCurveTo(0.3, 0.38, -0.3, 0.32, -0.72, 0.08);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // ventre
    ctx.fillStyle = belly;
    ctx.beginPath();
    ctx.moveTo(0.62, 0.12);
    ctx.bezierCurveTo(0.3, 0.33, -0.3, 0.28, -0.64, 0.08);
    ctx.bezierCurveTo(-0.2, 0.15, 0.3, 0.16, 0.62, 0.12);
    ctx.closePath(); ctx.fill();
    // nageoire
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.moveTo(0.08, 0.2);
    ctx.quadraticCurveTo(-0.02, 0.44, -0.2, 0.48);
    ctx.quadraticCurveTo(-0.08, 0.32, -0.1, 0.21);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // oeil + sourire
    ctx.fillStyle = '#0d1b2a';
    ctx.beginPath(); ctx.arc(0.46, -0.08, 0.06, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(0.475, -0.095, 0.022, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0.62, 0.05); ctx.quadraticCurveTo(0.72, 0.1, 0.84, 0.07); ctx.stroke();
  },

  fish(ctx) {
    ctx.lineJoin = 'round'; ctx.lineWidth = 0.05; ctx.strokeStyle = '#8a3b00';
    ctx.fillStyle = '#ff9a2e';
    path(ctx, [[-0.35, 0], [-0.85, -0.38], [-0.75, 0], [-0.85, 0.38]]);
    ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0.1, 0, 0.55, 0.36, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#ffd08a'; ctx.lineWidth = 0.07;
    for (const x of [-0.1, 0.08]) { ctx.beginPath(); ctx.moveTo(x, -0.28); ctx.quadraticCurveTo(x + 0.08, 0, x, 0.28); ctx.stroke(); }
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(0.38, -0.08, 0.065, 0, 7); ctx.fill();
  },

  bunny(ctx) {
    ctx.scale(1.12, 1.12);
    ctx.translate(0, 0.12);
    ctx.lineJoin = 'round'; ctx.lineWidth = 0.045; ctx.strokeStyle = '#5b4a5e';
    for (const s of [-1, 1]) {
      ctx.fillStyle = '#f7f3f8';
      ctx.beginPath(); ctx.ellipse(0.2 * s, -0.5, 0.14, 0.4, 0.12 * s, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffb3c8';
      ctx.beginPath(); ctx.ellipse(0.2 * s, -0.48, 0.065, 0.28, 0.12 * s, 0, 7); ctx.fill();
    }
    ctx.fillStyle = '#f7f3f8';
    ctx.beginPath(); ctx.arc(0, 0.2, 0.46, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffc4d6';
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(0.26 * s, 0.32, 0.08, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#1b1b1b';
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(0.16 * s, 0.1, 0.06, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#ff6f91';
    path(ctx, [[-0.06, 0.22], [0.06, 0.22], [0, 0.29]]); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, 0.29); ctx.quadraticCurveTo(-0.08, 0.38, -0.14, 0.33);
    ctx.moveTo(0, 0.29); ctx.quadraticCurveTo(0.08, 0.38, 0.14, 0.33); ctx.stroke();
  },

  cloud(ctx) {
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#9db7d6'; ctx.lineWidth = 0.05;
    ctx.setLineDash([0.1, 0.07]);
    ctx.beginPath();
    ctx.arc(-0.38, 0.12, 0.28, Math.PI * 0.5, Math.PI * 1.5);
    ctx.arc(-0.08, -0.1, 0.36, Math.PI * 1.05, Math.PI * 1.85);
    ctx.arc(0.36, 0.08, 0.3, Math.PI * 1.35, Math.PI * 0.5);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.setLineDash([]);
  },

  arrow(ctx) { arrowShape(ctx, '#ef476f', '#6b0f1a'); },
  arrowGreen(ctx) { arrowShape(ctx, '#2bb673', '#0f4d2e'); },
  arrowBlue(ctx) { arrowShape(ctx, '#118ab2', '#073b4c'); },

  mirror(ctx) {
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#8d5a2b'; ctx.strokeStyle = '#4a2c10'; ctx.lineWidth = 0.04;
    roundRect(ctx, -0.95, -0.17, 1.9, 0.34, 0.1); ctx.fill(); ctx.stroke();
    const g = ctx.createLinearGradient(-0.85, -0.1, 0.85, 0.1);
    g.addColorStop(0, '#dfe9f5'); g.addColorStop(0.5, '#ffffff'); g.addColorStop(1, '#b8c8dc');
    ctx.fillStyle = g;
    roundRect(ctx, -0.86, -0.09, 1.72, 0.18, 0.05); ctx.fill();
    ctx.strokeStyle = 'rgba(120,150,190,.8)'; ctx.lineWidth = 0.03;
    for (const x of [-0.5, -0.38, 0.3, 0.42]) { ctx.beginPath(); ctx.moveTo(x, 0.07); ctx.lineTo(x + 0.08, -0.07); ctx.stroke(); }
    // petits pieds indiquant le "côté" du miroir (sans importance pour la réflexion)
    ctx.setLineDash([0.06, 0.06]); ctx.strokeStyle = 'rgba(80,80,140,.35)'; ctx.lineWidth = 0.025;
    ctx.beginPath(); ctx.moveTo(-1.0, 0); ctx.lineTo(1.0, 0); ctx.stroke(); ctx.setLineDash([]);
  },

  whirl(ctx) {
    // tourbillon tournant dans le sens anti-horaire (vu à l'écran)
    ctx.lineCap = 'round'; ctx.strokeStyle = '#7b2cbf'; ctx.lineWidth = 0.16;
    const a0 = -0.35, a1 = -Math.PI * 1.75; // anti-horaire à l'écran = angles décroissants en canvas
    ctx.beginPath(); ctx.arc(0, 0, 0.58, a0, a1, true); ctx.stroke();
    const ex = 0.58 * Math.cos(a1), ey = 0.58 * Math.sin(a1);
    const tx = Math.sin(a1), ty = -Math.cos(a1); // tangente dans le sens du mouvement
    ctx.fillStyle = '#7b2cbf';
    path(ctx, [
      [ex + tx * 0.3, ey + ty * 0.3],
      [ex - ty * 0.22, ey + tx * 0.22],
      [ex + ty * 0.22, ey - tx * 0.22],
    ]); ctx.fill();
    ctx.strokeStyle = '#c77dff'; ctx.lineWidth = 0.09;
    ctx.beginPath(); ctx.arc(0, 0, 0.28, 0.4, -Math.PI * 1.3, true); ctx.stroke();
    ctx.fillStyle = '#7b2cbf'; ctx.beginPath(); ctx.arc(0, 0, 0.08, 0, 7); ctx.fill();
  },

  bird(ctx) {
    ctx.lineJoin = 'round'; ctx.lineWidth = 0.05; ctx.strokeStyle = '#8a5a00';
    ctx.fillStyle = '#f4a300';
    path(ctx, [[-0.45, -0.05], [-0.9, -0.3], [-0.82, 0.05], [-0.9, 0.3]]); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffd23f';
    ctx.beginPath(); ctx.ellipse(-0.05, 0.05, 0.55, 0.45, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(0.35, -0.25, 0.32, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f4a300';
    ctx.beginPath(); ctx.ellipse(-0.12, 0.12, 0.3, 0.18, -0.4, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ff7b00';
    path(ctx, [[0.6, -0.33], [0.95, -0.22], [0.6, -0.12]]); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(0.43, -0.32, 0.06, 0, 7); ctx.fill();
  },

  turtle(ctx) {
    ctx.lineJoin = 'round'; ctx.lineWidth = 0.05; ctx.strokeStyle = '#1e5128';
    ctx.fillStyle = '#7cc56b';
    for (const [x, y] of [[0.35, -0.42], [0.35, 0.42], [-0.35, -0.42], [-0.35, 0.42]]) { ctx.beginPath(); ctx.ellipse(x, y, 0.14, 0.12, 0, 0, 7); ctx.fill(); ctx.stroke(); }
    path(ctx, [[-0.55, -0.05], [-0.85, 0], [-0.55, 0.05]]); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0.72, 0, 0.22, 0.18, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#2f8f46';
    ctx.beginPath(); ctx.ellipse(0, 0, 0.6, 0.45, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#a6e3a1'; ctx.lineWidth = 0.05;
    path(ctx, [[-0.2, -0.2], [0.2, -0.2], [0.3, 0], [0.2, 0.2], [-0.2, 0.2], [-0.3, 0]]); ctx.stroke();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(0.8, -0.06, 0.05, 0, 7); ctx.fill();
  },

  ladybug(ctx) {
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(0.55, 0, 0.25, 0, 7); ctx.fill();
    ctx.fillStyle = '#e63946'; ctx.strokeStyle = '#222'; ctx.lineWidth = 0.05;
    ctx.beginPath(); ctx.ellipse(-0.05, 0, 0.6, 0.5, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0.55, 0); ctx.lineTo(-0.65, 0); ctx.stroke();
    ctx.fillStyle = '#222';
    for (const [x, y] of [[0.15, -0.25], [0.15, 0.25], [-0.25, -0.2], [-0.25, 0.2], [-0.45, 0]]) { ctx.beginPath(); ctx.arc(x, y, 0.09, 0, 7); ctx.fill(); }
  },
};

function arrowShape(ctx, fill, stroke) {
  ctx.lineJoin = 'round'; ctx.lineWidth = 0.05; ctx.strokeStyle = stroke;
  ctx.fillStyle = fill;
  path(ctx, [[-0.82, -0.14], [0.3, -0.14], [0.3, -0.42], [0.9, 0], [0.3, 0.42], [0.3, 0.14], [-0.82, 0.14]]);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-0.55, 0, 0.11, 0, 7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(-0.52, 0, 0.05, 0, 7); ctx.fill();
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Valeur "taille" de chaque dessin (le nuage vaut zéro). */
export const GLYPH_VALUE = { cloud: 0 };

export const isCustomGlyph = (name) => Object.prototype.hasOwnProperty.call(DRAW, name);

/**
 * Dessine un glyphe.
 * @param angleDeg rotation anti-horaire (sens mathématique) en degrés
 * @param mirrored reflet du dessin par rapport à son propre axe (dauphin "ventre en l'air")
 */
export function drawGlyph(ctx, name, x, y, r, angleDeg = 0, mirrored = false, alpha = 1) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  ctx.rotate((-angleDeg * Math.PI) / 180);
  if (mirrored) ctx.scale(1, -1);
  if (isCustomGlyph(name)) {
    ctx.scale(r, r);
    DRAW[name](ctx);
  } else {
    ctx.font = `${Math.round(r * 1.45)}px ${EMOJI_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, 0, r * 0.08);
  }
  ctx.restore();
}

const BG = ['#ffe5ec', '#e2f0cb', '#cde7ff', '#fff1c1', '#e7dbff', '#d7f5ef', '#ffdcc2', '#f1f1f1'];

/** Normalise la description d'une face : 'dolphin' | '🐸' | { g, bg, scale }. */
export function faceSpec(spec, i) {
  if (spec == null) spec = '';
  if (typeof spec === 'string') spec = { g: spec };
  return { bg: BG[i % BG.length], scale: 1, ...spec };
}

/** Texture carrée d'une face. Le haut de la texture = vecteur "up" de la face. */
export function makeFaceTexture(spec, face, size = 256) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size * 0.4, size * 0.05, size / 2, size / 2, size * 0.7);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(1, spec.bg);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  if (spec.g) {
    const r = (size / 2) * (face.inR / face.R) * 0.86 * spec.scale;
    drawGlyph(ctx, spec.g, size / 2, size / 2, r);
  }
  return c;
}
