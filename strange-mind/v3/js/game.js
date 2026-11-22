// Une partie : rendu du plateau, animations, gestes, déroulement (coups, cascades, fin).
import { Board, scoreStep } from './board.js';
import { SPECIES, SPECIES_BG, goalStatus, newStats, addStepStats } from './levels.js';
import { drawGlyph, roundRect } from './glyphs.js';
import { t as tx } from './i18n.js';

const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeIn = (t) => t * t;
const bounce = (t) => {
  const n = 7.5625, d = 2.75;
  if (t < 1 / d) return n * t * t;
  if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
  if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
  return n * (t -= 2.625 / d) * t + 0.984375;
};
const SP_DARK = ['#2b6cb0', '#e07a1f', '#d62839', '#e0a800', '#2f8f46'];
const COMBO = ['', '', 'Bien !', 'Super !', 'Génial !', 'Incroyable !', 'FANTASTIQUE !'];

export class Game {
  /**
   * @param {HTMLElement} stage
   * @param {object} o { level, mode: 'level'|'rush', seed, sound(name, n), onUpdate(), onEnd(result) }
   */
  constructor(stage, o) {
    this.o = o;
    this.level = o.level;
    this.mode = o.mode || 'level';
    this.board = new Board(this.level, o.seed ?? Date.now());
    this.stats = newStats();
    this.movesLeft = this.level.moves ?? Infinity;
    this.timeLeft = this.level.time ?? Infinity;
    this.elapsed = 0;
    this.speed = 1;
    this.busy = false;
    this.over = false;
    this.started = false;
    this.dying = []; this.particles = []; this.texts = []; this.beams = [];
    this.boardAngle = 0; this.shakeT = 0;
    this.lastInput = performance.now();
    this.hint = null; this.hover = null;

    this.stage = stage;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'board-canvas';
    stage.append(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.eachTile((t, r, c) => this.place(t, r, c));
    this.bindInput();
    this.ro = new ResizeObserver(() => this.layout());
    this.ro.observe(stage);
    this.layout();
    this.last = performance.now();
    this.frame = this.frame.bind(this);
    this.raf = requestAnimationFrame(this.frame);
  }

  destroy() {
    this.over = true;
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    this.canvas.remove();
  }

  sound(name, n) { this.o.sound?.(name, n); }
  update() { this.o.onUpdate?.(this); }

  eachTile(fn) {
    const g = this.board.grid;
    for (let r = 0; r < g.length; r++) for (let c = 0; c < g.length; c++) if (g[r][c]) fn(g[r][c], r, c);
  }
  place(t, r, c) { t.x = c; t.y = r; t.a = t.d * 90; t.s = 1; t.alpha = 1; t.tw = null; }

  goal() { return goalStatus(this.level.goal || {}, this.stats, this.board); }
  starCount() {
    const s = this.level.stars;
    if (!s) return 0;
    return s.filter((v) => this.stats.score >= v).length;
  }

  // ------------------------------------------------------------------ disposition
  layout() {
    const W = this.stage.clientWidth, H = this.stage.clientHeight;
    if (!W || !H) return;
    this.dpr = Math.min(devicePixelRatio || 1, 2.5);
    this.canvas.width = Math.round(W * this.dpr);
    this.canvas.height = Math.round(H * this.dpr);
    this.canvas.style.width = W + 'px';
    this.canvas.style.height = H + 'px';
    const N = this.board.N;
    const size = Math.min(W - 16, H - 16, 640);
    this.cs = size / N;
    this.ox = (W - size) / 2;
    this.oy = (H - size) / 2;
    this.W = W; this.H = H;
  }
  cellCenter(x, y) { return [this.ox + (x + 0.5) * this.cs, this.oy + (y + 0.5) * this.cs]; }

  // ------------------------------------------------------------------ animations
  tween(t, to, dur, ease = easeOut, arc = null) {
    t.tw = { from: { x: t.x, y: t.y, a: t.a, s: t.s, alpha: t.alpha }, to, t0: performance.now(), dur: dur / this.speed, ease, arc };
    return dur / this.speed;
  }
  wait(ms) { return new Promise((res) => setTimeout(res, ms / this.speed)); }
  waitRaw(ms) { return new Promise((res) => setTimeout(res, ms)); }

  stepTween(t, now) {
    const w = t.tw;
    if (!w) return;
    const k = Math.min(1, (now - w.t0) / w.dur), e = w.ease(k);
    for (const p of ['x', 'y', 'a', 's', 'alpha']) if (p in w.to) t[p] = w.from[p] + (w.to[p] - w.from[p]) * e;
    if (w.arc) {
      const { px, py, sign } = w.arc, phi = sign * (Math.PI / 2) * e;
      const dx = w.from.x - px, dy = w.from.y - py;
      t.x = px + dx * Math.cos(phi) - dy * Math.sin(phi);
      t.y = py + dx * Math.sin(phi) + dy * Math.cos(phi);
    }
    if (k >= 1) t.tw = null;
  }

  async animBlock(r, c, cw) {
    const cells = Board.blockCells(r, c);
    const sign = cw ? 1 : -1;
    let dur = 0;
    for (const [y, x] of cells) {
      const t = this.board.grid[y][x];
      if (!t) continue;
      dur = this.tween(t, { a: t.a - sign * 90, x, y }, 210, easeOut, { px: c + 0.5, py: r + 0.5, sign });
    }
    await this.waitRaw(dur + 10);
    for (const [y, x] of cells) { const t = this.board.grid[y][x]; if (t) { t.x = x; t.y = y; } }
  }

  async animBoardRotate() {
    this.sound('whirl');
    this.shakeT = performance.now();
    const t0 = performance.now(), dur = 650 / this.speed;
    await new Promise((res) => {
      const step = () => {
        const k = Math.min(1, (performance.now() - t0) / dur);
        this.boardAngle = 90 * easeOut(k);
        if (k < 1) requestAnimationFrame(step); else res();
      };
      step();
    });
    this.board.rotateBoard();
    this.boardAngle = 0;
    this.eachTile((t, r, c) => { t.x = c; t.y = r; t.a += 90; t.tw = null; });
  }

  // ------------------------------------------------------------------ un coup
  async play(r, c, cw) {
    if (this.busy || this.over) return;
    if (this.mode === 'rush' && this.timeLeft <= 0) return;
    this.lastInput = performance.now();
    this.hint = null;
    if (!this.started) { this.started = true; }
    this.busy = true;
    const cells = this.board.rotateBlock(r, c, cw);
    this.sound('rotate');
    await this.animBlock(r, c, cw);
    if (!this.board.hasMatch()) {
      this.board.rotateBlock(r, c, !cw);
      this.sound('nope');
      await this.animBlock(r, c, !cw);
      this.busy = false;
      return;
    }
    if (this.mode === 'level') this.movesLeft--;
    this.update();
    await this.resolve(cells);
    this.busy = false;
    this.checkEnd();
  }

  async resolve(focus) {
    let cascade = 1;
    for (;;) {
      const res = this.board.resolveStep(cascade === 1 ? focus : []);
      if (!res) break;
      this.showStep(res, cascade);
      await this.wait(300);
      for (let k = 0; k < res.rotateBoard; k++) await this.animBoardRotate();
      await this.fall();
      cascade++;
    }
    if (!this.board.hasMoves()) {
      this.addText(tx('On mélange !'), this.W / 2, this.H / 2, 34, '#7b2cbf');
      this.board.shuffle();
      this.eachTile((t, r, c) => { t.tw = null; this.tween(t, { x: c, y: r, a: t.d * 90 + 360 }, 500); });
      await this.wait(520);
      this.eachTile((t) => { t.a = t.d * 90; });
    }
  }

  showStep(res, cascade) {
    addStepStats(this.stats, res);
    const pts = scoreStep(res, cascade);
    this.stats.score += pts;
    // tuiles qui éclatent
    let sx = 0, sy = 0;
    for (const { tile, r, c } of res.cleared) {
      tile.x = c; tile.y = r;
      this.tween(tile, { s: 0, alpha: 0, a: tile.a + 40 }, 300, easeIn);
      this.dying.push(tile);
      const [px, py] = this.cellCenter(c, r);
      sx += px; sy += py;
      for (let i = 0; i < 5; i++) {
        const ang = Math.random() * 6.28, v = 1.5 + Math.random() * 3;
        this.particles.push({ x: px, y: py, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v - 2, life: 1, col: SP_DARK[tile.sp], r: 3 + Math.random() * 4 });
      }
    }
    for (const cr of res.created) {
      const t = this.board.grid[cr.r][cr.c];
      t.x = cr.c; t.y = cr.r;
      t.s = 1.5; this.tween(t, { s: 1, a: t.d * 90 }, 400, bounce);
    }
    for (const tr of res.triggers) {
      const [px, py] = this.cellCenter(tr.c, tr.r);
      if (tr.type === 'rocket') { this.beams.push({ kind: tr.d % 2 === 0 ? 'row' : 'col', idx: tr.d % 2 === 0 ? tr.r : tr.c, t0: performance.now() }); this.sound('rocket'); }
      if (tr.type === 'bomb') { this.beams.push({ kind: 'ring', x: px, y: py, t0: performance.now() }); this.sound('bomb'); }
      if (tr.type === 'whirl') this.addText(tx('TOURBILLON !'), this.W / 2, this.H * 0.4, 46, '#7b2cbf');
    }
    const n = res.cleared.length || 1;
    this.addText('+' + pts, sx / n, sy / n, 22 + Math.min(cascade, 5) * 3, '#fff', true);
    this.sound('pop', cascade);
    if (res.parades) { this.addText(res.parades > 1 ? tx('Parade ×{n} !', { n: res.parades }) : tx('Parade !'), this.W / 2, this.oy + this.cs * 0.8, 36, '#ef476f'); this.sound('parade'); }
    if (res.pairs.length) { this.addText(tx('Bisou ! 💋'), this.W / 2, this.oy + this.cs * 1.6, 34, '#ff4d8d'); this.sound('bisou'); }
    for (const cr of res.created) {
      const label = tx({ rocket: 'Fusée ! 🚀', bomb: 'Bombe ! 💥', whirl: 'Tourbillon ! 🌀' }[cr.special]);
      const [px, py] = this.cellCenter(cr.c, cr.r);
      this.addText(label, px, py - this.cs * 0.6, 26, '#ffd166', true);
    }
    if (COMBO[Math.min(cascade, 6)]) {
      // un seul mot de combo à la fois : le nouveau remplace l'ancien
      this.texts = this.texts.filter((t) => !t.combo);
      this.addText(tx(COMBO[Math.min(cascade, 6)]), this.W / 2, this.H / 2, 40 + cascade * 4, '#ffd166', true);
      this.texts[this.texts.length - 1].combo = true;
    }
    if (this.mode === 'rush') {
      // seuls les bonus créés rallongent le temps, et de moins en moins
      const fade = Math.max(0.25, 1 - this.elapsed / 120);
      const bonus = Math.round(res.created.reduce((s, c) => s + (c.special === 'whirl' ? 4 : 2), 0) * fade);
      if (bonus && this.timeLeft > 0) { this.timeLeft += bonus; this.addText(tx('+{n} s', { n: bonus }), this.W - 50, this.oy + 20, 26, '#2a9d8f'); }
    }
    this.update();
  }

  async fall() {
    const moves = this.board.gravity();
    let max = 0;
    for (const m of moves) {
      const t = m.tile;
      t.x = m.c;
      if (m.spawned) { t.y = m.fromR; t.a = t.d * 90; t.s = 1; t.alpha = 1; }
      const dist = m.toR - t.y;
      max = Math.max(max, this.tween(t, { y: m.toR }, 160 + 55 * Math.sqrt(Math.max(0, dist)) * 2.2, bounce));
    }
    this.dying = this.dying.filter((t) => t.tw);
    await this.waitRaw(max + 20);
  }

  // ------------------------------------------------------------------ fin
  async checkEnd() {
    if (this.over || this.busy) return;
    if (this.mode === 'rush') return;
    const g = this.goal();
    if (g.done) return this.victory();
    if (this.movesLeft <= 0) {
      this.over = true;
      this.sound('lose');
      setTimeout(() => this.o.onEnd?.({ win: false, score: this.stats.score, goal: g }), 700);
    }
  }

  async victory() {
    this.over = true;
    this.busy = true;
    this.sound('win');
    this.addText(tx('Bravo !'), this.W / 2, this.H / 2, 64, '#ffd166', true);
    await this.waitRaw(900);
    // feu d'artifice : chaque coup restant devient une fusée
    if (this.movesLeft > 0) {
      this.addText(tx("Feu d'artifice !"), this.W / 2, this.H * 0.35, 44, '#ef476f', true);
      const cells = [];
      const b = this.board;
      while (this.movesLeft > 0) {
        const free = [];
        this.eachTile((t, r, c) => { if (!t.special) free.push([r, c]); });
        if (!free.length) break;
        const [r, c] = free[Math.floor(Math.random() * free.length)];
        const t = b.grid[r][c];
        t.special = 'rocket'; t.d = Math.random() < 0.5 ? 0 : 1;
        t.s = 1.6; this.tween(t, { s: 1, a: t.d * 90 }, 300, bounce);
        cells.push([r, c]);
        this.movesLeft--;
        this.stats.score += 150;
        this.sound('tick');
        this.update();
        await this.waitRaw(110);
      }
      await this.waitRaw(300);
      const res = b.clear(cells);
      this.showStep({ ...res, parades: 0, pairs: [], created: [] }, 1);
      await this.wait(300);
      for (let k = 0; k < res.rotateBoard; k++) await this.animBoardRotate();
      await this.fall();
      await this.resolve([]);
    }
    await this.waitRaw(500);
    this.o.onEnd?.({ win: true, score: this.stats.score, stars: Math.max(1, this.starCount()) });
  }

  // ------------------------------------------------------------------ boucle
  frame(now) {
    this.raf = requestAnimationFrame(this.frame);
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    if (this.mode === 'rush' && this.started && !this.over) {
      this.elapsed += dt;
      this.timeLeft -= dt;
      this.speed = 1 + Math.min(1.2, this.elapsed / 50);
      if (this.timeLeft <= 5 && Math.floor(this.timeLeft + dt) !== Math.floor(this.timeLeft)) this.sound('tick');
      if (this.timeLeft <= 0 && !this.busy) {
        this.timeLeft = 0; this.over = true; this.sound('win');
        setTimeout(() => this.o.onEnd?.({ win: true, score: this.stats.score, rush: true }), 600);
      }
      this.update();
    }
    // indice après 5 s sans jouer
    if (!this.busy && !this.over && !this.hint && now - this.lastInput > 5000) {
      const m = this.board.findMove();
      if (m) this.hint = { ...m, t0: now };
    }
    this.eachTile((t) => this.stepTween(t, now));
    for (const t of this.dying) this.stepTween(t, now);
    this.draw(now);
  }

  draw(now) {
    const ctx = this.ctx, dpr = this.dpr, cs = this.cs, N = this.board.N;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, this.W, this.H);
    ctx.save();
    if (this.shakeT && now - this.shakeT < 500) {
      const k = 1 - (now - this.shakeT) / 500;
      ctx.translate(Math.sin(now * 0.08) * 8 * k, Math.cos(now * 0.07) * 6 * k);
    }
    const cx = this.ox + (N * cs) / 2, cy = this.oy + (N * cs) / 2;
    ctx.translate(cx, cy); ctx.rotate((-this.boardAngle * Math.PI) / 180); ctx.translate(-cx, -cy);

    // fond du plateau
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    roundRect(ctx, this.ox - 8, this.oy - 8, N * cs + 16, N * cs + 16, 22); ctx.fill();
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      ctx.fillStyle = (r + c) % 2 ? 'rgba(123,111,168,.07)' : 'rgba(123,111,168,.13)';
      roundRect(ctx, this.ox + c * cs + 2, this.oy + r * cs + 2, cs - 4, cs - 4, cs * 0.18); ctx.fill();
      if (this.board.ice[r][c]) {
        const x = this.ox + c * cs, y = this.oy + r * cs;
        const g = ctx.createLinearGradient(x, y, x + cs, y + cs);
        g.addColorStop(0, '#e0f7ff'); g.addColorStop(1, '#8fd3fe');
        ctx.fillStyle = g;
        roundRect(ctx, x + 2, y + 2, cs - 4, cs - 4, cs * 0.18); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x + cs * 0.2, y + cs * 0.35); ctx.lineTo(x + cs * 0.4, y + cs * 0.15);
        ctx.moveTo(x + cs * 0.6, y + cs * 0.85); ctx.lineTo(x + cs * 0.85, y + cs * 0.6); ctx.stroke();
      }
    }
    // zone survolée / indice
    const ring = (r, c, col, w) => {
      ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = w;
      roundRect(ctx, this.ox + c * cs - 2, this.oy + r * cs - 2, cs * 2 + 4, cs * 2 + 4, cs * 0.3); ctx.stroke(); ctx.restore();
    };
    if (this.hover && !this.busy) ring(this.hover.r, this.hover.c, 'rgba(123,44,191,.35)', 3);

    // tuiles
    ctx.save();
    ctx.beginPath(); ctx.rect(this.ox - 8, this.oy - 4, N * cs + 16, N * cs + 12); ctx.clip();
    const wig = this.hint ? Math.sin((now - this.hint.t0) / 120) * 7 * (Math.sin((now - this.hint.t0) / 700) > 0 ? 1 : 0) : 0;
    const hintCells = this.hint ? new Set(Board.blockCells(this.hint.r, this.hint.c).map(([r, c]) => r * 100 + c)) : null;
    this.eachTile((t, r, c) => this.drawTile(t, now, hintCells?.has(r * 100 + c) ? wig : 0));
    for (const t of this.dying) this.drawTile(t, now, 0);
    ctx.restore();
    if (this.hint) ring(this.hint.r, this.hint.c, `rgba(255,209,102,${0.5 + 0.5 * Math.sin(now / 200)})`, 4);

    // rayons (fusées, bombes)
    this.beams = this.beams.filter((b) => now - b.t0 < 450);
    for (const b of this.beams) {
      const k = (now - b.t0) / 450;
      ctx.save();
      ctx.globalAlpha = 1 - k;
      if (b.kind === 'ring') {
        ctx.strokeStyle = '#ff9a2e'; ctx.lineWidth = cs * 0.3 * (1 - k);
        ctx.beginPath(); ctx.arc(b.x, b.y, cs * (0.5 + 1.4 * k), 0, 7); ctx.stroke();
      } else {
        const g = b.kind === 'row'
          ? [this.ox, this.oy + (b.idx + 0.5) * cs, this.ox + N * cs, this.oy + (b.idx + 0.5) * cs]
          : [this.ox + (b.idx + 0.5) * cs, this.oy, this.ox + (b.idx + 0.5) * cs, this.oy + N * cs];
        ctx.strokeStyle = '#fff6c2'; ctx.lineCap = 'round'; ctx.lineWidth = cs * 0.55 * (1 - k * 0.6);
        ctx.shadowColor = '#ffd166'; ctx.shadowBlur = 25;
        ctx.beginPath(); ctx.moveTo(g[0], g[1]); ctx.lineTo(g[2], g[3]); ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();

    // particules et textes (non tournés)
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const p of this.particles) {
      p.x += p.vx; p.y += p.vy; p.vy += 0.25; p.life -= 0.03;
      ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.col;
      ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0, p.r * p.life), 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
    this.texts = this.texts.filter((t) => now - t.t0 < t.life);
    for (const t of this.texts) {
      const k = (now - t.t0) / t.life;
      const sc = k < 0.15 ? 0.5 + (k / 0.15) * 0.6 : 1.1 - Math.min(0.1, (k - 0.15));
      ctx.save();
      ctx.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1;
      ctx.translate(t.x, t.y - k * 40);
      ctx.scale(sc, sc);
      ctx.font = `800 ${t.size}px "Baloo 2","Comic Sans MS","Trebuchet MS",sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round'; ctx.lineWidth = t.size * 0.18; ctx.strokeStyle = t.outline ? '#3d2c6b' : 'rgba(255,255,255,.9)';
      ctx.strokeText(t.text, 0, 0);
      ctx.fillStyle = t.color; ctx.fillText(t.text, 0, 0);
      ctx.restore();
    }
  }

  drawTile(t, now, wiggle) {
    const ctx = this.ctx, cs = this.cs;
    const [px, py] = this.cellCenter(t.x, t.y);
    const s = t.s ?? 1;
    if (s <= 0.01 || t.alpha <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = t.alpha ?? 1;
    ctx.translate(px, py);
    ctx.scale(s, s);
    const h = cs * 0.44;
    // fond
    ctx.fillStyle = SPECIES_BG[t.sp];
    roundRect(ctx, -h, -h, 2 * h, 2 * h, cs * 0.2); ctx.fill();
    ctx.strokeStyle = 'rgba(61,44,107,.18)'; ctx.lineWidth = 2; ctx.stroke();
    if (t.special === 'rocket') {
      ctx.save(); roundRect(ctx, -h, -h, 2 * h, 2 * h, cs * 0.2); ctx.clip();
      ctx.rotate((-t.a * Math.PI) / 180);
      ctx.fillStyle = 'rgba(255,255,255,.75)';
      for (let i = -2; i <= 2; i++) ctx.fillRect(-h * 1.5, i * h * 0.42 - h * 0.08, h * 3, h * 0.16);
      ctx.restore();
      ctx.strokeStyle = '#ffb703'; ctx.lineWidth = 4; roundRect(ctx, -h, -h, 2 * h, 2 * h, cs * 0.2); ctx.stroke();
    } else if (t.special === 'bomb') {
      const p = 0.5 + 0.5 * Math.sin(now / 150);
      ctx.strokeStyle = `rgba(255,120,30,${0.5 + 0.5 * p})`; ctx.lineWidth = 4 + 3 * p;
      roundRect(ctx, -h, -h, 2 * h, 2 * h, cs * 0.2); ctx.stroke();
    } else if (t.special === 'whirl') {
      const cols = ['#ef476f', '#ffd166', '#06d6a0', '#118ab2', '#7b2cbf'];
      ctx.lineWidth = 5;
      cols.forEach((col, i) => {
        ctx.strokeStyle = col;
        const a0 = now / 300 + (i * Math.PI * 2) / 5;
        ctx.beginPath(); ctx.arc(0, 0, h * 1.02, a0, a0 + 1.1); ctx.stroke();
      });
    }
    drawGlyph(ctx, SPECIES[t.sp], 0, 0, cs * 0.36, t.a + wiggle);
    ctx.restore();
  }

  addText(text, x, y, size, color, outline = false) {
    this.texts.push({ text, x, y, size, color, outline, t0: performance.now(), life: 1000 });
  }

  // ------------------------------------------------------------------ gestes
  blockAt(px, py) {
    const N = this.board.N;
    const gx = (px - this.ox) / this.cs, gy = (py - this.oy) / this.cs;
    if (gx < -0.5 || gy < -0.5 || gx > N + 0.5 || gy > N + 0.5) return null;
    const i = Math.max(1, Math.min(N - 1, Math.round(gx)));
    const j = Math.max(1, Math.min(N - 1, Math.round(gy)));
    return { r: j - 1, c: i - 1, cx: this.ox + i * this.cs, cy: this.oy + j * this.cs };
  }

  bindInput() {
    const cv = this.canvas;
    const pos = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    const pts = new Map();
    let g = null;
    cv.addEventListener('contextmenu', (e) => e.preventDefault());
    cv.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      try { cv.setPointerCapture(e.pointerId); } catch { /* */ }
      const p = pos(e);
      pts.set(e.pointerId, p);
      this.lastInput = performance.now();
      if (pts.size === 1) g = { start: p, block: this.blockAt(...p), right: e.button === 2, two: false };
      else if (pts.size === 2 && g) {
        const [a, b] = [...pts.values()];
        g.two = true;
        g.ang0 = Math.atan2(b[1] - a[1], b[0] - a[0]);
        g.block = this.blockAt((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
      }
    });
    cv.addEventListener('pointermove', (e) => {
      const p = pos(e);
      if (pts.has(e.pointerId)) pts.set(e.pointerId, p);
      else this.hover = e.pointerType === 'mouse' ? this.blockAt(...p) : null;
      if (g?.two && pts.size === 2 && !g.done) {
        const [a, b] = [...pts.values()];
        let da = Math.atan2(b[1] - a[1], b[0] - a[0]) - g.ang0;
        da = Math.atan2(Math.sin(da), Math.cos(da));
        if (Math.abs(da) > 0.35 && g.block) { g.done = true; this.play(g.block.r, g.block.c, da > 0); }
      }
    });
    const up = (e) => {
      const p = pts.get(e.pointerId);
      pts.delete(e.pointerId);
      if (!g || pts.size > 0) return;
      const gg = g; g = null;
      if (gg.done || gg.two || !gg.block || !p) return;
      const dx = p[0] - gg.start[0], dy = p[1] - gg.start[1];
      let cw = !gg.right;
      if (Math.hypot(dx, dy) > 14) {
        const cross = (gg.start[0] - gg.block.cx) * dy - (gg.start[1] - gg.block.cy) * dx;
        if (Math.abs(cross) > 20) cw = cross > 0;
      }
      this.play(gg.block.r, gg.block.c, cw);
    };
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', (e) => { pts.delete(e.pointerId); g = null; });
    cv.addEventListener('pointerleave', () => { this.hover = null; });
    let wheelT = 0;
    cv.addEventListener('wheel', (e) => {
      e.preventDefault();
      const now = performance.now();
      if (now - wheelT < 350 || Math.abs(e.deltaY) < 4) return;
      wheelT = now;
      const b = this.blockAt(...pos(e));
      if (b) this.play(b.r, b.c, e.deltaY > 0);
    }, { passive: false });
  }
}
