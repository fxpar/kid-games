// Niveaux de Strange Mind v2.
//
// { name, size, species (nb d'espèces), dirs (sens d'apparition des animaux), moves,
//   goal: { collect: {espèce: n} } | { ice: true } | { parades: n } | { rockets: n } | { whirls: n } | { score: n },
//   stars: [★, ★★, ★★★] (scores ; ★ = objectif atteint), ice: ['.......', '..###..', …] }
//
// dirs = [0] : tous les animaux arrivent en regardant à droite → les parades sont faciles.
// Plus il y a de directions, plus il faut tourner habilement pour faire des parades.

export const SPECIES = ['dolphin', 'fish', 'ladybug', 'bird', 'turtle'];
export const SPECIES_BG = ['#cfe8ff', '#ffe3c4', '#ffd9de', '#fff1a8', '#d8f3cf'];

export const LEVELS = [
  { name: 'Le Bassin', size: 6, species: 4, dirs: [0], moves: 14, goal: { collect: { 0: 25 } }, stars: [0, 4500, 6700] },
  { name: 'Deux amis', size: 7, species: 5, dirs: [0], moves: 14, goal: { collect: { 0: 12, 1: 12 } }, stars: [0, 2900, 4100] },
  { name: 'Première fusée', size: 7, species: 4, dirs: [0], moves: 16, goal: { rockets: 2 }, stars: [0, 6100, 10100] },
  { name: 'La glace', size: 7, species: 5, dirs: [0], moves: 16, goal: { ice: true }, stars: [0, 3200, 5000],
    ice: ['.......', '.......', '..###..', '..###..', '..###..', '.......', '.......'] },
  { name: 'La parade', size: 7, species: 5, dirs: [0, 1], moves: 16, goal: { parades: 6 }, stars: [0, 3100, 4100] },
  { name: 'Ça tourne !', size: 7, species: 5, dirs: [0, 1], moves: 16, goal: { score: 2500 }, stars: [0, 3000, 3800] },
  { name: 'Le grand tourbillon', size: 8, species: 4, dirs: [0], moves: 20, goal: { whirls: 1 }, stars: [0, 11900, 20200] },
  { name: 'Glace en croix', size: 8, species: 5, dirs: [0], moves: 28, goal: { ice: true }, stars: [0, 7500, 10300],
    ice: ['...##...', '...##...', '...##...', '########', '########', '...##...', '...##...', '...##...'] },
  { name: 'Les quatre vents', size: 7, species: 5, dirs: [0, 1, 2, 3], moves: 18, goal: { collect: { 2: 20, 3: 20 } }, stars: [0, 4200, 5400] },
  { name: 'Le festival', size: 8, species: 5, dirs: [0, 1], moves: 25, goal: { score: 5000 }, stars: [0, 5600, 6500] },
];

export const RUSH = { name: 'Rush', size: 7, species: 4, dirs: [0, 1], time: 60 };

/** Avancement de l'objectif. stats = { collected[], parades, rockets, bombs, whirls, bisous, score } */
export function goalStatus(goal, stats, board) {
  const items = [];
  if (goal.collect) for (const [sp, n] of Object.entries(goal.collect)) items.push({ kind: 'sp', sp: +sp, left: Math.max(0, n - (stats.collected[+sp] || 0)) });
  if (goal.ice) items.push({ kind: 'ice', left: board.iceLeft() });
  if (goal.parades) items.push({ kind: 'parade', left: Math.max(0, goal.parades - stats.parades) });
  if (goal.rockets) items.push({ kind: 'rocket', left: Math.max(0, goal.rockets - stats.rockets) });
  if (goal.whirls) items.push({ kind: 'whirl', left: Math.max(0, goal.whirls - stats.whirls) });
  if (goal.score) items.push({ kind: 'score', left: Math.max(0, goal.score - stats.score) });
  return { items, done: items.every((i) => i.left === 0) };
}

export function newStats(nsp = 5) {
  return { collected: Array(nsp).fill(0), parades: 0, rockets: 0, bombs: 0, whirls: 0, bisous: 0, score: 0 };
}

/** Met à jour les statistiques après une étape de résolution. */
export function addStepStats(stats, res) {
  for (const { tile } of res.cleared) stats.collected[tile.sp]++;
  stats.parades += res.parades;
  stats.bisous += res.pairs.length;
  for (const c of res.created) {
    if (c.special === 'rocket') stats.rockets++;
    if (c.special === 'bomb') stats.bombs++;
    if (c.special === 'whirl') stats.whirls++;
  }
}
