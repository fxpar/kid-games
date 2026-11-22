// Logique pure du plateau (aucun DOM) : utilisable dans le navigateur et dans Node (simulations).
//
// Une tuile = { id, sp (espèce), d (direction 0 → droite, 1 ↑ haut, 2 ← gauche, 3 ↓ bas), special }
// Coup : faire tourner un carré 2×2 d'un quart de tour (les tuiles bougent ET tournent sur elles-mêmes).
// Alignement de 3+ même espèce : éclate. Si tous regardent dans le même sens : PARADE.
//   parade de 4  → fusée   🚀 (vide la ligne, ou la colonne, selon le sens de l'animal)
//   parade de 5+ → tourbillon 🌀 (éclate toute son espèce puis fait tourner le plateau)
//   L ou T       → bombe   💥 (vide un carré 3×3)
//   deux animaux de même espèce face à face → BISOU 💋 (éclatent avec leurs voisins)

export const DIR = [[0, 1], [-1, 0], [0, -1], [1, 0]]; // [dr, dc] pour d = 0..3

export function makeRng(seed) {
  let a = typeof seed === 'number' ? seed >>> 0 : hashString(String(seed));
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

const key = (r, c) => r * 100 + c;

export class Board {
  /**
   * @param {object} cfg { size, species (nombre), dirs (directions d'apparition), ice: [lignes "..##.."] }
   */
  constructor(cfg, seed = Date.now()) {
    this.N = cfg.size || 7;
    this.nsp = cfg.species || 4;
    this.dirs = cfg.dirs || [0];
    this.rand = makeRng(seed);
    this.uid = 0;
    const N = this.N;
    this.ice = Array.from({ length: N }, (_, r) => Array.from({ length: N }, (_, c) => (cfg.ice?.[r]?.[c] === '#' ? 1 : 0)));
    this.grid = Array.from({ length: N }, () => Array(N).fill(null));
    this.fillFresh();
  }

  pick(arr) { return arr[Math.floor(this.rand() * arr.length)]; }
  newTile() { return { id: ++this.uid, sp: Math.floor(this.rand() * this.nsp), d: this.pick(this.dirs), special: null }; }

  /** Remplit sans alignement ni bisou, avec au moins un coup possible. */
  fillFresh() {
    const N = this.N;
    for (let tries = 0; tries < 50; tries++) {
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
        let t, n = 0;
        do { t = this.newTile(); this.grid[r][c] = t; } while (n++ < 30 && this.makesLine(r, c));
      }
      if (this.hasMoves()) return;
    }
  }

  makesLine(r, c) {
    const g = this.grid, t = g[r][c];
    const same = (y, x) => g[y]?.[x] && g[y][x].sp === t.sp;
    if (c >= 2 && same(r, c - 1) && same(r, c - 2)) return true;
    if (r >= 2 && same(r - 1, c) && same(r - 2, c)) return true;
    // bisou avec la voisine de gauche ou du haut
    if (same(r, c - 1) && g[r][c - 1].d === 0 && t.d === 2) return true;
    if (same(r - 1, c) && g[r - 1][c].d === 3 && t.d === 1) return true;
    return false;
  }

  /** Cases d'un carré 2×2, dans le sens des aiguilles : HG, HD, BD, BG. */
  static blockCells(r, c) { return [[r, c], [r, c + 1], [r + 1, c + 1], [r + 1, c]]; }

  /** Tourne le carré dont le coin haut-gauche est (r,c). cw = sens des aiguilles d'une montre. */
  rotateBlock(r, c, cw) {
    const cells = Board.blockCells(r, c);
    const t = cells.map(([y, x]) => this.grid[y][x]);
    cells.forEach(([y, x], i) => {
      const src = cw ? t[(i + 3) % 4] : t[(i + 1) % 4];
      this.grid[y][x] = src;
      if (src) src.d = cw ? (src.d + 3) % 4 : (src.d + 1) % 4;
    });
    return cells;
  }

  /** Alignements (runs) et bisous présents sur le plateau. */
  scan() {
    const N = this.N, g = this.grid;
    const runs = [];
    for (const orient of ['h', 'v']) {
      for (let i = 0; i < N; i++) {
        let j = 0;
        while (j < N) {
          const at = (k) => (orient === 'h' ? g[i][k] : g[k][i]);
          const t = at(j);
          if (!t) { j++; continue; }
          let k = j + 1;
          while (k < N && at(k) && at(k).sp === t.sp) k++;
          if (k - j >= 3) {
            const cells = [];
            for (let m = j; m < k; m++) cells.push(orient === 'h' ? [i, m] : [m, i]);
            const parade = cells.every(([y, x]) => g[y][x].d === t.d);
            runs.push({ cells, orient, parade, d: t.d, sp: t.sp });
          }
          j = k;
        }
      }
    }
    const pairs = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const a = g[r][c];
      if (!a) continue;
      const b = g[r][c + 1], e = g[r + 1]?.[c];
      if (b && b.sp === a.sp && a.d === 0 && b.d === 2) pairs.push([[r, c], [r, c + 1]]);
      if (e && e.sp === a.sp && a.d === 3 && e.d === 1) pairs.push([[r, c], [r + 1, c]]);
    }
    return { runs, pairs };
  }

  hasMatch() { const s = this.scan(); return s.runs.length > 0 || s.pairs.length > 0; }

  /** Un coup valide existe-t-il ? renvoie le premier trouvé {r,c,cw} ou null. */
  findMove() {
    const N = this.N;
    for (let r = 0; r < N - 1; r++) for (let c = 0; c < N - 1; c++) for (const cw of [true, false]) {
      this.rotateBlock(r, c, cw);
      const ok = this.hasMatch();
      this.rotateBlock(r, c, !cw);
      if (ok) return { r, c, cw };
    }
    return null;
  }
  hasMoves() { return !!this.findMove(); }

  allMoves() {
    const out = [], N = this.N;
    for (let r = 0; r < N - 1; r++) for (let c = 0; c < N - 1; c++) for (const cw of [true, false]) {
      this.rotateBlock(r, c, cw);
      if (this.hasMatch()) out.push({ r, c, cw });
      this.rotateBlock(r, c, !cw);
    }
    return out;
  }

  /**
   * Une étape de résolution. focus = cases du dernier coup (pour placer les bonus).
   * Retourne null s'il n'y a rien à éclater.
   */
  resolveStep(focus = []) {
    const { runs, pairs } = this.scan();
    if (!runs.length && !pairs.length) return null;
    const g = this.grid;
    const focusSet = new Set(focus.map(([r, c]) => key(r, c)));
    const toClear = new Map();
    const add = (r, c) => { if (g[r]?.[c]) toClear.set(key(r, c), [r, c]); };
    const created = new Map(); // key -> {r,c,special,d}
    const rank = { rocket: 1, bomb: 2, whirl: 3 };
    const create = (r, c, special, d) => {
      const t = g[r][c];
      if (t.special) return; // une tuile déjà spéciale se déclenche plutôt
      const k = key(r, c), old = created.get(k);
      if (!old || rank[special] > rank[old.special]) created.set(k, { r, c, special, d });
    };

    // intersections (L / T)
    const count = new Map();
    for (const run of runs) for (const [r, c] of run.cells) count.set(key(r, c), (count.get(key(r, c)) || 0) + 1);

    let parades = 0;
    for (const run of runs) {
      run.cells.forEach(([r, c]) => add(r, c));
      if (run.parade) parades++;
      if (run.parade && run.cells.length >= 4) {
        const pivot = run.cells.find(([r, c]) => focusSet.has(key(r, c))) || run.cells[Math.floor(run.cells.length / 2)];
        create(pivot[0], pivot[1], run.cells.length >= 5 ? 'whirl' : 'rocket', run.d);
      }
    }
    for (const [k, n] of count) if (n >= 2) { const r = Math.floor(k / 100), c = k % 100; create(r, c, 'bomb', g[r][c].d); }
    for (const pair of pairs) for (const [r, c] of pair) add(r, c);

    for (const k of created.keys()) toClear.delete(k);
    return this.clear([...toClear.values()], { created: [...created.values()], runs, pairs, parades });
  }

  /** Éclate des cases (et déclenche en chaîne les bonus touchés). */
  clear(cells, extra = {}) {
    const g = this.grid, N = this.N;
    const protectedKeys = new Set((extra.created || []).map((x) => key(x.r, x.c)));
    const set = new Map(cells.map(([r, c]) => [key(r, c), [r, c]]));
    const triggers = [];
    const fired = new Set();
    let rotateBoard = 0;
    let changed = true;
    while (changed) {
      changed = false;
      for (const [k, [r, c]] of [...set]) {
        const t = g[r][c];
        if (!t?.special || fired.has(t.id)) continue;
        fired.add(t.id);
        changed = true;
        triggers.push({ type: t.special, r, c, d: t.d, sp: t.sp });
        const addC = (y, x) => { if (y >= 0 && x >= 0 && y < N && x < N && g[y][x] && !protectedKeys.has(key(y, x))) set.set(key(y, x), [y, x]); };
        if (t.special === 'rocket') {
          for (let i = 0; i < N; i++) (t.d % 2 === 0 ? addC(r, i) : addC(i, c));
        } else if (t.special === 'bomb') {
          for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) addC(r + dr, c + dc);
        } else if (t.special === 'whirl') {
          for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (g[y][x]?.sp === t.sp) addC(y, x);
          rotateBoard++;
        }
        void k;
      }
    }
    const cleared = [];
    const iceBroken = [];
    for (const [r, c] of set.values()) {
      const t = g[r][c];
      if (!t) continue;
      cleared.push({ tile: t, r, c });
      g[r][c] = null;
      if (this.ice[r][c]) { this.ice[r][c] = 0; iceBroken.push([r, c]); }
    }
    for (const cr of extra.created || []) {
      const t = g[cr.r][cr.c];
      t.special = cr.special; t.d = cr.d;
      if (this.ice[cr.r][cr.c]) { this.ice[cr.r][cr.c] = 0; iceBroken.push([cr.r, cr.c]); }
    }
    return { cleared, created: extra.created || [], triggers, rotateBoard, iceBroken, runs: extra.runs || [], pairs: extra.pairs || [], parades: extra.parades || 0 };
  }

  /** Tourne tout le plateau d'un quart de tour (sens inverse des aiguilles). */
  rotateBoard() {
    const N = this.N, g = this.grid, ice = this.ice;
    const ng = Array.from({ length: N }, () => Array(N).fill(null));
    const ni = Array.from({ length: N }, () => Array(N).fill(0));
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      ng[N - 1 - c][r] = g[r][c];
      ni[N - 1 - c][r] = ice[r][c];
      if (g[r][c]) g[r][c].d = (g[r][c].d + 1) % 4;
    }
    this.grid = ng; this.ice = ni;
  }

  /** Chute + nouvelles tuiles. Renvoie [{tile, c, fromR, toR}] (fromR < 0 pour les nouvelles). */
  gravity() {
    const N = this.N, g = this.grid, moves = [];
    for (let c = 0; c < N; c++) {
      let w = N - 1;
      for (let r = N - 1; r >= 0; r--) {
        if (g[r][c]) {
          if (w !== r) { g[w][c] = g[r][c]; g[r][c] = null; moves.push({ tile: g[w][c], c, fromR: r, toR: w }); }
          w--;
        }
      }
      const k = w + 1;
      for (let r = w; r >= 0; r--) {
        const t = this.newTile();
        g[r][c] = t;
        moves.push({ tile: t, c, fromR: r - k, toR: r, spawned: true });
      }
    }
    return moves;
  }

  /** Mélange les tuiles (quand plus aucun coup n'est possible). */
  shuffle() {
    const N = this.N, all = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) all.push(this.grid[r][c]);
    for (let tries = 0; tries < 100; tries++) {
      for (let i = all.length - 1; i > 0; i--) { const j = Math.floor(this.rand() * (i + 1)); [all[i], all[j]] = [all[j], all[i]]; }
      for (let i = 0; i < all.length; i++) this.grid[Math.floor(i / N)][i % N] = all[i];
      if (!this.hasMatch() && this.hasMoves()) return true;
    }
    this.fillFresh();
    return false;
  }

  iceLeft() { return this.ice.flat().reduce((s, x) => s + x, 0); }
}

/** Points d'une étape de résolution. */
export function scoreStep(res, cascade) {
  let base = res.cleared.length * 10 + res.parades * 30 + res.pairs.length * 60 + res.created.length * 40 + res.triggers.length * 50;
  return base * Math.min(cascade, 6);
}
