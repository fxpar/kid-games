// Moteur Strange Mind : rendu 3D (Canvas 2D, projection orthographique) + gestes.
//
// Gestes :
//   - glisser (1 ou 2 doigts, souris, défilement 2 doigts du pavé tactile) : la forme BASCULE
//     sur une face voisine (le carré révèle qu'il est un cube…)
//   - tourner 2 doigts, clic droit glissé, Maj+glisser, pincer sur pavé, Maj+molette,
//     ou boutons ↺ ↻ : la face visible TOURNE dans son plan (quart de tour, tiers de tour…)
//   - clavier : flèches = basculer, Q / E = tourner (forme survolée ou dernière touchée)

import { Quat, Z, DEG, norm360, dot, norm } from './math3d.js';
import { SHAPES } from './shapes.js';
import { faceSpec, makeFaceTexture, GLYPH_VALUE } from './glyphs.js';
import { t } from './i18n.js';

const LIGHT = norm([-0.45, 0.6, 1]);
const ANIM_MS = 320;
const ease = (t) => 1 - Math.pow(1 - t, 3);

export class Shape {
  constructor(world, spec) {
    this.world = world;
    this.id = spec.id;
    this.type = spec.type || 'cube';
    this.geo = SHAPES[this.type]();
    this.pos = spec.pos || [0, 0];
    this.size = spec.size || 1;
    this.hidden = !!spec.hidden;
    this.faces = this.geo.faces.map((f, i) => faceSpec(spec.faces?.[i], i));
    this.textures = this.faces.map((s, i) => makeFaceTexture(s, this.geo.faces[i]));
    this.lock({ tumble: 'both', twist: true, twistDirs: [1, -1], twistStep: null, ...spec });
    this.q = new Quat();
    this.show = new Quat();
    this.preview = null;
    this.anim = null;
    this.resetCounters();
    const st = spec.start || {};
    this.setOrientation(st.front ?? 0, st.dir ?? 0, false);
  }

  lock(o) {
    if ('tumble' in o) this.tumbleMode = o.tumble === true ? 'both' : o.tumble === false ? 'none' : o.tumble;
    if ('twist' in o) this.twistOn = !!o.twist;
    if ('twistDirs' in o) this.twistDirs = o.twistDirs;
    if ('twistStep' in o) this.twistStepOverride = o.twistStep;
    this.world?.updateControls();
  }

  resetCounters() {
    this.moves = 0; this.twists = 0; this.turnSum = 0; this.tumbles = 0;
    this.history = [];
  }

  // ---- lecture de l'état ----
  frontIndex(q = this.q) {
    let best = 0, bz = -2;
    this.geo.faces.forEach((f, i) => { const z = q.rot(f.normal)[2]; if (z > bz) { bz = z; best = i; } });
    return best;
  }
  /** angle (degrés, anti-horaire) du "haut" de la face visible : rotation du dessin. */
  dir(q = this.q) {
    const u = q.rot(this.geo.faces[this.frontIndex(q)].up);
    return norm360(Math.atan2(-u[0], u[1]) / DEG);
  }
  front() { return this.faces[this.frontIndex()]; }
  glyph() { return this.front().g; }
  /** valeur complexe [re, im] = v·e^{iθ} */
  value() {
    const s = this.front();
    const v = s.v ?? GLYPH_VALUE[s.g] ?? 1;
    const t = this.dir() * DEG;
    const r = (x) => Math.round(x * 1e6) / 1e6 + 0;
    return [r(v * Math.cos(t)), r(v * Math.sin(t))];
  }

  // ---- orientation ----
  snapped(q, faceIdx) {
    const f = this.geo.faces[faceIdx];
    const q1 = Quat.fromUnitVectors(q.rot(f.normal), Z).mul(q);
    const u = q1.rot(f.up);
    const phi = Math.atan2(-u[0], u[1]) / DEG;
    const step = f.snapStep;
    const target = Math.round(phi / step) * step;
    return Quat.axisAngle(Z, (target - phi) * DEG).mul(q1).normalize();
  }

  setOrientation(faceIdx, dirDeg, animate = true) {
    const f = this.geo.faces[faceIdx];
    const q1 = Quat.fromUnitVectors(f.normal, Z);
    const u = q1.rot(f.up);
    const phi = Math.atan2(-u[0], u[1]) / DEG;
    this.goTo(Quat.axisAngle(Z, (dirDeg - phi) * DEG).mul(q1).normalize(), animate);
  }

  goTo(q, animate = true) {
    if (animate) this.anim = { from: this.show.clone(), to: q, t0: performance.now(), dur: ANIM_MS };
    else { this.show = q.clone(); this.anim = null; }
    this.q = q;
    this.world?.dirty();
  }

