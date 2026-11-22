// Vérifie la fabrication des plateaux : nombre d'occurrences par relation et temps de calcul.
//   node v5/tools/check.mjs
import { CHAPTERS, makeBoard, makeR } from '../js/relations.js';

for (const ch of CHAPTERS) {
  const stats = Object.fromEntries(ch.rels.map((id) => [id, []]));
  let off = 0;
  const t = Date.now();
  for (let i = 0; i < 200; i++) {
    const { counts } = makeBoard(ch, makeR(Math.random));
    let ok = true;
    for (const id of ch.rels) { stats[id].push(counts[id].size); if (counts[id].size < 2 || counts[id].size > (ch.max ?? 5)) ok = false; }
    if (!ok) off++;
  }
  const ms = ((Date.now() - t) / 200).toFixed(1);
  const desc = ch.rels.map((id) => { const a = stats[id]; return `${id} ${Math.min(...a)}–${Math.max(...a)} (moy ${(a.reduce((s, x) => s + x, 0) / a.length).toFixed(1)})`; }).join('  ');
  console.log(`${ch.id.padEnd(11)} hors cible ${String(off).padStart(3)}/200  ${ms} ms  ${desc}`);
}
