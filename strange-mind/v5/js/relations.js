// Strange Mind v5 : la chasse aux relations (logique pure, sans DOM).
//
// Un plateau = une grille de tuiles. Le jeu montre des RELATIONS (« quart de tour ↺ », « s'annulent »…).
// Le joueur glisse d'une tuile à l'autre (2 ou 3 en ligne, ou en diagonale pour un carré 2×2)
// pour montrer chaque endroit où la relation est vraie. Il faut toutes les trouver.
// Les relations plus riches rapportent plus de points.
//
// Tuiles : { t:'dolphin', d, m } (m = vu dans un miroir, ventre en l'air) · { t:'num', v } (+1, -1, 0)
//          { t:'mirror', a } (axe 0/45/90/135) · { t:'arrow', d } · { t:'water' } (vide)

export const n360 = (d) => ((Math.round(d) % 360) + 360) % 360;
const diff = (a, b) => n360(b.d - a.d);
const is = (t, ...xs) => xs.every((x) => x && x.t === t);
const reflect = (dir, axis) => n360(2 * axis - dir);

export function makeR(rand) {
  return {
    f: rand,
    int: (n) => Math.floor(rand() * n),
    pick: (a) => a[Math.floor(rand() * a.length)],
  };
}

const D4 = [0, 90, 180, 270], D8 = [0, 45, 90, 135, 180, 225, 270, 315];
const dol = (d, m = false) => ({ t: 'dolphin', d: n360(d), m });
const num = (v) => ({ t: 'num', v });
const arr = (d) => ({ t: 'arrow', d: n360(d) });
const isOrth = ([[a, b], [c, d]]) => a * b + c * d === 0 && a * a + c * c === 1 && b * b + d * d === 1;
const det = ([[a, b], [c, d]]) => a * d - b * c;
const ROT = [[[0, -1], [1, 0]], [[0, 1], [-1, 0]], [[-1, 0], [0, -1]]];
const MIR = [[[-1, 0], [0, 1]], [[1, 0], [0, -1]], [[0, 1], [1, 0]], [[0, -1], [-1, 0]]];
const sq = (M) => [num(M[0][0]), num(M[0][1]), num(M[1][0]), num(M[1][1])]; // HG, HD, BG, BD

/**
 * kind : 'pair' (2 en ligne) | 'triple' (3 en ligne) | 'square' (carré 2×2)
 * ordered : le sens du glissement compte
 * test(...tuiles) · plant(R) → tuiles à poser · example(phase) → tuiles du modèle (qui tourne)
 */