  shake() {
    this.anim = { shake: true, t0: performance.now(), dur: 380 };
    this.world?.sound('nope');
    this.world?.dirty();
  }

  /** Basculer vers la face située du côté opposé au glissement (dx, dy en pixels écran). */
  tumble(dx, dy) {
    if (this.tumbleMode === 'none') return this.shake();
    let d = [dx, -dy, 0];
    if (this.tumbleMode === 'h') d = [Math.sign(dx) || 1, 0, 0];
    if (this.tumbleMode === 'v') d = [0, Math.sign(-dy) || 1, 0];
    d = norm(d);
    const fi = this.frontIndex();
    let best = -1, bd = 0.3;
    this.geo.faces.forEach((f, i) => {
      if (i === fi) return;
      const s = dot(this.q.rot(f.normal), [-d[0], -d[1], 0]);
      if (s > bd) { bd = s; best = i; }
    });
    if (best < 0) return this.shake();
    this.goTo(this.snapped(this.q, best));
    this.moves++; this.tumbles++;
    this.history.push(this.dir());
    this.world?.commit(this, 'tumble');
  }

  twistStep() {
    return this.twistStepOverride || this.geo.faces[this.frontIndex()].twistStep;
  }

  /** Tourner la face visible : sign = +1 anti-horaire (↺), -1 horaire (↻). */
  twist(sign) {
    if (!this.twistOn || !this.twistDirs.includes(sign)) return this.shake();
    const q = Quat.axisAngle(Z, sign * this.twistStep() * DEG).mul(this.q);
    this.goTo(this.snapped(q, this.frontIndex(q)));
    this.moves++; this.twists++; this.turnSum += sign;
    this.history.push(this.dir());
    this.world?.commit(this, 'twist');
  }

  tick(now) {
    let busy = false;
    if (this.anim) {
      const t = Math.min(1, (now - this.anim.t0) / this.anim.dur);
      if (this.anim.shake) this.show = Quat.axisAngle(Z, 0.14 * Math.sin(t * 30) * (1 - t)).mul(this.q);
      else this.show = Quat.slerp(this.anim.from, this.anim.to, ease(t));
      if (t >= 1) { this.anim = null; this.show = this.q.clone(); }
      busy = true;
    }
    if (this.pulse) {
      const t = (now - this.pulse) / 600;
      if (t >= 1) this.pulse = null; else busy = true;
    }
    return busy;
  }

  current() { return this.preview ? this.preview.mul(this.show) : this.show; }

  pulseScale(now) {
    if (!this.pulse) return 1;
    const t = (now - this.pulse) / 600;
    return 1 + 0.12 * Math.sin(Math.PI * Math.min(1, t));
  }
}

export class World {
  /**
   * @param {HTMLElement} stage conteneur (position: relative)
   * @param {object} opts { onCommit(shape, kind), sound(name), invertScroll, oneFinger }
   */
  constructor(stage, opts = {}) {
    this.stage = stage;
    this.opts = opts;
    this.shapes = [];
    this.labels = [];
    this.enabled = true;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'world-canvas';
    this.overlay = document.createElement('div');
    this.overlay.className = 'world-overlay';
    stage.append(this.canvas, this.overlay);
    this.ctx = this.canvas.getContext('2d');
    this.k = 100; this.ox = 0; this.oy = 0;
    this.pointers = new Map();
    this.gesture = null;
    this.wheel = { x: 0, y: 0, t: 0, cool: 0, twist: 0 };
    this.lastShape = null;
    this._dirty = true;
    this.bind();
    this.ro = new ResizeObserver(() => this.layout());
    this.ro.observe(stage);
    this.loop = this.loop.bind(this);
    this.raf = requestAnimationFrame(this.loop);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    window.removeEventListener('keydown', this._onKey);
    this.canvas.remove(); this.overlay.remove();
  }

  addShape(spec) {
    const s = new Shape(this, spec);
    this.shapes.push(s);
    s.ui = this.makeControls(s);
    this.layout();
    return s;
  }

  get(id) { return this.shapes.find((s) => s.id === id); }

  addLabel({ pos, text, cls = '' }) {
    const el = document.createElement('div');
    el.className = 'world-label ' + cls;
    el.textContent = text;
    this.overlay.append(el);
    const l = { pos, el };
    this.labels.push(l);
    this.layout();
    return l;
  }

  sound(name) { this.opts.sound?.(name); }
  dirty() { this._dirty = true; }
  commit(shape, kind) { this.sound(kind); this.opts.onCommit?.(shape, kind); }

