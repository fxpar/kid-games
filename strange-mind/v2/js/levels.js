// Niveaux de Strange Mind v2 : « les cubes qui roulent ».
//
// map : une chaîne par ligne (nord en haut)
//   .  sol        #  mur / buisson      (espace) vide
//   ~  eau : on n'y entre qu'avec le DAUPHIN sur le dessus ; dans l'eau, on nage (le cube ne roule plus)
//   *  glace : on glisse tout droit sans rouler (le dessus ne change pas)
//   @  manège : le cube s'y arrête et tourne d'un quart de tour (sens des aiguilles)
//   $  poisson doré (secret : 3e étoile)
// cubes  : [{ x, r, faces: [dessus, dessous, est, ouest, nord, sud], twin: indice, twinMode: 'mirror'|'same' }]
// houses : [{ x, r, g: dessin attendu sur le dessus, dir: 'N'|'E'|'S'|'W' (facultatif : où il doit regarder) }]
// par    : nombre minimal de coups (calculé par tools/solve.mjs)

const DICE = ['bunny', 'dolphin', 'bird', 'turtle', 'fish', 'ladybug'];
const DICE2 = ['ladybug', 'bunny', 'fish', 'bird', 'dolphin', 'turtle'];

export const WORLDS = [
  { name: 'Le Jardin', icon: '🌳', color: '#80c66a' },
  { name: 'Le Lagon', icon: '🌊', color: '#4ea8de' },
  { name: 'Les Manèges', icon: '🎠', color: '#ff9a2e' },
  { name: 'Les Jumeaux', icon: '👯', color: '#c77dff' },
];

export const LEVELS = [
  // ------------------------------------------------------------ Le Jardin
  {
    world: 0, name: 'Premier roulé',
    map: ['#######',
          '#.....#',
          '#######'],
    cubes: [{ x: 1, r: 1, faces: DICE }],
    houses: [{ x: 3, r: 1, g: 'dolphin' }],
  },
  {
    world: 0, name: 'Le détour',
    map: ['#######',
          '#.....#',
          '#.....#',
          '#.....#',
          '#######'],
    cubes: [{ x: 1, r: 2, faces: DICE }],
    houses: [{ x: 3, r: 2, g: 'bunny' }],
  },
  {
    world: 0, name: 'Regarde la mer',
    map: ['########~',
          '#......#~',
          '#......#~',
          '#...$..#~',
          '########~'],
    cubes: [{ x: 1, r: 1, faces: DICE }],
    houses: [{ x: 6, r: 2, g: 'dolphin', dir: 'E' }],
  },
  {
    world: 0, name: 'Le labyrinthe',
    map: ['#########',
          '#...#...#',
          '#.......#',
          '#..##...#',
          '#.......#',
          '#...$#..#',
          '#########'],
    cubes: [{ x: 1, r: 1, faces: DICE }],
    houses: [{ x: 7, r: 1, g: 'ladybug', dir: 'N' }],
  },
  {
    world: 0, name: 'Deux cubes',
    map: ['#######',
          '#.....#',
          '#.....#',
          '#.....#',
          '#######'],
    cubes: [{ x: 1, r: 1, faces: DICE }, { x: 5, r: 3, faces: DICE2 }],
    houses: [{ x: 5, r: 1, g: 'dolphin' }, { x: 1, r: 3, g: 'dolphin' }],
  },
  // ------------------------------------------------------------ Le Lagon
  {
    world: 1, name: 'La rivière',
    map: ['#########',
          '#..~~...#',
          '#..~~...#',
          '#..~~...#',
          '#########'],
    cubes: [{ x: 1, r: 2, faces: DICE }],
    houses: [{ x: 7, r: 2, g: 'bunny' }],
  },
  {
    world: 1, name: 'La patinoire',
    map: ['########',
          '#......#',
          '#.*$**.#',
          '#.****.#',
          '#.****.#',
          '#......#',
          '########'],
    cubes: [{ x: 1, r: 1, faces: DICE }],
    houses: [{ x: 6, r: 5, g: 'turtle', dir: 'E' }],
  },
  {
    world: 1, name: 'Le grand bain',
    map: ['#########',
          '#...~~~.#',
          '#.#.~.~.#',
          '#...~~~.#',
          '#.$.***.#',
          '#########'],
    cubes: [{ x: 1, r: 1, faces: DICE2 }],
    houses: [{ x: 5, r: 2, g: 'dolphin', dir: 'W' }],
  },
  // ------------------------------------------------------------ Les Manèges
  {
    world: 2, name: 'Le manège',
    map: ['#######',
          '#.....#',
          '#..@..#',
          '#.....#',
          '#######'],
    cubes: [{ x: 1, r: 1, faces: DICE }],
    houses: [{ x: 5, r: 3, g: 'dolphin', dir: 'S' }],
  },
  {
    world: 2, name: 'Fête foraine',
    map: ['#########',
          '#.@...@.#',
          '#.#####.#',
          '#...$...#',
          '#########'],
    cubes: [{ x: 1, r: 3, faces: DICE2 }],
    houses: [{ x: 7, r: 3, g: 'turtle', dir: 'W' }],
  },
  // ------------------------------------------------------------ Les Jumeaux
  {
    world: 3, name: 'Les jumeaux',
    map: ['#########',
          '#.......#',
          '#.......#',
          '#.......#',
          '#########'],
    cubes: [{ x: 3, r: 2, faces: DICE, twin: 1 }, { x: 5, r: 2, faces: DICE, twin: 0 }],
    houses: [{ x: 1, r: 1, g: 'bird' }, { x: 7, r: 1, g: 'turtle' }],
  },
  {
    world: 3, name: 'Le mur têtu',
    map: ['#########',
          '#.......#',
          '#.#...#.#',
          '#.......#',
          '#########'],
    cubes: [{ x: 1, r: 3, faces: DICE, twin: 1 }, { x: 5, r: 1, faces: DICE, twin: 0 }],
    houses: [{ x: 3, r: 1, g: 'dolphin' }, { x: 7, r: 3, g: 'dolphin' }],
  },
];
