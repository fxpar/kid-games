// Vérifie chaque niveau : est-il faisable ? en combien de coups au minimum (par) ?
//   node v2/tools/solve.mjs
import { Level } from '../js/cube.js';
import { LEVELS } from '../js/levels.js';

for (const [i, def] of LEVELS.entries()) {
  const lv = new Level(def);
  const t = Date.now();
  const res = lv.solve();
  const fish = lv.fish.length ? ' (poisson doré présent)' : '';
  console.log(`${String(i + 1).padStart(2)} ${def.name.padEnd(18)} ${res ? `par ${String(res.par).padStart(2)}  ${res.path.join(' ')}` : 'IMPOSSIBLE'}${fish}  [${Date.now() - t} ms]`);
}
