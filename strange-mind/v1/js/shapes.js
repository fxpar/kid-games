// Catalogue des formes : chaque forme plate vue à l'écran est en réalité un polyèdre.
//   carré    -> cube            (6 faces carrées)
//   triangle -> pyramide        (tétraèdre, 4 faces triangulaires)
//   octogone -> prisme octogonal (2 octogones + 8 carrés)
// Pour ajouter une forme : écrire une fonction qui renvoie { name, faces: [makeFace(...)] }
// avec la face 0 tournée vers le joueur (+z) au départ.

import { add, sub, cross, dot, norm, scale, len } from './math3d.js';

/**
 * Construit une face convexe.
 * @param {number[][]} verts sommets (ordre quelconque autour du polygone)
 * @param {number[]} upHint direction "haut" souhaitée pour le dessin de la face
 */
export function makeFace(verts, upHint) {
  const n = verts.length;
  const center = scale(verts.reduce((s, v) => add(s, v), [0, 0, 0]), 1 / n);
  let normal = norm(cross(sub(verts[1], verts[0]), sub(verts[2], verts[0])));
  if (dot(normal, center) < 0) { normal = scale(normal, -1); verts = verts.slice().reverse(); }
  // "haut" projeté dans le plan de la face
  let up = sub(upHint, scale(normal, dot(upHint, normal)));
  if (len(up) < 1e-6) up = sub(verts[0], center);
  up = norm(up);
  const R = Math.max(...verts.map((v) => len(sub(v, center))));
  let inR = Infinity;
  for (let i = 0; i < n; i++) {
    const m = scale(add(verts[i], verts[(i + 1) % n]), 0.5);
    inR = Math.min(inR, len(sub(m, center)));
  }
  return {
    verts, center, normal, up, R, inR, sides: n,
    // pas de rotation "naturel" du polygone dans son plan
    twistStep: 360 / n,
    // positions de repos autorisées (un triangle peut pointer en haut ou en bas)
    snapStep: n % 2 ? 180 / n : 360 / n,
  };
}

export function cube(h = 0.8) {
  const P = (x, y, z) => [x * h, y * h, z * h];
  return {
    name: 'cube',
    faces: [
      makeFace([P(-1, -1, 1), P(1, -1, 1), P(1, 1, 1), P(-1, 1, 1)], [0, 1, 0]),     // 0 devant
      makeFace([P(1, -1, 1), P(1, -1, -1), P(1, 1, -1), P(1, 1, 1)], [0, 1, 0]),     // 1 droite
      makeFace([P(1, -1, -1), P(-1, -1, -1), P(-1, 1, -1), P(1, 1, -1)], [0, 1, 0]), // 2 derrière
      makeFace([P(-1, -1, -1), P(-1, -1, 1), P(-1, 1, 1), P(-1, 1, -1)], [0, 1, 0]), // 3 gauche
      makeFace([P(-1, 1, 1), P(1, 1, 1), P(1, 1, -1), P(-1, 1, -1)], [0, 0, -1]),    // 4 dessus
      makeFace([P(-1, -1, -1), P(1, -1, -1), P(1, -1, 1), P(-1, -1, 1)], [0, 0, 1]), // 5 dessous
    ],
  };
}

export function pyramid(R = 1.12) {
  // Tétraèdre régulier, une face vers le joueur, pointe en haut.
  const L = R * Math.sqrt(3);
  const H = L * Math.sqrt(2 / 3);
  const a = H / 4; // distance centre -> face
  const ang = [90, 210, 330].map((d) => (d * Math.PI) / 180);
  const F = ang.map((t) => [R * Math.cos(t), R * Math.sin(t), a]);
  const apex = [0, 0, -3 * a];
  const toApex = (i, j) => {
    const c = scale(add(add(F[i], F[j]), apex), 1 / 3);
    return sub(apex, c);
  };
  return {
    name: 'pyramid',
    faces: [
      makeFace([F[0], F[1], F[2]], [0, 1, 0]),
      makeFace([F[1], F[2], apex], toApex(1, 2)),
      makeFace([F[2], F[0], apex], toApex(2, 0)),
      makeFace([F[0], F[1], apex], toApex(0, 1)),
    ],
  };
}

export function octagon(R = 1.08) {
  // Prisme octogonal dont les faces latérales sont des carrés.
  const edge = 2 * R * Math.sin(Math.PI / 8);
  const d = edge / 2;
  const ang = Array.from({ length: 8 }, (_, k) => ((22.5 + 45 * k) * Math.PI) / 180);
  const front = ang.map((t) => [R * Math.cos(t), R * Math.sin(t), d]);
  const back = ang.map((t) => [R * Math.cos(t), R * Math.sin(t), -d]);
  const faces = [makeFace(front, [0, 1, 0]), makeFace(back.slice().reverse(), [0, 1, 0])];
  for (let k = 0; k < 8; k++) {
    const k2 = (k + 1) % 8;
    const mid = (ang[k] + ang[k2]) / 2 + (k === 7 ? Math.PI : 0);
    // "haut" de la face latérale : comme pour le cube (debout quand on bascule vers elle)
    const tangent = [-Math.sin(mid), Math.cos(mid), 0];
    const up = Math.abs(tangent[1]) > 0.3
      ? scale(tangent, Math.sign(tangent[1]))
      : [0, 0, -Math.sign(Math.sin(mid))];
    faces.push(makeFace([front[k], back[k], back[k2], front[k2]], up));
  }
  return { name: 'octagon', faces };
}

export const SHAPES = { cube, pyramid, octagon };