export const RELATIONS = {
  pareil: {
    name: 'Pareil', pts: 10, color: '#06d6a0', kind: 'pair', ordered: false,
    test: (a, b) => is('dolphin', a, b) && !a.m && !b.m && a.d === b.d,
    plant: (R) => { const d = R.pick(D4); return [dol(d), dol(d)]; },
    example: (k) => [dol(k * 90), dol(k * 90)],
  },
  quart: {
    name: 'Quart de tour ↺', pts: 20, color: '#118ab2', kind: 'pair', ordered: true,
    test: (a, b) => is('dolphin', a, b) && !a.m && !b.m && diff(a, b) === 90,
    plant: (R) => { const d = R.pick(D4); return [dol(d), dol(d + 90)]; },
    example: (k) => [dol(k * 90), dol(k * 90 + 90)],
  },
  demi: {
    name: 'Demi-tour', pts: 20, color: '#ef476f', kind: 'pair', ordered: false,
    test: (a, b) => is('dolphin', a, b) && !a.m && !b.m && diff(a, b) === 180,
    plant: (R) => { const d = R.pick(D4); return [dol(d), dol(d + 180)]; },
    example: (k) => [dol(k * 90), dol(k * 90 + 180)],
  },
  quartInv: {
    name: 'Quart de tour ↻', pts: 20, color: '#ff9a2e', kind: 'pair', ordered: true,
    test: (a, b) => is('dolphin', a, b) && !a.m && !b.m && diff(a, b) === 270,
    plant: (R) => { const d = R.pick(D4); return [dol(d), dol(d - 90)]; },
    example: (k) => [dol(k * 90), dol(k * 90 - 90)],
  },
  suite: {
    name: 'La suite ↺ ↺', pts: 50, color: '#7b2cbf', kind: 'triple', ordered: true,
    test: (a, b, c) => is('dolphin', a, b, c) && !a.m && !b.m && !c.m && diff(a, b) === 90 && diff(b, c) === 90,
    plant: (R) => { const d = R.pick(D4); return [dol(d), dol(d + 90), dol(d + 180)]; },
    example: (k) => [dol(k * 90), dol(k * 90 + 90), dol(k * 90 + 180)],
  },
  machine: {
    name: 'La machine A × B = C', pts: 80, color: '#e85d04', kind: 'triple', ordered: true,
    test: (a, b, c) => is('dolphin', a, b, c) && !a.m && !b.m && !c.m && a.d !== 0 && b.d !== 0 && n360(a.d + b.d) === c.d,
    plant: (R) => { const a = R.pick([90, 180, 270]), b = R.pick([90, 180, 270]); return [dol(a), dol(b), dol(a + b)]; },
    example: (k) => [[dol(90), dol(90), dol(180)], [dol(90), dol(180), dol(270)], [dol(270), dol(180), dol(90)], [dol(180), dol(180), dol(0)]][k % 4],
  },
  racine: {
    name: 'Fois lui-même', pts: 60, color: '#d00000', kind: 'pair', ordered: true,
    test: (a, b) => is('dolphin', a, b) && !a.m && !b.m && a.d !== 0 && n360(2 * a.d) === b.d,
    plant: (R) => { const a = R.pick(D8.filter((x) => x)); return [dol(a), dol(2 * a)]; },
    example: (k) => { const a = [45, 90, 135, 225][k % 4]; return [dol(a), dol(2 * a)]; },
  },
  zero: {
    name: 'Ils s’annulent', pts: 20, color: '#06d6a0', kind: 'pair', ordered: false,
    test: (a, b) => is('num', a, b) && a.v !== 0 && a.v + b.v === 0,
    plant: (R) => { const v = R.pick([1, -1]); return [num(v), num(-v)]; },
    example: (k) => (k % 2 ? [num(-1), num(1)] : [num(1), num(-1)]),
  },
  trioZero: {
    name: 'Trois qui font zéro', pts: 50, color: '#7b2cbf', kind: 'triple', ordered: false,
    test: (a, b, c) => is('num', a, b, c) && a.v + b.v + c.v === 0 && (a.v || b.v || c.v),
    plant: (R) => R.pick([[num(1), num(0), num(-1)], [num(-1), num(0), num(1)], [num(1), num(-1), num(0)], [num(0), num(-1), num(1)]]),
    example: (k) => [[num(1), num(0), num(-1)], [num(0), num(1), num(-1)], [num(-1), num(1), num(0)], [num(-1), num(0), num(1)]][k % 4],
  },
  miroir: {
    name: 'Le miroir', pts: 60, color: '#118ab2', kind: 'triple', ordered: false,
    test: (a, m, c) => is('dolphin', a, c) && is('mirror', m) && c.d === reflect(a.d, m.a) && c.m === !a.m,
    plant: (R) => { const d = R.pick(D4), ax = R.pick([0, 45, 90, 135]), mm = R.f() < 0.5; return [dol(d, mm), { t: 'mirror', a: ax }, dol(reflect(d, ax), !mm)]; },
    example: (k) => { const ax = [45, 0, 135, 90][k % 4]; return [dol(0), { t: 'mirror', a: ax }, dol(reflect(0, ax), true)]; },
  },
  tourbG: {
    name: 'Tourbillon ↺', pts: 40, color: '#7b2cbf', kind: 'pair', ordered: true,
    test: (a, b) => is('arrow', a, b) && diff(a, b) === 90,
    plant: (R) => { const d = R.pick(D4); return [arr(d), arr(d + 90)]; },
    example: (k) => [arr(k * 90), arr(k * 90 + 90)],
  },
  tourbD: {
    name: 'Tourbillon ↻', pts: 40, color: '#ff006e', kind: 'pair', ordered: true,
    test: (a, b) => is('arrow', a, b) && diff(a, b) === 270,
    plant: (R) => { const d = R.pick(D4); return [arr(d), arr(d - 90)]; },
    example: (k) => [arr(k * 90), arr(k * 90 - 90)],
  },
  opposes: {
    name: 'Tête en bas', pts: 20, color: '#118ab2', kind: 'pair', ordered: false,
    test: (a, b) => is('arrow', a, b) && diff(a, b) === 180,
    plant: (R) => { const d = R.pick(D4); return [arr(d), arr(d + 180)]; },
    example: (k) => [arr(k * 90), arr(k * 90 + 180)],
  },
  jardinTourne: {
    name: 'Le jardin tourne', pts: 80, color: '#2a9d8f', kind: 'square', ordered: false,
    test: (a, b, c, d) => is('num', a, b, c, d) && (() => { const M = [[a.v, b.v], [c.v, d.v]]; return isOrth(M) && det(M) === 1 && !(M[0][0] === 1 && M[1][1] === 1); })(),
    plant: (R) => sq(R.pick(ROT)),
    example: (k) => sq(ROT[k % 3]),
  },
  jardinMiroir: {
    name: 'Le jardin dans le miroir', pts: 80, color: '#e76f51', kind: 'square', ordered: false,
    test: (a, b, c, d) => is('num', a, b, c, d) && (() => { const M = [[a.v, b.v], [c.v, d.v]]; return isOrth(M) && det(M) === -1; })(),
    plant: (R) => sq(R.pick(MIR)),
    example: (k) => sq(MIR[k % 4]),
  },
};

