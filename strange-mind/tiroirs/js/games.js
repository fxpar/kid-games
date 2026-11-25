// Les tiroirs magiques : 6 mini-jeux sur la forme « une seule équation » de Maxwell, ∇F = J.
// Format des défis : voir maxwell/js/games.js (repris des défis éclair v4).
//
// Le fil rouge (voir README) :
//  1 on peut ajouter des choses de natures différentes, chacune reste dans son tiroir (∂ₜ + ∇, cρ − j, E + icB)
//  2 le produit de deux choses tombe dans un tiroir précis (lapin, flèche, tapis, cube)
//  3 le cube magique i change une flèche en tapis : B est un tapis (bivecteur), pas une flèche
//  4 deux paniers sont égaux tiroir par tiroir : une équation = quatre lois (Gauss, Ampère, Faraday, pas de monopôle)
//  5 le temps est une direction de plus : une coccinelle immobile avance quand même… dans le temps (cρ)
//  6 quand rien n'est caché dedans, le bord dit tout (formule de Cauchy)

import * as D from './wind.js';
import * as G from './ga.js';
const { ease } = D;

export function makeR(rand) {
  return {
    f: rand,
    int: (n) => Math.floor(rand() * n),
    pick: (a) => a[Math.floor(rand() * a.length)],
    shuffle: (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
  };
}
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
const retry = (fn, n = 300) => { for (let i = 0; i < n; i++) { const r = fn(); if (r) return r; } throw new Error('retry'); };

/** Une ligne centrée de cases : 'texte' ou fonction (ctx, cx, cy, r) ; { wide } = case élargie. */
function row(ctx, w, h, cells) {
  const units = cells.map((c) => (typeof c === 'string' ? 0.6 : c.wide ? 3.2 : 2));
  const total = units.reduce((a, b) => a + b, 0), u = Math.min(w / total, (h * 0.9) / 2.2), r = u * 0.92;
  let x = (w - total * u) / 2;
  cells.forEach((c, i) => {
    const cw = units[i] * u, cx = x + cw / 2;
    if (typeof c === 'string') D.text(ctx, c, cx, h / 2, r * 0.8, D.SOFT);
    else (c.draw || c)(ctx, cx, h / 2, r, cw);
    x += cw;
  });
}
const box = (ctx, cx, cy, r, wd = 2 * r) => {
  ctx.save(); ctx.fillStyle = 'rgba(123,44,191,.07)'; ctx.strokeStyle = 'rgba(123,44,191,.35)'; ctx.lineWidth = 2;
  D.roundRect(ctx, cx - wd / 2, cy - r * 1.05, wd, r * 2.1, r * 0.25); ctx.fill(); ctx.stroke(); ctx.restore();
};
const question = (ctx, cx, cy, r) => D.text(ctx, '?', cx, cy, r * 1.1, '#c9b8ea');
const bladeCell = (b, opts) => (ctx, cx, cy, r) => G.drawBlade(ctx, cx, cy, r * 0.85, b, opts);
const bladeCard = (b) => (ctx, w, h) => (b.m < 0 ? D.text(ctx, '∅', w / 2, h / 2, Math.min(w, h) * 0.4, D.SOFT) : G.drawBlade(ctx, w / 2, h / 2, Math.min(w, h) * 0.36, b));
const mvCard = (p) => (ctx, w, h) => { const s = Math.min(w, h) * 0.9; G.drawers(ctx, (w - s) / 2, (h - s) / 2, s, s, p); };

// =====================================================================================
// 1. Le panier mélangé : on additionne des lapins et des flèches… chacun reste dans son tiroir
const POOL = { 1: [0, 1], 2: [0, 1, 4], 3: [0, 1, 4, 3], 4: [0, 1, 2, 3, 6, 7] };
function randMv(R, lvl, n, base = null) {
  const out = {};
  for (let k = 0; k < n; k++) {
    const m = base && R.f() < 0.6 ? R.pick(Object.keys(base).map(Number)) : R.pick(POOL[lvl]);
    out[m] = (out[m] || 0) + R.pick(lvl === 1 ? [1, -1] : [1, -1, 1, -1, 2, -2]);
  }
  return G.mvAdd(out);
}
/** Faux résultats typiques : tout compter comme des lapins, oublier que les opposés s'annulent, se tromper de signe. */
function wrongSums(R, A, B, lvl) {
  const C = G.mvAdd(A, B), out = [G.mvAdd(A, G.mvNeg(B))];
  const all = Object.values(C).reduce((a, b) => a + b, 0);
  if (Object.keys(C).length > 1) out.push(G.mvAdd({ 0: all }));
  const abs = {};
  for (const p of [A, B]) for (const [m, c] of Object.entries(p)) abs[m] = (abs[m] || 0) + Math.abs(c) * Math.sign(A[m] || c);
  out.push(G.mvAdd(abs));
  for (const m of Object.keys(C)) { out.push(G.mvAdd(C, { [m]: -2 * C[m] })); const o = R.pick(POOL[lvl].filter((x) => x !== +m)); out.push(G.mvAdd(C, { [m]: -C[m], [o]: C[m] })); }
  out.push(G.mvAdd(C, { [R.pick(POOL[lvl])]: R.pick([1, -1]) }));
  return out.filter((p) => !G.mvEq(p, C));
}
const panier = {
  id: 'panier', name: 'Le panier mélangé', icon: '🧺',
  gen(lvl, R, mode) {
    const A = retry(() => { const a = randMv(R, lvl, 2 + R.int(2)); return Object.keys(a).length ? a : null; });
    const B = retry(() => { const b = randMv(R, lvl, 1 + R.int(2), A); return Object.keys(b).length ? b : null; });
    const C = G.mvAdd(A, B);
    const uA = R.shuffle(G.units(A)), uB = R.shuffle(G.units(B));
    const pileCell = (us) => ({ wide: true, draw: (ctx, cx, cy, r, cw) => G.pile(ctx, cx - cw * 0.47, cy - r, cw * 0.94, r * 2, us) });
    const sortedCell = (p, hide) => ({ wide: true, draw: (ctx, cx, cy, r, cw) => { box(ctx, cx, cy, r, cw * 0.94); if (hide) question(ctx, cx, cy, r); else G.drawers(ctx, cx - r * 0.95, cy - r * 0.95, r * 1.9, r * 1.9, p); } });
    if (mode === 'faire') {
      const wrong = [G.mvAdd(C, A), C, G.mvNeg(B), ...wrongSums(R, A, B, lvl).map((p) => G.mvAdd(p, G.mvNeg(A)))];
      const { vals, answer } = choices(R, B, wrong.filter((p) => !G.mvEq(p, B)), 3, G.mvKey);
      return {
        mode, prompt: 'Que faut-il ajouter au panier pour obtenir les tiroirs de droite ?', answer,
        scene: (ctx, w, h, now, anim) => row(ctx, w, h, [pileCell(uA), '+', anim == null ? sortedCell(null, true) : pileCell(uB), '=', sortedCell(C)]),
        options: vals.map(mvCard),
      };
    }
    const { vals, answer } = choices(R, C, wrongSums(R, A, B, lvl), 3, G.mvKey);
    return {
      mode, prompt: 'On vide les deux paniers dans la commode : que contient chaque tiroir ?', answer,
      scene: (ctx, w, h, now, anim) => row(ctx, w, h, [pileCell(uA), '+', pileCell(uB), '=', sortedCell(C, anim == null)]),
      options: vals.map(mvCard),
    };
  },
};

// =====================================================================================
// 2. Dans quel tiroir ? Le produit de deux choses (produit géométrique de Cl(3))
const ALL_BLADES = [1, 2, 4, 3, 6, 5, 7];
const tiroir = {
  id: 'tiroir', name: 'Dans quel tiroir ?', icon: '🗄️',
  gen(lvl, R, mode) {
    const sgn = () => R.pick([1, -1]);
    let A, B;
    if (lvl === 1) { A = G.blade(0, -1); B = G.blade(R.pick([1, 2, 4, 3, 6, 5]), sgn()); if (R.f() < 0.5) [A, B] = [B, A]; }
    else if (lvl === 2) { A = G.blade(R.pick(G.AXES), sgn()); B = G.blade(R.f() < 0.35 ? A.m : R.pick(G.AXES), sgn()); }
    else if (lvl === 3) { A = G.blade(R.pick(G.AXES), sgn()); B = G.blade(R.pick(G.PLANES), sgn()); if (R.f() < 0.4) [A, B] = [B, A]; }
    else { A = G.blade(R.pick(ALL_BLADES), sgn()); B = G.blade(R.pick(ALL_BLADES), sgn()); }
    const P = G.mul(A, B);
    const cells = (res) => [bladeCell(A), '×', bladeCell(B), '=', (ctx, cx, cy, r) => { box(ctx, cx, cy, r); res(ctx, cx, cy, r); }];
    if (mode === 'faire') {
      return {
        mode, prompt: 'Dans quel tiroir tombe le résultat ?', answer: G.grade(P.m), fixedOrder: true,
        scene: (ctx, w, h, now, anim) => row(ctx, w, h, cells(anim == null ? question : (ctx, cx, cy, r) => G.drawBlade(ctx, cx, cy, r * 0.85, P, { alpha: ease(anim) }))),
        options: [0, 1, 2, 3].map((g) => (ctx, w, h) => G.drawerCard(ctx, w, h, g)),
      };
    }
    const pool = [G.blade(P.m, -P.s), G.blade(A.m | B.m, P.s), G.blade(A.m & B.m || 0, P.s), A, B, G.blade(R.pick([0, ...ALL_BLADES]), sgn()), G.blade(R.pick(ALL_BLADES), sgn())];
    const { vals, answer } = choices(R, P, pool, 4, G.bkey);
    return {
      mode, prompt: 'Que donne cette multiplication ?', answer,
      scene: (ctx, w, h, now, anim) => row(ctx, w, h, cells(anim == null ? question : (ctx, cx, cy, r) => G.drawBlade(ctx, cx, cy, r * 0.85, P, { alpha: ease(anim) }))),
      options: vals.map(bladeCard),
    };
  },
};

// =====================================================================================
// 3. Le cube et la flèche : i × flèche = le tapis qui tourne autour d'elle (dualité ; B est un tapis)
const NEG_I = G.blade(7, -1);
const cube = {
  id: 'cube', name: 'Le cube qui change les flèches', icon: '🎲',
  gen(lvl, R, mode) {
    const inverse = mode === 'faire' || lvl === 4;
    if (inverse) {
      // i × ? = ce tapis  →  ? = −i × tapis
      const T = G.blade(R.pick(G.PLANES), lvl <= 1 ? 1 : R.pick([1, -1])), a = G.mul(NEG_I, T);
      const pool = [G.blade(a.m, -a.s), ...G.AXES.flatMap((m) => [G.blade(m, 1), G.blade(m, -1)])];
      const { vals, answer } = choices(R, a, lvl <= 1 ? pool.filter((b) => b.s === a.s) : pool, 4, G.bkey);
      return {
        mode, prompt: 'Le cube magique a changé une flèche en ce tapis. Quelle flèche ?', answer,
        scene: (ctx, w, h, now, anim) => row(ctx, w, h, [bladeCell(G.I), '×', (ctx, cx, cy, r) => { box(ctx, cx, cy, r); if (anim == null) question(ctx, cx, cy, r); else G.drawBlade(ctx, cx, cy, r * 0.85, a, { alpha: ease(anim) }); }, '=',
          (ctx, cx, cy, r) => { G.drawBlade(ctx, cx, cy, r * 0.85, T); if (anim != null) G.drawBlade(ctx, cx, cy, r * 0.85, a, { showAxes: false, alpha: 0.8 * ease(anim) }); }]),
        options: vals.map(bladeCard),
      };
    }
    const a = G.blade(R.pick(G.AXES), lvl <= 2 ? 1 : R.pick([1, -1])), T = G.mul(G.I, a);
    const pool = lvl === 1 ? G.PLANES.map((m) => G.blade(m, T.s)) : G.PLANES.flatMap((m) => [G.blade(m, 1), G.blade(m, -1)]);
    const { vals, answer } = choices(R, T, [G.blade(T.m, -T.s), ...pool], lvl === 1 ? 3 : 4, G.bkey);
    return {
      mode, prompt: 'Le cube magique change la flèche en tapis. Lequel ?', answer,
      scene: (ctx, w, h, now, anim) => row(ctx, w, h, [bladeCell(G.I), '×', bladeCell(a), '=', (ctx, cx, cy, r) => {
        box(ctx, cx, cy, r);
        if (anim == null) return question(ctx, cx, cy, r);
        G.drawBlade(ctx, cx, cy, r * 0.85, T, { alpha: ease(anim) });
        G.drawBlade(ctx, cx, cy, r * 0.85, a, { showAxes: false, alpha: 0.8 * ease(anim) });
      }]),
      options: vals.map(bladeCard),
    };
  },
};

// =====================================================================================
// 4. La balance des tiroirs : égal = égal dans CHAQUE tiroir (une équation → quatre lois)
const BAL = { 1: [0], 2: [0, 1], 3: [0, 1, 3], 4: [0, 1, 3, 7, 4] };
function rearranged(R, us, lvl) {
  const out = us.slice();
  if (R.f() < 0.7) { const b = G.blade(R.pick(BAL[lvl]), R.pick([1, -1])); out.push(b, G.blade(b.m, -b.s)); } // une paire qui s'annule
  return R.shuffle(out);
}
function balanceScene(ctx, w, h, L, Rt, anim, hideRight = false) {
  const pw = w * 0.36, ph = Math.min(h * 0.4, pw * 0.75), y = h * 0.13;
  // fléau
  ctx.save(); ctx.strokeStyle = '#6f4518'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(w / 2, y + ph + 26); ctx.lineTo(w / 2, y); ctx.moveTo(w * 0.07 + pw / 2, y + 6); ctx.lineTo(w * 0.93 - pw / 2, y + 6); ctx.stroke(); ctx.restore();
  G.pile(ctx, w * 0.07, y + 16, pw, ph, L);
  if (hideRight) { G.pile(ctx, w * 0.93 - pw, y + 16, pw, ph, Rt); D.text(ctx, '+ ?', w * 0.93 - pw * 0.12, y + 16 + ph * 0.15, ph * 0.18, '#7b2cbf'); }
  else G.pile(ctx, w * 0.93 - pw, y + 16, pw, ph, Rt);
  const eq = G.mvEq(G.fromUnits(L), G.fromUnits(Rt));
  D.text(ctx, anim == null ? '=?' : eq ? '=' : '≠', w / 2, y + ph * 0.6, ph * 0.3, anim == null ? D.SOFT : eq ? '#2a9d8f' : '#ef476f');
  if (anim != null) { // on range : chaque tiroir se compare
    const pL = G.fromUnits(L), pR = G.fromUnits(Rt), s = Math.min(h - (y + ph + 40), pw * 0.8);
    const marks = [0, 1, 2, 3].map((g) => { const k = (p) => G.mvKey(Object.fromEntries(Object.entries(p).filter(([m]) => G.grade(+m) === g))); return k(pL) === k(pR) ? 'ok' : 'ko'; });
    ctx.save(); ctx.globalAlpha = ease(anim);
    G.drawers(ctx, w * 0.07 + (pw - s) / 2, y + ph + 34, s, s, pL, marks);
    G.drawers(ctx, w * 0.93 - pw + (pw - s) / 2, y + ph + 34, s, s, pR, marks);
    ctx.restore();
  }
}
const balance = {
  id: 'balance', name: 'La balance des tiroirs', icon: '⚖️',
  gen(lvl, R, mode) {
    const n = lvl === 1 ? 3 : 3 + R.int(2);
    const L = Array.from({ length: n }, () => G.blade(R.pick(BAL[lvl]), R.pick([1, 1, -1])));
    const pL = G.fromUnits(L);
    if (mode === 'faire') {
      // il manque une chose à droite (ou rien)
      const d = R.f() < 0.15 ? null : L[R.int(L.length)];
      let Rt = G.units(G.mvAdd(pL, d ? { [d.m]: -d.s } : {}));
      Rt = rearranged(R, Rt, lvl);
      const good = d || G.blade(-1);
      const pool = [G.blade(-1), ...BAL[lvl].flatMap((m) => [G.blade(m, 1), G.blade(m, -1)])];
      const { vals, answer } = choices(R, good, pool, 4, G.bkey);
      return {
        mode, prompt: 'Qu’ajouter à droite pour que la balance soit juste ?', answer,
        scene: (ctx, w, h, now, anim) => balanceScene(ctx, w, h, L, anim == null || !d ? Rt : [...Rt, d], anim, anim == null),
        options: vals.map(bladeCard),
      };
    }
    const equal = R.f() < 0.5;
    let Rt = G.units(pL);
    if (!equal && !Rt.length) Rt = [G.blade(R.pick(BAL[lvl]), R.pick([1, -1]))];
    else if (!equal) {
      Rt = retry(() => {
        const r = Rt.slice(), i = R.int(r.length);
        if (lvl === 1 || R.f() < 0.4) r[i] = G.blade(r[i].m, -r[i].s); // signe changé
        else r[i] = G.blade(R.pick(BAL[lvl].filter((m) => m !== r[i].m)), r[i].s); // une chose d'une autre sorte
        return G.mvEq(G.fromUnits(r), pL) ? null : r;
      });
    }
    Rt = rearranged(R, Rt, lvl);
    return {
      mode: 'prevoir', prompt: 'Les deux paniers sont-ils égaux ?', answer: equal ? 0 : 1, fixedOrder: true,
      scene: (ctx, w, h, now, anim) => balanceScene(ctx, w, h, L, Rt, anim),
      options: ['=', '≠'].map((s, i) => (ctx, w, h) => D.text(ctx, s, w / 2, h / 2, Math.min(w, h) * 0.55, i ? '#ef476f' : '#2a9d8f')),
    };
  },
};

// =====================================================================================
// 5. Le temps, une flèche de plus : le voyage d'une coccinelle dessiné dans l'espace-temps
function trip(R, lvl) {
  return retry(() => {
    const nSeg = lvl <= 2 ? 1 : lvl === 3 ? 2 : 3;
    const speeds = lvl === 2 ? [-1.4, -0.5, 0, 0.5, 1.4] : [-1.4, 0, 1.4];
    const vs = Array.from({ length: nSeg }, () => R.pick(speeds));
    if (nSeg > 1 && vs.every((v) => v === vs[0])) return null;
    const x0 = Math.round(rnd(R, -0.8, 0.8) * 5) / 5;
    const xs = [x0];
    vs.forEach((v) => xs.push(xs[xs.length - 1] + v / nSeg));
    if (xs.some((x) => Math.abs(x) > 0.85)) return null;
    return { vs, xs };
  });
}
const posAt = (tr, t) => { const n = tr.vs.length, k = Math.min(n - 1, Math.floor(t * n)); return tr.xs[k] + tr.vs[k] * (t - k / n); };
const tripKey = (tr) => [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(posAt(tr, t) * 10)).join(',');
function worldline(ctx, x, y, w, h, tr, upto = 1, bugAt = upto) {
  const X = (p) => x + w * (0.12 + 0.82 * (p + 1) / 2), T = (t) => y + h * (0.9 - 0.8 * t);
  ctx.save(); ctx.strokeStyle = 'rgba(123,111,168,.6)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x + w * 0.06, T(0)); ctx.lineTo(x + w * 0.97, T(0)); ctx.stroke();
  ctx.restore();
  D.arrowPx(ctx, x + w * 0.06, T(0), 0, -(T(0) - T(1.05)), 'rgba(123,111,168,.8)', 2);
  D.text(ctx, '⏳', x + w * 0.06, T(1.12), Math.min(w, h) * 0.08);
  ctx.save(); ctx.strokeStyle = '#c9184a'; ctx.lineWidth = Math.max(3, Math.min(w, h) * 0.035); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  for (let k = 0; k <= 60 * upto; k++) { const t = k / 60; const px = X(posAt(tr, t)), py = T(t); k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
  ctx.stroke(); ctx.restore();
  D.drawGlyph(ctx, 'ladybug', X(posAt(tr, bugAt)), T(bugAt), Math.min(w, h) * 0.06, 90);
}
const temps = {
  id: 'temps', name: 'Le temps, une flèche de plus', icon: '⏳',
  gen(lvl, R, mode) {
    if (mode === 'faire') {
      const kinds = [
        { prompt: 'Trouve tous les dessins où la coccinelle ne bouge jamais !', ok: (tr) => tr.vs.every((v) => v === 0) },
        { prompt: 'Trouve tous les dessins où la coccinelle revient à son point de départ !', ok: (tr) => Math.abs(tr.xs[tr.xs.length - 1] - tr.xs[0]) < 0.01 },
        { prompt: 'Trouve tous les dessins où la coccinelle va toujours vers la droite !', ok: (tr) => tr.vs.every((v) => v > 0) },
      ];
      const kind = lvl <= 2 ? kinds[R.pick([0, 2])] : R.pick(kinds);
      const trs = retry(() => {
        const out = [], seen = new Set();
        for (let t = 0; t < 400 && out.length < 4; t++) {
          const want = out.filter(kind.ok).length < 1 + R.int(2);
          const tr = want && R.f() < 0.6 ? retry(() => { const x = trip(R, R.pick([1, 2, lvl])); return kind.ok(x) ? x : null; }) : trip(R, R.pick([lvl, Math.max(1, lvl - 1)]));
          if (!seen.has(tripKey(tr))) { seen.add(tripKey(tr)); out.push(tr); }
        }
        const k = out.filter(kind.ok).length;
        return out.length === 4 && k >= 1 && k <= 3 ? out : null;
      });
      return {
        mode, prompt: kind.prompt, answer: { all: trs.map((tr, i) => (kind.ok(tr) ? i : -1)).filter((i) => i >= 0) },
        scene: (ctx, w, h, now) => { // rappel : comment on lit un dessin d'espace-temps
          const tr = { vs: [1.4], xs: [-0.7, 0.7] }, t = Math.min(1, ((now / 1000) % 3.2) / 2.4);
          const s = Math.min(w * 0.45, h * 0.9);
          filmTrack(ctx, w * 0.04, h * 0.35, w * 0.42, h * 0.3, tr, t);
          worldline(ctx, w * 0.52, (h - s) / 2, s, s, tr, t);
        },
        options: trs.map((tr) => (ctx, w, h) => worldline(ctx, 0, 0, w, h, tr, 1, 0)),
      };
    }
    const tr = trip(R, lvl);
    const mirror = { vs: tr.vs.map((v) => -v), xs: tr.xs.map((x) => -x) };
    const back = { vs: tr.vs.slice().reverse().map((v) => -v), xs: tr.xs.slice().reverse() };
    const others = [mirror, back, ...Array.from({ length: 6 }, () => trip(R, lvl))];
    const { vals, answer } = choices(R, tr, others, lvl === 1 ? 3 : 4, tripKey);
    const st = {};
    return {
      mode: 'prevoir', prompt: 'Regarde le film : quel dessin raconte le voyage de la coccinelle ?', answer,
      scene: (ctx, w, h, now, anim) => {
        if (anim != null) st.r0 ??= now; else st.r0 = null;
        const t = anim == null ? Math.min(1, ((now / 1000) % 3.6) / 2.8) : Math.min(1, (now - st.r0) / 2400);
        const s = Math.min(w * 0.45, h * 0.9);
        filmTrack(ctx, w * 0.04, h * 0.35, w * 0.42, h * 0.3, tr, t);
        if (anim == null) { D.text(ctx, '?', w * 0.52 + s / 2, h / 2, s * 0.4, '#c9b8ea'); return; }
        worldline(ctx, w * 0.52, (h - s) / 2, s, s, tr, t);
      },
      options: vals.map((x) => (ctx, w, h) => worldline(ctx, 0, 0, w, h, x, 1, 0)),
    };
  },
};
/** Le film : une piste horizontale, la coccinelle dessus, et une horloge. */
function filmTrack(ctx, x, y, w, h, tr, t) {
  ctx.save(); ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(123,111,168,.4)'; ctx.lineWidth = 2;
  D.roundRect(ctx, x, y, w, h, 14); ctx.fill(); ctx.stroke(); ctx.restore();
  const X = (p) => x + w * (0.12 + 0.82 * (p + 1) / 2), Y = y + h * 0.62;
  ctx.save(); ctx.strokeStyle = '#80c66a'; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x + w * 0.06, Y + h * 0.12); ctx.lineTo(x + w * 0.97, Y + h * 0.12); ctx.stroke(); ctx.restore();
  D.drawGlyph(ctx, 'ladybug', X(posAt(tr, t)), Y - h * 0.05, h * 0.16, 90);
  // horloge
  const cx = x + w * 0.1, cy = y + h * 0.25, r = h * 0.15;
  ctx.save(); ctx.fillStyle = '#fff'; ctx.strokeStyle = D.INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,209,102,.8)'; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + t * 2 * Math.PI); ctx.closePath(); ctx.fill();
  ctx.restore();
}

