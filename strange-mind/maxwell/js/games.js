// Le vent invisible : 9 mini-jeux qui préparent aux équations de Maxwell (algèbre de Hestenes : ∇F = J).
// Chacun fabrique des défis à l'infini, au format des défis éclair (v4) :
//
// gen(niveau 1..4, R, mode 'faire'|'prevoir') renvoie un défi :
// { mode, prompt, scene(ctx,w,h,now,anim), ...
//   choix   : options: [dessin(ctx,w,h)], answer: i | { any:[i,j] } | { all:[i,j] }
//   action  : controls: [{label, act()}], tap(x,y,w,h), check(), fail(), optimal, maxActions, solve() }
// anim ∈ [0,1] : « révélation » après la réponse (null avant).
//
// Le fil rouge (voir README) : flèche ∧ flèche = tapis qui tourne (1) ; un vent = une flèche partout (2) ;
// ce qui SORT d'un endroit (3, divergence) ; ce qui TOURNE sur place (4, rotationnel) ; le tour d'un lac
// compte les tourbillons dedans (5, Stokes) ; un courant fait tourner le vent magnétique (6, Ampère) ;
// le vent d'aimant ne sort de nulle part (7, ∇·B = 0) ; un aimant qui BOUGE fait tourner le courant (8, Faraday) ;
// la loupe magique lit d'un coup « ce qui sort + ce qui tourne » (9, ∇F = J).

import * as D from './draw.js';
const { ease, n360, Q, W, U, SH, PINK } = D;

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

const rnd = (R, a, b) => a + R.f() * (b - a);
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const sgn = (x, thr = 0) => (x > thr ? 1 : x < -thr ? -1 : 0);
const RAD = Math.PI / 180;
/** n points du plateau espacés d'au moins minD (et loin des points `avoid`). */
function spots(R, n, minD, box = 0.68, avoid = []) {
  for (let attempt = 0; attempt < 80; attempt++) {
    const out = [];
    for (let t = 0; out.length < n && t < 400; t++) {
      const p = [rnd(R, -box, box), rnd(R, -box, box)];
      if (out.concat(avoid).every((q) => dist(p, q) >= minD)) out.push(p);
    }
    if (out.length === n) return out;
  }
  throw new Error('spots');
}
const randDir = (R, m = 0.8) => { const a = R.int(8) * 45 * RAD; return U(Math.cos(a) * m, Math.sin(a) * m); };
/** Secondes écoulées depuis le début de la révélation (null avant). */
function clock(st, now, anim) {
  if (anim == null) { st.r0 = null; return null; }
  st.r0 ??= now;
  return (now - st.r0) / 1000;
}
/** Essaie gen() jusqu'à ce qu'il renvoie autre chose que null. */
function retry(fn, n = 200) { for (let i = 0; i < n; i++) { const r = fn(); if (r) return r; } throw new Error('retry'); }
const hitIndex = (pts, p, r) => {
  let best = -1, bd = r;
  pts.forEach((q, i) => { const d = dist(q, p); if (d < bd) { bd = d; best = i; } });
  return best;
};
const spinCard = (sign, draw) => (ctx, w, h) => {
  const r = Math.min(w, h);
  draw(ctx, w / 2, h / 2, r * 0.26);
  if (sign) D.spin(ctx, w / 2, h / 2, r * 0.36, sign, null, Math.max(3, r * 0.05));
  else D.text(ctx, '💤', w / 2 + r * 0.3, h / 2 - r * 0.3, r * 0.22);
};
/** Le « modèle » à imiter : à droite du plateau s'il y a la place, sinon dans son coin haut-droit. */
const modelBox = (ctx, v, draw) => {
  const room = v.cx - v.s; // marge libre de chaque côté du plateau
  const s = room > v.s * 0.5 ? Math.min(room * 0.85, v.s * 0.6) : v.s * 0.42;
  const x = room > v.s * 0.5 ? v.cx + v.s + room / 2 : v.cx + v.s - s * 0.55, y = v.cy - v.s + s * 0.55;
  ctx.save(); ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.strokeStyle = 'rgba(123,44,191,.6)'; ctx.lineWidth = 2; ctx.setLineDash([6, 5]);
  D.roundRect(ctx, x - s / 2, y - s / 2, s, s, s * 0.18); ctx.fill(); ctx.stroke(); ctx.restore();
  ctx.save(); ctx.translate(x - s / 2, y - s / 2); draw(ctx, s, s); ctx.restore();
};

// =====================================================================================
// 1. Flèche puis flèche : le tapis qui tourne (produit extérieur a∧b, orientation d'un bivecteur)
const wsign = (a, b) => sgn(Math.sin((b - a) * RAD), 1e-6);
const ORI = [1, -1, 0]; // cartes : ↺, ↻, tout plat

function wedgeScene(ctx, w, h, a, b, show, t = null) {
  const v = D.view(w, h), L = 0.62;
  const A = [Math.cos(a * RAD) * L, Math.sin(a * RAD) * L], B = [Math.cos(b * RAD) * L, Math.sin(b * RAD) * L];
  const o = [-(A[0] + B[0]) / 2, -(A[1] + B[1]) / 2];
  const O = [v.X(o[0]), v.Y(o[1])], Ap = [A[0] * v.s, -A[1] * v.s], Bp = [B[0] * v.s, -B[1] * v.s];
  D.wedgeTile(ctx, O, Ap, Bp, wsign(a, b), show);
  const lw = Math.max(4, v.s * 0.045);
  D.arrowPx(ctx, O[0], O[1], Ap[0], Ap[1], PINK, lw);
  D.arrowPx(ctx, O[0] + Ap[0], O[1] + Ap[1], Bp[0], Bp[1], '#2bb673', lw);
  const lab = (x, y, n, col) => { ctx.save(); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, v.s * 0.07, 0, 7); ctx.fill(); ctx.restore(); D.text(ctx, n, x, y + 1, v.s * 0.1, '#fff'); };
  lab(O[0] + Ap[0] * 0.5 - Ap[1] * 0.16, O[1] + Ap[1] * 0.5 + Ap[0] * 0.16, '1', PINK);
  lab(O[0] + Ap[0] + Bp[0] * 0.5 - Bp[1] * 0.16, O[1] + Ap[1] + Bp[1] * 0.5 + Bp[0] * 0.16, '2', '#2bb673');
  if (t != null) { // la coccinelle marche sur 1 puis sur 2
    const k = Math.min(1, t / 1.4), p = k < 0.5 ? [O[0] + Ap[0] * k * 2, O[1] + Ap[1] * k * 2] : [O[0] + Ap[0] + Bp[0] * (k - 0.5) * 2, O[1] + Ap[1] + Bp[1] * (k - 0.5) * 2];
    const d = k < 0.5 ? a : b;
    D.drawGlyph(ctx, 'ladybug', p[0], p[1], v.s * 0.08, d);
  }
  return v;
}

