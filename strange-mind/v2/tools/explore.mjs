// Aide à la conception : pour un niveau à 1 cube, liste ce qu'on peut obtenir sur une case
// (dessin du dessus + direction) et en combien de coups au minimum.
//   node v2/tools/explore.mjs <numéro de niveau> <x> <r>
import { Level, topFacing } from '../js/cube.js';
import { LEVELS } from '../js/levels.js';

const [n, X, R] = process.argv.slice(2).map(Number);
const lv = new Level({ ...LEVELS[n - 1], houses: [] });
const start = lv.initialState();
const seen = new Map([[lv.key(start), 0]]);
let frontier = [start], depth = 0;
const found = new Map();
while (frontier.length) {
  depth++;
  const next = [];
  for (const s of frontier) for (const d of 'NESW') {
    const res = lv.move(s, 0, d);
    if (!res.state) continue;
    const k = lv.key(res.state);
    if (seen.has(k)) continue;
    seen.set(k, depth);
    next.push(res.state);
    const c = res.state.cubes[0];
    if (c.x === X && c.r === R) {
      const label = lv.top(res.state, 0) + ' ' + topFacing(c.M);
      if (!found.has(label)) found.set(label, depth);
    }
  }
  frontier = next;
}
console.log(`états atteignables : ${seen.size}`);
for (const [k, d] of [...found].sort((a, b) => b[1] - a[1])) console.log(String(d).padStart(3), k);
