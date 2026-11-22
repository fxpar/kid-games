// Logique pure des cubes qui roulent (aucun DOM) : partagée par le jeu et le solveur.
//
// Repère monde : x vers l'est, y vers le NORD, z vers le haut.
// Grille : colonne x, ligne r (r augmente vers le sud). Une case (x, r) a pour centre (x, -r, 0.5).
// Orientation d'un cube = matrice de rotation 3×3 entière (exacte, 24 possibilités).
//
// Faces locales (au départ) : 0 dessus, 1 dessous, 2 est, 3 ouest, 4 nord, 5 sud.
// Chaque face porte un dessin ; "up" = haut du dessin, "right" = là où regarde un dessin orienté.

export const FACES = [
  { n: [0, 0, 1], u: [0, 1, 0] },
  { n: [0, 0, -1], u: [0, 1, 0] },
  { n: [1, 0, 0], u: [0, 0, 1] },
  { n: [-1, 0, 0], u: [0, 0, 1] },
  { n: [0, 1, 0], u: [0, 0, 1] },
  { n: [0, -1, 0], u: [0, 0, 1] },
];
for (const f of FACES) f.r = cross(f.u, f.n);

export const DIRS = {
  E: { dx: 1, dr: 0, name: 'E' },
  W: { dx: -1, dr: 0, name: 'W' },
  N: { dx: 0, dr: -1, name: 'N' },
  S: { dx: 0, dr: 1, name: 'S' },
};
export const MIRROR = { E: 'W', W: 'E', N: 'N', S: 'S' };

export function cross(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
export const I3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
export function mul(A, B) {
  const C = new Array(9);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) C[i * 3 + j] = A[i * 3] * B[j] + A[i * 3 + 1] * B[3 + j] + A[i * 3 + 2] * B[6 + j];
  return C;
}
export function apply(M, v) {
  return [M[0] * v[0] + M[1] * v[1] + M[2] * v[2], M[3] * v[0] + M[4] * v[1] + M[5] * v[2], M[6] * v[0] + M[7] * v[1] + M[8] * v[2]];
}
export function rotX(t) { const c = Math.cos(t), s = Math.sin(t); return [1, 0, 0, 0, c, -s, 0, s, c]; }
export function rotY(t) { const c = Math.cos(t), s = Math.sin(t); return [c, 0, s, 0, 1, 0, -s, 0, c]; }
export function rotZ(t) { const c = Math.cos(t), s = Math.sin(t); return [c, -s, 0, s, c, 0, 0, 0, 1]; }
const round = (M) => M.map((x) => Math.round(x) + 0);
const H = Math.PI / 2;

/** Rotation (monde) d'une roulade vers dir. */
export const ROLL = { E: round(rotY(H)), W: round(rotY(-H)), N: round(rotX(-H)), S: round(rotX(H)) };
/** Axe et sens de la roulade, pour l'animation. */
export const ROLL_AXIS = { E: ['y', 1], W: ['y', -1], N: ['x', -1], S: ['x', 1] };
export const SPIN = round(rotZ(-H)); // plateau tournant : quart de tour, sens des aiguilles vu du dessus

export function topFace(M) {
  for (let i = 0; i < 6; i++) if (apply(M, FACES[i].n)[2] === 1) return i;
  return 0;
}
const VEC2DIR = (v) => (v[0] === 1 ? 'E' : v[0] === -1 ? 'W' : v[1] === 1 ? 'N' : v[1] === -1 ? 'S' : null);
/** Direction où regarde le dessin du dessus (dessins orientés : dauphin, poisson…). */
export function topFacing(M) { return VEC2DIR(apply(M, FACES[topFace(M)].r)); }

// ---------------------------------------------------------------- niveau
export class Level {
  constructor(def) {
    this.def = def;
    this.map = def.map.map((row) => row.split(''));
    this.H = this.map.length;
    this.W = Math.max(...def.map.map((r) => r.length));
    this.houses = def.houses;
    this.fish = [];
    this.map.forEach((row, r) => row.forEach((ch, x) => { if (ch === '$') this.fish.push([x, r]); }));
  }
  tile(x, r) { return this.map[r]?.[x] ?? ' '; }
  blocked(x, r) { const t = this.tile(x, r); return t === '#' || t === ' ' || t === undefined; }

  initialState() {
    return {
      cubes: this.def.cubes.map((c) => ({ x: c.x, r: c.r, M: c.M ? c.M.slice() : I3.slice() })),
      fish: this.fish.map(() => false),
      moves: 0,
    };
  }