const tapis = {
  id: 'tapis', name: 'Flèche puis flèche', icon: '🟪',
  gen(lvl, R, mode) {
    if (mode === 'faire') {
      const step = lvl <= 2 ? 90 : 45, n = 360 / step;
      const a = R.int(n) * step;
      const T = lvl === 1 || lvl === 4 ? R.pick([1, -1]) : R.pick([1, -1, 0]);
      const ok = (b) => wsign(a, b) === T && (lvl < 4 || n360(b - a) === (T > 0 ? 90 : 270));
      const st = { b: 0 };
      do { st.b = R.int(n) * step; } while (ok(st.b));
      let optimal = 1;
      while (!ok(st.b + optimal * step) && !ok(st.b - optimal * step)) optimal++;
      return {
        mode, optimal, maxActions: optimal + 4,
        prompt: lvl === 4 ? 'Fais le plus GRAND tapis qui tourne comme le modèle !' : 'Tourne la flèche 2 : le tapis doit tourner comme le modèle !',
        scene: (ctx, w, h, now, anim) => {
          const v = wedgeScene(ctx, w, h, a, st.b, 1);
          modelBox(ctx, v, (c, ww, hh) => D.tileCard(c, ww, hh, T));
        },
        controls: [{ label: '↺', act: () => { st.b = n360(st.b + step); } }, { label: '↻', act: () => { st.b = n360(st.b - step); } }],
        check: () => ok(st.b),
        solve: () => { for (let k = 0; k < n; k++) if (ok(k * step)) { st.b = k * step; return; } },
      };
    }
    const step = lvl === 4 ? 30 : lvl === 3 ? 45 : 90;
    const diffs = lvl === 1 ? [90, 270] : Array.from({ length: 360 / step }, (_, i) => i * step);
    const a = R.int(360 / step) * step, b = n360(a + R.pick(diffs));
    const s = wsign(a, b), st = {};
    return {
      mode, prompt: 'Flèche 1 puis flèche 2 : le tapis tourne dans quel sens ?', answer: ORI.indexOf(s), fixedOrder: true,
      scene: (ctx, w, h, now, anim) => { const t = clock(st, now, anim); wedgeScene(ctx, w, h, a, b, t == null ? 0 : Math.min(1, t / 1.4), t); },
      options: ORI.map((k) => (ctx, w, h) => D.tileCard(ctx, w, h, k)),
    };
  },
};

// =====================================================================================
// 2. La feuille dans le vent : un vent = une flèche en chaque point (champ de vecteurs)
function windFor(R, lvl) {
  if (lvl === 1) return [randDir(R)];
  if (lvl === 2) {
    return R.pick([
      () => [W(rnd(R, -0.3, 0.3), rnd(R, -0.3, 0.3), R.pick([1, -1]), 0.15), randDir(R, 0.5)],
      () => { const ax = R.pick(['x', 'y']); return [SH(R.pick([1.2, -1.2]), ax), ax === 'x' ? U(0, R.pick([0.4, -0.4])) : U(R.pick([0.4, -0.4]), 0)]; },
      () => [Q(rnd(R, -0.4, 0.4), rnd(R, -0.4, 0.4), 1)],
    ])();
  }
  if (lvl === 3) { const [p1, p2] = spots(R, 2, 0.8, 0.6); return [Q(...p1, 1), Q(...p2, -1)]; }
  const ps = spots(R, 2 + R.int(2), 0.6, 0.6);
  const th = ps.map((p) => (R.f() < 0.5 ? Q(...p, R.pick([1, -1])) : W(...p, R.pick([1, -1]), 0.15)));
  if (R.f() < 0.6) th.push(randDir(R, 0.4));
  return th;
}
function trace(f, things, p, step = 0.02, max = 400) {
  const pts = [p.slice()];
  let [x, y] = p;
  for (let i = 0; i < max; i++) {
    const v1 = f(x, y), m1 = Math.hypot(...v1);
    if (m1 < 1e-4) return { pts, end: 'stuck' };
    const v2 = f(x + (v1[0] / m1) * step * 0.5, y + (v1[1] / m1) * step * 0.5), m2 = Math.hypot(...v2);
    if (m2 < 1e-4) return { pts, end: 'stuck' };
    x += (v2[0] / m2) * step; y += (v2[1] / m2) * step;
    pts.push([x, y]);
    if (Math.abs(x) > 0.97 || Math.abs(y) > 0.97) return { pts, end: 'out' };
    if (things.some((t) => t.k === 'q' && t.q < 0 && Math.hypot(x - t.x, y - t.y) < t.c)) return { pts, end: 'sink' };
    if (i > 40 && dist([x, y], p) < step * 1.5) return { pts, end: 'loop' };
  }
  return { pts, end: 'long' };
}
const clampBox = (p, b = 0.86) => [D.clamp(p[0], -b, b), D.clamp(p[1], -b, b)];
const pathDist = (pts, q) => Math.min(...pts.map((p) => dist(p, q)));
/** Dessine la feuille qui suit le chemin, t secondes après son départ. */
function leafOn(ctx, v, pts, t, alpha = 1) {
  const k = Math.min(pts.length - 1, Math.floor(Math.max(0, t) * 70));
  ctx.save(); ctx.globalAlpha = 0.7 * alpha; ctx.strokeStyle = '#2bb673'; ctx.lineWidth = 3; ctx.setLineDash([5, 6]);
  ctx.beginPath(); pts.slice(0, k + 1).forEach((p, i) => (i ? ctx.lineTo(v.X(p[0]), v.Y(p[1])) : ctx.moveTo(v.X(p[0]), v.Y(p[1])))); ctx.stroke();
  ctx.restore();
  const p = pts[k];
  ctx.save(); ctx.globalAlpha = alpha; D.drawGlyph(ctx, '🍃', v.X(p[0]), v.Y(p[1]), v.s * 0.08); ctx.restore();
}

