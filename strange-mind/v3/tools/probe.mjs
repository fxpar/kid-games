// Mesure par configuration de plateau (robot au hasard) : tuiles éclatées, parades, bonus par coup.
//   node tools/probe.mjs
import { Board, scoreStep } from '../js/board.js';
import { newStats, addStepStats } from '../js/levels.js';

const cfgs = [
  { size: 7, species: 4, dirs: [0] }, { size: 7, species: 4, dirs: [0, 1] }, { size: 7, species: 4, dirs: [0, 1, 2, 3] },
  { size: 7, species: 5, dirs: [0] }, { size: 7, species: 5, dirs: [0, 1] }, { size: 8, species: 5, dirs: [0, 1] }, { size: 7, species: 4, dirs: [0, 2] },
];
for (const cfg of cfgs) {
  const st = newStats(); let moves = 0, score = 0;
  for (let g = 0; g < 60; g++) {
    const b = new Board(cfg, g + 1);
    for (let m = 0; m < 20; m++) {
      const ms = b.allMoves(); if (!ms.length) { b.shuffle(); continue; }
      const mv = ms[Math.floor(b.rand() * ms.length)];
      const cells = b.rotateBlock(mv.r, mv.c, mv.cw); moves++;
      let cas = 1;
      for (;;) {
        const r = b.resolveStep(cas === 1 ? cells : []); if (!r) break;
        addStepStats(st, r); score += scoreStep(r, cas);
        for (let k = 0; k < r.rotateBoard; k++) b.rotateBoard();
        b.gravity(); cas++;
      }
      if (!b.hasMoves()) b.shuffle();
    }
  }
  const tot = st.collected.reduce((a, b) => a + b, 0);
  console.log(JSON.stringify(cfg).padEnd(42), 'tuiles', (tot / moves).toFixed(1), ' parades', (st.parades / moves).toFixed(2),
    ' fusées', (st.rockets / moves).toFixed(2), ' tourb', (st.whirls / moves).toFixed(3), ' bisous', (st.bisous / moves).toFixed(2), ' score', Math.round(score / moves));
}
