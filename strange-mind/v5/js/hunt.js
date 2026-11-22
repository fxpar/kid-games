// Un plateau de chasse : rendu, glissement pour sélectionner, vérification des relations.
import { RELATIONS, countAll, keyOf, makeBoard } from './relations.js';
import { drawGlyph, roundRect, numberTile } from './draw.js';

/** Dessine une tuile centrée en (x, y), côté s. */
export function drawTile(ctx, t, x, y, s) {
  if (!t) return;
  const h = s / 2;
  if (t.t === 'num') { numberTile(ctx, x, y, s, t.v); return; }
  const bg = { water: '#e8f6ff', dolphin: '#cde7ff', mirror: '#f1f0ff', arrow: '#ffe3ec' }[t.t];
  ctx.save();
  ctx.fillStyle = bg;
  roundRect(ctx, x - h, y - h, s, s, s * 0.18); ctx.fill();
  if (t.t !== 'water') { ctx.strokeStyle = 'rgba(61,44,107,.22)'; ctx.lineWidth = 2; ctx.stroke(); }
  ctx.restore();
  if (t.t === 'water') {
    ctx.save(); ctx.strokeStyle = 'rgba(120,180,230,.5)'; ctx.lineWidth = 1.5;
    for (const [dx, dy, r] of [[-0.18, 0.12, 0.07], [0.12, -0.1, 0.05], [0.2, 0.18, 0.04]]) { ctx.beginPath(); ctx.arc(x + dx * s, y + dy * s, r * s, 0, 7); ctx.stroke(); }
    ctx.restore();
  } else if (t.t === 'dolphin') drawGlyph(ctx, 'dolphin', x, y, s * 0.38, t.d, !!t.m);
  else if (t.t === 'mirror') drawGlyph(ctx, 'mirror', x, y, s * 0.42, t.a);
  else if (t.t === 'arrow') drawGlyph(ctx, 'arrow', x, y, s * 0.38, t.d);
}

