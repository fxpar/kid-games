// =====================================================================================
//  NIVEAUX DE STRANGE MIND
// =====================================================================================
// Un niveau = des formes + des étiquettes + des panneaux + une suite d'étapes.
//
//  shapes : [{ id, type:'cube'|'pyramid'|'octagon', pos:[x,y], faces:[...],
//              start:{front, dir}, tumble:'both'|'h'|'v'|'none', twist:bool,
//              twistDirs:[1,-1], twistStep:90|180…, hidden }]
//           faces : un dessin par face ('dolphin', 'bunny', 'cloud', 'arrow', 'mirror',
//                   'whirl', 'fish', 'ladybug' ou n'importe quel emoji)
//  labels : [{ pos:[x,y], text, cls }]          (×, +, crochets…)
//  panels : [{ ratio, draw(ctx, w, h, S, step) }]
//  steps  : [{ say, hint, bravo, setup(S), goal(S), fail(S), done(S), …données libres }]
//
//  S (état du jeu) : S.dir(id) angle 0/90/180/270… · S.glyph(id) dessin visible
//                    S.val(id) [re, im] · S.real(id) · S.shape(id) (twists, turnSum, history, startDir)
//                    S.set(id, face, dir) · S.lock(id, {...}) · S.show(id, bool) · S.mem (mémoire libre)
// =====================================================================================

import * as P from './panels.js';

const n360 = (d) => ((Math.round(d) % 360) + 360) % 360;

// ---- formes réutilisables ----
const WATER = '💧';
const dolphinCube = (id, pos, extra = {}) => ({
  id, type: 'cube', pos, tumble: 'none',
  faces: [{ g: 'dolphin', bg: '#cde7ff' }, WATER, WATER, WATER, WATER, WATER],
  ...extra,
});
/** Cube-nombre : lapin debout = +1, lapin tête en bas = −1, nuage = 0. */
const numberCube = (id, pos, front = 1) => ({
  id, type: 'cube', pos, tumble: 'h', twistStep: 180, start: { front },
  faces: [
    { g: 'bunny', bg: '#ffe0ea' }, { g: 'cloud', bg: '#d6ecff' },
    { g: 'bunny', bg: '#ffe0ea' }, { g: 'cloud', bg: '#d6ecff' },
    { g: 'cloud', bg: '#d6ecff' }, { g: 'cloud', bg: '#d6ecff' },
  ],
});
/** Comment dessiner la valeur d'un cube-nombre dans un panneau. */
const numberIcon = (S, id) => {
  const v = S.real(id);
  return v === 0 ? { g: 'cloud' } : { g: 'bunny', a: v > 0 ? 0 : 180 };
};
const matrix = (S) => [[S.real('a'), S.real('b')], [S.real('c'), S.real('d')]];
const same = (A, B) => A.every((r, i) => r.every((x, j) => x === B[i][j]));

// ---- panneaux réutilisables ----
const findPanel = {
  ratio: 1.6,
  draw(ctx, w, h, S, step) {
    const list = Array.isArray(step.find) ? step.find : [step.find];
    const ids = step.on || S.ids();
    P.find(ctx, w, h, list, list.map((g, i) => S.glyph(Array.isArray(ids) ? ids[i] ?? ids[0] : ids) === g));
  },
};
const compassPanel = {
  ratio: 1,
  draw(ctx, w, h, S, step) { P.compass(ctx, w, h, { dir: S.dir('A'), target: step.target }); },
};
/** Histoire des positions du dauphin depuis le début de l'étape. */
const historyPanel = {
  ratio: 2.4,
  draw(ctx, w, h, S, step) {
    const s = S.shape('A');
    const dirs = [s.startDir, ...s.history].slice(-6);
    const items = [];
    dirs.forEach((d, i) => { if (i) items.push('→'); items.push({ g: 'dolphin', a: d }); });
    items.push('  ');
    items.push({ target: { g: 'dolphin', a: step.target }, g: null, box: true, ok: S.dir('A') === step.target && step.goal(S) });
    P.row(ctx, w, h * 0.8, items, h * 0.42);
    const n = s.twists;
    P.text(ctx, '↺↻ ' + '●'.repeat(Math.min(n, 8)) + (step.count ? '○'.repeat(Math.max(0, step.count - n)) : ''), w / 2, h * 0.88, h * 0.13, '#7b2cbf');
  },
};