  glyph(ci, face) { return this.def.cubes[ci].faces[face]; }
  top(state, ci) { return this.glyph(ci, topFace(state.cubes[ci].M)); }

  occupied(state, x, r, except) { return state.cubes.some((c, i) => i !== except && c.x === x && c.r === r); }

  /**
   * Joue un coup : le cube ci part vers dir (et son jumeau suit, en miroir).
   * Renvoie { state, events } ou null si rien ne bouge.
   */
  move(state, ci, dir) {
    const s = { cubes: state.cubes.map((c) => ({ ...c, M: c.M.slice() })), fish: state.fish.slice(), moves: state.moves };
    const events = [];
    const order = [[ci, dir]];
    const tw = this.def.cubes[ci].twin;
    if (tw != null) order.push([tw, this.def.cubes[ci].twinMode === 'same' ? dir : MIRROR[dir]]);
    let any = false;
    for (const [i, d] of order) {
      const ev = this.moveOne(s, i, d);
      events.push(...ev);
      if (ev.some((e) => e.type !== 'blocked')) any = true;
    }
    if (!any) return { state: null, events };
    s.moves++;
    return { state: s, events };
  }

  moveOne(s, i, dir) {
    const c = s.cubes[i], D = DIRS[dir], ev = [];
    const nx = c.x + D.dx, nr = c.r + D.dr;
    if (this.blocked(nx, nr) || this.occupied(s, nx, nr, i)) return [{ type: 'blocked', cube: i, dir }];
    const here = this.tile(c.x, c.r), there = this.tile(nx, nr);
    if (here === '~') {
      ev.push({ type: 'swim', cube: i, dir, from: [c.x, c.r] });
    } else {
      const M2 = mul(ROLL[dir], c.M);
      if (there === '~' && this.glyph(i, topFace(M2)) !== 'dolphin') return [{ type: 'blocked', cube: i, dir, reason: 'water' }];
      ev.push({ type: 'roll', cube: i, dir, from: [c.x, c.r], M0: c.M });
      c.M = M2;
    }
    c.x = nx; c.r = nr;
    // glissade sur la glace
    while (this.tile(c.x, c.r) === '*') {
      const gx = c.x + D.dx, gr = c.r + D.dr;
      if (this.blocked(gx, gr) || this.occupied(s, gx, gr, i) || this.tile(gx, gr) === '~') break;
      this.grabFish(s, i, ev);
      ev.push({ type: 'slide', cube: i, dir, from: [c.x, c.r] });
      c.x = gx; c.r = gr;
    }
    if (this.tile(c.x, c.r) === '@') { ev.push({ type: 'spin', cube: i, M0: c.M }); c.M = mul(SPIN, c.M); }
    this.grabFish(s, i, ev);
    return ev;
  }

  grabFish(s, i, ev) {
    const c = s.cubes[i];
    this.fish.forEach(([fx, fr], k) => { if (!s.fish[k] && fx === c.x && fr === c.r) { s.fish[k] = true; ev.push({ type: 'fish', cube: i, k }); } });
  }

  houseOk(state, h) {
    return state.cubes.some((c, i) => c.x === h.x && c.r === h.r && this.top(state, i) === h.g && (!h.dir || topFacing(c.M) === h.dir));
  }
  won(state) { return this.houses.every((h) => this.houseOk(state, h)); }

  key(state) { return state.cubes.map((c) => c.x + ',' + c.r + ',' + c.M.join('')).join('|'); }

  /** Recherche en largeur : nombre minimal de coups (et la solution). */
  solve(limit = 400000) {
    const start = this.initialState();
    if (this.won(start)) return { par: 0, path: [] };
    const seen = new Set([this.key(start)]);
    let frontier = [{ s: start, path: [] }];
    let n = 0;
    while (frontier.length && n < limit) {
      const next = [];
      for (const { s, path } of frontier) {
        for (let ci = 0; ci < s.cubes.length; ci++) {
          for (const d of 'NESW') {
            const res = this.move(s, ci, d);
            if (!res.state) continue;
            n++;
            const k = this.key(res.state);
            if (seen.has(k)) continue;
            seen.add(k);
            const p = [...path, ci + d];
            if (this.won(res.state)) return { par: p.length, path: p, explored: n };
            next.push({ s: res.state, path: p });
          }
        }
      }
      frontier = next;
    }
    return null;
  }
}