const feuille = {
  id: 'feuille', name: 'La feuille dans le vent', icon: '🍃',
  gen(lvl, R, mode) {
    const { things, f, start, tr } = retry(() => {
      const things = windFor(R, lvl), f = D.fieldOf(things);
      for (let k = 0; k < 30; k++) {
        const start = [rnd(R, -0.8, 0.8), rnd(R, -0.8, 0.8)];
        if (things.some((t) => t.x != null && dist(start, [t.x, t.y]) < 0.25)) continue;
        const tr = trace(f, things, start);
        const end = tr.pts[tr.pts.length - 1];
        if ((tr.end === 'out' || tr.end === 'sink') && tr.pts.length * 0.02 > 0.7 && dist(end, start) > 0.6) return { things, f, start, tr };
      }
      return null;
    });
    const flow = new D.Flow(things);
    const E = clampBox(tr.pts[tr.pts.length - 1]);
    const basket = (ctx, v, p, ring) => {
      if (ring) { ctx.save(); ctx.strokeStyle = ring; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(v.X(p[0]), v.Y(p[1]), v.s * 0.13, 0, 7); ctx.stroke(); ctx.restore(); }
      D.drawGlyph(ctx, '🧺', v.X(p[0]), v.Y(p[1]), v.s * 0.09);
    };
    if (mode === 'faire') {
      const st = { tries: [], ok: false };
      const tryFrom = (p, gold = false) => {
        const t = trace(f, things, p);
        st.tries.push({ pts: t.pts, t0: performance.now(), gold });
        return pathDist(t.pts, E) < 0.15;
      };
      return {
        mode, prompt: 'Lâche la feuille pour qu’elle arrive dans le panier !', maxActions: 3,
        scene: (ctx, w, h, now) => {
          const v = D.view(w, h);
          D.windBoard(ctx, v, flow, now);
          basket(ctx, v, E, st.ok ? '#2a9d8f' : null);
          st.tries.forEach((tt, i) => leafOn(ctx, v, tt.pts, (now - tt.t0) / 1000, i === st.tries.length - 1 ? 1 : 0.35));
        },
        tap: (x, y, w, h) => {
          const p = D.view(w, h).inv(x, y);
          if (Math.abs(p[0]) > 0.97 || Math.abs(p[1]) > 0.97 || dist(p, E) < 0.25) return false;
          if (tryFrom(p)) st.ok = true;
          return true;
        },
        check: () => st.ok,
        solve: () => { tryFrom(start, true); },
      };
    }
    // prévoir : dans quel panier ?
    const bs = [E];
    for (let k = 0; k < 300 && bs.length < (lvl >= 3 ? 4 : 3); k++) {
      const p = [rnd(R, -0.86, 0.86), rnd(R, -0.86, 0.86)];
      if (bs.every((b) => dist(b, p) > 0.5) && pathDist(tr.pts, p) > 0.28 && dist(p, start) > 0.3) bs.push(p);
    }
    const st = { pick: null };
    return {
      mode: 'prevoir', prompt: 'Dans quel panier tombera la feuille ?', maxActions: 1,
      scene: (ctx, w, h, now, anim) => {
        const v = D.view(w, h), t = clock(st, now, anim);
        D.windBoard(ctx, v, flow, now);
        bs.forEach((b, i) => basket(ctx, v, b, t == null ? (st.pick === i ? '#ffd166' : null) : i === 0 ? '#2a9d8f' : st.pick === i ? '#ef476f' : null));
        leafOn(ctx, v, tr.pts, t ?? 0);
      },
      tap: (x, y, w, h) => { const i = hitIndex(bs, D.view(w, h).inv(x, y), 0.17); if (i < 0) return false; st.pick = i; return true; },
      check: () => st.pick === 0,
      fail: () => st.pick != null && st.pick !== 0,
    };
  },
};

// =====================================================================================
// 3. La fontaine cachée : ce qui SORT d'un endroit (divergence, loi de Gauss ∇·E = ρ)
function cloudsScene(ctx, v, flow, now, ps, kinds, shown, wrong = null, fade = 0) {
  D.windBoard(ctx, v, flow, now);
  ps.forEach((p, i) => {
    const x = v.X(p[0]), y = v.Y(p[1]), r = v.s * 0.075;
    const open = shown(i);
    if (open || fade > 0) {
      if (kinds[i]) D.source(ctx, x, y, r, kinds[i]); else D.nothing(ctx, x, y, r);
    }
    if (!open) D.drawGlyph(ctx, 'cloud', x, y, v.s * 0.2, 0, false, 1 - fade);
    if (wrong === i) D.text(ctx, '✖', x, y, v.s * 0.2, 'rgba(239,71,111,.85)');
  });
}
const fontaine = {
  id: 'fontaine', name: 'La fontaine cachée', icon: '⛲',
  gen(lvl, R, mode) {
    if (mode === 'faire') {
      const kinds = [[1, 0, 0], [1, -1, 0], [1, 1, -1, 0], [1, 1, -1, -1, 0]][lvl - 1];
      const ps = spots(R, kinds.length, 0.52, 0.68);
      const things = kinds.flatMap((k, i) => (k ? [Q(...ps[i], k, 0.12)] : []));
      if (lvl === 4) things.push(randDir(R, 0.25));
      const want = lvl <= 2 ? 1 : R.pick([1, -1]);
      const targets = kinds.filter((k) => k === want).length;
      const st = { found: new Set(), wrong: null, all: false };
      const flow = new D.Flow(things);
      return {
        mode, maxActions: kinds.length,
        prompt: want > 0 ? 'Trouve toutes les fontaines cachées sous les nuages !' : 'Trouve tous les trous cachés sous les nuages !',
        scene: (ctx, w, h, now, anim) => cloudsScene(ctx, D.view(w, h), flow, now, ps, kinds, (i) => st.found.has(i) || st.wrong === i, st.wrong, anim == null ? 0 : ease(anim)),
        tap: (x, y, w, h) => {
          const i = hitIndex(ps, D.view(w, h).inv(x, y), 0.19);
          if (i < 0 || st.found.has(i)) return false;
          if (kinds[i] === want) st.found.add(i); else st.wrong = i;
          return true;
        },
        check: () => st.found.size === targets,
        fail: () => st.wrong != null,
      };
    }
    const hidden = R.pick(lvl === 1 ? [1, 0] : [1, -1, 0]);
    const P = [rnd(R, -0.35, 0.35), rnd(R, -0.35, 0.35)];
    const things = hidden ? [Q(...P, hidden, 0.12)] : [];
    const nVis = !hidden ? 1 + (lvl >= 3 ? 1 : 0) : lvl >= 3 ? 1 + R.int(2) : 0;
    const vis = nVis ? spots(R, nVis, 0.5, 0.72, [P].concat([[P[0], P[1]]])).filter((p) => dist(p, P) > 0.6) : [];
    const visK = vis.map(() => R.pick([1, -1]));
    vis.forEach((p, i) => things.push(Q(...p, visK[i], 0.12)));
    if (lvl === 4 || !things.length) things.push(randDir(R, 0.3));
    const opts = lvl === 1 ? [1, 0] : [1, -1, 0];
    const flow = new D.Flow(things);
    const ps = [P, ...vis], kinds = [hidden, ...visK];
    return {
      mode: 'prevoir', prompt: 'Que cache le nuage ?', answer: opts.indexOf(hidden), fixedOrder: true,
      scene: (ctx, w, h, now, anim) => cloudsScene(ctx, D.view(w, h), flow, now, ps, kinds, (i) => i > 0, null, anim == null ? 0 : ease(anim)),
      options: opts.map((k) => (ctx, w, h) => { const r = Math.min(w, h) * 0.2; if (k) D.source(ctx, w / 2, h / 2, r, k); else D.nothing(ctx, w / 2, h / 2, r); }),
    };
  },
};