/** Remplissage aléatoire d'une case selon le jeu de tuiles du chapitre. */
const FILL = {
  dolphin4: (R, dens) => (R.f() < dens ? dol(R.pick(D4)) : { t: 'water' }),
  dolphin8: (R, dens) => (R.f() < dens ? dol(R.pick(D8)) : { t: 'water' }),
  num: (R, dens) => (R.f() < dens ? num(R.pick([1, -1, 0, 0])) : { t: 'water' }),
  numgrid: (R) => num(R.pick([1, -1, 0, 0, 0, 0])),
  mirror: (R) => { const x = R.f(); return x < 0.45 ? dol(R.pick(D4), R.f() < 0.4) : x < 0.7 ? { t: 'mirror', a: R.pick([0, 45, 90, 135]) } : { t: 'water' }; },
  arrow: (R, dens) => (R.f() < dens ? arr(R.pick(D4)) : { t: 'water' }),
};

export const CHAPTERS = [
  { id: 'jumeaux', name: 'Les jumeaux', icon: '👯', tiles: 'dolphin4', size: 5, dens: 0.5, rels: ['pareil'] },
  { id: 'quart', name: 'Le quart de tour', icon: '↺', tiles: 'dolphin4', size: 5, dens: 0.5, rels: ['pareil', 'quart'] },
  { id: 'demi', name: 'Le demi-tour', icon: '🔄', tiles: 'dolphin4', size: 6, dens: 0.4, max: 6, rels: ['pareil', 'quart', 'demi'] },
  { id: 'sens', name: 'Les deux sens', icon: '↔️', tiles: 'dolphin4', size: 6, dens: 0.4, max: 6, rels: ['quart', 'quartInv'] },
  { id: 'suite', name: 'La suite', icon: '🌀', tiles: 'dolphin4', size: 6, dens: 0.45, max: 8, rels: ['quart', 'suite'] },
  { id: 'machine', name: 'La machine', icon: '✖️', tiles: 'dolphin4', size: 6, dens: 0.55, rels: ['pareil', 'machine'] },
  { id: 'racine', name: 'Fois lui-même', icon: '🛑', tiles: 'dolphin8', size: 6, dens: 0.5, rels: ['pareil', 'racine'] },
  { id: 'lapins', name: 'Les lapins', icon: '🐰', tiles: 'num', size: 6, dens: 0.5, rels: ['zero', 'trioZero'] },
  { id: 'miroirs', name: 'Les miroirs', icon: '🪞', tiles: 'mirror', size: 6, rels: ['pareil', 'miroir'] },
  { id: 'tourbillon', name: 'Le tourbillon', icon: '🌪️', tiles: 'arrow', size: 6, dens: 0.4, max: 7, rels: ['opposes', 'tourbG', 'tourbD'] },
  { id: 'jardins', name: 'Les jardins', icon: '🏡', tiles: 'numgrid', size: 5, rels: ['jardinTourne', 'jardinMiroir'] },
];

