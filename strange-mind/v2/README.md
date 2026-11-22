# Strange Mind v2 : les cubes qui roulent (prototype)

Jeu de réflexion. Chaque cube porte un animal sur chacune de ses 6 faces. **Glisser fait rouler le cube
d'une case** : il bascule vraiment, et l'animal du dessus change. Il faut amener chaque cube sur sa
**maison** avec **le bon animal sur le dessus**, parfois tourné dans le bon sens.

L'idée forte : **l'orientation du cube est la mémoire de son chemin.** Aller à droite puis en haut ne
donne pas le même dessus qu'aller en haut puis à droite. Arriver au bon endroit ne suffit pas.

Conception complète (et suite possible) : [DESIGN.md](DESIGN.md).

## Jouer

- Glisser (doigt, souris), défilement du pavé tactile, ou flèches du clavier : rouler.
- Toucher un cube pour le choisir (s'il y en a plusieurs), ou Tab.
- ↶ (ou Retour arrière, Ctrl+Z) annule, ↻ recommence, 💡 joue le meilleur coup.
- En haut, le petit patron du cube montre ses 6 faces : au centre le dessus, à droite le dessous.
- Étoiles : ★ réussi · ★★ presque le moins de coups possible · ★★★ le poisson doré 🐟 trouvé
  (ou, s'il n'y en a pas, le moins de coups possible).

## Les 4 mondes (12 niveaux)

| Monde | Règle nouvelle |
|---|---|
| 🌳 Le Jardin | rouler, maisons, sens de l'animal, deux cubes |
| 🌊 Le Lagon | l'eau : on n'y entre qu'avec le dauphin sur le dessus, et on y nage sans rouler · la glace : on glisse sans rouler |
| 🎠 Les Manèges | le manège fait tourner le cube d'un quart de tour sur place |
| 👯 Les Jumeaux | deux cubes bougent ensemble, en miroir ; un mur peut en bloquer un seul |

## Créer un niveau

Dans `js/levels.js` :

```js
{ world: 0, name: 'Mon niveau',
  map: ['#######',
        '#..~..#',      // .sol  #mur  ~eau  *glace  @manège  $poisson doré
        '#..@..#',
        '#######'],
  cubes: [{ x: 1, r: 1, faces: ['bunny', 'dolphin', 'bird', 'turtle', 'fish', 'ladybug'] }],
  //                         dessus   dessous    est     ouest     nord    sud
  houses: [{ x: 5, r: 2, g: 'dolphin', dir: 'E' }] }   // dir facultatif
```

Jumeaux : `twin: <indice de l'autre cube>` sur les deux cubes (`twinMode: 'same'` pour qu'ils
bougent dans le même sens).

Outils (Node) :
- `node tools/solve.mjs` : vérifie que chaque niveau est faisable et donne le nombre minimal de coups.
- `node tools/explore.mjs <niveau> <x> <r>` : liste ce qu'on peut obtenir sur une case (dessin du
  dessus + sens) et en combien de coups. C'est pratique pour choisir une maison difficile mais faisable.

Le jeu calcule aussi lui-même le nombre minimal de coups au chargement du niveau.

## Code

```
js/cube.js     logique pure : roulades (matrices de rotation exactes), eau, glace, manège, jumeaux, solveur
js/levels.js   niveaux
js/game.js     rendu en vue plongeante (Canvas 2D), animations, gestes, annuler, indice
js/main.js     carte des mondes, HUD, patron du cube, sons, sauvegarde
js/glyphs.js   dessins des animaux
```

## Langues · Licence

Français et anglais : bouton **EN / FR** sur l’écran d’accueil, ou `?lang=en` dans l’adresse.
English version: **EN** button on the home screen, or add `?lang=en` to the address.

© 2026 François Parlant — [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.fr) (citer l’auteur · pas d’usage commercial · partage dans les mêmes conditions). Voir [LICENSE](../../LICENSE).
