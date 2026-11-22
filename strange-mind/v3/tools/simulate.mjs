// Fait jouer un robot sur chaque niveau pour régler la difficulté.
//   node tools/simulate.mjs [parties par niveau]
// Robot : à chaque coup, choisit le coup qui éclate le plus (avec un peu de hasard).
import { Board, scoreStep } from '../js/board.js';
import { LEVELS, goalStatus, newStats, addStepStats } from '../js/levels.js';

const GAMES = Number(process.argv[2] || 150);

function resolveAll(b, focus, stats) {
  let cascade = 1, total = 0;
  for (;;) {
    const res = b.resolveStep(cascade === 1 ? focus : []);
    if (!res) break;
    addStepStats(stats, res);
    total += scoreStep(res, cascade);
    for (let k = 0; k < res.rotateBoard; k++) b.rotateBoard();
    b.gravity();
    cascade++;
  }
  stats.score += total;
  if (!b.hasMoves()) b.shuffle();
}

function bot(b, rand, skill) {
  const moves = b.allMoves();
  if (rand() > skill) return moves[Math.floor(rand() * moves.length)];
  let best = null, bs = -1;
  for (const m of moves) {
    b.rotateBlock(m.r, m.c, m.cw);
    const s = b.scan();
    const v = s.runs.reduce((a, r) => a + r.cells.length + (r.parade ? 3 * r.cells.length - 6 : 0), 0) + s.pairs.length * 6 + rand();
    b.rotateBlock(m.r, m.c, !m.cw);
    if (v > bs) { bs = v; best = m; }
  }
  return best;
}

for (const [i, lv] of LEVELS.entries()) {
  for (const skill of [0.5, 0.9]) {
    let wins = 0; const scores = []; const movesUsed = [];
    for (let g = 0; g < GAMES; g++) {
      const b = new Board(lv, 1000 * i + g + (skill > 0.7 ? 7777 : 0));
      const stats = newStats();
      let used = 0, won = false;
      while (used < lv.moves) {
        const m = bot(b, b.rand, skill);
        if (!m) { b.shuffle(); continue; }
        const cells = b.rotateBlock(m.r, m.c, m.cw);
        used++;
        resolveAll(b, cells, stats);
        if (goalStatus(lv.goal, stats, b).done) { won = true; break; }
      }
      // bonus de fin : 1 fusée par coup restant ≈ 300 pts
      if (won) { wins++; stats.score += (lv.moves - used) * 150; movesUsed.push(used); }
      scores.push(stats.score);
    }
    scores.sort((a, b) => a - b);
    const p = (q) => scores[Math.floor(q * (scores.length - 1))];
    const avgUsed = movesUsed.length ? (movesUsed.reduce((a, b) => a + b, 0) / movesUsed.length).toFixed(1) : '-';
    if (skill === 0.5) console.log(`   → étoiles suggérées : ${Math.round(p(0.2) / 100) * 100} / ${Math.round(p(0.5) / 100) * 100} / ${Math.round(p(0.85) / 100) * 100}`);
    console.log(`${String(i + 1).padStart(2)} ${lv.name.padEnd(20)} skill ${skill}  win ${(100 * wins / GAMES).toFixed(0).padStart(3)}%  coups ${avgUsed}/${lv.moves}  score p25 ${p(0.25)}  p50 ${p(0.5)}  p90 ${p(0.9)}   étoiles ${lv.stars.join('/')}`);
  }
}