// =====================================================================================
// 4. Le petit moulinet : ce qui TOURNE sur place (rotationnel ∇∧v)
const spinAt = (f, p) => sgn(D.curl(f, p[0], p[1]), 0.3);
const moulinet = {
  id: 'moulinet', name: 'Le petit moulinet', icon: '🎡',
  gen(lvl, R, mode) {
    if (mode === 'faire') {
      const g = retry(() => {
        const things = [], cores = [];
        const nW = lvl === 1 ? 1 : 2;
        const cs = spots(R, nW, 0.7, 0.6).map((c) => (c[0] > 0.3 && c[1] > 0.3 ? [-c[0], c[1]] : c));
        const signs = lvl === 3 ? [1, -1] : cs.map(() => R.pick([1, -1]));
        cs.forEach((c, i) => { const core = lvl >= 3 ? 0.24 : 0.3; things.push(W(...c, signs[i], core)); cores.push({ c, core }); });
        if (lvl === 1 || lvl === 4) things.push(randDir(R, lvl === 1 ? 0.6 : 0.3));
        if (lvl === 3) { things.splice(1, 1); cores.splice(1, 1); things.push(SH(R.pick([1.4, -1.4]), R.pick(['x', 'y']))); }
        const pw = cores.map(({ c }) => [c[0] + rnd(R, -0.06, 0.06), c[1] + rnd(R, -0.06, 0.06)]);
        const n = [3, 4, 5, 6][lvl - 1];
        for (let t = 0; t < 400 && pw.length < n; t++) {
          const p = [rnd(R, -0.82, 0.82), rnd(R, -0.82, 0.82)];
          if (cores.every(({ c, core }) => dist(p, c) > core + 0.2) && pw.every((q) => dist(p, q) > 0.32) && !(p[0] > 0.45 && p[1] > 0.45)) pw.push(p);
        }
        if (pw.length < n) return null;
        const f = D.fieldOf(things), spins = pw.map((p) => spinAt(f, p));
        const want = lvl <= 2 ? null : R.pick(spins.filter((s) => s));
        const isT = (s) => (want == null ? s !== 0 : s === want);
        const nt = spins.filter(isT).length;
        if (!nt || nt === pw.length) return null;
        return { things, pw, spins, want, isT, nt };
      });
      const { things, pw, spins, want, isT, nt } = g;
      const order = R.shuffle(pw.map((_, i) => i)).map((i) => ({ p: pw[i], s: spins[i] }));
      const st = { found: new Set(), wrong: null };
      const flow = new D.Flow(things);
      return {
        mode, maxActions: order.length,
        prompt: want == null ? 'Touche tous les moulinets qui vont tourner sur place !' : 'Touche tous les moulinets qui vont tourner comme le modèle !',
        scene: (ctx, w, h, now, anim) => {
          const v = D.view(w, h);
          D.windBoard(ctx, v, flow, now);
          order.forEach(({ p, s }, i) => {
            const go = st.found.has(i) || anim != null;
            D.pinwheel(ctx, v.X(p[0]), v.Y(p[1]), v.s * 0.11, go ? s * now * 0.25 : 0);
            if (st.wrong === i) D.text(ctx, '✖', v.X(p[0]), v.Y(p[1]), v.s * 0.2, 'rgba(239,71,111,.85)');
          });
          if (want != null) modelBox(ctx, v, (c, ww, hh) => { D.pinwheel(c, ww / 2, hh / 2, ww * 0.22); D.spin(c, ww / 2, hh / 2, ww * 0.36, want); });
        },
        tap: (x, y, w, h) => {
          const i = hitIndex(order.map((o) => o.p), D.view(w, h).inv(x, y), 0.15);
          if (i < 0 || st.found.has(i)) return false;
          if (isT(order[i].s)) st.found.add(i); else st.wrong = i;
          return true;
        },
        check: () => st.found.size === nt,
        fail: () => st.wrong != null,
      };
    }
    const P = [rnd(R, -0.25, 0.25), rnd(R, -0.25, 0.25)];
    const cases = {
      whirl: () => [W(...P, R.pick([1, -1]), 0.3)],
      uni: () => [randDir(R)],
      src: () => [Q(...P, R.pick([1, -1]), 0.3)],
      shear: () => [SH(R.pick([1.4, -1.4]), R.pick(['x', 'y']))],
      far: () => { const d = R.pick([[1, 0], [-1, 0], [0, 1], [0, -1]]); return [W(P[0] + d[0] * 0.55, P[1] + d[1] * 0.55, R.pick([1, -1]), 0.15)]; },
    };
    const pool = [['whirl', 'uni'], ['whirl', 'whirl', 'uni', 'src'], ['whirl', 'src', 'shear', 'shear', 'uni'], ['far', 'shear', 'whirl', 'whirl', 'src']][lvl - 1];
    const things = cases[R.pick(pool)]();
    const f = D.fieldOf(things), s = spinAt(f, P), st = {};
    const flow = new D.Flow(things);
    return {
      mode: 'prevoir', prompt: 'Le moulinet va-t-il tourner ? Dans quel sens ?', answer: ORI.indexOf(s), fixedOrder: true,
      scene: (ctx, w, h, now, anim) => {
        const v = D.view(w, h), t = clock(st, now, anim);
        D.windBoard(ctx, v, flow, now);
        D.pinwheel(ctx, v.X(P[0]), v.Y(P[1]), v.s * 0.13, t == null ? 0 : s * t * 250);
      },
      options: ORI.map((k) => spinCard(k, (ctx, x, y, r) => D.pinwheel(ctx, x, y, r))),
    };
  },
};