const STEPS = { E: [0, 1], S: [1, 0], W: [0, -1], N: [-1, 0] };
const arity = { pair: 2, triple: 3, square: 4 };

/** Toutes les occurrences de chaque relation sur le plateau. */
export function countAll(board, relIds) {
  const N = board.length, res = {};
  const at = (r, c) => board[r]?.[c];
  for (const id of relIds) {
    const rel = RELATIONS[id], found = new Map();
    if (rel.kind === 'square') {
      for (let r = 0; r < N - 1; r++) for (let c = 0; c < N - 1; c++) {
        const cells = [[r, c], [r, c + 1], [r + 1, c], [r + 1, c + 1]];
        if (rel.test(...cells.map(([y, x]) => at(y, x)))) found.set(keyOf(rel, cells), cells);
      }
    } else {
      const n = arity[rel.kind];
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) for (const [dr, dc] of Object.values(STEPS)) {
        const cells = Array.from({ length: n }, (_, k) => [r + dr * k, c + dc * k]);
        if (cells.some(([y, x]) => !at(y, x))) continue;
        if (rel.test(...cells.map(([y, x]) => at(y, x)))) found.set(keyOf(rel, cells), cells);
      }
    }
    res[id] = found;
  }
  return res;
}

export function keyOf(rel, cells) {
  const ks = cells.map(([r, c]) => r * 10 + c);
  return (rel.ordered ? ks : ks.slice().sort((a, b) => a - b)).join('-');
}

/** Pose une occurrence d'une relation à un endroit aléatoire. */
function plant(board, R, rel) {
  const N = board.length, tiles = rel.plant(R);
  if (rel.kind === 'square') {
    const r = R.int(N - 1), c = R.int(N - 1);
    [[r, c], [r, c + 1], [r + 1, c], [r + 1, c + 1]].forEach(([y, x], i) => { board[y][x] = tiles[i]; });
    return;
  }
  const [dr, dc] = R.pick(Object.values(STEPS)), n = tiles.length;
  const rmin = Math.max(0, -dr * (n - 1)), rmax = Math.min(N - 1, N - 1 - dr * (n - 1));
  const cmin = Math.max(0, -dc * (n - 1)), cmax = Math.min(N - 1, N - 1 - dc * (n - 1));
  const r = rmin + R.int(rmax - rmin + 1), c = cmin + R.int(cmax - cmin + 1);
  tiles.forEach((t, k) => { board[r + dr * k][c + dc * k] = t; });
}

/**
 * Fabrique un plateau où chaque relation du chapitre apparaît entre `min` et `max` fois.
 */
export function makeBoard(ch, R, { min = 2, max = ch.max ?? 5 } = {}) {
  const N = ch.size;
  let best = null, bestScore = Infinity;
  for (let tries = 0; tries < 400; tries++) {
    const board = Array.from({ length: N }, () => Array.from({ length: N }, () => FILL[ch.tiles](R, ch.dens ?? 0.5)));
    for (const id of ch.rels) {
      const k = 2 + R.int(2);
      for (let i = 0; i < k; i++) plant(board, R, RELATIONS[id]);
    }
    const counts = countAll(board, ch.rels);
    const sizes = ch.rels.map((id) => counts[id].size);
    const bad = sizes.reduce((s, n) => s + (n < min ? min - n : n > max ? n - max : 0), 0);
    if (bad === 0) return { board, counts };
    if (bad < bestScore) { bestScore = bad; best = { board, counts }; }
  }
  return best;
}
