// Rendu (vue plongeante, Canvas 2D), animations et gestes d'une partie de cubes qui roulent.
import { Level, FACES, DIRS, ROLL_AXIS, mul, apply, rotX, rotY, rotZ, topFacing } from './cube.js';
import { drawGlyph, roundRect } from './glyphs.js';

const TILT = 0.62;                 // inclinaison de la caméra (radians)
const CT = Math.cos(TILT), ST = Math.sin(TILT);
const HALF = 0.42;                 // demi-côté d'un cube (case = 1)
const LIGHT = norm([-0.4, -0.5, 1]);
const FACE_BG = ['#ffe3ec', '#d6ecff', '#fff1c1', '#dff5e3', '#ffe3c4', '#e7dbff'];
const DIR_ANGLE = { E: 0, N: 90, W: 180, S: 270 };

function norm(v) { const l = Math.hypot(...v); return v.map((x) => x / l); }
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

/** Les 4 sommets d'une face (repère local du cube). */
function faceVerts(f) {
  const n = f.n, u = f.u, r = f.r, h = HALF;
  const c = n.map((x) => x * h);
  return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => [0, 1, 2].map((k) => c[k] + (r[k] * a + u[k] * b) * h));
}
const FACE_VERTS = FACES.map(faceVerts);

export class Game {
  constructor(stage, def, o = {}) {
    this.o = o;
    this.level = new Level(def);
    this.def = def;
    this.state = this.level.initialState();
    this.history = [];
    this.sel = 0;
    this.busy = false;
    this.won = false;
    this.fx = [];
    this.stage = stage;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'board-canvas';
    stage.append(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.textures = def.cubes.map((c, ci) => c.faces.map((g, i) => this.makeTexture(g, FACE_BG[(i + ci * 2) % FACE_BG.length])));
    this.vis = this.state.cubes.map((c) => ({ x: c.x, r: c.r, z: 0, M: c.M.slice() }));
    this.solution = this.level.solve();
    this.par = this.solution?.par ?? 0;
    this.bindInput();
    this.ro = new ResizeObserver(() => this.layout());
    this.ro.observe(stage);
    this.layout();
    this.frame = this.frame.bind(this);
    this.raf = requestAnimationFrame(this.frame);
  }

  destroy() { cancelAnimationFrame(this.raf); this.ro.disconnect(); this.canvas.remove(); window.removeEventListener('keydown', this._key); }
  sound(n) { this.o.sound?.(n); }

  makeTexture(g, bg) {
    const T = 192, c = document.createElement('canvas');
    c.width = c.height = T;
    const x = c.getContext('2d');
    const gr = x.createRadialGradient(T / 2, T * 0.4, 10, T / 2, T / 2, T * 0.75);
    gr.addColorStop(0, '#fff'); gr.addColorStop(1, bg);
    x.fillStyle = gr; x.fillRect(0, 0, T, T);
    drawGlyph(x, g, T / 2, T / 2, T * 0.36);
    return c;
  }

  // ------------------------------------------------------------ disposition
  layout() {
    const W = this.stage.clientWidth, H = this.stage.clientHeight;
    if (!W || !H) return;
    this.dpr = Math.min(devicePixelRatio || 1, 2.5);
    this.canvas.width = Math.round(W * this.dpr); this.canvas.height = Math.round(H * this.dpr);
    this.canvas.style.width = W + 'px'; this.canvas.style.height = H + 'px';
    this.W = W; this.H = H;
    const L = this.level;
    // étendue projetée du plateau : largeur L.W, hauteur L.H·cos + hauteur des cubes
    const k = Math.min((W - 24) / L.W, (H - 24) / (L.H * CT + 1.0 * ST + 0.4), 110);
    this.k = k;
    this.ox = (W - L.W * k) / 2 + k / 2;
    this.oy = (H - (L.H * CT) * k) / 2 + (0.5 * CT) * k + 0.6 * ST * k;
  }

  /** Projection d'un point monde (x est, y nord, z haut) — y = -r pour la grille. */
  P(x, y, z) { return [this.ox + x * this.k, this.oy - (y * CT + z * ST) * this.k]; }
  pv(v) { return [v[0] * this.k, -(v[1] * CT + v[2] * ST) * this.k]; }

  // ------------------------------------------------------------ rendu
  frame(now) {
    this.raf = requestAnimationFrame(this.frame);
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.W, this.H);
    this.now = now;
    this.drawFloor(now);
    // objets en relief triés du nord (loin) vers le sud (près)
    const items = [];
    const L = this.level;
    for (let r = 0; r < L.H; r++) for (let x = 0; x < L.W; x++) if (L.tile(x, r) === '#') items.push({ depth: r, kind: 'wall', x, r });
    this.vis.forEach((v, i) => items.push({ depth: v.r + 0.01, kind: 'cube', i }));
    items.sort((a, b) => a.depth - b.depth);
    for (const it of items) it.kind === 'wall' ? this.drawWall(it.x, it.r) : this.drawCube(it.i, now);
    this.drawFx(now);
  }