// =====================================================================================
// 5. Le tour du lac : faire le tour compte les tourbillons À L'INTÉRIEUR (Stokes, circulation)
const LAKE_THR = 0.4;
const lac = {
  id: 'lac', name: 'Le tour du lac', icon: '⛵',
  gen(lvl, R, mode) {
    if (mode === 'faire') {
      const g = retry(() => {
        const n = lvl <= 2 ? 3 : 4, r = 0.27;
        const cs = spots(R, n, 0.7, 0.6);
        const things = [];
        const inside = R.shuffle(cs.map((_, i) => i));
        const okCore = (p, core) => cs.every((c) => Math.abs(dist(p, c) - r) > core + 0.06);
        things.push(W(...cs[inside[0]], R.pick([1, -1]), 0.12));
        if (lvl >= 2) { // un tourbillon hors de tous les lacs
          let p = null;
          for (let t = 0; t < 300 && !p; t++) { const q = [rnd(R, -0.85, 0.85), rnd(R, -0.85, 0.85)]; if (cs.every((c) => dist(q, c) > r + 0.2)) p = q; }
          if (!p) return null;
          things.push(W(...p, R.pick([1, -1]), 0.12));
        }
        if (lvl >= 3) things.push(randDir(R, 0.4));
        if (lvl === 4) { const c = cs[inside[1]]; things.push(W(c[0] - 0.1, c[1], 1, 0.07), W(c[0] + 0.1, c[1], -1, 0.07)); }
        if (!things.every((t) => t.k !== 'w' || okCore([t.x, t.y], t.c))) return null;
        const f = D.fieldOf(things);
        const circ = cs.map((c) => D.circulation(f, c[0], c[1], r));
        const tgt = circ.map((x) => Math.abs(x) > LAKE_THR);
        if (!tgt.some(Boolean) || tgt.every(Boolean) || circ.some((x) => Math.abs(x) > 0.15 && Math.abs(x) < 0.8)) return null;
        return { cs, r, things, f, circ, tgt };
      });
      const { cs, r, things, f, circ, tgt } = g;
      const st = { found: new Set(), wrong: null };
      const flow = new D.Flow(things);
      return {
        mode, maxActions: cs.length,
        prompt: 'Touche tous les lacs où le vent fait faire le tour au bateau !',
        scene: (ctx, w, h, now, anim) => {
          const v = D.view(w, h);
          D.windBoard(ctx, v, flow, now);
          cs.forEach((c, i) => {
            const open = st.found.has(i) || anim != null || st.wrong === i;
            D.lake(ctx, v, c, r, { f: open ? f : null, mref: flow.mref, highlight: st.found.has(i) });
            const s = sgn(circ[i], LAKE_THR), th = Math.PI / 2 + (open ? (s ? s * now * 0.0015 : Math.sin(now / 300) * 0.3) : 0);
            D.drawGlyph(ctx, '⛵', v.X(c[0] + r * Math.cos(th)), v.Y(c[1] + r * Math.sin(th)), v.s * 0.065);
            if (st.wrong === i) D.text(ctx, '✖', v.X(c[0]), v.Y(c[1]), v.s * 0.2, 'rgba(239,71,111,.85)');
          });
        },
        tap: (x, y, w, h) => {
          const p = D.view(w, h).inv(x, y), i = cs.findIndex((c) => dist(c, p) < r + 0.08);
          if (i < 0 || st.found.has(i)) return false;
          if (tgt[i]) st.found.add(i); else st.wrong = i;
          return true;
        },
        check: () => st.found.size === tgt.filter(Boolean).length,
        fail: () => st.wrong != null,
      };
    }
    const C = [rnd(R, -0.15, 0.15), rnd(R, -0.15, 0.15)], r = 0.45;
    const dirOut = () => { const d = R.pick([[1, 0], [-1, 0], [0, 1], [0, -1]]); return [C[0] + d[0] * 0.72, C[1] + d[1] * 0.72]; };
    const cases = {
      in: () => [W(C[0] + rnd(R, -0.12, 0.12), C[1] + rnd(R, -0.12, 0.12), R.pick([1, -1]), 0.15)],
      uni: () => [randDir(R)],
      shear: () => [SH(R.pick([1.4, -1.4]), R.pick(['x', 'y']))],
      out: () => [W(...dirOut(), R.pick([1, -1]), 0.15)],
      cancel: () => [W(C[0] - 0.15, C[1], 1, 0.1), W(C[0] + 0.15, C[1], -1, 0.1)],
      inout: () => { const s = R.pick([1, -1]); return [W(C[0], C[1], s, 0.15), W(...dirOut(), -s, 0.15)]; },
    };
    const pool = [['in', 'uni'], ['in', 'uni', 'shear'], ['in', 'out', 'uni', 'shear'], ['out', 'cancel', 'inout', 'shear']][lvl - 1];
    const things = cases[R.pick(pool)]();
    const f = D.fieldOf(things), s = sgn(D.circulation(f, C[0], C[1], r), LAKE_THR), st = {};
    const flow = new D.Flow(things);
    return {
      mode: 'prevoir', prompt: 'Le vent fait-il faire le tour du lac au bateau ? Dans quel sens ?', answer: ORI.indexOf(s), fixedOrder: true,
      scene: (ctx, w, h, now, anim) => {
        const v = D.view(w, h), t = clock(st, now, anim);
        D.windBoard(ctx, v, flow, now);
        D.lake(ctx, v, C, r, { f: t == null ? null : f, mref: flow.mref });
        const th = Math.PI / 2 + (t == null ? 0 : s ? s * t * 2.2 : Math.sin(t * 5) * 0.35);
        D.drawGlyph(ctx, '⛵', v.X(C[0] + r * Math.cos(th)), v.Y(C[1] + r * Math.sin(th)), v.s * 0.08);
      },
      options: ORI.map((k) => (ctx, w, h) => {
        const rr = Math.min(w, h) * 0.3;
        ctx.save(); ctx.strokeStyle = 'rgba(17,138,178,.45)'; ctx.lineWidth = rr * 0.18; ctx.beginPath(); ctx.arc(w / 2, h / 2, rr, 0, 7); ctx.stroke(); ctx.restore();
        D.drawGlyph(ctx, '⛵', w / 2, h / 2 - rr, rr * 0.4);
        if (k) D.spin(ctx, w / 2, h / 2, rr * 0.5, k); else D.text(ctx, '⇄', w / 2, h / 2, rr * 0.8, D.SOFT);
      }),
    };
  },
};

// =====================================================================================
// 6. Le fil et les boussoles : un courant fait TOURNER le vent magnétique autour de lui (Ampère, Œrsted)
function bAt(wires, x, y) {
  let bx = 0, by = 0;
  for (const w of wires) {
    if (!w.I) continue;
    const dx = x - w.x, dy = y - w.y, r2 = Math.max(dx * dx + dy * dy, 0.01);
    bx += (-w.I * dy) / r2; by += (w.I * dx) / r2;
  }
  return [bx, by];
}
/** Direction de la boussole (degrés) : le vent magnétique, ou le nord (90°) s'il est trop faible. */
const needle = (wires, p) => { const [bx, by] = bAt(wires, ...p); return Math.hypot(bx, by) < 0.15 ? 90 : Math.atan2(by, bx) / RAD; };
const ringPts = (c, r, n = 8) => Array.from({ length: n }, (_, i) => [c[0] + r * Math.cos((i / n) * 2 * Math.PI), c[1] + r * Math.sin((i / n) * 2 * Math.PI)]);
const angDiff = (a, b) => Math.abs(((a - b + 540) % 360) - 180);
const CYCLE = [1, -1, 0];
const cyc = (from, to) => (CYCLE.indexOf(to) - CYCLE.indexOf(from) + 3) % 3;