  // ---------- disposition ----------
  layout() {
    const W = this.stage.clientWidth, H = this.stage.clientHeight;
    if (!W || !H) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    this.dpr = dpr;
    this.canvas.width = Math.round(W * dpr);
    this.canvas.height = Math.round(H * dpr);
    this.canvas.style.width = W + 'px';
    this.canvas.style.height = H + 'px';
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    const grow = (a, b, c, d) => { x0 = Math.min(x0, a); x1 = Math.max(x1, b); y0 = Math.min(y0, c); y1 = Math.max(y1, d); };
    for (const s of this.shapes) {
      if (s.hidden) continue;
      const r = 1.3 * s.size;
      grow(s.pos[0] - r, s.pos[0] + r, s.pos[1] - r - (s.twistOn ? 0.75 : 0), s.pos[1] + r);
    }
    for (const l of this.labels) grow(l.pos[0] - 0.5, l.pos[0] + 0.5, l.pos[1] - 0.5, l.pos[1] + 0.5);
    if (!isFinite(x0)) { x0 = -1; x1 = 1; y0 = -1; y1 = 1; }
    const pad = 12;
    this.k = Math.min((W - 2 * pad) / (x1 - x0), (H - 2 * pad) / (y1 - y0), 165);
    this.ox = W / 2 - ((x0 + x1) / 2) * this.k;
    this.oy = H / 2 + ((y0 + y1) / 2) * this.k;
    for (const l of this.labels) {
      const [x, y] = this.toScreen(l.pos);
      l.el.style.left = x + 'px'; l.el.style.top = y + 'px';
      l.el.style.fontSize = Math.round(this.k * 0.6) + 'px';
    }
    this.updateControls();
    this.dirty();
  }

  toScreen([x, y]) { return [this.ox + x * this.k, this.oy - y * this.k]; }

