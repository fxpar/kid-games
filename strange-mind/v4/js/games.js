// Les 9 mini-jeux (tirés des niveaux de la v1). Chacun fabrique des défis à l'infini.
//
// gen(niveau 1..4, R, mode 'faire'|'prevoir') renvoie un défi :
// { mode, prompt, scene(ctx,w,h,now,anim), ...
//   choix   : options: [dessin(ctx,w,h)], answer: i | { any:[i,j] } | { all:[i,j] }
//   action  : controls: [{label, act()}], tap(x,y,w,h), check(), optimal, maxActions, solve() }
// anim ∈ [0,1] : animation de « révélation » après une réponse en mode prévoir.

import * as D from './draw.js';
const { n360, ease, drawGlyph } = D;

export function makeR(rand) {
  return {
    f: rand,
    int: (n) => Math.floor(rand() * n),
    pick: (a) => a[Math.floor(rand() * a.length)],
    shuffle: (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
  };
}

/** Choisit n valeurs distinctes dont `good`, mélangées. Renvoie {vals, answer}. */
function choices(R, good, pool, n, key = (x) => JSON.stringify(x)) {
  const seen = new Set([key(good)]);
  const out = [good];
  for (const p of R.shuffle(pool)) {
    if (out.length >= n) break;
    if (!seen.has(key(p))) { seen.add(key(p)); out.push(p); }
  }
  const vals = R.shuffle(out);
  return { vals, answer: vals.findIndex((v) => key(v) === key(good)) };
}
const dolphinCard = (a, m = false, g = 'dolphin') => (ctx, w, h) => drawGlyph(ctx, g, w / 2, h / 2, Math.min(w, h) * 0.36, a, m);
const multiples = (step) => Array.from({ length: 360 / step }, (_, i) => i * step);

// =====================================================================================
const dauphin = {
  id: 'dauphin', name: 'Le dauphin a faim', icon: '🐬',
  gen(lvl, R, mode) {
    const step = lvl >= 4 ? 45 : 90, n = 360 / step;
    const start = R.int(n) * step;
    if (mode === 'faire') {
      const k = lvl === 1 ? R.pick([1, n - 1]) : 1 + R.int(n - 1);
      const target = n360(start + k * step);
      const st = { dir: start };
      const optimal = Math.min(k, n - k);
      return {
        mode, prompt: 'Tourne le dauphin vers le poisson !', optimal, maxActions: optimal + 3,
        scene: (ctx, w, h) => D.sea(ctx, w, h, { dir: st.dir, target, step }),
        controls: [{ label: '↺', act: () => { st.dir = n360(st.dir + step); } }, { label: '↻', act: () => { st.dir = n360(st.dir - step); } }],
        check: () => st.dir === target, solve: () => { st.dir = target; },
      };
    }
    const len = lvl === 1 ? 1 : lvl === 2 ? 2 : 2 + R.int(2);
    const sign = R.pick([1, -1]);
    const seq = Array.from({ length: len }, () => (lvl <= 2 ? sign : R.pick([1, -1])));
    const sum = seq.reduce((a, b) => a + b, 0);
    const result = n360(start + sum * step);
    const { vals, answer } = choices(R, result, [start, n360(start - sum * step), n360(result + 180), ...multiples(step)], 4);
    return {
      mode, prompt: 'Où va regarder le dauphin ?', answer,
      scene: (ctx, w, h, now, anim) => {
        D.turns(ctx, seq, w / 2, h * 0.08, Math.min(h * 0.12, 44));
        ctx.save(); ctx.translate(0, h * 0.16);
        D.sea(ctx, w, h * 0.84, { dir: anim == null ? start : start + sum * step * ease(anim), step });
        ctx.restore();
      },
      options: vals.map((a) => dolphinCard(a)),
    };
  },
};

// =====================================================================================
const unsens = {
  id: 'unsens', name: 'Le tour à l’envers', icon: '↩️',
  gen(lvl, R, mode) {
    const step = lvl >= 4 ? 45 : 90, n = 360 / step;
    if (mode === 'faire') {
      const start = R.int(n) * step;
      const k = lvl === 1 ? 1 + R.int(2) : lvl === 2 ? 3 : lvl === 3 ? 1 + R.int(3) : 5 + R.int(3);
      const target = n360(start + k * step);
      const st = { dir: start };
      return {
        mode, prompt: 'Un seul sens ! Tourne vers le poisson.', optimal: k, maxActions: k,
        scene: (ctx, w, h) => D.sea(ctx, w, h, { dir: st.dir, target, step }),
        controls: [{ label: '↺', act: () => { st.dir = n360(st.dir + step); } }],
        check: () => st.dir === target, solve: () => { st.dir = target; },
      };
    }
    // « lequel fait pareil ? » : suites de tours équivalentes (quarts de tour)
    const pools = [
      [[1, 1, 1], [-1]], [[-1, -1, -1], [1]], [[1, 1, 1, 1], []], [[1, -1], []], [[-1, -1], [1, 1]], [[1, 1], [-1, -1]],
      [[1, 1, 1, 1, 1], [1]], [[-1, -1, -1, -1, -1], [-1]], [[1, 1, -1], [1]],
    ];
    const easy = lvl <= 2 ? pools.slice(0, 4) : pools;
    const [q, good] = R.pick(easy);
    const all = [[1], [-1], [], [1, 1]];
    const { vals, answer } = choices(R, good, all, 3, (s) => String(n360(s.reduce((a, b) => a + b, 0) * 90)));
    const sum = q.reduce((a, b) => a + b, 0);
    return {
      mode, prompt: 'Lequel fait pareil ?', answer,
      scene: (ctx, w, h, now, anim) => {
        const t = anim == null ? 0 : ease(anim);
        drawGlyph(ctx, 'dolphin', w / 2, h * 0.4, Math.min(w, h) * 0.26, sum * 90 * t);
        D.turns(ctx, q, w / 2, h * 0.85, Math.min(h * 0.16, 54));
      },
      options: vals.map((s) => (ctx, w, h) => D.turns(ctx, s, w / 2, h / 2, Math.min(h * 0.38, w / (s.length + 1) * 0.9))),
    };
  },
};

// =====================================================================================
const lapins = {
  id: 'lapins', name: 'Lapins debout, tête en bas', icon: '🐰',
  gen(lvl, R, mode) {
    const N = lvl <= 2 ? 3 : lvl === 3 ? 4 : 5;
    const allowed = lvl === 1 ? [1, 0] : [1, -1, 0];
    const vals = Array.from({ length: N }, () => R.pick(allowed));
    const sum = () => vals.reduce((a, b) => a + b, 0);
    const lay = (w, h) => {
      const s = Math.min((w * 0.9) / N, h * 0.42);
      return vals.map((_, i) => [w / 2 + (i - (N - 1) / 2) * s * 1.05, h * 0.3, s * 0.92]);
    };
    const drawTiles = (ctx, w, h) => {
      lay(w, h).forEach(([x, y, s], i) => {
        if (i) D.text(ctx, '+', x - s * 0.53, y, s * 0.3, '#7b6fa8');
        D.numberTile(ctx, x, y, s * 0.9, vals[i]);
      });
    };
    if (mode === 'faire') {
      let target;
      do { target = Array.from({ length: N }, () => R.pick(allowed)).reduce((a, b) => a + b, 0); } while (target === sum());
      const next = (v) => (lvl === 1 ? (v === 1 ? 0 : 1) : v === 1 ? -1 : v === -1 ? 0 : 1);
      return {
        mode, prompt: 'Amène la coccinelle sur le drapeau !', maxActions: N * 3,
        scene: (ctx, w, h) => {
          drawTiles(ctx, w, h);
          D.numberLine(ctx, w * 0.06, w * 0.94, h * 0.78, { value: sum(), target, min: -N, max: N, size: Math.min(18, w / (2 * N + 2) * 0.45) });
        },
        tap: (x, y, w, h) => {
          const hit = lay(w, h).findIndex(([cx, cy, s]) => Math.abs(x - cx) < s / 2 && Math.abs(y - cy) < s / 2);
          if (hit < 0) return false;
          vals[hit] = next(vals[hit]);
          return true;
        },
        check: () => sum() === target,
        solve: () => {
          // on change le moins de tuiles possible pour atteindre la cible
          for (let i = 0; i < N && sum() !== target; i++) {
            const need = target - (sum() - vals[i]);
            const best = allowed.reduce((b, v) => (Math.abs(need - v) < Math.abs(need - b) ? v : b), vals[i]);
            vals[i] = best;
          }
        },
      };
    }
    const good = sum();
    const { vals: opts, answer } = choices(R, good, [good + 1, good - 1, good + 2, good - 2, -good], 3);
    return {
      mode, prompt: 'Où va la coccinelle ?', answer,
      scene: (ctx, w, h, now, anim) => {
        drawTiles(ctx, w, h);
        if (anim != null) D.numberLine(ctx, w * 0.06, w * 0.94, h * 0.78, { value: Math.round(good * ease(anim)), min: -N, max: N, size: Math.min(18, w / (2 * N + 2) * 0.45) });
      },
      options: opts.map((v) => (ctx, w, h) => {
        drawGlyph(ctx, 'ladybug', w / 2, h * 0.3, Math.min(w, h) * 0.13, 90);
        D.text(ctx, (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v), w / 2, h * 0.64, Math.min(w, h) * 0.42, v === 0 ? '#3d2c6b' : v > 0 ? '#c9184a' : '#1d4e89');
      }),
    };
  },
};

// =====================================================================================
const machine = {
  id: 'machine', name: 'La machine à tourner', icon: '✖️',
  gen(lvl, R, mode) {
    const step = lvl >= 3 ? 45 : 90;
    const angles = multiples(step);
    const a = R.pick(angles), b = R.pick(lvl === 1 ? [90, 180, 270] : angles.filter((x) => x));
    const res = n360(a + b);
    if (mode === 'faire') {
      // A × ? = cible
      const { vals, answer } = choices(R, b, [n360(-b), n360(b + 180), n360(res), ...angles], 4);
      return {
        mode, prompt: 'Quel dauphin met-on dans la machine ?', answer,
        scene: (ctx, w, h, now, anim) => D.row(ctx, w, h, [{ g: 'dolphin', a }, '×', anim == null ? { q: true, box: true } : { g: 'dolphin', a: b, box: true }, '=', { g: 'dolphin', a: res, big: true }]),
        options: vals.map((x) => dolphinCard(x)),
      };
    }
    const { vals, answer } = choices(R, res, [n360(a - b), a, b, n360(res + 180), ...angles], 4);
    return {
      mode, prompt: 'Que sort la machine ?', answer,
      scene: (ctx, w, h, now, anim) => D.row(ctx, w, h, [{ g: 'dolphin', a }, '×', { g: 'dolphin', a: b }, '=',
        anim == null ? { q: true, box: true, big: true } : { g: 'dolphin', a: a + b * ease(anim), box: true, big: true }]),
      options: vals.map((x) => dolphinCard(x)),
    };
  },
};

// =====================================================================================
const racine = {
  id: 'racine', name: 'La racine magique', icon: '🛑',
  gen(lvl, R, mode) {
    const step = lvl === 1 ? 90 : 45;
    const angles = multiples(step);
    if (mode === 'faire') {
      // ? × ? = cible : deux réponses existent toujours
      const target = lvl === 1 ? R.pick([0, 180]) : R.pick(multiples(90));
      const sols = angles.filter((x) => n360(2 * x) === target);
      const others = R.shuffle(angles.filter((x) => !sols.includes(x)));
      const both = lvl >= 3;
      const opts = R.shuffle([...(both ? sols : [R.pick(sols)]), ...others.slice(0, both ? 2 : 3)]);
      const good = opts.map((x, i) => (sols.includes(x) ? i : -1)).filter((i) => i >= 0);
      return {
        mode, prompt: both ? 'Trouve les DEUX dauphins magiques !' : 'Quel dauphin, fois lui-même, donne celui-là ?',
        answer: both ? { all: good } : { any: good },
        scene: (ctx, w, h) => D.row(ctx, w, h, [{ q: true, box: true }, '×', { q: true, box: true }, '=', { g: 'dolphin', a: target, big: true }]),
        options: opts.map((x) => dolphinCard(x)),
      };
    }
    const a = R.pick(angles), res = n360(2 * a);
    const { vals, answer } = choices(R, res, [a, n360(a + 180), n360(res + 180), n360(res + 90), ...angles], 4);
    return {
      mode, prompt: 'Le dauphin fois lui-même, ça donne ?', answer,
      scene: (ctx, w, h, now, anim) => D.row(ctx, w, h, [{ g: 'dolphin', a }, '×', { g: 'dolphin', a }, '=',
        anim == null ? { q: true, box: true, big: true } : { g: 'dolphin', a: a + a * ease(anim), box: true, big: true }]),
      options: vals.map((x) => dolphinCard(x)),
    };
  },
};

// =====================================================================================
const MATS = {
  1: [[[1, 0], [0, 1]], [[-1, 0], [0, 1]], [[1, 0], [0, -1]], [[-1, 0], [0, -1]]],
  2: [[[0, -1], [1, 0]], [[0, 1], [-1, 0]]],
  3: [[[0, 1], [1, 0]], [[0, -1], [-1, 0]]],
  4: [[[1, 1], [0, 1]], [[1, 0], [1, 1]], [[1, -1], [0, 1]], [[1, 0], [-1, 1]]],
};
const matPool = (lvl) => [1, 2, 3, 4].filter((k) => k <= lvl).flatMap((k) => MATS[k]);
const sameM = (A, B) => A.every((r, i) => r.every((x, j) => x === B[i][j]));

const jardin = {
  id: 'jardin', name: 'La grille qui transforme', icon: '🔢',
  gen(lvl, R, mode) {
    const pool = matPool(lvl);
    const M = R.pick(pool);
    if (mode === 'faire') {
      let start; do { start = R.pick(matPool(Math.max(lvl, 2))); } while (sameM(start, M));
      const cur = start.map((r) => r.slice());
      const lay = (w, h) => { const s = Math.min(w * 0.2, h * 0.3); return { s, gx: w * 0.27, gy: h / 2 }; };
      return {
        mode, prompt: 'Refais le jardin en pointillés !', maxActions: 14,
        scene: (ctx, w, h) => {
          const { s, gx, gy } = lay(w, h);
          D.matrixGrid(ctx, gx, gy, s, cur);
          D.gardenFit(ctx, w * 0.73, h / 2, Math.min(w * 0.46, h * 0.95), cur, M);
        },
        tap: (x, y, w, h) => {
          const { s, gx, gy } = lay(w, h);
          const pos = [[gx - s * 0.55, gy - s * 0.55], [gx + s * 0.55, gy - s * 0.55], [gx - s * 0.55, gy + s * 0.55], [gx + s * 0.55, gy + s * 0.55]];
          const i = pos.findIndex(([px, py]) => Math.abs(x - px) < s * 0.5 && Math.abs(y - py) < s * 0.5);
          if (i < 0) return false;
          const r = i >> 1, c = i & 1, v = cur[r][c];
          cur[r][c] = v === 1 ? -1 : v === -1 ? 0 : 1;
          return true;
        },
        check: () => sameM(cur, M),
        solve: () => { M.forEach((r, i) => r.forEach((x, j) => { cur[i][j] = x; })); },
      };
    }
    const { vals, answer } = choices(R, M, pool.concat(MATS[1]), 3, (A) => A.flat().join(','));
    return {
      mode, prompt: 'Quel jardin sort de la grille ?', answer,
      scene: (ctx, w, h, now, anim) => {
        const s = Math.min(w * 0.2, h * 0.3);
        D.matrixGrid(ctx, w * 0.27, h / 2, s, M);
        const size = Math.min(w * 0.46, h * 0.95);
        D.gardenFit(ctx, w * 0.73, h / 2, size, anim == null ? D.I2 : D.lerpM(D.I2, M, ease(anim)), M.flat().some((x) => Math.abs(x) > 0) ? null : null);
        if (anim == null) D.text(ctx, '?', w * 0.73 + size * 0.3, h / 2 - size * 0.3, size * 0.18, '#c9b8ea');
      },
      options: vals.map((A) => (ctx, w, h) => D.gardenFit(ctx, w / 2, h / 2, Math.min(w, h) * 0.95, A, null, true)),
    };
  },
};

// =====================================================================================
const det = {
  id: 'det', name: 'Le jardin qui disparaît', icon: '🪞',
  gen(lvl, R) {
    const flat = [[[1, 1], [1, 1]], [[1, 0], [0, 0]], [[0, 0], [1, 1]], [[1, -1], [-1, 1]], [[0, 1], [0, 1]], [[1, 1], [0, 0]]];
    const big = [[[1, -1], [1, 1]], [[1, 1], [-1, 1]], [[1, 1], [1, -1]], [[-1, 1], [1, 1]]];
    const pool = [...matPool(Math.min(lvl + 1, 4)), ...flat, ...(lvl >= 3 ? big : [])];
    const M = R.pick(pool), d = D.det2(M);
    const answer = d > 0 ? 0 : d < 0 ? 1 : 2;
    const icon = (s) => (ctx, w, h) => D.text(ctx, s, w / 2, h / 2, Math.min(w, h) * 0.55);
    return {
      mode: 'prevoir', prompt: 'Jardin normal, dans le miroir, ou écrasé ?', answer, fixedOrder: true,
      scene: (ctx, w, h, now, anim) => {
        // le jardin se déforme depuis le jardin normal : on voit s'il se retourne ou s'écrase
        const t = anim == null ? Math.min(1, ((now / 1000) % 3) / 1.5) : 1;
        D.gardenFit(ctx, w / 2, h / 2, Math.min(w, h) * 0.95, D.lerpM(D.I2, M, ease(t)), M);
      },
      options: [icon('🙂'), icon('🪞'), icon('💨')],
    };
  },
};

// =====================================================================================
const reflect = (dir, axis) => n360(2 * axis - dir);
const miroirs = {
  id: 'miroirs', name: 'Deux miroirs font un tour', icon: '✨',
  gen(lvl, R, mode) {
    const d0 = R.pick([0, 90, 180, 270]);
    const axes = [0, 45, 90, 135];
    if (lvl === 1 || (lvl === 2 && mode === 'prevoir')) {
      const a = R.pick(axes), res = reflect(d0, a);
      const opts = [{ a: res, m: true }, { a: res, m: false }, { a: d0, m: true }, { a: n360(res + 180), m: true }];
      const { vals, answer } = choices(R, opts[0], opts.slice(1), 3, (o) => o.a + '' + o.m);
      return {
        mode: 'prevoir', prompt: 'Que voit-on dans le miroir ?', answer,
        scene: (ctx, w, h, now, anim) => D.row(ctx, w, h, [{ g: 'dolphin', a: d0 }, '→', { g: 'mirror', a }, '→',
          anim == null ? { q: true, box: true } : { g: 'dolphin', a: res, m: true, box: true, alpha: ease(anim) }]),
        options: vals.map((o) => dolphinCard(o.a, o.m)),
      };
    }
    if (mode === 'faire') {
      const two = lvl >= 3;
      const st = { a: R.pick(axes), b: R.pick(axes) };
      const out = () => (two ? reflect(reflect(d0, st.a), st.b) : reflect(d0, st.a));
      let target;
      do { target = two ? R.pick([0, 90, 180, 270]) : reflect(d0, R.pick(axes)); } while (target === out());
      const controls = [{ label: two ? '↺ 1' : '↺', act: () => { st.a = (st.a + 45) % 180; } }];
      if (two) controls.push({ label: '↺ 2', act: () => { st.b = (st.b + 45) % 180; } });
      return {
        mode, prompt: two ? 'Tourne les miroirs : le dauphin doit regarder comme le fantôme !' : 'Tourne le miroir !', maxActions: 9,
        scene: (ctx, w, h) => {
          const items = [{ g: 'dolphin', a: d0 }, { g: 'mirror', a: st.a }];
          if (two) items.push({ g: 'dolphin', a: reflect(d0, st.a), m: true, alpha: 0.6 }, { g: 'mirror', a: st.b });
          items.push({ g: 'dolphin', a: out(), m: !two, box: true, ghost: { g: 'dolphin', a: target, m: !two } });
          D.row(ctx, w, h, items);
        },
        controls,
        check: () => out() === target,
        solve: () => {
          for (const a of axes) for (const b of two ? axes : [st.b]) {
            const o = two ? reflect(reflect(d0, a), b) : reflect(d0, a);
            if (o === target) { st.a = a; st.b = b; return; }
          }
        },
      };
    }
    // prévoir avec deux miroirs
    const a = R.pick(axes), b = R.pick(axes);
    const res = reflect(reflect(d0, a), b);
    const { vals, answer } = choices(R, res, [d0, n360(res + 180), n360(res + 90), reflect(d0, a), 0, 90, 180, 270], 4);
    return {
      mode: 'prevoir', prompt: 'Après les deux miroirs, où regarde le dauphin ?', answer,
      scene: (ctx, w, h, now, anim) => D.row(ctx, w, h, [{ g: 'dolphin', a: d0 }, { g: 'mirror', a }, { g: 'dolphin', a: reflect(d0, a), m: true, alpha: 0.5 }, { g: 'mirror', a: b },
        anim == null ? { q: true, box: true } : { g: 'dolphin', a: res, box: true, alpha: ease(anim) }]),
      options: vals.map((x) => dolphinCard(x)),
    };
  },
};

// =====================================================================================
const PRODUCT = { 0: { g: 'bunny', a: 0 }, 180: { g: 'bunny', a: 180 }, 90: { g: 'whirl', m: false }, 270: { g: 'whirl', m: true } };
const tourbillon = {
  id: 'tourbillon', name: 'Le tourbillon secret', icon: '🌀',
  gen(lvl, R, mode) {
    const a = R.pick([0, 90, 180, 270]);
    if (mode === 'faire' && lvl >= 3) {
      let targetDiff = R.pick([0, 90, 180, 270]);
      const st = { b: R.pick([0, 90, 180, 270]) };
      if (n360(st.b - a) === targetDiff) st.b = n360(st.b + 90);
      const T = PRODUCT[targetDiff];
      return {
        mode, prompt: 'Tourne la flèche verte pour obtenir ce résultat !', maxActions: 5,
        scene: (ctx, w, h) => {
          const r = PRODUCT[n360(st.b - a)];
          D.row(ctx, w, h, [{ g: 'arrow', a }, '×', { g: 'arrowGreen', a: st.b }, '=', { ...r, big: true, box: true, ghost: T }]);
        },
        controls: [{ label: '↺', act: () => { st.b = n360(st.b + 90); } }, { label: '↻', act: () => { st.b = n360(st.b - 90); } }],
        check: () => n360(st.b - a) === targetDiff,
        solve: () => { st.b = n360(a + targetDiff); },
      };
    }
    const diffs = lvl === 1 ? [0, 180] : [0, 90, 180, 270];
    const diff = R.pick(diffs);
    const b = n360(a + diff);
    const keys = [0, 180, 90, 270];
    const opts = lvl === 1 ? [0, 180] : keys;
    return {
      mode: 'prevoir', prompt: 'Flèche rose fois flèche verte, ça donne ?', answer: opts.indexOf(diff), fixedOrder: true,
      scene: (ctx, w, h, now, anim) => D.row(ctx, w, h, [{ g: 'arrow', a }, '×', { g: 'arrowGreen', a: b }, '=',
        anim == null ? { q: true, box: true, big: true } : { ...PRODUCT[diff], box: true, big: true, alpha: ease(anim) }]),
      options: opts.map((k) => (ctx, w, h) => drawGlyph(ctx, PRODUCT[k].g, w / 2, h / 2, Math.min(w, h) * 0.36, PRODUCT[k].a || 0, !!PRODUCT[k].m)),
    };
  },
};

export const GAMES = [dauphin, unsens, lapins, machine, racine, jardin, det, miroirs, tourbillon];