const fil = {
  id: 'fil', name: 'Le fil et les boussoles', icon: '🧭',
  gen(lvl, R, mode) {
    const wireBoard = (ctx, v, wires, cps, dirs, ghosts) => {
      D.board(ctx, v, '#fbf8ff');
      wires.forEach((w) => D.wire(ctx, v.X(w.x), v.Y(w.y), v.s * 0.1, w.I));
      cps.forEach((p, i) => D.compass(ctx, v.X(p[0]), v.Y(p[1]), v.s * 0.12, dirs ? dirs[i] : null, { ghost: ghosts ? ghosts[i] : null }));
    };
    if (mode === 'faire') {
      const g = retry(() => {
        const nW = lvl <= 2 ? 1 : lvl === 3 ? 2 : 3;
        const pos = nW === 1 ? [[0, 0]] : spots(R, nW, 0.7, 0.5);
        const target = pos.map(() => (lvl === 1 ? R.pick([1, -1]) : R.pick(CYCLE)));
        if (target.every((x) => !x)) return null;
        const start = pos.map((_, i) => (lvl === 1 ? 0 : R.pick(CYCLE)));
        const cps = nW === 1 ? ringPts([0, 0], 0.55) : (() => {
          const out = [];
          for (let t = 0; t < 400 && out.length < 6; t++) { const p = [rnd(R, -0.85, 0.85), rnd(R, -0.85, 0.85)]; if (pos.every((q) => dist(p, q) > 0.3) && out.every((q) => dist(p, q) > 0.3)) out.push(p); }
          return out.length === 6 ? out : null;
        })();
        if (!cps) return null;
        const mk = (I) => pos.map((p, i) => ({ x: p[0], y: p[1], I: I[i] }));
        const tDirs = cps.map((p) => needle(mk(target), p));
        const same = (I) => cps.every((p, i) => angDiff(needle(mk(I), p), tDirs[i]) < 8);
        if (same(start)) return null;
        return { pos, target, start, cps, mk, tDirs, same };
      });
      const { target, start, cps, mk, tDirs, same } = g;
      const st = { I: start.slice() };
      const optimal = start.reduce((s, x, i) => s + cyc(x, target[i]), 0);
      return {
        mode, optimal, maxActions: optimal + 4,
        prompt: 'Touche les fils pour que les boussoles imitent les fantômes !',
        scene: (ctx, w, h) => { const v = D.view(w, h), wires = mk(st.I); wireBoard(ctx, v, wires, cps, cps.map((p) => needle(wires, p)), tDirs); },
        tap: (x, y, w, h) => {
          const i = hitIndex(g.pos, D.view(w, h).inv(x, y), 0.17);
          if (i < 0) return false;
          st.I[i] = CYCLE[(CYCLE.indexOf(st.I[i]) + 1) % 3];
          return true;
        },
        check: () => same(st.I),
        solve: () => { st.I = target.slice(); },
      };
    }
    if (lvl <= 2) {
      const I = R.pick(lvl === 1 ? [1, -1] : [1, -1, 0]);
      const wires = [{ x: 0, y: 0, I }], cps = ringPts([0, 0], 0.55);
      const kinds = lvl === 1 ? ['ccw', 'cw', 'north'] : ['ccw', 'cw', 'north', 'in'];
      const ringDir = (k, p) => { const a = Math.atan2(p[1], p[0]) / RAD; return k === 'ccw' ? a + 90 : k === 'cw' ? a - 90 : k === 'north' ? 90 : a + 180; };
      const good = I === 1 ? 'ccw' : I === -1 ? 'cw' : 'north';
      return {
        mode: 'prevoir', prompt: 'Où vont pointer les boussoles ?', answer: kinds.indexOf(good), fixedOrder: true,
        scene: (ctx, w, h, now, anim) => {
          const v = D.view(w, h);
          wireBoard(ctx, v, wires, cps, anim == null ? null : cps.map((p) => 90 + (ringDir(good, p) - 90) * ease(anim)));
        },
        options: kinds.map((k) => (ctx, w, h) => {
          const v = D.view(w, h, w / 2, h / 2, Math.min(w, h) * 0.95);
          ctx.fillStyle = '#e9e4f5'; ctx.beginPath(); ctx.arc(v.cx, v.cy, v.s * 0.1, 0, 7); ctx.fill();
          cps.forEach((p) => D.compass(ctx, v.X(p[0]), v.Y(p[1]), v.s * 0.18, ringDir(k, p)));
        }),
      };
    }
    // deux ou trois fils, une seule boussole
    const g = retry(() => {
      const pos = lvl === 3 ? [[-0.45, 0], [0.45, 0]] : spots(R, 2 + R.int(2), 0.6, 0.55);
      const wires = pos.map((p) => ({ x: p[0], y: p[1], I: R.pick([1, -1]) }));
      const stepA = lvl === 3 ? 90 : 45;
      const cand = [];
      for (let i = -8; i <= 8; i++) for (let j = -8; j <= 8; j++) {
        const p = [i / 10, j / 10];
        if (wires.some((w) => dist(p, [w.x, w.y]) < 0.32)) continue;
        const [bx, by] = bAt(wires, ...p);
        if (Math.hypot(bx, by) < 0.8) continue;
        const a = n360(Math.atan2(by, bx) / RAD);
        if (angDiff(a, Math.round(a / stepA) * stepA) < 4) cand.push({ p, a: n360(Math.round(a / stepA) * stepA) });
      }
      if (!cand.length) return null;
      return { wires, ...R.pick(cand) };
    });
    const { wires, p, a } = g;
    const all = lvl === 3 ? [0, 90, 180, 270] : [0, 45, 90, 135, 180, 225, 270, 315];
    const { vals, answer } = choices(R, a, all, 4);
    return {
      mode: 'prevoir', prompt: 'Où va pointer la boussole ?', answer,
      scene: (ctx, w, h, now, anim) => { const v = D.view(w, h); wireBoard(ctx, v, wires, [p], anim == null ? null : [90 + (((a - 90 + 540) % 360) - 180) * ease(anim)]); },
      options: vals.map((x) => (ctx, w, h) => D.compass(ctx, w / 2, h / 2, Math.min(w, h) * 0.36, x)),
    };
  },
};