export class Hunt {
  /**
   * @param {HTMLElement} stage
   * @param {object} ch chapitre
   * @param {object} R hasard
   * @param {object} o { onFind(rel, pts, combo), onMiss(kind), onDone(), sound(name, n) }
   */
  constructor(stage, ch, R, o = {}) {
    this.ch = ch; this.o = o;
    const { board, counts } = makeBoard(ch, R);
    this.board = board;
    this.all = counts;                                   // relId -> Map(key -> cells)
    this.found = Object.fromEntries(ch.rels.map((id) => [id, new Map()]));
    this.mistakes = 0; this.combo = 0; this.lastFind = 0;
    this.fx = []; this.sel = null; this.hint = null; this.done = false;
    this.stage = stage;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'board-canvas';
    stage.append(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.bind();
    this.ro = new ResizeObserver(() => this.layout());
    this.ro.observe(stage);
    this.layout();
    this.frame = this.frame.bind(this);
    this.raf = requestAnimationFrame(this.frame);
  }

  destroy() { cancelAnimationFrame(this.raf); this.ro.disconnect(); this.canvas.remove(); }
  total(id) { return this.all[id].size; }
  left() { return this.ch.rels.reduce((s, id) => s + this.all[id].size - this.found[id].size, 0); }

  layout() {
    const W = this.stage.clientWidth, H = this.stage.clientHeight;
    if (!W || !H) return;
    this.dpr = Math.min(devicePixelRatio || 1, 2.5);
    this.canvas.width = Math.round(W * this.dpr); this.canvas.height = Math.round(H * this.dpr);
    this.canvas.style.width = W + 'px'; this.canvas.style.height = H + 'px';
    const N = this.board.length, size = Math.min(W - 12, H - 12, 620);
    this.cs = size / N; this.ox = (W - size) / 2; this.oy = (H - size) / 2;
    this.W = W; this.H = H;
  }
  center(r, c) { return [this.ox + (c + 0.5) * this.cs, this.oy + (r + 0.5) * this.cs]; }
  cellAt(x, y) {
    const c = Math.floor((x - this.ox) / this.cs), r = Math.floor((y - this.oy) / this.cs), N = this.board.length;
    return r >= 0 && c >= 0 && r < N && c < N ? [r, c] : null;
  }

  // ---------------------------------------------------------------- sélection
  /** Cases désignées par un glissement de a vers b (ligne de 2-3 cases, ou carré en diagonale). */
  cellsOf(a, b) {
    const dr = b[0] - a[0], dc = b[1] - a[1];
    if (Math.abs(dr) === 1 && Math.abs(dc) === 1) {
      const r = Math.min(a[0], b[0]), c = Math.min(a[1], b[1]);
      return { kind: 'square', cells: [[r, c], [r, c + 1], [r + 1, c], [r + 1, c + 1]] };
    }
    if ((dr === 0) !== (dc === 0)) {
      const n = Math.max(Math.abs(dr), Math.abs(dc));
      if (n > 2) return null;
      const sr = Math.sign(dr), sc = Math.sign(dc);
      return { kind: n === 1 ? 'pair' : 'triple', cells: Array.from({ length: n + 1 }, (_, k) => [a[0] + sr * k, a[1] + sc * k]) };
    }
    return null;
  }

  evaluate(sel) {
    const tiles = sel.cells.map(([r, c]) => this.board[r][c]);
    const rels = this.ch.rels.map((id) => [id, RELATIONS[id]]).filter(([, r]) => r.kind === sel.kind).sort((a, b) => b[1].pts - a[1].pts);
    let already = false;
    for (const [id, rel] of rels) {
      if (!rel.test(...tiles)) continue;
      const key = keyOf(rel, sel.cells);
      if (this.found[id].has(key)) { already = true; continue; }
      return this.find(id, rel, key, sel.cells);
    }
    if (already) { this.o.sound?.('already'); this.o.onMiss?.('already'); return; }
    // dans l'autre sens ? (relations où le sens compte) : on aide sans pénaliser
    if (sel.kind !== 'square') {
      const rev = tiles.slice().reverse();
      if (rels.some(([, r]) => r.ordered && r.test(...rev))) { this.o.sound?.('almost'); this.o.onMiss?.('reverse'); this.shake(sel.cells); return; }
    }
    this.mistakes++; this.combo = 0;
    this.o.sound?.('miss');
    this.o.onMiss?.('miss');
    this.shake(sel.cells);
  }

  find(id, rel, key, cells) {
    const now = performance.now();
    this.combo = now - this.lastFind < 5000 ? this.combo + 1 : 1;
    this.lastFind = now;
    const mult = Math.min(3, 1 + 0.5 * (this.combo - 1));
    const pts = Math.round(rel.pts * mult);
    this.found[id].set(key, cells);
    this.hint = null;
    const [x, y] = this.mid(cells);
    this.fx.push({ kind: 'text', text: `+${pts}`, x, y, color: rel.color, t0: now });
    this.fx.push({ kind: 'ring', cells, color: rel.color, t0: now });
    this.o.sound?.('find', this.combo);
    this.o.onFind?.(id, pts, this.combo);
    if (this.left() === 0) { this.done = true; setTimeout(() => this.o.onDone?.(), 700); }
  }

  mid(cells) {
    const ps = cells.map(([r, c]) => this.center(r, c));
    return [ps.reduce((s, p) => s + p[0], 0) / ps.length, ps.reduce((s, p) => s + p[1], 0) / ps.length];
  }
  shake(cells) { this.fx.push({ kind: 'shake', cells, t0: performance.now() }); }

  showHint() {
    for (const id of this.ch.rels.slice().reverse()) {
      for (const [key, cells] of this.all[id]) if (!this.found[id].has(key)) { this.hint = { id, cells, t0: performance.now() }; this.combo = 0; return id; }
    }
    return null;
  }

  bind() {
    const cv = this.canvas;
    const pos = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    cv.addEventListener('pointerdown', (e) => {
      if (this.done) return;
      e.preventDefault();
      try { cv.setPointerCapture(e.pointerId); } catch { /* */ }
      const c = this.cellAt(...pos(e));
      if (c) { this.sel = { a: c, b: c, id: e.pointerId }; this.o.sound?.('tap'); }
    });
    cv.addEventListener('pointermove', (e) => {
      if (!this.sel || e.pointerId !== this.sel.id) return;
      const c = this.cellAt(...pos(e));
      if (c && this.cellsOf(this.sel.a, c)) { if (c[0] !== this.sel.b[0] || c[1] !== this.sel.b[1]) this.o.sound?.('tap'); this.sel.b = c; }
    });
    const up = (e) => {
      if (!this.sel || e.pointerId !== this.sel.id) return;
      const s = this.cellsOf(this.sel.a, this.sel.b);
      this.sel = null;
      if (s) this.evaluate(s);
    };
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', () => { this.sel = null; });
  }

  // ---------------------------------------------------------------- rendu
  frame(now) {
    this.raf = requestAnimationFrame(this.frame);
    const ctx = this.ctx, cs = this.cs, N = this.board.length;
    if (!cs) return;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.W, this.H);
    ctx.fillStyle = 'rgba(255,255,255,.6)';
    roundRect(ctx, this.ox - 6, this.oy - 6, N * cs + 12, N * cs + 12, 20); ctx.fill();
    // décalage des tuiles qui tremblent
    const shake = new Map();
    this.fx = this.fx.filter((f) => now - f.t0 < (f.kind === 'shake' ? 400 : 900));
    for (const f of this.fx) if (f.kind === 'shake') {
      const k = (now - f.t0) / 400;
      for (const [r, c] of f.cells) shake.set(r * 10 + c, Math.sin(k * 30) * 6 * (1 - k));
    }
    // liens des relations trouvées (sous les tuiles)
    for (const id of this.ch.rels) for (const cells of this.found[id].values()) this.link(cells, RELATIONS[id].color, 0.35, RELATIONS[id].kind === 'square');
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const [x, y] = this.center(r, c);
      drawTile(ctx, this.board[r][c], x + (shake.get(r * 10 + c) || 0), y, cs * 0.86);
    }
    // petits ronds sur les tuiles déjà utilisées
    for (const id of this.ch.rels) for (const cells of this.found[id].values()) for (const [r, c] of cells) {
      const [x, y] = this.center(r, c);
      ctx.fillStyle = RELATIONS[id].color;
      ctx.beginPath(); ctx.arc(x + cs * 0.33, y - cs * 0.33, cs * 0.07, 0, 7); ctx.fill();
    }
    // sélection en cours
    if (this.sel) {
      const s = this.cellsOf(this.sel.a, this.sel.b);
      const cells = s ? s.cells : [this.sel.a];
      this.link(cells, '#ffd166', 0.8, s?.kind === 'square', true);
    }
    if (this.hint) {
      const k = (now - this.hint.t0) / 1000;
      if (k > 3) this.hint = null;
      else {
        const [r, c] = this.hint.cells[0];
        const [x, y] = this.center(r, c);
        ctx.save(); ctx.strokeStyle = `rgba(255,209,102,${0.6 + 0.4 * Math.sin(now / 120)})`; ctx.lineWidth = 5;
        roundRect(ctx, x - cs * 0.47, y - cs * 0.47, cs * 0.94, cs * 0.94, cs * 0.2); ctx.stroke(); ctx.restore();
      }
    }
    for (const f of this.fx) {
      const k = (now - f.t0) / 900;
      if (f.kind === 'text') {
        ctx.save(); ctx.globalAlpha = k > 0.6 ? (1 - k) / 0.4 : 1;
        ctx.font = `800 ${Math.round(cs * 0.42)}px "Baloo 2","Comic Sans MS",sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineWidth = 5; ctx.strokeStyle = '#fff'; ctx.strokeText(f.text, f.x, f.y - k * 50);
        ctx.fillStyle = f.color; ctx.fillText(f.text, f.x, f.y - k * 50); ctx.restore();
      } else if (f.kind === 'ring') {
        for (const [r, c] of f.cells) {
          const [x, y] = this.center(r, c);
          ctx.save(); ctx.globalAlpha = 1 - k; ctx.strokeStyle = f.color; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.arc(x, y, cs * (0.4 + 0.5 * k), 0, 7); ctx.stroke(); ctx.restore();
        }
      }
    }
  }

  /** Trait épais reliant des cases (ou contour d'un carré), avec une flèche pour le sens. */
  link(cells, color, alpha, square = false, arrow = false) {
    const ctx = this.ctx, cs = this.cs;
    ctx.save();
    ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (square) {
      const [r, c] = cells[0];
      ctx.lineWidth = cs * 0.14;
      roundRect(ctx, this.ox + c * cs + 4, this.oy + r * cs + 4, cs * 2 - 8, cs * 2 - 8, cs * 0.3); ctx.stroke();
    } else {
      ctx.lineWidth = cs * 0.5;
      ctx.beginPath();
      cells.forEach(([r, c], i) => { const [x, y] = this.center(r, c); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.stroke();
      if (arrow && cells.length > 1) {
        const [x1, y1] = this.center(...cells[cells.length - 2]), [x2, y2] = this.center(...cells[cells.length - 1]);
        const t = Math.atan2(y2 - y1, x2 - x1), ex = x2 + Math.cos(t) * cs * 0.42, ey = y2 + Math.sin(t) * cs * 0.42;
        ctx.globalAlpha = 1; ctx.fillStyle = '#ff9a2e';
        ctx.beginPath(); ctx.moveTo(ex + Math.cos(t) * 12, ey + Math.sin(t) * 12);
        ctx.lineTo(ex + Math.cos(t + 2.3) * 12, ey + Math.sin(t + 2.3) * 12); ctx.lineTo(ex + Math.cos(t - 2.3) * 12, ey + Math.sin(t - 2.3) * 12); ctx.fill();
      }
    }
    ctx.restore();
  }
}

export { countAll };