  // ---------- boutons de rotation sous chaque forme ----------
  makeControls(shape) {
    const bar = document.createElement('div');
    bar.className = 'twistbar';
    const mk = (sign, label, title) => {
      const b = document.createElement('button');
      b.className = 'twistbtn';
      b.textContent = label;
      b.title = title;
      b.addEventListener('pointerdown', (e) => e.stopPropagation());
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!this.enabled || shape.anim) return;
        this.lastShape = shape;
        shape.twist(sign);
      });
      bar.append(b);
      return b;
    };
    const ccw = mk(1, '↺', t('Tourner (sens inverse des aiguilles)'));
    const cw = mk(-1, '↻', t('Tourner (sens des aiguilles)'));
    this.overlay.append(bar);
    return { bar, ccw, cw };
  }

  updateControls() {
    for (const s of this.shapes) {
      if (!s.ui) continue;
      const show = s.twistOn && !s.hidden && !this.hideButtons;
      s.ui.bar.style.display = show ? '' : 'none';
      s.ui.ccw.style.display = s.twistDirs.includes(1) ? '' : 'none';
      s.ui.cw.style.display = s.twistDirs.includes(-1) ? '' : 'none';
      const [x, y] = this.toScreen([s.pos[0], s.pos[1] - 1.42 * s.size]);
      s.ui.bar.style.left = x + 'px';
      s.ui.bar.style.top = y + 'px';
      const bs = Math.max(34, Math.min(56, this.k * 0.42));
      s.ui.bar.style.setProperty('--bs', bs + 'px');
    }
  }

  // ---------- rendu ----------
  loop(now) {
    this.raf = requestAnimationFrame(this.loop);
    let busy = false;
    for (const s of this.shapes) busy = s.tick(now) || busy;
    if (busy || this._dirty || this.gesture) { this.draw(now); this._dirty = false; }
  }

  project(shape, q, v, sc) {
    const p = q.rot(v);
    const K = this.k * this.dpr * shape.size * sc;
    return [
      (this.ox + shape.pos[0] * this.k) * this.dpr + p[0] * K,
      (this.oy - shape.pos[1] * this.k) * this.dpr - p[1] * K,
    ];
  }

  draw(now = performance.now()) {
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (const s of this.shapes) if (!s.hidden) this.drawShape(s, now);
  }

  drawShape(s, now) {
    const ctx = this.ctx, dpr = this.dpr;
    const q = s.current();
    const sc = s.pulseScale(now);
    const K = this.k * dpr * s.size * sc;
    const cx = (this.ox + s.pos[0] * this.k) * dpr, cy = (this.oy - s.pos[1] * this.k) * dpr;
    // ombre douce
    ctx.save();
    ctx.fillStyle = 'rgba(40,30,80,0.13)';
    ctx.beginPath(); ctx.ellipse(cx + K * 0.12, cy + K * 1.18, K * 0.95, K * 0.16, 0, 0, 7); ctx.fill();
    ctx.restore();
    s._screen = [];
    s.geo.faces.forEach((f, i) => {
      const n = q.rot(f.normal);
      if (n[2] <= 0.015) return;
      const pts = f.verts.map((v) => this.project(s, q, v, sc));
      s._screen.push(pts);
      ctx.save();
      ctx.beginPath();
      pts.forEach(([x, y], j) => (j ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      ctx.save();
      ctx.clip();
      // texture : (u,v) pixels -> point de la face
      const T = s.textures[i].width, S = 2 * f.R;
      const up = q.rot(f.up);
      const rt = [up[1] * n[2] - up[2] * n[1], up[2] * n[0] - up[0] * n[2], up[0] * n[1] - up[1] * n[0]];
      const c = q.rot(f.center);
      const a = (K * rt[0] * S) / T, b = (-K * rt[1] * S) / T;
      const cc = (-K * up[0] * S) / T, d = (K * up[1] * S) / T;
      const e = cx + K * (c[0] - rt[0] * S / 2 + up[0] * S / 2);
      const ff = cy - K * (c[1] - rt[1] * S / 2 + up[1] * S / 2);
      ctx.setTransform(a, b, cc, d, e, ff);
      ctx.drawImage(s.textures[i], 0, 0);
      ctx.restore();
      // éclairage
      const l = Math.max(0, dot(n, LIGHT));
      ctx.fillStyle = `rgba(20,10,60,${(0.42 * (1 - l)).toFixed(3)})`;
      ctx.fill();
      ctx.lineJoin = 'round';
      ctx.lineWidth = Math.max(2, K * 0.035);
      ctx.strokeStyle = 'rgba(35,25,80,0.9)';
      ctx.stroke();
      ctx.restore();
    });
  }

  // ---------- détection ----------
  hit(x, y, loose = false) {
    const X = x * this.dpr, Y = y * this.dpr;
    for (let i = this.shapes.length - 1; i >= 0; i--) {
      const s = this.shapes[i];
      if (s.hidden || !s._screen) continue;
      for (const poly of s._screen) if (inPoly(X, Y, poly)) return s;
    }
    if (loose) {
      let best = null, bd = Infinity;
      for (const s of this.shapes) {
        if (s.hidden) continue;
        const [sx, sy] = this.toScreen(s.pos);
        const d = Math.hypot(sx - x, sy - y);
        if (d < this.k * 1.6 * s.size && d < bd) { bd = d; best = s; }
      }
      return best;
    }
    return null;
  }

  // ---------- entrées ----------
  bind() {
    const c = this.canvas;
    const pos = (e) => { const r = c.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };

    c.addEventListener('contextmenu', (e) => e.preventDefault());

    c.addEventListener('pointerdown', (e) => {
      if (!this.enabled) return;
      const p = pos(e);
      this.pointers.set(e.pointerId, p);
      try { c.setPointerCapture(e.pointerId); } catch { /* ignore */ }
      if (!this.gesture) {
        const shape = this.hit(p[0], p[1], e.pointerType === 'touch');
        if (!shape || shape.anim) return;
        this.lastShape = shape;
        const twistMode = e.pointerType === 'mouse' && (e.button === 2 || e.shiftKey);
        this.gesture = { shape, start: p, mode: twistMode ? 'twist' : 'tumble', type: e.pointerType, two: false };
      }
      if (this.gesture && this.pointers.size === 2 && !this.gesture.two) {
        const g = this.gesture;
        const [a, b] = [...this.pointers.values()];
        g.two = true;
        g.mid0 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        g.ang0 = Math.atan2(b[1] - a[1], b[0] - a[0]);
        g.spread = Math.hypot(b[0] - a[0], b[1] - a[1]);
      }
      e.preventDefault();
    });

    c.addEventListener('pointermove', (e) => {
      if (this.pointers.has(e.pointerId)) this.pointers.set(e.pointerId, pos(e));
      else {
        const p = pos(e);
        this.hover = this.hit(p[0], p[1]);
        c.style.cursor = this.hover ? 'grab' : '';
      }
      const g = this.gesture;
      if (!g) return;
      const res = this.readGesture();
      g.res = res;
      const s = g.shape;
      if (res.kind === 'twist') s.preview = Quat.axisAngle(Z, res.angle);
      else if (res.dist > 2) {
        const a = Math.min(res.dist / (this.k * 1.8), 0.9);
        s.preview = Quat.axisAngle([-res.dy, res.dx, 0], a);
      } else s.preview = null;
      this.dirty();
    });

    const end = (e) => {
      this.pointers.delete(e.pointerId);
      const g = this.gesture;
      if (!g || this.pointers.size > 0) return;
      this.gesture = null;
      const s = g.shape, r = g.res;
      const shown = s.preview ? s.preview.mul(s.show) : s.show;
      s.preview = null;
      s.show = shown;
      const before = s.moves;
      if (r) {
        const tooFew = g.type === 'touch' && !g.two && !this.opts.oneFinger;
        if (r.kind === 'twist' && Math.abs(r.angle) > 22 * DEG) s.twist(Math.sign(r.angle));
        else if (r.kind === 'tumble' && r.dist > Math.max(28, this.k * 0.3) && !tooFew) s.tumble(r.dx, -r.dy);
      }
      if (s.moves === before) s.goTo(s.q); // retour en place
      this.dirty();
    };
    c.addEventListener('pointerup', end);
    c.addEventListener('pointercancel', end);

    c.addEventListener('wheel', (e) => this.onWheel(e, pos(e)), { passive: false });

    this._onKey = (e) => {
      if (!this.enabled) return;
      const s = this.hover || this.lastShape || this.shapes.find((x) => !x.hidden);
      if (!s || s.anim || e.target.closest?.('input,textarea')) return;
      const m = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
      if (m) { s.tumble(m[0], m[1]); e.preventDefault(); }
      else if (e.key === 'q' || e.key === 'Q') s.twist(1);
      else if (e.key === 'e' || e.key === 'E') s.twist(-1);
    };
    window.addEventListener('keydown', this._onKey);
  }

  /** Analyse du geste en cours : renvoie {kind:'twist', angle} ou {kind:'tumble', dx, dy (monde, y haut), dist} */
  readGesture() {
    const g = this.gesture;
    const pts = [...this.pointers.values()];
    if (g.two && pts.length < 2) return g.res || { kind: 'none', dist: 0 };
    if (g.two) {
      const [a, b] = pts;
      const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      let da = Math.atan2(b[1] - a[1], b[0] - a[0]) - g.ang0;
      da = Math.atan2(Math.sin(da), Math.cos(da));
      const dx = mid[0] - g.mid0[0], dy = mid[1] - g.mid0[1];
      const dist = Math.hypot(dx, dy);
      const arc = Math.abs(da) * g.spread / 2;
      if (arc > dist && Math.abs(da) > 8 * DEG) return { kind: 'twist', angle: -da };
      return { kind: 'tumble', dx, dy: -dy, dist };
    }
    const p = pts[0] || g.start;
    if (g.mode === 'twist') {
      const [sx, sy] = this.toScreen(g.shape.pos);
      let da = Math.atan2(p[1] - sy, p[0] - sx) - Math.atan2(g.start[1] - sy, g.start[0] - sx);
      da = Math.atan2(Math.sin(da), Math.cos(da));
      return { kind: 'twist', angle: -da };
    }
    const dx = p[0] - g.start[0], dy = p[1] - g.start[1];
    return { kind: 'tumble', dx, dy: -dy, dist: Math.hypot(dx, dy) };
  }

  onWheel(e, p) {
    if (!this.enabled) return;
    const s = this.hit(p[0], p[1]) || (this.shapes.filter((x) => !x.hidden).length === 1 ? this.shapes.find((x) => !x.hidden) : null);
    if (!s) return;
    e.preventDefault();
    this.lastShape = s;
    const now = performance.now();
    const w = this.wheel;
    if (now < w.cool) { w.x = w.y = w.twist = 0; return; }
    if (now - w.t > 220) { w.x = w.y = w.twist = 0; }
    w.t = now;
    let dx = e.deltaX, dy = e.deltaY;
    if (e.deltaMode === 1) { dx *= 30; dy *= 30; }
    if (s.anim) return;
    if (e.ctrlKey || e.shiftKey) {
      // pincer (ctrl+molette) ou Maj+molette : tourner la face
      w.twist += e.shiftKey && !e.ctrlKey ? dy || dx : dy * 4;
      if (Math.abs(w.twist) > 60) {
        s.twist(w.twist < 0 ? 1 : -1);
        w.twist = 0; w.cool = now + 450;
      }
      return;
    }
    const inv = this.opts.invertScroll ? -1 : 1;
    w.x += -dx * inv; w.y += -dy * inv;
    if (Math.hypot(w.x, w.y) > 55) {
      s.tumble(w.x, w.y);
      w.x = w.y = 0; w.cool = now + 480;
    }
  }
}

function inPoly(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