// =====================================================================================
// 7. Le vent qui ne sort de nulle part : le vent d'aimant n'a pas de fontaine (∇·B = 0)
function elecWind(R, lvl) {
  const P = [rnd(R, -0.3, 0.3), rnd(R, -0.3, 0.3)];
  if (lvl === 1) return [Q(...P, R.pick([1, -1]), 0.15)];
  if (lvl === 2) return [Q(...P, R.pick([1, -1]), 0.15), randDir(R, 0.5)];
  if (lvl === 3) { const a = R.int(4) * 45 * RAD, d = [Math.cos(a) * 0.35, Math.sin(a) * 0.35]; return [Q(d[0], d[1], 1, 0.12), Q(-d[0], -d[1], -1, 0.12)]; }
  const th = spots(R, 2 + R.int(2), 0.55, 0.6).map((p) => Q(...p, R.pick([1, -1]), 0.12));
  if (R.f() < 0.5) th.push(randDir(R, 0.3));
  return th;
}
function magWind(R, lvl) {
  const P = [rnd(R, -0.3, 0.3), rnd(R, -0.3, 0.3)];
  if (lvl === 1) return [W(...P, R.pick([1, -1]), 0.15)];
  if (lvl === 2) return R.pick([() => [W(...P, R.pick([1, -1]), 0.15), randDir(R, 0.5)], () => [randDir(R, 0.8)], () => [SH(R.pick([1.4, -1.4]), R.pick(['x', 'y']))]])();
  if (lvl === 3) { const a = R.int(4) * 45 * RAD, d = [Math.cos(a) * 0.35, Math.sin(a) * 0.35]; return [W(d[0], d[1], 1, 0.12), W(-d[0], -d[1], -1, 0.12)]; }
  const th = spots(R, 2 + R.int(2), 0.55, 0.6).map((p) => W(...p, R.pick([1, -1]), 0.12));
  if (R.f() < 0.5) th.push(R.f() < 0.5 ? randDir(R, 0.3) : SH(R.pick([0.8, -0.8]), R.pick(['x', 'y'])));
  return th;
}
const mapCard = (things) => (ctx, w, h) => {
  const v = D.view(w, h, w / 2, h / 2, Math.min(w, h) * 0.94);
  D.board(ctx, v);
  ctx.save(); D.clip(ctx, v); D.arrows(ctx, v, D.fieldOf(things), { n: 7, color: 'rgba(61,44,107,.7)' }); ctx.restore();
};
function revealThings(ctx, v, things, alpha) {
  for (const t of things) {
    if (t.k === 'q') D.source(ctx, v.X(t.x), v.Y(t.y), v.s * 0.06, t.q, alpha);
    if (t.k === 'w') D.whirlThing(ctx, v.X(t.x), v.Y(t.y), v.s * 0.12, t.w, alpha);
  }
}
const aimant = {
  id: 'aimant', name: 'Le vent qui ne sort de nulle part', icon: '🧲',
  gen(lvl, R, mode) {
    if (mode === 'faire') {
      const nMag = lvl === 1 ? 1 : 1 + R.int(2);
      const maps = R.shuffle([...Array.from({ length: nMag }, () => ({ mag: true, th: magWind(R, lvl) })), ...Array.from({ length: 4 - nMag }, () => ({ mag: false, th: elecWind(R, lvl) }))]);
      return {
        mode, prompt: 'Trouve tous les vents d’aimant 🧲 : ils ne sortent d’aucune fontaine !',
        answer: { all: maps.map((m, i) => (m.mag ? i : -1)).filter((i) => i >= 0) },
        scene: (ctx, w, h) => {
          const r = Math.min(w, h) * 0.16;
          D.text(ctx, '🧲', w * 0.3, h * 0.5, r * 1.6);
          D.spin(ctx, w * 0.3, h * 0.5, r * 1.2, 1, D.VIOLET);
          D.source(ctx, w * 0.7, h * 0.5, r * 0.55, 1);
          D.text(ctx, '✖', w * 0.7, h * 0.5, r * 2.2, 'rgba(239,71,111,.8)');
        },
        options: maps.map((m) => mapCard(m.th)),
      };
    }
    const mag = R.f() < 0.5, things = mag ? magWind(R, lvl) : elecWind(R, lvl);
    const flow = new D.Flow(things);
    return {
      mode: 'prevoir', prompt: 'Vent de fontaine ⛲ ou vent d’aimant 🧲 ?', answer: mag ? 1 : 0, fixedOrder: true,
      scene: (ctx, w, h, now, anim) => {
        const v = D.view(w, h);
        D.windBoard(ctx, v, flow, now, { arrowsN: 11 });
        if (anim != null) revealThings(ctx, v, things, ease(anim));
      },
      options: [
        (ctx, w, h) => { const r = Math.min(w, h) * 0.17; D.source(ctx, w * 0.36, h * 0.5, r, 1); D.source(ctx, w * 0.72, h * 0.5, r * 0.6, -1); },
        (ctx, w, h) => { const r = Math.min(w, h) * 0.2; D.text(ctx, '🧲', w / 2, h / 2, r * 1.5); D.spin(ctx, w / 2, h / 2, r * 1.4, 1, D.VIOLET); },
      ],
    };
  },
};

// =====================================================================================
// 8. L'aimant et l'anneau : un aimant qui BOUGE fait tourner le courant (Faraday ∇∧E = −∂B/∂t)
const induced = (pole, motion) => motion * (pole === 'N' ? 1 : -1); // +1 = ↺ vu d'en haut
function ringScene(ctx, w, h, now, { pole, motion, ringMoves = false, current, glow = 1 }) {
  const rx = Math.min(w * 0.3, h * 0.42), ry = rx * 0.3, cx = w * 0.45;
  const per = 1.4, ph = ((now / 1000) % per) / per, dy = h * 0.16 * (motion === 0 ? 0 : motion > 0 ? ph : 1 - ph);
  const magY = h * 0.3 + (ringMoves ? 0 : dy), ringY = h * 0.8 - (ringMoves ? dy : 0);
  ctx.save(); ctx.fillStyle = 'rgba(123,111,168,.12)'; ctx.beginPath(); ctx.ellipse(cx, ringY + ry * 0.6, rx * 1.05, ry * 0.8, 0, 0, 7); ctx.fill(); ctx.restore();
  // moitié arrière de l'anneau, aimant, puis moitié avant : l'aimant passe « dans » l'anneau
  D.ring(ctx, cx, ringY, rx, ry, current, now, glow);
  D.magnet(ctx, cx, magY, rx * 0.32, rx * 0.9, pole);
  const hint = motion === 0 ? '💤' : (ringMoves ? (motion > 0 ? '⬆️' : '⬇️') : (motion > 0 ? '⬇️' : '⬆️'));
  D.text(ctx, hint, ringMoves ? cx - rx * 1.25 : cx + rx * 0.55, ringMoves ? ringY : magY, rx * 0.3);
}
const anneau = {
  id: 'anneau', name: 'L’aimant et l’anneau', icon: '💡',
  gen(lvl, R, mode) {
    if (mode === 'faire') {
      const T = R.pick([1, -1]);
      const st = { pole: lvl <= 2 ? 'N' : R.pick(['N', 'S']), motion: 0 };
      const move = lvl === 4 ? -1 : 1;
      const controls = lvl <= 2
        ? [{ label: '⬇️', act: () => { st.motion = 1; } }, { label: '⬆️', act: () => { st.motion = -1; } }]
        : [{ label: move > 0 ? '⬇️' : '⬆️', act: () => { st.motion = move; } }, { label: '🔄', act: () => { st.pole = st.pole === 'N' ? 'S' : 'N'; } }];
      const optimal = lvl <= 2 ? 1 : induced(st.pole, move) === T ? 1 : 2;
      return {
        mode, optimal, maxActions: optimal + 3,
        prompt: lvl <= 2 ? 'Bouge l’aimant pour que le courant tourne comme le modèle !' : 'Retourne ou bouge l’aimant : le courant doit tourner comme le modèle !',
        scene: (ctx, w, h, now) => {
          ringScene(ctx, w, h, now, { ...st, current: induced(st.pole, st.motion) });
          modelBox(ctx, D.view(w, h), (c, ww, hh) => D.ringCard(c, ww, hh, T));
        },
        controls,
        check: () => induced(st.pole, st.motion) === T,
        solve: () => { st.motion = induced(st.pole, 1) === T ? 1 : -1; },
      };
    }
    const pole = lvl <= 2 ? 'N' : R.pick(['N', 'S']);
    const motion = R.pick(lvl === 1 ? [1, 1, 0] : [1, -1, 1, -1, 0]);
    const ringMoves = lvl === 4 && motion !== 0 && R.f() < 0.6;
    const cur = induced(pole, motion);
    return {
      mode: 'prevoir', prompt: 'La lampe s’allume-t-elle ? Dans quel sens tourne le courant ?', answer: ORI.indexOf(cur), fixedOrder: true,
      scene: (ctx, w, h, now, anim) => ringScene(ctx, w, h, now, { pole, motion, ringMoves, current: anim == null ? 0 : cur, glow: anim == null ? 0 : ease(anim) }),
      options: ORI.map((k) => (ctx, w, h) => D.ringCard(ctx, w, h, k)),
    };
  },
};