// =====================================================================================
export const LEVELS = [
  // ---------------------------------------------------------------- 1
  {
    id: 'cube', icon: '🟪', title: 'Le carré magique',
    concept: `<p><b>Idée :</b> une forme plate peut être l'ombre d'un objet en 3D. Le carré est la face d'un <b>cube</b> (6 faces).</p>
      <p>On découvre les deux gestes de base : <b>basculer</b> (glisser) et, plus tard, <b>tourner</b>. Chaque basculement est une rotation d'un quart de tour autour d'un axe horizontal ou vertical.</p>
      <p><i>À dire à l'enfant :</i> « Ce qu'on voit n'est qu'un côté de la chose. »</p>`,
    shapes: [{ id: 'A', type: 'cube', pos: [0, 0], twist: false, faces: ['🐱', '🦊', '🐸', '🐼', '🐻', '🐵'] }],
    panels: [findPanel],
    steps: [
      { say: 'Ce carré cache un secret ! Glisse dessus avec deux doigts pour le faire tourner. Trouve la grenouille 🐸', find: '🐸', goal: (S) => S.glyph('A') === '🐸', hint: 'Glisse deux fois dans le même sens.', bravo: 'Bravo ! Le carré était un cube !' },
      { say: 'Trouve maintenant le panda 🐼', find: '🐼', goal: (S) => S.glyph('A') === '🐼', hint: 'Glisse vers la droite ou vers la gauche.' },
      { say: 'Et l’ours 🐻 ? Il se cache sur le dessus…', find: '🐻', goal: (S) => S.glyph('A') === '🐻', hint: 'Glisse vers le bas pour voir le dessus du cube.' },
    ],
  },

  // ---------------------------------------------------------------- 2
  {
    id: 'solids', icon: '🔺', title: 'Triangle et octogone',
    concept: `<p>Le triangle est la face d'une <b>pyramide</b> (tétraèdre : 4 faces triangulaires). L'octogone est la face d'un <b>prisme</b> (2 octogones + 8 carrés = 10 faces).</p>
      <p>Chaque polygone a ses propres « pas » de rotation : 120° pour le triangle, 90° pour le carré, 45° pour l'octogone. Ce sont les <b>racines de l'unité</b> qu'on retrouvera aux niveaux 8 et suivants.</p>`,
    shapes: [
      { id: 'T', type: 'pyramid', pos: [-1.6, 0], twist: false, faces: ['🐥', '🐙', '🦋', '🐞'] },
      { id: 'O', type: 'octagon', pos: [1.6, 0], twist: false, faces: ['🌙', '☀️', '🍎', '🍌', '🍇', '🍓', '🍒', '🍍', '🥕', '🍉'] },
    ],
    panels: [findPanel],
    steps: [
      { say: 'Le triangle aussi est magique ! Trouve la pieuvre 🐙', find: '🐙', on: 'T', goal: (S) => S.glyph('T') === '🐙', hint: 'Glisse sur le triangle.', bravo: 'Le triangle était une pyramide !' },
      { say: 'Et l’octogone ? Trouve le soleil ☀️ qui se cache derrière la lune.', find: '☀️', on: 'O', goal: (S) => S.glyph('O') === '☀️', hint: 'Il faut glisser deux fois dans le même sens.' },
      { say: 'Montre en même temps la coccinelle 🐞 et la fraise 🍓', find: ['🐞', '🍓'], on: ['T', 'O'], goal: (S) => S.glyph('T') === '🐞' && S.glyph('O') === '🍓', hint: 'La fraise est sur un côté de l’octogone. Glisse doucement.' },
    ],
  },

  // ---------------------------------------------------------------- 3
  {
    id: 'turn', icon: '🐬', title: 'Le dauphin a faim',
    concept: `<p>On tourne maintenant <b>dans le plan</b> (boutons ↺ ↻ ou rotation à deux doigts). Le dauphin peut regarder dans 4 directions.</p>
      <p>Si « droite » vaut <b>1</b>, alors « haut » vaut <b>i</b>, « gauche » vaut <b>−1</b> et « bas » vaut <b>−i</b>. Un quart de tour dans le sens ↺, c'est <b>multiplier par i</b>.</p>
      <p>L'enfant n'a pas besoin du mot : il construit l'image mentale « un nombre peut être une direction ».</p>`,
    shapes: [dolphinCube('A', [0, 0], { start: { dir: 90 } })],
    panels: [compassPanel],
    steps: [
      { say: 'Le dauphin a faim ! Tourne-le vers le poisson 🐟 (bouton ↺ ou ↻, ou tourne avec deux doigts)', target: 0, goal: (S) => S.dir('A') === 0, hint: 'Essaie la flèche ↻.' },
      { say: 'Oh, le poisson est parti en bas !', target: 270, goal: (S) => S.dir('A') === 270 },
      { say: 'Maintenant il est à gauche !', target: 180, goal: (S) => S.dir('A') === 180 },
      { say: 'Et le dernier poisson est en haut !', target: 90, goal: (S) => S.dir('A') === 90, bravo: 'Miam ! Le dauphin connaît les 4 directions.' },
    ],
  },

  // ---------------------------------------------------------------- 4
  {
    id: 'isquare', icon: '🔄', title: 'Deux petits tours',
    concept: `<p>Un quart de tour = ×<b>i</b>. Deux quarts de tour dans le même sens = un demi-tour = ×<b>(−1)</b>. Donc <b>i × i = −1</b> : le fameux nombre « impossible » devient un geste banal.</p>
      <p>Quatre quarts de tour ramènent au départ : <b>i⁴ = 1</b>. Le panneau montre l'histoire des positions (i, i², i³, i⁴).</p>`,
    shapes: [dolphinCube('A', [0, 0])],
    panels: [historyPanel],
    steps: [
      { say: 'Fais faire demi-tour au dauphin en exactement 2 petits tours.', target: 180, count: 2,
        goal: (S) => S.dir('A') === 180 && S.shape('A').twists === 2,
        fail: (S) => S.shape('A').twists >= 2, hint: 'Deux fois la même flèche !', bravo: 'Deux petits tours, c’est un demi-tour !' },
      { say: 'Maintenant fais 4 petits tours, toujours dans le même sens. Où va le dauphin ?', target: 0, count: 4,
        setup: (S) => S.set('A', 0, 0),
        goal: (S) => S.shape('A').twists === 4 && Math.abs(S.shape('A').turnSum) === 4,
        fail: (S) => S.shape('A').twists >= 4 || Math.abs(S.shape('A').turnSum) < S.shape('A').twists,
        hint: 'Toujours la même flèche, 4 fois.', bravo: 'Il est revenu au début ! 4 petits tours = rien du tout.' },
    ],
  },

  // ---------------------------------------------------------------- 5
  {
    id: 'minusi', icon: '↩️', title: 'Le tour à l’envers',
    concept: `<p>Tourner 3 fois dans un sens revient au même que tourner 1 fois dans l'autre : <b>i³ = −i</b>, et <b>−i</b> est l'<b>inverse</b> de i (i × (−i) = 1).</p>
      <p>Première rencontre avec l'idée d'<b>inverse</b> et de <b>chemins équivalents</b> : deux suites de gestes différentes donnent le même résultat.</p>`,
    shapes: [dolphinCube('A', [0, 0], { twistDirs: [1] })],
    panels: [historyPanel],
    steps: [
      { say: 'Ce dauphin ne sait tourner que dans un sens ↺. Fais-le regarder vers le bas ⬇️', target: 270,
        goal: (S) => S.dir('A') === 270, hint: 'Il faut 3 petits tours.', bravo: '3 tours dans un sens…' },
      { say: '…ou bien 1 seul tour dans l’autre sens ! Avec ↻, fais-le regarder en bas en 1 seul tour.', target: 270, count: 1,
        setup: (S) => { S.lock('A', { twistDirs: [1, -1] }); S.set('A', 0, 0); },
        goal: (S) => S.dir('A') === 270 && S.shape('A').twists === 1,
        fail: (S) => S.shape('A').twists >= 1, hint: 'Utilise la flèche ↻.', bravo: 'Les deux chemins arrivent au même endroit !' },
    ],
  },

  // ---------------------------------------------------------------- 6
  {
    id: 'bunnies', icon: '🐰', title: 'Lapins debout, lapins tête en bas',
    concept: `<p>Les valeurs <b>1, 0, −1</b> deviennent des animaux : lapin debout = <b>+1</b>, nuage = <b>0</b>, lapin tête en bas = <b>−1</b>.</p>
      <p>Point clé : <b>−1 n'est pas un autre animal, c'est le même retourné d'un demi-tour</b>. C'est exactement la vision géométrique des nombres négatifs (−1 = rotation de 180°) qui prépare i (rotation de 90°).</p>
      <p>Dernière étape : 0 sans nuage → deux opposés s'annulent (1 + (−1) = 0).</p>`,
    shapes: [numberCube('w', [-4.5, 0]), numberCube('x', [-1.5, 0]), numberCube('y', [1.5, 0]), numberCube('z', [4.5, 0])],
    labels: [{ pos: [-3, 0], text: '+' }, { pos: [0, 0], text: '+' }, { pos: [3, 0], text: '+' }],
    panels: [{
      ratio: 2.6,
      draw(ctx, w, h, S, step) {
        const ids = ['w', 'x', 'y', 'z'];
        const sum = ids.reduce((s, id) => s + S.real(id), 0);
        const items = [];
        ids.forEach((id, i) => { if (i) items.push('+'); items.push(numberIcon(S, id)); });
        P.row(ctx, w, h * 0.5, items, h * 0.24);
        P.numberLine(ctx, w, h, { value: sum, target: step.target, y: h * 0.7 });
        if (step.goal(S)) P.check(ctx, w - h * 0.12, h * 0.14, h * 0.09);
      },
    }],
    steps: [
      { say: 'Un lapin debout vaut un, un nuage vaut zéro. Amène la coccinelle sur le drapeau : il faut 2 !', target: 2,
        goal: (S) => ['w', 'x', 'y', 'z'].reduce((s, id) => s + S.real(id), 0) === 2, hint: 'Glisse sur les cubes pour faire apparaître des lapins.' },
      { say: 'Un lapin la tête en bas vaut moins un ! Fais moins trois.', target: -3,
        goal: (S) => ['w', 'x', 'y', 'z'].reduce((s, id) => s + S.real(id), 0) === -3, hint: 'Retourne les lapins avec ↻.' },
      { say: 'Défi : fais zéro… sans aucun nuage !', target: 0,
        goal: (S) => ['w', 'x', 'y', 'z'].every((id) => S.glyph(id) === 'bunny') && ['w', 'x', 'y', 'z'].reduce((s, id) => s + S.real(id), 0) === 0,
        hint: 'Un lapin debout et un lapin tête en bas… s’annulent !', bravo: 'Un debout + un tête en bas = rien du tout !' },
    ],
  },

  // ---------------------------------------------------------------- 7
  {
    id: 'multiply', icon: '✖️', title: 'La machine à tourner',
    concept: `<p>La machine <b>multiplie</b> deux directions : elle <b>additionne les angles</b>. C'est la multiplication des nombres complexes de module 1 : e<sup>iα</sup> × e<sup>iβ</sup> = e<sup>i(α+β)</sup>.</p>
      <p>Étape 1 : trouver l'<b>inverse</b> (i × (−i) = 1). Étape 2 : deux solutions symétriques de x² = −1 (i et −i). Étape 3 : résoudre (−i) × ? = i.</p>`,
    shapes: [dolphinCube('A', [-1.9, 0]), dolphinCube('B', [1.9, 0])],
    labels: [{ pos: [0, 0], text: '×' }],
    panels: [{
      ratio: 2.6,
      draw(ctx, w, h, S, step) {
        const r = n360(S.dir('A') + S.dir('B'));
        P.row(ctx, w, h, [
          { g: 'dolphin', a: S.dir('A') }, '×', { g: 'dolphin', a: S.dir('B') }, '=',
          { g: 'dolphin', a: r, big: true, box: true, target: { g: 'dolphin', a: step.target }, ok: step.goal(S) },
        ]);
      },
    }],
    steps: [
      { say: 'La machine mélange les deux dauphins. Le dauphin A regarde en haut. Tourne B pour que la machine donne un dauphin vers la droite ➡️', target: 0,
        setup: (S) => { S.set('A', 0, 90); S.set('B', 0, 0); S.lock('A', { twist: false }); },
        goal: (S) => n360(S.dir('A') + S.dir('B')) === 0, hint: 'B doit faire le tour dans l’autre sens : vers le bas.', bravo: 'Haut et bas s’annulent !' },
      { say: 'Maintenant A et B doivent regarder du même côté, et la machine doit montrer le dauphin à gauche ⬅️', target: 180,
        setup: (S) => S.lock('A', { twist: true }),
        goal: (S) => S.dir('A') === S.dir('B') && n360(S.dir('A') + S.dir('B')) === 180, hint: 'Les deux en haut… ou les deux en bas !' },
      { say: 'A regarde en bas ⬇️. Trouve B pour que la machine montre le dauphin en haut ⬆️', target: 90,
        goal: (S) => S.dir('A') === 270 && n360(S.dir('A') + S.dir('B')) === 90, hint: 'Mets d’abord A en bas.' },
    ],
  },

  // ---------------------------------------------------------------- 8
  {
    id: 'roots', icon: '🛑', title: 'La racine magique',
    concept: `<p>L'octogone tourne par <b>huitièmes de tour</b> (45°). La machine fait « A × A » : elle double l'angle.</p>
      <p>Étape 1 : quel dauphin, multiplié par lui-même, donne <b>i</b> (haut) ? Réponse : 45° (ou 225°) : c'est <b>√i</b>.</p>
      <p>Étapes 2 et 3 : x² = −1 a <b>deux</b> solutions, i et −i. Une équation peut avoir plusieurs réponses !</p>`,
    shapes: [{ id: 'A', type: 'octagon', pos: [0, 0], tumble: 'none', faces: [{ g: 'dolphin', bg: '#cde7ff' }, WATER, ...Array(8).fill(WATER)] }],
    panels: [{
      ratio: 2.6,
      draw(ctx, w, h, S, step) {
        const a = S.dir('A');
        P.row(ctx, w, h, [
          { g: 'dolphin', a }, '×', { g: 'dolphin', a }, '=',
          { g: 'dolphin', a: n360(2 * a), big: true, box: true, target: { g: 'dolphin', a: step.target }, ok: step.goal(S) },
        ]);
      },
    }],
    steps: [
      { say: 'L’octogone tourne par tout petits pas. La machine multiplie le dauphin par lui-même. Fais sortir un dauphin qui regarde en haut ⬆️', target: 90,
        goal: (S) => n360(2 * S.dir('A')) === 90, hint: 'Un seul petit pas ↺ suffit !', bravo: 'Un demi-pas, deux fois, ça fait un pas entier !' },
      { say: 'Maintenant la machine doit montrer le dauphin à gauche ⬅️', target: 180,
        goal: (S) => n360(2 * S.dir('A')) === 180, done: (S) => { S.mem.first = S.dir('A'); } },
      { say: 'Il y a une autre réponse ! Trouve un autre dauphin qui donne aussi la gauche ⬅️', target: 180,
        goal: (S) => n360(2 * S.dir('A')) === 180 && S.dir('A') !== S.mem.first, hint: 'Essaie le dauphin qui regarde dans l’autre sens.', bravo: 'Deux réponses pour une seule question !' },
    ],
  },

  // ---------------------------------------------------------------- 9
  {
    id: 'matrix', icon: '🔢', title: 'La grille qui transforme',
    concept: `<p>Quatre cubes-nombres forment une <b>matrice 2×2</b> [[a, b], [c, d]]. La matrice transforme le jardin : la flèche rouge (→) va en (a, c), la flèche bleue (↑) va en (b, d).</p>
      <p>On cherche : l'<b>identité</b> [[1,0],[0,1]], le <b>miroir</b> [[−1,0],[0,1]], le <b>quart de tour</b> [[0,−1],[1,0]] et le <b>demi-tour</b> [[−1,0],[0,−1]].</p>
      <p>Remarque d'adulte : le quart de tour au carré donne le demi-tour = −1 : la matrice [[0,−1],[1,0]] <b>est</b> le nombre i.</p>`,
    shapes: [numberCube('a', [-1.6, 1.6]), numberCube('b', [1.6, 1.6]), numberCube('c', [-1.6, -1.6]), numberCube('d', [1.6, -1.6])],
    labels: [{ pos: [-3.3, 0], text: '[', cls: 'bracket' }, { pos: [3.3, 0], text: ']', cls: 'bracket' }],
    panels: [{
      ratio: 1,
      draw(ctx, w, h, S, step) {
        P.garden(ctx, w, h, { M: matrix(S), T: step.T });
        if (step.goal(S)) P.check(ctx, w - h * 0.1, h * 0.1, h * 0.07);
      },
    }],
    steps: [
      { say: 'Le jardin a disparu ! Chaque cube est un nombre. Fais revenir le jardin comme le modèle en pointillés.', T: [[1, 0], [0, 1]],
        goal: (S) => same(matrix(S), [[1, 0], [0, 1]]), hint: 'Un lapin debout en haut à gauche, un en bas à droite.', bravo: 'Le jardin est revenu !' },
      { say: 'Maintenant, montre le jardin dans un miroir 🪞 : la maison doit passer de l’autre côté.', T: [[-1, 0], [0, 1]],
        goal: (S) => same(matrix(S), [[-1, 0], [0, 1]]), hint: 'Retourne le lapin en haut à gauche.' },
      { say: 'Fais faire un quart de tour au jardin ↺', T: [[0, -1], [1, 0]],
        goal: (S) => same(matrix(S), [[0, -1], [1, 0]]), hint: 'Les lapins vont dans les autres cases. Regarde où vont les flèches rouge et bleue.' },
      { say: 'Et maintenant, mets le jardin la tête en bas !', T: [[-1, 0], [0, -1]],
        goal: (S) => same(matrix(S), [[-1, 0], [0, -1]]), hint: 'Deux lapins tête en bas.', bravo: 'Tête en bas = deux quarts de tour !' },
    ],
  },

  // ---------------------------------------------------------------- 10
  {
    id: 'det', icon: '🏡', title: 'Le jardin qui disparaît',
    concept: `<p>Le <b>déterminant</b> ad − bc est la <b>taille du jardin</b> transformé, avec un signe : positif si le jardin est « à l'endroit », négatif s'il est vu dans un miroir, nul s'il est écrasé en une ligne.</p>
      <p>L'enfant découvre qu'on peut écraser le jardin sans que tout soit nul (matrice non nulle mais déterminant 0), puis doubler sa taille, puis le doubler en miroir.</p>`,
    shapes: [numberCube('a', [-1.6, 1.6], 0), numberCube('b', [1.6, 1.6]), numberCube('c', [-1.6, -1.6]), numberCube('d', [1.6, -1.6], 0)],
    labels: [{ pos: [-3.3, 0], text: '[', cls: 'bracket' }, { pos: [3.3, 0], text: ']', cls: 'bracket' }],
    panels: [{
      ratio: 1.35,
      draw(ctx, w, h, S, step) {
        const M = matrix(S), d = P.det2(M);
        P.garden(ctx, h, h, { M });
        P.detBadge(ctx, h + (w - h) / 2, h * 0.3, (w - h) * 0.4, d);
        P.text(ctx, '🎯', h + (w - h) / 2, h * 0.58, h * 0.1);
        P.detBadge(ctx, h + (w - h) / 2, h * 0.76, (w - h) * 0.32, step.det);
        if (step.goal(S)) P.check(ctx, w - h * 0.08, h * 0.08, h * 0.06);
      },
    }],
    steps: [
      { say: 'Écrase le jardin pour qu’il devienne tout plat… mais sans mettre que des nuages !', det: 0,
        goal: (S) => P.det2(matrix(S)) === 0 && matrix(S).flat().some((x) => x !== 0), hint: 'Mets quatre lapins debout !', bravo: 'Pschitt ! Le jardin est tout plat.' },
      { say: 'Maintenant fais un jardin deux fois plus grand !', det: 2,
        goal: (S) => P.det2(matrix(S)) === 2, hint: 'Quatre lapins, et un seul tête en bas.' },
      { say: 'Et un jardin deux fois plus grand… dans le miroir 🪞 !', det: -2,
        goal: (S) => P.det2(matrix(S)) === -2, hint: 'Quatre lapins : retourne-en un ou deux, et regarde la pastille.', bravo: 'Le signe dit si on est dans le miroir !' },
    ],
  },

  // ---------------------------------------------------------------- 11
  {
    id: 'mirrors', icon: '🪞', title: 'Deux miroirs font un tour',
    concept: `<p>Cœur de l'<b>algèbre géométrique de Hestenes</b> : une <b>réflexion</b> (miroir) est l'opération de base. Un miroir retourne le dauphin (ventre en l'air).</p>
      <p><b>Deux miroirs successifs = une rotation</b>, d'un angle <b>double</b> de l'angle entre les miroirs. En algèbre géométrique, un vecteur unitaire <i>a</i> agit comme miroir (x ↦ −a x a) et le produit <i>ba</i> est un <b>rotor</b> qui tourne de 2θ.</p>
      <p>C'est aussi pourquoi les octogones (pas de 45°) suffisent à produire des quarts de tour.</p>`,
    shapes: [
      { id: 'M1', type: 'octagon', pos: [-1.9, 0], tumble: 'none', faces: [{ g: 'mirror', bg: '#eef3ff' }, '✨', ...Array(8).fill('✨')] },
      { id: 'M2', type: 'octagon', pos: [1.9, 0], tumble: 'none', faces: [{ g: 'mirror', bg: '#fff3e6' }, '✨', ...Array(8).fill('✨')] },
    ],
    panels: [{
      ratio: 3.2,
      draw(ctx, w, h, S, step) {
        const a = S.dir('M1') % 180, b = S.dir('M2') % 180;
        const d1 = n360(2 * a), d2 = n360(2 * b - d1);
        const two = !S.shape('M2').hidden;
        const items = [{ g: 'dolphin', a: 0 }, '→', { g: 'mirror', a }, '→'];
        if (two) items.push({ g: 'dolphin', a: d1, m: true }, '→', { g: 'mirror', a: b }, '→',
          { g: 'dolphin', a: d2, big: true, box: true, target: { g: 'dolphin', a: step.target }, ok: step.goal(S) });
        else items.push({ g: 'dolphin', a: d1, m: true, big: true, box: true, target: { g: 'dolphin', a: step.target, m: true }, ok: step.goal(S) });
        P.row(ctx, w, h, items);
      },
    }],
    steps: [
      { say: 'Le dauphin nage vers un miroir magique. Tourne le miroir pour que son reflet regarde en haut ⬆️', target: 90,
        setup: (S) => S.show('M2', false),
        goal: (S) => n360(2 * (S.dir('M1') % 180)) === 90, hint: 'Un seul petit pas ↺ du miroir.', bravo: 'Il regarde en haut… mais il a le ventre en l’air !' },
      { say: 'Un deuxième miroir ! Fais que le dauphin final regarde en haut ⬆️, et à l’endroit.', target: 90,
        setup: (S) => S.show('M2', true),
        goal: (S) => { const d1 = n360(2 * (S.dir('M1') % 180)); return n360(2 * (S.dir('M2') % 180) - d1) === 90; },
        hint: 'Les deux miroirs doivent être un petit peu penchés l’un par rapport à l’autre.', bravo: 'Deux miroirs = un tour, et le dauphin est remis à l’endroit !' },
      { say: 'Avec les deux miroirs, fais nager le dauphin vers la gauche ⬅️', target: 180,
        goal: (S) => { const d1 = n360(2 * (S.dir('M1') % 180)); return n360(2 * (S.dir('M2') % 180) - d1) === 180; },
        hint: 'Mets un miroir couché et l’autre debout.', bravo: 'Miroirs en croix = demi-tour !' },
    ],
  },

  // ---------------------------------------------------------------- 12
  {
    id: 'bivector', icon: '🌀', title: 'Le tourbillon secret',
    concept: `<p>Le <b>produit géométrique</b> de deux flèches (vecteurs) ab = a·b (partie « nombre ») + a∧b (partie « plan orienté », le <b>bivecteur</b>).</p>
      <p>Même direction → <b>+1</b> (lapin debout) ; directions opposées → <b>−1</b> (tête en bas) ; perpendiculaires → un <b>tourbillon</b> : le plan orienté e₁e₂, qui tourne dans un sens ou dans l'autre.</p>
      <p>L'ordre compte : <b>e₁e₂ = −e₂e₁</b>. Et ce tourbillon vérifie (e₁e₂)² = −1 : c'est le « i » de Hestenes, qui n'est plus mystérieux mais un <b>morceau de plan qui tourne</b>.</p>`,
    shapes: [
      { id: 'A', type: 'cube', pos: [-1.9, 0], tumble: 'none', start: { dir: 0 }, faces: [{ g: 'arrow', bg: '#ffe0ea' }, '⭐', '⭐', '⭐', '⭐', '⭐'] },
      { id: 'B', type: 'cube', pos: [1.9, 0], tumble: 'none', start: { dir: 180 }, faces: [{ g: 'arrowGreen', bg: '#dff5e3' }, '⭐', '⭐', '⭐', '⭐', '⭐'] },
    ],
    labels: [{ pos: [0, 0], text: '×' }],
    panels: [{
      ratio: 2.6,
      draw(ctx, w, h, S, step) {
        const res = (d) => ({ 0: { g: 'bunny', a: 0 }, 180: { g: 'bunny', a: 180 }, 90: { g: 'whirl' }, 270: { g: 'whirl', m: true } }[d]);
        const r = res(n360(S.dir('B') - S.dir('A')));
        P.row(ctx, w, h, [
          { g: 'arrow', a: S.dir('A') }, '×', { g: 'arrowGreen', a: S.dir('B') }, '=',
          { ...r, big: true, box: true, target: res(step.diff), ok: step.goal(S) },
        ]);
      },
    }],
    steps: [
      { say: 'Quand on multiplie deux flèches, il se passe des choses étranges ! Fais apparaître un lapin debout.', diff: 0,
        goal: (S) => n360(S.dir('B') - S.dir('A')) === 0, hint: 'Les deux flèches doivent regarder du même côté.' },
      { say: 'Maintenant fais apparaître le tourbillon qui tourne comme ça ↺', diff: 90,
        goal: (S) => n360(S.dir('B') - S.dir('A')) === 90, hint: 'Les flèches doivent faire un coin, comme un L.', bravo: 'Un tourbillon ! Deux flèches en coin font tourner un plan.' },
      { say: 'Mets la flèche rose vers le haut ⬆️ et la verte vers la droite ➡️. Regarde le tourbillon !', diff: 270,
        goal: (S) => S.dir('A') === 90 && S.dir('B') === 0, hint: 'Rose en haut, verte à droite.', bravo: 'Il tourne à l’envers ! L’ordre des flèches compte.' },
      { say: 'La flèche rose regarde à gauche ⬅️. Trouve la verte pour refaire le tourbillon ↺', diff: 90,
        goal: (S) => S.dir('A') === 180 && n360(S.dir('B') - S.dir('A')) === 90, hint: 'Mets d’abord la rose à gauche.', bravo: 'Tu as dompté le tourbillon secret !' },
    ],
  },
];

// ---- bac à sable : base pour créer de nouveaux niveaux ----
export const SANDBOX = {
  id: 'sandbox', icon: '🧪', title: 'Bac à sable',
  concept: `<p>Toutes les formes, sans objectif. Sert à tester les gestes et à imaginer de nouveaux niveaux (voir <code>js/levels.js</code> et le README).</p>`,
  shapes: [
    { id: 'A', type: 'cube', pos: [-3.2, 0], faces: ['dolphin', 'bunny', 'arrow', 'cloud', 'whirl', 'mirror'] },
    { id: 'B', type: 'pyramid', pos: [0, 0], faces: ['dolphin', '🐙', '🦋', '🐞'] },
    { id: 'C', type: 'octagon', pos: [3.2, 0], faces: ['dolphin', '☀️', '🍎', '🍌', '🍇', '🍓', '🍒', '🍍', '🥕', '🍉'] },
  ],
  panels: [],
  steps: [{ say: 'Joue librement avec les formes !', goal: () => false }],
};
