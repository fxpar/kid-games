# Strange Mind v2 (prototype)

Un jeu « casual » à la Candy Crush, mais **on ne permute pas : on fait tourner** des carrés de 4
animaux. Chaque animal regarde dans une direction, et tourne avec le carré.

- Version guidée d'origine : [`../v1/`](v1/) (figée, pour la montrer).
- Conception : [`DESIGN.md`](DESIGN.md). Idées en réserve : [`idees/`](idees/).

## Lancer

- UwAmp : `http://localhost/kid-games/strange-mind/`
- Sans UwAmp : `node tools/serve.mjs` puis `http://localhost:8765/`
- Accès direct : `#3` (niveau 3), `#rush`, `#daily`.

Aucune dépendance (HTML + JavaScript + Canvas 2D). La progression est enregistrée dans le navigateur.

## Règles

- **Toucher** entre 4 animaux : le carré tourne d'un quart de tour ↻.
  **Glisser en rond**, **tourner à deux doigts** ou la **molette** choisissent le sens.
  Un tour qui n'aligne rien est annulé (et ne coûte pas de coup).
- **3 animaux pareils alignés** éclatent, ceux du dessus tombent, les cascades rapportent plus.
- **Parade** 🎺 : les animaux alignés regardent tous du même côté (points doublés).
  - 4 en parade → **fusée** 🚀 : vide la ligne (animal horizontal) ou la colonne (animal vertical).
  - 5 en parade → **tourbillon** 🌀 : éclate toute son espèce puis fait tourner tout le plateau.
  - L ou T → **bombe** 💥 (carré 3×3).
- **Bisou** 💋 : deux animaux pareils face à face éclatent.
- En fin de niveau, chaque coup restant devient une fusée (feu d'artifice).
- Après 5 s sans jouer, un carré jouable se met à bouger (indice).

## Modes

- **10 niveaux** (coups limités, objectif : collecter, glace, parades, fusées, tourbillon, score),
  3 étoiles chacun ; un niveau se débloque quand le précédent est réussi.
- **Rush 60 s** : chrono, tout s'accélère, les bonus créés rallongent un peu le temps. Record.
- **Défi du jour** : un Rush dont le plateau est le même pour tout le monde ce jour-là.

## Code

```
js/board.js      logique pure (rotation, alignements, bonus, chute) — sans DOM
js/levels.js     niveaux, objectifs
js/game.js       rendu, animations, gestes, déroulement d'une partie
js/glyphs.js     dessins des animaux
js/main.js       carte, HUD, sons, sauvegarde, Rush / Défi du jour
tools/simulate.mjs   un robot joue chaque niveau → taux de réussite et étoiles suggérées
tools/probe.mjs      statistiques par réglage de plateau
```

## Ajouter un niveau

Dans `js/levels.js` :

```js
{ name: 'Mon niveau', size: 7, species: 5, dirs: [0, 1], moves: 18,
  goal: { collect: { 0: 15, 3: 10 } }, stars: [0, 3000, 4500] }
```

`species` : nombre d'espèces (4 = facile, 5 = normal). `dirs` : sens dans lesquels arrivent
les animaux (`[0]` = tous vers la droite, parades faciles ; `[0,1,2,3]` = chaos).
Objectifs : `collect`, `ice: true` (+ `ice: ['..##..', …]`), `parades`, `rockets`, `whirls`, `score`.

Puis lancer `node tools/simulate.mjs` : il affiche le taux de réussite d'un robot et propose les seuils
d'étoiles.

## Langues · Licence

Français et anglais : bouton **EN / FR** sur l’écran d’accueil, ou `?lang=en` dans l’adresse.
English version: **EN** button on the home screen, or add `?lang=en` to the address.

© 2026 François Parlant — [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.fr) (citer l’auteur · pas d’usage commercial · partage dans les mêmes conditions). Voir [LICENSE](../../LICENSE).