// =====================================================================================
// 6. La clôture : sans rien voir dedans, le bord dit ce qui s'y cache (Gauss, Stokes… et Cauchy)
const { Q, W, U } = D;
function hiddenField(R, kind) {
  const P = [rnd(R, -0.2, 0.2), rnd(R, -0.2, 0.2)];
  if (kind === 'q+') return [Q(...P, 1)];
  if (kind === 'q-') return [Q(...P, -1)];
  if (kind === 'w+') return [W(...P, 1)];
  if (kind === 'w-') return [W(...P, -1)];
  return outsideField(R);
}
/** Un vent fabriqué hors de la clôture (dedans : rien). */
function outsideField(R) {
  const a = R.int(8) * Math.PI / 4, far = [Math.cos(a) * 1.6, Math.sin(a) * 1.6];
  return R.pick([
    () => [U(Math.cos(a) * 0.8, Math.sin(a) * 0.8)],
    () => [Q(...far, R.pick([2, -2]))],
    () => [W(...far, R.pick([2, -2]))],
  ])();
}
const N_FENCE = 9;
function fenceBoard(ctx, v, things, fog = 1, n = N_FENCE) {
  const f = D.fieldOf(things), mref = D.refMag(f);
  D.board(ctx, v);
  ctx.save(); D.clip(ctx, v);
  D.arrows(ctx, v, f, { n, mref, color: 'rgba(61,44,107,.75)' });
  if (fog > 0) {
    const c = (2 * v.s) / n;
    ctx.globalAlpha = fog;
    ctx.fillStyle = '#eef1f8';
    D.roundRect(ctx, v.cx - v.s + c, v.cy - v.s + c, 2 * v.s - 2 * c, 2 * v.s - 2 * c, c * 0.4); ctx.fill();
    for (const [x, y] of [[-0.35, 0.3], [0.3, 0.35], [0, -0.05], [-0.3, -0.4], [0.35, -0.35]]) D.drawGlyph(ctx, 'cloud', v.X(x), v.Y(y), v.s * 0.22);
  }
  ctx.restore();
  // la clôture
  const c = (2 * v.s) / n;
  ctx.save(); ctx.strokeStyle = '#8d5a2b'; ctx.lineWidth = Math.max(2, v.s * 0.02); ctx.setLineDash([v.s * 0.05, v.s * 0.03]);
  D.roundRect(ctx, v.cx - v.s + c, v.cy - v.s + c, 2 * v.s - 2 * c, 2 * v.s - 2 * c, c * 0.4); ctx.stroke(); ctx.restore();
}
const thingIcon = (kind) => (ctx, w, h) => {
  const r = Math.min(w, h) * 0.2;
  if (kind === 'q+') D.source(ctx, w / 2, h / 2, r, 1);
  else if (kind === 'q-') D.source(ctx, w / 2, h / 2, r, -1);
  else if (kind === 'w+') D.whirlThing(ctx, w / 2, h / 2, r * 1.6, 1);
  else if (kind === 'w-') D.whirlThing(ctx, w / 2, h / 2, r * 1.6, -1);
  else D.nothing(ctx, w / 2, h / 2, r);
};
const borderSig = (things) => { const f = D.fieldOf(things), out = []; for (let i = 0; i < 8; i++) { const a = (i / 8) * 2 * Math.PI; const [x, y] = f(0.85 * Math.cos(a), 0.85 * Math.sin(a)); out.push(Math.atan2(y, x)); } return out; };
const sigDiff = (a, b) => Math.max(...a.map((x, i) => Math.abs(((x - b[i] + 3 * Math.PI) % (2 * Math.PI)) - Math.PI)));
const cloture = {
  id: 'cloture', name: 'La clôture', icon: '🚧',
  gen(lvl, R, mode) {
    if (mode === 'faire') {
      const kinds = retry(() => { const k = Array.from({ length: 4 }, () => R.pick(lvl === 1 ? ['q+', 'q-', '0', '0'] : lvl === 2 ? ['w+', 'w-', '0', '0'] : ['q+', 'q-', 'w+', 'w-', '0', '0'])); const h = k.filter((x) => x !== '0').length; return h >= 1 && h <= 3 ? k : null; });
      const fields = kinds.map((k) => hiddenField(R, k));
      return {
        mode, prompt: 'Trouve tous les jardins où quelque chose se cache derrière la clôture !',
        answer: { all: kinds.map((k, i) => (k !== '0' ? i : -1)).filter((i) => i >= 0) },
        scene: (ctx, w, h) => { // ce qu'on cherche : une fontaine, un trou ou un tourbillon, caché sous les nuages
          const r = Math.min(w / 8, h / 3);
          D.source(ctx, w * 0.2, h / 2, r * 0.45, 1); D.source(ctx, w * 0.4, h / 2, r * 0.45, -1); D.whirlThing(ctx, w * 0.6, h / 2, r * 0.9, 1);
          D.drawGlyph(ctx, 'cloud', w * 0.8, h / 2, r); D.text(ctx, '?', w * 0.8, h / 2, r * 0.7, D.VIOLET);
        },
        options: fields.map((th) => (ctx, w, h) => fenceBoard(ctx, D.view(w, h, w / 2, h / 2, Math.min(w, h) * 0.94), th, 1, 7)),
      };
    }
    if (lvl === 4) { // Cauchy : rien dedans, le bord suffit à deviner tout l'intérieur
      const fields = retry(() => {
        const fs = [outsideField(R), outsideField(R), outsideField(R)], sg = fs.map(borderSig);
        return sigDiff(sg[0], sg[1]) > 0.8 && sigDiff(sg[0], sg[2]) > 0.8 && sigDiff(sg[1], sg[2]) > 0.8 ? fs : null;
      });
      const good = fields[0], order = R.shuffle([0, 1, 2]);
      return {
        mode: 'prevoir', prompt: 'Rien n’est caché dedans. Quel vent souffle derrière la clôture ?', answer: order.indexOf(0),
        scene: (ctx, w, h, now, anim) => fenceBoard(ctx, D.view(w, h), good, anim == null ? 1 : 1 - ease(anim)),
        options: order.map((i) => (ctx, w, h) => { const v = D.view(w, h, w / 2, h / 2, Math.min(w, h) * 0.94); D.board(ctx, v); ctx.save(); D.clip(ctx, v); D.arrows(ctx, v, D.fieldOf(fields[i]), { n: 7, color: 'rgba(61,44,107,.75)' }); ctx.restore(); }),
      };
    }
    const opts = lvl === 1 ? ['q+', 'q-', '0'] : lvl === 2 ? ['w+', 'w-', '0'] : null;
    const kind = R.pick(opts || ['q+', 'q-', 'w+', 'w-', '0']);
    const things = hiddenField(R, kind);
    const { vals, answer } = opts ? { vals: opts, answer: opts.indexOf(kind) } : choices(R, kind, ['q+', 'q-', 'w+', 'w-', '0'], 4, String);
    return {
      mode: 'prevoir', prompt: 'Regarde le vent sur la clôture : qu’y a-t-il caché dedans ?', answer, fixedOrder: !!opts,
      scene: (ctx, w, h, now, anim) => {
        const v = D.view(w, h);
        fenceBoard(ctx, v, things, anim == null ? 1 : 1 - ease(anim));
        if (anim != null) for (const t of things) {
          if (Math.abs(t.x ?? 9) > 1) continue;
          if (t.k === 'q') D.source(ctx, v.X(t.x), v.Y(t.y), v.s * 0.07, t.q, ease(anim));
          if (t.k === 'w') D.whirlThing(ctx, v.X(t.x), v.Y(t.y), v.s * 0.14, t.w, ease(anim));
        }
      },
      options: vals.map(thingIcon),
    };
  },
};

export const GAMES = [panier, tiroir, cube, balance, temps, cloture];