// =====================================================================================
// 9. La loupe magique : ∇ × vent = ce qui sort + ce qui tourne (∇F = J, l'équation de Maxwell)
const COMBOS = [1, -1, 0].flatMap((s) => [1, -1, 0].map((t) => [s, t]));
const comboCard = ([s, t]) => (ctx, w, h) => {
  const k = Math.min(w / 2.5, h * 0.8);
  D.numberTile(ctx, w / 2 - k * 0.6, h / 2, k * 0.95, s);
  D.text(ctx, '+', w / 2, h / 2, k * 0.35, D.SOFT);
  D.whirlTile(ctx, w / 2 + k * 0.6, h / 2, k * 0.95, t);
};
const makers = (P, s, t, c = 0.22) => [...(s ? [Q(...P, s, c)] : []), ...(t ? [W(...P, t, c)] : [])];
const sonde = {
  id: 'sonde', name: 'La loupe magique', icon: '🔍',
  gen(lvl, R, mode) {
    const P = [rnd(R, -0.2, 0.2), rnd(R, -0.2, 0.2)];
    if (mode === 'faire') {
      const [S, T] = lvl === 1 ? [R.pick([1, -1]), 0] : lvl === 2 ? [0, R.pick([1, -1])] : lvl === 3 ? R.pick([[1, 0], [-1, 0], [0, 1], [0, -1]]) : [R.pick([1, -1]), R.pick([1, -1])];
      const st = { s: 0, t: 0 };
      const ghost = makers(P, S, T), flow = new D.Flow(makers(P, 0, 0));
      const next = (x) => CYCLE[(CYCLE.indexOf(x) + 1) % 3];
      const controls = [];
      if (lvl !== 2) controls.push({ label: '⛲', act: () => { st.s = next(st.s); flow.set(makers(P, st.s, st.t)); } });
      if (lvl !== 1) controls.push({ label: '🌀', act: () => { st.t = next(st.t); flow.set(makers(P, st.s, st.t)); } });
      const optimal = cyc(0, S) + cyc(0, T);
      return {
        mode, optimal, maxActions: optimal + 4,
        prompt: 'Fabrique le même vent que le vent violet !',
        scene: (ctx, w, h, now) => {
          const v = D.view(w, h);
          D.windBoard(ctx, v, flow, now, { ghost });
          const x = v.X(P[0]), y = v.Y(P[1]);
          if (st.t) D.whirlThing(ctx, x, y, v.s * 0.14, st.t);
          if (st.s) D.source(ctx, x, y, v.s * 0.05, st.s);
          D.loupe(ctx, x, y, v.s * 0.2);
        },
        controls,
        check: () => st.s === S && st.t === T,
        solve: () => { st.s = S; st.t = T; flow.set(makers(P, S, T)); },
      };
    }
    let combo;
    if (lvl === 1) combo = [R.pick([1, -1, 0]), 0];
    else if (lvl === 2) combo = [0, R.pick([1, -1, 0])];
    else if (lvl === 3) combo = R.pick([[1, 0], [-1, 0], [0, 1], [0, -1], [0, 0]]);
    else combo = R.pick([[1, 1], [1, -1], [-1, 1], [-1, -1], [0, 0], R.pick(COMBOS)]);
    const things = makers(P, ...combo);
    const nOther = combo[0] || combo[1] ? (lvl >= 3 ? R.int(2) : 0) : 1 + (lvl >= 3 ? 1 : 0);
    if (nOther) {
      const ps = spots(R, nOther, 0.5, 0.7, [P]).filter((p) => dist(p, P) > 0.62);
      ps.forEach((p) => things.push(R.f() < 0.5 ? Q(...p, R.pick([1, -1]), 0.15) : W(...p, R.pick([1, -1]), 0.15)));
    }
    if (lvl === 4 || !things.length) things.push(randDir(R, 0.3));
    const pool = lvl === 1 ? COMBOS.filter((c) => c[1] === 0) : lvl === 2 ? COMBOS.filter((c) => c[0] === 0) : COMBOS;
    const { vals, answer } = choices(R, combo, pool, lvl <= 2 ? 3 : 4);
    const flow = new D.Flow(things);
    return {
      mode: 'prevoir', prompt: 'Que voit la loupe magique : ce qui sort, ce qui tourne ?', answer,
      scene: (ctx, w, h, now, anim) => {
        const v = D.view(w, h);
        D.windBoard(ctx, v, flow, now);
        const x = v.X(P[0]), y = v.Y(P[1]);
        if (anim != null) revealThings(ctx, v, makers(P, ...combo, 0.22), ease(anim));
        D.loupe(ctx, x, y, v.s * 0.2);
      },
      options: vals.map(comboCard),
    };
  },
};

export const GAMES = [tapis, feuille, fontaine, moulinet, lac, fil, aimant, anneau, sonde];