  quad(pts) {
    const ctx = this.ctx;
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
  }
  cell(x, r, z = 0, inset = 0) {
    const a = 0.5 - inset;
    return [this.P(x - a, -r + a, z), this.P(x + a, -r + a, z), this.P(x + a, -r - a, z), this.P(x - a, -r - a, z)];
  }

  /** Dessine un glyphe à plat sur le sol (case x, r), tourné vers dirDeg. */
  floorGlyph(g, x, r, size, dirDeg, alpha) {
    const ctx = this.ctx, k = this.k;
    const [cx, cy] = this.P(x, -r, 0.001);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.setTransform(this.dpr * k, 0, 0, this.dpr * k * CT, this.dpr * cx, this.dpr * cy);
    drawGlyph(ctx, g, 0, 0, size, dirDeg);
    ctx.restore();
  }

  drawFloor(now) {
    const ctx = this.ctx, L = this.level;
    for (let r = 0; r < L.H; r++) for (let x = 0; x < L.W; x++) {
      const t = L.tile(x, r);
      if (t === ' ' || t === '#') continue;
      this.quad(this.cell(x, r, 0, 0.02));
      if (t === '~') {
        ctx.fillStyle = `hsl(205, 75%, ${58 + 4 * Math.sin(now / 500 + x + r)}%)`;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2;
        const [ax, ay] = this.P(x - 0.3, -r + 0.1 * Math.sin(now / 400 + x), 0);
        const [bx, by] = this.P(x + 0.3, -r + 0.1 * Math.sin(now / 400 + x), 0);
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo((ax + bx) / 2, ay - 6, bx, by); ctx.stroke();
      } else if (t === '*') {
        ctx.fillStyle = '#dff6ff'; ctx.fill();
        ctx.strokeStyle = 'rgba(120,190,230,.8)'; ctx.lineWidth = 1.5;
        const [ax, ay] = this.P(x - 0.25, -r - 0.1, 0), [bx, by] = this.P(x + 0.05, -r + 0.25, 0);
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
      } else {
        ctx.fillStyle = (x + r) % 2 ? '#bfe3a6' : '#b2db96'; ctx.fill();
      }
      if (t === '@') {
        const [cx, cy] = this.P(x, -r, 0);
        ctx.save();
        ctx.translate(cx, cy); ctx.scale(1, CT);
        ctx.rotate(now / 600);
        ctx.strokeStyle = '#ff9a2e'; ctx.lineWidth = 5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(0, 0, this.k * 0.3, 0.3, Math.PI * 1.6); ctx.stroke();
        ctx.fillStyle = '#ff9a2e';
        const a = Math.PI * 1.6, R = this.k * 0.3;
        ctx.beginPath(); ctx.moveTo(Math.cos(a) * R + 10 * Math.cos(a + 1.57), Math.sin(a) * R + 10 * Math.sin(a + 1.57));
        ctx.lineTo(Math.cos(a) * (R - 9), Math.sin(a) * (R - 9)); ctx.lineTo(Math.cos(a) * (R + 9), Math.sin(a) * (R + 9)); ctx.fill();
        ctx.restore();
      }
    }
    // poissons dorés
    L.fish.forEach(([x, r], k) => {
      if (this.state.fish[k]) return;
      const [cx, cy] = this.P(x, -r, 0.25 + 0.06 * Math.sin(now / 300));
      ctx.save(); ctx.shadowColor = '#ffd166'; ctx.shadowBlur = 18;
      drawGlyph(ctx, 'fish', cx, cy, this.k * 0.24, 0);
      ctx.restore();
      ctx.save(); ctx.globalCompositeOperation = 'source-atop'; ctx.restore();
    });
    // maisons
    for (const h of this.def.houses) {
      const ok = this.level.houseOk(this.state, h);
      this.quad(this.cell(h.x, h.r, 0.002, 0.06));
      ctx.save();
      ctx.setLineDash([7, 6]);
      ctx.lineWidth = 3;
      ctx.strokeStyle = ok ? '#2a9d8f' : `rgba(123,44,191,${0.55 + 0.25 * Math.sin(now / 300)})`;
      ctx.fillStyle = ok ? 'rgba(42,157,143,.25)' : 'rgba(255,255,255,.35)';
      ctx.fill(); ctx.stroke();
      ctx.restore();
      this.floorGlyph(h.g, h.x, h.r, 0.3, h.dir ? DIR_ANGLE[h.dir] : 0, 0.45);
      if (!h.dir) {
        const [cx, cy] = this.P(h.x + 0.3, -h.r - 0.3, 0);
        ctx.save(); ctx.font = `${Math.round(this.k * 0.22)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(123,44,191,.7)'; ctx.fillText('↻', cx, cy); ctx.restore();
      }
    }
    // cube sélectionné : anneau au sol
    const v = this.vis[this.sel];
    if (v && this.def.cubes.length > 1) {
      const sel = [this.sel];
      const tw = this.def.cubes[this.sel].twin;
      if (tw != null) sel.push(tw);
      for (const i of sel) {
        const w = this.vis[i];
        const [cx, cy] = this.P(w.x, -w.r, 0);
        ctx.save(); ctx.translate(cx, cy); ctx.scale(1, CT);
        ctx.strokeStyle = `rgba(255,209,102,${0.7 + 0.3 * Math.sin(now / 250)})`; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.arc(0, 0, this.k * 0.58, 0, 7); ctx.stroke(); ctx.restore();
      }
    }
  }

  drawWall(x, r) {
    const ctx = this.ctx, h = 0.28;
    const top = this.cell(x, r, h, 0.02), front = [this.P(x - 0.48, -r - 0.48, h), this.P(x + 0.48, -r - 0.48, h), this.P(x + 0.48, -r - 0.48, 0), this.P(x - 0.48, -r - 0.48, 0)];
    this.quad(front); ctx.fillStyle = '#4f8a3c'; ctx.fill();
    this.quad(top); ctx.fillStyle = '#6fb35a'; ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.18)';
    const [cx, cy] = this.P(x - 0.12, -r + 0.12, h);
    ctx.beginPath(); ctx.ellipse(cx, cy, this.k * 0.14, this.k * 0.09 * CT, 0, 0, 7); ctx.fill();
  }

  drawCube(i, now) {
    const ctx = this.ctx, v = this.vis[i], k = this.k;
    const inWater = this.level.tile(Math.round(v.x), Math.round(v.r)) === '~' && !v.anim;
    const bob = inWater ? -0.18 + 0.04 * Math.sin(now / 350 + i) : 0;
    const center = [v.x, -v.r, HALF + v.z + bob];
    // ombre
    const [sx, sy] = this.P(v.x, -v.r, 0);
    ctx.fillStyle = 'rgba(40,30,80,.18)';
    ctx.beginPath(); ctx.ellipse(sx, sy, k * 0.48, k * 0.48 * CT, 0, 0, 7); ctx.fill();
    const view = [0, -ST, CT];
    const order = FACES.map((f, fi) => ({ fi, n: apply(v.M, f.n) })).filter((o) => o.n[0] * view[0] + o.n[1] * view[1] + o.n[2] * view[2] > 0.01);
    for (const { fi, n } of order) {
      const f = FACES[fi];
      const pts = FACE_VERTS[fi].map((p) => { const w = apply(v.M, p); return this.P(center[0] + w[0], center[1] + w[1], center[2] + w[2]); });
      ctx.save();
      this.quad(pts);
      ctx.save();
      ctx.clip();
      const tex = this.textures[i][fi], T = tex.width, S = 2 * HALF;
      const up = apply(v.M, f.u), rt = apply(v.M, f.r), c = apply(v.M, f.n.map((x) => x * HALF));
      const pr = this.pv(rt), pu = this.pv(up);
      const [ex, ey] = this.P(center[0] + c[0] - (rt[0] - up[0]) * HALF, center[1] + c[1] - (rt[1] - up[1]) * HALF, center[2] + c[2] - (rt[2] - up[2]) * HALF);
      ctx.setTransform(this.dpr * pr[0] * S / T, this.dpr * pr[1] * S / T, -this.dpr * pu[0] * S / T, -this.dpr * pu[1] * S / T, this.dpr * ex, this.dpr * ey);
      ctx.drawImage(tex, 0, 0);
      ctx.restore();
      const l = Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);
      ctx.fillStyle = `rgba(30,20,70,${(0.45 * (1 - l)).toFixed(3)})`; ctx.fill();
      ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(2, k * 0.035); ctx.strokeStyle = 'rgba(40,28,90,.9)'; ctx.stroke();
      ctx.restore();
    }
    if (inWater) {
      const [wx, wy] = this.P(v.x, -v.r, 0.02);
      ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(wx, wy, k * 0.55 + 3 * Math.sin(now / 300), k * 0.55 * CT, 0, 0.1, Math.PI - 0.1); ctx.stroke(); ctx.restore();
    }
  }

  drawFx(now) {
    const ctx = this.ctx;
    this.fx = this.fx.filter((f) => now - f.t0 < f.life);
    for (const f of this.fx) {
      const t = (now - f.t0) / f.life;
      if (f.kind === 'spark') {
        ctx.save(); ctx.globalAlpha = 1 - t;
        for (let j = 0; j < 10; j++) {
          const a = (j / 10) * 6.28;
          ctx.fillStyle = j % 2 ? '#ffd166' : '#ef476f';
          ctx.beginPath(); ctx.arc(f.x + Math.cos(a) * 60 * t, f.y + Math.sin(a) * 60 * t - 20 * t, 5 * (1 - t) + 1, 0, 7); ctx.fill();
        }
        ctx.restore();
      } else if (f.kind === 'bubble') {
        ctx.save(); ctx.globalAlpha = t < 0.8 ? 1 : (1 - t) / 0.2;
        const y = f.y - 20 * easeOut(Math.min(1, t * 3));
        ctx.fillStyle = '#fff'; ctx.strokeStyle = '#7b2cbf'; ctx.lineWidth = 2;
        roundRect(ctx, f.x - 34, y - 30, 68, 50, 16); ctx.fill(); ctx.stroke();
        drawGlyph(ctx, f.g, f.x - 8, y - 5, 16);
        ctx.font = '700 18px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#7b2cbf';
        ctx.fillText('?', f.x + 18, y - 5);
        ctx.restore();
      }
    }
  }

  // ------------------------------------------------------------ jouer
  async go(dir, ci = this.sel) {
    if (this.busy || this.won) return;
    const res = this.level.move(this.state, ci, dir);
    this.busy = true;
    this.history.push(this.state);
    if (!res.state) {
      this.history.pop();
      const water = res.events.find((e) => e.reason === 'water');
      if (water) {
        const v = this.vis[water.cube];
        const [x, y] = this.P(v.x, -v.r, 1.4);
        this.fx.push({ kind: 'bubble', g: 'dolphin', x, y, t0: performance.now(), life: 1600 });
      }
      await Promise.all(res.events.map((e) => this.bump(e.cube, e.dir)));
      this.sound('bump');
      this.busy = false;
      return;
    }
    // animations : chaque cube joue ses événements, les cubes en même temps
    const byCube = new Map();
    for (const e of res.events) { if (!byCube.has(e.cube)) byCube.set(e.cube, []); byCube.get(e.cube).push(e); }
    await Promise.all([...byCube].map(([i, evs]) => this.animate(i, evs)));
    this.state = res.state;
    this.vis = this.state.cubes.map((c) => ({ x: c.x, r: c.r, z: 0, M: c.M.slice() }));
    this.o.onMove?.(this);
    if (this.level.won(this.state)) {
      this.won = true;
      this.sound('win');
      for (const h of this.def.houses) { const [x, y] = this.P(h.x, -h.r, 1); this.fx.push({ kind: 'spark', x, y, t0: performance.now(), life: 900 }); }
      setTimeout(() => this.o.onWin?.(this), 900);
    }
    this.busy = false;
  }

  tween(ms, fn) {
    return new Promise((res) => {
      const t0 = performance.now();
      const step = () => {
        const t = Math.min(1, (performance.now() - t0) / ms);
        fn(t);
        if (t < 1) requestAnimationFrame(step); else res();
      };
      step();
    });
  }

  async animate(i, evs) {
    const v = this.vis[i];
    v.anim = true;
    for (const e of evs) {
      if (e.type === 'blocked') { await this.bump(i, e.dir); continue; }
      const D = e.dir ? DIRS[e.dir] : null;
      if (e.type === 'roll') {
        this.sound('roll');
        const [axis, sign] = ROLL_AXIS[e.dir];
        const [fx, fr] = e.from;
        await this.tween(230, (t) => {
          const a = ease(t) * sign * Math.PI / 2;
          const R = axis === 'x' ? rotX(a) : rotY(a);
          v.M = mul(R, e.M0);
          v.x = fx + D.dx * ease(t); v.r = fr + D.dr * ease(t);
          v.z = HALF * (Math.SQRT2 - 1) * Math.sin(Math.PI * ease(t));
        });
        v.M = mul(axis === 'x' ? rotX(sign * Math.PI / 2) : rotY(sign * Math.PI / 2), e.M0).map((x) => Math.round(x) + 0);
        v.z = 0;
      } else if (e.type === 'swim' || e.type === 'slide') {
        this.sound(e.type);
        const [fx, fr] = e.from;
        await this.tween(e.type === 'swim' ? 260 : 110, (t) => {
          const k = e.type === 'swim' ? ease(t) : t;
          v.x = fx + D.dx * k; v.r = fr + D.dr * k;
        });
      } else if (e.type === 'spin') {
        this.sound('spin');
        await this.tween(320, (t) => { v.M = mul(rotZ(-ease(t) * Math.PI / 2), e.M0); });
      } else if (e.type === 'fish') {
        this.sound('fish');
        const [x, y] = this.P(v.x, -v.r, 1);
        this.fx.push({ kind: 'spark', x, y, t0: performance.now(), life: 800 });
      }
    }
    v.anim = false;
  }

  bump(i, dir) {
    const v = this.vis[i], D = DIRS[dir];
    const x0 = v.x, r0 = v.r;
    return this.tween(200, (t) => {
      const k = Math.sin(Math.PI * t) * 0.12;
      v.x = x0 + D.dx * k; v.r = r0 + D.dr * k;
    });
  }

  undo() {
    if (this.busy || this.won || !this.history.length) return;
    this.state = this.history.pop();
    this.vis = this.state.cubes.map((c) => ({ x: c.x, r: c.r, z: 0, M: c.M.slice() }));
    this.sound('undo');
    this.o.onMove?.(this);
  }

  /** Indice : rejoue le meilleur coup depuis la position actuelle. */
  hint() {
    if (this.busy || this.won) return null;
    const lv = new Level({ ...this.def, cubes: this.def.cubes.map((c, i) => ({ ...c, x: this.state.cubes[i].x, r: this.state.cubes[i].r, M: this.state.cubes[i].M })) });
    const sol = lv.solve();
    if (!sol || !sol.path.length) return null;
    const m = sol.path[0];
    return { cube: +m[0], dir: m[1] };
  }

  // ------------------------------------------------------------ gestes
  cubeAt(px, py) {
    let best = -1, bd = Infinity;
    this.vis.forEach((v, i) => {
      const [x, y] = this.P(v.x, -v.r, HALF);
      const d = Math.hypot(px - x, py - y);
      if (d < this.k * 0.7 && d < bd) { bd = d; best = i; }
    });
    return best;
  }

  bindInput() {
    const cv = this.canvas;
    const pos = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    let start = null;
    cv.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      try { cv.setPointerCapture(e.pointerId); } catch { /* */ }
      if (start) return;
      const p = pos(e);
      start = { p, id: e.pointerId, cube: this.cubeAt(...p) };
      if (start.cube >= 0 && start.cube !== this.sel) { this.sel = start.cube; this.o.onMove?.(this); }
    });
    const end = (e) => {
      if (!start || e.pointerId !== start.id) return;
      const p = pos(e), dx = p[0] - start.p[0], dy = p[1] - start.p[1];
      start = null;
      if (Math.hypot(dx, dy) < 18) return;
      const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'E' : 'W') : (dy > 0 ? 'S' : 'N');
      this.go(dir);
    };
    cv.addEventListener('pointerup', end);
    cv.addEventListener('pointercancel', () => { start = null; });
    let wheelT = 0, acc = [0, 0];
    cv.addEventListener('wheel', (e) => {
      e.preventDefault();
      const now = performance.now();
      if (now - wheelT < 380) { acc = [0, 0]; return; }
      acc[0] -= e.deltaX; acc[1] -= e.deltaY;
      if (Math.hypot(...acc) > 50) {
        const dir = Math.abs(acc[0]) > Math.abs(acc[1]) ? (acc[0] > 0 ? 'E' : 'W') : (acc[1] > 0 ? 'S' : 'N');
        acc = [0, 0]; wheelT = now;
        this.go(dir);
      }
    }, { passive: false });
    this._key = (e) => {
      const d = { ArrowRight: 'E', ArrowLeft: 'W', ArrowUp: 'N', ArrowDown: 'S' }[e.key];
      if (d) { e.preventDefault(); this.go(d); }
      else if (e.key === 'Tab' && this.def.cubes.length > 1) { e.preventDefault(); this.sel = (this.sel + 1) % this.def.cubes.length; this.o.onMove?.(this); }
      else if ((e.key === 'z' && (e.ctrlKey || e.metaKey)) || e.key === 'Backspace') { e.preventDefault(); this.undo(); }
    };
    window.addEventListener('keydown', this._key);
  }

  stars() {
    const m = this.state.moves, p = this.par;
    let s = 1;
    if (m <= p + Math.ceil(p / 3)) s++;
    if (this.level.fish.length ? this.state.fish.every(Boolean) : m <= p) s++;
    return s;
  }
}

export { topFacing };
